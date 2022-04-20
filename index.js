const  { downloadImage, writeBufferToTempFile, convertCmd, convertBase64 } = require('./utils');

// converts input image files to .png. primarily used to convert .ai and .eps files.
// uses imagemagick and ghostscript on AWS Lambda.
exports.handler = async (event) => {
    const buf = await downloadImage(event.url);
    const outputTmp = await writeBufferToTempFile(buf);
    const outpath = await convertCmd(outputTmp);
    const output = await convertBase64(outpath);
    return { output };
};