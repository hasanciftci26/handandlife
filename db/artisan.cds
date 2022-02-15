namespace renova.hl.db.artisan; //Artisan Models

using {renova.hl.db.main as main} from './main';
using {managed} from '@sap/cds/common';

entity Artisans : managed {
    key email              : String(160);
        firstName          : String(40);
        lastName           : type of firstName;
        residenceCountry   : Association to main.Countries;
        residenceCityCode  : main.Cities:cityCode;
        residenceCityAssoc : Association to main.Cities
                                 on residenceCityAssoc.cityCode = residenceCityCode;
        gsm                : String(20);
        birthDate          : Date;
        birthCountry       : Association to main.Countries;
        birthCityCode      : main.Cities:cityCode;
        birthCityAssoc     : Association to main.Cities
                                 on birthCityAssoc.cityCode = birthCityCode;
        address            : String(1000);
        gender             : String(20);
        profession         : Association to many ArtisanProfessions
                                 on profession.email = $self;
        registrationStatus : Association to main.Statuses;
        products           : Association to many ArtisanProducts
                                 on products.email = $self;
        introduction       : String(1000);
        preferredSystems   : Association to many ArtisanSystems
                                 on preferredSystems.email = $self;
};

entity ArtisanProfessions {
    key email        : Association to Artisans;
    key professionID : Association to Professions;
        description  : String(500);
        experience   : Decimal(3, 1);
        point        : Integer;
        segmentation : String(50);
};

entity Professions {
    key professionID : Integer;
        profession   : localized String(100);
};

entity ArtisanSystems {
    key systemID : Association to IntegratedSystems;
    key email    : Association to Artisans;
};

entity IntegratedSystems {
    key systemID : String(4);
        system   : String(100);
        artisans : Association to many ArtisanSystems
                       on artisans.systemID = $self;
};

entity ArtisanCredentials {
    key email    : String(160);
        password : String(60);
};

aspect Attachment {
    key fileID   : UUID;
    email        : Association to Artisans;
    fileName     : String(100);
    mediaType    : String      @Core.IsMediaType;
    mediaContent : LargeBinary @Core.MediaType : mediaType  @Core.ContentDisposition.Filename : fileName;
    url          : String;
};

entity ArtisanResumes : managed, Attachment {};

entity ArtisanProducts {
    key productID   : UUID;
        category    : Association to Categories;
        email       : Association to Artisans;
        stock       : String(25);
        unit        : Association to main.Units;
        price       : Decimal(10, 2);
        currency    : Association to main.Currencies;
        productName : String(70);
        properties  : Association to many ProductProperties
                          on properties.productID = $self;
        details     : String;
        status      : Association to main.Statuses;
        createdAt   : Timestamp @cds.on.insert : $now;
};

entity ProductProperties {
    key productID     : Association to ArtisanProducts;
    key propertyID    : Association to Properties;
        propertyValue : String(100);
        unit          : Association to main.Units;
};

entity Properties {
    key propertyID     : Integer;
        property       : localized String(100);
        category       : Association to Categories;
        commonProperty : Boolean;
        isSize         : Boolean;
        isBodySize     : Boolean;
        isColor        : Boolean;
        isWeight       : Boolean;
        mandatory      : Boolean;
};

entity Categories {
    key categoryID : String(4);
        category   : localized String(100);
};

entity ProfessionCategories {
    key categoryID   : Association to Categories;
    key professionID : Association to Professions;
};

entity ProductAttachments : managed, Attachment {
    key productID  : Association to ArtisanProducts;
        uploaded   : Boolean;
        pictureUrl : String;
};

entity Orders : managed {
    key orderID    : String(9);
        customerID : String(160);
        totalPrice : Decimal(10, 2);
        currency   : Association to main.Currencies;
        country    : Association to main.Countries;
        cityCode   : main.Cities:cityCode;
        cityAssoc  : Association to main.Cities
                         on cityAssoc.cityCode = cityCode;
        address    : String(1000);
        gsm        : String(20);
        firstName  : Artisans:firstName;
        lastName   : Artisans:lastName;
        status     : Association to main.Statuses;
        items      : Composition of many OrderItems
                         on items.orderID = $self;
};

entity OrderItems : managed {
    key itemNo           : Integer;
    key orderID          : Association to Orders;
        productType      : String(1)@assert.range enum {
            E;
            N
        };
        category         : Association to Categories;
        offerExpireBegin : DateTime;
        offerExpireEnd   : DateTime;
        artisanCount     : Integer default 15;
        properties       : Association to many ProductProperties
                               on properties.productID = productID;
        attachments      : Association to many ProductAttachments
                               on attachments.productID = productID;
        productID        : Association to ArtisanProducts;
        price            : Decimal(10, 2);
        currency         : Association to main.Currencies;
        quantity         : ArtisanProducts:stock;
        unit             : Association to main.Units;
        status           : Association to main.Statuses;
        cargoNumber      : String(40);
        cargoBranch      : String(200);
};

entity ArtisanOffers {
    key orderID          : Orders:orderID;
    key offerID          : UUID;
        productID        : ArtisanProducts:productID;
        itemNo           : OrderItems:itemNo;
        email            : Association to Artisans;
        price            : Decimal(10, 2);
        currency         : Association to main.Currencies;
        workDays         : Integer;
        details          : String(1000);
        status           : Association to main.Statuses;
        offerExpireBegin : DateTime @cds.valid.from;
        offerExpireEnd   : DateTime @cds.valid.to;
};

entity ForgottenPasswords {
    key email       : Artisans:email;
        passwordKey : String(100);
        resetUrl    : String(250);
};

///////////////////////////////////////////////////////////////////////////////////////////////////////
