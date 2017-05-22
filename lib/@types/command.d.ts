/// <reference types="node" />
import { EventEmitter } from 'events';
import { Report } from './report';
export declare class Command<T> extends EventEmitter {
    /**
     * @private
     * @param {string} name
     */
    private name;
    /**
     * @private
     * @member {string}
     */
    private status;
    /**
     * @private
     * @member {string}
     */
    private message;
    /**
     * @private
     * @member {Error} error
     */
    private error;
    /**
     * @callback {Command~Task}
     * @return {void|Promise<void>}
     */
    /**
     * @private
     * @member {Command~Task[]}
     */
    private tasks;
    /**
     * @private
     * @member {Report}
     */
    private report;
    /**
     * @private
     * @member {events.EventEmitter}
     */
    private interruptions;
    /**
     * @constructor
     * @param {string} name
     */
    constructor(name: string);
    /**
     * @constructor
     * @param {Object} params
     */
    constructor(params: Partial<T>);
    /**
     * @constructor
     * @param {string} name
     * @param {Object} [params]
     */
    constructor(name: string, params?: Partial<T>);
    /**
     * @return {string}
     */
    getName(): string;
    /**
     * @return {string}
     */
    getStatus(): Command.Status;
    /**
     * @return {string}
     */
    getMessage(): string;
    /**
     * @return {Error}
     */
    getError(): Error;
    /**
     * @return {Report}
     */
    getReport(): Report<T>;
    /**
     * @return {boolean}
     */
    hasError(): boolean;
    /**
     * return true if this status is 'pending'
     * @return {boolean}
     */
    isPending(): boolean;
    /**
     * return true if this status is 'working'
     * @return {boolean}
     */
    isWorking(): boolean;
    /**
     * return true if this status is 'canceling'
     * @return {boolean}
     */
    isCanceling(): boolean;
    /**
     * return true if this status is 'completed'
     * @return {boolean}
     */
    isCompleted(): boolean;
    /**
     * return true if this status is 'failed'
     * @return {boolean}
     */
    isFailed(): boolean;
    /**
     * return true if this status is 'canceled'
     * @return {boolean}
     */
    isCanceled(): boolean;
    /**
     * return true if this status is 'working' or 'canceling'
     * @return {boolean}
     */
    isRunning(): boolean;
    /**
     * return true if this status is 'failed', 'completed' or 'canceled'
     * @return {boolean}
     */
    isFinished(): boolean;
    /**
     * update any parameters, and trigger events with 'Update'
     * @param {Props} [props]
     * @param {Props.name} [string] - name
     * @param {Props.status} [string] - status
     * @param {Props.message} [string] - message
     */
    update(props?: Partial<Command.Props>): void;
    /**
     * @param {Command~Task|Command~Task[]} task
     * @return {Command}
     */
    addTask(task: Command.Task): this;
    addTask(tasks: Array<Command.Task>): this;
    /**
     * @param {string} name
     * @param {Command~Interruption} interrupt
     */
    reserve(name: string, interrupt: Command.Interruption): void;
    /**
     * @callback {Command~Interruption}
     */
    /**
     * @param {string} name
     */
    revoke(name: string): void;
    /**
     * @param {string} name
     */
    interrupt(name: string): void;
    /**
     * @return {(string|symbol)[]}
     */
    getReservedNames(): Array<string | symbol>;
    /**
     * @return {Promise<void>}
     */
    execute(): Promise<void>;
    /** */
    cancel(): void;
    /**
     * @throws {Task.Cancellaration|Error} will throw an error if status is 'Canceling' or it is happened error
     */
    check(): void;
    /**
     * @return {Promise<void>}
     */
    destroy(): Promise<void>;
}
export declare namespace Command {
    class Cancellaration {
    }
    interface Props {
        name: string;
        message: string;
        status: Status;
        error: Error;
    }
    type Task = () => void | Promise<void>;
    type Interruption = () => void;
    type Status = Status.Pending | Status.Working | Status.Completed | Status.Failed | Status.Canceled | Status.Canceling;
    namespace Status {
        type Pending = 'pending';
        type Working = 'working';
        type Canceling = 'canceling';
        type Completed = 'completed';
        type Failed = 'failed';
        type Canceled = 'canceled';
        const PENDING: Pending;
        const WORKING: Working;
        const CANCELING: Canceling;
        const COMPLETED: Completed;
        const FAILED: Failed;
        const CANCELED: Canceled;
    }
    type Event = Event.Update | Event.Start | Event.Execute | Event.Interval | Event.Cancel | Event.Error | Event.Finish;
    namespace Event {
        type Update = 'update';
        type Start = 'start';
        type Execute = 'execute';
        type Interval = 'interval';
        type Cancel = 'cancel';
        type Complete = 'complete';
        type Error = 'error';
        type Finish = 'finish';
        type Destroy = 'destroy';
        const UPDATE: Update;
        const START: Start;
        const EXECUTE: Execute;
        const INTERVAL: Interval;
        const CANCEL: Cancel;
        const COMPLETE: Complete;
        const ERROR: Error;
        const FINISH: Finish;
        const DESTROY: Destroy;
    }
}
