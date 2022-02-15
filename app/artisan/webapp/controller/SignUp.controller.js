// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "renova/hl/ui/artisan/model/formatter",
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/util/Storage"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, formatter, Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator, Storage) {
        "use strict";

        return BaseController.extend("renova.hl.ui.artisan.controller.SignUp", {
            formatter: formatter,
            onInit: function () {
                this.getRouter().getRoute("SignUp").attachPatternMatched(this._onObjectMatched, this);

                this.setComboboxReadonly("cbResidenceCountries", this);
                this.setComboboxReadonly("cbResidenceCities", this);
                this.setComboboxReadonly("cbBirthCountries", this);
                this.setComboboxReadonly("cbBirthCities", this);
                this.setComboboxReadonly("cbArtisanGender", this);
                this.setComboboxReadonly("cbArtisanProfessions", this);
            },
            onAfterRendering: function () {
            },
            onNavToAccountSettings: function () {
                this.getRouter().navTo("AccountSettings");
            },
            //Sayfaya her yönlenişte ülke ve uzmanlık bilgisini al
            _onObjectMatched: async function () {
                this.sessionControl(this);

                // await this.getCountries();
                // await this.getProfessions();

                Promise.all([this.getCountries(),this.getProfessions()]);

                this.getView().setModel(new JSONModel({}), "ArtisanRegistration");
                this.getView().setModel(new JSONModel([]), "ArtisanProfessions");
                this.getView().setModel(new JSONModel([]), "BirthCities");
                this.getView().setModel(new JSONModel([]), "ResidenceCities");
                this.getView().byId("cbResidenceCountries").setSelectedKey();
                this.getView().byId("cbResidenceCities").setSelectedKey();
                this.getView().byId("cbBirthCountries").setSelectedKey();
                this.getView().byId("cbBirthCities").setSelectedKey();
                this.getView().byId("cbArtisanGender").setSelectedKey();
                this.getView().byId("maskInpGsm").setValue();
                this.getView().byId("maskInpGsm").setMask("C");
                this.getView().byId("usArtisanAttachments").removeAllIncompleteItems();
            },
            //Databaseden ülkeleri al
            getCountries: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindCountries = oDataModel.bindContext("/Countries", undefined, {
                    $$groupId: "directRequest"
                });

                return new Promise((resolve, reject) => {
                    oBindCountries.requestObject().then((oData) => {
                        that.getView().setModel(new JSONModel(oData.value), "ResidenceCountries");
                        that.getView().setModel(new JSONModel(oData.value), "BirthCountries");
                        resolve();
                    });
                });
            },
            //Databaseden uzmanlıkları al
            getProfessions: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var oBindProfessions = oDataModel.bindContext("/Professions", undefined, {
                    $$groupId: "directRequest"
                });

                return new Promise((resolve, reject) => {
                    oBindProfessions.requestObject().then((oData) => {
                        that.getView().setModel(new JSONModel(oData.value), "Professions");
                        resolve();
                    });
                });
            },
            //Seçilen doğum ülkesine göre o ülkeye ait şehirleri databaseden al
            onChangeBirthCountry: async function (oEvent) {
                var vSelectedCountry = oEvent.getSource().getSelectedKey();
                this.getView().byId("cbBirthCities").setSelectedKey();
                oEvent.getSource().setValueState();
                this.getCities("B", vSelectedCountry);
            },
            //Seçilen ikamet ülkesine göre o ülkeye ait şehirleri databaseden al ve gsm maskını ayarla
            onChangeResidenceCountry: async function (oEvent) {
                var vSelectedCountry = oEvent.getSource().getSelectedKey();
                this.getView().byId("cbResidenceCities").setSelectedKey();
                oEvent.getSource().setValueState();
                this.getView().byId("maskInpGsm").setValue();
                var aCountries = this.getView().getModel("ResidenceCountries").getData();
                var aSelectedCountry = aCountries.filter((item) => {
                    return item.countryCode === vSelectedCountry;
                });
                var vGsmCode = aSelectedCountry[0].gsmCode;
                var vMask = vGsmCode.replace("9", "^9");
                var vIndex = 0;
                do {
                    vMask += "C";
                    vIndex++;
                }
                while (vIndex < aSelectedCountry[0].gsmLength);
                this.getView().byId("maskInpGsm").setMask(vMask);
                this.getCities("R", vSelectedCountry);
            },
            //Şehirleri databaseden al
            getCities: function (CityType, SelectedCountry) {
                var that = this;
                var aCities = [];
                var oDataModel = this.getView().getModel();

                var oBindCityContext = oDataModel.bindContext("/Cities", undefined,
                    {
                        $filter: "countryCode_countryCode eq '" + SelectedCountry + "'",
                        $$groupId: "directRequest"
                    });

                return new Promise((resolve, reject) => {
                    oBindCityContext.requestObject().then((oData) => {
                        if (CityType === "B") {
                            that.getView().setModel(new JSONModel(oData.value), "BirthCities");
                        } else {
                            that.getView().setModel(new JSONModel(oData.value), "ResidenceCities");
                        }
                        resolve();
                    });
                });
            },
            //Uzmanlık ekle
            onAddProfession: function () {
                var aProfessionFormContent = this.getView().byId("sfProfessionForm").getContent();
                var oArtisanRegistration = this.getView().getModel("ArtisanRegistration");
                var sArtisanRegistration = oArtisanRegistration.getData();
                var vEmptyFields = false;

                aProfessionFormContent.forEach((item) => {
                    switch (item.getMetadata().getName()) {
                        case "sap.m.ComboBox":
                            if (item.getSelectedKey() === "") {
                                vEmptyFields = true;
                                item.setValueState("Error");
                            }
                            else {
                                item.setValueState();
                            }
                            break;
                        case "sap.m.MaskInput":
                            if (item.getValue() === "") {
                                vEmptyFields = true;
                                item.setValueState("Error");
                            } else {
                                item.setValueState();
                            }
                            break;
                        case "sap.m.TextArea":
                            if (item.getValue() === "") {
                                vEmptyFields = true;
                                item.setValueState("Error");
                            } else {
                                item.setValueState();
                            }
                            break;
                    }
                });

                if (vEmptyFields) {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }

                var vSelectedProfessionKey = this.getView().byId("cbArtisanProfessions").getSelectedKey();
                var vSelectedProfessionText = this.getView().byId("cbArtisanProfessions")._getSelectedItemText();
                var oProfessionTableModel = this.getView().getModel("ArtisanProfessions");

                if (oProfessionTableModel !== undefined) {
                    var aProfessionTable = oProfessionTableModel.getData();
                    var vDuplicateProfession = false;

                    aProfessionTable.forEach((item) => {
                        if (vSelectedProfessionKey === item.ProfessionKey) {
                            item.Experience = parseInt(item.Experience, 10) + parseInt(sArtisanRegistration.Experience.trim(), 10);
                            item.Details = sArtisanRegistration.ProfessionDescription;
                            vDuplicateProfession = true;
                        }
                    });

                    if (!vDuplicateProfession) {
                        aProfessionTable.push({
                            ProfessionKey: vSelectedProfessionKey,
                            Profession: vSelectedProfessionText,
                            Experience: parseInt(sArtisanRegistration.Experience.trim(), 10),
                            Details: sArtisanRegistration.ProfessionDescription
                        });
                    }
                    oProfessionTableModel.setData(aProfessionTable);
                    oProfessionTableModel.refresh();
                } else {
                    var aProfessions = [];

                    aProfessions.push({
                        ProfessionKey: vSelectedProfessionKey,
                        Profession: vSelectedProfessionText,
                        Experience: sArtisanRegistration.Experience.trim(),
                        Details: sArtisanRegistration.ProfessionDescription
                    });

                    this.getView().setModel(new JSONModel(aProfessions), "ArtisanProfessions");
                }
                this.getView().byId("cbArtisanProfessions").setSelectedKey("");
                oArtisanRegistration.setProperty("/Experience", "");
                oArtisanRegistration.setProperty("/ProfessionDescription", "");

            },
            //Uzmanlık sil
            onDeleteProfession: function (oEvent) {
                var oModel = this.getView().getModel("ArtisanProfessions");
                var aTableList = oModel.getData();
                var iIndex = parseInt(oEvent.getParameter("listItem").getBindingContext("ArtisanProfessions").getPath().split("/")[1]);
                aTableList.splice(iIndex, 1);
                oModel.setData(aTableList);
                oModel.refresh();
            },
            //Anasayfaya dön
            onNavToHomePage: function () {
                this.getRouter().navTo("HomePage");
            },
            //Email formatını kontrol et
            onChangeArtisanEmail: function () {
                var vEmail = this.getView().byId("inpArtisanEmail").getValue();
                var vMailRegex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
                if (!vMailRegex.test(vEmail)) {
                    var vMessage = this.getResourceBundle().getText("NotValidEmail");
                    MessageToast.show(vEmail + " " + vMessage);
                    this.InvalidEmail = true;
                    this.getView().byId("inpArtisanEmail").setValueState(sap.ui.core.ValueState.Error);
                } else {
                    this.getView().byId("inpArtisanEmail").setValueState();
                    this.InvalidEmail = false;
                }
            },
            //Kaydı tamamla
            onRegistrationComplete: async function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var vPersonalControl = this.checkMandatoryFields("sfPersonalForm", this);
                var vContactControl = this.checkMandatoryFields("sfContactForm", this);
                var oArtisanProfessionModel = this.getView().getModel("ArtisanProfessions");
                var oArtisanRegistration = this.getView().getModel("ArtisanRegistration");
                var sArtisanRegistration = oArtisanRegistration.getData();

                if (vPersonalControl === true || vContactControl === true) {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }
                if (oArtisanProfessionModel === undefined) {
                    MessageToast.show(this.getResourceBundle().getText("AtLeastOneProfession"));
                    return;
                }
                else {
                    if (oArtisanProfessionModel.getData().length === 0) {
                        MessageToast.show(this.getResourceBundle().getText("AtLeastOneProfession"));
                        return;
                    }
                }

                var vBirthDate = this.convertDate(sArtisanRegistration.BirthDate);

                var oBindArtisan = oDataModel.bindList("/Artisans", undefined, undefined, undefined, {
                    $$groupId: "batchRequest"
                });

                var oArtisanContext = oBindArtisan.create({
                    email: sArtisanRegistration.Email,
                    firstName: sArtisanRegistration.Name,
                    lastName: sArtisanRegistration.LastName,
                    residenceCountry_countryCode: this.getView().byId("cbResidenceCountries").getSelectedKey(),
                    residenceCityCode: this.getView().byId("cbResidenceCities").getSelectedKey(),
                    gsm: sArtisanRegistration.Gsm,
                    birthDate: vBirthDate,
                    birthCountry_countryCode: this.getView().byId("cbBirthCountries").getSelectedKey(),
                    birthCityCode: this.getView().byId("cbBirthCities").getSelectedKey(),
                    address: sArtisanRegistration.Address,
                    gender: this.getView().byId("cbArtisanGender").getSelectedKey(),
                    registrationStatus_statusID: "WAIT",
                    introduction: sArtisanRegistration.Introduction
                });

                var oBindProfession = oDataModel.bindList("/ArtisanProfessions", undefined, undefined, undefined, {
                    $$groupId: "batchRequest"
                });

                var aArtisanProfessions = oArtisanProfessionModel.getData();

                aArtisanProfessions.forEach((item) => {
                    var oProfessionContext = oBindProfession.create({
                        email_email: sArtisanRegistration.Email,
                        professionID_professionID: parseInt(item.ProfessionKey, 10),
                        description: item.Details,
                        experience: parseInt(item.Experience, 10)
                    });
                });

                var oSubmitBatch = oDataModel.submitBatch("batchRequest");

                oSubmitBatch.then(() => {
                    that.onUploadAttachments();
                    that.createWorkflowInstance();
                }).catch(() => {
                    MessageBox.information("Hata");
                });
            },
            createWorkflowInstance: async function () {
                var that = this;
                var sArtisanRegistration = this.getView().getModel("ArtisanRegistration").getData();
                var vCountry = this.getView().byId("cbResidenceCountries").getSelectedKey();

                var vToken = "";
                // var vToken = await this.fetchCsrfToken();
                this.startWorkflow(sArtisanRegistration.Email, vCountry, vToken).then((resolve) => {
                    MessageBox.information(this.getResourceBundle().getText("RegistrationCompleted"), {
                        title: this.getResourceBundle().getText("Information"),
                        actions: sap.m.MessageBox.Action.OK,
                        emphasizedAction: sap.m.MessageBox.Action.OK,
                        onClose: function () {
                            that.getRouter().navTo("HomePage");
                        }
                    });
                }).catch((reject) => {
                    MessageBox.information(this.getResourceBundle().getText("RegistrationFail"));
                });
            },
            //Genel boş alan kontrolüne göre state'i boş yap
            onGeneralChange: function (oEvent) {
                this.generalChangeControl(oEvent);
            },
            onUploadAttachments: function () {
                this.getView().byId("usArtisanAttachments").getIncompleteItems().forEach((oItem) => {
                    this.createFileEntity(oItem).then((FileID) => {
                        this.uploadFileContent(oItem, FileID);
                    }).catch((err) => {
                        console.log(err);
                    });
                });
            },
            onFileUploadCompleted: function (oEvent) {
                var oUploadSet = this.getView().byId("usArtisanAttachments");
                oUploadSet.removeAllIncompleteItems();
                oUploadSet.removeItem(oEvent.getParameters().item);
            },
            createFileEntity: function (oItem) {
                var oArtisanRegistration = this.getView().getModel("ArtisanRegistration");
                var sArtisanRegistration = oArtisanRegistration.getData();

                var sPayloadData = {
                    mediaType: oItem.getMediaType(),
                    fileName: oItem.getFileName(),
                    email_email: sArtisanRegistration.Email
                };

                var oRequestSettings = {
                    url: "/hand-and-life/ArtisanResumes",
                    method: "POST",
                    headers: {
                        "Content-type": "application/json"
                    },
                    data: JSON.stringify(sPayloadData)
                }

                return new Promise((resolve, reject) => {
                    $.ajax(oRequestSettings).done((results, textStatus, request) => {
                        resolve(results.fileID);
                    }).fail((error) => {
                        reject(error);
                    });
                });
            },
            uploadFileContent: function (oItem, FileID) {
                var vUrl = `/hand-and-life/ArtisanResumes(${FileID})/mediaContent`
                oItem.setUploadUrl(vUrl);
                var oUploadSet = this.getView().byId("usArtisanAttachments");
                oUploadSet.setHttpRequestMethod("PUT")
                oUploadSet.uploadItem(oItem);
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
                    }
                }
                );
            },
            onNavToLoginPage: function () {
                this.getRouter().navTo("Login");
            },
            onNavToOffers: function () {
                this.getRouter().navTo("Offers");
            },
            fetchCsrfToken: function () {
                // return new Promise((resolve, reject) => {
                //     $.ajax({
                //         url: "/renovahluiartisan/globalbpmwfruntime/v1/xsrf-token",
                //         method: "GET",
                //         headers: {
                //             "X-CSRF-Token": "Fetch"
                //         },
                //         success: function (results, xhr, data) {
                //             var token = data.getResponseHeader("X-CSRF-Token");
                //             resolve(token);
                //         },
                //         error: function (data) {
                //             MessageToast.show("Workflow failed");
                //             reject();
                //         }
                //     });
                // });
            },
            startWorkflow: function (email, country, token) {
                //start workflow
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: "/renovahluiartisan/globalbpmwfruntime/rest/v1/workflow-instances",
                        method: "POST",
                        data: JSON.stringify({
                            definitionId: "renova.hl.wf.approvalprocess",
                            context: {
                                email: email,
                                country: country,
                            }
                        }),
                        headers: {
                            //     "X-CSRF-Token": token,
                            "Content-Type": "application/json"
                        },
                        async: false,
                        success: function (data) {
                            resolve();
                        },
                        error: function (data) {
                            MessageToast.show("Workflow failed");
                            reject();
                        }
                    });
                });
            },
            convertDate: function (date) {
                var vDate = "";
                var vDay = date.getDate().toString().length === 1 ? "0" + date.getDate() : date.getDate();
                var vMonth = (date.getMonth() + 1).toString().length === 1 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
                var vYear = date.getFullYear();

                vDate = vYear + "-" + vMonth + "-" + vDay;
                return vDate;
            },
            onOpenNotifications: function (oEvent) {
                var oButton = oEvent.getSource();
                this.displayIncomingOrders(this, oButton);
            }
        });
    });