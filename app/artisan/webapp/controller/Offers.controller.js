// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/util/Storage",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageBox, Storage, Filter, FilterOperator, MessageToast) {
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
                // await this.getCategories();
                // await this.getCountries();
                // await this.getCities();
                // await this.getUnits();
                // await this.getCurrencies();
                Promise.all([this.getCategories(), this.getCountries(), this.getCities(), this.getUnits(), this.getCurrencies()]).then(() => {
                    that.getWaitingOffers();
                });
            },
            onNavToAccountSettings: function () {
                this.getRouter().navTo("AccountSettings");
            },
            onNavToLoginPage: function () {
                this.getRouter().navTo("Login");
            },
            getCategories: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                return new Promise((resolve) => {
                    var oBindCategories = oDataModel.bindContext("/Categories", undefined, {
                        $$groupId: "directRequest"
                    });

                    oBindCategories.requestObject().then((oData) => {
                        that.getView().setModel(new JSONModel(oData.value), "Categories");
                        resolve();
                    });
                });
            },
            getCurrencies: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                return new Promise((resolve) => {
                    var oBindCurrencies = oDataModel.bindContext("/Currencies", undefined, {
                        $$groupId: "directRequest"
                    });

                    oBindCurrencies.requestObject().then((oData) => {
                        that.getView().setModel(new JSONModel(oData.value), "Currencies");
                        resolve();
                    });
                });
            },
            getCountries: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                return new Promise((resolve) => {
                    var oBindCountries = oDataModel.bindContext("/Countries", undefined, {
                        $$groupId: "directRequest"
                    });

                    oBindCountries.requestObject().then((oData) => {
                        that.getView().setModel(new JSONModel(oData.value), "Countries");
                        resolve();
                    });
                });
            },
            getCities: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                return new Promise((resolve) => {
                    var oBindCities = oDataModel.bindContext("/Cities", undefined, {
                        $$groupId: "directRequest"
                    });

                    oBindCities.requestObject().then((oData) => {
                        that.getView().setModel(new JSONModel(oData.value), "Cities");
                        resolve();
                    });
                });
            },
            getUnits: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                return new Promise((resolve) => {
                    var oBindUnits = oDataModel.bindContext("/Units", undefined, {
                        $$groupId: "directRequest"
                    });

                    oBindUnits.requestObject().then((oData) => {
                        that.getView().setModel(new JSONModel(oData.value), "Units");
                        sap.ui.getCore().setModel(new JSONModel(oData.value), "Units");
                        resolve();
                    });
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
                        that.getOrderDetails(oData.value);
                    }
                });
            },
            getOrderDetails: function (aOffers) {
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
                    that.getOrderItems(aOffers, aOrders, aFilter);
                });
            },
            getOrderItems: function (aOffers, aOrders, aFilter) {
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
                    that.setAllData(aOffers, aOrders, aOrderItems);
                });
            },
            setAllData: function (aOffers, aOrders, aOrderItems) {
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
                        CustomerCountryCode: sCountry ? sCountry.countryCode : "",
                        CustomerCityCode: sCity ? sCity.cityCode : "",
                        CustomerCountry: sCountry ? sCountry.country : "",
                        CustomerCity: sCity ? sCity.city : "",
                        Quantity: sOrderItem ? sOrderItem.quantity : "",
                        UnitId: sUnit ? sUnit.unitID : "",
                        UnitText: sUnit ? sUnit.unit : "",
                        CustomerFirstName: sOrder ? sOrder.firstName : "",
                        CustomerLastName: sOrder ? sOrder.lastName : "",
                        CustomerAddress: sOrder ? sOrder.address : "",
                        CategoryId: sCategory ? sCategory.categoryID : "",
                        Category: sCategory ? sCategory.category : "",
                        Price: item.price,
                        CurrencyCode: item.currency_currencyCode,
                        WorkDays: item.workDays,
                        ExpireDateAfterOffer: sOrderItem ? new Date(sOrderItem.offerExpireEnd) : "",
                        OfferDetails: item.details,
                        OrderStatus: sOrderItem ? sOrderItem.status_statusID : "",
                        CargoBranch: sOrderItem ? sOrderItem.cargoBranch : "",
                        CargoNumber: sOrderItem ? sOrderItem.cargoNumber : "",
                        OrderStatusText: ""
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
                    if (item.OrderStatus === "CRTD") {
                        item.OrderStatusText = this.getResourceBundle().getText("WaitingPreparation");
                        item.OrderState = "Error";
                    } else if (item.OrderStatus === "PRPR") {
                        item.OrderStatusText = this.getResourceBundle().getText("WaitingCargo");
                        item.OrderState = "Information";
                    } else if (item.OrderStatus === "CRGO") {
                        item.OrderStatusText = this.getResourceBundle().getText("CargoInfo");
                        item.OrderState = "Warning";
                    }
                    else if (item.OrderStatus === "CMPL") {
                        item.OrderStatusText = this.getResourceBundle().getText("CompletedOrder");
                        item.OrderState = "Success";
                    }
                });

                this.getView().setModel(new JSONModel(aWaitingOffers), "WaitingOffers");
                sap.ui.getCore().setModel(new JSONModel(aWaitingOffers), "WaitingOffers");
                this.getView().setModel(new JSONModel(aCompletedOffers), "CompletedOffers");
                sap.ui.getCore().setModel(new JSONModel(aCompletedOffers), "CompletedOffers");
                this.getView().byId("itfWaitingOffers").setCount(aWaitingOffers.length);
                this.getView().byId("itfGivenOffers").setCount(aCompletedOffers.length);
            },
            onNavToOfferDetails: function (oEvent) {
                var vOfferId = oEvent.getSource().getBindingContext("WaitingOffers").getProperty("OfferId");
                this.getRouter().navTo("OfferDetails", {
                    offerId: vOfferId + "#W" //Eğer teklif bekleyenden detaya giderse teklif ver butonu görünür olacak
                });
            },
            onNavToCompletedOfferDetails: function (oEvent) {
                var vOfferId = oEvent.getSource().getBindingContext("CompletedOffers").getProperty("OfferId");
                this.getRouter().navTo("OfferDetails", {
                    offerId: vOfferId + "#C" //Eğer teklif verilmişlerden detaya giderse teklif ver butonu görünmeyecek
                });
            },
            onGiveOffer: function (oEvent) {
                var sWaitingOffer = oEvent.getSource().getBindingContext("WaitingOffers").getObject();
                this.getView().setModel(new JSONModel({}), "GivenOfferDetails");
                this.getView().setModel(new JSONModel(sWaitingOffer), "GivenOfferData");
                this.getOfferDialog().open();
            },
            getOfferDialog: function () {
                if (!this.oOfferDialog) {
                    this.oOfferDialog = sap.ui.xmlfragment("renova.hl.ui.artisan.fragments.GiveOffer", this);
                    this.getView().addDependent(this.oOfferDialog);
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oOfferDialog);
                }
                return this.oOfferDialog;
            },
            onCancelGiveOffer: function () {
                this.getOfferDialog().close();
            },
            onCompleteGiveOffer: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var sOfferDetail = this.getView().getModel("GivenOfferDetails").getData();
                var vRegexPrice = /^\d{1,7}([\.,]\d{2})?$/;
                var vRegexWorkdays = /^\d+$/;

                if (!sOfferDetail.Price || !sOfferDetail.WorkDays || !sOfferDetail.Details) {
                    var vMessage = this.getResourceBundle().getText("FillRequireBlanks");
                    MessageToast.show(vMessage);
                    return;
                }
                if (!sOfferDetail.Currency) {
                    MessageToast.show(this.getResourceBundle().getText("CurrencySelectList"));
                    return;
                }

                if (!vRegexPrice.test(sOfferDetail.Price)) {
                    MessageToast.show(this.getResourceBundle().getText("PriceFormat"));
                    return;
                }
                if (!vRegexWorkdays.test(sOfferDetail.WorkDays)) {
                    MessageToast.show(this.getResourceBundle().getText("WorkDaysWarning"));
                    return;
                }
                this.getOfferDialog().close();

                var sOffer = this.getView().getModel("GivenOfferData").getData();
                sOfferDetail.Price = sOfferDetail.Price.replace(",", ".");
                var vFilter = "orderID eq '" + sOffer.OrderNo + "' and offerID eq " + sOffer.OfferId;

                var oBindArtisanOffer = oDataModel.bindList("/ArtisanOffers", undefined, undefined, undefined, {
                    $filter: vFilter,
                    $$groupId: "directRequest"
                });

                oBindArtisanOffer.attachPatchCompleted(this.onGiveOfferPatchCompleted, this);

                oBindArtisanOffer.requestContexts().then((aContext) => {
                    aContext[0].setProperty("price", parseFloat(sOfferDetail.Price));
                    aContext[0].setProperty("currency_currencyCode", sOfferDetail.Currency);
                    aContext[0].setProperty("workDays", parseInt(sOfferDetail.WorkDays, 10));
                    aContext[0].setProperty("details", sOfferDetail.Details);
                    aContext[0].setProperty("status_statusID", "OFRD");
                    aContext[0].setProperty("offerExpireEnd", "9999-12-31T00:00:00Z");

                    oDataModel.submitBatch("batchRequest");
                });
            },
            onGiveOfferPatchCompleted: function (oEvent) {
                var that = this;

                MessageBox.information(
                    this.getResourceBundle().getText("OfferSuccessful"), {
                    icon: MessageBox.Icon.INFORMATION,
                    title: this.getResourceBundle().getText("Information"),
                    actions: [MessageBox.Action.OK],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (oAction) {
                        that._onObjectMatched();
                    }
                }
                );
            },
            onPrepareOrder: function (oEvent) {
                var that = this;
                var sCompletedOffer = oEvent.getSource().getBindingContext("CompletedOffers").getObject();
                var aMessage = [sCompletedOffer.OrderNo];

                MessageBox.confirm(this.getResourceBundle().getText("ConfirmPreparationV2", aMessage), {
                    title: this.getResourceBundle().getText("PleaseConfirm"),
                    actions: [sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.OK,
                    initialFocus: null,
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            that.setOrderPrepared(sCompletedOffer);
                        }
                    }
                });
            },
            setOrderPrepared: function (sOrder) {
                var that = this;
                var oDataModel = this.getView().getModel();
                // oDataModel.setSizeLimit(25000);
                var aFilter = [];

                aFilter.push(new Filter("orderID_orderID", FilterOperator.EQ, sOrder.OrderNo));
                aFilter.push(new Filter("itemNo", FilterOperator.EQ, sOrder.ItemNo));

                var oBindOrderItems = oDataModel.bindList("/OrderItems", undefined, undefined, undefined,
                    {
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
            onStartShipment: function (oEvent) {
                var sOrder = oEvent.getSource().getBindingContext("CompletedOffers").getObject();
                this.sOrder = sOrder;

                var sOrderInformations = {
                    OrderNo: this.getResourceBundle().getText("OrderNo") + ": " + sOrder.OrderNo,
                    ProductID: this.getResourceBundle().getText("ProductID") + ": " + sOrder.ProductId,
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

                aFilter.push(new Filter("orderID_orderID", FilterOperator.EQ, sOrder.OrderNo));
                aFilter.push(new Filter("itemNo", FilterOperator.EQ, sOrder.ItemNo));

                var oBindOrderItems = oDataModel.bindList("/OrderItems", undefined, undefined, undefined,
                    {
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
            onChangeOrderStatus: function (oEvent) {
                var aSelectedKeys = oEvent.getSource().getSelectedKeys();
                var aFilter = [];
                if (aSelectedKeys.length) {
                    aSelectedKeys.forEach((item) => {
                        aFilter.push(new Filter("Status", FilterOperator.EQ, "ACTD"));
                        aFilter.push(new Filter("OrderStatus", FilterOperator.EQ, item));
                    });
                }
                this.getView().byId("tblGivenOffers").getBinding("items").filter(aFilter);
            }
        });
    });
