const { validationResult } = require("express-validator");

const Product = require('../models/product');
const { deleteFile } = require('../util/utils');

const ITEM_PER_PAGE = 1;

exports.getAddProduct = (req, res, next) => {
	res.render('admin/edit-product', {
		pageTitle: 'Add Product',
		path: '/admin/add-product',
		editing: false,
		hasError: false,
		errMessage: null,
		validationErrors: []
	});
};

exports.postAddProduct = async (req, res, next) => {
	try {
		const title = req.body.title;
		const image = req.file;
		const price = req.body.price;
		const description = req.body.description;

		//#region Validation

		if (!image) return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			hasError: true,
			product: {
				title,
				image,
				price,
				description
			},
			errMessage: 'Attach file is not an image.',
			validationErrors: []
		});

		const errors = validationResult(req);

		if (!errors.isEmpty()) return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			hasError: true,
			product: {
				title,
				price,
				description
			},
			errMessage: errors.array()[0].msg,
			validationErrors: errors.array()
		});

		//#endregion

		const imageUrl = image.path;

		const product = new Product({
			title: title,
			price: price,
			description: description,
			imageUrl: imageUrl,
			userId: req.user
		});

		await product.save();

		res.redirect('/admin/products');
	} catch (err) {
		console.log(err);

		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.getEditProduct = (req, res, next) => {
	const editMode = req.query.edit;
	if (!editMode) {
		return res.redirect('/');
	}
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then(product => {
			if (!product) {
				return res.redirect('/');
			}
			res.render('admin/edit-product', {
				pageTitle: 'Edit Product',
				path: '/admin/edit-product',
				editing: editMode,
				product: product,
				hasError: false,
				errMessage: null,
				validationErrors: []
			});
		})
		.catch(err => {
			let error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postEditProduct = async (req, res, next) => {
	try {
		const prodId = req.body.productId;
		const updatedTitle = req.body.title;
		const updatedPrice = req.body.price;
		const updatedImage = req.file;
		const updatedDesc = req.body.description;

		//#region Validation

		const errors = validationResult(req);

		if (!errors.isEmpty()) return res.status(422).render('admin/edit-product', {
			pageTitle: 'Edit Product',
			path: '/admin/edit-product',
			editing: true,
			hasError: true,
			product: {
				title: updatedTitle,
				price: updatedPrice,
				description: updatedDesc,
				_id: prodId
			},
			errMessage: errors.array()[0].msg,
			validationErrors: errors.array()
		});;

		//#endregion

		const product = await Product.findOne({
			_id: prodId,
			userId: req.user._id
		});

		if (!product) return res.redirect("/");

		product.title = updatedTitle;
		product.price = updatedPrice;
		product.description = updatedDesc;
		if (updatedImage) {
			deleteFile(product.imageUrl);
			product.imageUrl = updatedImage.path;
		}
		

		await product.save();

		res.redirect('/admin/products');
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.getProducts = async (req, res, next) => {
	let page;

	try {
		if (req.query.page) page = Number(req.query.page);
		else page = 1;

		const t1 = Product.find({ userId: req.user._id }).skip((page - 1) * ITEM_PER_PAGE).limit(ITEM_PER_PAGE);
		const t2 = Product.find({ userId: req.user._id }).countDocuments();

		const [products, count] = await Promise.all([t1, t2]);

		res.render('admin/products', {
			prods: products,
			pageTitle: 'Admin Products',
			path: '/admin/products',
			currentPage: page,
			hasNextPage: ITEM_PER_PAGE * page < count,
			hasPreviousPage: page > 1,
			nextPage: page + 1,
			previousPage: page - 1,
			lastPage: Math.ceil(count / ITEM_PER_PAGE) 
		});
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.postDeleteProduct = async (req, res, next) => {
	try {
		const prodId = req.body.productId;

		const product = await Product.findById(prodId);

		if (!product) throw new Error('Product not Found.');

		deleteFile(product.imageUrl);

		await Product.deleteOne({
			_id: prodId,
			userId: req.user._id
		});

		res.redirect('/admin/products');
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
};

exports.deleteProduct = async (req, res, next) => {
	try {
		const prodId = req.params.productId;

		const product = await Product.findById(prodId);

		if (!product) throw new Error('Product not Found.');

		deleteFile(product.imageUrl);

		await Product.deleteOne({
			_id: prodId,
			userId: req.user._id
		});

		res.status(200).json({ isSuccess: true, message: null });
	} catch (err) {
		res.status(500).json({ isSuccess: false, message: err.message });
	}
};
