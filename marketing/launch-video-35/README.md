# PayPerDM — 35s launch film (16:9)

`payperdm-launch-35s.mp4` — 1920×1080, 60 fps, H.264 yuv420p (CRF 16), AAC, −14 LUFS, 150 BPM.

Structure follows the reference launch film (two-tone brand colours, beat-cut shots, word-by-word
type, phones rising/tilted beside two-line headlines, rapid single-word beats, "From… to… to…" build, end card),
re-written for PayPerDM: DM chaos → meet PayPerDM → built for DM sellers → create link (real dashboard)
→ send in chat → buyer pays → payment verified → order in one place → pack/ship/deliver → buyer tracks →
features → end card.

Rebuild: `./build.sh` · contact sheet: `node render.mjs --sheet` · one frame: `node render.mjs --still 12.9`.
Timing lives in `timeline.js`; picture in `film.js`; score/SFX in `audio.mjs`; springs in `lib/motion.js`.
`assets/dashboard.png` is the real PayPerDM dashboard (email, staging label and zero counts removed).
