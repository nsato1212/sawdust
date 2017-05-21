"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const util = require("util");
const report_1 = require("./report");
const utils = require("./utils");
// overwrite __extends of typescrpt helper function
const __extends = util.inherits;
class Command extends events_1.EventEmitter {
    constructor(name, params) {
        super();
        if (utils.isObject(name)) {
            params = name;
            name = null;
        }
        if (name != undefined && typeof name !== 'string') {
            throw new TypeError(`invalid parameter. [name: string]: ${typeof name}`);
        }
        if (params != undefined && !utils.isObject(params)) {
            throw new TypeError(`invalid parameter. [params: object]: ${typeof params}`);
        }
        this.name = name;
        this.tasks = [];
        this.report = new report_1.Report(params);
        this.interruptions = new events_1.EventEmitter();
        this.update({ status: Command.Status.PENDING });
    }
    /**
     * @return {string}
     */
    getName() {
        return this.name;
    }
    /**
     * @return {string}
     */
    getStatus() {
        return this.status;
    }
    /**
     * @return {string}
     */
    getMessage() {
        return this.message;
    }
    /**
     * @return {Error}
     */
    getError() {
        return this.error;
    }
    /**
     * @return {Report}
     */
    getReport() {
        return this.report;
    }
    /**
     * @return {boolean}
     */
    hasError() {
        return this.getError() ? true : false;
    }
    /**
     * return true if this status is 'pending'
     * @return {boolean}
     */
    isPending() {
        return this.getStatus() === Command.Status.PENDING;
    }
    /**
     * return true if this status is 'working'
     * @return {boolean}
     */
    isWorking() {
        return this.getStatus() === Command.Status.WORKING;
    }
    /**
     * return true if this status is 'canceling'
     * @return {boolean}
     */
    isCanceling() {
        return this.getStatus() === Command.Status.CANCELING;
    }
    /**
     * return true if this status is 'completed'
     * @return {boolean}
     */
    isCompleted() {
        return this.getStatus() === Command.Status.COMPLETED;
    }
    /**
     * return true if this status is 'failed'
     * @return {boolean}
     */
    isFailed() {
        return this.getStatus() === Command.Status.FAILED;
    }
    /**
     * return true if this status is 'canceled'
     * @return {boolean}
     */
    isCanceled() {
        return this.getStatus() === Command.Status.CANCELED;
    }
    /**
     * return true if this status is 'working' or 'canceling'
     * @return {boolean}
     */
    isRunning() {
        return this.isWorking() || this.isCanceling();
    }
    /**
     * return true if this status is 'failed', 'completed' or 'canceled'
     * @return {boolean}
     */
    isFinished() {
        return this.isCompleted() || this.isFailed() || this.isCanceled();
    }
    /**
     * update any parameters, and trigger events with 'Update'
     * @param {Props} [props]
     * @param {Props.name} [string] - name
     * @param {Props.status} [string] - status
     * @param {Props.message} [string] - message
     */
    update(props) {
        props = typeof props === 'object' ? props : {};
        if (props.hasOwnProperty('name'))
            this.name = props.name;
        if (props.hasOwnProperty('status'))
            this.status = props.status;
        if (props.hasOwnProperty('message'))
            this.message = props.message;
        if (props.hasOwnProperty('error'))
            this.error = props.error;
        this.emit(Command.Event.UPDATE);
    }
    /**
     * @param {Command~Task} task
     * @return {Command}
     */
    addTask(task) {
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
    reserve(name, interrupt) {
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
    revoke(name) {
        if (typeof name !== 'string') {
            throw new TypeError(`invalid parameter. [name: string]: ${typeof name}`);
        }
        this.interruptions.removeAllListeners(name);
    }
    /**
     * @param {string} name
     */
    interrupt(name) {
        if (typeof name !== 'string') {
            throw new TypeError(`invalid parameter. [name: string]: ${typeof name}`);
        }
        if (name === 'error')
            utils.readyErrorHandling(this.interruptions);
        this.interruptions.emit(name);
    }
    /**
     * @return {(string|symbol)[]}
     */
    getReservedNames() {
        return this.interruptions.eventNames();
    }
    /**
     * @return {Promise<void>}
     */
    execute() {
        return Promise.resolve().then(() => {
            if (this.isFinished())
                throw new Error(`task has been finished. [task]: ${this.getName()}`);
            return Promise.resolve().then(() => {
                this.update({ status: Command.Status.WORKING });
                const tasks = this.tasks.slice();
                tasks.forEach((errand) => {
                    if (typeof errand !== 'function') {
                        new TypeError(`invalid type. [job: function]: ${typeof errand}`);
                    }
                });
                this.emit(Command.Event.START);
                return new Promise((resolve, reject) => {
                    const done = (err) => (err ? reject(err) : resolve());
                    execute(this, tasks, done);
                });
            }).then((result) => {
                this.update({ status: Command.Status.COMPLETED });
                this.emit(Command.Event.COMPLETE);
            }).catch((err) => {
                if (err instanceof Command.Cancellaration) {
                    this.update({ status: Command.Status.CANCELED });
                }
                else {
                    this.update({ status: Command.Status.FAILED, error: err });
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
    cancel() {
        switch (this.getStatus()) {
            case Command.Status.PENDING:
                try {
                    this.update({ status: Command.Status.CANCELING });
                    this.emit(Command.Event.CANCEL);
                    this.update({ status: Command.Status.CANCELED });
                }
                catch (exception) {
                    this.update({ status: Command.Status.FAILED, error: exception });
                    utils.readyErrorHandling(this);
                    this.emit(Command.Event.ERROR, exception);
                }
                this.emit(Command.Event.FINISH);
                break;
            case Command.Status.WORKING:
                try {
                    this.update({ status: Command.Status.CANCELING });
                    this.emit(Command.Event.CANCEL);
                }
                catch (exception) {
                    this.update({ error: exception });
                }
                break;
        }
    }
    /**
     * @throws {Task.Cancellaration|Error} will throw an error if status is 'Canceling' or it is happened error
     */
    check() {
        if (this.hasError()) {
            throw this.getError();
        }
        else if (this.isCanceling()) {
            throw new Command.Cancellaration();
        }
    }
    /**
     * @return {Promise<void>}
     */
    destroy() {
        return new Promise((resolve, reject) => {
            this.emit(Command.Event.DESTROY);
            if (this.isFinished()) {
                resolve();
            }
            else {
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
exports.Command = Command;
function execute(command, tasks, done) {
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
        }
        else {
            done();
        }
    }
    catch (exception) {
        done(exception);
    }
}
(function (Command) {
    class Cancellaration {
    }
    Command.Cancellaration = Cancellaration;
    var Status;
    (function (Status) {
        Status.PENDING = 'pending';
        Status.WORKING = 'working';
        Status.CANCELING = 'canceling';
        Status.COMPLETED = 'completed';
        Status.FAILED = 'failed';
        Status.CANCELED = 'canceled';
    })(Status = Command.Status || (Command.Status = {}));
    var Event;
    (function (Event) {
        Event.UPDATE = 'update';
        Event.START = 'start';
        Event.EXECUTE = 'execute';
        Event.INTERVAL = 'interval';
        Event.CANCEL = 'cancel';
        Event.COMPLETE = 'complete';
        Event.ERROR = 'error';
        Event.FINISH = 'finish';
        Event.DESTROY = 'destroy';
    })(Event = Command.Event || (Command.Event = {}));
})(Command = exports.Command || (exports.Command = {}));
//# sourceMappingURL=command.js.map