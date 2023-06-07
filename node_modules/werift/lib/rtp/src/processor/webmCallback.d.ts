import { SupportedCodec } from "../container/webm";
import { WebmBase, WebmOption, WebmOutput } from "./webm";
export declare class WebmCallback extends WebmBase {
    private cb;
    private queue;
    constructor(tracks: {
        width?: number;
        height?: number;
        kind: "audio" | "video";
        codec: SupportedCodec;
        clockRate: number;
        trackNumber: number;
    }[], options?: WebmOption);
    pipe: (cb: (input: WebmOutput) => Promise<void>) => void;
    inputAudio: (input: import("./webm").WebmInput) => void;
    inputVideo: (input: import("./webm").WebmInput) => void;
}
export declare const saveToFileSystem: (path: string) => (value: WebmOutput) => Promise<void>;
