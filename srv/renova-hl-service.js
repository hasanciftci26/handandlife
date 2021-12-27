/* eslint-disable no-unused-vars */
const { v4: uuidv4 } = require('uuid');

module.exports = (srv) => {
    // const { Professions } = srv.entities;

    srv.before('CREATE', 'ArtisanResumes', (req) => {
        // console.log(JSON.stringify(req.data))
        req.data.url = `/hand-and-life/ArtisanResumes(${req.data.fileID})/mediaContent`
    });

    srv.before('CREATE', 'ProductAttachments', (req) => {
        // console.log(JSON.stringify(req.data))
        req.data.url = `/hand-and-life/ProductAttachments(productID_productID=${req.data.productID_productID},fileID=${req.data.fileID})/mediaContent`
    });

    srv.before(["READ", "CREATE", "UPDATE", "DELETE"],
        ["Professions", "ArtisanSystems", "IntegratedSystems", "ArtisanCredentials"], (req) => {
            var bReject = false;
            req.req.rawHeaders.forEach((item) => {
                if (item.includes("renovasrv")) {
                    bReject = true;
                }
            });
            if (bReject) {
                req.reject(401, "Unauthorized");
            }
        });
    srv.on("GenerateUuid", (req) => {
        return uuidv4();
    });
};