"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const _isPlainObject = require("lodash.isplainobject");
function drop(item, arr) {
    const index = arr.indexOf(item);
    if (index > -1) {
        arr.splice(index, 1);
    }
}
exports.drop = drop;
function readyErrorHandling(emitter) {
    if (!(emitter instanceof events_1.EventEmitter))
        throw new TypeError(`invalid parameter. [emitter: EventEmitter]: ${typeof emitter}`);
    const eventName = 'error';
    if (emitter.listenerCount(eventName) == 0) {
        emitter.once(eventName, () => { });
    }
}
exports.readyErrorHandling = readyErrorHandling;
function normalizeArray(value) {
    let result;
    if (value == undefined) {
        result = [];
    }
    else if (!(value instanceof Array)) {
        result = [value];
    }
    else {
        result = value;
    }
    return result;
}
exports.normalizeArray = normalizeArray;
function isObject(value) {
    return _isPlainObject(value);
}
exports.isObject = isObject;
//# sourceMappingURL=utils.js.map