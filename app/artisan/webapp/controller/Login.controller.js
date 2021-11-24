
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/util/Storage"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageToast, MessageBox, Storage) {
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
            }
        });
    });