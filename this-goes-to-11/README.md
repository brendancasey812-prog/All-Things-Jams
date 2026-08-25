# This Goes to 11

A travel blog UI. Three tabs, no build step, no dependencies — just HTML, CSS and
vanilla JavaScript you can open straight in a browser.

| Tab | File | What's on it |
| --- | --- | --- |
| **Home** | `index.html` | The hook, the "why" behind the blog, an about-me section, and a wall of trip photos |
| **Trips** | `trips.html` | One editable block per destination, alternating photo/text |
| **Recommendations** | `recommendations.html` | Filterable cards for places worth vouching for |

## Running it

Open `index.html` in a browser. That's it. To serve it locally instead:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Photo drop boxes

Every photo placeholder is a drop target. Drag a file onto it, or click to browse:

- **Previews:** JPG, JPEG, PNG, WEBP, AVIF, GIF, BMP, SVG
- **Accepted, no preview:** HEIC, HEIF, TIFF, PDF — the filename is kept on the card
  (browsers can't decode HEIC, so it's stored as a reference)

Images are resized to a 1600px longest edge before being saved so they fit in browser
storage. If storage fills up, the photo still shows for the visit and a note appears.

## Where the content lives

Everything you type or drop is saved to `localStorage` under the `tg11:v1:*` keys —
it stays on your machine and never leaves the browser. Clearing site data resets the
site to its seeded example content.

To wipe it manually, run this in the browser console:

```js
Object.keys(localStorage).filter(k => k.startsWith('tg11:')).forEach(k => localStorage.removeItem(k));
```

## Design

| Token | Value | Used for |
| --- | --- | --- |
| `--deep-navy` | `#071c2a` | Nav, footer, deepest sections |
| `--deep-ocean` | `#0c2c3f` | Hero gradient, drop boxes |
| `--deep-pine` | `#0e3630` | About section, active filters |
| `--sea` / `--sea-bright` | `#17605c` / `#2c8a80` | Links, active tab, accents |
| `--sand` | `#e0b874` | Primary button, stamps, ratings |
| `--on-dark` / `--on-light` | `#ffffff` / `#0a1a1f` | Text, picked per surface |

Sections declare `.on-dark` or `.on-light`, which sets white or near-black text and
the matching muted tone. Type is Fraunces (display) over Inter (body).

## Files

```
index.html              Home
trips.html              Trips
recommendations.html    Recommendations
css/styles.css          The whole design system
js/storage.js           localStorage data layer
js/photos.js            Drop boxes: drag/drop, preview, resize, persistence
js/scroll-reveal.js     Reveal-on-scroll + shared HTML escaper
js/home.js              Home page rendering
js/trips.js             Trip blocks
js/recommendations.js   Recommendation cards + filters
assets/                 Put committed images here
```
