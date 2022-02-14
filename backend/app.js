const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());
app.use(multer({
	storage: multer.diskStorage({
		destination: (req, file, callback) => {
			callback(null, 'images');
		},
		filename: (req, file, callback) => {
			callback(null, `${uuidv4().substring(0, 10)}-${file.originalname}`);
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
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PoST,PUT,DELETE,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
})

//#region Routes

const feedRoute = require('./routes/feed');
const authRoute = require('./routes/auth');

app.use('/feed', feedRoute);
app.use('/auth', authRoute);

//#endregion

app.use((err, req, res, next) => {
    const statusCode = err.statusCode;
    const errorMessage = err.message;
	const data = err.data;

    res.status(statusCode).json({ message: errorMessage, data });
});

//#region MongoDB + Mongoose

const MONGODB_URI = `mongodb+srv://${process.env.MDB_USERNAME}:${process.env.MDB_PASSWORD}@cluster0.58bzs.mongodb.net/${process.env.MDB_DBNAME}?retryWrites=true&w=majority`;

const connectToAtlas = async () => {
    try {
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

        const server = app.listen(8080);

		require('./socket').init(server);

		/*io.on('connection', socket => {
			console.log('Client Connected.');
		});*/
    } catch (err) {
        console.log(err);
    }
}

connectToAtlas();

/*mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
	.then(() => {
		const server = app.listen(8080);

		const io = require('./socket').init(server);

		io.on('connection', socket => {
			console.log('Client Connected.');
		});
	})
	.catch(err => console.log(err));*/

//#endregion