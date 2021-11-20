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
                this.sessionControl(this);
                this.getView().byId("usProductAttachments").removeAllItems();
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
                        item.Width = "";
                        item.Height = "";
                        item.Depth = "";
                        item.CommonProperty = "";
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
            onNewProductComplete: function () {
                var oDataModel = this.getView().getModel();
                var oPropertyTable = this.getView().byId("tblProperties");
                var vProductInfoControl = this.checkMandatoryFields("sfProductInfoForm", this);
                var aMandatoryFieldIndex = [];

                if (vProductInfoControl) {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }

                if (this.getView().byId("usProductAttachments").getIncompleteItems().length === 0) {
                    MessageToast.show(this.getResourceBundle().getText("AtLeastOnePicture"));
                    return;
                }

                var aPropertyTable = this.getView().getModel("Properties").getData();
                var bEmptyProperty = false;
                var bEmptyColor = false;

                aPropertyTable.forEach((item, index) => {
                    if (item.mandatory) {
                        oPropertyTable.setSelectedItem(oPropertyTable.getItems()[index]);
                    }
                });
                var aPropertyItems = oPropertyTable.getItems();
                for (var i = 0; i < aPropertyItems.length; i++) {
                    if (!aPropertyItems[i].getSelected()) {
                        continue;
                    }
                    var sProperty = aPropertyTable[i];
                    if (sProperty.isSize) {
                        if (sProperty.Width === "" || sProperty.Height === "" || sProperty.Depth === "") {
                            bEmptyProperty = true;
                            aPropertyItems[i].getCells()[2].getItems().forEach((item) => {
                                if (item.getMetadata().getName() === "sap.m.Input") {
                                    if (item.getVisible()) {
                                        item.setValueState("Error");
                                        item.focus();
                                    }
                                }
                            });
                        }
                    }
                    if (!sProperty.isSize && !sProperty.isColor && !sProperty.isBodySize) {
                        if (sProperty.CommonProperty === "") {
                            bEmptyProperty = true;
                            aPropertyItems[i].getCells()[2].getItems().forEach((item) => {
                                if (item.getMetadata().getName() === "sap.m.Input") {
                                    if (item.getVisible()) {
                                        item.setValueState("Error");
                                        item.focus();
                                    }
                                }
                            });
                        }
                    }
                    if (sProperty.isColor) {
                        if (this.getView().getModel("Color").getData().ColorText === "") {
                            bEmptyColor = true;
                        }
                    }
                }

                if (bEmptyProperty) {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }
                if (bEmptyColor) {
                    MessageToast.show(this.getResourceBundle().getText("SelectColor"));
                    return;
                }

                var oBindProduct = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $$groupId: "batchRequest"
                });

                var sProduct = this.getView().getModel("NewProduct").getData();
                // sProduct.Price = sProduct.Price.replaceAll(".", "");
                // sProduct.Price = sProduct.Price.replace(",", ".");

                oBindProduct.attachCreateCompleted(this.onProductCreatedComplete, this);

                oBindProduct.create({
                    category_categoryID: this.getView().byId("cbCategories").getSelectedKey(),
                    email_email: sap.ui.getCore().email,
                    stock: sProduct.Stock,
                    unit_unitID: this.getView().byId("cbUnits").getSelectedKey(),
                    price: parseFloat(sProduct.Price),
                    currency_currencyCode: this.getView().byId("cbCurrencies").getSelectedKey(),
                    productName: sProduct.ProductName,
                    details: sProduct.Details,
                    status_statusID: "AVLB"
                });

                oDataModel.submitBatch("batchRequest");
            },
            onProductCreatedComplete: function (oEvent) {
                if (oEvent.getParameters().success) {
                    var vProductId = oEvent.getParameters().context.getObject().productID;
                    this.vProductId = vProductId;
                    this.saveAttach = true;
                    this.saveProperties(vProductId);
                }
            },
            saveProperties(vProductId) {
                var oDataModel = this.getView().getModel();

                var oBindProperty = oDataModel.bindList("/ProductProperties", undefined, undefined, undefined, {
                    $$groupId: "batchRequest"
                });

                oBindProperty.attachCreateCompleted(this.onPropertyCreatedComplete, this);

                var oPropertyTable = this.getView().byId("tblProperties");
                var aProperties = this.getView().getModel("Properties").getData();

                var aSelectedItems = oPropertyTable.getSelectedItems();

                aSelectedItems.forEach((item) => {
                    var vIndex = parseInt(item.getBindingContextPath().split("/")[1], 10);
                    var sProperty = aProperties[vIndex];

                    var vPropertyId = sProperty.propertyID;
                    var vPropertyValue = "";
                    var vPropertyUnit = "";

                    if (sProperty.CommonInputVisible) {
                        vPropertyValue = sProperty.CommonProperty;
                    }

                    if (sProperty.isSize) {
                        vPropertyValue = sProperty.Depth + "x" + sProperty.Height + "x" + sProperty.Width;
                        item.getCells()[3].getItems().forEach((element) => {
                            if (element.getMetadata().getName() === "sap.m.Select") {
                                if (element.getVisible()) {
                                    vPropertyUnit = element.getSelectedKey();
                                }
                            }
                        });
                    }

                    if (sProperty.isWeight) {
                        vPropertyValue = sProperty.CommonProperty;
                        item.getCells()[3].getItems().forEach((element) => {
                            if (element.getMetadata().getName() === "sap.m.Select") {
                                if (element.getVisible()) {
                                    vPropertyUnit = element.getSelectedKey();
                                }
                            }
                        });
                    }

                    if (sProperty.isColor) {
                        vPropertyValue = this.getView().getModel("Color").getData().ColorText;
                    }

                    oBindProperty.create({
                        productID_productID: vProductId,
                        propertyID_propertyID: vPropertyId,
                        propertyValue: vPropertyValue,
                        unit_unitID: vPropertyUnit
                    });
                });

                oDataModel.submitBatch("batchRequest");
            },
            onPropertyCreatedComplete: function (oEvent) {
                if (this.saveAttach) {
                    this.onUploadAttachments();
                }
                this.saveAttach = false;
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
            },
            onChangeState: function (oEvent) {
                oEvent.getSource().setValueState();
            },
            onUploadAttachments: function () {
                this.getView().byId("usProductAttachments").getIncompleteItems().forEach((oItem) => {
                    this.createFileEntity(oItem).then((FileKeys) => {
                        this.uploadFileContent(oItem, FileKeys);
                    }).catch((err) => {
                        console.log(err);
                    });
                });
            },
            onFileUploadCompleted: function (oEvent) {
                var oUploadSet = this.getView().byId("usProductAttachments");
                oUploadSet.removeAllIncompleteItems();
                oUploadSet.removeItem(oEvent.getParameters().item);
                if (oUploadSet.getItems().length === 0) {
                    this.getRouter().navTo("Products");
                }
            },
            createFileEntity: function (oItem) {
                var sPayloadData = {
                    productID_productID: this.vProductId,
                    email_email: sap.ui.getCore().email,
                    mediaType: oItem.getMediaType(),
                    fileName: oItem.getFileName()
                };

                var oRequestSettings = {
                    url: "/hand-and-life/ProductAttachments",
                    method: "POST",
                    headers: {
                        "Content-type": "application/json"
                    },
                    data: JSON.stringify(sPayloadData)
                }

                return new Promise((resolve, reject) => {
                    $.ajax(oRequestSettings).done((results, textStatus, request) => {
                        resolve({ fileID: results.fileID, productID: results.productID_productID });
                    }).fail((error) => {
                        reject(error);
                    });
                });
            },
            uploadFileContent: function (oItem, FileKeys) {
                var vUrl = `/hand-and-life/ProductAttachments(productID_productID=${FileKeys.productID},fileID=${FileKeys.fileID})/mediaContent`
                oItem.setUploadUrl(vUrl);
                var oUploadSet = this.getView().byId("usProductAttachments");
                oUploadSet.setHttpRequestMethod("PUT");
                oUploadSet.uploadItem(oItem);
            },
        });
    });
