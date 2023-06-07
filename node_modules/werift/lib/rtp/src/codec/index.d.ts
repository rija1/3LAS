/// <reference types="node" />
import { RtpPacket } from "../rtp/rtp";
export * from "./av1";
export * from "./base";
export * from "./h264";
export * from "./opus";
export * from "./vp8";
export * from "./vp9";
export declare function dePacketizeRtpPackets(codec: string, packets: RtpPacket[]): {
    isKeyframe: boolean;
    data: Buffer;
    sequence: number;
    timestamp: number;
};
