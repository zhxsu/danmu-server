/// <reference path="../../typings/main.d.ts" />
'use strict';

var config = require('../../config');

module.exports = {
	init: function init(callback) {
		require("./" + config.database.type + ".js").init(function () {
			callback.apply(this, arguments);
		});
	}
};