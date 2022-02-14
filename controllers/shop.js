const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

const Product = require('../models/product');
const Order = require('../models/order');
const { deleteFile } = require('../util/utils');

const ITEM_PER_PAGE = 2;

exports.getProducts = async (req, res, next) => {
	let page;

	try {
		if (req.query.page) page = Number(req.query.page);
		else page = 1;

		const t1 = Product.find().skip((page - 1) * ITEM_PER_PAGE).limit(ITEM_PER_PAGE);
		const t2 = Product.find().countDocuments();

		const [products, count] = await Promise.all([t1, t2]);

		res.render('shop/product-list', {
			prods: products,
			pageTitle: 'All Products',
			path: '/products',
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

exports.getProduct = (req, res, next) => {
	const prodId = req.params.productId;
	Product.findById(prodId)
		.then(product => {
			res.render('shop/product-detail', {
				product: product,
				pageTitle: product.title,
				path: '/products'
			});
		})
		.catch(err => {
			let error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getIndex = async (req, res, next) => {
	let page;

	try {
		if (req.query.page) page = Number(req.query.page);
		else page = 1;

		const t1 = Product.find().skip((page - 1) * ITEM_PER_PAGE).limit(ITEM_PER_PAGE);
		const t2 = Product.find().countDocuments();

		const [products, count] = await Promise.all([t1, t2]);

		res.render('shop/index', {
			prods: products,
			pageTitle: 'Shop',
			path: '/',
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

exports.getCart = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then(user => {
			const products = user.cart.items;
			res.render('shop/cart', {
				path: '/cart',
				pageTitle: 'Your Cart',
				products: products
			});
		})
		.catch(err => {
			let error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postCart = (req, res, next) => {
	const prodId = req.body.productId;
	Product.findById(prodId)
		.then(product => {
			return req.user.addToCart(product);
		})
		.then(result => {
			res.redirect('/cart');
		})
		.catch(err => {
			let error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postCartDeleteProduct = (req, res, next) => {
	const prodId = req.body.productId;
	req.user
		.removeFromCart(prodId)
		.then(result => {
			res.redirect('/cart');
		})
		.catch(err => {
			let error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getCheckout = async (req, res, next) => {
	try {
		const user = await req.user.populate('cart.items.productId').execPopulate();

		const products = user.cart.items;

		let totalPrice = 0;
		products.forEach(p => {
			totalPrice += p.quantity * p.productId.price;
		});

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: products.map(p => {
				return {
					name: p.productId.title,
					description: p.productId.description,
					amount: p.productId.price * 100,
					currency: 'usd',
					quantity: p.quantity
				};
			}),
			success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
			cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`
		});

		res.render('shop/checkout', {
			path: '/checkout',
			pageTitle: 'Checkout',
			products,
			totalPrice,
			sessionId: session.id			
		});
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
}

exports.getCheckoutSuccess = (req, res, next) => {
	req.user
		.populate('cart.items.productId')
		.execPopulate()
		.then(user => {
			const products = user.cart.items.map(i => {
				return { quantity: i.quantity, product: { ...i.productId._doc } };
			});
			const order = new Order({
				user: {
					email: req.user.email,
					userId: req.user._id
				},
				products: products
			});
			return order.save();
		})
		.then(result => {
			return req.user.clearCart();
		})
		.then(() => {
			res.redirect('/orders');
		})
		.catch(err => {
			let error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getOrders = (req, res, next) => {
	Order.find({ 'user.userId': req.user._id })
		.then(orders => {
			res.render('shop/orders', {
				path: '/orders',
				pageTitle: 'Your Orders',
				orders: orders
			});
		})
		.catch(err => {
			let error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.getInvoice = async (req, res, next) => {
	let invoicePath;

	try {
		const orderId = req.params.orderId;

		const order = await Order.findById(orderId);

		if (!order) throw new Error('No Order Found.');

		if (order.user.userId.toString() !== req.user._id.toString()) throw new Error('Unauthorized.');

		//#region Read PDF

		//const invoiceFileName = `inv-${orderId}.pdf`;

		//const invoicePath = path.join('data', 'invoices', invoiceFileName);

		/*fs.readFile(invoicePath, (err, data) => {
			if (err) return next(err);

			res.setHeader('Content-Type', 'application/pdf');
			//res.setHeader('Content-Disposition', `attachment; filename=${invoiceFileName}`);
			res.setHeader('Content-Disposition', `inline; filename=${invoiceFileName}`);
			res.send(data);
		});*/

		/*res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `inline; filename=${invoiceFileName}`);

		const file = fs.createReadStream(invoicePath);
		file.pipe(res);*/

		//#endregion

		//#region Gen PDF on the Fly

		const invoiceFileName = `inv-${orderId}.pdf`;
		invoicePath = path.join('data', 'invoices', invoiceFileName);

		const pdfDoc = new PDFDocument();

		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `inline; filename=${invoiceFileName}`);

		let stream = fs.createWriteStream(invoicePath);
		pdfDoc.pipe(stream);
		pdfDoc.pipe(res);

		pdfDoc.fontSize(26).text('Invoice', {
			underline: true
		});
		pdfDoc.fontSize(13).text('--------------------');
		let total = 0;
		order.products.forEach(p => {
			total += p.quantity * p.product.price;
			pdfDoc.text(`${p.product.title} - ${p.quantity} X ${p.product.price} = $ ${p.quantity * p.product.price}`);
		});		
		pdfDoc.text('--------------------');
		pdfDoc.text(`Total Price : $ ${total}`);

		pdfDoc.end();

		stream.on('finish', () => {
			deleteFile(invoicePath);
		});

		//#endregion
	} catch (err) {
		let error = new Error(err);
		error.httpStatusCode = 500;
		return next(error);
	}
}
