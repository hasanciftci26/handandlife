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
        ArtisanOffers } = db.entities;

    //Tüm ürünleri döner
    srv.on("getProducts", async () => {
        let aReturnProducts = [];

        let aUnits = await SELECT.from(Units);
        let aCategories = await SELECT.from(Categories);

        let aProducts = await SELECT.from(ArtisanProducts).where({ status_statusID: "AVLB" });
        let aProductID = [];

        aProducts.forEach((item) => {
            aProductID.push(item.productID);
        });

        let aProperties = await SELECT.from(ProductProperties).where({ productID_productID: { in: aProductID } });

        aProducts.forEach((item) => {
            let aProp = aProperties.filter((element) => {
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

    //Var olan ürünler için sipariş oluşturur.
    srv.on("createOrder", async (req) => {
        let oOrder = req.data.order;
        var vOrderId = "";
        await getNextOrderID(Orders).then((resolve) => {
            vOrderId = resolve.toString();
        });

        let aOrder = [{
            orderID: vOrderId,
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

                await determineBestArtisans(aNonExistProducts, ProfessionCategories, ArtisanProfessions, vOrderId,ArtisanOffers);

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
    // srv.on("getOrder", (req) => { });
    // srv.on("getOrderItem", (req) => { });
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
async function determineBestArtisans(aProducts, ProfessionCategories, ArtisanProfessions, vOrderId,ArtisanOffers) {
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
        aProducts.forEach(async (item) => {
            let aFilteredProfessions = aProfessionCategories.filter((element) => {
                return element.categoryID_categoryID == item.category_categoryID;
            });

            let aProfessions = [];
            aFilteredProfessions.forEach((prof) => {
                aProfessions.push(prof.professionID_professionID);
            });

            let aArtisans = await SELECT.from(ArtisanProfessions).where({ professionID_professionID: { in: aProfessions } })
                .orderBy("point desc").limit({ rows: item.artisanCount });

            let aArtisanOffer = [];

            aArtisans.forEach((artisan) => {
                aArtisanOffer.push({
                    orderID: vOrderId,
                    itemNo: item.itemNo,
                    offerID: uuidv4(),
                    email_email: artisan.email_email,
                    status_statusID: "WAIT",
                    offerExpireBegin: item.offerExpireBegin,
                    offerExpireEnd: item.offerExpireEnd
                });
            });

            let oInsertOffer = await INSERT.into(ArtisanOffers).entries(aArtisanOffer);
            return oInsertOffer;
        });
    }

}