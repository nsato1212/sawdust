'use strict';

const assert = require('assert');
const {EventEmitter} = require('events');
const {Command, Report} = require('../lib');

describe('Command', () => {

  describe('#constructor', () => {
    it('should construct Command instance even if did not receive any parameter', () => {
      var command = new Command();
      assert.ok(command instanceof Command);
      assert.ok(command instanceof EventEmitter);
      assert.equal(null, command.getName());
    });
    it('should construct Command instance with name value', () => {
      var name = 'lany command';
      var command = new Command(name);
      assert.ok(command instanceof Command);
      assert.ok(command instanceof EventEmitter);
      assert.equal(name, command.getName());
    });
    it('should construct Command instance with name value', () => {
      var name = 'lany command';
      var command = new Command(name);
      assert.ok(command instanceof Command);
      assert.ok(command instanceof EventEmitter);
      assert.equal(name, command.getName());
    });
    it('should construct Command instance with initial report props', () => {
      var props = {result: ''};
      var command = new Command(props);
      assert.ok(command instanceof Command);
      assert.ok(command instanceof EventEmitter);
      assert.equal(null, command.getName());
      assert.equal(props.result, command.getReport().get('result'));
    });
    it('should construct Command instance with name value and initail report props', () => {
      var name = 'lazy command';
      var props = {result: ''};
      var command = new Command(name, props);
      assert.ok(command instanceof Command);
      assert.ok(command instanceof EventEmitter);
      assert.equal(name, command.getName());
      assert.equal(props.result, command.getReport().get('result'));
    });
    it('should throw TypeError when receive name as invalid type', () => {
      var name = 1000;
      var props = {result: ''};
      assert.throws(() => {
        var command = new Command(name, props);
      }, TypeError);
    });
    it('should throw TypeError when receive initial report prop as invalid type', () => {
      var name = 'lazy command';
      var props = [''];
      assert.throws(() => {
        var command = new Command(name, props);
      }, TypeError);
    });
  });

  describe('#getName', () => {
    it('should return "lazy command"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      assert.equal(name, command.getName());
    });
  });

  describe('#getStatus', () => {
    it('should return "pending" when Command is constructed after', () => {
      var name = 'lazy command';
      var command = new Command(name);
      assert.equal(Command.Status.PENDING, command.getStatus());
    });
    it('should return "working" when Command is executing', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.addTask(() => {});
      command.on(Command.Event.EXECUTE, () => {
        assert.equal(Command.Status.WORKING, command.getStatus());
      });
      return command.execute();
    });
    it('should return "canceling" if it executed cancel method when status is in "working"', () => {
      var name = 'delay command';
      var command = new Command(name);
      var timeId;
      command.addTask(() => {
        return new Promise((resolve, reject) => {
          timeId = setTimeout(() => {
            reject(new Error('unexpected error'));
          }, 250);
          setTimeout(() => {
            resolve();
          }, 500);
        });
      });
      command.addTask(() => {
        throw new Error('unexpected error');
      });
      command.on(Command.Event.CANCEL, () => {
        assert.equal(Command.Status.CANCELING, command.getStatus());
        clearTimeout(timeId);
      });
      setTimeout(() => {
        command.cancel();
      }, 100);
      return command.execute();
    });

    it('should return "completed" when it is completed to all job process in the command', () => {
      var name = 'delay command';
      var command = new Command(name);
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(Command.Status.COMPLETED, command.getStatus());
      });
    });

    it('should return "canceled" when after finished canceling process', () => {
      var name = 'delay command';
      var command = new Command(name);
      let timeId;
      command.addTask(() => {
        return new Promise(function(resolve,reject) {
          timeId = setTimeout(() => {
            reject(new Error('unexpected error'));
          }, 300);
          setTimeout(() => {
            resolve();
          }, 500);
        });
      });
      command.addTask(() => {
        throw new Error('unexpected error');
      });
      command.on(Command.Event.CANCEL, () => {
        assert.equal(Command.Status.CANCELING, command.getStatus());
        clearTimeout(timeId);
      });
      setTimeout(() => {
        command.cancel();
      }, 200);
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(Command.Status.CANCELED, command.getStatus());
      });
    });

    it('should return "faild" when job process in the command was failed', () => {
      var name = 'delay command';
      var command = new Command(name);
      command.addTask(() => {
        throw new Error('chop');
      });
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(Command.Status.FAILED, command.getStatus());
      });
    })
  });

  describe('#getMessage', () => {
    it('should return undefined', () => {
      var name = 'lazy command';
      var command = new Command(name);
      assert.equal(undefined, command.getMessage());
    });
    it('should return stored message when command has message', () => {
      var name = 'lazy command';
      var command = new Command(name);
      var message = 'message';
      command.update({message: message});
      assert.equal(message, command.getMessage());
    });
  });

  describe('#getReport', () => {
    it('should return Report instance', () => {
      var name = 'lazy command';
      var command = new Command(name);
      assert.ok(command.getReport() instanceof Report);
    });
  });

  describe('#isPending', () => {
    it('should return true if status is "pending"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      assert.equal(true, command.isPending());
    });
    it('should return false if status is not "pending"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.WORKING});
      assert.equal(false, command.isPending());
    });
  });

  describe('#isWorking', () => {
    it('should return true if status is "working"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.WORKING});
      assert.equal(true, command.isWorking());
    });
    it('should return false if status is not "working"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.CANCELING});
      assert.equal(false, command.isWorking());
    });
  });

  describe('#isCanceling', () => {
    it('should return true if status is "canceling"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.CANCELING});
      assert.equal(true, command.isCanceling());
    });
    it('should return false if status is not "canceling"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.COMPLETED});
      assert.equal(false, command.isCanceling());
    });
  });

  describe('#isCompleted', () => {
    it('should return true if status is "completed"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.COMPLETED});
      assert.equal(true, command.isCompleted());
    });
    it('should return false if status is not "completed"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.CANCELED});
      assert.equal(false, command.isCompleted());
    });
  });

  describe('#isFailed', () => {
    it('should return true if status is "failed"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.FAILED});
      assert.equal(true, command.isFailed());
    });
    it('should return false if status is not "failed"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.PENDING});
      assert.equal(false, command.isFailed());
    });
  });

  describe('#isCanceled', () => {
    it('should return true if status is "canceled"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.CANCELED});
      assert.equal(true, command.isCanceled());
    });
    it('should return false if status is not "canceled"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.FAILED});
      assert.equal(false, command.isCanceled());
    });
  });

  describe('#isRunning', () => {
    it('should return true if the status is "working" or "canceling"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.WORKING});
      assert.equal(true, command.isRunning());
      command.update({status: Command.Status.CANCELING});
      assert.equal(true, command.isRunning());
    });
    it('should return false if the status is other than "working" or "canceling"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.PENDING});
      assert.equal(false, command.isRunning());
      command.update({status: Command.Status.COMPLETED});
      assert.equal(false, command.isRunning());
      command.update({status: Command.Status.FAILED});
      assert.equal(false, command.isRunning());
      command.update({status: Command.Status.CANCELED});
      assert.equal(false, command.isRunning());
    });
  });

  describe('#isFinished', () => {
    it('should return true if the status is "completed", "failed" or "canceled"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.COMPLETED});
      assert.equal(true, command.isFinished());
      command.update({status: Command.Status.FAILED});
      assert.equal(true, command.isFinished());
      command.update({status: Command.Status.CANCELED});
      assert.equal(true, command.isFinished());
    });
    it('should return false if the status is other than "completed", "failed" or "canceled"', () => {
      var name = 'lazy command';
      var command = new Command(name);
      command.update({status: Command.Status.PENDING});
      assert.equal(false, command.isFinished());
      command.update({status: Command.Status.WORKING});
      assert.equal(false, command.isFinished());
      command.update({status: Command.Status.CANCELING});
      assert.equal(false, command.isFinished());
    });
  });

  describe('#update', () => {
    it('should update stored name with name value in object', () => {
      var name = 'lazy command';
      var updated = 'more lazy command';
      var command = new Command(name);
      assert.equal(name, command.getName());
      command.update({name: updated});
      assert.equal(updated, command.getName());
    });
    it('should update stored status with status value in object', () => {
      var name = 'lazy command';
      var updated = '..zzZZ';
      var command = new Command(name);
      assert.equal(Command.Status.PENDING, command.getStatus());
      command.update({status: updated});
      assert.equal(updated, command.getStatus());
    });
    it('should update stored message with message value in object', () => {
      var name = 'lazy command';
      var updated = 'I am tired';
      var command = new Command(name);
      assert.equal(undefined, command.getMessage());
      command.update({message: updated});
      assert.equal(updated, command.getMessage());
    });
    it('should finish without doing anything when receive invalid parameter', () => {
      var name = 'lazy command';
      var command = new Command(name);
      assert.equal(name, command.getName());
      assert.equal(Command.Status.PENDING, command.getStatus());
      assert.equal(undefined, command.getMessage());
      command.update('T+..+T');
      assert.equal(name, command.getName());
      assert.equal(Command.Status.PENDING, command.getStatus());
      assert.equal(undefined, command.getMessage());
    });
    it('should finish without doing anything when received parameter is nothing', () => {
      var name = 'lazy command';
      var command = new Command(name);
      assert.equal(name, command.getName());
      assert.equal(Command.Status.PENDING, command.getStatus());
      assert.equal(undefined, command.getMessage());
      command.update();
      assert.equal(name, command.getName());
      assert.equal(Command.Status.PENDING, command.getStatus());
      assert.equal(undefined, command.getMessage());
    });
  });

  describe('#addTask', () => {
    it('should add job function to queue in command', () => {
      var command = new Command('command');
      command.addTask(() => {
        command.getReport().set('result', 1);
      });
    });
    it('should throw exception when receive invalid type parameter', () => {
      var command = new Command('delay command');
      assert.throws(() => {
        command.addTask('test');
      }, TypeError);
    });
  });

  describe('#reserve', () => {
    it('should reserve interrupt process', () => {
      var command = new Command('command');
      return new Promise(function(resolve) {
        command.reserve('done', () => {
          resolve();
        });
        command.interrupt('done');
      });
    });
    it('should throw exception when name is invalid type parameter', () => {
      var command = new Command('command');
      assert.throws(() => {
        command.reserve(100, () => {
          command.cancel();
        });
      }, TypeError);
    });
    it('should throw exception when interrupt is invalid type parameter', () => {
      var command = new Command('command');
      assert.throws(() => {
        command.reserve('cancel', {});
      }, TypeError);
      var command = new Command('command');
    });
  });

  describe('#revoke', () => {
    it('should revoke interrupt process', () => {
      var command = new Command('command');
      return new Promise(function(resolve, reject) {
        command.reserve('doneWithError', () => {
          reject(new Error('unexpected error'));
        });
        command.reserve('done', () => {
          resolve();
        });
        command.revoke('doneWithError');
        command.interrupt('doneWithError');
        command.interrupt('done');
      });
    });
    it('should throw exception when name is invalid type parameter', () => {
      var command = new Command('command');
      assert.throws(() => {
        command.revoke({});
      }, TypeError);
    });
  });

  describe('#interrupt', () => {
    it('should invoke reserved process', () => {
      var command = new Command('command');
      return new Promise(function(resolve) {
        command.reserve('done', () => {
          resolve();
        });
        command.interrupt('done');
      });
    });
    it('should invoke reserved process with name is "error"', () => {
      var command = new Command('error');
      command.interrupt('error');
      return new Promise(function(resolve) {
        command.reserve('error', () => {
          resolve();
        });
        command.interrupt('error');
      });
    });
    it('should throw exception then name is invalid type parameter', () => {
      var command = new Command('error');
      assert.throws(() => {
        command.interrupt({});
      }, TypeError);
    });
  });

  describe('#getReservedNames', () => {
    it('should return reserved names if reserve to Command', () => {
      var command = new Command('error');
      command.reserve('throws', () => {
        throw new Error('exception');
      })
      assert.deepEqual(['throws'], command.getReservedNames());
      command.revoke('throws');
      assert.deepEqual([], command.getReservedNames());
    });
  });

  describe('#execute', () => {
    it('should execute empty Command', () => {
      var command = new Command('empty command');
      return command.execute();
    });
    it('should execute command and status is going to "completed"', () => {
      var command = new Command('completed command');
      command.addTask(() => {
        command.getReport().set('result', 1);
      });
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(1, command.getReport().get('result'));
        assert.equal(Command.Status.COMPLETED, command.getStatus());
      });
    });
    it('should execute command and status is going to "canceled"', () => {
      var command = new Command('cancelled command');
      command.addTask(() => {
        return new Promise((resolve, reject) => {
          var timeId = setTimeout(() => {
            reject(new Error('unexpected error'));
          }, 300);
          command.getReport().set('timeId', timeId);
          setTimeout(() => {
            command.getReport().set('result', 1);
            resolve();
          }, 500);
        });
      }).addTask(() => {
        var timeId = command.getReport().set('timeId', null);
        reject(new Error('unexpected error'));
      });
      command.on(Command.Event.CANCEL, () => {
        var timeId = command.getReport().get('timeId');
        if (timeId) {
          clearTimeout(timeId);
        }
      });
      setTimeout(() => {
        command.cancel();
      }, 200);
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(true, command.getReport().get('timeId') != null);
        assert.equal(1, command.getReport().get('result'));
        assert.equal(Command.Status.CANCELED, command.getStatus());
      });

    });
    it('should failed process when appeded job is not function', () => {
      var command = new Command('failed command');
      command.tasks.push([]);
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(Command.Status.FAILED, command.getStatus());
      });
    });
    it('should failed process when throw error from job', () => {
      var command = new Command('failed command');
      command.addTask(() => {
        throw new Error('exception');
      });
      command.on(Command.Event.ERROR, function(err) {
        assert.ok(err instanceof Error);
      });
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(Command.Status.FAILED, command.getStatus());
      });
    });
    it('should failed process when execute finished job', () => {
      var command = new Command('failed command');
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(Command.Status.COMPLETED, command.getStatus());
        command.addTask(() => {
          command.getReport().set('result', 1);
        });
        return command.execute();
      }).then(() => {
        assert.equal(undefined, command.getReport().get('result'));
        assert.equal(Command.Status.COMPLETED, command.getStatus());
      });
    });
  });

  describe('#cancel', () => {
    it('should change status to "canceled" when command in "pending" execute cancel method', () => {
      var command = new Command("cancel command");
      return new Promise(function(resolve, reject) {
        command.on(Command.Event.CANCEL, () => {
          assert.equal(Command.Status.CANCELING, command.getStatus());
        });
        command.on(Command.Event.ERROR, function(err) {
          reject(err);
        });
        command.on(Command.Event.FINISH, () => {
          try {
            assert.equal(Command.Status.CANCELED, command.getStatus());
            resolve();
          } catch(exception) {
            reject(exception);
          }
        });
        command.cancel();
      });
    });
    it('should change status to "failed" when command in "pending" throw error in cancel event', () => {
      var command = new Command("cancel command");
      return new Promise(function(resolve, reject) {
        command.on(Command.Event.CANCEL, () => {
          throw new Error('exception');
        });
        command.on(Command.Event.ERROR, function(err) {
          command.getReport().set('result', 1);
        });
        command.on(Command.Event.FINISH, () => {
          try {
            assert.equal(1, command.getReport().get('result'));
            assert.equal(Command.Status.FAILED, command.getStatus());
            resolve();
          } catch(exception) {
            reject(exception);
          }
        });
        command.cancel();
      });
    });
    it('should change status to "canceling" when command in "working" execute cancel method', () => {
      var command = new Command("cancel command");
      command.addTask(() => {
        return new Promise(function(resolve, reject) {
          var timeId = setTimeout(() => {
            reject(new Error('exception'));
          }, 300);
          command.getReport().set('timeId', timeId);
          setTimeout(() => {
            try {
              assert.equal(Command.Status.CANCELING, command.getStatus());
              resolve();
            } catch(exception) {
              reject(exception);
            }
          }, 500);
        });
      });
      command.addTask(() => {
        command.getReport().set('timeId', null);
        throw new Error('exception');
      });
      command.on(Command.Event.CANCEL, () => {
        var timeId = command.getReport().get('timeId');
        if (timeId) {
          clearTimeout(timeId);
        } else {
          throw new Error('exception');
        }
      });
      return new Promise(function(resolve, reject) {
        command.on(Command.Event.ERROR, function(err) {
          reject(err);
        });
        setTimeout(() => {
          command.cancel();
        }, 200);
        command.execute().then(() => {
          assert.equal(Command.Status.CANCELED, command.getStatus());
          resolve();
        }, function(err) {
          reject(err);
        });
      })
    });
    it('should change status to "failed" when command in "working" throw error in cancel events', () => {
      var command = new Command("cancel command");
      command.addTask(() => {
        return new Promise(function(resolve, reject) {
          setTimeout(() => {
            try {
              assert.equal(Command.Status.CANCELING, command.getStatus());
              resolve();
            } catch(exception) {
              reject(exception);
            }
          }, 300);
        });
      });
      command.addTask(() => {
        throw new Error('exception');
      });
      function TestableError(){};
      command.on(Command.Event.CANCEL, () => {
        throw new TestableError();
      });
      command.on(Command.Event.ERROR, function(err) {
        if (!(err instanceof TestableError)) {
          throw err;
        }
      });
      setTimeout(() => {
        command.cancel();
      }, 200);
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        assert.equal(Command.Status.FAILED, command.getStatus());
      });
    });
  });

  describe('#check', () => {
    it('should finish without doing anything', () => {
      var command = new Command('lazy command');
      command.check();
    });
    it('should throw Canceller instance when command in "canceling"', () => {
      var command = new Command('lazy command');
      command.update({status: Command.Status.CANCELING});
      assert.throws(() => {
        command.check();
      }, Command.Canceller);
    });
    it('should throw any error when command have error', () => {
      var command = new Command('lazy command');
      var message = 'check error';
      command.update({error: new Error(message)});
      assert.throws(() => {
        command.check();
      }, new RegExp(message));
    });
  });

  describe('#destroy', () => {
    it('should check destored command', () => {
      var command = new Command('lazy command');
      return Promise.resolve().then(() => {
        return command.destroy();
      }).then(() => {
        assert.equal(null, command.getName());
        assert.equal(null, command.getStatus());
        assert.equal(null, command.getMessage());
        assert.equal(null, command.getReport());
        assert.equal(null, command.getError());
      });
    });
    it('should check destored command after executed command', () => {
      var command = new Command('lazy command');
      return Promise.resolve().then(() => {
        return command.execute();
      }).then(() => {
        return command.destroy();
      }).then(() => {
        assert.equal(null, command.getName());
        assert.equal(null, command.getStatus());
        assert.equal(null, command.getMessage());
        assert.equal(null, command.getReport());
        assert.equal(null, command.getError());
      });
    });
    it('should check destroyed command after execute destruction when in processing any job', () => {
      var command = new Command('command');
      const delay = () => {
        return () => {
          return new Promise(function(resolve) {
            setTimeout(() => {
              var report = command.getReport();
              var cnt = report.get('counter');
              if (!cnt) cnt = 0;
              report.set('counter', cnt + 1);
              resolve();
            }, 100);
          })
        }
      }
      command.addTask(delay());
      command.addTask(delay());
      command.addTask(delay());
      command.addTask(delay());
      command.addTask(delay());
      command.execute();
      return Promise.resolve().then(() => {
        return new Promise(function(resolve, reject) {
          setTimeout(resolve, 250)
        });
      }).then(() => {
        return new Promise(function(resolve, reject) {
          command.on(Command.Event.FINISH, () => {
            try {
              assert.equal(3, command.getReport().get('counter'));
            } catch(exception) {
              reject(exception);
            }
          });
          command.destroy().then(() => {
            resolve();
          });
        });
      }).then(() => {
        assert.equal(null, command.getName());
        assert.equal(null, command.getStatus());
        assert.equal(null, command.getMessage());
        assert.equal(null, command.getReport());
        assert.equal(null, command.getError());
      });
    });
  });

  describe('.Status', () => {
    it('check constatns variables', () => {
      assert.equal('pending', Command.Status.PENDING);
      assert.equal('working', Command.Status.WORKING);
      assert.equal('canceling', Command.Status.CANCELING);
      assert.equal('completed', Command.Status.COMPLETED);
      assert.equal('failed', Command.Status.FAILED);
      assert.equal('canceled', Command.Status.CANCELED);
    });
  });
  describe('.Event', () => {
    it('check constatns variables', () => {
      assert.equal('update', Command.Event.UPDATE);
      assert.equal('start', Command.Event.START);
      assert.equal('execute', Command.Event.EXECUTE);
      assert.equal('interval', Command.Event.INTERVAL);
      assert.equal('cancel', Command.Event.CANCEL);
      assert.equal('complete', Command.Event.COMPLETE);
      assert.equal('error', Command.Event.ERROR);
      assert.equal('finish', Command.Event.FINISH);
      assert.equal('destroy', Command.Event.DESTROY);
    });
  });
});
