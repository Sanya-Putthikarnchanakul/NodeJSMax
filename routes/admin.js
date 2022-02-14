const path = require("path");

const express = require("express");

const router = express.Router();

const rootDir = require("../utils/path");

const products = [];

router.get("/add-product", (req, res, next) => {
    //res.send("<form action='/admin/add-product' method='POST'><input type='text' name='title'/><button type='submit'>Add Product</button></form>");

    //res.sendFile(path.join(rootDir, "views", "add-product.html"));

    res.render("add-product", {
        docTitle: "Add Product",
        path: "/admin/add-product",
        formCss: true,
        activeAddProduct: true
    });
});

router.post("/add-product", (req, res, next) => {
    //console.log(req.body);

    products.push({ title: req.body.title });

    res.redirect("/");
});

module.exports = {
    routes: router,
    products
}

//exports.router = router;
//exports.products = products;