using {renova.hl.db.artisan as artisan} from '../db/artisan'; //Artisan Models
using {renova.hl.db.main as main} from '../db/main'; //Main (Common) Models

//OData Service
service HandAndLife @(impl : './renova-hl-service') {
    @readonly
    entity ArtisanInformations    as
        select from artisan.Artisans {
                * ,
            key email,
                residenceCountry.country           as residenceCountry,
                birthCountry.country               as birthCountry,
                residenceCityAssoc.city            as residenceCity,
                birthCityAssoc.city                as birthCity,
                profession.professionID.profession as profession,
                products : redirected to ArtisanProducts,
                registrationStatus.status
        };

    // @assert.integrity : false
    entity Artisans               as projection on artisan.Artisans {
        * , products : redirected to ArtisanProducts
    };

    @assert.integrity : false
    entity ArtisanProducts        as projection on artisan.ArtisanProducts {
        * , email : redirected to Artisans, properties : redirected to ProductProperties
    };

    // @assert.integrity : false
    entity ArtisanResumes         as projection on artisan.ArtisanResumes {
        * , email : redirected to Artisans
    };

    // @assert.integrity : false
    entity ProductAttachments     as projection on artisan.ProductAttachments {
        * , productID : redirected to ArtisanProducts, email : redirected to Artisans
    };

    @assert.integrity : false
    entity ProductProperties      as projection on artisan.ProductProperties {
        * , productID : redirected to ArtisanProducts
    };

    entity ForgottenPasswords     as projection on artisan.ForgottenPasswords;

    @assert.integrity : false
    entity ProfessionCategories   as projection on artisan.ProfessionCategories;

    @assert.integrity : false
    entity ArtisanCredentials     as
        select from artisan.ArtisanCredentials as c
        inner join artisan.Artisans as a
            on a.email = c.email
        {
            key c.email,
                c.password
        }
        where
            a.registrationStatus.statusID = 'APPR';

    @readonly
    @assert.integrity : false
    entity Categories             as projection on artisan.Categories;

    entity ArtisanCredentialsView as projection on artisan.ArtisanCredentials;

    //Sonradan kalkabilir.
    @readonly
    @assert.integrity : false
    entity ArtisanProductsView    as projection on artisan.ArtisanProducts {
        * , email : redirected to Artisans, properties : redirected to ProductProperties, category.category as category, status.status as status, status.statusID
    };

    @readonly
    @assert.integrity : false
    entity Properties             as projection on artisan.Properties;

    @readonly
    @assert.integrity : false
    entity Professions            as projection on artisan.Professions;

    @assert.integrity : false
    entity ArtisanSystems         as projection on artisan.ArtisanSystems {
        * , email : redirected to Artisans
    };

    @readonly
    @assert.integrity : false
    entity IntegratedSystems      as projection on artisan.IntegratedSystems;

    @assert.integrity : false
    entity ArtisanProfessions     as projection on artisan.ArtisanProfessions {
        * , email : redirected to Artisans
    };

    @assert.integrity : false
    entity Orders                 as projection on artisan.Orders;

    // @readonly
    // @assert.integrity : false
    // entity ProductTypes        as projection on artisan.ProductTypes;

    @assert.integrity : false
    entity ArtisanOffers          as projection on artisan.ArtisanOffers {
        * , email : redirected to Artisans
    };

    @assert.integrity : false
    entity OrderItems             as projection on artisan.OrderItems {
        * , productID : redirected to ArtisanProducts
    };

    @assert.integrity : false
    @readonly
    entity Countries              as projection on main.Countries;

    @assert.integrity : false
    @readonly
    entity Cities                 as projection on main.Cities;

    @assert.integrity : false
    @readonly
    entity Statuses               as projection on main.Statuses;

    @assert.integrity : false
    @readonly
    entity Currencies             as projection on main.Currencies;

    @assert.integrity : false
    @readonly
    entity Colors                 as projection on main.Colors;

    @assert.integrity : false
    @readonly
    entity Units                  as projection on main.Units;
};

service HandAndLifeIntegration @(impl : './renova-hl-int-service') {
    type Products {
        productID                 : UUID;
        categoryID                : artisan.Categories:categoryID;
        categoryText              : artisan.Categories:category;
        email                     : String(160);
        stock                     : String(25);
        stockUnit                 : main.Units:unitID;
        stockUnitText             : main.Units:unit;
        price                     : Decimal(10, 2);
        currency                  : main.Currencies:currencyCode;
        productName               : String(70);
        properties                : many {
            propertyID_propertyID : artisan.Properties:propertyID;
            productID_productID   : artisan.ArtisanProducts:productID;
            propertyValue         : String(100);
            unit                  : main.Units:unitID;
            unitText              : main.Units:unit;
        };
        details                   : String;
    };

    aspect Orders {
        customerID           : artisan.Orders:customerID;
        totalPrice           : Decimal(10, 2);
        currency             : main.Currencies:currencyCode;
        country              : main.Countries:countryCode;
        cityCode             : main.Cities:cityCode;
        address              : String(1000);
        gsm                  : String(20);
        firstName            : artisan.Artisans:firstName;
        lastName             : artisan.Artisans:lastName;
        items                : many {
            itemNo           : Integer;
            productType      : artisan.OrderItems:productType;
            category         : artisan.Categories:categoryID;
            offerExpireBegin : DateTime;
            offerExpireEnd   : DateTime;
            artisanCount     : Integer;
            productID        : artisan.ArtisanProducts:productID;
            price            : Decimal(10, 2);
            currency         : main.Currencies:currencyCode;
            quantity         : String(25);
            unit             : main.Units:unitID;
        };
    };

    type AllOrders : Orders {};

    type CustomerOrders : Orders {
        orderID : String(9);
    };

    type OrderResponse {
        orderID       : String(10);
        isSuccess     : Boolean;
        nonExistItems : many {
            productID : artisan.ArtisanProducts:productID;
        };
    };

    type ProductPropertiesInput {
        productID         : artisan.ArtisanProducts:productID;
        properties        : many {
            propertyID    : Integer;
            propertyValue : artisan.ProductProperties:propertyValue;
            unit          : main.Units:unitID;
        };
    };

    type PropertyResponse {
        isSuccess : Boolean;
    };

    type Categories {
        categoryID : String(4);
        category   : String(100);
    };

    type Properties {
        propertyID          : Integer;
        property            : String(100);
        category_categoryID : artisan.Categories:categoryID;
        commonProperty      : Boolean;
        isSize              : Boolean;
        isBodySize          : Boolean;
        isColor             : Boolean;
        isWeight            : Boolean;
        mandatory           : Boolean;
    };

    type Units {
        unitID   : String(5);
        unit     : String(100);
        isSize   : Boolean;
        isWeight : Boolean;
    };

    type OrderOffers {
        orderID   : artisan.Orders:orderID;
        itemNo    : artisan.OrderItems:itemNo;
        offerID   : UUID;
        productID : artisan.ArtisanProducts:productID;
        email     : artisan.Artisans:email;
        price     : Decimal(10, 2);
        currency  : main.Currencies:currencyCode;
        workDays  : Integer;
        details   : String(1000);
        status    : main.Statuses:statusID;
    };

    type OfferResponse {
        orderID   : artisan.Orders:orderID;
        offerID   : artisan.ArtisanOffers:offerID;
        isSuccess : Boolean;
    };

    type OfferExpireResponse {
        orderID   : artisan.Orders:orderID;
        isSuccess : Boolean;
    };

    function getProducts() returns array of Products;
    function getSingleProduct(productID : UUID) returns Products;
    function getCategoricalProducts(categoryID : String(4)) returns array of Products;
    function getCategories() returns array of Categories;
    function getCustomerOrders(customerID : artisan.Orders:customerID) returns array of CustomerOrders;
    function getSingleOrder(orderID : artisan.Orders:orderID) returns CustomerOrders;
    function getProperties() returns array of Properties;
    function getCategoricalProperties(categoryID : artisan.Categories:categoryID) returns array of Properties;
    function getUnits() returns array of Units;
    function getOrderOffers(orderID : artisan.Orders:orderID) returns array of OrderOffers;
    action createOrder(order : AllOrders) returns OrderResponse;
    action saveProductProperties(productProperties : ProductPropertiesInput) returns PropertyResponse;
    action setOfferAccepted(orderID : artisan.Orders:orderID, offerID : artisan.ArtisanOffers:offerID) returns OfferResponse;
    action updateOfferExpireDate(orderID : artisan.Orders:orderID, productID : UUID, offerExpireBegin : DateTime, offerExpireEnd : DateTime) returns OfferExpireResponse;
};
