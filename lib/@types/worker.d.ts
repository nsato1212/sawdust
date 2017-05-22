/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class Worker extends EventEmitter {
    /**
     * @private
     * @member {Worker.Executable[]}
     */
    private queue;
    /**
     * @private
     * @member {number}
     */
    private size;
    /**
     * @private
     * @member {any}
     */
    private immediate;
    /**
     * @private
     * @member {Worker~Batchable[]}
     */
    private preparings;
    /**
     * @private
     * @member {Worker~Batchable[]}
     */
    private workings;
    /**
     * @constructor
     * @param {Object} [options]
     * @param {number} [options.size=0]
     */
    constructor(options?: Partial<Worker.Option>);
    /**
     * @return {number}
     */
    getSize(): number;
    /**
     * @return {number}
     */
    setSize(size: number): void;
    /**
     * @return {Worker~Batchable[]}
     */
    getPreparingItems(): Array<Worker.Executable>;
    /**
     * @return {Worker~Batchable[]}
     */
    getWorkingItems(): Array<Worker.Executable>;
    /**
     * @return {Worker.Batchable[]}
     */
    getQueuedItems(): Array<Worker.Executable>;
    /**
     * @param {Worker.Executable|Worker.Executable[]} itemOrItems
     */
    invoke(itemOrItems: Worker.Executable | Array<Worker.Executable>): void;
    /** */
    prepare(): void;
    /**
     * @param {Worker.Executable} item
     * @return {Promise<void>}
     */
    execute(item: Worker.Executable): Promise<void>;
    /**
     * @param {Worker.Executable} item
     */
    remove(item: Worker.Executable): void;
    /**
     * @return {Promise<void>}
     */
    destroy(): Promise<Array<void>>;
}
export declare module Worker {
    interface Option {
        size: number;
    }
    type Executable = {
        execute(): Promise<void>;
        cancel?(): Promise<void>;
        destroy?(): Promise<void>;
    };
    type Event = Event.Register | Event.Close | Event.Error | Event.Destroy;
    module Event {
        type Register = 'register';
        type Open = 'open';
        type Error = 'error';
        type Close = 'close';
        type Destroy = 'destroy';
        const REGISTER: Register;
        const OPEN: Open;
        const ERROR: Error;
        const CLOSE: Close;
        const DESTROY: Destroy;
    }
}
