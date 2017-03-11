/// <reference path="../../../typings/main.d.ts" />
'use strict';

var config = require('../../../config');

module.exports = function (app) {
	// Initialize Hostname Map
	var hostnameMap = new Map();
	Object.keys(config.rooms).forEach(function (room) {
		return config.rooms[room].hostname.forEach(function (value) {
			return hostnameMap.set(value, room);
		});
	});

	function getRoom(hostname) {
		return hostnameMap.has(hostname) ? hostnameMap.get(hostname) : null;
	}

	function renderIndex(advanced, room) {
		var permission = config.rooms[room].permissions;
		return {
			config: config,
			advanced: advanced,
			room: room,
			permission: permission
		};
	}

	app.route("/*").all(function (req, res, next) {
		res.append('Server', 'zsx\'s Danmu Server');
		req.room = getRoom(req.hostname);
		for (var item in config.http.headers) {
			res.append(item, config.http.headers[item]);
		}
		if (req.room === null) {
			res.status(403);
			res.end("403 Forbidden");
		}
		next();
	});

	app.get("/", function (req, res) {
		res.render('index', renderIndex(false, req.room));
	});

	app.get("/advanced", function (req, res) {
		res.render('index', renderIndex(true, req.room));
	});

	app.post(function (req, res, next) {
		res.header("Content-Type", "text/html; charset=utf-8");
		next();
	});
};