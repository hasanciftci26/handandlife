/* eslint-disable no-unused-vars */
// const cds = require("@sap/cds");

module.exports = (srv) => {
    const { Professions } = srv.entities;

    // srv.before("READ", "ArtisanInformations", async (req) => {
    //     let aProfessions_1 = await srv.run(SELECT.from(Professions).where({ professionID: 1 })); // 8 ve 10. satır aynı şeyi ifade eder
    //     let oUpdateResult = await srv.update(Professions, 1).with({ profession: "Text" });
    //     let aProfessions_2 = await srv.read(Professions).where({ professionID: 1 });
    // });

    srv.before('CREATE', 'ArtisanResumes', (req) => {
        console.log(JSON.stringify(req.data))
        req.data.url = `/hand-and-life/ArtisanResumes(${req.data.fileID})/mediaContent`
    })

    // srv.on("READ", "ArtisanInformations", async (req, next) => {
    //     let result = await srv.run(SELECT.from(Professions).where({ professionID: 1 }));
    // });

    // srv.after("READ", "ArtisanInformations", async (data, req) => {
    //     let aData = data;
    //     let result = await srv.run(SELECT.from(Professions).where({ professionID: 1 }));
    // });
};