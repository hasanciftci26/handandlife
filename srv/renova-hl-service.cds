using {renova.hl.db.artisan as artisan} from '../db/artisan'; //Artisan Models
using {renova.hl.db.main as main} from '../db/main'; //Main (Common) Models

//OData Service
service HandAndLife @(impl : './renova-hl-service') {
    @readonly
    entity ArtisanInformations as
        select from artisan.Artisans {
            *,
            residenceCountry.country           as residenceCountry,
            birthCountry.country               as birthCountry,
            residenceCityAssoc.city            as residenceCity,
            birthCityAssoc.city                as birthCity, 
            profession.professionID.profession as profession,
            products : redirected to ArtisanProducts,
            registrationStatus.status
        };

    @assert.integrity : false
    entity Artisans            as projection on artisan.Artisans {
        * , products : redirected to ArtisanProducts
    };

    @assert.integrity : false
    entity ArtisanProducts     as projection on artisan.ArtisanProducts {
        * , email : redirected to Artisans, properties : redirected to ProductProperties
    };

    @assert.integrity : false
    entity ArtisanResumes      as projection on artisan.ArtisanResumes {
        * , email : redirected to Artisans
    };

    @assert.integrity : false
    entity ProductAttachments  as projection on artisan.ProductAttachments {
        * , productID : redirected to ArtisanProducts, email : redirected to Artisans
    };

    @assert.integrity : false
    entity ProductProperties   as projection on artisan.ProductProperties {
        * , productID : redirected to ArtisanProducts
    };

    @assert.integrity : false
    entity ArtisanCredentials  as
        select from artisan.ArtisanCredentials as c
        inner join artisan.Artisans as a
            on a.email = c.email
        {
            c.email,
            c.password
        }
        where
            a.registrationStatus.statusID = 'APPR';

    // @readonly
    @assert.integrity : false
    entity Categories          as projection on artisan.Categories;

    //Sonradan kalkabilir.
    @readonly
    @assert.integrity : false
    entity ArtisanProductsView as projection on artisan.ArtisanProducts {
        * , email : redirected to Artisans, 
        properties : redirected to ProductProperties, 
        category.category as category, 
        status.status as status,
        status.statusID
    };

    @readonly
    @assert.integrity : false
    entity Properties          as projection on artisan.Properties;

    @readonly
    @assert.integrity : false
    entity Professions         as projection on artisan.Professions;

    @assert.integrity : false
    entity ArtisanSystems      as projection on artisan.ArtisanSystems {
        * , email : redirected to Artisans
    };

    @readonly
    @assert.integrity : false
    entity IntegratedSystems   as projection on artisan.IntegratedSystems;

    @assert.integrity : false
    entity ArtisanProfessions  as projection on artisan.ArtisanProfessions {
        * , email : redirected to Artisans
    };

    @assert.integrity : false
    entity Orders              as projection on artisan.Orders;

    @readonly
    @assert.integrity : false
    entity ProductTypes        as projection on artisan.ProductTypes;

    @assert.integrity : false
    entity ArtisanOffers       as projection on artisan.ArtisanOffers {
        * , email : redirected to Artisans
    };

    @assert.integrity : false
    entity OrderItems          as projection on artisan.OrderItems {
        * , productID : redirected to ArtisanProducts
    };

    @assert.integrity : false
    @readonly
    entity Countries           as projection on main.Countries;

    @assert.integrity : false
    @readonly
    entity Cities              as projection on main.Cities;

    @assert.integrity : false
    @readonly
    entity Statuses            as projection on main.Statuses;

    @assert.integrity : false
    @readonly
    entity Currencies          as projection on main.Currencies;

    @assert.integrity : false
    @readonly
    entity Colors              as projection on main.Colors;

    @assert.integrity : false
    @readonly
    entity Units               as projection on main.Units;
};
