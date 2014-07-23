/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

describe("async functions and await expressions", function() {
  var assert = require("assert");

  describe("wrapGenerator", function() {
    it("should be defined globally", function() {
      var global = Function("return this")();
      assert.ok("wrapGenerator" in global);
      assert.strictEqual(global.wrapGenerator, wrapGenerator);
    });

    it("should be a function", function() {
      assert.strictEqual(typeof wrapGenerator, "function");
    });
  });

  describe("Promise", function() {
    it("should be defined globally", function() {
      var global = Function("return this")();
      assert.ok("Promise" in global);
      assert.strictEqual(global.Promise, Promise);
    });

    it("should be a function", function() {
      assert.strictEqual(typeof Promise, "function");
    });
  });

  describe("no-await async function", function() {
    it("should return a Promise", function(done) {
      var called = false;

      async function noAwait(value) {
        called = true;
        return value;
      }

      var promise = noAwait("asdf");
      assert.strictEqual(called, true);

      promise.then(function(value) {
        assert.strictEqual(called, true);
        assert.strictEqual(value, "asdf");
        done();
      }).catch(done);
    });
  });

  describe("one-await async function", function() {
    it("should finish asynchronously", function(done) {
      var flag1 = false;
      var flag2 = false;

      async function oneAwait(value) {
        flag1 = true;
        var result = await value;
        flag2 = true;
        return result;
      }

      var promise = oneAwait("asdf");
      assert.strictEqual(flag1, true);
      assert.strictEqual(flag2, false);

      promise.then(function(value) {
        assert.strictEqual(flag2, true);
        assert.strictEqual(value, "asdf");
        done();
      }).catch(done);
    });
  });

  describe("nested async function calls", function() {
    it("should evaluate in the right order", function(done) {
      var markers = [];

      async function innerMost(marker) {
        markers.push(marker);
        return await marker;
      }

      async function inner(marker) {
        markers.push(marker);

        assert.strictEqual(
          await innerMost(marker + 1),
          marker + 1
        );

        markers.push(marker + 2);

        assert.strictEqual(
          await innerMost(marker + 3),
          marker + 3
        );

        markers.push(marker + 4);
      }

      async function outer() {
        markers.push(0);
        await inner(1);
        markers.push(6);
        await inner(7);
        markers.push(12);
      }

      outer().then(function() {
        var expected = [];
        for (var i = 0; i <= 12; ++i)
          expected.push(i);
        assert.deepEqual(markers, expected);
        done();
      }).catch(done);
    });
  });

  describe("dependent promises", function() {
    it("should be awaitable out of order", function(done) {
      async function outer(value) {
        var resolved = false;
        var p1 = new Promise(function(resolve) {
          setTimeout(function() {
            resolve(value + 1);
            resolved = true;
          }, 0);
        });

        assert.strictEqual(resolved, false);

        var v2 = await p1.then(function(value) {
          return value + 1;
        });

        assert.strictEqual(resolved, true);

        var v1 = await p1;

        return [v1, v2];
      }

      outer(1).then(function(pair) {
        assert.deepEqual(pair, [2, 3]);
        done();
      }).catch(done);
    });
  });
});
