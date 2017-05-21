
import {EventEmitter} from 'events';
import * as _isPlainObject from 'lodash.isplainobject';

export function drop(item: any, arr: Array<any>): void {
  const index = arr.indexOf(item);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

export function readyErrorHandling(emitter: EventEmitter): void {
  if (!(emitter instanceof EventEmitter)) throw new TypeError(`invalid parameter. [emitter: EventEmitter]: ${typeof emitter}`);
  const eventName = 'error';
  if (emitter.listenerCount(eventName) == 0) {
    emitter.once(eventName, () => {});
  }
}

export function normalizeArray<T>(value: T|Array<T>): Array<T> {
  let result: Array<T>;
  if (value == undefined) {
    result = [];
  } else if (!(value instanceof Array)) {
    result = [value];
  } else {
    result = value;
  }
  return result;
}

export function isObject(value: any): value is Object {
  return _isPlainObject(value);
}
