#!/bin/zsh
cd "/Users/jc/Part Hub Express/three-brain-out/2026-09-14-mobile-review"
codex exec -m gpt-6-astra --skip-git-repo-check "$(cat prompt.txt)" -i segments/home-1.png -i segments/home-2.png -i segments/home-3.png -i segments/home-4.png -i segments/home-5.png -i segments/home-6.png -i segments/home-7.png -i segments/home-8.png -i segments/parts.png -i segments/category.png -i segments/product-photo.png -i segments/product-nophoto.png -i segments/machines.png -i segments/machine-hp300.png -i segments/search.png -i segments/quote.png -i segments/cart.png < bundle.txt > codex-raw.txt 2>&1
echo "exit $?"
