/* eslint-disable no-unused-vars */
const cds = require("@sap/cds");
const { v4: uuidv4 } = require('uuid');

module.exports = async (srv) => {
    const db = await cds.connect.to("HandAndLife");
    const { ArtisanProducts,
        ProductProperties,
        Units,
        Categories,
        Orders,
        OrderItems,
        ProfessionCategories,
        ArtisanProfessions,
        ArtisanOffers,
        ProductAttachments,
        Properties } = db.entities;

    //Tüm ürünleri döner
    srv.on(["getProducts", "getCategoricalProducts"], async (req) => {
        let aReturnProducts = [];

        let aPictures = await SELECT.from(ProductAttachments);
        let aUnits = await SELECT.from(Units);
        let aCategories = await SELECT.from(Categories);

        let aProducts = [];
        if (req.data.categoryID == undefined) {
            aProducts = await SELECT.from(ArtisanProducts).where({ status_statusID: "AVLB" });
        } else {
            aProducts = await SELECT.from(ArtisanProducts).where({ category_categoryID: req.data.categoryID, and: { status_statusID: "AVLB" } });
        }
        let aProductID = [];

        aProducts.forEach((item) => {
            aProductID.push(item.productID);
        });

        let aProperties = await SELECT.from(ProductProperties).where({ productID_productID: { in: aProductID } });

        aProducts.forEach((item) => {
            let aProp = aProperties.filter((element) => {
                return element.productID_productID == item.productID;
            });

            let aPic = aPictures.filter((element) => {
                return element.productID_productID == item.productID;
            });

            let sCategory = aCategories.find((category) => { return category.categoryID == item.category_categoryID; });
            let sUnit = aUnits.find((unit) => { return unit.unitID == item.unit_unitID; })

            aReturnProducts.push({
                productID: item.productID,
                categoryID: item.category_categoryID,
                categoryText: sCategory.category,
                email: item.email_email,
                stock: item.stock,
                stockUnit: item.unit_unitID,
                stockUnitText: sUnit.unit,
                price: item.price,
                currency: item.currency_currencyCode,
                productName: item.productName,
                properties: aProp,
                details: item.details
            });
        });
        return aReturnProducts;
    });

    //Tek bir ürün döner döner
    srv.on("getSingleProduct", async (req) => {
        if (!req.data.productID) {
            req.reject(404, "Product not found");
        }

        let aUnits = await SELECT.from(Units);
        let aCategories = await SELECT.from(Categories);

        let sProduct = await SELECT.one.from(ArtisanProducts).where({ productID: req.data.productID, and: { status_statusID: "AVLB" } });
        if (!sProduct) {
            req.reject(404, "Product not found");
        }

        let aProperties = await SELECT.from(ProductProperties).where({ productID_productID: req.data.productID });

        let sCategory = aCategories.find((category) => { return category.categoryID == sProduct.category_categoryID; });
        let sUnit = aUnits.find((unit) => { return unit.unitID == sProduct.unit_unitID; });

        let aReturnProperties = [];

        aProperties.forEach((item) => {
            let vUnitText = {};
            if (item.unit_unitID != null && item.unit_unitID != "") {
                vUnitText = aUnits.find((unit) => { return unit.unitID == item.unit_unitID; }).unit;
            }
            aReturnProperties.push({
                propertyID_propertyID: item.propertyID_propertyID,
                productID_productID: req.data.productID,
                propertyValue: item.propertyValue,
                unit: item.unit_unitID,
                unitText: vUnitText
            });
        });

        let sReturnProducts = {
            productID: sProduct.productID,
            categoryID: sProduct.category_categoryID,
            categoryText: sCategory.category,
            email: sProduct.email_email,
            stock: sProduct.stock,
            stockUnit: sProduct.unit_unitID,
            stockUnitText: sUnit.unit,
            price: sProduct.price,
            currency: sProduct.currency_currencyCode,
            productName: sProduct.productName,
            properties: aReturnProperties,
            details: sProduct.details
        };
        return sReturnProducts;
    });

    //Var olan veya olmayan ürünler için sipariş oluşturur.
    srv.on("createOrder", async (req) => {
        let oOrder = req.data.order;
        var vOrderId = "";
        await getNextOrderID(Orders).then((resolve) => {
            vOrderId = resolve.toString();
        });

        let aOrder = [{
            orderID: vOrderId,
            customerID: oOrder.customerID,
            totalPrice: parseFloat(oOrder.totalPrice),
            currency_currencyCode: oOrder.currency,
            country_countryCode: oOrder.country,
            cityCode: oOrder.cityCode,
            address: oOrder.address,
            gsm: oOrder.gsm,
            firstName: oOrder.firstName,
            lastName: oOrder.lastName,
            status_statusID: "CRTD"
        }];

        let aOrderItems = [];

        oOrder.items.forEach((item, index) => {
            let vOfferExpireBegin = item.productType == "E" ? "1900-01-01T00:00:00.000Z" : item.offerExpireBegin;
            let vOfferExpireEnd = item.productType == "E" ? "9999-01-01T00:00:00.000Z" : item.offerExpireEnd;
            aOrderItems.push({
                itemNo: index + 1,
                orderID_orderID: vOrderId,
                productType: item.productType,
                category_categoryID: item.category,
                offerExpireBegin: vOfferExpireBegin,
                offerExpireEnd: vOfferExpireEnd,
                artisanCount: item.artisanCount == null ? 15 : item.artisanCount,
                productID_productID: item.productID == null ? uuidv4() : item.productID,
                price: parseFloat(item.price),
                currency_currencyCode: item.currency,
                quantity: parseFloat(item.quantity),
                unit_unitID: item.unit,
                status_statusID: "CRTD",
                cargoBranch: "test",
                cargoNumber: "test2"
            });
        });

        let oOrderInsert = await INSERT.into(Orders).entries(aOrder);

        if (oOrderInsert.affectedRows == 1) {
            let oItemInsert = await INSERT.into(OrderItems).entries(aOrderItems);
            if (oItemInsert.affectedRows == aOrderItems.length) {
                let aNonExistProductID = [];

                aOrderItems.forEach((item) => {
                    if (item.productType == "N") {
                        aNonExistProductID.push({
                            productID: item.productID_productID
                        });
                    }
                });

                let aNonExistProducts = aOrderItems.filter((item) => {
                    return item.productType == "N";
                });

                await determineBestArtisans(aNonExistProducts, ProfessionCategories, ArtisanProfessions, vOrderId, ArtisanOffers);

                var sResponse = {
                    orderID: vOrderId,
                    isSuccess: true,
                    nonExistItems: aNonExistProductID
                };
            } else {
                sResponse = {
                    orderID: "",
                    isSuccess: false,
                    nonExistItems: []
                };
            }
        } else {
            sResponse = {
                orderID: "",
                isSuccess: false,
                nonExistItems: []
            };
        }
        return sResponse;
    });

    //Eğer nonexist product ise müşterinin girdiği property'leri tabloya kaydet.
    srv.on("saveProductProperties", async (req) => {
        let oProperties = req.data.productProperties;
        let aProductProperties = [];

        oProperties.properties.forEach((item) => {
            aProductProperties.push({
                productID_productID: oProperties.productID,
                propertyID_propertyID: item.propertyID,
                propertyValue: item.propertyValue,
                unit_unitID: item.unit
            });
        });

        let oInsertProperty = await INSERT.into(ProductProperties).entries(aProductProperties);
        if (oInsertProperty.affectedRows == aProductProperties.length) {
            var sReturn = {
                isSuccess: true
            };
        } else {
            sReturn = {
                isSuccess: false
            };
        }
        return sReturn;
    });

    //Spesifik customer'ın orderlarını veya spesifik order'ı döner
    srv.on(["getCustomerOrders", "getSingleOrder"], async (req) => {
        if (req.event == "getCustomerOrders") {
            if (req.data.customerID == null || req.data.customerID == "") {
                req.reject(404, "Order not found");
            }
        } else {
            if (req.data.orderID == null || req.data.orderID == "") {
                req.reject(404, "Order not found");
            }
        }

        let aOrderReturn = [];
        let aOrders = [];
        if (req.event == "getCustomerOrders") {
            aOrders = await SELECT.from(Orders).where({ customerID: req.data.customerID });
        } else {
            aOrders = await SELECT.from(Orders).where({ orderID: req.data.orderID });
        }
        let aOrderId = aOrders.map((item) => { return item.orderID; });
        let aOrderItems = await SELECT.from(OrderItems).where({ orderID_orderID: { in: aOrderId } });

        aOrders.forEach((item) => {
            let aFilteredOrderItems = aOrderItems.filter((orderitem) => { return orderitem.orderID_orderID == item.orderID; });

            let aItems = [];
            aFilteredOrderItems.forEach((oItem) => {
                aItems.push({
                    itemNo: oItem.itemNo,
                    productType: oItem.productType,
                    category: oItem.category_categoryID,
                    offerExpireBegin: oItem.offerExpireBegin,
                    offerExpireEnd: oItem.offerExpireEnd,
                    artisanCount: oItem.artisanCount,
                    productID: oItem.productID_productID,
                    price: oItem.price,
                    currency: oItem.currency_currencyCode,
                    quantity: oItem.quantity,
                    unit: oItem.unit_unitID
                });
            });

            aOrderReturn.push({
                orderID: item.orderID,
                customerID: item.customerID,
                totalPrice: item.totalPrice,
                currency: item.currency_currencyCode,
                country: item.country_countryCode,
                cityCode: item.cityCode,
                address: item.address,
                gsm: item.gsm,
                firstName: item.firstName,
                lastName: item.lastName,
                items: aItems
            });
        });
        if (req.event == "getCustomerOrders") {
            return aOrderReturn;
        } else {
            let sOrder = aOrderReturn[0];
            return sOrder;
        }
    });

    //Category'leri döner
    srv.on("getCategories", async (req) => {
        let aCategories = await SELECT.from(Categories);
        return aCategories;
    });

    //Unit'leri döner
    srv.on("getUnits", async (req) => {
        let aUnits = await SELECT.from(Units);
        return aUnits;
    });

    //Property'lerin tamamını veya category'ye özel döner
    srv.on(["getProperties", "getCategoricalProperties"], async (req) => {
        let aProperties = [];
        if (req.event == "getProperties") {
            aProperties = await SELECT.from(Properties);
        } else {
            let aCategories = [0, req.data.categoryID];
            aProperties = await SELECT.from(Properties).where({ category_categoryID: { in: aCategories } });
        }
        return aProperties;
    });

    //Ordera gelen offerları döner
    srv.on("getOrderOffers", async (req) => {
        let vOrderId = req.data.orderID;
        let aOffers = await SELECT.from(ArtisanOffers).where({ status_statusID: "OFRD" });
        let aItemNo = [];
        let aReturnOffers = [];

        aOffers.forEach((item) => {
            aReturnOffers.push({
                orderID: vOrderId,
                itemNo: item.itemNo,
                offerID: item.offerID,
                productID: item.productID,
                email: item.email_email,
                price: item.price,
                currency: item.currency_currencyCode,
                workDays: item.workDays,
                details: item.details,
                status: item.status_statusID
            });
        });
        return aReturnOffers;
    });

    srv.on("setOfferAccepted", async (req) => {
        let vOrderId = req.data.orderID,
            vOfferId = req.data.offerID,
            sReturn = {},
            sStatus = {
                status_statusID: "ACTD"
            };

        let sOffer = {
            orderID: vOrderId,
            offerID: vOfferId
        };

        let vResponse = await UPDATE(ArtisanOffers, sOffer).with(sStatus);

        if (vResponse == 1) {
            sReturn = {
                orderID: vOrderId,
                offerID: vOfferId,
                isSuccess: true
            };
        } else {
            sReturn = {
                orderID: vOrderId,
                offerID: vOfferId,
                isSuccess: false
            };
        }
        return sReturn;
    });

    srv.on("updateOfferExpireDate", async (req) => {
        let sOfferExpire = {
            offerExpireBegin: req.data.offerExpireBegin,
            offerExpireEnd: req.data.offerExpireEnd
        },
            sResponse = {};

        let vResponse = await UPDATE(ArtisanOffers).with(sOfferExpire).where({ orderID: req.data.orderID }).and({ productID: req.data.productID });
        if (vResponse > 0) {
            sResponse = {
                orderID: req.data.orderID,
                isSuccess: true
            };
        } else {
            sResponse = {
                orderID: req.data.orderID,
                isSuccess: false
            };
        }
        return sResponse;
    });
}

//Incremental Order ID üretmek için
async function getNextOrderID(Orders) {
    let oOrderId = await SELECT.one.from(Orders).columns(column => { column.orderID }).orderBy("orderID desc");
    return new Promise((resolve) => {
        var vOrderId = oOrderId ? parseInt(oOrderId.orderID, 10) + 1 : "100000000";
        resolve(vOrderId);
    });
}

//Eğer non-exist product ise en iyi artisanları bul ve offer tablosuna kaydet
async function determineBestArtisans(aProducts, ProfessionCategories, ArtisanProfessions, vOrderId, ArtisanOffers) {
    if (aProducts.length != 0) {
        let aCategories = [];
        aProducts.forEach((item) => {
            if (!aCategories.includes(item.category_categoryID)) {
                aCategories.push(item.category_categoryID);
            }
        });
        var aProfessionCategories = await SELECT.from(ProfessionCategories).where({ categoryID_categoryID: { in: aCategories } });
    }
    if (aProducts.length == 0) {
        return;
    } else {
        for (const products of aProducts) {
            let aFilteredProfessions = aProfessionCategories.filter((element) => {
                return element.categoryID_categoryID == products.category_categoryID;
            });

            let aProfessions = [];
            aFilteredProfessions.forEach((prof) => {
                aProfessions.push(prof.professionID_professionID);
            });

            let aArtisans = await SELECT.from(ArtisanProfessions).where({ professionID_professionID: { in: aProfessions } })
                .orderBy("point desc").limit({ rows: { val: products.artisanCount } });

            let aArtisanEmails = [];
            aArtisans.forEach((artisan) => {
                if (!aArtisanEmails.includes(artisan.email_email)) {
                    aArtisanEmails.push(artisan.email_email);
                }
            });

            let aArtisanOffer = [];

            aArtisanEmails.forEach((artisan) => {
                aArtisanOffer.push({
                    orderID: vOrderId,
                    itemNo: products.itemNo,
                    productID: products.productID_productID,
                    offerID: uuidv4(),
                    email_email: artisan,
                    status_statusID: "WAIT",
                    offerExpireBegin: products.offerExpireBegin,
                    offerExpireEnd: products.offerExpireEnd
                });
            });

            let oInsertOffer = await INSERT.into(ArtisanOffers).entries(aArtisanOffer);
            var bSuccess = false;
            if (oInsertOffer.affectedRows > 0) {
                bSuccess = true;
            }
        }
        return bSuccess;
    }
}