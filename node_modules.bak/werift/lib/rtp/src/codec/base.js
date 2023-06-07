"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DePacketizerBase = void 0;
class DePacketizerBase {
    constructor() {
        Object.defineProperty(this, "payload", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    static deSerialize(buf) {
        return {};
    }
    static isDetectedFinalPacketInSequence(header) {
        return true;
    }
    get isKeyframe() {
        return true;
    }
}
exports.DePacketizerBase = DePacketizerBase;
//# sourceMappingURL=base.js.map