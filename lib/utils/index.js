/// <reference path="../../typings/main.d.ts" />
'use strict';

var crypto = require('crypto');
var async = require('async');
var config = require('../../config');
/**
 * 生成MD5
 */
var md5 = function md5(text) {
	return crypto.createHash('md5').update(text).digest('hex');
};
/** 
 * 计算Hash
 */
var getHash = function getHash(ip, userAgent, hashCode) {
	return md5('IP=' + ip + '\nUA=' + userAgent + '\nHC=' + hashCode);
};
/**
 * 获取一个可读的当前时间
 */
var getTime = function getTime() {
	var d = new Date();
	return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds();
};
/**
 * 把配置格式化为数组
 */
var buildConfigToArray = function buildConfigToArray(room) {
	return {
		replaceKeyword: config.rooms[room].keyword.replacement.source,
		blockKeyword: config.rooms[room].keyword.block.source,
		ignoreKeyword: config.rooms[room].keyword.ignore.source,
		maxlength: config.rooms[room].maxlength,
		textlength: config.rooms[room].textlength,
		socketinterval: config.websocket.interval,
		socketsingle: config.websocket.singlesize
	};
};
/**
 * 计算弹幕生存时间
 */
var parseLifeTime = function parseLifeTime(data) {
	var imageMatches = data.text.match(config.rooms[data.room].image.regex);
	var imageLength = imageMatches === null ? 0 : imageMatches.length;
	return Math.trunc(data.text.length / 10) * 60 + config.rooms[data.room].image.lifetime * imageLength;
};
// 全局工具
module.exports = {
	md5: md5,
	getHash: getHash,
	getTime: getTime,
	buildConfigToArray: buildConfigToArray,
	parseLifeTime: parseLifeTime
};