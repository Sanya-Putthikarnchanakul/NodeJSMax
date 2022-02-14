const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");

const  transport = nodemailer.createTransport(sendgridTransport({
	auth: {
		api_key: process.env.SENDGGRID_API_KEY
	}
}));

const User = require('../models/user');

exports.getLogin = (req, res, next) => {
	let message;

	try {
		let messages = req.flash("error");
		
		if (messages.length > 0) message = messages[0];
		else message = null;

		res.render('auth/login', {
			path: '/login',
			pageTitle: 'Login',
			errMessage: message,
			oldInput: null,
			validationErrors: []
		});
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}	
};

exports.getSignup = (req, res, next) => {
	let message;

	try {
		let messages = req.flash("error");
		
		if (messages.length > 0) message = messages[0];
		else message = null;

		res.render('auth/signup', {
			path: '/signup',
			pageTitle: 'Signup',
			errMessage: message,
			oldInput: null,
			validationErrors: []
		});
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.postLogin = async (req, res, next) => {
	try {
		/*const email = req.body.email;

		const checkUser = await User.findOne({ email: email });

		if (!checkUser) {
			req.flash("error", "Invalid E-mail.");
			return res.redirect("/login");
		}

		const isPasswordMatch = await bcrypt.compare(password, checkUser.password);

		if (!isPasswordMatch) {
			req.flash("error", "Invalid Password.");
			return res.redirect("/login");
		}*/

		//#region Validation

		const errors = validationResult(req);

		if (!errors.isEmpty()) return res.status(422).render('auth/login', {
			path: '/login',
			pageTitle: 'Login',
			errMessage: errors.array()[0].msg,
			oldInput: {
				email: req.body.email,
				password: req.body.password
			},
			validationErrors: errors.array()
		});

		//#endregion

		req.session.isLoggedIn = true;
		req.session.user = req.user;
		req.session.save(err => {
			if (err) console.log(err);
			res.redirect('/');
		});
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.postSignup = async (req, res, next) => {
	try {
		const email = req.body.email;
		const password = req.body.password;

		//#region Validation

		const errors = validationResult(req);

		if (!errors.isEmpty()) return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Signup',
			errMessage: errors.array()[0].msg,
			oldInput: {
				email,
				password,
				confirmPassword: req.body.confirmPassword
			},
			validationErrors: errors.array()
		});

		//#endregion

		/*const checkUser = await User.findOne({ email: email });

		if (checkUser) {
			req.flash("error", "Already have this E-mail.");
			return res.redirect("/signup");
		}*/

		const hashPassword = await bcrypt.hash(password, 12);

		const newUser = new User({
			email: email,
			password: hashPassword,
			cart: { items: [] }
		});

		await newUser.save();

		res.redirect("/login");

		transport.sendMail({
			to: email,
			from: "mozilrmadrid@gmail.com",
			subject: "Sign Up Succeed",
			html: "<h1>Successfully Sign Up for " + email + "</h1>"
		});		
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.postLogout = (req, res, next) => {
	req.session.destroy(err => {		
		if (err){
			let error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		}

		res.redirect('/');
	});
};

exports.getResetPassword = (req, res, next) => {
	let message;

	try {
		let messages = req.flash("error");
		
		if (messages.length > 0) message = messages[0];
		else message = null;

		res.render('auth/reset-password', {
			path: '/reset-password',
			pageTitle: 'Reset Password',
			errMessage: message
		});
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.postResetPassword = (req, res, next) => {
	try {
		crypto.randomBytes(32, async (err, buffer) => {
			if (err) {
				console.log(err);
				return res.redirect("/reset-password");
			}

			const token = buffer.toString("hex");

			const queryUser = await User.findOne({ email: req.body.email });

			if (!queryUser) {
				req.flash("error", "Invalid E-mail.");
				return res.redirect("/reset-password");
			}

			queryUser.resetToken = token;
			queryUser.resetTokenExpire = Date.now() + 3600000;

			await queryUser.save();

			res.redirect("/");

			transport.sendMail({
				to: req.body.email,
				from: "mozilrmadrid@gmail.com",
				subject: "Reset Password",
				html: `
					<h3>You Requested to Reset Password</h3>
					<p>Click this <a href="http://localhost:3000/reset-password/${token}">Link</a> to Reset Password</p>
				`
			});	
		});
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.getNewPassword = async (req, res, next) => {
	let message;

	try {
		const token = req.params.token;

		const queryUser = await User.findOne({ resetToken: token, resetTokenExpire: { $gt: Date.now() } });	
		
		if (!queryUser) {
			req.flash("error", "Token not found.");
			return res.redirect("/reset-password");
		}

		let messages = req.flash("error");
		
		if (messages.length > 0) message = messages[0];
		else message = null;

		res.render('auth/new-password', {
			path: '/new-password',
			pageTitle: 'New Password',
			errMessage: message,
			userId: queryUser._id,
			token
		});
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.postNewPassword = async (req, res, next) => {
	let message;

	try {
		const userId = req.body.userId;
		const token = req.body.token;
		const newPassword = req.body.password;

		const queryUser = await User.findOne({
			resetToken: token,
			resetTokenExpire: { $gt: Date.now() },
			_id: userId
		});		

		if (!queryUser) {
			req.flash("error", "User not found.");
			return res.redirect("/reset-password");
		}

		const hashPassword = await bcrypt.hash(newPassword, 12);

		queryUser.password = hashPassword;
		queryUser.resetToken = undefined;
		queryUser.resetTokenExpire = undefined;

		await queryUser.save();

		res.redirect("/login");
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};