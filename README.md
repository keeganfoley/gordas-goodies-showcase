# Gorda’s Goodies showcase

The redesigned static storefront combines the approved owner content from
`smh5929/gordas-goodies-site` (commit `3c436d4`) with the cream/crimson storefront,
Fraunces/Manrope typography, framed photos, and ¡Qué rico! brand treatment.

## Preview

Run `python3 -m http.server 8197 --bind 127.0.0.1` and open
http://127.0.0.1:8197. HTML/CSS/JS are served directly; no production build is needed.

## Content and ordering

Home, About, Menu, Events, and Gallery preserve the original repo's approved
headings and paragraphs. Order links open the owner's current Google Form.
Orders require 48 hours' notice and pickup in Springfield, VA. The form requests
an order; availability and totals are confirmed manually, with Venmo/Zelle
payment. Large orders of 10+ boxes require arranging a deposit by email.

The approved Home copy mentions flan, tres leches, and pionono; the approved Menu
lists alfajores, crumb cake, and sticky toffee cupcakes. This source discrepancy
is preserved for owner review rather than silently changing approved copy.

## Photos

Original owner photos appear in product cards, the story, gifts, and past events.
Existing AI campaign photos remain in the Home/Menu/Events headers and a clearly
labeled Gallery inspiration collection. Actual products and past orders lead the
gallery; campaign images are not presented as customer-event documentation.

- `assets/`: original owner photos and brand files.
- `assets/generated/`: campaign source images and provenance.
- `images/`: responsive owner-photo exports.
- `images/generated/`: responsive campaign exports.
- `photo-guide/README.md`: generated visual index of placement and source files.

Run `npm ci` once, then:

- `npm run build-images`: regenerate owner photo exports.
- `npm run build-generated-images`: regenerate campaign exports.
- `npm run build-logo`: regenerate the unchanged brand logo exports.
- `npm run photo-guide`: refresh the visual photo index after editing pages.

Shared styles are in `css/style.css` and `css/bold.css`; navigation and the gallery
lightbox are in `js/main.js`. Keep the header/footer consistent across all six pages.

## Hosting

The live Netlify project is `gordasgoodies`, with custom domain
`gordasgoodiesllc.com`. This content update is prepared on
`approved-content-and-photos`; it has not been deployed to production.
