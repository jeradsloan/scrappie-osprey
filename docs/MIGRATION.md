# Migrating a site onto `scrappie-osprey`

You are in a Hugo site's project directory. This site currently runs an older,
independently-modified copy of the **osprey** theme. Goal: switch it to
**`scrappie-osprey`** (a maintained, param-driven fork) as a git submodule, keep its
current look exactly, and express its branding through `params.brand.*`.

## What exists (don't recreate)
- **`scrappie-osprey`** — public theme, https://github.com/jeradsloan/scrappie-osprey,
  Apache 2.0 fork of osprey v2.1.0, tagged `v0.1.1`. Param-driven branding, self-hosted
  Video.js gallery, hero-mosaic mobile fallback, Formspree/Basin contact. **Read its
  README first** — it documents install, the `params.brand.*` schema, and the contracts.
- **Reference (already-migrated) site**: `~/hugo/story-division-social-hugo-website` —
  done and deployed to Cloudflare (build green). Its `hugo.yaml` `params.brand` block is
  the template to copy.

## Goal
This site renders **visually identical** to now, but powered by `scrappie-osprey` as a
git submodule, branding expressed via `params.brand.*` (so future rebrands need zero CSS
edits). The old osprey removed.

## Phase 1 — Baseline (prove "nothing changes")
1. Confirm a clean git tree; commit any pending work.
2. Baseline build: `rm -rf public resources && hugo --gc --minify`.
3. Fingerprint the whole output: `find public -type f | sort | xargs md5 | md5`. Save it.
4. Also save the compiled CSS (`find public -name '*.css' | head -1`) — needed in Phase 3.

## Phase 2 — Swap the submodule (must stay byte-identical)
5. `git submodule add https://github.com/jeradsloan/scrappie-osprey.git themes/scrappie-osprey`
6. Set `theme: scrappie-osprey` (use array `[scrappie-osprey, osprey]` temporarily as a
   fallback during the swap).
7. Rebuild, re-fingerprint. **Must equal Phase 1.** (The project `layouts/` + `main.scss`
   still override the theme, so output is identical by construction.)
8. Remove old osprey: `git submodule deinit -f themes/osprey && git rm themes/osprey &&
   rm -rf .git/modules/themes/osprey`. Set `theme: scrappie-osprey`. Rebuild — still identical.
9. Commit.

## Phase 3 — Branding → params (the only phase that changes CSS semantics)
10. Grep the project `main.scss` for branded values: primary/nav/accent colors, font family,
    hero image URL. These become `params.brand.*`.
11. Add to `hugo.yaml`:
    ```yaml
    params:
      brand:
        colorPrimary: "#..."   # main bg / hero
        colorDark: "#..."      # nav + footer bg
        colorAccent: "#..."    # nav text, hovers, focus rings
        fontHeader: "FontName"
        fontBody: "FontName"
        fontStack: "fallback, serif"
        heroMosaicUrl: "/images/..."   # only if the site uses the mosaic
        # fontGoogleUrl: "https://fonts.googleapis.com/css2?family=..."  # OR self-host
    ```
12. **CAVEAT — the theme's `main.scss` is derived from one specific site.** Before deleting
    the project `main.scss`, diff it against the theme's. Port any UNIQUE structural rules
    into the theme `main.scss` first (or keep them as a project override). Do NOT silently
    drop site-specific CSS. Only delete the project copy once the theme covers everything.
13. Delete the project `layouts/partials/head.html` (the theme's drives; it has the
    ExecuteAsTemplate pipeline). Reconcile first if the project head.html diverges.
14. Fonts: if self-hosted, create the site's own `layouts/partials/fonts.html` with its
    `@font-face` blocks (overrides the theme's Google-Fonts default). Else set `fontGoogleUrl`.
15. Rebuild. Compare compiled CSS to Phase-1 CSS **with `@font-face` stripped from both**
    (the theme relocates `@font-face` into `fonts.html`, so CSS differs only by those blocks).

## Phase 4 — Ship
16. Commit, push, watch the Cloudflare build.

## Contracts you MUST NOT break
- **`params.brand.*` schema** — exact keys above; `head.html` reads them.
- **ExecuteAsTemplate pipeline** — theme `head.html` compiles SCSS via
  `resources.Get "sass/main.scss" | resources.ExecuteAsTemplate "sass/main-rendered.scss" . | css.Sass ...`.
  The **distinct output name** (`main-rendered.scss`) is load-bearing — reusing the source
  name returns the un-templated file. Don't "simplify" it.
- **`_typography.scss`** declares `$font-header`/`$font-body` with `!default` — required so
  injected brand fonts win over the theme's Bitter/Rubik defaults. Keep the `!default`.
- **Video.js contract**: `head.html` emits `window.__vjsAssets` when a gallery page has
  non-Vimeo `video` front matter; `modals.html` emits `<video data-vjs-manifest>` (+ optional
  `data-mp4-fallback`); `modal.js` queries `[data-vjs-manifest]`. Skin `.vjs-scrappie.video-js`
  (specificity 0,3,0) must beat default `.video-js`.
- **Hugo conventions** (AGENTS.md): `hugo.yaml` not TOML; `locale:` not `languageCode:`;
  `disableKinds: [taxonomy]`; pin `HUGO_VERSION=0.164.0` on CF prod + preview both.

## Verification gotchas (hard-won — heed these)
- **`css.Sass` `vars` option does NOT work** on Hugo 0.164 + libsass (verified: injected
  values never reach compiled CSS). Params MUST go through `ExecuteAsTemplate`, not `vars`.
- **libsass compresses hex**: `#FF00FF`→`#f0f`, `#FFFFFF`→`#fff`. When probing whether a param
  injected, grep the **compressed** form or you'll get false negatives.
- **Perl `@font` bug**: if you strip `@font-face` for comparison with Perl, escape the `@`
  (`s/\@font-face\{[^}]*\}//g`) — unescaped `@font` interpolates as an empty array and leaves
  `@font` remnants = phantom diff.
- The whole-site fingerprint **will** differ after Phase 3 (CSS filename hash changes + HTML
  gains the `fonts.html` `<style>`). Expected. The **CSS content minus `@font-face`** is what
  must match.

## Branding discovery checklist
- [ ] Primary/nav/accent hex colors (`rg '#[0-9a-fA-F]{6}' assets/sass/`).
- [ ] Font family + self-hosted vs Google (`@font-face` / `@import url(googleapis)`).
- [ ] Logo paths (`logoBig`, `logoSmall` params).
- [ ] Hero asset (mp4 + mosaic, if any).
- [ ] Does the site use the gallery/Video.js? Contact form (Formspree/Basin)? Enable only
      what it uses.

## Deliverables + report back
- Site green, visually identical, on `scrappie-osprey` submodule; old osprey gone;
  `params.brand.*` set; pushed + CF green.
- **Report anything site-specific that had to be ported into the theme** — candidates for a
  future theme release so the theme becomes more genuinely generic.
