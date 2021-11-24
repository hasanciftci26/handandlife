
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
                    if (oData.value.length !== 0) {
                        that.getProductDetails(oData.value[0].productID);
                    }
                    that.getView().byId("AllProducts").setTitle(this.getResourceBundle().getText("AllProducts", [oData.value.length]));
                });
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
                this.getProductPictures(sProduct);
            },
            getProductPictures: function (sProduct) {
                var that = this;
                var aFilter = [];
                aFilter.push(new Filter("productID_productID", FilterOperator.EQ, sProduct.productID));
                this.getView().byId("crProductPictures").getBinding("pages").filter(aFilter);
                // var oImage = new sap.m.Image({ src: "{mediaContent}" });
                // this.getView().byId("crProductPictures").bindAggregation("pages", {
                //     path: "/ProductAttachments",
                //     template: oImage,
                //     filters: aFilter
                // });
                // this.getView().byId("fbCarousel").setJustifyContent("Center");
                // this.getView().byId("crProductPictures").getBinding("pages").filter(new Filter("productID_productID", FilterOperator.EQ, sProduct.productID));
                // var oDataModel = this.getView().getModel();
                // var oBindPictures = oDataModel.bindContext("/ProductAttachments", undefined, {
                //     $filter: "productID_productID eq " + sProduct.productID,
                //     $$groupId: "directRequest"
                // });

                // oBindPictures.requestObject().then((oData) => {
                //     that.getView().setModel(new JSONModel(oData.value), "ProductPictures");
                // });
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
                if (this.getView().getModel("Product") === undefined) {
                    return;
                }
                var sProduct = this.getView().getModel("Product").getData();

                var oBindProduct = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $filter: "productID eq " + sProduct.productID,
                    $$groupId: "directRequest"
                });

                oBindProduct.requestContexts().then((aContext) => {
                    aContext[0].setProperty("status_statusID", "DCTV");
                    oDataModel.submitBatch("batchRequest").then(() => {
                        that.getArtisanProducts();
                    });
                });
            },

            onActivateProduct: function () {
                var that = this;

                //boş bir model oluşturuyoruz
                var oDataModel = this.getView().getModel();

                //Ürün sayfasındaki model boş mu kontrolü yapıyoruz
                if (this.getView().getModel("Product").getData() === undefined) {
                    return;
                }

                //Modelde üzerinde bulunduğumuz ürün bilgilerini bi arraye atadık
                var sProduct = this.getView().getModel("Product").getData();

                //ArtisanProduct dbsine seçili ürünün idsi direct olarak bind ediliyor
                var oBindProduct = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $filter: "productID eq " + sProduct.productID,
                    $$groupId: "directRequest"
                });

                //bind edilen id objecti ile status özelliğine avlb set ediyoruz
                //update işlemi için submitbatch ve toplu işlem olarak batchrequest yapılıyor
                oBindProduct.requestContexts().then((aContext) => {
                    aContext[0].setProperty("status_statusID", "AVLB");
                    oDataModel.submitBatch("batchRequest").then(() => {
                        that.getArtisanProducts();
                    });
                });
            },

            onDeleteProduct: function (oEvent) {
                var that = this;
                var oDataModel = this.getView().getModel();
                var sSelected = this.getView().getModel("Product").getData();
                var oSelected = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $filter: "productID eq " + sSelected.productID,
                    $$groupId: "directRequest"
                });

                oSelected.requestContexts().then((aContext) => {
                    aContext[0].delete("directRequest").then(function () {
                        that.getArtisanProducts();
                    });
                });
            }

        });
    });
