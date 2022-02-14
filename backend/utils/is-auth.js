const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    let error;
    try {
        let authHeader = req.get('Authorization');
        if (!authHeader) {
            error = new Error('No Auth Header.');
            error.statusCode = 401;
            throw error;
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = jwt.verify(token, '8aa89d60-ec95-11eb-9a03-0242ac130003');
        if (!decodedToken) {
            error = new Error('Not Found Token.');
            error.statusCode = 401;
            throw error;
        }

        req.userId = decodedToken.userId;
        next();
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}