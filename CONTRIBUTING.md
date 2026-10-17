# How to Contribute

**Live site:** [pushthis.github.io/buildmysite](https://pushthis.github.io/buildmysite)

Anyone can add their own page — no coding experience needed. Full overview is in the [README](README.md); this is the quick reference.

## Steps

1. **Fork** this repo on GitHub.
2. Create a folder: `contributions/your-name/` (lowercase, numbers, hyphens only).
3. Add these two files:

### meta.json

```json
{
  "name": "your-name",
  "location": "City, Country"
}
```

- `name` (required) — must match your folder name exactly
- `location` (optional) — free text. Add it if you want a pin on the map

### page.html

Your page content. Start from this if you want:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>your-name</title>
</head>
<body>
  <h1>Hello!</h1>
  <p>Your content here.</p>
</body>
</html>
```

4. **Open a Pull Request** to `main`.
5. Wait for the **validate-pr** check to pass — the bot merges it automatically.

Your page should be live within about a minute.

## Allowed

- Headings, paragraphs, lists, tables
- Basic HTML tags (`<b>`, `<i>`, `<em>`, etc.)
- Images as **data URIs** only (embedded in the HTML)

## Not allowed

- JavaScript (`<script>`, `onclick=`, `javascript:` URLs, etc.)
- External resources (no `https://` images, fonts, stylesheets, or links)
- `<iframe>`, `<style>`, `<object>`, `<embed>`
- Any files besides `page.html` and `meta.json`
- More than **20 KB** per folder
- Editing someone else's folder — one contribution per PR

## Tips

- Pick a **unique folder name** before you start
- Keep it friendly
- No location in `meta.json` = no map pin, but you still appear in Explore

## Something went wrong?

Check the error message on your PR. Common fixes:
- Folder name doesn't match `"name"` in `meta.json`
- Accidentally included a `<script>` tag or external URL
- Folder is too big (keep it under 20 KB)

Open a GitHub issue if you're stuck.

Happy building!
