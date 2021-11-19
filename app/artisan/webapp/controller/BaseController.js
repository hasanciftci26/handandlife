sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
], function (Controller, JSONModel) {
    "use strict";
    return Controller.extend("renova.hl.ui.artisan.controller.BaseController", {
        /* =========================================================== */
        /* Hazırda olan fonksiyonlar                                   */
        /* =========================================================== */
        getRouter: function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
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
        }
    });
});