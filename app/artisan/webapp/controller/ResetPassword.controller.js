sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/util/Storage",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageToast, MessageBox, Storage, Filter, FilterOperator, Fragment) {
        "use strict";

        return BaseController.extend("renova.hl.ui.artisan.controller.ResetPassword", {
            onInit: function () {
                this.getRouter().getRoute("ResetPassword").attachPatternMatched(this._onObjectMatched, this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
            _onObjectMatched: function (oEvent) {
                var that = this;
                var vUuid = oEvent.getParameter("arguments").uuid;
                this.sessionControl(this);

                this.getView().byId("inpResetPasswordEmail").setValue();
                this.getView().byId("inpNewPassword").setValue();
                this.getView().byId("inpNewPassword").setType("Password");
                this.getView().setModel(new JSONModel({ Display: false }), "ShowNewPassword");

                // @ts-ignore
                if (sap.ui.getCore().isLogin === true) {
                    MessageBox.information(
                        this.getResourceBundle().getText("AlreadyLogon"), {
                        icon: MessageBox.Icon.INFORMATION,
                        title: this.getResourceBundle().getText("Warning"),
                        actions: [MessageBox.Action.OK],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: function (oAction) {
                            that.getRouter().navTo("HomePage");
                        }
                    }
                    );
                }
                this.getUserEmail(vUuid);
                this.getView().byId("inpResetPasswordEmail").setValueState();
            },
            getUserEmail: function (vUuid) {
                var that = this;
                var oDataModel = this.getView().getModel();

                var oBindForgottenPassword = oDataModel.bindContext("/ForgottenPasswords", undefined,
                    {
                        $filter: "passwordKey eq '" + vUuid + "'",
                        $$groupId: "directRequest"
                    });
                oBindForgottenPassword.requestObject().then((oData) => {
                    that.getView().byId("inpResetPasswordEmail").setValue(oData.value[0].email);
                });
            },
            //Anasayfaya dön
            onNavToHomePage: function () {
                this.getRouter().navTo("HomePage");
            },
            onDisplayHideNewPassword: function () {
                this.getView().getModel("ShowNewPassword").setProperty("/Display",
                    this.getView().getModel("ShowNewPassword").getData().Display === true ? false : true);

                this.getView().byId("inpNewPassword").setType(
                    this.getView().getModel("ShowNewPassword").getData().Display === true ? "Text" : "Password"
                );
            },
            onResetPassword: function () {
                var oDataModel = this.getView().getModel();
                var vRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
                var vEmail = this.getView().byId("inpResetPasswordEmail").getValue();
                var vPassword = this.getView().byId("inpNewPassword").getValue();
                var vRetypePassword = this.getView().byId("inpRetypePassword").getValue();

                if (vEmail === "") {
                    MessageToast.show(this.getResourceBundle().getText("MailNoFound"));
                    return;
                }

                if (!vRegex.test(vPassword)) {
                    MessageToast.show(this.getResourceBundle().getText("InvalidPassword"));
                    return;
                }

                if (vPassword !== vRetypePassword) {
                    MessageToast.show(this.getResourceBundle().getText("PasswordsDifferent"));
                    return;
                }

                var aFilter = [];
                aFilter.push(new Filter("email", FilterOperator.EQ, vEmail));

                var oBindArtisanCredentials = oDataModel.bindList("/ArtisanCredentialsView", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindArtisanCredentials.attachPatchCompleted(this.onPasswordResetCompleted, this);

                oBindArtisanCredentials.requestContexts().then((aContext) => {
                    aContext[0].setProperty("password", vPassword);
                    oDataModel.submitBatch("batchRequest");
                });

            },
            onPasswordResetCompleted: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var vEmail = this.getView().byId("inpResetPasswordEmail").getValue();

                var aFilter = [];
                aFilter.push(new Filter("email", FilterOperator.EQ, vEmail));

                var oBindForgottenPassword = oDataModel.bindList("/ForgottenPasswords", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindForgottenPassword.requestContexts().then((aContext) => {
                    aContext[0].delete("directRequest").then(() => {
                        MessageToast.show(that.getResourceBundle().getText("SuccessfulReset"));
                        that.getRouter().navTo("Login");
                    });
                });
            },
            onShowPasswordInfo: function (oEvent) {
                var oButton = oEvent.getSource(),
                    oView = this.getView();

                // create popover
                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "renova.hl.ui.artisan.fragments.PasswordInfo",
                        controller: this
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    });
                }
                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });
            },
            onClosePasswordInfo: function () {
                this.byId("poPasswordInfo").close();
            }
        });
    });