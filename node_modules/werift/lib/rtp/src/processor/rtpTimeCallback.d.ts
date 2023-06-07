import { RtpTimeBase, RtpTimeInput, RtpTimeOutput } from "./rtpTime";
export declare class RtpTimeCallback extends RtpTimeBase {
    private cb;
    constructor(clockRate: number);
    pipe: (cb: (input: RtpTimeOutput) => void) => this;
    input: (input: RtpTimeInput) => void;
}
