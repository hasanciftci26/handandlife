// @ts-nocheck
sap.ui.define([
    "renova/hl/ui/artisan/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/util/Storage",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
    function (BaseController, Controller, JSONModel, MessageBox, Storage, Filter, FilterOperator, MessageToast, Fragment) {
        "use strict";

        return BaseController.extend("renova.hl.ui.artisan.controller.AccountSettings", {
            onInit: function () {
                this.getRouter().getRoute("AccountSettings").attachPatternMatched(this._onObjectMatched, this);
            },
            onSignUp: function () {
                this.getRouter().navTo("SignUp");
            },
            _onObjectMatched: async function (oEvent) {
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

                this.getView().setModel(new JSONModel({
                    Editable: false
                }), "PersonalFormEditable");

                this.getView().setModel(new JSONModel({
                    Edit: true,
                    Others: false
                }), "ButtonVisible");

                this.getView().byId("tblProfessions").setMode("None");

                this.getView().setModel(new JSONModel({
                    CurrentPassword: "",
                    NewPassword: "",
                    ReNewPassword: ""
                }), "ChangePassword");
                this.getView().setModel(new JSONModel({ Display: false }), "ShowNewPassword");

                await this.getCountries();
                await this.getProfessions();
                this.getPersonalInformation();
                this.getPersonalProfession();
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
            onSideNavButtonPress: function () {
                var oToolPage = this.byId("toolPageAccountSettings");
                oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
            },
            onItemSelect: function (oEvent) {
                var oItem = oEvent.getParameter("item");
                this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
                if (oItem.getKey() === "personalInfo") {
                    this._onObjectMatched();
                } else {
                    this.getView().setModel(new JSONModel({
                        CurrentPassword: "",
                        NewPassword: "",
                        ReNewPassword: ""
                    }), "ChangePassword");
                    this.getView().setModel(new JSONModel({ Display: false }), "ShowNewPassword");
                }
            },
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
            getPersonalProfession: function () {
                var that = this;
                var oDataModel = this.getView().getModel();
                var aProfessions = this.getView().getModel("Professions").getData();
                var aPersonalProfessions = [];

                var oBindArtisanProfessions = oDataModel.bindContext("/ArtisanProfessions", undefined, {
                    $filter: "email_email eq '" + sap.ui.getCore().email + "'",
                    $$groupId: "directRequest"
                });

                oBindArtisanProfessions.requestObject().then((oData) => {
                    oData.value.forEach((item) => {
                        var sProfession = aProfessions.find((element) => {
                            return element.professionID === item.professionID_professionID;
                        });

                        aPersonalProfessions.push({
                            ProfessionId: item.professionID_professionID,
                            Profession: sProfession ? sProfession.profession : "",
                            Experience: Number(item.experience),
                            Details: item.description
                        });
                    });
                    that.getView().setModel(new JSONModel(aPersonalProfessions), "ArtisanProfessions");
                });
            },
            getPersonalInformation: function () {
                var that = this;
                var oDataModel = this.getView().getModel();

                var oBindArtisan = oDataModel.bindContext("/Artisans", undefined, {
                    $filter: "email eq '" + sap.ui.getCore().email + "'",
                    $$groupId: "directRequest"
                });

                oBindArtisan.requestObject().then((oData) => {
                    var sPersonalInfo = oData.value[0];
                    var sPersonalInfoData = {
                        Name: sPersonalInfo.firstName,
                        LastName: sPersonalInfo.lastName,
                        BirthDate: new Date(sPersonalInfo.birthDate),
                        BirthCountry: sPersonalInfo.birthCountry_countryCode,
                        BirthCity: sPersonalInfo.birthCityCode,
                        Gender: sPersonalInfo.gender,
                        Introduction: sPersonalInfo.introduction,
                        ResidenceCountry: sPersonalInfo.residenceCountry_countryCode,
                        ResidenceCity: sPersonalInfo.residenceCityCode,
                        Address: sPersonalInfo.address,
                        Email: sPersonalInfo.email,
                        Gsm: sPersonalInfo.gsm
                    };

                    var sSelectedCountry = that.getView().getModel("ResidenceCountries").getData().find((item) => {
                        return item.countryCode === sPersonalInfo.residenceCountry_countryCode;
                    });

                    var vGsmCode = sSelectedCountry.gsmCode;
                    var vMask = vGsmCode.replace("9", "^9");

                    var vIndex = 0;
                    do {
                        vMask += "C";
                        vIndex++;
                    }
                    while (vIndex < sSelectedCountry.gsmLength);

                    that.getView().byId("maskInpGsm").setMask(vMask);

                    that.getView().setModel(new JSONModel(sPersonalInfoData), "PersonalFormData");
                    that.getCities(sPersonalInfo.birthCountry_countryCode, "B");
                    that.getCities(sPersonalInfo.residenceCountry_countryCode, "R");
                });
            },
            getCities: function (vCountryCode, vType) {
                var that = this;
                var oDataModel = this.getView().getModel();

                var oBindCities = oDataModel.bindContext("/Cities", undefined, {
                    $filter: "countryCode_countryCode eq '" + vCountryCode + "'",
                    $$groupId: "directRequest"
                });

                return new Promise((resolve, reject) => {
                    oBindCities.requestObject().then((oData) => {
                        if (vType === "B") {
                            that.getView().setModel(new JSONModel(oData.value), "BirthCities");
                        } else {
                            that.getView().setModel(new JSONModel(oData.value), "ResidenceCities");
                        }
                        resolve();
                    });
                });
            },
            onEditForm: function () {
                this.getView().getModel("ButtonVisible").setProperty("/Edit", false);
                this.getView().getModel("ButtonVisible").setProperty("/Others", true);
                this.getView().getModel("PersonalFormEditable").setProperty("/Editable", true);
                this.getView().byId("tblProfessions").setMode("Delete");
                this.getView().setModel(new JSONModel({
                    SelectedProfession: "",
                    Experience: "",
                    ProfessionDescription: ""
                }), "ArtisanRegistration");
            },
            onCancelEdit: function () {
                this.getView().getModel("ButtonVisible").setProperty("/Edit", true);
                this.getView().getModel("ButtonVisible").setProperty("/Others", false);
                this.getView().getModel("PersonalFormEditable").setProperty("/Editable", false);
                this.getView().byId("tblProfessions").setMode("None");
            },
            onChangeBirthCountry: function (oEvent) {
                var vSelectedCountry = oEvent.getSource().getSelectedKey();
                this.getView().byId("cbBirthCities").setSelectedKey();
                this.getCities(vSelectedCountry, "B");
            },
            onChangeResidenceCountry: function (oEvent) {
                var vSelectedCountry = oEvent.getSource().getSelectedKey();
                this.getView().byId("cbResidenceCities").setSelectedKey();

                var sSelectedCountry = this.getView().getModel("ResidenceCountries").getData().find((item) => {
                    return item.countryCode === vSelectedCountry;
                });

                var vGsmCode = sSelectedCountry.gsmCode;
                var vMask = vGsmCode.replace("9", "^9");

                var vIndex = 0;
                do {
                    vMask += "C";
                    vIndex++;
                }
                while (vIndex < sSelectedCountry.gsmLength);

                this.getView().byId("maskInpGsm").setValue();
                this.getView().byId("maskInpGsm").setMask(vMask);

                this.getCities(vSelectedCountry, "R");
            },
            onSaveForm: function () {
                var that = this;
                var sFormData = this.getView().getModel("PersonalFormData").getData();
                var aProfessions = this.getView().getModel("ArtisanProfessions").getData();
                var aKeys = Object.keys(sFormData);
                var oDataModel = this.getView().getModel();
                var bEmptyField = false;
                var aProfessionId = [];

                aKeys.forEach((item) => {
                    if (!sFormData[item]) {
                        bEmptyField = true;
                    }
                });

                if (bEmptyField) {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }

                if (!aProfessions.length) {
                    MessageToast.show(this.getResourceBundle().getText("AtLeastOneProfession"));
                    return;
                }

                bEmptyField = false;

                aProfessions.forEach((item) => {
                    if (!item.Experience || !item.Details) {
                        bEmptyField = true;
                    }
                    aProfessionId.push(item.ProfessionId);
                });

                if (bEmptyField) {
                    MessageToast.show(this.getResourceBundle().getText("FillProfessionBlanks"));
                    return;
                }

                var oBindArtisan = oDataModel.bindList("/Artisans", undefined, undefined, undefined, {
                    $filter: "email eq '" + sFormData.Email + "'",
                    $$groupId: "directRequest"
                });

                oBindArtisan.attachPatchCompleted(this.saveFormCompleted, this)

                oBindArtisan.requestContexts().then((aContext) => {
                    aContext[0].setProperty("firstName", sFormData.Name);
                    aContext[0].setProperty("lastName", sFormData.LastName);
                    aContext[0].setProperty("birthDate", that.convertDate(sFormData.BirthDate));
                    aContext[0].setProperty("birthCountry_countryCode", sFormData.BirthCountry);
                    aContext[0].setProperty("birthCityCode", sFormData.BirthCity);
                    aContext[0].setProperty("gender", sFormData.Gender);
                    aContext[0].setProperty("introduction", sFormData.Introduction);
                    aContext[0].setProperty("residenceCountry_countryCode", sFormData.ResidenceCountry);
                    aContext[0].setProperty("residenceCityCode", sFormData.ResidenceCity);
                    aContext[0].setProperty("address", sFormData.Address);
                    aContext[0].setProperty("gsm", sFormData.Gsm);

                    oDataModel.submitBatch("batchRequest");
                });


                var oBindArtisanProfessions = oDataModel.bindList("/ArtisanProfessions", undefined, undefined, undefined, {
                    $filter: "email_email eq '" + sFormData.Email + "'",
                    $$groupId: "directRequest"
                });

                oBindArtisanProfessions.requestContexts().then((aContext) => {
                    aContext.forEach((item) => {
                        var sContext = item.getObject();
                        if (aProfessionId.includes(sContext.professionID_professionID)) {
                            var sProfession = aProfessions.find((element) => {
                                return element.ProfessionId === sContext.professionID_professionID;
                            });
                            item.setProperty("description", sProfession.Details);
                            item.setProperty("experience", sProfession.Experience);
                            var vIndex = aProfessionId.indexOf(sContext.professionID_professionID);
                            aProfessionId.splice(vIndex, 1);
                        } else {
                            item.delete("directRequest");
                        }
                    });
                    oDataModel.submitBatch("batchRequest");
                    that.createNewProfessions(aProfessionId, aProfessions, sFormData.Email);
                });
            },
            saveFormCompleted: function () {
                MessageToast.show(this.getResourceBundle().getText("SaveFormSuccessful"));
                this.getView().getModel("ButtonVisible").setProperty("/Edit", true);
                this.getView().getModel("ButtonVisible").setProperty("/Others", false);
                this.getView().getModel("PersonalFormEditable").setProperty("/Editable", false);
                this.getView().byId("tblProfessions").setMode("None");
            },
            convertDate: function (date) {
                var vDate = "";
                var vDay = date.getDate().toString().length === 1 ? "0" + date.getDate() : date.getDate();
                var vMonth = (date.getMonth() + 1).toString().length === 1 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
                var vYear = date.getFullYear();

                vDate = vYear + "-" + vMonth + "-" + vDay;
                return vDate;
            },
            onAddProfession: function () {
                var oArtisanRegistration = this.getView().getModel("ArtisanRegistration");
                var sArtisanRegistration = oArtisanRegistration.getData();
                var bEmptyFields = false;

                var aKeys = Object.keys(sArtisanRegistration);

                aKeys.forEach((item) => {
                    if (!sArtisanRegistration[item]) {
                        bEmptyFields = true;
                    }
                });

                if (bEmptyFields) {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }

                var vSelectedProfessionKey = parseInt(sArtisanRegistration.SelectedProfession, 10);
                var vSelectedProfessionText = this.getView().byId("cbArtisanProfessions")._getSelectedItemText();
                var oProfessionTableModel = this.getView().getModel("ArtisanProfessions");

                if (oProfessionTableModel !== undefined) {
                    var aProfessionTable = oProfessionTableModel.getData();
                    var vDuplicateProfession = false;

                    aProfessionTable.forEach((item) => {
                        if (vSelectedProfessionKey === item.ProfessionId) {
                            item.Experience = parseInt(item.Experience, 10) + parseInt(sArtisanRegistration.Experience.trim(), 10);
                            item.Details = sArtisanRegistration.ProfessionDescription;
                            vDuplicateProfession = true;
                        }
                    });

                    if (!vDuplicateProfession) {
                        aProfessionTable.push({
                            ProfessionId: vSelectedProfessionKey,
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
                        ProfessionId: vSelectedProfessionKey,
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
            onChangeProfessionExperience: function (oEvent) {
                var vNewValue = oEvent.getParameter("newValue");
                var vRegex = /^\d{0,2}$/;

                if (vNewValue.length) {
                    if (!vRegex.test(vNewValue)) {
                        oEvent.getSource().setValue(vNewValue.substring(0, vNewValue.length - 1));
                    }
                }
            },
            onDeleteProfession: function (oEvent) {
                var oModel = this.getView().getModel("ArtisanProfessions");
                var aTableList = oModel.getData();
                var iIndex = parseInt(oEvent.getParameter("listItem").getBindingContext("ArtisanProfessions").getPath().split("/")[1]);
                aTableList.splice(iIndex, 1);
                oModel.setData(aTableList);
                oModel.refresh();
            },
            createNewProfessions: function (aProfessionId, aProfessions, Email) {
                var oDataModel = this.getView().getModel();
                if (!aProfessionId.length) {
                    return;
                }

                var oBindArtisanProfessions = oDataModel.bindList("/ArtisanProfessions", undefined, undefined, undefined, {
                    $$groupId: "directRequest"
                });

                aProfessions.forEach((item) => {
                    if (aProfessionId.includes(item.ProfessionId)) {
                        oBindArtisanProfessions.create({
                            email_email: Email,
                            professionID_professionID: parseInt(item.ProfessionId, 10),
                            description: item.Details,
                            experience: parseInt(item.Experience, 10)
                        });
                    }
                });
                oDataModel.submitBatch("batchRequest");
            },
            onChangePassword: async function () {
                var oDataModel = this.getView().getModel();
                var sChangePassword = this.getView().getModel("ChangePassword").getData();
                var vRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
                var vNewPassword = this.getView().byId("inpNewPassword").getValue();

                if (sChangePassword.CurrentPassword === "" || vNewPassword === "" ||
                    sChangePassword.ReNewPassword === "") {
                    MessageToast.show(this.getResourceBundle().getText("FillRequireBlanks"));
                    return;
                }
                var bOldPassword = await this.checkCurrentPassword(sChangePassword.CurrentPassword);

                if (!bOldPassword) {
                    MessageToast.show(this.getResourceBundle().getText("CurrentPasswordWrong"));
                    return;
                }
                if (!vRegex.test(vNewPassword)) {
                    MessageToast.show(this.getResourceBundle().getText("InvalidPassword"));
                    return;
                }
                if (vNewPassword !== sChangePassword.ReNewPassword) {
                    MessageToast.show(this.getResourceBundle().getText("PasswordsDifferent"));
                    return;
                }

                if (vNewPassword === sChangePassword.CurrentPassword) {
                    MessageToast.show(this.getResourceBundle().getText("PasswordCannotBeSame"));
                    return;
                }

                var vFilter = "email eq '" + sap.ui.getCore().email + "'";

                var oBindArtisanCredentials = oDataModel.bindList("/ArtisanCredentialsView", undefined, undefined, undefined, {
                    $filter: vFilter,
                    $$groupId: "directRequest"
                });

                oBindArtisanCredentials.attachPatchCompleted(this.onPasswordChangeCompleted, this);

                oBindArtisanCredentials.requestContexts().then((aContext) => {
                    aContext[0].setProperty("password", vNewPassword);
                    oDataModel.submitBatch("batchRequest");
                });
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
            onShowPasswordInfo: function (oEvent) {
                var oButton = oEvent.getSource(),
                    oView = this.getView();

                // create popover
                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "renova.hl.ui.artisan.fragments.PasswordInfo",
                        controller: this
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    });
                }
                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });
            },
            onClosePasswordInfo: function () {
                this.byId("poPasswordInfo").close();
            },
            onDisplayHideNewPassword: function () {
                this.getView().getModel("ShowNewPassword").setProperty("/Display",
                    this.getView().getModel("ShowNewPassword").getData().Display === true ? false : true);

                this.getView().byId("inpNewPassword").setType(
                    this.getView().getModel("ShowNewPassword").getData().Display === true ? "Text" : "Password"
                );
            },
            onPasswordChangeCompleted: function () {
                var that = this;
                var oStorage = new Storage(Storage.Type.local, "userLogin");

                MessageBox.information(
                    this.getResourceBundle().getText("SavePasswordSuccessful"), {
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
            onOpenNotifications: function (oEvent) {
                var oButton = oEvent.getSource();
                this.displayIncomingOrders(this, oButton);
            }
        });
    });