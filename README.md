# Property Link Partners — Website

A static, multi-page marketing site for Property Link Partners: dedicated virtual assistants for U.S. real estate lead generation, plus the company's own wholesaling activity (explained separately).

No framework and no dependencies. Plain HTML, CSS, and vanilla JavaScript, with a small Node build script that assembles shared partials.

## Structure

```
build.mjs              Build script (Node 18+): src/ -> docs/
src/
  pages/               One file per page (meta JSON block at the top)
  partials/            Shared header, footer, layout, and motion graphics
    hero-anim.html     Signature "property prospect -> qualified conversation" SVG
    schedule.html      5-hour / 8-hour schedule selector
    data-branches.html "Use Your Data" / "Discuss Skip Tracing Support" merge graphic
    wholesale-flow.html Opportunity -> Contract -> Structure -> Buyer graphic
  assets/
    css/styles.css     All styles (design tokens at the top)
    js/main.js         Navigation, animations, tabs, form handling
    js/config.js       Form endpoint configuration  <-- setup required
    img/               Logo, favicon
docs/                  Built site (committed, ready for GitHub Pages)
```

Pages: `/`, `/va-services/`, `/lead-niches/`, `/pricing/`, `/wholesaling/`, `/about/`, `/contact/`, `/privacy/`, `/terms/`, plus `404.html`.

## Build

```bash
node build.mjs
# With your real domain (adds canonical URLs, og:url, sitemap.xml, robots.txt sitemap line):
SITE_URL=https://www.your-domain.com node build.mjs
```

Edit files in `src/`, never in `docs/`. The build replaces `docs/` each time.

## Setup required before launch

### 1. Connect the contact forms

The site has three separate forms (VA services, property owners, investor buyers). **They are not connected to any delivery service yet.** Until they are:

- each form shows a visible "Setup required" notice, and
- submitting shows "Not sent", never a false success message.

To connect them, create an endpoint for each form with a form service (for example Formspree, Basin, or Getform) or your own server, then paste the URLs into `src/assets/js/config.js`:

```js
window.PLP_CONFIG = {
  formEndpoints: {
    va: "https://formspree.io/f/xxxxxxx",
    owner: "https://formspree.io/f/yyyyyyy",
    investor: "https://formspree.io/f/zzzzzzz"
  }
};
```

Forms POST `multipart/form-data` with an `Accept: application/json` header. The success message only appears when the endpoint returns a 2xx status. Rebuild after editing.

"Book a Discovery Call" links to the VA inquiry form (`/contact/#va-inquiry`). If you use a scheduling tool, you can point those links to it instead.

### 2. Complete the legal pages

`/privacy/` and `/terms/` are business-specific drafts. Highlighted placeholders (legal entity name, address, contact email, provider names, retention periods, governing state, state-specific disclosures) must be filled in, and both pages should be reviewed by a qualified attorney.

### 3. Add verified contact details (optional)

No phone number, email, or address is shown because none was supplied. Add only verified details.

## Deploying

**GitHub Pages:** Settings → Pages → Deploy from a branch → select the branch and the `/docs` folder. All internal links are relative, so the site works at a domain root or a project subpath. The exception is `404.html`, which links to `/` and assumes the site is served at a domain root.

**Any static host** (Netlify, Cloudflare Pages, S3, etc.): publish the `docs/` folder. On Netlify or Cloudflare Pages you can set the build command to `node build.mjs` and the output directory to `docs`.

## Content rules this site follows

- Pricing: $7/hour, or $1,500 per VA per month. No upfront fee. No preset hours for the monthly package, and skip tracing is never implied to be included.
- Five-hour and eight-hour daily schedules are presented as options to discuss. The schedule selector doesn't change prices.
- VA services (supporting a client) and wholesaling (acting in our own transaction) are always described separately. A contractual interest is never presented as ownership.
- No invented testimonials, ratings, results, team details, locations, or transaction history. No fake structured data.

## Accessibility and motion

- Keyboard-accessible navigation, tabs (arrow keys), and forms, with visible focus states and a skip link.
- Labeled form fields with inline errors; marketing consent is optional and unchecked.
- `prefers-reduced-motion` turns off all animation. The hero shows its fully composed, static illustration instead.
- The hero animation has a Pause/Play control, and it pauses when off screen or when the tab is hidden.
- The page still works without JavaScript: content shows and all forms are visible.

## Fonts

Headings and body text use Plus Jakarta Sans from Google Fonts. If the font can't load, the page falls back to the system sans-serif.
