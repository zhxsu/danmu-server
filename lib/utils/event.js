/// <reference path="../../typings/main.d.ts" />

'use strict';

var events = require('events');
var util = require('util');

// EventEmitter继承
var EventEmitter = function EventEmitter() {
	events.EventEmitter.call(this);
};
util.inherits(EventEmitter, events.EventEmitter);
EventEmitter.prototype.emitAsync = function (type) {
	// 目前的emit是Sync的
	var self = this;
	var callback = arguments[arguments.length - 1];
	var len = undefined,
	    args = undefined,
	    listeners = undefined,
	    i = undefined,
	    handler = undefined;
	handler = this._events[type];
	len = arguments.length;
	args = new Array(len - 2);
	for (i = 1; i < len; i++) {
		args[i - 1] = arguments[i];
	}setImmediate(function () {
		// 不需要太复杂的功能，只需要能apply就行

		if (util.isUndefined(handler)) {
			callback(null);
		} else if (util.isFunction(handler)) {
			args.push(function () {
				callback.apply(self, arguments);
			});
			handler.apply(self, args);
		} else {
			listeners = handler.slice();
			len = listeners.length;
			async.map(listeners, function (item, cb) {
				args.push(callback);
				item.apply(self, args);
				args.pop();
			}, callback);
		}
	});
};
module.exports = new EventEmitter();