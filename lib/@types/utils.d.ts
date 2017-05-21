/// <reference types="node" />
import { EventEmitter } from 'events';
export declare function drop(item: any, arr: Array<any>): void;
export declare function readyErrorHandling(emitter: EventEmitter): void;
export declare function normalizeArray<T>(value: T | Array<T>): Array<T>;
export declare function isObject(value: any): value is Object;
