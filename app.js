const path = require("path");

//#region 3rd Party Package

const express = require("express");
const bodyParser = require("body-parser");
//const expressHbs = require("express-handlebars");

//#endregion

//#region Routes

const adminRoute = require("./routes/admin");
const shopRoute = require("./routes/shop");

//#endregion

const app = express();

//#region Ejs View Engine

app.set("view engine", "ejs");
app.set("views", "views");

//#endregion

//#region HandleBar View Engine

/*app.engine("hbs", expressHbs({
    defaultLayout: "main-layout",
    layoutsDir: "views/layouts/",
    extname: 'hbs'
}));
app.set("view engine", "hbs");
app.set("views", "views");*/

//#endregion

//#region Pug View Engine

//app.set("view engine", "pug");
//app.set("views", "views");

//#endregion

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

//#region Routes

/*app.use("/product", (req, res, next) => {
    console.log(req.body);
    res.redirect("/");
});*/

app.use("/admin", adminRoute.routes);
app.use(shopRoute);

app.use((req, res) => {
    //res.status(404).send("<h1>Page not Found.</h1>");

    //res.status(404).sendFile(path.join(__dirname, "views", "404-not-found.html"));

    res.status(404).render("404", {
        docTitle: "404",
        path: ""
    });
});

//#endregion

app.listen(3000);

//#region Try Code

/*
app.use((req, res, next) => {
    console.log("In Middleware.");
    next();
});

app.use((req, res, next) => {
    console.log("In Another Middleware.");
    res.send("<h1>Hello from Express.</h1>");
});
*/

/*app.use("/", (req, res, next) => {
    console.log("This Code Always Run.");

    next();
});*/

/*app.use("/add-product", (req, res, next) => {
    res.send("<h1>Add Product Page</h1>");
});*/

//#endregion
