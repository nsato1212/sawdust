'use strict';

const {EventEmitter} = require('events');
const assert = require('assert');
const {Worker, Command} = require('../lib');

describe('Worker', () => {
  describe('#constructor', () => {
    it('should inherits EventEmitter and construct worker instance', () => {
      const worker = new Worker();
      assert.equal(true, worker instanceof EventEmitter);
      assert.equal(true, worker instanceof Worker);
      assert.equal(0, worker.getSize());
    });
    it('should construct with options', () => {
      const worker = new Worker({size: 3});
      assert.equal(3, worker.getSize());
    });
  });
  describe('#getSize', () => {
    it('should return number value', () => {
      const worker = new Worker();
      assert.equal(0, worker.getSize());
    });
  });
  describe('#setSize', () => {
    it('should overwrite size value', () => {
      const worker = new Worker();
      assert.equal(0, worker.getSize());
      worker.setSize(3);
      assert.equal(3, worker.getSize());
    });
    it('should throw TypeError exception when receive invalid type value', () => {
      const worker = new Worker();
      assert.throws(() => {
        worker.setSize();
      }, TypeError)
    });
  });
  describe('#getPreparingItems', () => {
    it('should return prepared items', () => {
      var worker = new Worker();
      assert.deepEqual([], worker.getPreparingItems());
    });
  });
  describe('#getWorkingItems', () => {
    it('should return working items', () => {
      var worker = new Worker();
      assert.deepEqual([], worker.getWorkingItems());
    });
  });
  describe('#getQueuedItems', () => {
    it('should return working items', () => {
      var worker = new Worker();
      assert.deepEqual([], worker.getQueuedItems());
    });
  });

  describe('#invoke', () => {
    it('should invoke item in worker', () => {
      var worker = new Worker({size: 1});
      var firstItem = new Command('first lazy command');
      var secondItem = new Command('second lazy command');
      worker.invoke(firstItem);
      worker.invoke(secondItem);
      assert.deepEqual([], worker.getWorkingItems());
      assert.deepEqual([firstItem], worker.getPreparingItems());
      assert.deepEqual([secondItem], worker.getQueuedItems());
      return new Promise((resolve, reject) => {
        worker.once(Worker.Event.OPEN, () => {
          try {
            assert.deepEqual([], worker.getWorkingItems());
            assert.deepEqual([firstItem], worker.getPreparingItems());
            assert.deepEqual([secondItem], worker.getQueuedItems());
          } catch(e) {
            reject(e);
          }
        });
        firstItem.on(Command.Event.START, () => {
          try {
            assert.deepEqual([firstItem], worker.getWorkingItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([secondItem], worker.getQueuedItems());
          } catch(e) {
            reject(e);
          }
        });
        firstItem.on(Command.Event.FINISH, () => {
          try {
            assert.deepEqual([firstItem], worker.getWorkingItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([secondItem], worker.getQueuedItems());
          } catch(e) {
            reject(e);
          }
          worker.once(Worker.Event.CLOSE, () => {
            try {
              assert.deepEqual([], worker.getWorkingItems());
              assert.deepEqual([], worker.getPreparingItems());
              assert.deepEqual([secondItem], worker.getQueuedItems());
            } catch(e) {
              reject(e);
            }
          });
          worker.once(Worker.Event.OPEN, () => {
            try {
              assert.deepEqual([], worker.getWorkingItems());
              assert.deepEqual([secondItem], worker.getPreparingItems());
              assert.deepEqual([], worker.getQueuedItems());
            } catch(e) {
              reject(e);
            }
          });
        });
        secondItem.on(Command.Event.START, () => {
          try {
            assert.deepEqual([secondItem], worker.getWorkingItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([], worker.getQueuedItems());
          } catch(e) {
            reject(e);
          }
        });
        secondItem.on(Command.Event.FINISH, () => {
          try {
            assert.deepEqual([secondItem], worker.getWorkingItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([], worker.getQueuedItems());
          } catch(e) {
            reject(e);
          }
          worker.once(Worker.Event.CLOSE, () => {
            try {
              assert.deepEqual([], worker.getWorkingItems());
              assert.deepEqual([], worker.getPreparingItems());
              assert.deepEqual([], worker.getQueuedItems());
              resolve();
            } catch(e) {
              reject(e);
            }
          });
        })
      });
    });
    it('should exclude item when receive invalid item', () => {
      const worker = new Worker();
      worker.invoke('command');
      assert.deepEqual([], worker.getQueuedItems());
      assert.deepEqual([], worker.getPreparingItems());
      assert.ok(worker.immediate == null);
    });
  });

  describe('#invoke', () => {
    it('should complete exection.', () => {
      var worker = new Worker();
      const command = new Command('lazy command');
      return worker.execute(command);
    });
    it('should fail exection when command did not have \'.execute()\' Function.', () => {
      var worker = new Worker();
      return worker.execute({}).then(() => {
        return new Error('test is failed');
      }, (err) => {
        assert.throws(() => {
          throw err;
        }, /test is failed/);
      });
    });
    it('should fail exection when worker happen error in handling of errors', () => {
      var worker = new Worker();
      worker.once(Worker.Event.ERROR, () => {
        throw new Error('error handling has been failed.');
      });
      return worker.execute({}).then(() => {
        return new Error('test is failed');
      }, (err) => {
        assert.throws(() => {
          throw err;
        }, /error handling has been failed\./);
      });
    });
  });
  describe('#remove', () => {
    it('should remove item from queue', () => {
      var worker = new Worker({size: 1});
      var firstItem = new Command('lazy command');
      var secondItem = {execute: () => {}};
      worker.invoke([firstItem, secondItem]);
      assert.deepEqual([secondItem], worker.getQueuedItems());
      worker.remove(secondItem);
      assert.deepEqual([], worker.getQueuedItems());
      return new Promise((resolve, reject) => {
        worker.on(Worker.Event.CLOSE, (item) => {
          try {
            assert.deepEqual([], worker.getQueuedItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([], worker.getWorkingItems());
            assert.equal(firstItem, item);
            resolve();
          } catch(e) {
            reject(e);
          }
        });
      });
    });
    it('should remove all item from prepared list', () => {
      var worker = new Worker();
      var firstItem = {execute: () => {}};
      var secondItem = {execute: () => {}};
      worker.invoke([firstItem, secondItem]);
      assert.deepEqual([firstItem, secondItem], worker.getPreparingItems());
      worker.remove(firstItem);
      assert.deepEqual([secondItem], worker.getPreparingItems());
      worker.remove(secondItem);
      return new Promise((resolve, reject) => {
        worker.on(Worker.Event.CLOSE, (item) => {
          reject(item);
        });
        setTimeout(() => {
          resolve();
        }, 100);
      });
    });
    it('should remove item from prepared list', () => {
      var worker = new Worker();
      var firstItem = {execute: () => {}};
      var secondItem = {execute: () => {}};
      worker.invoke([firstItem, secondItem]);
      assert.deepEqual([firstItem, secondItem], worker.getPreparingItems());
      worker.remove(firstItem);
      assert.deepEqual([secondItem], worker.getPreparingItems());
      return new Promise((resolve, reject) => {
        worker.on(Worker.Event.CLOSE, (item) => {
          try {
            assert.deepEqual([], worker.getQueuedItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([], worker.getWorkingItems());
            assert.equal(secondItem, item);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
    it('should remove item from working list when item have .cancel() property', () => {
      const worker = new Worker();
      return new Promise((resolve, reject) => {
        var firstItem = {
          execute: function() {
            return new Promise((innerResolve) => {
              this.timeId = setTimeout(() => {
                reject('timeout');
              }, 400);
              setTimeout(() => {
                innerResolve();
              }, 600);
            });
          }
        };
        var secondItem = {
          execute: function() {
            return new Promise((innerResolve) => {
              this.timeId = setTimeout(() => {
                reject('timeout');
              }, 300);
              setTimeout(() => {
                innerResolve();
              }, 500);
            });
          },
          cancel: function() {
            clearTimeout(this.timeId);
            clearTimeout(firstItem.timeId);
          }
        };
        worker.invoke([firstItem, secondItem]);
        assert.deepEqual([firstItem, secondItem], worker.getPreparingItems());
        worker.on(Worker.Event.CLOSE, (item) => {
          try {
            assert.deepEqual([], worker.getQueuedItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([firstItem], worker.getWorkingItems());
            assert.equal(secondItem, item);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
        setTimeout(() => {
          worker.remove(secondItem);
        }, 200);
      });
    });
    it('should remove item from working list when item did not have .cancel() property', () => {
      const worker = new Worker();
      const item = {
        execute: () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 200);
          });
        }
      };
      worker.invoke(item);
      setTimeout(() => {
        worker.remove(item);
      }, 100);
      return new Promise((resolve) => {
        worker.on(Worker.Event.CLOSE, (item) => {
          try {
            resolve();
          } catch(e) {
            reject(e);
          }
        });
      });
    });
  });
  describe('#destroy', () => {
    it('should destroy for worker when item have .destroy() property', () => {
      const worker = new Worker({size: 2});
      const execItem = new Command('exection item');
      execItem.addTask(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 200);
        });
      });
      const preparingItem = new Command('preparing item');
      const queuedItem = new Command('queued item');
      worker.invoke(execItem);

      return new Promise((resolve) => {

        setTimeout(() => {
          worker.invoke([preparingItem, queuedItem]);
          assert.deepEqual([execItem], worker.getWorkingItems());
          assert.deepEqual([preparingItem], worker.getPreparingItems());
          assert.deepEqual([queuedItem], worker.getQueuedItems());
          worker.destroy().then(() => {
            assert.deepEqual([], worker.getWorkingItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([], worker.getQueuedItems());
            resolve();
          });
        }, 100);
      });
    });
    it('should destroy for worker when item does not have .destroy() property', () => {
      const worker = new Worker({size: 2});
      const execItem = {
        execute: () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 200);
          });
        }
      };
      const preparingItem = {execute: () => {}};
      const queuedItem = {execute: () => {}};
      worker.invoke(execItem);

      return new Promise((resolve) => {

        setTimeout(() => {
          worker.invoke([preparingItem, queuedItem]);
          assert.deepEqual([execItem], worker.getWorkingItems());
          assert.deepEqual([preparingItem], worker.getPreparingItems());
          assert.deepEqual([queuedItem], worker.getQueuedItems());
          worker.destroy().then(() => {
            assert.deepEqual([], worker.getWorkingItems());
            assert.deepEqual([], worker.getPreparingItems());
            assert.deepEqual([], worker.getQueuedItems());
            resolve();
          });
        }, 100);
      });
    });
  });
});
