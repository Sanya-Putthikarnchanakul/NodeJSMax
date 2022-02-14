const path = require("path");

const express = require("express");

const router = express.Router();

const rootDir = require("../utils/path");

const { products } = require("./admin");

router.get("/", (req, res, next) => {
    //res.send("<h1>Hello from Express.</h1>");

    /*console.log(products);

    res.sendFile(path.join(rootDir, "views", "shop.html"));*/

    res.render("shop", { 
        products, 
        docTitle: "Shop", 
        path: "/", 
        hasProducts: products.length > 0,
        activeShop: true,
        productCss: true 
    });
});

module.exports = router;