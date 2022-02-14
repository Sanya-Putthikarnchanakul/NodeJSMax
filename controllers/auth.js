const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.putSignup = async (req, res, next) => {
    try {
        //#region Server Side Validation

        const errors = validationResult(req);

		if (!errors.isEmpty()) {
            const error = new Error('Invalid Input');
            error.statusCode = 422;
            error.data = errors.array();

            throw error;
        }  

        //#endregion

        const enteredEmail = req.body.email;
        const enterdPassword = req.body.password;
        const enteredName = req.body.name;

        const hasedPassword = await bcrypt.hash(enterdPassword, 12);

        const saveUser = new User({
            email: enteredEmail,
            password: hasedPassword,
            name: enteredName
        });

        const createdUser = await saveUser.save();

        res.status(201).json({
            message: 'User Created.',
            userId: createdUser._id
        });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};

exports.postLogin = async (req, res, next) => {
    try {
        const enteredEmail = req.body.email;
        const enterdPassword = req.body.password;

        const queryUser = await User.findOne({ email: enteredEmail });

        if (!queryUser) {
            let err = new Error(`No such ${enteredEmail} Email.`);
            err.statusCode = 401;
            throw err;
        }

        const isPasswordEqual = await bcrypt.compare(enterdPassword, queryUser.password);

        if (!isPasswordEqual) {
            let err = new Error(`Not Found User`);
            err.statusCode = 401;
            throw err;
        }

        const token = jwt.sign(
            { email: queryUser.email, userId: queryUser._id.toString() },
            '8aa89d60-ec95-11eb-9a03-0242ac130003',
            { expiresIn: '1h' }
        );

        res.status(200).json({ token, userId: queryUser._id.toString() });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};