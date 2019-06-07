const createError =require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require("express-session");

var indexRouter = require('./routes/index');

var app = express();

mongoose.connect('mongodb://localhost/viand',{ useNewUrlParser: true });
var db = mongoose.connection;
//handle mongodb error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log("Connected to DataBase...");
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'key',
  resave: false,
  saveUninitialized: false,
  cookie:{maxAge:600000}
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.set('port', process.env.PORT || 3001);
app.listen(app.get('port'), function(){
  console.log('Server started on port : ' + app.get('port'));

});
module.exports = app;
