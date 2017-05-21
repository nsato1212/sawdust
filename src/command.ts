
import {EventEmitter} from 'events';
import * as util from 'util';
import {Report} from './report';
import * as utils from './utils';

// overwrite __extends of typescrpt helper function
const __extends = util.inherits;

export class Command<T extends {}> extends EventEmitter {

  /**
   * @private
   * @param {string} name
   */
  private name: string;

  /**
   * @private
   * @member {string}
   */
  private status: Command.Status;

  /**
   * @private
   * @member {string}
   */
  private message: string;

  /**
   * @private
   * @member {Error} error
   */
  private error: Error;

  /**
   * @callback {Command~Task}
   * @return {void|Promise<void>}
   */
  /**
   * @private
   * @member {Command~Task[]}
   */
  private tasks: Array<Command.Task>;

  /**
   * @private
   * @member {Report}
   */
  private report: Report<T>;

  /**
   * @private
   * @member {events.EventEmitter}
   */
  private interruptions: EventEmitter;

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

  constructor(name: string|Partial<T>, params?: Partial<T>) {
    super();
    if (utils.isObject(name)) {
      params = name as {};
      name = null;
    }
    if (name != undefined && typeof name !== 'string') {
      throw new TypeError(`invalid parameter. [name: string]: ${typeof name}`);
    }
    if (params != undefined && !utils.isObject(params)) {
      throw new TypeError(`invalid parameter. [params: object]: ${typeof params}`);
    }
    this.name = name as string;
    this.tasks = [];
    this.report = new Report(params);
    this.interruptions = new EventEmitter();
    this.update({status: Command.Status.PENDING});
  }

  /**
   * @return {string}
   */
  getName(): string {
    return this.name;
  }

  /**
   * @return {string}
   */
  getStatus(): Command.Status {
    return this.status;
  }

  /**
   * @return {string}
   */
  getMessage(): string {
    return this.message;
  }

  /**
   * @return {Error}
   */
  getError(): Error {
    return this.error;
  }

  /**
   * @return {Report}
   */
  getReport(): Report<T> {
    return this.report;
  }

  /**
   * @return {boolean}
   */
  hasError(): boolean {
    return this.getError() ? true : false;
  }

  /**
   * return true if this status is 'pending'
   * @return {boolean}
   */
  isPending(): boolean {
    return this.getStatus() === Command.Status.PENDING;
  }

  /**
   * return true if this status is 'working'
   * @return {boolean}
   */
  isWorking(): boolean {
    return this.getStatus() === Command.Status.WORKING;
  }

  /**
   * return true if this status is 'canceling'
   * @return {boolean}
   */
  isCanceling(): boolean {
    return this.getStatus() === Command.Status.CANCELING;
  }

  /**
   * return true if this status is 'completed'
   * @return {boolean}
   */
  isCompleted(): boolean {
    return this.getStatus() === Command.Status.COMPLETED
  }

  /**
   * return true if this status is 'failed'
   * @return {boolean}
   */
  isFailed(): boolean {
    return this.getStatus() === Command.Status.FAILED;
  }

  /**
   * return true if this status is 'canceled'
   * @return {boolean}
   */
  isCanceled(): boolean {
    return this.getStatus() === Command.Status.CANCELED;
  }

  /**
   * return true if this status is 'working' or 'canceling'
   * @return {boolean}
   */
  isRunning(): boolean {
    return this.isWorking() || this.isCanceling();
  }

  /**
   * return true if this status is 'failed', 'completed' or 'canceled'
   * @return {boolean}
   */
  isFinished(): boolean {
    return this.isCompleted() || this.isFailed() || this.isCanceled();
  }

  /**
   * update any parameters, and trigger events with 'Update'
   * @param {Props} [props]
   * @param {Props.name} [string] - name
   * @param {Props.status} [string] - status
   * @param {Props.message} [string] - message
   */
  update(props?: Partial<Command.Props>): void {
    props = typeof props === 'object' ? props : {};
    if (props.hasOwnProperty('name')) this.name = props.name;
    if (props.hasOwnProperty('status')) this.status = props.status;
    if (props.hasOwnProperty('message')) this.message = props.message;
    if (props.hasOwnProperty('error')) this.error = props.error;
    this.emit(Command.Event.UPDATE);
  }

  /**
   * @param {Command~Task} task
   * @return {Command}
   */
  addTask(task: Command.Task): this {
    if (typeof task !== 'function') {
      throw new TypeError(`invalid parameter. [job: funciton]: ${typeof task}`);
    }
    this.tasks.push(task);
    return this;
  }

  /**
   * @param {string} name
   * @param {Command~Interruption} interrupt
   */
  reserve(name: string, interrupt: Command.Interruption): void {
    if (typeof name !== 'string') {
      throw new TypeError(`invalid parameter. [name: string]: ${typeof name}`);
    }
    if (typeof interrupt !== 'function') {
      throw new TypeError(`invalid parameter. [interrupt: function]: ${typeof interrupt}`);
    }
    this.interruptions.on(name, interrupt);
  }

  /**
   * @callback {Command~Interruption}
   */

  /**
   * @param {string} name
   */
  revoke(name: string): void {
    if (typeof name !== 'string') {
      throw new TypeError(`invalid parameter. [name: string]: ${typeof name}`);
    }
    this.interruptions.removeAllListeners(name);
  }

  /**
   * @param {string} name
   */
  interrupt(name: string): void {
    if (typeof name !== 'string') {
      throw new TypeError(`invalid parameter. [name: string]: ${typeof name}`);
    }
    if (name === 'error') utils.readyErrorHandling(this.interruptions);
    this.interruptions.emit(name);
  }

  /**
   * @return {(string|symbol)[]}
   */
  getReservedNames(): Array<string|symbol> {
    return this.interruptions.eventNames();
  }

  /**
   * @return {Promise<void>}
   */
  execute(): Promise<void> {
    return Promise.resolve().then(() => {
      if (this.isFinished()) throw new Error(`task has been finished. [task]: ${this.getName()}`);
      return Promise.resolve().then(() => {
        this.update({status: Command.Status.WORKING});
        const tasks = this.tasks.slice();
        tasks.forEach((errand) => {
          if (typeof errand !== 'function') {
            new TypeError(`invalid type. [job: function]: ${typeof errand}`);
          }
        });
        this.emit(Command.Event.START);
        return new Promise<void>((resolve, reject) => {
          const done = (err) => (err ?  reject(err) : resolve());
          execute(this, tasks, done);
        });
      }).then((result) => {
        this.update({status: Command.Status.COMPLETED});
        this.emit(Command.Event.COMPLETE);
      }).catch((err) => {
        if (err instanceof Command.Cancellaration) {
          this.update({status: Command.Status.CANCELED});
        } else {
          this.update({status: Command.Status.FAILED, error: err});
          utils.readyErrorHandling(this);
          this.emit(Command.Event.ERROR, err);
        }
      }).then(() => {
        this.emit(Command.Event.FINISH);
      });
    }).catch((err) => {
      utils.readyErrorHandling(this);
      this.emit(Command.Event.ERROR, err);
    });
  }

  /** */
  cancel(): void {
    switch (this.getStatus()) {
      case Command.Status.PENDING:
        try {
          this.update({status: Command.Status.CANCELING});
          this.emit(Command.Event.CANCEL);
          this.update({status: Command.Status.CANCELED});
        } catch(exception) {
          this.update({status: Command.Status.FAILED, error: exception});
          utils.readyErrorHandling(this);
          this.emit(Command.Event.ERROR, exception);
        }
        this.emit(Command.Event.FINISH);
        break;
      case Command.Status.WORKING:
        try {
          this.update({status: Command.Status.CANCELING});
          this.emit(Command.Event.CANCEL);
        } catch(exception) {
          this.update({error: exception});
        }
        break;
    }
  }

  /**
   * @throws {Task.Cancellaration|Error} will throw an error if status is 'Canceling' or it is happened error
   */
  check(): void {
    if (this.hasError()) {
      throw this.getError();
    } else if (this.isCanceling()) {
      throw new Command.Cancellaration();
    }
  }

  /**
   * @return {Promise<void>}
   */
  destroy(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.emit(Command.Event.DESTROY);
      if (this.isFinished()) {
        resolve();
      } else {
        this.once(Command.Event.FINISH, () => resolve());
        this.cancel();
      }
    }).catch().then(() => {
      this.name = null;
      this.status = null;
      this.message = null;
      this.error = null;
      this.tasks = null;
      this.interruptions.removeAllListeners();
      this.interruptions = null;
      this.report = null;
      this.removeAllListeners();
    });
  }
}

function execute(command: Command<any>, tasks: Array<Command.Task>, done: (err?) => void) {
  try {
    command.check();
    if (tasks.length > 0) {
      const errand = tasks.shift();
      command.emit(Command.Event.EXECUTE);
      Promise.resolve().then(() => {
        return errand();
      }).then(() => {
        command.emit(Command.Event.INTERVAL);
      }).then(() => {
        setImmediate(() => {
          execute(command, tasks, done);
        });
      }, (err) => {
        done(err);
      });
    } else {
      done();
    }
  } catch(exception) {
    done(exception);
  }
}

export namespace Command {

  export class Cancellaration {}

  export interface Props {
    name: string;
    message: string;
    status: Status;
    error: Error;
  }

  export type Task = () => void|Promise<void>;
  export type Interruption = () => void;

  export type Status = Status.Pending | Status.Working | Status.Completed | Status.Failed | Status.Canceled | Status.Canceling;
  export namespace Status {
    export type Pending = 'pending';
    export type Working = 'working';
    export type Canceling = 'canceling';
    export type Completed = 'completed';
    export type Failed = 'failed';
    export type Canceled = 'canceled';

    export const PENDING: Pending = 'pending';
    export const WORKING: Working = 'working';
    export const CANCELING: Canceling = 'canceling';
    export const COMPLETED: Completed = 'completed';
    export const FAILED: Failed = 'failed';
    export const CANCELED: Canceled = 'canceled';
  }

  export type Event = Event.Update|Event.Start|Event.Execute|Event.Interval|Event.Cancel|Event.Error|Event.Finish;
  export namespace Event {
    export type Update = 'update';
    export type Start = 'start';
    export type Execute = 'execute';
    export type Interval = 'interval'
    export type Cancel = 'cancel';
    export type Complete = 'complete';
    export type Error = 'error';
    export type Finish = 'finish';
    export type Destroy = 'destroy';

    export const UPDATE: Update = 'update';
    export const START: Start = 'start';
    export const EXECUTE: Execute = 'execute';
    export const INTERVAL: Interval = 'interval'
    export const CANCEL: Cancel = 'cancel';
    export const COMPLETE: Complete = 'complete';
    export const ERROR: Error = 'error';
    export const FINISH: Finish = 'finish';
    export const DESTROY: Destroy = 'destroy';
  }
}
