'use strict';

var assert = require('assert');
var sawdust = require('../lib');
var Report = sawdust.Report;

describe('Report', function() {

  describe('#constructor', function() {
    it('should construct Report instance when did not recieve parameter', function() {
      var report = new Report();
      assert.ok(report instanceof Report);
    });
    it('should construct Report instance when recieve Object parameter', function() {
      var report = new Report({});
      assert.ok(report instanceof Report);
    });
    it('should throw TypeError when recieve anything other than object type', function() {
      assert.throws(function() {
        var report = new Report('{}');
      }, TypeError);
    });
  });

  describe('#get', function() {
    it('should return undefined when did not exists key', function() {
      var report = new Report();
      assert.equal(undefined, report.get('key'));
      assert.equal(undefined, report.get());
      assert.equal(undefined, report.get({}));
    });
    it('should return stored value when exists key', function() {
      var num = 0;
      var str = '';
      var obj = {};
      var arr = [];
      var report = new Report({num: num, str: str, obj: obj, arr: arr});
      assert.equal(num, report.get('num'));
      assert.equal(str, report.get('str'));
      assert.equal(obj, report.get('obj'));
      assert.equal(arr, report.get('arr'));
    });
  });

  describe('#set', function() {
    it('should stored value in instance when receive key and value', function() {
      var num = 0;
      var report = new Report();
      assert.equal(undefined, report.get('num'));
      report.set('num', num);
      assert.equal(num, report.get('num'));
    });
  });

  describe('#has', function() {
    it('should return false when is not kept key', function() {
      var report = new Report();
      assert.equal(false, report.has('num'));
    });
    it('should return true when is keeping key', function() {
      var report = new Report({num: 0});
      assert.equal(true, report.has('num'));
    });
  });
});
