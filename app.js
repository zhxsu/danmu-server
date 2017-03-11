/// <reference path="typings/main.d.ts" />
"use strict";

var os = require('os');
var async = require('async');
var listener = require('./lib/utils/event');
var utils = require('./lib/utils');
var packageJson = require("./package.json");
var config = require('./config');

global.version = packageJson.version;
global.log = {
	log: function log(text) {
		console.log("[" + utils.getTime() + "] " + text);
	}
};

(function () {
	log.log('环境：' + os.platform() + '(' + os.release() + ') ' + os.arch() + ' with ' + parseInt(os.totalmem() / 1024 / 1024) + 'MB');

	var dbPos = config.database;
	if (process.env.MYSQL_PORT_3306_TCP_PORT) {
		// 检测DaoCloud的MySQL服务
		dbPos.type = "mysql";
		dbPos.server = process.env.MYSQL_PORT_3306_TCP_ADDR;
		dbPos.username = process.env.MYSQL_USERNAME;
		dbPos.password = process.env.MYSQL_PASSWORD;
		dbPos.port = process.env.MYSQL_PORT_3306_TCP_PORT;
		dbPos.db = process.env.MYSQL_INSTANCE_NAME;
		console.log("检测到配置在环境变量内的MySQL，自动使用之。");
	} else if (dbPos.type === "mongo" && process.env["27017/tcp"]) {
		// MongoDB服务
		dbPos.type = "mongo";
		dbPos.server = process.env["27017/tcp"].split(":")[0].trim(); // tcp://xx.xx.xx.xx:27017
		dbPos.port = process.env["27017/tcp"].split(":")[1].trim(); // tcp://xx.xx.xx.xx:27017
		dbPos.username = process.env.USERNAME;
		dbPos.password = process.env.PASSWORD;
		dbPos.db = process.env.INSTANCE_NAME;
		console.log("检测到配置在环境变量内的MongoDB，自动使用之。");
	}

	// 加载模块
	async.map(["ext", "cache", "transfer", "database", "http", "socket"], function (mdl, callback) {
		require('./lib/' + mdl).init(callback);
	}, function (err) {
		listener.emit("configUpdated");
		log.log("服务器初始化完成");
	});
})();