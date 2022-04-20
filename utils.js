const FT = require('file-type');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const axios = require('axios');
const Q = require('q');
const fs = require('fs');
const tmp = require('tmp');
const childProcess = require('child_process');
const util = require('util');
const exec = util.promisify(childProcess.exec);
const nanoid = require('nanoid/async');

exports.downloadImage = async (url) => {
    const res = await axios.get(url, {responseType: 'arraybuffer'});
    return Buffer.from(res.data,'binary');
};

// TODO: fix tmp file writing, or put object to s3 bucket temporarily
//       then delete from temp bucket dir on complete.
//       OR: write to temp_out dir -> need to test this.

function writeBufferToFile(fd, buffer) {
    var deffered = Q.defer();
    fs.write(fd, buffer, 0, buffer.length, 0, function(err, written, buffer) {
        if(!written) {
            deffered.reject(err);
        } else {
            deffered.resolve(true);
        }
    });
    return deffered.promise;
}

// write buffer to tmp file, then execute magick cmd
exports.writeBufferToTempFile = function(buffer) {
    var deffered = Q.defer();
    tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) {
            deffered.reject(err);
        } else {
            writeBufferToFile(fd, buffer).then(
                function(isWritten) { deffered.fulfill(path); },
                function(err) {deffered.reject(err);}
            );
        }
    });
    return deffered.promise;
};

exports.convertCmd = async (fp) => {
    const id = await nanoid.nanoid();
    const out = '/tmp/'+id+'.png';
    try{
        const { stdout } = await exec(
            `magick ${fp} ${out}`
        );
        return out;
    } catch(e) {
        throw new Error('Error in convert cmd: '+ e.message);
    }
}

exports.convertBase64 = async (fp) => {
    const b64 = fs.readFileSync(fp, {encoding:'base64'});
    fs.unlinkSync(fp);
    return b64;
}

exports.checkType = async (buf) => {
    const contentType = await FT.fromBuffer(buf);
    return contentType;
};

exports.saveToS3 = async (bucket, fileName, buf) => {
    const contentType = await FT.fileTypeFromBuffer(buf);
    const key = `${fileName}.${contentType.ext}`;
    await s3.putObject({
        Bucket: bucket,
        Key: key,
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: contentType.mime,
    }).promise();
};