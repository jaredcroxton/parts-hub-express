# What changed since prompt version 1.1, and what to update

For anyone who already started the explainer with version 1.1 of the prompt (14 September 2026). If you are starting fresh, use `EXPLAINER_VIDEO_PROMPT.md` (version 1.2) and skip to the README's "Starting fresh" steps.

## 1. What changed

### Brand

- **New logo.** A square callout frame with a capital P and an orange square as a full stop, plus the PARTS HUB EXPRESS wordmark. Files and rules are in `brand/`. It replaces the plain-text "PARTS HUB EXPRESS" wordmark used in 1.1.
- The logo is concept stage and needs ACBG approval before public use.

### Website (what you will see when you capture it)

| Where | Before (1.1 captures) | Now |
|---|---|---|
| Header, desktop | Text wordmark | Logo lockup, black, 40px tall |
| Header, phone | Search row on top | Logo row on top that scrolls away; search bar with Quote and Cart icons pinned at the top |
| Footer | Text wordmark | Logo lockup, white |
| Browser tab icon | Default icon, then an interim "P." | New P icon from the logo |
| Homepage headline | Static | An orange line draws under "machine" about a second after load |
| "Where each part fits" | Static drawings | Outlines plot themselves the first time the section enters view; the highlighted part fades to orange |
| Lower homepage sections | Static | Machine tiles, "Why" facts and review cards rise in as they scroll into view; review stars fill left to right |
| Buttons | Static | A slight press dip when clicked |
| Phone lists and product page | Tall tiles | Compact rows; the product page shows part number, title, price and actions before the photo |
| Share image (iMessage, Facebook) | Plain title card | Black card with the new logo, the hero line and the jaw crusher drawing |
| Site address | Not public | Preview at https://partshubexpress.vercel.app |

Nothing changed in the facts the video may state, the claims it must avoid, the audience, or the voice.

## 2. What to update in a video already in progress

### Storyboard and script

1. **Add beat 0, the logo open (0 to 3s).**
   - Content: black, the white symbol builds (frame draws, P settles, orange square slides in), then the wordmark wipes on.
   - Narration: none.
   - Shift every later beat by about 2 seconds. Total length is now about 72 seconds.
2. **Beat 2:** show the homepage loading with the logo in the header and the orange underline drawing under "machine".
3. **Beat 5:** show the drawings plotting themselves as the section scrolls in, then the pointer on 03 with the part lighting up orange.
4. **Beat 7, the end card:** replace the text wordmark with the white logo lockup. Under the line "Find the right part for your machine.", add the orange underline drawing under "machine". Add the domain only once partshubexpress.com is live.
5. **Update `BRIEF.md`:** length 72s, and list the logo files under `## Assets` (the exact list is in section 2 of the prompt).

### Screens to re-capture

Every capture that shows the header or footer is out of date:

- [ ] Homepage hero (record the load for the underline; stills after 1.5 seconds)
- [ ] Header search with suggestions (desktop)
- [ ] `/search?q=HP300`
- [ ] Finder selections and `/machines/hp300`
- [ ] "Where each part fits" (record the plot animation; still after 2 seconds; then the highlight on 03)
- [ ] `/parts/manganese`
- [ ] The part page `/part/n55208283-hp300-bowl-liner-sh-crs-xt710-18mn` before and after Add to quote
- [ ] `/quote` with the part in the list (never submit the form)
- [ ] Phone homepage (new header layout)

Tip: Chrome DevTools, Rendering, "Emulate CSS prefers-reduced-motion: reduce" shows every section finished instantly, which is the quickest way to get clean stills. Turn it off when recording the site's own motion.

### Design and motion

- Add the logo section from prompt section 7 to `DESIGN.md` or `frame.md`.
- Build the logo open and end card from the SVG files, with the timings in prompt section 8.
- Keep captions and titles in Inter Tight. The logo's wordmark is artwork, not a font to reuse.

### Checks before showing anyone

- [ ] `npx hyperframes lint` and `npx hyperframes validate` pass
- [ ] Logo open and end card match `brand/LOGO_RULES.md`: colours, clear space, no distortion, square always #F45120
- [ ] No frame shows the old text wordmark or the old icon
- [ ] Beat timings still match the narration after the 2 second shift
- [ ] Sign-off list at the end of the prompt, including the new logo approval items
