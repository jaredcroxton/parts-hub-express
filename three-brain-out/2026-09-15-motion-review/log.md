[2026-09-15 08:30] route=codex-review target=motion-pass model=gpt-6-astra score=75 p0=0 p1=4 p2=6 confidence=medium
Integrated all 10:
- P1 1 reduced motion switched on later: both scripts cancel every owned animation on the media query change event.
- P1 2 keyboard focus in the phone header row that scrolls away: .hdr:has(focus-visible) sets top:0. Testing then showed keyboard focus on any header control scrolled the page (desktop too, from html scroll-padding-top); fixed with negative scroll-margin-top on header controls.
- P1 3 negative observer margins left visible content paused: margins removed; focus inside a held group releases it.
- P1 4 drawing entrance masked the highlight: mouseenter, pointerdown and focusin in the drawing section cancel its drawing animations first.
- P2 1 print only released held effects: releaseAll covers held and running.
- P2 2 press transition overridden for Find and steppers: press block moved to the end of globals.css.
- P2 3 wear part fill snapped: injected .part-hl overlays crossfade with the hatch (fill-opacity) in the same 160ms.
- P2 4 card stars stretched: align-self:flex-start (98px).
- P2 5 card and star stagger mixed: card and its stars form one group; aggregate stars keyed to the band rule.
- P2 6 frozen dash lengths: held with a generous length, measured from rendered geometry at playback, running draws released on width change.
Verification gaps addressed with .tmp/motion/motion-check.mjs T1 to T10 (out4): all pass.
