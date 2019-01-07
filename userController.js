var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');

var parser = bodyParser.urlencoded({extended: false});

mongoose.connect('mongodb://eventsapp:eventsapp123@ds235833.mlab.com:35833/eventsapp', {useNewUrlParser: true})

var dataSchema = new mongoose.Schema({
  username: String,
  password: String,
  token: String,
  ownedActivities: Array,
  joinedActivities: Array
});

var Data = mongoose.model("UsersData", dataSchema);

module.exports.main = function(app) {
  var sess;
  app.get('/register', parser, function(req, res){
    sess = req.session;
    if (sess.token) {
      res.redirect('/');
    }
    else {
      res.render('register');
    }
  });
  app.post('/register', parser, function(req, res) {
    /// Search for user's data to check if they are already registered or the username is taken
    Data.findOne({username: req.body.username}).then(function(result) {
      /// If they are not already registered, save his account data, otherwise tell the user the name is already taken/the account is already registered
      if (result === null) {
        /// Generate a unique token used for the sesssion
        var newToken = uuidv4();
        var message = 'You have registered successfully!';
        var title = 'Succes';
        console.log(newToken);
        var newUserData = Data({username: req.body.username, password: req.body.password, token: newToken}).save(function(err, data) {
          if (err) throw err;
        });
        res.render('messagePage', {message: message, title: title});
      }
      else {
        if (result.password === req.body.password) {
          var message = 'You are already registered!';
          var title = 'Already registered';
          res.render('messagePage', {message: message, title: title});
        }
        else {
          var message = 'The username is already taken!';
          var title = 'Username taken';
          res.render('messagePage', {message: message, title: title});
        }
      }
    });
  });
  app.get('/login', parser, function(req, res) {
    sess = req.session;
    if (sess.token) {
      res.redirect('/');
    }
    else {
      res.render('login');
    }
  });
  app.post('/login', parser, function(req, res) {
    ///Search for user's data in the database
    sess = req.session;
    Data.findOne({username: req.body.username, password: req.body.password}).then(function(result) {
      ///If the data is found, log the user in, otherwise prompt them to the invalid log in credentials screen
      if (result === null) {
        var message = 'Incorrect username or password.';
        var title = 'Log in failed';
        console.log('Not found.');
        res.render('messagePage', {message: message, title: title});
      }
      else {
        sess.token = result.token;
        sess.username = result.username;
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
  var sess = req.session;
  /**Data.findOne({token: sess.token}).then(function(result) {
    var newActivities = [];
    newActivities = result.ownedActivities;
    newActivities.push(eventToken);
    Data.updateOne({token: sess.token}, {$set: {ownedActivities: newActivities}})
    .exec()
    .then(function(result) {
      console.log("List of owned events updated.");
    })
    .catch(function(err) {
      throw(err);
    });
  });*/
  Data.findOneAndUpdate({token: sess.token}, {$push: {ownedActivities: eventToken}}, function(err, result){
    if (err) throw err;
    console.log('List of joined events updated.');
  });
};

module.exports.updateJoinedEvents = function(req, eventToken) {
  var sess = req.session;
  /**Data.findOne({token: sess.token}).then(function(result) {
    var newActivites = [];
    newActivities = result.joinedActivities;
    newActivities.push(eventToken);
    Data.updateOne({token: sess.token}, {$set: {joinedActivities: newActivities}})
    .exec()
    .then(function(result) {
      console.log('List of joined events updated.');
    })
    .catch(function(error) {
      throw(err);
    });
  });*/
  Data.findOneAndUpdate({token: sess.token}, {$push: {joinedActivities: eventToken}}, function(err, result){
    if (err) throw err;
    console.log('List of joined events updated.');
  });
};
