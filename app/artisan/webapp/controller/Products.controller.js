// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/util/Storage",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageBox, Filter, FilterOperator, Storage, MessageToast, Fragment) {
        "use strict";
        var gProduct;

        return BaseController.extend("renova.hl.ui.artisan.controller.Products", {
            onInit: function () {
                this.getRouter().getRoute("Products").attachPatternMatched(this._onObjectMatched, this);
                this.setComboboxReadonly("cbUnits", this);
                this.setComboboxReadonly("cbCurrencies", this);
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
                this.getUnits();
                this.getCurrencies();
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

                sap.ui.core.BusyIndicator.show();
                oBindProduct.requestObject().then((oData) => {
                    that.getView().setModel(new JSONModel(oData.value), "ArtisanProducts");
                    if (oData.value.length !== 0) {
                        that.getView().byId("ProductDetails").setVisible(true);
                        if (vProductId !== undefined) {
                            vIndex = oData.value.findIndex((element) => { return element.productID === vProductId });
                        }
                        that.getProductDetails(oData.value[vIndex].productID);
                        that.getView().byId("lstArtisanProducts").getItems()[vIndex].focus();
                    } else {
                        that.getView().byId("ProductDetails").setVisible(false);
                    }
                    that.getView().byId("AllProducts").setTitle(this.getResourceBundle().getText("AllProducts", [oData.value.length]));
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
            // getProperties: function (vProductId) {
            //     var that = this;
            //     var oDataModel = this.getView().getModel();
            //     var oBindProperties = oDataModel.bindContext("/ProductProperties", undefined, {
            //         $filter: "productID_productID eq " + vProductId,
            //         $$groupId: "directRequest"
            //     });

            //     oBindProperties.requestObject().then((oData) => {
            //         that.getView().setModel(new JSONModel(oData.value), "Prop");
            //     });
            //     var oProperty = this.getView().getModel("Prop");

            // },

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
                this.setFormEditable(["inpProductName", "inpStock", "cbUnits", "inpPrice", "cbCurrencies", "taDetails"],
                    ["btnUpdateName", "btnUpdateDetails", "btnUpdatePrice", "btnUpdateStock"]);

                var sProduct = this.getView().getModel("ArtisanProducts").getData().find((item) => {
                    return item.productID === vProductId;
                });
                this.getView().setModel(new JSONModel(sProduct), "Product");
                sap.ui.core.BusyIndicator.hide();
                this.getProductPictures(vProductId);
                // this.getView().byId("sfAttach").setVisible(false);

                // this.getProperties(vProductId);
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
                        sap.ui.core.BusyIndicator.show();
                        for (var oPicture of aPictures) {
                            var oBlobData = await that.getPictureBlobData(oPicture.url);
                            var vPictureURL = window.URL.createObjectURL(oBlobData);
                            aPictureURL.push({
                                pictureURL: vPictureURL,
                                fileId: oPicture.fileID,
                                productId: oPicture.productID_productID
                            });
                            if (aPictures.length === aPictureURL.length) {
                                that.getView().setModel(new JSONModel(aPictureURL), "ProductPictures");
                                sap.ui.core.BusyIndicator.hide();
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
            },
            onUpdateProductName: function (oEvent) {
                var oButton = oEvent.getSource();
                var aControlId = ["inpProductName"];
                this.changeButtonType(oButton, aControlId);
            },
            onUpdateStock: function (oEvent) {
                var oButton = oEvent.getSource();
                var aControlId = ["inpStock", "cbUnits"];
                this.changeButtonType(oButton, aControlId);
            },
            onUpdatePrice: function (oEvent) {
                var oButton = oEvent.getSource();
                var aControlId = ["inpPrice", "cbCurrencies"];
                this.changeButtonType(oButton, aControlId);
            },
            onUpdateProductDetails: function (oEvent) {
                var oButton = oEvent.getSource();
                var aControlId = ["taDetails"];
                this.changeButtonType(oButton, aControlId);
            },
            changeButtonType: function (oButton, aControlId) {
                var that = this;
                var vType = oButton.getType();
                var bEditable = false;

                if (vType === "Default") {
                    oButton.setType("Reject");
                    oButton.setText(this.getResourceBundle().getText("CancelUpdate"));
                    bEditable = true;
                } else {
                    oButton.setType("Default");
                    oButton.setText(this.getResourceBundle().getText("Update"));
                }

                aControlId.forEach((item) => {
                    that.getView().byId(item).setEditable(bEditable);
                });
            },
            setFormEditable: function (aControlId, aButtons) {
                var that = this;
                aControlId.forEach((item) => {
                    that.getView().byId(item).setEditable(false);
                });

                aButtons.forEach((item) => {
                    that.getView().byId(item).setType("Default");
                    that.getView().byId(item).setText(this.getResourceBundle().getText("Update"));
                });
            },
            onUpdateProduct: function () {
                var that = this;
                var sProduct = this.getView().getModel("Product").getData();
                var aFilter = [];
                var oDataModel = this.getView().getModel();
                var bUpdateName = this.getView().byId("btnUpdateName").getType() === "Default" ? false : true;
                var bUpdateStock = this.getView().byId("btnUpdateStock").getType() === "Default" ? false : true;
                var bUpdatePrice = this.getView().byId("btnUpdatePrice").getType() === "Default" ? false : true;
                var bUpdateDetails = this.getView().byId("btnUpdateDetails").getType() === "Default" ? false : true;

                if (!bUpdateName && !bUpdateStock && !bUpdatePrice && !bUpdateDetails) {
                    return;
                }

                aFilter.push(new Filter("productID", FilterOperator.EQ, sProduct.productID));
                this.vUpdatedProductId = sProduct.productID;

                var oBindProduct = oDataModel.bindList("/ArtisanProducts", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                }).filter(aFilter);

                oBindProduct.attachPatchCompleted(this.onUpdateCompleted, this);

                oBindProduct.requestContexts().then((aContext) => {
                    if (bUpdateName) {
                        aContext[0].setProperty("productName", sProduct.productName);
                    }
                    if (bUpdateStock) {
                        aContext[0].setProperty("stock", sProduct.stock);
                        aContext[0].setProperty("unit_unitID", sProduct.unit_unitID);
                    }
                    if (bUpdatePrice) {
                        aContext[0].setProperty("price", sProduct.price);
                        aContext[0].setProperty("currency_currencyCode", sProduct.currency_currencyCode);
                    }
                    if (bUpdateDetails) {
                        aContext[0].setProperty("details", sProduct.details);
                    }
                    oDataModel.submitBatch("batchRequest");
                });
            },
            onUpdateCompleted: function (oEvent) {
                this.getArtisanProducts(0, this.vUpdatedProductId);
            },
            onPicturePressed: function (oEvent) {
                var that = this;
                var sProperty = oEvent.getSource().getBindingContext("ProductPictures").getProperty();
                var sProduct = {
                    productId: sProperty.productId,
                    fileId: sProperty.fileId
                };

                MessageBox.confirm(this.getResourceBundle().getText("ConfirmPictureDelete"), {
                    title: this.getResourceBundle().getText("PleaseConfirm"),
                    actions: [sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL],
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            that.deletePicture(sProduct);
                        }
                    },
                });
            },
            deletePicture: function (sProduct) {
                var that = this;
                var oDataModel = this.getView().getModel();
                var vFilter = "productID_productID eq " + sProduct.productId + " and fileID eq " + sProduct.fileId;

                var oBindPictures = oDataModel.bindList("/ProductAttachments", undefined, undefined, undefined, {
                    $filter: vFilter,
                    $$groupId: "directRequest"
                });

                oBindPictures.requestContexts().then((aContext) => {
                    aContext[0].delete("directRequest").then(() => {
                        that.getArtisanProducts(0, sProduct.productId)
                    });
                });
            },
            onNewPicture: function () {
                this.getAddPictureDialog().open();
                sap.ui.getCore().byId("diaAddPicture").getContent()[0].removeAllItems();
                sap.ui.getCore().byId("diaAddPicture").getContent()[0].removeAllIncompleteItems();
            },
            getAddPictureDialog: function () {
                if (!this.oAddPictureDialog) {
                    this.oAddPictureDialog = sap.ui.xmlfragment("renova.hl.ui.artisan.fragments.AddPicture", this);
                    this.getView().addDependent(this.oAddPictureDialog);
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oAddPictureDialog);
                }
                return this.oAddPictureDialog;
            },
            onCancelPicture: function () {
                this.getAddPictureDialog().close();
            },
            onAddPicture: function () {
                if (sap.ui.getCore().byId("diaAddPicture").getContent()[0].getIncompleteItems().length === 0) {
                    MessageToast.show(this.getResourceBundle().getText("AtLeastOnePicture"));
                    return;
                }
                this.totalPictureCount = sap.ui.getCore().byId("diaAddPicture").getContent()[0].getIncompleteItems().length;
                this.uploadedPictureCount = 0;
                this.onUploadAttachments();
            },
            onUploadAttachments: function () {
                var oUploadSet = sap.ui.getCore().byId("diaAddPicture").getContent()[0];
                oUploadSet.getIncompleteItems().forEach((oItem) => {
                    this.createFileEntity(oItem).then((FileKeys) => {
                        this.uploadFileContent(oItem, FileKeys);
                    }).catch((err) => {
                        console.log(err);
                    });
                });
            },
            onFileUploadCompleted: function (oEvent) {
                this.uploadedPictureCount++;
                var sProduct = this.getView().getModel("Product").getData();
                var oUploadSet = sap.ui.getCore().byId("diaAddPicture").getContent()[0];
                sap.ui.core.BusyIndicator.show();
                oUploadSet.removeAllIncompleteItems();
                this.getAddPictureDialog().close();
                oUploadSet.removeItem(oEvent.getParameters().item);
                if (this.uploadedPictureCount === this.totalPictureCount) {
                    this.getArtisanProducts(0, sProduct.productID);
                }
            },
            createFileEntity: function (oItem) {
                var sProduct = this.getView().getModel("Product").getData();

                var sPayloadData = {
                    productID_productID: sProduct.productID,
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
                var oUploadSet = sap.ui.getCore().byId("diaAddPicture").getContent()[0];
                oUploadSet.setHttpRequestMethod("PUT");
                oUploadSet.uploadItem(oItem);
            }
        });
    });
