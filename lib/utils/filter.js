/// <reference path="../../typings/main.d.ts" />
'use strict';

var listener = require('./event');
var _ = require('ramda');
var config = require('../../config');

var cachedFilters = {};
/**
 * 检测用户是否被封禁
 */
var checkUserIsBlocked = _.curry(function (blockUsers, hash) {
	return blockUsers.indexOf(hash) > -1;
});
/**
 * 检测文字是否和谐
 */
var validateText = _.curry(function (ignoreRegEx, checkRegEx, str) {
	checkRegEx.lastIndex = 0;
	var testStr = str.replace(ignoreRegEx, "");
	return !checkRegEx.test(testStr);
});
/**
 * 替换关键字
 */
var replaceKeyword = _.curry(function (regex, str) {
	return str.replace(regex, "***");
});

function initialize(roomName, forceUpdate) {
	if (cachedFilters[roomName] && !forceUpdate) {
		return cachedFilters[roomName];
	}
	var room = config.rooms[roomName];
	if (typeof room.keyword.block === "string") {
		console.error("请升级你的配置，将所有字符串类型关键词转换为正则类型关键词。");
		throw "Init RegExp Error";
	}
	var ret = {
		checkUserIsBlocked: checkUserIsBlocked(room.blockusers),
		validateText: validateText(room.keyword.ignore)(room.keyword.block),
		replaceKeyword: replaceKeyword(room.keyword.replacement)
	};
	cachedFilters[roomName] = null; // Release Memory
	cachedFilters[roomName] = ret;
	return ret;
};

// 正则缓存更新
listener.on("configUpdated", function () {
	Object.keys(config.rooms).forEach(function (room) {
		return initialize(room, true);
	});
});
module.exports = initialize;