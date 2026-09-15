# Parts Hub Express explainer video: handover, 15 September 2026

Everything needed to build, or update, the Parts Hub Express explainer video with the new logo.

## What is in this folder

| Path | What it is |
|---|---|
| `EXPLAINER_VIDEO_PROMPT.md` | The build prompt for Claude, version 1.2. Paste the section under "The prompt" into Claude Code with HyperFrames installed. |
| `WHAT_CHANGED.md` | What changed since version 1.1, and a step-by-step update list for a video already in progress. |
| `brand/` | The logo as SVG and transparent PNG files, plus `LOGO_RULES.md` (colours, clear space, sizes, anatomy for animation, what never to do). |
| `reference/` | Pictures for context (see below). Not assets for the video. |

Reference pictures:

- `share-card-with-logo.png`: the image iMessage and Facebook show for the site.
- `logo-concept-chosen.png`: the concept the logo was built from. Use the `brand/` files, never this image.
- `logo-in-site-header-and-footer.png`: how the logo sits in the website header and footer, desktop and phone.
- `underline-draw-frames.png`: the orange underline drawing under "machine" on the homepage, frame by frame. Match this on the end card.

## Starting fresh

1. Make a new empty folder and open Claude Code in it.
2. Copy `brand/` from this handover into that folder.
3. Install the HyperFrames skills: `npx hyperframes skills`.
4. Open `EXPLAINER_VIDEO_PROMPT.md`, check `SITE_URL` (set to the preview, https://partshubexpress.vercel.app), and paste everything under "The prompt" into Claude.
5. Approve the storyboard and script, pick a voice, review the Studio preview, then say "render".

## Already started with version 1.1

Work through `WHAT_CHANGED.md` section 2 in your existing project:

1. Copy `brand/` into the project.
2. Add the logo open (beat 0) and shift the other beats by 2 seconds.
3. Re-capture the screens listed there (the header, footer and homepage changed).
4. Rebuild the end card with the white logo and the orange underline.
5. Run the checks.

## Rules that matter most

- **Logo:** use the logo files exactly. Never redraw, retype, recolour, stretch or AI-generate the logo, and never lift it from a screenshot.
- **Parts:** never AI-generate a part or anything that could pass for a product photo.
- **Claims:** keep to the facts in prompt section 3. No dispatch times, stock, prices, fitment claims, reviews or placeholder contact details.
- **Site:** capture only https://partshubexpress.vercel.app. Never auscbgroup.com.au or any other site. Never submit forms on the site.
- **Text style:** no em dashes in captions or on-screen text. Australian English.

## Before the video goes to clients

The logo and several facts still need ACBG sign-off. The checklist is at the end of `EXPLAINER_VIDEO_PROMPT.md`. Key items:

- company name spelling
- logo approval and trade mark search
- partshubexpress.com live before sharing

Questions: Jared Croxton.
