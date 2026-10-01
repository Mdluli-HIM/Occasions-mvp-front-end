# Category icons

Use transparent PNG or WebP files for category icons. The homepage shows the full image with no filled tile background. Your current uploaded filenames are supported:

- cataring.png → Catering
- tents & Marquees.png → Tents & Marquees
- deco.png → Décor
- phohography.png → Photography
- chairs & tables.png → Chairs & Tables
- mobile toilets.png → Mobile Toilets
- fridge.png → Mobile Fridges
- other.png → Other

Add sound-dj.png for Sound & DJ. Until then, it uses a simple music icon.

For future replacements, canonical filenames also work and take precedence:

```text
catering.png
tents.png
decor.png
sound-dj.png
photography.png
chairs-tables.png
mobile-toilets.png
mobile-fridges.png
other.png
```

PNG, WebP, AVIF, JPG and JPEG are supported, in that order of preference for a filename. PNG and WebP can preserve transparency. Square canvases with centered artwork work well; the full image fits inside a 112px or 128px icon frame.

Enable the icons with:

```bash
bash /Users/marcus/occasions-mvp/.codex-updates/category-icons/apply.sh --apply
```

Refresh the homepage after adding or replacing an icon. File modification times version image URLs so replacement images refresh the optimized image cache. Missing files use category-specific line icons.
