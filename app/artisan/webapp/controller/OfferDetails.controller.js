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

        return BaseController.extend("renova.hl.ui.artisan.controller.OfferDetails", {
            onInit: function () {
                this.getRouter().getRoute("OfferDetails").attachPatternMatched(this._onObjectMatched, this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
            _onObjectMatched: async function (oEvent) {
                var that = this;
                this.getView().setModel(new JSONModel({}), "OfferDetails");
                this.getView().setModel(new JSONModel([]), "ProductProperties");

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
                var vOfferId = oEvent.getParameter("arguments").offerId.split("#")[0];
                var vOfferType = oEvent.getParameter("arguments").offerId.split("#")[1];
                await this.getCurrencies();
                this.getOfferDetails(vOfferId, vOfferType);
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
            onNavToProducts: function () {
                this.getRouter().navTo("Products");
            },
            onNavToOrders: function () {
                this.getRouter().navTo("Orders");
            },
            onNavToOffers: function () {
                this.getRouter().navTo("Offers");
            },
            onOpenNotifications: function (oEvent) {
                var oButton = oEvent.getSource();
                this.displayIncomingOrders(this, oButton);
            },
            onNavToHomePage: function () {
                this.getRouter().navTo("HomePage");
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
            getProductProperties: async function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                return new Promise((resolve) => {
                    var oBindProperties = oDataModel.bindContext("/Properties", undefined, {
                        $$groupId: "directRequest"
                    });

                    oBindProperties.requestObject().then((oData) => {
                        that.getView().setModel(new JSONModel(oData.value), "Properties");
                        resolve();
                    });
                });
            },
            getOfferDetails: async function (vOfferId, vOfferType) {
                await this.getProductProperties();
                var sOfferDetails = {};
                if (vOfferType === "W") {
                    var aWaitingOffers = sap.ui.getCore().getModel("WaitingOffers").getData();
                    var sOfferDetails = aWaitingOffers.find((item) => { return item.OfferId === vOfferId });
                    this.getView().byId("OfferDetails").setShowFooter(true);
                    this.getView().byId("sfOfferGivenBefore").setVisible(false);
                } else {
                    var aCompletedOffers = sap.ui.getCore().getModel("CompletedOffers").getData();
                    var sOfferDetails = aCompletedOffers.find((item) => { return item.OfferId === vOfferId });
                    this.getView().byId("OfferDetails").setShowFooter(false);
                    this.getView().byId("sfOfferGivenBefore").setVisible(true);
                    sOfferDetails.Price = Number(sOfferDetails.Price);
                }
                this.getView().setModel(new JSONModel(sOfferDetails), "OfferDetails");
                this.getNonExistProductProperties(sOfferDetails.ProductId);
            },
            getNonExistProductProperties: function (vProductId) {
                var that = this;
                var oDataModel = this.getView().getModel();
                var aProperties = this.getView().getModel("Properties").getData();
                var aUnits = sap.ui.getCore().getModel("Units").getData();
                var aProductProperties = [];

                var oBindProperties = oDataModel.bindContext("/ProductProperties", undefined, {
                    $filter: "productID_productID eq " + vProductId,
                    $$groupId: "directRequest"
                });

                oBindProperties.requestObject().then((oData) => {
                    oData.value.forEach((item) => {
                        var sUnit = aUnits.find((element) => { return element.unitID === item.unit_unitID; });
                        var sProperty = aProperties.find((element) => { return element.propertyID === item.propertyID_propertyID; });

                        aProductProperties.push({
                            PropertyId: item.propertyID_propertyID,
                            Property: sProperty ? sProperty.property : "",
                            PropertyValue: item.propertyValue,
                            UnitId: item.unit_unitID,
                            UnitText: sUnit ? sUnit.unit : ""
                        });
                    });
                    that.getView().setModel(new JSONModel(aProductProperties), "ProductProperties");
                });
            },
            onGiveOffer: function () {
                this.getView().setModel(new JSONModel({}), "GivenOfferDetails");
                if (this.getView().getModel("OfferDetails").getData().OfferId) {
                    this.getOfferDialog().open();
                }
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

                var sOffer = this.getView().getModel("OfferDetails").getData();
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
                        that.getRouter().navTo("Offers");
                    }
                }
                );
            }
        });
    });
