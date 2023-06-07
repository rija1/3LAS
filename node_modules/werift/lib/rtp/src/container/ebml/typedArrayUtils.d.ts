/// <reference types="lodash" />
export declare const numberToByteArray: (num: number, byteLength?: number) => Uint8Array;
export declare const stringToByteArray: ((str: string) => Uint8Array) & import("lodash").MemoizedFunction;
export declare function getNumberByteLength(num: number | bigint): number;
export declare const int16Bit: ((num: number) => Uint8Array) & import("lodash").MemoizedFunction;
export declare const float32bit: ((num: number) => Uint8Array) & import("lodash").MemoizedFunction;
export declare const dumpBytes: (b: ArrayBuffer) => string;
