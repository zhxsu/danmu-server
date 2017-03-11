/// <reference path="../../typings/main.d.ts" />

'use strict';

var fs = require("fs");
var path = require("path");
var listener = require('../utils/event');
var config = require('../../config');

function formatContent(content) {
    return '"' + content.toString().replace(/"/g, '""') + '"';
}
module.exports = {};
module.exports.init = function (callback) {
    var savePath = path.resolve(config.database.savedir);
    log.log("保存位置：" + savePath);
    callback(null);
    listener.on("gotDanmu", function (data) {
        var date = new Date();
        var joinArray = [];
        joinArray.push(formatContent(Math.round(new Date().getTime() / 1000)));
        joinArray.push(formatContent(data.hash));
        joinArray.push(formatContent(data.ip));
        joinArray.push(formatContent(data.ua));
        joinArray.push(formatContent(data.text));
        joinArray.push("\r\n");
        fs.appendFile(path.resolve(savePath, data.room + '.csv'), joinArray.join(","));
    });

    listener.on("searchDanmu", function (data) {
        listener.emit("gotSearchDanmu", '[{"user": "ERROR", "text": "Not yet supported", "publish": ""}]');
    });
};