# PayPerDM — 20s launch film

`payperdm-launch.mp4` — 1080×1920, 60 fps, H.264 yuv420p (CRF 16), AAC, −14 LUFS.

Rebuild: `./build.sh` (needs Node 22, ffmpeg, Playwright Chromium).

| File | Role |
|---|---|
| `index.html` + `film.js` | The film. `window.seek(t)` paints frame `t`; open `index.html?play` over HTTP to preview, `?t=9.5` to scrub. |
| `lib/motion.js` | Closed-form springs (`snappy` / `default` / `heavy` / `playful`), `track()`, `swapAlpha()`, `mulberry32`. |
| `timeline.js` | Scene times, chat copy, captions and SFX cues shared by picture and sound (120 BPM grid). |
| `render.mjs` | Renders frames → ffmpeg. `--sheet` makes a one-frame-per-beat contact sheet, `--still t` one frame. |
| `audio.mjs` | Synthesized score + SFX → `out/mix-raw.wav`, writes `beats.json`. |
| `assets/workbench.png` | Real PayPerDM dashboard crop (account email and staging label removed). |

Story: chat chaos (0–6s) → bubbles collapse into the PayPerDM mark → real "+ Create Checkout Link"
button → one checkout-link card → sent in chat → buyer checkout (details + pay → Payment verified) →
the same card becomes the paid order → Ready to Pack → Packed → Shipped → Delivered + buyer tracking →
end card "Turn chat orders into paid, trackable orders. No website needed. Start free."
