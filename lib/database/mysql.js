/// <reference path="../../typings/main.d.ts" />

'use strict';

var SECONDS_IN_DAY = 24 * 60 * 60 * 1000;
var mysql = require("mysql");
var async = require('async');
var listener = require('../utils/event');
var config = require('../../config');

var pool = null;
var connection = null;
var errorCounter = 0;
var firstErrorTime = new Date();

var createTableSql = ["CREATE TABLE IF NOT EXISTS `%table%` (", "danmu_id int(11) NOT NULL AUTO_INCREMENT,", "danmu_user varchar(255) NOT NULL DEFAULT '',", "danmu_text text NOT NULL,", "danmu_publish int(11) NOT NULL DEFAULT '0',", "danmu_ip varchar(255) NOT NULL DEFAULT '',", "danmu_useragent text NOT NULL,", "PRIMARY KEY (danmu_id),", "KEY danmu_TPISC (danmu_publish)", ") ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;"].join("\n");

var createDatabase = function createDatabase(callbackOrig) {
    var asyncList = Object.keys(config.rooms);
    async.each(asyncList, function (room, callback) {
        connection.query('SELECT MAX(danmu_id) FROM `' + config.rooms[room].table + '`', function (err, rows) {
            if (err !== null) {
                log.log("Creating Table...");
                connection.query(createTableSql.replace(/%table%/g, config.rooms[room].table), function (err, rows) {
                    callback(err);
                });
            } else {
                callback(null);
            }
        });
    }, function (err) {
        callbackOrig(err);
    });
};

var dbErrorHandler = function dbErrorHandler(err) {
    if (err !== null) {
        if (err.errno !== "ECONNRESET") {
            // 部分MySQL会自动超时，此时要重连但不计errorCounter
            if (errorCounter === 0 || new Date() - firstErrorTime >= SECONDS_IN_DAY) {
                firstErrorTime = new Date();
                errorCounter = 0;
            }
            errorCounter++;
            console.log(err);
            log.log("数据库第" + errorCounter + "次连接出错。");
            if (connection) {
                connection.release();
            }
            getConnection();
        }
        if (errorCounter >= config.database.retry) {
            log.log("数据库连接错误次数超过上限，程序退出。");
            throw err;
        }
    }
};

var getConnection = function getConnection(callback) {
    var called = false;
    pool.getConnection(function (err, privateConnection) {
        connection = privateConnection;
        if (err) {
            dbErrorHandler(err);
            if (!called && callback) {
                callback(err);
                called = true;
            }
        } else {
            connection.on("error", dbErrorHandler);
            log.log("数据库连接正常");
            createDatabase(function (err) {
                if (!called && callback) {
                    callback(err);
                    called = true;
                }
            });
        }
    });
};

module.exports = {
    init: function init(callback) {

        pool = mysql.createPool({
            host: config.database.server,
            user: config.database.username,
            password: config.database.password,
            port: config.database.port,
            database: config.database.db,
            acquireTimeout: config.database.timeout,
            connectionLimit: 1
        });
        //debug: true
        getConnection(callback);

        var keepAlive = function keepAlive() {
            if (!connection) return;
            connection.ping();
        };

        listener.on("gotDanmu", function (data) {

            var room = data.room;
            connection.query("INSERT INTO `%table%` (danmu_user, danmu_text, danmu_publish, danmu_ip, danmu_useragent) VALUES (?, ?, ?, ?, ?)".replace("%table%", config.rooms[room].table), [data.hash, data.text, Math.round(new Date().getTime() / 1000), data.ip, data.ua], function (err, rows) {
                if (err !== null) {
                    log.log("数据库写入出错");
                    console.log(err);
                }
            });
        });

        listener.on("searchDanmu", function (data) {

            var room = data.room;
            connection.query('SELECT * from `%table%` where `danmu_text` LIKE ? LIMIT 20'.replace("%table%", config.rooms[room].table), ['%' + data.key + '%'], function (err, rows) {
                if (err === null) {
                    var ret = [];
                    ret = JSON.stringify(rows).replace(/"danmu_/g, '"');
                    listener.emit("gotSearchDanmu", ret);
                } else {
                    log.log("数据库搜索出错");
                    console.log(err);
                    listener.emit("gotSearchDanmu", "[]");
                }
            });
        });

        getConnection();
        setInterval(keepAlive, config.database.timeout);
        //        connection.on("error", dbErrorHandler);
        //       connectDataBase(callback);
    }
};