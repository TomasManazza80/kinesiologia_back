import fs from 'fs';

const filePath = 'server/controllers/realEstateController.js';
let content = fs.readFileSync(filePath, 'utf-16le'); // maybe it's utf16? no, only the end is utf16.

// Let's read as buffer
const buffer = fs.readFileSync(filePath);
// find the index of "export const upload3dModel" which is around where the file was originally good.
const goodContent = buffer.toString('utf8');
const searchString = "export const upload3dModel = async (req, res) => {";
let index = goodContent.indexOf(searchString);

if (index !== -1) {
    // find the end of this function
    const endSearchString = "};";
    let endIndex = goodContent.indexOf(endSearchString, index);
    if (endIndex !== -1) {
        // The original file ended right after this function.
        const cleanContent = goodContent.substring(0, endIndex + endSearchString.length + 1);
        fs.writeFileSync(filePath, cleanContent, 'utf8');
        
        // Now read scratch_update.js properly and append it
        const updateContent = fs.readFileSync('scratch_update.js', 'utf8');
        fs.appendFileSync(filePath, '\n' + updateContent, 'utf8');
        console.log("File fixed successfully");
    }
}
