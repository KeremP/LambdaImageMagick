const  { downloadImage, writeBufferToTempFile, convertCmd, convertBase64 } = require('./utils');

// checks file type and converts from .ai or .eps to .png
// using imagemagick. the returned buffer will be rendered on fabric.js canvas
exports.handler = async (event) => {
    const buf = await downloadImage(event.url);
    // const inputType = await checkType(buf);
    const outputTmp = await writeBufferToTempFile(buf);
    const outpath = await convertCmd(outputTmp);
    const output = await convertBase64(outpath);
    return { output };
};