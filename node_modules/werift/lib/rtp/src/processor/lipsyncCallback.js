"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LipsyncCallback = void 0;
const lipsync_1 = require("./lipsync");
class LipsyncCallback extends lipsync_1.LipsyncBase {
    constructor(options = {}) {
        super((output) => {
            if (this.audioCb) {
                this.audioCb(output);
            }
        }, (output) => {
            if (this.videoCb) {
                this.videoCb(output);
            }
        }, options);
        Object.defineProperty(this, "audioCb", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "videoCb", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pipeAudio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (cb) => {
                this.audioCb = cb;
            }
        });
        Object.defineProperty(this, "pipeVideo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (cb) => {
                this.videoCb = cb;
            }
        });
        Object.defineProperty(this, "inputAudio", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.processAudioInput
        });
        Object.defineProperty(this, "inputVideo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.processVideoInput
        });
    }
}
exports.LipsyncCallback = LipsyncCallback;
//# sourceMappingURL=lipsyncCallback.js.map