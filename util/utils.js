const fs = require('fs');

exports.randomString = () => {
    chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    var result = '';
    for (var i = 10; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

exports.deleteFile = (filePath) => {
    try {
        fs.unlink(filePath, (err) => { 
            if (err) throw new Error('Can not delete file.');
        });
    } catch (err) {
        throw err;
    }
}