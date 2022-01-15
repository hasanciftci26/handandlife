// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/util/Storage",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageBox, Storage, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend("renova.hl.ui.artisan.controller.Offers", {
            onInit: function () {
                this.getRouter().getRoute("Offers").attachPatternMatched(this._onObjectMatched, this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
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
                await this.getCategories();
                await this.getCountries();
                await this.getCities();
                await this.getProductProperties();
                await this.getUnits();
                this.getWaitingOffers();
            },
            onNavToLoginPage: function () {
                this.getRouter().navTo("Login");
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

                var oBindCities = oDataModel.bindContext("/Cities", undefined, {
                    $$groupId: "directRequest"
                });

                oBindCities.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "Cities");
                });
            },
            getProductProperties: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                var oBindProperties = oDataModel.bindContext("/Properties", undefined, {
                    $$groupId: "directRequest"
                });

                oBindProperties.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "Properties");
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
            onNavToProducts: function () {
                this.getRouter().navTo("Products");
            },
            onNavToOrders: function () {
                this.getRouter().navTo("Orders");
            },
            onOpenNotifications: function (oEvent) {
                var oButton = oEvent.getSource();
                this.displayIncomingOrders(this, oButton);
            },
            onNavToHomePage: function () {
                this.getRouter().navTo("HomePage");
            },
            getWaitingOffers: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                var oBindOffers = oDataModel.bindContext("/ArtisanOffers", undefined, {
                    $filter: "email_email eq '" + sap.ui.getCore().email + "'",
                    $$groupId: "directRequest"
                });

                oBindOffers.requestObject().then((oData) => {
                    if (oData.value.length) {
                        that.getNonExistProductProperties(oData.value);
                    }
                });
            },
            getNonExistProductProperties: function (aOffers) {
                var that = this;
                var aFilter = [];
                var oDataModel = this.getView().getModel();
                var aProperties = [];

                aOffers.forEach((item) => {
                    aFilter.push(new Filter("productID_productID", FilterOperator.EQ, item.productID));
                });


                var oBindProperties = oDataModel.bindList("/ProductProperties", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindProperties.requestContexts().then((aContext) => {
                    aContext.forEach((item) => {
                        aProperties.push(item.getObject());
                    });
                    that.getOrderDetails(aProperties, aOffers);
                });
            },
            getOrderDetails: function (aProperties, aOffers) {
                var that = this;
                var aFilter = [];
                var oDataModel = this.getView().getModel();
                var aOrders = [];

                aOffers.forEach((item) => {
                    aFilter.push(new Filter("orderID", FilterOperator.EQ, item.orderID));
                });

                var oBindOrders = oDataModel.bindList("/Orders", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindOrders.requestContexts().then((aContext) => {
                    aContext.forEach((item) => {
                        aOrders.push(item.getObject());
                    });
                    that.getOrderItems(aProperties, aOffers, aOrders, aFilter);
                });
            },
            getOrderItems: function (aProperties, aOffers, aOrders, aFilter) {
                var that = this;
                var oDataModel = this.getView().getModel();
                var aOrderItems = [];

                aFilter.forEach((item) => {
                    item.sPath = "orderID_orderID";
                });

                var oBindOrders = oDataModel.bindList("/OrderItems", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindOrders.requestContexts().then((aContext) => {
                    aContext.forEach((item) => {
                        aOrderItems.push(item.getObject());
                    });
                    that.setAllData(aProperties, aOffers, aOrders, aOrderItems);
                });
            },
            setAllData: function (aProperties, aOffers, aOrders, aOrderItems) {
                var aCountries = this.getView().getModel("Countries").getData();
                var aCities = this.getView().getModel("Cities").getData();
                var aUnits = this.getView().getModel("Units").getData();
                var aCategories = this.getView().getModel("Categories").getData();
                var aOfferData = [];

                aOffers.forEach((item) => {
                    var sOrder = aOrders.find((element) => { return element.orderID === item.orderID; });
                    var sOrderItem = aOrderItems.find((element) => {
                        return element.orderID_orderID === item.orderID && element.itemNo === item.itemNo;
                    });

                    if (sOrder) {
                        var sCountry = aCountries.find((element) => { return element.countryCode === sOrder.country_countryCode; });
                        var sCity = aCities.find((element) => { return element.cityCode === sOrder.cityCode; });
                    }
                    if (sOrderItem) {
                        var sUnit = aUnits.find((element) => { return element.unitID === sOrderItem.unit_unitID; });
                        var sCategory = aCategories.find((element) => { return element.categoryID === sOrderItem.category_categoryID; });
                    }

                    aOfferData.push({
                        ItemNo: item.itemNo,
                        LastOfferDate: new Date(item.offerExpireEnd),
                        OrderNo: item.orderID,
                        OfferId: item.offerID,
                        ProductId: item.productID,
                        Status: item.status_statusID,
                        CustomerCountryCode: sCountry.countryCode ? sCountry.countryCode : "",
                        CustomerCityCode: sCity.cityCode ? sCity.cityCode : "",
                        CustomerCountry: sCountry.country ? sCountry.country : "",
                        CustomerCity: sCity.city ? sCity.city : "",
                        Quantity: sOrderItem.quantity ? sOrderItem.quantity : "",
                        UnitId: sUnit.unitID ? sUnit.unitID : "",
                        UnitText: sUnit.unit ? sUnit.unit : "",
                        CustomerFirstName: sOrder.firstName ? sOrder.firstName : "",
                        CustomerLastName: sOrder.lastName ? sOrder.lastName : "",
                        CustomerAddress: sOrder.address ? sOrder.address : "",
                        CategoryId: sCategory.categoryID ? sCategory.categoryID : "",
                        Category: sCategory.category ? sCategory.category : "",
                        Price: item.price,
                        CurrencyCode: item.currency_currencyCode,
                        WorkDays: item.wordDays,
                        ExpireDateAfterOffer: sOrderItem.offerExpireEnd ? new Date(sOrderItem.offerExpireEnd) : ""
                    });
                });

                var aWaitingOffers = aOfferData.filter((item) => {
                    return item.Status === "WAIT";
                });

                var aCompletedOffers = aOfferData.filter((item) => {
                    return item.Status !== "WAIT";
                });

                aWaitingOffers.sort((a, b) => { return a.LastOfferDate - b.LastOfferDate; });
                var vNewDate = new Date();
                aCompletedOffers.forEach((item) => {
                    if (item.Status === "OFRD") {
                        item.OfferStatusText = this.getResourceBundle().getText("OfferIsWaiting");
                        item.OfferStatus = "Warning";
                        item.OfferStatusIcon = "sap-icon://pending";
                    } else if (item.Status === "ACTD") {
                        item.OfferStatusText = this.getResourceBundle().getText("OfferAccepted");
                        item.OfferStatus = "Success";
                        item.OfferStatusIcon = "sap-icon://sys-enter-2";
                    }
                    if (item.ExpireDateAfterOffer < vNewDate) {
                        item.OfferStatusText = this.getResourceBundle().getText("OfferTimeExpired");
                        item.OfferStatus = "Error";
                        item.OfferStatusIcon = "sap-icon://decline";
                    }
                });

                this.getView().setModel(new JSONModel(aWaitingOffers), "WaitingOffers");
                this.getView().setModel(new JSONModel(aCompletedOffers), "CompletedOffers");
                this.getView().byId("itfWaitingOffers").setCount(aWaitingOffers.length);
                this.getView().byId("itfGivenOffers").setCount(aCompletedOffers.length);
            }
        });
    });
