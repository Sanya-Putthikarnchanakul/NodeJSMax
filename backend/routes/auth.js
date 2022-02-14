const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');

const router = express.Router();

const {
    putSignup,
    postLogin
} = require('../controllers/auth');

router.put('/signup', [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Invalid Email Format.')
        .custom(async (value, { req }) => {
            const checkUser = await User.findOne({ email: value });

            if (checkUser) throw new Error(`User with ${value} E-mail is Exist.`);      

            return true;
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .not()
        .isEmpty()
        .isLength({ min: 5 }),
    body('name')
        .trim()
        .not()
        .isEmpty()
], putSignup);

router.post('/login', postLogin);

module.exports = router;