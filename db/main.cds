namespace renova.hl.db.main; //Common Models

entity Countries {
    key countryCode : String(2);
        country     : localized String(100);
        gsmCode     : String(7);
        gsmLength   : Integer;
};

entity Cities {
    key cityCode    : String(2);
    key countryCode : Association to Countries;
        city        : String(100);
};

entity Statuses {
    key statusID : String(4);
        status   : localized String(50);
};

entity Currencies {
    key currencyCode : String(5);
        currency     : localized String(100);
};

entity Colors {
    key colorID : String(5);
        color   : localized String(100);
        hexCode : String(7);
};

entity Units {
    key unitID   : String(5);
        unit     : localized String(100);
        isSize   : Boolean;
        isWeight : Boolean;
};
