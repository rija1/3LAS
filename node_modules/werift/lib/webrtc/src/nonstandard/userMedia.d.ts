import { MediaStreamTrack } from "../media/track";
export declare const getUserMedia: (path: string, loop?: boolean) => Promise<MediaPlayerMp4 | MediaPlayerWebm>;
export declare class MediaPlayerMp4 {
    private videoPort;
    private audioPort;
    private path;
    private loop?;
    private streamId;
    audio: MediaStreamTrack;
    video: MediaStreamTrack;
    private process;
    stopped: boolean;
    constructor(videoPort: number, audioPort: number, path: string, loop?: boolean | undefined);
    private setupTrack;
    start(): Promise<void>;
    stop(): void;
}
export declare class MediaPlayerWebm {
    private videoPort;
    private audioPort;
    private path;
    private loop?;
    private streamId;
    audio: MediaStreamTrack;
    video: MediaStreamTrack;
    private process;
    stopped: boolean;
    constructor(videoPort: number, audioPort: number, path: string, loop?: boolean | undefined);
    private setupTrack;
    start(): Promise<void>;
    stop(): void;
}
