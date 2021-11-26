const cds = require("@sap/cds");

module.exports = (srv) => {
    srv.on("getProducts", async () => {
        var aReturnProducts = [];
        const db = await cds.connect.to("HandAndLife");
        const { ArtisanProducts, ProductProperties, Units, Categories } = db.entities;

        let aUnits = await SELECT.from(Units);
        let aCategories = await SELECT.from(Categories);

        let aProducts = await SELECT.from(ArtisanProducts).where({ status_statusID: "AVLB" });
        let aProductID = [];

        aProducts.forEach((item) => {
            aProductID.push(item.productID);
        });

        let aProperties = await SELECT.from(ProductProperties).where({ productID_productID: { in: aProductID } });

        aProducts.forEach((item) => {
            var aProp = aProperties.filter((element) => {
                return element.productID_productID == item.productID;
            });
            var sCategory = aCategories.find((category) => { return category.categoryID == item.category_categoryID; });
            var sUnit = aUnits.find((unit) => { return unit.unitID == item.unit_unitID; })

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

    srv.on("createOrder", async (req) => {
        var oOrder = req.data.order;
        console.log(oOrder.totalPrice);
        var sResponse = {
            orderID: "1234567890",
            isSuccess: true
        };
        return sResponse;
    });
};