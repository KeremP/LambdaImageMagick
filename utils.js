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

// writes passed buffer to file using fs.write()
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

// execute magick convert command using passed in temp filepaths
exports.convertCmd = async (fp) => {
    // this is to ensure no two temp outputs have the same filename. may not be needed.
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

// execute magick replace white w/ transparent command using passed in temp filepaths
exports.transparentCmd = async (fp) => {
    // this is to ensure no two temp outputs have the same filename. may not be needed.
    const id = await nanoid.nanoid();
    const out = '/tmp/'+id+'.png';
    try{
        const { stdout } = await exec(
            `magick ${fp} -fuzz 20% -transparent white ${out}`
        );
        return out;
    } catch(e) {
        throw new Error('Error in convert cmd: '+ e.message);
    }
}

// convert output to base64, cleanup temp files
exports.convertBase64 = async (fp) => {
    const b64 = fs.readFileSync(fp, {encoding:'base64'});
    fs.unlinkSync(fp);
    return b64;
}

// check filetype of input buffer
exports.checkType = async (buf) => {
    const contentType = await FT.fromBuffer(buf);
    return contentType;
};

// save output to s3 if needed
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