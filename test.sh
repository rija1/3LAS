#!/bin/sh

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node 3las.server.js -port 7071 -samplerate 48000 -channels 1 &

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :2 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node 3las.server.js -port 7072 -samplerate 48000 -channels 1 &