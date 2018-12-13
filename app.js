var express = require('express');
var userController = require('./userController.js');
var eventsController = require('./eventsController.js');
var session = require('express-session');
var app = express();

var minute = 60000;

app.set('view engine', 'ejs');

app.use('/styles', express.static('styles'));

app.use(session({secret: "random", cookie:{maxAge: 60 * minute}}));

userController.main(app);

eventsController(app);

app.listen(3000);
