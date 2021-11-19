// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "renova/hl/ui/artisan/model/formatter",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/ColorPalettePopover",
    "sap/ui/unified/ColorPickerDisplayMode",
    "sap/ui/util/Storage",
    "sap/m/MessageToast"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, formatter, Controller, JSONModel, MessageBox, Filter, FilterOperator, ColorPalettePopover, ColorPickerDisplayMode, Storage, MessageToast) {
        "use strict";

        return BaseController.extend("renova.hl.ui.artisan.controller.NewProduct", {
            formatter: formatter,
            onInit: function () {
                this.getView().setModel(new JSONModel({}), "NewProduct");
                this.getRouter().getRoute("NewProduct").attachPatternMatched(this._onObjectMatched, this);

                this.setComboboxReadonly("cbCategories", this);
                this.setComboboxReadonly("cbUnits", this);
                this.setComboboxReadonly("cbCurrencies", this);
                // this.setComboboxReadonly("cbBodySizes", this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
            _onObjectMatched: async function () {
                var that = this;
                var oStorage = new Storage(Storage.Type.session, "userLogin");
                var vLogin = false;

                if (oStorage.get("isLogin") !== null) {
                    vLogin = oStorage.get("isLogin").active
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
                if (!sap.ui.getCore().isLogin) {
                    return;
                }
                await this.getCategories();
                await this.getUnits();
                await this.getColors();
                await this.getCurrencies();
                this.getView().setModel(new JSONModel(this.getBodySizes()), "BodySizes");
                this.getView().setModel(new JSONModel({ ColorText: "" }), "Color");
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
            getColors: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindColors = oDataModel.bindContext("/Colors", undefined, {
                    $$groupId: "directRequest"
                });

                oBindColors.requestObject().then((oData) => {
                    that.aColors = oData.value;
                    sap.ui.getCore().aColors = oData.value;
                    sap.ui.getCore().vThis = that;
                });
            },
            onCategoryChanged: function (oEvent) {
                var vSelectedCategory = oEvent.getSource().getSelectedKey();
                this.getProperties(vSelectedCategory);
                oEvent.getSource().setValueState();
            },
            getProperties: function (vSelectedCategory) {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindProperties = oDataModel.bindContext("/Properties", undefined, {
                    $filter: "category_categoryID eq '" + vSelectedCategory + "' or commonProperty eq " + true,
                    $$groupId: "directRequest"
                });

                oBindProperties.requestObject().then((oData) => {
                    oData.value.forEach((item) => {
                        item.CommonInputVisible = that.setCommonInputVisible(item);
                    });
                    that.getView().setModel(new JSONModel(oData.value), "Properties");
                });
            },
            onSelectColor: function (oEvent) {
                var aPaletteColors = [];
                this.aColors.forEach((item) => {
                    aPaletteColors.push(item.hexCode);
                });

                if (!this.oColorPalettePopoverMin) {
                    this.oColorPalettePopoverMin = new ColorPalettePopover("oColorPalettePopoverMin", {
                        showDefaultColorButton: false,
                        showMoreColorsButton: false,
                        colors: aPaletteColors,
                        colorSelect: this.handleColorSelect
                    });
                }

                this.oColorPalettePopoverMin.openBy(oEvent.getSource());
            },
            handleColorSelect: function (oEvent) {
                var vSelectedColor = oEvent.getParameter("value");
                var sSelectedColor = sap.ui.getCore().aColors.find((item) => {
                    return item.hexCode === vSelectedColor;
                });
                sap.ui.getCore().vThis.getView().getModel("Color").setProperty("/ColorText", sSelectedColor.color);
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
            onNewProductComplete: function () {
                var oPropertyTable = this.getView().byId("tblProperties");
                var vProductInfoControl = this.checkMandatoryFields("sfProductInfoForm", this);
                var aMandatoryFieldIndex = [];

                // if (vProductInfoControl) {
                //     MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                //     return;
                // }

                var aPropertyTable = this.getView().getModel("Properties").getData();

                aPropertyTable.forEach((item, index) => {
                    if (item.mandatory) {
                        oPropertyTable.setSelectedItem(oPropertyTable.getItems()[index]);
                    }
                });
                var aPropertyItems = oPropertyTable.getItems();
                for (var i = 0; i <aPropertyItems.length;i++){
                    if(!aPropertyItems[i].getSelected()){
                        continue;
                    }
                }
            },
            //Genel boş alan kontrolüne göre state'i boş yap
            onGeneralChange: function (oEvent) {
                var vId = oEvent.getSource().getId();
                this.generalChangeControl(oEvent);
                if (vId.substring(vId.length - 8) === "inpPrice") {
                    var vValue = oEvent.getSource().getValue();
                    var vRegEx = /^(\d+(\,\d{0,2})?|\,?\d{1,2})$/;

                    if (vRegEx.test(vValue) === false || vValue.substring(vValue.length - 1) === ",") {
                        MessageToast.show(this.getResourceBundle().getText("PriceFormat"));
                        oEvent.getSource().setValueState("Error");
                    }
                    else {
                        oEvent.getSource().setValueState();
                    }
                }
            }
        });
    });
