"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RtpTimeCallback = void 0;
const rtpTime_1 = require("./rtpTime");
class RtpTimeCallback extends rtpTime_1.RtpTimeBase {
    constructor(clockRate) {
        super(clockRate);
        Object.defineProperty(this, "cb", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pipe", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (cb) => {
                this.cb = cb;
                return this;
            }
        });
        Object.defineProperty(this, "input", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (input) => {
                for (const output of this.processInput(input)) {
                    this.cb(output);
                }
            }
        });
    }
}
exports.RtpTimeCallback = RtpTimeCallback;
//# sourceMappingURL=rtpTimeCallback.js.map