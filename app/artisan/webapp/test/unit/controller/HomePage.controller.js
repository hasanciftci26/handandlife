/*global QUnit*/

sap.ui.define([
	"renovahl.ui./artisan/controller/HomePage.controller"
], function (Controller) {
	"use strict";

	QUnit.module("HomePage Controller");

	QUnit.test("I should test the HomePage controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
