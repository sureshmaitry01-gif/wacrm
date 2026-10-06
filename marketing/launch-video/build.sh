#!/usr/bin/env bash
# Full pipeline: picture -> score -> -14 LUFS master -> final mp4.
set -euo pipefail
cd "$(dirname "$0")"
node render.mjs --fps "${FPS:-60}" --out out/video-only.mp4
node audio.mjs
# two-pass loudnorm to -14 LUFS, -1 dBTP
STATS=$(ffmpeg -hide_banner -i out/mix-raw.wav -af "alimiter=limit=0.89:level=false,loudnorm=I=-14:TP=-1:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$STATS" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
ffmpeg -y -loglevel error -i out/mix-raw.wav -af "alimiter=limit=0.89:level=false,loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" -ar 48000 out/mix.wav
ffmpeg -y -loglevel error -i out/video-only.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart payperdm-launch.mp4
ffmpeg -hide_banner -i payperdm-launch.mp4 -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness" | tail -1
echo "done -> payperdm-launch.mp4"
