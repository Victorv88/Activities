var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var validator = require('validator');
const uuidv4 = require('uuid/v4');

var parser = bodyParser.urlencoded({extended: false});

mongoose.connect('mongodb://eventsapp:eventsapp123@ds235833.mlab.com:35833/eventsapp', {useNewUrlParser: true})

var dataSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  token: String,
  ownedActivities: Array,
  joinedActivities: Array
});

var Data = mongoose.model("UsersData", dataSchema);

module.exports.main = function(app) {
  app.get('/register', parser, function(req, res){
    if (req.session.token) {
      res.redirect('/');
    }
    else {
      res.render('register', {errors: null, isSuccess: false});
    }
  });
  app.post('/register', parser, function(req, res) {
    var errors = [];
    if (!validator.isLength(req.body.username, {min: 4})) {
      errors.push('The username must be at least 4 characters long.');
    }
    if (!validator.isEmail(req.body.email)) {
      errors.push('The email is invalid.');
    }
    if (!validator.isLength(req.body.password, {min: 6})) {
      errors.push('The password must be at least 6 characters long.');
    }
    if (req.body.password !== req.body.confirmPassword) {
      errors.push('The passwords do not match.');
    }
    if (errors.length > 0) {
      req.session.errors = errors;
      res.render('register', {errors: errors, isSuccess: false});
    }
    else {
      /// Search for user's data to check if they are already registered or the username is taken
      Data.findOne({$or: [{username: req.body.username}, {email: req.body.email}]}).then(function(result) {
        /// If they are not already registered, save his account data, otherwise tell the user the name is already taken/the account is already registered
        if (result === null) {
          /// Generate a unique token used for the sesssion
          var newToken = uuidv4();
          errors.push('You have registered successfully!');
          console.log(newToken);
          var newUserData = Data({username: req.body.username, password: req.body.password, email: req.body.email, token: newToken}).save(function(err, data) {
            if (err) throw err;
          });
          res.render('register', {errors: errors, isSuccess: true});
        }
        else {
          if (result.password === req.body.password && result.email === req.body.email && result.username === req.body.username) {
            errors.push('You are already registered!');
            res.render('register', {errors: errors, isSuccess: false});
          }
          else {
            if (result.email === req.body.email) {
              errors.push('The email is already in use.');
            }
            if (result.username === req.body.username) {
              errors.push('The username is already taken.');
            }
            res.render('register', {errors: errors, isSuccess: false});
          }
        }
      });
    }
  });
  app.get('/login', parser, function(req, res) {
    if (req.session.token) {
      res.redirect('/');
    }
    else {
      res.render('login', {error: null});
    }
  });
  app.post('/login', parser, function(req, res) {
    ///Search for user's data in the database
    Data.findOne({username: req.body.username, password: req.body.password}).then(function(result) {
      ///If the data is found, log the user in, otherwise prompt them to the invalid log in credentials screen
      if (result === null) {
        res.render('login', {error: 'Incorect username or password.'});
      }
      else {
        req.session.token = result.token;
        req.session.username = result.username;
        console.log('Found.');
        res.redirect('/');
      }
    });
  });
  app.get('/logout', parser, function(req, res) {
    req.session.destroy(function(err) {
      if(err) {
        throw err;
      }
      else {
        res.redirect('/login');
      }
    });
  });
};

module.exports.updateOwnedEvents = function(req, eventToken) {
  Data.findOneAndUpdate({token: req.session.token}, {$push: {ownedActivities: eventToken}}, function(err, result){
    if (err) throw err;
    console.log('List of joined events updated.');
  });
};

module.exports.updateJoinedEvents = function(req, eventToken) {
  Data.findOneAndUpdate({token: req.session.token}, {$push: {joinedActivities: eventToken}}, function(err, result){
    if (err) throw err;
    console.log('List of joined events updated.');
  });
};
