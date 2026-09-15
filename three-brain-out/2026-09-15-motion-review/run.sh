#!/bin/zsh
cd "/Users/jc/Part Hub Express/three-brain-out/2026-09-15-motion-review"
codex exec -m gpt-6-astra --skip-git-repo-check "$(cat prompt.txt)" -i img/sheet-desktop-draw.png -i img/sheet-phone-draw.png -i img/sheet-phone-misc.png -i img/sheet-desktop-reviews.png < bundle.txt > codex-raw.txt 2>&1
echo "exit $?"
