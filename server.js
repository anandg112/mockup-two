"use strict";

require('dotenv').config();

const amazon = require('amazon-product-api');
const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();
const session     = require('cookie-session');

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");
// const login = require("./routes/login");
const search = require("./routes/search");
const votes = require("./routes/votes");



// const search = require('./routes/search');

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

app.use(session({
    name: 'session',
    keys: ['key0'],

    // options
    maxAge: 60 * 60 * 60 * 1000 // 3 days
  }));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Mount all resource routes
app.use("/users", usersRoutes(knex));
// app.use('/login', login(knex));
app.use('/search', search(knex));
// path for grabbing votes data
app.use('/votes', votes(knex));
// Home page
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect('/search');
  } else {
    let templateVars = {current_user: null};
    res.render("index", templateVars);
  }
});


app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
