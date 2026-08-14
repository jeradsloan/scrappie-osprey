# Scrappie Osprey

Maintained fork of [Osprey](https://github.com/tomanistor/osprey) by Toma Nistor (Apache 2.0). The upstream theme was abandoned in December 2019 (v2.1.0) and no longer builds on modern Hugo. This fork carries the accumulated compatibility patches and feature additions needed to keep it running.

## What this fork changes vs upstream osprey v2.1.0

### Modern Hugo compatibility
- `head.html` drops the removed `_internal/google_analytics_async.html`.
- `css.Sass` replaces the removed `resources.ToCSS`.
- `.Site.Language.Locale` replaces the deprecated `.Site.LanguageCode` (v0.127+).
- Full favicon link set emitted from `head.html` (ico + png + manifest + apple-touch).

### Features
- **Self-hosted Video.js** (v8.23.9) for gallery videos. Players pre-initialize on scroll (IntersectionObserver) so a single tap plays unmuted on iOS/Android; the script itself lazy-loads. Non-Vimeo `video` front matter renders a `<video data-vjs-manifest>` element; `modal.js` handles load + init. Vimeo URLs render as iframe embeds.
- **Hero mosaic background** (mobile fallback) when the hero `<video>` won't autoplay.
- **Contact form** toggle: Formspree OR Basin (free AJAX via `ajaxBasin`).

### Param-driven branding
Colors and font family are exposed as `params.brand.*` so each site brands with zero CSS edits:

```yaml
params:
  brand:
    colorPrimary: "#268CCD"   # main bg, header/hero
    colorDark: "#2619D0"      # nav + footer bg
    colorAccent: "#FFAA01"    # nav text, hovers, focus rings
    fontHeader: "Caladea"
    fontBody: "Caladea"
    fontStack: "Georgia, serif"
    heroMosaicUrl: "/images/hero-mosaic.webp"   # mobile hero fallback; omit if unused
    # fontGoogleUrl: "https://fonts.googleapis.com/css2?family=..."  # default fonts; OR self-host via fonts.html
```

Fonts default to a Google Fonts `<link>` via `params.brand.fontGoogleUrl`. To self-host instead, provide your own `layouts/partials/fonts.html` (Hugo lookup order overrides the theme default).

## Install as a submodule

```bash
git submodule add https://github.com/jeradsloan/scrappie-osprey.git themes/scrappie-osprey
git submodule update --init --recursive
```

Then in `hugo.yaml`:

```yaml
theme: scrappie-osprey
```

## License

Apache License 2.0. Original theme © Toma Nistor. Fork maintained by jeradsloan.
