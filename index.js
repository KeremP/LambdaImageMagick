const  { downloadImage, convert, checkType } = require('./utils');

// checks file type and converts from .ai or .eps to .png
// using imagemagick. the returned buffer will be rendered on fabric.js canvas
exports.handler = async (event) => {
    const buf = await downloadImage(event.url);
    const fileType = await checkType(buf);
    if (fileType.ext == '.ai' || fileType.ext == '.eps') {
        const converted = await convert(buf);
        var base64 = convert.toString('base64');
        return { base64 };
    }
};