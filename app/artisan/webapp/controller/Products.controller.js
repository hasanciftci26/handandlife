sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/util/Storage"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageBox, Filter, FilterOperator, Storage) {
        "use strict";

        return BaseController.extend("renova.hl.ui.artisan.controller.Products", {
            onInit: function () {
                this.getRouter().getRoute("Products").attachPatternMatched(this._onObjectMatched, this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
            _onObjectMatched: function () {
                var that = this;
                var oStorage = new Storage(Storage.Type.session, "userLogin");
                var vLogin = false;

                if (oStorage.get("isLogin") !== null) {
                    vLogin = oStorage.get("isLogin").active
                    // @ts-ignore
                    sap.ui.getCore().email = oStorage.get("isLogin").email;
                }
                // @ts-ignore
                sap.ui.getCore().isLogin = vLogin;

                if (this.getView().getModel("UserCredential") === undefined) {
                    this.getView().setModel(new JSONModel({
                        // @ts-ignore
                        isLogin: sap.ui.getCore().isLogin === undefined || sap.ui.getCore().isLogin === false ? false : true
                    }), "UserCredential");
                } else {
                    this.getView().getModel("UserCredential").setProperty("/isLogin",
                        // @ts-ignore
                        sap.ui.getCore().isLogin === undefined || sap.ui.getCore().isLogin === false ? false : true);
                }
                // @ts-ignore
                if (sap.ui.getCore().isLogin === undefined || sap.ui.getCore().isLogin === false) {
                    MessageBox.information(
                        this.getResourceBundle().getText("LoginFirst"), {
                        icon: MessageBox.Icon.INFORMATION,
                        title: this.getResourceBundle().getText("Warning"),
                        actions: [MessageBox.Action.OK],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: function (oAction) {
                            that.getRouter().navTo("Login");
                        }
                    }
                    );
                }
                // @ts-ignore
                if (sap.ui.getCore().isLogin) {
                    this.getArtisanProducts();
                }
            },
            getArtisanProducts: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindProduct = oDataModel.bindContext("/ArtisanProductsView", undefined,
                    {
                        // @ts-ignore
                        $filter: "email_email eq '" + sap.ui.getCore().email + "'",
                        $$groupId: "directRequest"
                    });

                oBindProduct.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "ArtisanProducts");
                    that.getView().byId("AllProducts").setTitle(this.getResourceBundle().getText("AllProducts", [oData.value.length]));
                });
            },
            onNavToLoginPage: function () {
                this.getRouter().navTo("Login");
            },
            onLogout: function () {
                var that = this;
                var oStorage = new Storage(Storage.Type.session, "userLogin");

                MessageBox.information(
                    this.getResourceBundle().getText("Loggingout"), {
                    icon: MessageBox.Icon.INFORMATION,
                    title: this.getResourceBundle().getText("Information"),
                    actions: [MessageBox.Action.OK],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (oAction) {
                        // @ts-ignore
                        sap.ui.getCore().isLogin = false;
                        oStorage.remove("isLogin");
                        that.getView().getModel("UserCredential").setProperty("/isLogin", false);
                        that.getRouter().navTo("HomePage");
                    }
                }
                );
            },
            //Anasayfaya dön
            onNavToHomePage: function () {
                this.getRouter().navTo("HomePage");
            },
            onSelectProduct: function (oEvent) {
                var vProductId = oEvent.getSource().getAttributes()[0].getText();
            },
            onSearchProduct: function (oEvent) {
                var sQuery = oEvent.getParameter("query");
                var aFilter = [];
                if (sQuery !== "") {
                    aFilter.push(new Filter("productName", FilterOperator.Contains, sQuery));
                }
                this.getView().byId("lstArtisanProducts").getBinding("items").filter(aFilter);
            },
            onAddNewProduct: function () {
                this.getRouter().navTo("NewProduct");
            }
        });
    });
