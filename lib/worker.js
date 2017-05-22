"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const util = require("util");
const utils = require("./utils");
// overwrite __extends of typescrpt helper function
const __extends = util.inherits;
class Worker extends events_1.EventEmitter {
    /**
     * @constructor
     * @param {Object} [options]
     * @param {number} [options.size=0]
     */
    constructor(options = {}) {
        super();
        this.queue = [];
        this.workings = [];
        this.preparings = [];
        this.immediate = null;
        options = Object.assign({ size: 0 }, options);
        this.setSize(options.size || 0);
    }
    /**
     * @return {number}
     */
    getSize() {
        return this.size;
    }
    /**
     * @return {number}
     */
    setSize(size) {
        if (!Number.isFinite(size)) {
            throw new TypeError(`invalid parameter. [size: number]: ${typeof size}`);
        }
        this.size = size;
    }
    /**
     * @return {Worker~Batchable[]}
     */
    getPreparingItems() {
        return this.preparings.slice();
    }
    /**
     * @return {Worker~Batchable[]}
     */
    getWorkingItems() {
        return this.workings.slice();
    }
    /**
     * @return {Worker.Batchable[]}
     */
    getQueuedItems() {
        return this.queue.slice();
    }
    /**
     * @param {Worker.Executable|Worker.Executable[]} itemOrItems
     */
    invoke(itemOrItems) {
        let isQueued = false;
        utils.normalizeArray(itemOrItems).forEach((item) => {
            if (item && (item.execute instanceof Function)) {
                this.queue.push(item);
                this.emit(Worker.Event.REGISTER, item);
                isQueued = true;
            }
        });
        if (isQueued)
            this.prepare();
    }
    /** */
    prepare() {
        if (this.queue.length == 0)
            return;
        if (this.size == 0 || this.size > this.preparings.length + this.workings.length) {
            this.queue.slice().forEach(() => {
                if (this.size != 0 && this.size <= this.preparings.length + this.workings.length) {
                    return false;
                }
                this.preparings.push(this.queue.shift());
            });
        }
        if (this.immediate == undefined && this.preparings.length > 0) {
            this.immediate = setImmediate(() => {
                this.preparings.forEach((item) => {
                    this.execute(item);
                });
                this.immediate = null;
            });
        }
    }
    /**
     * @param {Worker.Executable} item
     * @return {Promise<void>}
     */
    execute(item) {
        let error;
        return Promise.resolve().then(() => {
            this.emit(Worker.Event.OPEN, item);
            utils.drop(item, this.preparings);
            this.workings.push(item);
            if (item.execute instanceof Function) {
                return item.execute();
            }
            else {
                throw new TypeError(`received parameter does not have '.execute()' Function. [item: Worker~Batchable]: ${typeof item}`);
            }
        }).catch((err) => {
            utils.readyErrorHandling(this);
            try {
                this.emit(Worker.Event.ERROR, err);
            }
            catch (exception) {
                error = exception;
            }
        }).then(() => {
            utils.drop(item, this.preparings);
            utils.drop(item, this.workings);
            this.emit(Worker.Event.CLOSE, item);
            if (error)
                throw error;
        }).catch((err) => {
            utils.readyErrorHandling(this);
            this.emit(Worker.Event.ERROR, err);
            throw err;
        }).then(() => {
            this.prepare();
        }, (err) => {
            this.prepare();
            throw err;
        });
    }
    /**
     * @param {Worker.Executable} item
     */
    remove(item) {
        if (this.workings.indexOf(item) > -1) {
            if (item.cancel instanceof Function) {
                item.cancel();
            }
        }
        else if (this.preparings.indexOf(item) > -1) {
            utils.drop(item, this.preparings);
            this.prepare();
            if (this.preparings.length == 0 && this.immediate != undefined) {
                clearImmediate(this.immediate);
                this.immediate = null;
            }
        }
        else {
            utils.drop(item, this.queue);
        }
    }
    /**
     * @return {Promise<void>}
     */
    destroy() {
        this.emit(Worker.Event.DESTROY);
        clearImmediate(this.immediate);
        this.immediate = null;
        const promises = [];
        this.workings.slice().forEach((item) => {
            if (item.destroy instanceof Function) {
                promises.push(item.destroy());
            }
            utils.drop(item, this.workings);
        });
        this.preparings.slice().forEach((item) => {
            if (item.destroy instanceof Function) {
                promises.push(item.destroy());
            }
            utils.drop(item, this.preparings);
        });
        this.queue.slice().forEach((item) => {
            if (item.destroy instanceof Function) {
                promises.push(item.destroy());
            }
            utils.drop(item, this.queue);
        });
        return Promise.all(promises);
    }
}
exports.Worker = Worker;
(function (Worker) {
    var Event;
    (function (Event) {
        Event.REGISTER = 'register';
        Event.OPEN = 'open';
        Event.ERROR = 'error';
        Event.CLOSE = 'close';
        Event.DESTROY = 'destroy';
    })(Event = Worker.Event || (Worker.Event = {}));
})(Worker = exports.Worker || (exports.Worker = {}));
//# sourceMappingURL=worker.js.map