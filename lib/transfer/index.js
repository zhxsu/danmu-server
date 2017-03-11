/// <reference path="../../typings/main.d.ts" />
'use strict';

var io = null;
var danmuQueue = {};
var danmuKeys = [];
var async = require("async");
var listener = require('../utils/event');
var filter = require('../utils/filter');
var utils = require('../utils');
var config = require('../../config');

var danmuId = 0;

module.exports = {
	init: function init(callback) {
		callback(null);
	}
};

// 更新配置
listener.on("configUpdated", function (data) {
	clearAllTimeval();
	initDanmuQueue();
	startAllTimeval();
});

// 待推送弹幕
listener.on("gotDanmu", function (data) {

	// 过老弹幕没有意义，直接从队列头出队列
	while (danmuQueue[data.room].queue.length > config.rooms[data.room].maxlength) {
		danmuQueue[data.room].queue.shift();
	}
	var comment = data;
	if (data.lifeTime === "") {
		data.lifeTime = utils.parseLifeTime(data);
	}
	log.log("房间" + data.room + "得到弹幕（" + data.hash + "）：" + data.text);
	danmuQueue[data.room].queue.push(comment);
});

var initDanmuQueue = function initDanmuQueue() {
	danmuQueue = {};
	danmuKeys = Object.keys(config.rooms);
	danmuKeys.forEach(function (room) {
		return danmuQueue[room] = {
			queue: [],
			timeval: null
		};
	});
};

var startAllTimeval = function startAllTimeval() {
	danmuKeys.forEach(function (room) {
		if (config.rooms[room].permissions.send) {
			danmuQueue[room].timeval = initTimeval(room);
			log.log('创建(' + room + ')定时器 - ' + config.websocket.interval + ' ms.');
		} else {
			log.log(room + ' 房间弹幕已关闭，不创建定时器。');
		}
	});
};

var clearAllTimeval = function clearAllTimeval() {
	danmuKeys.forEach(function (room) {
		log.log('清理(' + room + ')定时器');
		clearInterval(danmuQueue[room].timeval);
	});
};

var initTimeval = function initTimeval(room) {
	return setInterval(function () {
		// 定时推送
		var ret = [];
		if (danmuQueue[room].queue.length === 0) return;
		while (ret.length < config.websocket.singlesize && danmuQueue[room].queue.length > 0) {
			var object = danmuQueue[room].queue.pop();
			// 只在传输时才需要进行替换
			object.text = filter(room).replaceKeyword(object.text);
			object.id = ++danmuId;
			ret.push(object);
		}
		log.log('推送' + ret.length + '条弹幕到' + room + '，剩余' + danmuQueue[room].queue.length + '条。');

		listener.emit("danmuTransfer", {
			room: room,
			data: ret
		});
	}, config.websocket.interval);
};