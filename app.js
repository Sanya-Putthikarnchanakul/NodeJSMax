const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const errorController = require('./controllers/error');
const User = require('./models/user');
const { randomString } = require('./util/utils');

//console.log(process.env.NODE_ENV);

const MONGODB_URI =
	`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.58bzs.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
	uri: MONGODB_URI,
	collection: 'sessions'
});
const csrfProtection = csrf();

//#region Setup https Server

//const https = require('https');

//const privateKey = fs.readFileSync('server.key');
//const certificate = fs.readFileSync('server.cert');

//const privateKey = fs.readFileSync('key.pem');
//const certificate = fs.readFileSync('csr.pem');

//#endregion

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));
app.use(express.urlencoded({ extended: false }));
app.use(multer({
	storage: multer.diskStorage({
		destination: (req, file, callback) => {
			callback(null, 'images');
		},
		filename: (req, file, callback) => {
			callback(null, `${randomString()}-${file.originalname}`);
		}
	}),
	fileFilter: (req, file, callback) => {
		if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
			callback(null, true);
		} else {
			callback(null, false);
		}	
	}
}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
	session({
		secret: 'my secret',
		resave: false,
		saveUninitialized: false,
		store: store
	})
);
app.use(csrfProtection);
app.use(flash());

app.use(async (req, res, next) => {
	try {
		if (!req.session.user) return next();

		const user = await User.findById(req.session.user._id);

		if (!user) return next();
		
		req.user = user;
		next();
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		next(error);
	}
});

app.use((req, res, next) => {
	res.locals.isAuthenticated = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((err, req, res, next) => {
	res.redirect('/500');
});

const connectMongoDB = async () => {
	try {
		await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

		//Manual https
		/*https.createServer({
			key: privateKey,
			cert: certificate
		}, app).listen(process.env.PORT || 3000);*/

		app.listen(process.env.PORT || 3000);
	} catch (err) {
		console.log(err);
	}
};

connectMongoDB();
