#!/bin/sh

pm2 start "ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960  -f mp3 - \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1" --name channel_1_mp3 > /Users/reedz/Desktop/output.mp3

pm2 start "ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960  /Users/reedz/Desktop/output.wav \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1" --name channel_1_wav

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960  /Users/reedz/Desktop/output.wav \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960  /Users/reedz/Desktop/output.wav \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1


ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 -acodec copy /Users/reedz/Desktop/output.wav  \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 -f tee "[select=a:f=s16le]pipe:1|[select=a:f=s16le]/Users/reedz/Desktop/output.wav" \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1

# OK output file + stream 

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 -f mp3 /Users/reedz/Desktop/output.mp3  \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1

# OK PM2 -output file + stream 

pm2 start "ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 -f mp3 /Users/reedz/Desktop/output.mp3  \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1
" --name channel_1



# OK stream

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1  \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1



#

pm2 start "ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1" --name channel_1

pm2 start "ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3102 -samplerate 48000 -channels 1" --name channel_2

pm2 start "ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3103 -samplerate 48000 -channels 1" --name channel_3

pm2 start "ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3104 -samplerate 48000 -channels 1" --name channel_4

# ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f alsa -i hw:0 \
# -af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
# -f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
# | node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f avfoundation -i :3 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3101 -samplerate 48000 -channels 1 &

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f alsa -i hw:0 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3102 -samplerate 48000 -channels 1

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f alsa -i hw:0 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3103 -samplerate 48000 -channels 1

ffmpeg -fflags +nobuffer+flush_packets -flags low_delay -rtbufsize 64 -probesize 64 -y -f alsa -i hw:0 \
-af aresample=resampler=soxr -acodec pcm_s16le -ar 48000 -ac 1 \
-f s16le -fflags +nobuffer+flush_packets -packetsize 384 -flush_packets 1 -bufsize 960 pipe:1 \
| node /Users/reedz/Coding/3LAS/srts/admin/3las.server.js -port 3104 -samplerate 48000 -channels 1