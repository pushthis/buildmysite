import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MAX_FOLDER_BYTES = 20 * 1024;
const MAX_NAME_LEN = 40;
const MAX_LOCATION_LEN = 80;
const ALLOWED_FILES = new Set(['page.html', 'meta.json']);
const CONTRIBUTIONS_PREFIX = 'contributions/';

const bannedWords = JSON.parse(
  await fs.readFile(path.join(__dirname, 'banned-words.json'), 'utf8')
);

function fail(message) {
  console.error(`VALIDATION FAILED: ${message}`);
  process.exit(1);
}

function getDiffFiles() {
  const baseRef = process.env.GITHUB_BASE_REF || 'main';

  let diffOutput;
  try {
    diffOutput = execSync(`git diff --name-status origin/${baseRef}...HEAD`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
  } catch {
    try {
      diffOutput = execSync('git diff --name-status HEAD~1 HEAD', {
        cwd: ROOT,
        encoding: 'utf8',
      });
    } catch {
      return [];
    }
  }

  const files = [];
  for (const line of diffOutput.trim().split('\n').filter(Boolean)) {
    const match = line.match(/^([AMDRT])\t(.+)$/);
    if (match) {
      files.push({ status: match[1], path: match[2] });
    }
  }
  return files;
}

function parseContributionPath(filePath) {
  if (!filePath.startsWith(CONTRIBUTIONS_PREFIX)) return null;
  const rest = filePath.slice(CONTRIBUTIONS_PREFIX.length);
  const slash = rest.indexOf('/');
  if (slash === -1) return null;
  return {
    slug: rest.slice(0, slash),
    filename: rest.slice(slash + 1),
  };
}

async function checkRateLimit() {
  const token = process.env.GITHUB_TOKEN;
  const author = process.env.GITHUB_ACTOR;
  if (!token || !author) return;

  const since = new Date(Date.now() - 60_000).toISOString();
  const query = `query($owner:String!, $repo:String!, $since:DateTime!) {
    repository(owner:$owner, name:$repo) {
      pullRequests(states:MERGED, orderBy:{field:UPDATED_AT,direction:DESC}, first:20) {
        nodes { author { login } mergedAt }
      }
    }
  }`;

  const owner = process.env.GITHUB_REPOSITORY?.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (!owner || !repo) return;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { owner, repo, since } }),
    });

    if (!res.ok) return;
    const data = await res.json();
    const prs = data?.data?.repository?.pullRequests?.nodes || [];
    const recentByAuthor = prs.filter(
      (pr) =>
        pr.author?.login === author &&
        pr.mergedAt &&
        new Date(pr.mergedAt) > new Date(since)
    );
    if (recentByAuthor.length >= 1) {
      fail(`Rate limit: ${author} already merged a PR in the last 60 seconds. Please wait.`);
    }
  } catch {
    // Non-fatal if API unavailable
  }
}

function validatePathRules(files) {
  const slugs = new Set();

  for (const { path: filePath, status } of files) {
    if (status === 'D') continue;

    const parsed = parseContributionPath(filePath);
    if (!parsed) {
      fail(`File outside contributions/: ${filePath}`);
    }

    slugs.add(parsed.slug);

    if (!SLUG_RE.test(parsed.slug)) {
      fail(`Invalid folder name "${parsed.slug}". Use lowercase letters, numbers, and hyphens (max 40 chars).`);
    }

    if (!ALLOWED_FILES.has(parsed.filename)) {
      fail(`Disallowed file: ${filePath}. Only page.html and meta.json are permitted.`);
    }
  }

  if (slugs.size > 1) {
    fail('Each PR may only modify one contributor folder.');
  }

  if (slugs.size === 0) {
    fail('No contribution files found in this PR.');
  }

  return [...slugs][0];
}

async function validateFolderSize(slug) {
  const dir = path.join(ROOT, CONTRIBUTIONS_PREFIX, slug);
  let total = 0;

  for (const filename of ALLOWED_FILES) {
    try {
      const stat = await fs.stat(path.join(dir, filename));
      total += stat.size;
    } catch {
      fail(`Missing required file in contributions/${slug}/`);
    }
  }

  if (total > MAX_FOLDER_BYTES) {
    fail(`Contribution folder exceeds ${MAX_FOLDER_BYTES / 1024}KB limit (${total} bytes).`);
  }
}

function validatePageHtml(content, slug) {
  const lower = content.toLowerCase();

  const blockedTags = ['<script', '<iframe', '<object', '<embed', '<link rel="import"'];
  for (const tag of blockedTags) {
    if (lower.includes(tag)) {
      fail(`page.html in ${slug} contains disallowed tag: ${tag}`);
    }
  }

  if (/<link[^>]+rel\s*=\s*["']?import/i.test(content)) {
    fail(`page.html in ${slug} contains disallowed link rel=import`);
  }

  if (/\bon\w+\s*=/i.test(content)) {
    fail(`page.html in ${slug} contains inline event handlers`);
  }

  if (/javascript\s*:/i.test(content)) {
    fail(`page.html in ${slug} contains javascript: URL`);
  }

  if (/<style[^>]*>[\s\S]*?expression\s*\(/i.test(content)) {
    fail(`page.html in ${slug} contains CSS expression()`);
  }

  const externalPatterns = [
    /\bfetch\s*\(/i,
    /@import\s+url\s*\(\s*["']?https?:/i,
    /<link[^>]+href\s*=\s*["']https?:/i,
    /url\s*\(\s*["']?https?:/i,
    /src\s*=\s*["']https?:/i,
    /href\s*=\s*["']https?:/i,
  ];

  for (const pattern of externalPatterns) {
    if (pattern.test(content)) {
      fail(`page.html in ${slug} loads external resources (not allowed)`);
    }
  }

  for (const word of bannedWords) {
    if (content.toLowerCase().includes(word.toLowerCase())) {
      fail(`page.html in ${slug} contains banned word: ${word}`);
    }
  }
}

function validateMetaJson(content, slug) {
  let meta;
  try {
    meta = JSON.parse(content);
  } catch {
    fail(`meta.json in ${slug} is not valid JSON`);
  }

  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    fail(`meta.json in ${slug} must be a JSON object`);
  }

  const keys = Object.keys(meta);
  const allowedKeys = new Set(['name', 'location']);
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      fail(`meta.json in ${slug} has disallowed field: ${key}`);
    }
  }

  if (typeof meta.name !== 'string' || !meta.name.trim()) {
    fail(`meta.json in ${slug} requires a "name" string`);
  }

  if (meta.name.length > MAX_NAME_LEN) {
    fail(`meta.json name exceeds ${MAX_NAME_LEN} characters`);
  }

  if (meta.name !== slug) {
    fail(`meta.json name "${meta.name}" must match folder name "${slug}"`);
  }

  if (meta.location !== undefined) {
    if (typeof meta.location !== 'string') {
      fail(`meta.json location must be a string`);
    }
    if (meta.location.length > MAX_LOCATION_LEN) {
      fail(`meta.json location exceeds ${MAX_LOCATION_LEN} characters`);
    }
  }

  const serialized = JSON.stringify(meta);
  for (const word of bannedWords) {
    if (serialized.toLowerCase().includes(word.toLowerCase())) {
      fail(`meta.json in ${slug} contains banned word: ${word}`);
    }
  }
}

async function main() {
  console.log('Validating PR…');
  await checkRateLimit();

  const files = getDiffFiles();
  console.log(`Changed files: ${files.map((f) => f.path).join(', ') || '(none)'}`);

  const slug = validatePathRules(files);
  await validateFolderSize(slug);

  const pagePath = path.join(ROOT, CONTRIBUTIONS_PREFIX, slug, 'page.html');
  const metaPath = path.join(ROOT, CONTRIBUTIONS_PREFIX, slug, 'meta.json');

  const pageHtml = await fs.readFile(pagePath, 'utf8');
  const metaJson = await fs.readFile(metaPath, 'utf8');

  validatePageHtml(pageHtml, slug);
  validateMetaJson(metaJson, slug);

  console.log(`Validation passed for contributions/${slug}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
