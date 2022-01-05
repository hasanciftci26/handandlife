// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/util/Storage",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, Storage, MessageToast, Filter, FilterOperator, Fragment) {
    "use strict";
    return Controller.extend("renova.hl.ui.artisan.controller.BaseController", {
        /* =========================================================== */
        /* Hazırda olan fonksiyonlar                                   */
        /* =========================================================== */
        getRouter: function () {
            // @ts-ignore
            return sap.ui.core.UIComponent.getRouterFor(this);
        },
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        //Zorunlu alanları kontrol et
        checkMandatoryFields(FormId, vThis) {
            var vEmptyFields = false;
            var aFormContent = vThis.getView().byId(FormId).getContent();
            aFormContent.forEach((item) => {
                switch (item.getMetadata().getName()) {
                    case "sap.m.ComboBox":
                        if (item.getSelectedKey() === "") {
                            vEmptyFields = true;
                            item.setValueState("Error");
                            item.focus();
                        }
                        else {
                            item.setValueState();
                        }
                        break;
                    case "sap.m.MaskInput":
                        if (item.getValue() === "") {
                            vEmptyFields = true;
                            item.setValueState("Error");
                            item.focus();
                        } else {
                            item.setValueState();
                        }
                        break;
                    case "sap.m.TextArea":
                        if (item.getValue() === "") {
                            vEmptyFields = true;
                            item.setValueState("Error");
                            item.focus();
                        } else {
                            item.setValueState();
                        }
                        break;
                    case "sap.m.Input":
                        if (item.getValue() === "") {
                            vEmptyFields = true;
                            item.setValueState("Error");
                            item.focus();
                        } else {
                            item.setValueState();
                        }
                        break;
                    case "sap.m.DatePicker":
                        if (item.getDateValue() === null) {
                            vEmptyFields = true;
                            item.setValueState("Error");
                            item.focus();
                        } else {
                            item.setValueState();
                        }
                        break;
                }
            });
            return vEmptyFields;
        },
        setComboboxReadonly: function (vId, vThis) {
            var oComboBox = vThis.getView().byId(vId);
            oComboBox.addEventDelegate({
                onAfterRendering: function () {
                    // @ts-ignore
                    oComboBox.$().find("input").attr("readonly", true);
                }
            });
        },
        setCommonInputVisible: function (sValue) {
            var bVisible = false;
            if (sValue.isBodySize === false && sValue.isColor === false && sValue.isSize === false) {
                bVisible = true;
            }
            return bVisible;
        },
        //Body sizeları al
        getBodySizes: function () {
            var aBodySizes = [{
                key: "XS",
                text: "XS - X Small"
            }, {
                key: "S",
                text: "S - Small"
            }, {
                key: "M",
                text: "M - Medium"
            }, {
                key: "L",
                text: "L - Large"
            }, {
                key: "XL",
                text: "XL - X Large"
            }, {
                key: "XXL",
                text: "XXL - XX Large"
            }, {
                key: "XXXL",
                text: "XXXL - XXX Large"
            }];
            return aBodySizes;
        },
        //Genel boş alan kontrolüne göre state'i boş yap
        generalChangeControl: function (oEvent) {
            switch (oEvent.getSource().getMetadata().getName()) {
                case "sap.m.ComboBox":
                    if (oEvent.getSource().getSelectedKey() !== "") {
                        oEvent.getSource().setValueState();
                    }
                    break;
                case "sap.m.MaskInput":
                    if (oEvent.getSource().getValue() !== "") {
                        oEvent.getSource().setValueState();
                    }
                    break;
                case "sap.m.TextArea":
                    if (oEvent.getSource().getValue() !== "") {
                        oEvent.getSource().setValueState();
                    }
                    break;
                case "sap.m.Input":
                    if (oEvent.getSource().getValue() !== "") {
                        oEvent.getSource().setValueState();
                    }
                    break;
                case "sap.m.DatePicker":
                    if (oEvent.getSource().getDateValue() !== null) {
                        oEvent.getSource().setValueState();
                    }
                    break;
            }
        },
        sessionControl: function (oThis) {
            var oStorage = new Storage(Storage.Type.local, "userLogin");
            var vLogin = false;

            if (oStorage.get("isLogin") !== null) {
                vLogin = oStorage.get("isLogin").active
                // @ts-ignore
                sap.ui.getCore().email = oStorage.get("isLogin").email;
            }
            // @ts-ignore
            sap.ui.getCore().isLogin = vLogin;

            if (oThis.getView().getModel("UserCredential") === undefined) {
                oThis.getView().setModel(new JSONModel({
                    // @ts-ignore
                    isLogin: sap.ui.getCore().isLogin === undefined || sap.ui.getCore().isLogin === false ? false : true
                }), "UserCredential");
            } else {
                oThis.getView().getModel("UserCredential").setProperty("/isLogin",
                    // @ts-ignore
                    sap.ui.getCore().isLogin === undefined || sap.ui.getCore().isLogin === false ? false : true);
            }
        },
        onChangePassword: function (oThis) {
            this.changePassThis = oThis;
            oThis.getView().setModel(new JSONModel({
                CurrentPassword: "",
                NewPassword: "",
                ReNewPassword: ""
            }), "ChangePassword");
            this.getForgottenPasswordDialog(oThis).open();
        },
        getForgottenPasswordDialog: function (oThis) {
            if (!oThis.oChangePasswordDialog) {
                oThis.oChangePasswordDialog = sap.ui.xmlfragment("renova.hl.ui.artisan.fragments.ChangePassword", oThis);
                oThis.getView().addDependent(oThis.oChangePasswordDialog);
                // @ts-ignore
                jQuery.sap.syncStyleClass("sapUiSizeCompact", oThis.getView(), oThis.oChangePasswordDialog);
            }
            return oThis.oChangePasswordDialog;
        },
        onCancelChangePassword: function () {
            var oThis = this.changePassThis;
            this.getForgottenPasswordDialog(oThis).close();
        },
        onChangePasswordComplete: async function () {
            var oThis = this.changePassThis;
            var sChangePassword = oThis.getView().getModel("ChangePassword").getData();
            if (sChangePassword.CurrentPassword === "" || sChangePassword.NewPassword === "" ||
                sChangePassword.ReNewPassword === "") {
                MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                return;
            }
            var bOldPassword = await this.checkCurrentPassword(sChangePassword.CurrentPassword);
            if (!bOldPassword) {
                MessageToast.show(this.getResourceBundle().getText("CurrentPasswordWrong"));
                return;
            }
        },
        checkCurrentPassword: function (vCurrentPassword) {
            var oDataModel = this.getView().getModel();
            var vFilter = "email eq '" + sap.ui.getCore().email + "' and password eq '" + vCurrentPassword + "'";

            return new Promise((resolve) => {
                var oBindArtisanCredentials = oDataModel.bindContext("/ArtisanCredentialsView", undefined, {
                    $filter: vFilter,
                    $$groupId: "directRequest"
                });

                oBindArtisanCredentials.requestObject().then((oData) => {
                    resolve(!!oData.value.length);
                });
            });
        },
        displayIncomingOrders: async function (oThis, oButton) {
            await this.getNewOrders(oThis);
            await this.getNonExistOrders(oThis);
            this.openNotificationPopover(oThis, oButton);
        },
        getNewOrders: function (oThis) {
            var that = this;
            var oDataModel = this.getView().getModel();
            // oDataModel.setSizeLimit(25000);
            var aProductId = [];

            return new Promise((resolve) => {
                var oBindProduct = oDataModel.bindContext("/ArtisanProducts", undefined,
                    {
                        // @ts-ignore
                        $filter: "email_email eq '" + sap.ui.getCore().email + "'",
                        $$groupId: "directRequest"
                    });

                oBindProduct.requestObject().then(async (oData) => {
                    oData.value.forEach((item) => {
                        aProductId.push(item.productID);
                    });
                    await that.getAllCurrentOrders(aProductId, oThis);
                    resolve();
                });
            });
        },
        getAllCurrentOrders: async function (aProductId, oThis) {
            var that = this;
            var oDataModel = this.getView().getModel();
            // oDataModel.setSizeLimit(25000);
            var aFilter = [];
            var aOrderItems = [];

            return new Promise((resolve) => {
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
                        aOrderItems.push({
                            OrderNo: element.getProperty("orderID_orderID"),
                            statusID: element.getProperty("status_statusID"),
                            OrderDate: new Date(element.getProperty("createdAt"))
                        });
                    });
                    sap.ui.core.BusyIndicator.hide();
                    var aNewOrders = aOrderItems.filter((item) => { return item.statusID === "CRTD"; });
                    oThis.getView().setModel(new JSONModel(aNewOrders), "NotificationsNewOrder");
                    resolve();
                });
            });
        },
        openNotificationPopover: function (oThis, oButton) {
            var oView = oThis.getView();
            if (!oThis._pPopover) {
                oThis._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "renova.hl.ui.artisan.fragments.Notifications",
                    controller: this
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }
            oThis._pPopover.then(function (oPopover) {
                oPopover.openBy(oButton);
            });
        },
        getNonExistOrders: function (oThis) {
            var that = this;
            var oDataModel = this.getView().getModel();
            // oDataModel.setSizeLimit(25000);
            var aNonExistOrder = [];

            return new Promise((resolve) => {
                var oBindProduct = oDataModel.bindContext("/ArtisanOffers", undefined,
                    {
                        // @ts-ignore
                        $filter: "email_email eq '" + sap.ui.getCore().email + "' and status_statusID eq 'WAIT'",
                        $$groupId: "directRequest"
                    });

                oBindProduct.requestObject().then(async (oData) => {
                    oData.value.forEach((item) => {
                        aNonExistOrder.push({
                            OrderNo: item.orderID,
                            ExpireDate: new Date(item.offerExpireEnd)
                        })
                    });
                    oThis.getView().setModel(new JSONModel(aNonExistOrder), "NotificationsOffer");
                    resolve();
                });
            });
        }
    });
});