const  { downloadImage, writeBufferToTempFile, convertCmd, convertBase64, checkType, transparentCmd } = require('./utils');

// converts input image files to .png. primarily used to convert .ai and .eps files.
// uses imagemagick and ghostscript on AWS Lambda.
exports.handler = async (event) => {
    // console.log(event);
    const eventJson = event.body ? JSON.parse(event.body): event;
    const buf = await downloadImage(eventJson.url);
    const filetype = await checkType(buf);
    const outputTmp = await writeBufferToTempFile(buf);
    if (filetype.ext != 'pdf') {
        const outpath = await transparentCmd(outputTmp);
        const output = await convertBase64(outpath);
        return { output };
    } else{
        const outpath = await convertCmd(outputTmp);
        const output = await convertBase64(outpath);
        return { output };
    }
};