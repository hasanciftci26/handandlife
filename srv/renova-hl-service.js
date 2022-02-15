/* eslint-disable no-unused-vars */
const oCrypto = require("crypto");
const oCloudinary = require("cloudinary").v2;

module.exports = (srv) => {
    const { ProductAttachments } = srv.entities;

    srv.before('CREATE', 'ArtisanResumes', (req) => {
        // console.log(JSON.stringify(req.data))
        req.data.url = `/hand-and-life/ArtisanResumes(${req.data.fileID})/mediaContent`
    });

    srv.before('CREATE', 'ProductAttachments', (req) => {
        // console.log(JSON.stringify(req.data))
        req.data.url = `/hand-and-life/ProductAttachments(productID_productID=${req.data.productID_productID},fileID=${req.data.fileID})/mediaContent`
    });

    srv.on('uploadImagesToRemote', async (req) => {
        let aMedia = await SELECT.from(ProductAttachments).where({ productID_productID: req.data.productID }).and({ uploaded: false });
        let aPromiseArray = [];
        
        for (let media of aMedia) {
            aPromiseArray.push(uploadImages(media));
        }

        Promise.all(aPromiseArray).then(async (resolve) => {
            for (let attachment of resolve) {
                var sUrl = {
                    pictureUrl: attachment.url,
                    uploaded: true
                };
                await UPDATE(ProductAttachments).with(sUrl).where({ fileID: attachment.fileID }).and({ productID_productID: attachment.productID_productID });
            }
        });
        return true;
    });

    srv.before(["CREATE", "UPDATE"], "ForgottenPasswords", (req) => {
        let vRandomBytes = oCrypto.randomBytes(30).toString("hex");
        req.data.passwordKey = vRandomBytes;
        req.data.resetUrl = req.data.resetUrl + vRandomBytes;
    });
};

async function uploadImages(media) {
    return new Promise((resolve, reject) => {
        oCloudinary.config({
            cloud_name: "hasanciftci26",
            api_key: "928936665394933",
            api_secret: "N_47VICa4ukb0xDWOrkIs2NGxKg"
        });
        var vBase64String = "data:" + media.mediaType + ";base64," + Buffer.from(media.mediaContent).toString("base64");
        oCloudinary.uploader.upload(vBase64String, function (error, results) {
            media.url = results ? results.secure_url : media.url;
            resolve(media);
        });
    });
}