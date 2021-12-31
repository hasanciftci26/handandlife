// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/util/Storage",
    "sap/m/MessageToast"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageBox, Filter, FilterOperator, Storage, MessageToast) {
        "use strict";
        var gProduct;

        return BaseController.extend("renova.hl.ui.artisan.controller.Products", {
            onInit: function () {
                this.getRouter().getRoute("Products").attachPatternMatched(this._onObjectMatched, this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
            onNavToOrders: function () {
                this.getRouter().navTo("Orders");
            },
            _onObjectMatched: function (oEvent) {
                var that = this;
                this.sessionControl(this);
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
                    if (oEvent.getParameter("arguments").productId === undefined) {
                        this.getArtisanProducts();
                    } else {
                        this.getArtisanProducts(0, oEvent.getParameter("arguments").productId);
                    }
                }
                // this.getCategories();
                // this.getUnits();
                // this.getCurrencies();
            },
            getArtisanProducts: function (vIndex = 0, vProductId) {
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
                    if (oData.value.length !== 0) {
                        if (vProductId !== undefined) {
                            vIndex = oData.value.findIndex((element) => { return element.productID === vProductId });
                        }
                        that.getProductDetails(oData.value[vIndex].productID);
                        that.getView().byId("lstArtisanProducts").getItems()[vIndex].focus();
                    }
                    that.getView().byId("AllProducts").setTitle(this.getResourceBundle().getText("AllProducts", [oData.value.length]));

                    // that._setScreenSimpleForm(that);
                });
            },

            getCategories: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindCategories = oDataModel.bindContext("/Categories", undefined, {
                    $$groupId: "directRequest"
                });

                oBindCategories.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "Categories");
                });
            },
            getUnits: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindUnits = oDataModel.bindContext("/Units", undefined, {
                    $$groupId: "directRequest"
                });

                oBindUnits.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "Units");
                });
            },
            getCurrencies: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindCurrencies = oDataModel.bindContext("/Currencies", undefined, {
                    $$groupId: "directRequest"
                });

                oBindCurrencies.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "Currencies");
                });
            },
            getProperties: function (vProductId) {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindProperties = oDataModel.bindContext("/ProductProperties", undefined, {
                    $filter: "productID_productID eq " + vProductId,
                    $$groupId: "directRequest"
                });

                oBindProperties.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "Prop");
                });
                var oProperty = this.getView().getModel("Prop");

            },

            onNavToLoginPage: function () {
                this.getRouter().navTo("Login");
            },
            onLogout: function () {
                var that = this;
                var oStorage = new Storage(Storage.Type.local, "userLogin");

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
                this.getProductDetails(vProductId);
            },
            getProductDetails: function (vProductId) {
                var sProduct = this.getView().getModel("ArtisanProducts").getData().find((item) => {
                    return item.productID === vProductId;
                });
                this.getView().setModel(new JSONModel(sProduct), "Product");
                this.getProductPictures(vProductId);

                this.getProperties(vProductId);
            },
            getProductPictures: function (vProductId) {
                var that = this;
                var oDataModel = this.getView().getModel();
                var aPictureURL = [];

                var oBindPictures = oDataModel.bindContext("/ProductAttachments", undefined, {
                    $filter: "productID_productID eq " + vProductId,
                    $$groupId: "directRequest"
                });

                oBindPictures.requestObject().then(async (oData) => {
                    var aPictures = oData.value;
                    if (aPictures.length === 0) {
                        that.getView().byId("crProductPictures").setVisible(false);
                    }
                    else {
                        that.getView().byId("crProductPictures").setVisible(true);
                        for (var oPicture of aPictures) {
                            var oBlobData = await that.getPictureBlobData(oPicture.url);
                            var vPictureURL = window.URL.createObjectURL(oBlobData);
                            aPictureURL.push({
                                pictureURL: vPictureURL
                            });
                            if (aPictures.length === aPictureURL.length) {
                                that.getView().setModel(new JSONModel(aPictureURL), "ProductPictures");
                            }
                        }
                    }
                });
            },
            getPictureBlobData: function (url) {
                var settings = {
                    url: url,
                    method: "GET",
                    xhrFields: {
                        responseType: "blob"
                    }
                };

                return new Promise((resolve, reject) => {
                    $.ajax(settings).done((result, textStatus, request) => {
                        resolve(result);
                    }).fail((err) => {
                        reject(err);
                    });
                });
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
            },
            onDeactivateProduct: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oArtisanProducts = this.getView().getModel("ArtisanProducts");
                var aFilter = [];

                if (this.getView().getModel("Product") === undefined) {
                    return;
                }

                var sProduct = this.getView().getModel("Product").getData();
                aFilter.push(new Filter("productID", FilterOperator.EQ, sProduct.productID));
                var vDeactivatedIndex = oArtisanProducts.getData().findIndex((item) => { return item.productID === sProduct.productID });

                var oBindProduct = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindProduct.requestContexts().then((aContext) => {
                    aContext[0].setProperty("status_statusID", "DCTV");
                    oDataModel.submitBatch("batchRequest").then(() => {
                        that.getArtisanProducts(vDeactivatedIndex);
                    });
                });
            },

            onActivateProduct: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oArtisanProducts = this.getView().getModel("ArtisanProducts");
                var aFilter = [];

                if (this.getView().getModel("Product").getData() === undefined) {
                    return;
                }

                var sProduct = this.getView().getModel("Product").getData();
                aFilter.push(new Filter("productID", FilterOperator.EQ, sProduct.productID));
                var vActivatedIndex = oArtisanProducts.getData().findIndex((item) => { return item.productID === sProduct.productID });

                var oBindProduct = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindProduct.requestContexts().then((aContext) => {
                    aContext[0].setProperty("status_statusID", "AVLB");
                    oDataModel.submitBatch("batchRequest").then(() => {
                        that.getArtisanProducts(vActivatedIndex);
                    });
                });
            },

            onDeleteProduct: function (oEvent) {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oProductModel = this.getView().getModel("Product");
                var sSelected = oProductModel.getData();
                var aFilter = [];

                aFilter.push(new Filter("productID", FilterOperator.EQ, sSelected.productID));

                var oSelected = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oSelected.requestContexts().then((aContext) => {
                    aContext[0].delete("directRequest").then(function () {
                        oProductModel.setData({});
                        oProductModel.refresh();
                        that.getArtisanProducts();
                    });
                });
            }
        });
    });
