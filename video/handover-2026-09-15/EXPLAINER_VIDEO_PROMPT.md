# Parts Hub Express explainer video: build prompt for Claude

Version 1.2, 15 September 2026. Prepared for ACBG (Australia or Australian Crushing and Belting Group, spelling to confirm with the client).

**New in 1.2:** the new Parts Hub Express logo (supplied as files, with a short logo open and a logo end card), the preview address, and capture notes for the site changes since 1.1: logo in the header and footer, the orange underline that draws under "machine", drawings that plot themselves, and the new phone header. The handover folder `video/handover-2026-09-15` explains the changes for anyone who started with 1.1.

## How to use this file

1. Open Claude Code in a new, empty folder on a computer that can reach the site.
2. Copy the `brand` folder from the handover folder into that folder. It holds the logo files the prompt refers to.
3. Install the HyperFrames skills: `npx hyperframes skills` (if that command is unavailable: `npx skills add heygen-com/hyperframes --all`).
4. Check `SITE_URL` in the prompt below. It is set to the preview. Change it to the live domain once partshubexpress.com is live.
5. Paste everything under "The prompt" into Claude.

Claude stops for approval at the storyboard, at the voice choice and before rendering. The video is not shared with clients until the sign-off list at the end is ticked.

---

## The prompt

Build a client-facing explainer video for Parts Hub Express with HyperFrames. Start with the `/hyperframes` skill and follow it. Treat this prompt as the completed intent interview: the answers below are confirmed, so write them into `BRIEF.md` at Setup and do not ask them again. Ask only what this prompt leaves open, such as the voice, plus any checkpoint the skill requires.

SITE_URL: https://partshubexpress.vercel.app

### 1. The job

- What: a narrated explainer that shows buyers how to find the right part on Parts Hub Express, built from real screens captured from SITE_URL.
- Who watches: maintenance planners, plant and quarry managers, crushing and screening contractors, and purchasing officers in Australia. They know their machines, they hate downtime and they are short on time.
- The one message: search the part number or pick your machine, and the right part is a few clicks away.
- Length: about 72 seconds, including a 3 second logo open.
- Formats: master at 1920x1080 for the website, YouTube and email links. After the master is approved, a 1080x1080 cut for LinkedIn.
- Language: Australian English in spelling, wording and voice.

### 2. Brief values for BRIEF.md

```yaml
workflow: product-launch-video
flow: automation
storyboard: yes
message: "Search the part number or pick your machine, and the right part is a few clicks away"
destination: website
aspect: 1920x1080
language: en
audience: "Australian crusher, screen and conveyor maintenance buyers"
length: 72s
angle: how-to site tour
narration: yes
```

Intent for the brief body: show the site as it is. The captured screens are the main assets, animated with a virtual cursor, zooms and highlights. No invented interface, no mock screens. The video opens and closes on the Parts Hub Express logo, built from the supplied SVG files.

Assets for the brief body (copy into `## Assets`):

- `brand/phx-lockup.svg`: primary logo, black, for light backgrounds.
- `brand/phx-lockup-white.svg`: reversed logo, white, for the black logo open and end card.
- `brand/phx-symbol.svg` and `brand/phx-symbol-white.svg`: the symbol alone, for the logo open build.
- `brand/phx-p-dot.svg`: frameless P with orange square, for anything smaller than 32 pixels.
- `brand/LOGO_RULES.md`: colours, clear space, minimum sizes, what never to do.

### 3. Facts you may state

- Parts Hub Express is the online parts store of ACBG. Say "ACBG" or leave the company name out until the client confirms the spelling ("Australia" or "Australian" Crushing and Belting Group).
- 4,555 crusher, screen and conveyor parts in 12 groups, from the catalogue of 14 September 2026. Recheck the live count before rendering:
  - Manganese 1,055
  - Screen Media and Accessories 703
  - Rollers 684
  - Conveyors Rubber and Accessories 505
  - Fasteners 417
  - Wear Parts 416
  - Power Transmission Parts 285
  - Hydraulics 169
  - Other 128
  - Filters 87
  - Belt Joiners and Clips 80
  - Gravel and Slurry Pumps 26
- 16 machine models have their own page, including HP300 (63 parts), C160 (50), C130 (48), C12 (40), J1175 (30) and HP400 (30). A machine page lists the parts whose names carry that model code, grouped by type.
- The search box in the header of every page takes a part number or a machine model and suggests matches as you type.
- The homepage machine finder: choose the brand, then the model.
- "Where each part fits": section drawings of a jaw crusher, a cone crusher and an impactor with numbered wear parts (jaws, cheek plates, concaves and mantles, wedges, blow bars, impact plates). Point at a part or its name and both light up together; pick a name to open that range. On phones a tap on a numbered part highlights its name under the drawing.
- Quote list: add parts while browsing, then send the whole list in one request.
- Trade accounts: apply on the Trade page.
- Prices are in AUD including GST. Today most parts show "Price on request".
- The site works on phones.

### 4. Claims you must not make

Keep these out of the narration, captions and screens unless the sign-off list shows ACBG confirmed them:

- Dispatch or delivery times, cut-off times, carriers, or "express" and "same day" promises.
- Stock levels or availability ("in stock", "ready to ship").
- Specific prices or discounts.
- Fitment. Never "fits your machine", "guaranteed to fit", "genuine", "OEM" or "compatible with". Machine pages list parts that carry the model code in their name, and that is all the video says.
- Customer reviews, reviewer names, star ratings or testimonial quotes.
- Phone number, email address, opening hours or street address. The site still shows placeholders for these.
- Machine brand names and logos. Show model codes (HP300, C130). Say a brand only after ACBG confirms the make, and never show a manufacturer logo.

### 5. Story and draft narration

Draft voice-over, about 130 words. Restructure it to fit the timing, but keep every fact inside section 3.

| # | Beat | On screen | Draft narration |
|---|---|---|---|
| 0 | Logo open, 0 to 3s | Black. The white symbol builds: the frame draws, the P settles in, the orange square slides into place beside the frame's gap, then the wordmark wipes on. Hold briefly. | None. A soft single tick on the orange square is optional. |
| 1 | Hook, 3 to 8s | Homepage hero photo, slow push in | "When a crusher stops, every hour counts. Finding the part shouldn't mean ringing around." |
| 2 | Meet the site, 8 to 16s | Homepage loading: the logo in the header, the orange line drawing under "machine", the header search and the machine finder | "Parts Hub Express puts four and a half thousand crusher, screen and conveyor parts in one place." |
| 3 | Search, 16 to 28s | Cursor types HP300 into the header search, suggestions open, results page | "Start with the number you already have. Type a part number or a machine model, and matches appear as you type." |
| 4 | Pick your machine, 28 to 40s | Finder: brand, then model HP300, then the HP300 machine page | "No number handy? Pick the brand, then the model, and see the parts that carry that model code, grouped by type." |
| 5 | Where it fits, 40 to 52s | Drawings section scrolling into view as its outlines plot themselves, then the pointer on 03 concave and mantle and the part lights up orange | "Not sure what the part is called? The drawings show where each wear part sits. Pick one to open that range." |
| 6 | Quote, 52 to 63s | Part page, Add to quote, the quote list | "Add parts to your quote list as you go, then send the whole list in one request." |
| 7 | Close, 63 to 72s | End card on black: the white logo lockup, then "Find the right part for your machine." with an orange line drawing under "machine", as on the site. Add the domain only once partshubexpress.com is live. | "Parts Hub Express. Find the right part for your machine." |

### 6. Screens to capture from SITE_URL

Desktop at 1920x1080 with device scale 2. Phone at 390x844 for one optional phone moment in beat 3 or beat 7.

1. `/` homepage: the hero (headline, finder, browse buttons), then the full page.
2. The header search with `HP300` typed and the suggestions open.
3. `/search?q=HP300` results.
4. The finder with a brand selected, then model HP300 selected, then `/machines/hp300`.
5. `/` "Where each part fits": rest state, then the pointer on key row 03 (concave and mantle) with the part highlighted.
6. `/parts/manganese` category page.
7. `/part/n55208283-hp300-bowl-liner-sh-crs-xt710-18mn` part page (it has no photo, which shows the designed no-photo state), then the same page after pressing Add to quote.
8. `/quote` with that part in the list. Do not submit the form.
9. `/` on the phone viewport with the header search in view.

Capture notes for the site as it is now:

- **Homepage load:** the orange underline under "machine" draws in over about a second after the page appears. Record the load as video for beat 2. For still frames, wait 1.5 seconds.
- **Logo:** the header shows the logo (black), the footer shows it reversed (white). Never re-create it from the capture; use the supplied SVGs for the logo open and end card.
- **Phone header:** the logo row sits on top and scrolls away; the search bar with the Quote and Cart icons stays pinned at the top.
- **Drawings:** the first time the "Where each part fits" section enters view, the outlines plot themselves, then the hatching and callout numbers appear (about 1.5 seconds). Record it for beat 5. For a still, wait 2 seconds. Pointing at a part name finishes the animation at once and lights up that part.
- **Lower sections:** machine tiles, the dark "Why" facts and the review cards rise in as they scroll into view. Wait 1 second before a still.
- **Clean stills:** turning on reduced motion (Chrome DevTools, Rendering, emulate prefers-reduced-motion) shows every section in its finished state instantly.
- **Quote form:** never submit it. The preview answers with "Online requests are not switched on yet."
- **Tab icon:** the browser tab shows the new P icon. The share image the site sends to iMessage and Facebook also uses the new logo.

Capture SITE_URL only. Do not open, capture or reuse anything from auscbgroup.com.au or from any supplier, competitor or manufacturer site. Do not submit forms, sign up, enter payment details or send quote requests.

### 7. Brand system

Take exact values from the capture. These are the reference.

- Type: Inter Tight. Headlines weight 700 with tight tracking (about -0.02em). Part numbers in tabular figures. Load local font files as the HyperFrames font rules require.
- Colours:
  - Canvas #fafafa, white #ffffff, ground grey #f1f3f2, grid line #e6e8e7
  - Ink #000000, muted text #6c6c6c, hairline #d9dcdb
  - Markout Orange #f45120 for fills, strokes and large headings
  - Deep orange #c63a00 for orange text on light backgrounds
  - Green #1f7a3f for positive states
  - Dark bands: #000000 with #b3b3b3 body text, #333333 hairlines and Markout Orange headings
- Look: an engineering title block. Hairline rules, square corners, numbered callouts in small squares, part numbers treated as type. Pill buttons are the only rounded shapes.
- Avoid: gradients, glows, neon, glass effects, 3D chrome, stock handshake photos and generic tech particles.

**Logo** (files in `brand/`, rules in `brand/LOGO_RULES.md`):

- The symbol is a square callout frame with a capital P and a Markout Orange square as a full stop; the frame opens on the right, level with the square. The lockup adds the PARTS HUB EXPRESS wordmark.
- Use the SVG files exactly as supplied. Black version on light backgrounds, white version on black. The square is always #F45120.
- Clear space: at least one tenth of the symbol height on every side. Minimum: lockup 24px tall, symbol 32px; smaller than that, use `phx-p-dot.svg`.
- The wordmark is artwork, set in Antonio Bold and converted to outlines. Captions and titles stay in Inter Tight; never set other text in Antonio.

### 8. Motion language

- Smooth, never bouncy. Entrances settle on power3.out, secondary fades on power2.out, camera moves and zooms on power3.inOut. No back, elastic or bounce eases.
- The cursor travels on power2.inOut and dips slightly (scale 0.96) on each click. No click ripples, no confetti.
- Group staggers stay under 0.5s in total.
- Reach for HyperFrames' own recipes where they fit: `cursor-ui-demo` for the search and finder beats, `coordinate-target-zoom` to push into a detail, `svg-path-draw` for the drawings, `control-target-sync` for the linked highlight, `titlecard-reveal` for the end card.
- Hard cuts or short crossfades between beats. No glitch, whip pans, RGB split or film grain.
- **Logo open (beat 0):** adapt the `logo-assemble-lockup` blueprint, cut to 3 seconds and without its pulse and orbit phases. Frame strokes draw with `svg-path-draw` (0.6s, power2.out), the P fades and settles (0.3s, power3.out), the orange square slides in from the right into its place (0.25s, power3.out, no overshoot), the wordmark wipes on left to right with a clip-path (0.4s, power2.out). Hold the finished lockup for 0.8s. Everything lands in the exact position of the supplied SVG.
- **End card underline (beat 7):** match the site. An orange line under "machine", about 0.075em thick, drawing left to right with scaleX 0 to 1 over 0.7s on power3.out, starting 0.35s after the line of text appears.

### 9. Voice, captions and music

- Voice: calm, confident and practical, like an experienced parts counter salesperson. Australian accent preferred. Ask which text-to-speech provider and voice to use before generating.
- Captions: burned in, Inter Tight 600, white on a black bar, two lines at most. Many viewers watch on mute.
- Music: optional. A low instrumental bed under the voice, royalty free, with a licence you can name.

### 10. Hard rules

- Never AI-generate a part, or any image that could pass for a product photo.
- Part photos appear only as captured from the site, and only after ACBG has verified them. The part in beat 6 has no photo on purpose.
- No em dashes in on-screen text, captions or the narration script. Use commas or full stops.
- Never use the name "Sarah" anywhere.
- Do not render an MP4 until the user says "render".
- Keep all project files in a new folder named `parts-hub-express-explainer`.
- Use the logo files in `brand/` exactly. Never redraw, retype, recolour, stretch, rotate or AI-generate the logo, and never lift it from a screenshot.
- The logo is at concept stage. Keep the video for internal and ACBG review until ACBG approves the logo.

### 11. Checkpoints

1. After capture: a short site summary and DESIGN.md. Continue without waiting.
2. Storyboard and script: stop and wait for approval.
3. Voice: offer two or three voices and wait for a pick.
4. Studio preview with snapshots: stop and ask "Render now, or what changes?"

### 12. Definition of done

- `npx hyperframes lint` and `npx hyperframes validate` pass with zero errors.
- Snapshots reviewed at the count HyperFrames asks for. Text is readable at 1080p and on a phone screen.
- Every spoken or on-screen fact traces back to section 3.
- The final message gives the Studio URL, the actual duration, a contact sheet, the file location and a "What I did not verify" list.

---

## Before this video goes to clients (Jared and ACBG sign-off)

- [ ] Company name spelling confirmed by ACBG ("Australia" or "Australian" Crushing and Belting Group) and used exactly
- [ ] Part count and group counts match the live catalogue on the render date
- [ ] Machine models confirmed, plus any brand name used
- [ ] Every part photo on screen verified by ACBG
- [ ] Quote list and trade account process described correctly
- [ ] partshubexpress.com is live before the video is shared
- [ ] Voice and music licences recorded
- [ ] Captions proofread
- [ ] Logo approved by ACBG, final artwork redrawn by a designer if needed, and the IP Australia trade mark search done
- [ ] Logo open and end card checked against `brand/LOGO_RULES.md` (colours, clear space, no distortion)
