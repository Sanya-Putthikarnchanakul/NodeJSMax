const express = require('express');
const { check, body } = require("express-validator");
const bcrypt = require("bcryptjs");

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please Enter a Valid Email.')         
            .custom(async (value, { req }) => {
                const checkUser = await User.findOne({ email: value });

                if (!checkUser) throw new Error('Invalid E-mail.');      

                req.user = checkUser;

                return true;
            })
            .normalizeEmail(),
        body('password', 'Please enter only number, character and minimum 5 characters.')
            .isLength({ min: 5 })
            .isAlphanumeric()         
            .custom(async (value, { req }) => {
                const isPasswordMatch = await bcrypt.compare(req.body.password, req.user.password);

                if (!isPasswordMatch) throw new Error('Invalid Password.');

                return true;
            })   
            .trim()       
    ],
    authController.postLogin
);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please Enter a Valid Email.')
            .custom(async (value, { req }) => {
                /*if (value === 'test@test.com') throw new Error('This Email is Forbidden.');
                return true;*/

                const checkUser = await User.findOne({ email: value });

                if (checkUser) throw new Error('Already have this E-mail.');

                return true;
            })
            .normalizeEmail(),
        body('password', 'Please enter only number, character and minimum 5 characters.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) throw new Error('Password not Match.');

                return true;
            })
            .trim()
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset-password', authController.getResetPassword);

router.post('/reset-password', authController.postResetPassword);

router.get('/reset-password/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;