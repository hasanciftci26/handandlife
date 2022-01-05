// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/util/Storage",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageBox, MessageToast, Storage, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend("renova.hl.ui.artisan.controller.Orders", {
            onInit: function () {
                this.getRouter().getRoute("Orders").attachPatternMatched(this._onObjectMatched, this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
            onNavToProducts: function () {
                this.getRouter().navTo("Products");
            },
            onChangeAccountPassword: function () {
                this.onChangePassword(this);
            },
            // @ts-ignore
            _onObjectMatched: async function () {
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
                this.getOrders();
                this.getCountries();
                this.getCities();
            },
            getCountries: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                var oBindCountries = oDataModel.bindContext("/Countries", undefined, {
                    $$groupId: "directRequest"
                });

                oBindCountries.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "Countries");
                });
            },
            getCities: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                var oBindCityContext = oDataModel.bindContext("/Cities", undefined,
                    {
                        $$groupId: "directRequest"
                    });

                oBindCityContext.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "Cities");
                });
            },
            getUnits: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                // oDataModel.setSizeLimit(25000);
                var oBindUnits = oDataModel.bindContext("/Units", undefined, {
                    $$groupId: "directRequest"
                });
                return new Promise((resolve) => {
                    oBindUnits.requestObject().then((oData) => {
                        resolve(oData.value);
                    });
                });
            },
            getOrders: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                // oDataModel.setSizeLimit(25000);
                var aProductId = [];

                var oBindProduct = oDataModel.bindContext("/ArtisanProducts", undefined,
                    {
                        // @ts-ignore
                        $filter: "email_email eq '" + sap.ui.getCore().email + "'",
                        $$groupId: "directRequest"
                    });

                oBindProduct.requestObject().then((oData) => {
                    oData.value.forEach((item) => {
                        aProductId.push(item.productID);
                    });
                    that.getAllOrders(aProductId, oData.value);
                });
            },
            getAllOrders: async function (aProductId, aProducts) {
                var that = this;
                var oDataModel = this.getView().getModel();
                // oDataModel.setSizeLimit(25000);
                var aFilter = [];
                var aOrderItems = [];

                aProductId.forEach((element) => {
                    aFilter.push(new Filter("productID_productID", FilterOperator.EQ, element));
                });
                var oBindOrderItems = oDataModel.bindList("/OrderItems", undefined, undefined, undefined,
                    {
                        // @ts-ignore
                        $$groupId: "directRequest"
                    }).filter(aFilter);

                sap.ui.core.BusyIndicator.show();
                oBindOrderItems.requestContexts().then((oContext) => {
                    oContext.forEach((element) => {
                        var sObject = element.getObject();
                        sObject.price = Number(sObject.price);
                        aOrderItems.push(sObject);
                    });
                    sap.ui.core.BusyIndicator.hide();
                    that.setOrders(aOrderItems, aProducts, aFilter);
                });
            },
            setOrders: async function (aOrderItems, aProducts, aFilter) {
                var that = this;
                var aUnits = await this.getUnits();
                var aNewOrders = aOrderItems.filter((item) => { return item.status_statusID === "CRTD"; });
                var aPreparedOrders = aOrderItems.filter((item) => { return item.status_statusID === "PRPR"; });
                var aCargoOrders = aOrderItems.filter((item) => { return item.status_statusID === "CRGO"; });
                var aCompletedOrders = aOrderItems.filter((item) => { return item.status_statusID === "CMPL"; });

                aNewOrders = this.combineProductOrderItems(aNewOrders, aProducts, aUnits);
                aPreparedOrders = this.combineProductOrderItems(aPreparedOrders, aProducts, aUnits);
                aCargoOrders = this.combineProductOrderItems(aCargoOrders, aProducts, aUnits);
                aCompletedOrders = this.combineProductOrderItems(aCompletedOrders, aProducts, aUnits);

                this.getView().byId("itfNewOrders").setCount(aNewOrders.length);
                this.getView().byId("itfPreparedOrders").setCount(aPreparedOrders.length);
                this.getView().byId("itfCargoOrders").setCount(aCargoOrders.length);
                this.getView().byId("itfCompletedOrders").setCount(aCompletedOrders.length);
                this.getView().setModel(new JSONModel(aNewOrders), "NewOrders");
                this.getView().setModel(new JSONModel(aPreparedOrders), "PreparedOrders");
                this.getView().setModel(new JSONModel(aCargoOrders), "CargoOrders");
                this.getView().setModel(new JSONModel(aCompletedOrders), "CompletedOrders");
                this.setPictures(aFilter);
            },
            onNavToLoginPage: function () {
                this.getRouter().navTo("Login");
            },
            combineProductOrderItems: function (aOrderItems, aProducts, aUnits) {
                aOrderItems.forEach((element) => {
                    var sProduct = aProducts.find((item) => { return item.productID === element.productID_productID; });
                    var sOrderUnit = aUnits.find((item) => { return item.unitID === element.unit_unitID; });
                    var sProductUnit = aUnits.find((item) => { return item.unitID === sProduct.unit_unitID; });

                    if (sProduct !== undefined) {
                        element.productCurrency = sProduct.currency_currencyCode;
                        element.productPrice = sProduct.price;
                        element.productName = sProduct.productName;
                        element.productQuantity = sProduct.stock;
                        element.productUnit = sProduct.unit_unitID;
                        element.productUnitText = sProductUnit.unit;
                        element.orderUnit = sOrderUnit.unit;
                    }
                });
                aOrderItems.sort((a, b) => { return a.orderID_orderID - b.orderID_orderID; });
                return aOrderItems;
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
            onPrepareOrder: function (oEvent) {
                var that = this;
                var sOrder = oEvent.getSource().getBindingContext("NewOrders").getProperty();
                var aMessage = [sOrder.orderID_orderID, sOrder.productName];

                MessageBox.confirm(this.getResourceBundle().getText("ConfirmPreparation", aMessage), {
                    title: this.getResourceBundle().getText("PleaseConfirm"),
                    actions: [sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.OK,
                    initialFocus: null,
                    onClose: function (oAction) {
                        that.setOrderPrepared(sOrder);
                    }
                });
            },
            setOrderPrepared: function (sOrder) {
                var that = this;
                var oDataModel = this.getView().getModel();
                // oDataModel.setSizeLimit(25000);
                var aFilter = [];

                aFilter.push(new Filter("orderID_orderID", FilterOperator.EQ, sOrder.orderID_orderID));
                aFilter.push(new Filter("itemNo", FilterOperator.EQ, sOrder.itemNo));

                var oBindOrderItems = oDataModel.bindList("/OrderItems", undefined, undefined, undefined,
                    {
                        // @ts-ignore
                        $$groupId: "directRequest"
                    }).filter(aFilter);

                oBindOrderItems.requestContexts().then((oContext) => {
                    oContext[0].setProperty("status_statusID", "PRPR");
                    sap.ui.core.BusyIndicator.show();
                    oDataModel.submitBatch("batchRequest").then(() => {
                        sap.ui.core.BusyIndicator.hide();
                        that._onObjectMatched();
                    });
                })
            },
            onShipmentPress: function (oEvent) {
                var sOrder = oEvent.getSource().getBindingContext("PreparedOrders").getProperty();
                this.sOrder = sOrder;
                var sOrderInformations = {
                    OrderNo: this.getResourceBundle().getText("OrderNo") + ": " + sOrder.orderID_orderID,
                    ProductName: this.getResourceBundle().getText("ProductName") + ": " + sOrder.productName,
                    ProductID: this.getResourceBundle().getText("ProductID") + ": " + sOrder.productID_productID,
                };
                this.getView().setModel(new JSONModel(sOrderInformations), "OrderInformation");
                this.getView().setModel(new JSONModel({}), "CargoInformation");
                this.getShipmentDialog().open();
            },
            getShipmentDialog: function () {
                if (!this.oShipmentDialog) {
                    this.oShipmentDialog = sap.ui.xmlfragment("renova.hl.ui.artisan.fragments.Shipment", this);
                    this.getView().addDependent(this.oShipmentDialog);
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oShipmentDialog);
                }
                return this.oShipmentDialog;
            },
            onCompleteShipment: function (oEvent) {
                var that = this;
                var oDataModel = this.getView().getModel();
                // oDataModel.setSizeLimit(25000);
                var aFilter = [];

                var sCargoInfo = this.getView().getModel("CargoInformation").getData();
                var sOrder = this.sOrder;

                if (sCargoInfo.ShipmentNo === undefined || sCargoInfo.CargoBranch === undefined ||
                    sCargoInfo.ShipmentNo === "" || sCargoInfo.CargoBranch === "") {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }

                aFilter.push(new Filter("orderID_orderID", FilterOperator.EQ, sOrder.orderID_orderID));
                aFilter.push(new Filter("itemNo", FilterOperator.EQ, sOrder.itemNo));

                var oBindOrderItems = oDataModel.bindList("/OrderItems", undefined, undefined, undefined,
                    {
                        // @ts-ignore
                        $$groupId: "directRequest"
                    }).filter(aFilter);

                oBindOrderItems.requestContexts().then((oContext) => {
                    oContext[0].setProperty("status_statusID", "CRGO");
                    oContext[0].setProperty("cargoNumber", sCargoInfo.ShipmentNo);
                    oContext[0].setProperty("cargoBranch", sCargoInfo.CargoBranch);
                    sap.ui.core.BusyIndicator.show();
                    oDataModel.submitBatch("batchRequest").then(() => {
                        sap.ui.core.BusyIndicator.hide();
                        that.getShipmentDialog().close();
                        that._onObjectMatched();
                    });
                })
            },
            onCancelShipment: function () {
                this.getShipmentDialog().close();
            },
            getProductPicture: function (iurl) {
                var settings = {
                    url: iurl,
                    method: "GET",
                    xhrFields: {
                        responseType: "blob"
                    }
                }

                return new Promise((resolve, reject) => {
                    $.ajax(settings).done((result, textStatus, request) => {
                        resolve(result);
                    }).fail((err) => {
                        reject(err);
                    });
                });
            },
            setPictures: function (aFilter) {
                var that = this;
                var aPictures = [];
                var oDataModel = this.getView().getModel();
                var oNewOrders = this.getView().getModel("NewOrders");
                var oPreparedOrders = this.getView().getModel("PreparedOrders");
                var oCargoOrders = this.getView().getModel("CargoOrders");
                var oCompletedOrders = this.getView().getModel("CompletedOrders");
                var aNewOrders = oNewOrders.getData();
                var aPreparedOrders = oPreparedOrders.getData();
                var aCargoOrders = oCargoOrders.getData();
                var aCompletedOrders = oCompletedOrders.getData();

                var oBindProductPictures = oDataModel.bindList("/ProductAttachments", undefined, undefined, undefined,
                    {
                        // @ts-ignore
                        $$groupId: "directRequest"
                    }).filter(aFilter);

                var oPromise = new Promise((resolve) => {
                    oBindProductPictures.requestContexts().then(async (oPictures) => {
                        var index = 0;
                        for (var picture of oPictures) {
                            aPictures.push(picture.getObject());
                            var oPictureBlob = await that.getProductPicture(picture.getObject().url);
                            var vPictureURL = window.URL.createObjectURL(oPictureBlob);
                            aPictures[index].pictureURL = vPictureURL;
                            index++;
                            if (index === oPictures.length) {
                                resolve(aPictures);
                            }
                        }
                    });
                });
                oPromise.then((resolve) => {
                    aNewOrders.forEach((item) => {
                        var sPicture = resolve.find((element) => { return element.productID_productID === item.productID_productID });
                        item.pictureURL = sPicture ? sPicture.pictureURL : "";
                    });
                    aPreparedOrders.forEach((item) => {
                        var sPicture = resolve.find((element) => { return element.productID_productID === item.productID_productID });
                        item.pictureURL = sPicture ? sPicture.pictureURL : "";
                    });
                    aCargoOrders.forEach((item) => {
                        var sPicture = resolve.find((element) => { return element.productID_productID === item.productID_productID });
                        item.pictureURL = sPicture ? sPicture.pictureURL : "";
                    });
                    aCompletedOrders.forEach((item) => {
                        var sPicture = resolve.find((element) => { return element.productID_productID === item.productID_productID });
                        item.pictureURL = sPicture ? sPicture.pictureURL : "";
                    });

                    oNewOrders.setData(aNewOrders);
                    oNewOrders.refresh();

                    oPreparedOrders.setData(aPreparedOrders);
                    oPreparedOrders.refresh();

                    oCargoOrders.setData(aCargoOrders);
                    oCargoOrders.refresh();

                    oCompletedOrders.setData(aCompletedOrders);
                    oCompletedOrders.refresh();
                });
            },
            onNewOrderDetails: function (oEvent) {
                var sOrder = oEvent.getSource().getBindingContext("NewOrders").getProperty();
                this.getOrderDetails(sOrder, "N");
            },
            onPreparedOrderDetails: function (oEvent) {
                var sOrder = oEvent.getSource().getBindingContext("PreparedOrders").getProperty();
                this.getOrderDetails(sOrder, "P");
            },
            onCargoOrderDetails: function (oEvent) {
                var sOrder = oEvent.getSource().getBindingContext("CargoOrders").getProperty();
                this.getOrderDetails(sOrder, "S");
            },
            onCompletedOrderDetails: function (oEvent) {
                var sOrder = oEvent.getSource().getBindingContext("CompletedOrders").getProperty();
                this.getOrderDetails(sOrder, "C");
            },
            getOrderDetails: function (sOrder, Status) {
                var that = this;
                var oDataModel = this.getView().getModel();
                // oDataModel.setSizeLimit(25000);
                var aCountries = this.getView().getModel("Countries").getData();
                var aCities = this.getView().getModel("Cities").getData();
                var vOrderId = sOrder.orderID_orderID;
                var vStatus = "";

                switch (Status) {
                    case "N":
                        vStatus = this.getResourceBundle().getText("NewOrderStatus");
                        break;
                    case "P":
                        vStatus = this.getResourceBundle().getText("PreparedOrderStatus");
                        break;
                    case "S":
                        vStatus = this.getResourceBundle().getText("ShipmentOrderStatus");
                        break;
                    case "C":
                        vStatus = this.getResourceBundle().getText("CompletedOrderStatus");
                        break;
                }

                var oBindOrder = oDataModel.bindContext("/Orders", undefined, {
                    $filter: "orderID eq '" + vOrderId + "'",
                    $$groupId: "directRequest"
                });

                oBindOrder.requestObject().then((oData) => {
                    var sOrderDetail = oData.value[0];

                    var sOrderModelData = {
                        CustomerFirstName: sOrderDetail.firstName,
                        CustomerLastName: sOrderDetail.lastName,
                        CustomerCountry: aCountries.find((item) => { return item.countryCode === sOrderDetail.country_countryCode }).country,
                        CustomerCity: aCities.find((item) => { return item.cityCode === sOrderDetail.cityCode }).city,
                        CustomerAddress: sOrderDetail.address,
                        CreatedAt: new Date(sOrderDetail.createdAt),
                        Category: sOrder.category_categoryID,
                        OrderPrice: sOrder.price,
                        OrderCurrency: sOrder.currency_currencyCode,
                        OrderId: sOrder.orderID_orderID,
                        OrderQuantity: sOrder.quantity,
                        OrderUnit: sOrder.unit_unitID,
                        OrderUnitText: sOrder.orderUnit,
                        ProductId: sOrder.productID_productID,
                        ProductName: sOrder.productName,
                        ProductPrice: Number(sOrder.productPrice),
                        ProductCurrency: sOrder.productCurrency,
                        ProductQuantity: sOrder.productQuantity,
                        ProductUnit: sOrder.productUnit,
                        ProductUnitText: sOrder.productUnitText,
                        Status: vStatus
                    };
                    that.getView().setModel(new JSONModel(sOrderModelData), "OrderDetails");
                    that.getOrderDetailsDialog().open();
                });
            },
            getOrderDetailsDialog: function () {
                if (!this.oOrderDetailsDialog) {
                    this.oOrderDetailsDialog = sap.ui.xmlfragment("renova.hl.ui.artisan.fragments.OrderDetails", this);
                    this.getView().addDependent(this.oOrderDetailsDialog);
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oOrderDetailsDialog);
                }
                return this.oOrderDetailsDialog;
            },
            onCancelOrderDetails: function () {
                this.getOrderDetailsDialog().close();
            },
            onGoToProductDetails: function () {
                var vProductId = this.getView().getModel("OrderDetails").getData().ProductId;
                this.getRouter().navTo("Products", {
                    productId: vProductId
                });
            }
        });
    });
