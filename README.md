# Build My Site

**Live site:** [pushthis.github.io/buildmysite](https://pushthis.github.io/buildmysite)

This is a website that anyone on the internet can add a page to. Fork the repo, drop in your HTML, open a pull request, and if it passes the safety checks it gets **auto-merged** — no waiting on me to approve it. Your page shows up on the live site in about a minute.

It's basically a social experiment: strangers collaboratively building one big weird webpage. There's a map with pins for contributors who share a location, an explore page to browse everything, and a random button if you just want to see what someone else made.

---

## How to add your page

You don't need to be a developer. If you can edit a text file, you can contribute.

1. **Fork** this repo on GitHub (top-right **Fork** button).
2. In your fork, create a folder: `contributions/your-name/`
   - Use lowercase letters, numbers, and hyphens only
   - Example: `contributions/cool-cat/`
3. Add **exactly two files** inside that folder:

**`meta.json`** — your info:
```json
{
  "name": "cool-cat",
  "location": "Austin, TX"
}
```
- `name` is required and must match your folder name
- `location` is optional — any place as text. If you add one, you get a pin on the map

**`page.html`** — your actual page:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>cool-cat</title>
</head>
<body>
  <h1>Hello!</h1>
  <p>This is my page. I built it for Build My Site.</p>
</body>
</html>
```

4. **Open a Pull Request** back to this repo.
5. A bot checks your PR. If it passes, another bot merges it. Done.

That's it. Go click around the [live site](https://pushthis.github.io/buildmysite) to see what other people have done.

More detail in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## The rules

These exist because the site auto-merges everything and I don't want to babysit it 24/7. Keep it simple and safe.

### Allowed in `page.html`
- Headings, paragraphs, lists, tables
- Basic formatting (`<b>`, `<i>`, `<em>`, etc.)
- Images as **data URIs** (embedded in the HTML — no external image links)

### Not allowed
- JavaScript — no `<script>`, no `onclick=`, no `javascript:` links
- External stuff — no loading images, fonts, or styles from other websites
- `<iframe>`, `<style>` blocks, `<object>`, `<embed>`
- Anything except `page.html` and `meta.json` in your folder
- More than **20 KB** total in your folder
- One folder per PR — don't edit someone else's contribution

### General vibes
- Pick a **unique folder name** (first come, first served)
- Keep it friendly — garbage or inappropriate stuff may get removed
- Don't try to break the site on purpose. It won't work, and it's not funny

Contributions are displayed inside a locked-down sandbox iframe even after merge, so sketchy HTML can't run scripts or steal cookies. There's also automated validation before anything merges.

---

## What you'll see on the site

- **Home** — map of everyone who added a location + a scrolling stats bar up top
- **Explore** — grid of all contributions, paginated so it doesn't melt your browser
- **Random Page** — floating button on every page, sends you somewhere random

---

## FAQ

**My PR failed validation — now what?**  
Read the error in the PR checks. Usually it's something like an external link, a script tag, or the folder name not matching `meta.json`. Fix it and push again.

**I don't want to be on the map.**  
Just leave out the `location` field in `meta.json`. You'll still show up in Explore.

**How fast does it go live?**  
Usually under a minute after merge. The site rebuilds and redeploys automatically.

**Can I edit my page later?**  
Open another PR with changes to your folder. Same rules apply.

**Can I use CSS?**  
Not `<style>` blocks or external stylesheets. Basic HTML formatting tags are fine.

---

Have fun, don't be too weird. (Be a little weird. That's the point.)

*Repo maintainer? See [MAINTAINERS.md](MAINTAINERS.md).*
