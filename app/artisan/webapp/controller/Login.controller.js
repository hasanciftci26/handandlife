// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/util/Storage",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageToast, MessageBox, Storage, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend("renova.hl.ui.artisan.controller.Login", {
            onInit: function () {
                this.getRouter().getRoute("Login").attachPatternMatched(this._onObjectMatched, this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
            _onObjectMatched: function () {
                var that = this;
                this.sessionControl(this);

                this.getView().byId("inpLoginEmail").setValue();
                this.getView().byId("inpLoginPassword").setValue();
                this.getView().byId("inpLoginPassword").setType("Password");
                this.getView().setModel(new JSONModel({ Display: false }), "ShowPassword");

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

                this.getView().byId("inpLoginEmail").setValueState();
            },
            //Email formatını kontrol et
            onChangeLoginEmail: function () {
                var vEmail = this.getView().byId("inpLoginEmail").getValue();
                var vMailRegex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
                if (!vMailRegex.test(vEmail)) {
                    var vMessage = this.getResourceBundle().getText("NotValidEmail");
                    MessageToast.show(vEmail + " " + vMessage);
                    this.getView().byId("inpLoginEmail").setValueState(sap.ui.core.ValueState.Error);
                } else {
                    this.getView().byId("inpLoginEmail").setValueState();
                }
            },
            onLogin: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var vMail = this.getView().byId("inpLoginEmail").getValue();
                var vPassword = this.getView().byId("inpLoginPassword").getValue();

                if (vMail === "" || vPassword === "") {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }

                var oBindCredential = oDataModel.bindContext("/ArtisanCredentials", undefined,
                    {
                        $filter: "email eq '" + vMail + "' and password eq '" + vPassword + "'",
                        $$groupId: "directRequest"
                    });

                oBindCredential.requestObject().then((oData) => {
                    if (oData.value.length === 0) {
                        MessageToast.show(this.getResourceBundle().getText("WrongCredential"));
                        that.getView().byId("inpLoginPassword").setValue();
                        return;
                    }
                    // @ts-ignore
                    sap.ui.getCore().email = vMail;

                    var oStorage = new Storage(Storage.Type.local, "userLogin");
                    oStorage.put("isLogin", {
                        active: true,
                        email: vMail
                    });

                    // @ts-ignore
                    sap.ui.getCore().isLogin = true;
                    that.getRouter().navTo("HomePage");
                });
            },
            //Anasayfaya dön
            onNavToHomePage: function () {
                this.getRouter().navTo("HomePage");
            },
            onDisplayHidePassword: function () {
                this.getView().getModel("ShowPassword").setProperty("/Display",
                    this.getView().getModel("ShowPassword").getData().Display === true ? false : true);

                this.getView().byId("inpLoginPassword").setType(
                    this.getView().getModel("ShowPassword").getData().Display === true ? "Text" : "Password"
                );
            },
            onForgotMyPassword: function () {
                this.getView().setModel(new JSONModel({ Email: "" }), "ForgottenPassword");
                this.getForgottenPasswordDialog().open();
            },
            getForgottenPasswordDialog: function () {
                if (!this.oForgottenPasswordDialog) {
                    this.oForgottenPasswordDialog = sap.ui.xmlfragment("renova.hl.ui.artisan.fragments.ForgottenPassword", this);
                    this.getView().addDependent(this.oForgottenPasswordDialog);
                    // @ts-ignore
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oForgottenPasswordDialog);
                }
                return this.oForgottenPasswordDialog;
            },
            onCompleteForgottenPassword: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var vRegex = /^[a-zA-Z]+[\w\.-]*@[a-zA-Z]+\.[a-zA-Z]{2,3}(\.[a-zA-Z]{2})?$/;
                var sEmail = this.getView().getModel("ForgottenPassword").getData();
                if (!vRegex.test(sEmail.Email)) {
                    MessageToast.show(sEmail.Email + " " + this.getResourceBundle().getText("NotValidEmail"));
                    return;
                }

                var oBindForgottenPassword = oDataModel.bindContext("/ForgottenPasswords", undefined,
                    {
                        $filter: "email eq '" + sEmail.Email + "'",
                        $$groupId: "directRequest"
                    });

                oBindForgottenPassword.requestObject().then((oData) => {
                    if (oData.value.length === 0) {
                        that.createForgottenPassword(sEmail.Email);
                    } else {
                        that.updateForgottenPassword(sEmail.Email);
                    }
                });
            },
            onCancelForgottenPassword: function () {
                this.getForgottenPasswordDialog().close();
            },
            updateForgottenPassword: async function (email) {
                var oDataModel = this.getView().getModel();
                var vUuid = await this.generateUuid();
                var vResetURL = window.location.href.split("#")[0] + "#/ResetPassword/" + vUuid;

                var aFilter = [];
                aFilter.push(new Filter("email", FilterOperator.EQ, email));

                var oBindForgottenPassword = oDataModel.bindList("/ForgottenPasswords", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindForgottenPassword.attachPatchCompleted(this.onForgotPasswordCompleted, this);

                oBindForgottenPassword.requestContexts().then((aContext) => {
                    aContext[0].setProperty("passwordKey", vUuid);
                    aContext[0].setProperty("resetUrl", vResetURL);
                    oDataModel.submitBatch("batchRequest");                    
                });
            },
            // @ts-ignore
            createForgottenPassword: async function (email) {
                var oDataModel = this.getView().getModel();
                var vUuid = await this.generateUuid();
                var vResetURL = window.location.href.split("#")[0] + "#/ResetPassword/" + vUuid;

                var oBindForgottenPassword = oDataModel.bindList("/ForgottenPasswords", undefined, undefined, undefined, {
                    $$groupId: "batchRequest"
                });

                oBindForgottenPassword.attachCreateCompleted(this.onForgotPasswordCompleted, this);

                oBindForgottenPassword.create({
                    email: email,
                    passwordKey: vUuid,
                    resetUrl: vResetURL
                });

                oDataModel.submitBatch("batchRequest");
            },
            onForgotPasswordCompleted: function () {
                MessageBox.information(this.getResourceBundle().getText("ReceiveEmailForgotPassword"));
                this.getForgottenPasswordDialog().close();
            },
            generateUuid: function () {
                var that = this;
                // @ts-ignore
                return new Promise((resolve) => {
                    var oDataModel = this.getView().getModel();

                    var oBindGenerateUuid = oDataModel.bindContext("/GenerateUuid(...)");

                    oBindGenerateUuid.execute().then(() => {
                        var vUuid = oBindGenerateUuid.getBoundContext().getObject().value;
                        resolve(vUuid);
                    });
                });
            }
        });
    });