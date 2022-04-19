const GM = require('gm');
const gm = GM.subClass({ imageMagick: true });
const FT = require('file-type');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const axios = require('axios');


exports.downloadImage = async (url) => {
    const res = await axios.get(url, {responseType: 'arraybuffer'});
    return Buffer.from(res.data, 'binary');
};

exports.convert = async (buf) => {
    return new Promise(( resolve, reject ) => {
        gm(buf).toBuffer('PNG', function(err, buffer) {
            err ? reject(err) : resolve(buffer);
        });
    });
};

exports.checkType = async (buf) => {
    const contentType = await FT.fileTypeFromBuffer(buf);
    return contentType;
};

exports.saveToS3 = async (bucket, fileName, buf) => {
    const contentType = await FT.fileTypeFromBuffer(buf);
    const key = `${fileName}.${contentType.ext}`;
};