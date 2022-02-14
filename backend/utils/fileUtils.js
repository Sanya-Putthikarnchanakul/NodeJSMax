const fs = require('fs');
const path = require('path');

exports.deleteImageFromServer = (filePathFromDb) => {
    try {
        const deletedFilePath = path.join(__dirname, '..', filePathFromDb);

        fs.unlink(deletedFilePath, (err) => {
            if (err) {
                console.log(err);
                throw err;
            }
        });
    } catch (err) {
        throw err;
    }
};