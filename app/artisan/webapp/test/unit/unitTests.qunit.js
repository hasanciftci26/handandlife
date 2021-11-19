/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"renovahl.ui./artisan/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
