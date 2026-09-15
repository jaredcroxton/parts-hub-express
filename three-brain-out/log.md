[2026-09-14 20:45] route=codex-review target=colour-schemes model=gpt-6-astra files=7 pick=blueprint-sheet
[2026-09-14 21:05] route=higgsfield target=hero model=gpt_image_2_5 count=2 files=design/assets/hero/hero-1.png,hero-2.png
[2026-09-14 22:10] route=higgsfield target=homepage-images model=nano_banana_pro count=4 kept=2 files=site/public/img/hero/hero.jpg,dispatch.jpg
[2026-09-14 22:30] route=higgsfield target=machine-type-tiles model=nano_banana_pro count=4 kept=4 files=site/public/img/machines/type-*.jpg
[2026-09-14 22:45] route=codex-review (workflow fallback, Gemini 429) target=crusher-drawings files=site/data/drawings/jaw.svg,cone.svg,impactor.svg
[2026-09-14 23:40] route=codex-review target=mobile-rescore model=gpt-6-astra score=82 (was 61) files=three-brain-out/2026-09-14-mobile-review/codex-rescore.md
[2026-09-15 08:30] route=codex-review target=motion-pass model=gpt-6-astra score=75 p0=0 p1=4 p2=6 integrated=10 files=three-brain-out/2026-09-15-motion-review/codex-review.md
