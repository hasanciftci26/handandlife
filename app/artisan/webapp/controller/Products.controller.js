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

                this.getCategories();
                this.getUnits();
                this.getCurrencies();
                
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

                    that._setScreenSimpleForm(that);
                });
            },

            _setScreenSimpleForm: function (thoose) {
                var vCount = thoose.getView().byId("lstArtisanProducts").getItems().length;
                if (vCount === 0) {
                    thoose.getView().byId("sfProductInfoForm").setVisible(false);
                } else {
                    thoose.getView().byId("sfProductInfoForm").setVisible(true);
                }
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
                var oProperty =this.getView().getModel("Prop"); 
                
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

                this.getProperties(vProductId);

                gProduct = sProduct;
                this.getView().byId("inpStock").setEditable(false);
                this.getView().byId("idUnit").setEditable(false);
                this.getView().byId("inpPrice").setEditable(false);
                this.getView().byId("idPrice").setEditable(false);
                this.getView().byId("idDetails").setEditable(false);
            },
            getProductPictures: function (sProduct) {
                var that = this;
                var aFilter = [];
                aFilter.push(new Filter("productID_productID", FilterOperator.EQ, sProduct.productID));
                this.getView().byId("crProductPictures").getBinding("pages").filter(aFilter);
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
                var oDataModel = this.getView().getModel();

                if (this.getView().getModel("Product").getData() === undefined) {
                    return;
                }

                var sProduct = this.getView().getModel("Product").getData();

                var oBindProduct = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $filter: "productID eq " + sProduct.productID,
                    $$groupId: "directRequest"
                });

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
                var oProductModel = this.getView().getModel("Product");
                var sSelected = oProductModel.getData();
                var oSelected = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $filter: "productID eq " + sSelected.productID,
                    $$groupId: "directRequest"
                });

                oSelected.requestContexts().then((aContext) => {
                    aContext[0].delete("directRequest").then(function () {
                        that.getView().byId("crProductPictures").getBinding("pages").filter(new Filter("email_email", FilterOperator.EQ, "aaaaa"));
                        oProductModel.setData({});
                        oProductModel.refresh();
                        that.getArtisanProducts();
                    });
                });

                // that._setScreenSimpleForm(that);
            },

            onUpdStock: function () {
                this.getView().byId("inpStock").setEditable(true);
                this.getView().byId("idUnit").setEditable(true);
            },
            onUpdPrice: function () {
                this.getView().byId("inpPrice").setEditable(true);
                this.getView().byId("idPrice").setEditable(true);
            },
            onUpdDetails: function () {
                this.getView().byId("idDetails").setEditable(true);
            },
            onUpdateProduct: function () {

                var that = this;
                var oDataModel = that.getView().getModel();
                var sProduct = that.getView().getModel("Product").getData();

                this.getView().byId("inpStock").setEditable(false);
                this.getView().byId("idUnit").setEditable(false);
                this.getView().byId("inpPrice").setEditable(false);
                this.getView().byId("idPrice").setEditable(false);
                this.getView().byId("idDetails").setEditable(false);

                var vProductInfoControl = this.checkMandatoryFields("sfProductInfoForm", this);
                if (vProductInfoControl) {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }

                var oBindProduct = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $filter: "productID eq " + sProduct.productID,
                    $$groupId: "directRequest"
                });

                oBindProduct.requestContexts().then((aContext) => {
                    aContext[0].setProperty(
                        "stock", sProduct.stock
                    );
                    aContext[0].setProperty(
                        "price", sProduct.price,
                    );
                    aContext[0].setProperty(
                        "currency_currencyCode", sProduct.currency_currencyCode,
                    );
                    aContext[0].setProperty(
                        "unit_unitID", sProduct.unit_unitID,
                    );
                    aContext[0].setProperty(
                        "details", sProduct.details,
                    );
                    oDataModel.submitBatch("batchRequest").then(() => {
                        that.getArtisanProducts();
                        // MessageToast.show(this.getResourceBundle().getText("UpdateSuccessful"));
                    });

                });

            },
        });
    });
