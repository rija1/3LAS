"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaPlayerWebm = exports.MediaPlayerMp4 = exports.getUserMedia = void 0;
const child_process_1 = require("child_process");
const dgram_1 = require("dgram");
const promises_1 = require("timers/promises");
const uuid_1 = require("uuid");
const src_1 = require("../../../common/src");
const src_2 = require("../../../rtp/src");
const track_1 = require("../media/track");
const getUserMedia = async (path, loop) => {
    const audioPort = await (0, src_1.randomPort)();
    const videoPort = await (0, src_1.randomPort)();
    if (path.endsWith(".mp4")) {
        return new MediaPlayerMp4(audioPort, videoPort, path, loop);
    }
    else {
        return new MediaPlayerWebm(audioPort, videoPort, path, loop);
    }
};
exports.getUserMedia = getUserMedia;
class MediaPlayerMp4 {
    constructor(videoPort, audioPort, path, loop) {
        Object.defineProperty(this, "videoPort", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: videoPort
        });
        Object.defineProperty(this, "audioPort", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: audioPort
        });
        Object.defineProperty(this, "path", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: path
        });
        Object.defineProperty(this, "loop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: loop
        });
        Object.defineProperty(this, "streamId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (0, uuid_1.v4)()
        });
        Object.defineProperty(this, "audio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new track_1.MediaStreamTrack({ kind: "audio", streamId: this.streamId })
        });
        Object.defineProperty(this, "video", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new track_1.MediaStreamTrack({ kind: "video", streamId: this.streamId })
        });
        Object.defineProperty(this, "process", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stopped", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "setupTrack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (port, track) => {
                let payloadType = 0;
                const socket = (0, dgram_1.createSocket)("udp4");
                socket.bind(port);
                socket.on("message", async (buf) => {
                    const rtp = src_2.RtpPacket.deSerialize(buf);
                    if (!payloadType) {
                        payloadType = rtp.header.payloadType;
                    }
                    // detect gStreamer restarted
                    if (payloadType !== rtp.header.payloadType) {
                        payloadType = rtp.header.payloadType;
                        track.onSourceChanged.execute(rtp.header);
                    }
                    track.writeRtp(buf);
                });
            }
        });
        this.setupTrack(audioPort, this.audio);
        this.setupTrack(videoPort, this.video);
    }
    async start() {
        let payloadType = 96;
        const run = async () => {
            if (payloadType > 100)
                payloadType = 96;
            const cmd = `gst-launch-1.0 filesrc location= ${this.path} ! \
qtdemux name=d ! \
queue ! h264parse ! rtph264pay config-interval=10 pt=${payloadType++} ! \
udpsink host=127.0.0.1 port=${this.videoPort} d. ! \
queue ! aacparse ! avdec_aac ! audioresample ! audioconvert ! opusenc ! rtpopuspay pt=${payloadType++} ! \
udpsink host=127.0.0.1 port=${this.audioPort}`;
            this.process = (0, child_process_1.exec)(cmd);
            if (this.loop) {
                await new Promise((r) => this.process.on("close", r));
                if (!this.stopped) {
                    run();
                }
            }
        };
        await (0, promises_1.setImmediate)();
        run();
    }
    stop() {
        this.stopped = true;
        this.process.kill("SIGINT");
    }
}
exports.MediaPlayerMp4 = MediaPlayerMp4;
class MediaPlayerWebm {
    constructor(videoPort, audioPort, path, loop) {
        Object.defineProperty(this, "videoPort", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: videoPort
        });
        Object.defineProperty(this, "audioPort", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: audioPort
        });
        Object.defineProperty(this, "path", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: path
        });
        Object.defineProperty(this, "loop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: loop
        });
        Object.defineProperty(this, "streamId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (0, uuid_1.v4)()
        });
        Object.defineProperty(this, "audio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new track_1.MediaStreamTrack({ kind: "audio", streamId: this.streamId })
        });
        Object.defineProperty(this, "video", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new track_1.MediaStreamTrack({ kind: "video", streamId: this.streamId })
        });
        Object.defineProperty(this, "process", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stopped", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "setupTrack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (port, track) => {
                let payloadType = 0;
                let latestTimestamp = 0;
                let timestampDiff = 0;
                const socket = (0, dgram_1.createSocket)("udp4");
                socket.bind(port);
                socket.on("message", async (buf) => {
                    const rtp = src_2.RtpPacket.deSerialize(buf);
                    if (!payloadType) {
                        payloadType = rtp.header.payloadType;
                    }
                    // detect gStreamer restarted
                    if (payloadType !== rtp.header.payloadType) {
                        payloadType = rtp.header.payloadType;
                        track.onSourceChanged.execute(rtp.header);
                        timestampDiff = (0, src_1.uint32Add)(rtp.header.timestamp, -latestTimestamp);
                        console.log({ timestampDiff });
                    }
                    latestTimestamp = rtp.header.timestamp;
                    rtp.header.timestamp = (0, src_1.uint32Add)(rtp.header.timestamp, -timestampDiff);
                    track.writeRtp(rtp.serialize());
                });
            }
        });
        this.setupTrack(audioPort, this.audio);
        this.setupTrack(videoPort, this.video);
    }
    async start() {
        let payloadType = 96;
        const run = async () => {
            if (payloadType > 100)
                payloadType = 96;
            const cmd = `gst-launch-1.0 filesrc location=${this.path} ! matroskademux name=d \
d.video_0 ! queue ! rtpvp8pay pt=${payloadType++} ! \
udpsink host=127.0.0.1 port=${this.videoPort} \
d.audio_0 ! queue ! rtpopuspay pt=${payloadType++} ! \
udpsink host=127.0.0.1 port=${this.audioPort}`;
            this.process = (0, child_process_1.exec)(cmd);
            console.log(cmd);
            if (this.loop) {
                await new Promise((r) => this.process.on("close", r));
                if (!this.stopped) {
                    run();
                }
            }
        };
        await (0, promises_1.setImmediate)();
        run();
    }
    stop() {
        this.stopped = true;
        this.process.kill("SIGINT");
    }
}
exports.MediaPlayerWebm = MediaPlayerWebm;
//# sourceMappingURL=userMedia.js.map