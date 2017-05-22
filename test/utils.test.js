

const {EventEmitter} = require('events');
const assert = require('assert');
const utils = require('../lib/utils');

describe('utils', () => {
  describe('.drop', () => {
    it('should drop item from array', () => {
      const arr = [1,2,3,4];
      utils.drop(1, arr);
      assert.deepEqual([2,3,4], arr);
    });
    it('should nothing to do when item is not in array.', () => {
      const arr = [1,2,3,4];
      utils.drop(5, arr);
      assert.deepEqual([1,2,3,4], arr);
    });
  });
  describe('.readyErrorHandling', () => {
    it('should handle error events', () => {
      const emitter = new EventEmitter();
      assert.throws(() => {
        emitter.emit('error');
      }, Error)
      utils.readyErrorHandling(emitter);
      emitter.emit('error');
    });
    it('should nothing to do when handle error evetns', () => {
      const emitter = new EventEmitter();
      emitter.on('error', () => {});
      emitter.emit('error');
      utils.readyErrorHandling(emitter);
      emitter.emit('error');
    });
    it('should throw exception when receive invalid parameter.', () => {
      assert.throws(() => {
        utils.readyErrorHandling('emitter');
      }, TypeError);
    });
  });
  describe('.normalizeArray', () => {
    it('should return received value that it is put in array when does not receive Arrayable parameter ', () => {
      assert.deepEqual([1], utils.normalizeArray(1))
    });
    it('should return empty array when receive nillable value', () => {
      assert.deepEqual([], utils.normalizeArray())
    });
    it('should return received value when receive array parameter', () => {
      assert.deepEqual([1,2,3,4], utils.normalizeArray([1,2,3,4]))
    });
  });
  describe('.isObject', () => {
    it('should return true when receive object value', () => {
      assert.ok(utils.isObject({}));
    });
    it('should return false when receive invalid parameter', () => {
      assert.ok(!utils.isObject([]));
    });
  });
});
