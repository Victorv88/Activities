var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var userController = require('./userController.js');

mongoose.connect('mongodb://eventsapp:eventsapp123@ds235833.mlab.com:35833/eventsapp', {useNewUrlParser: true});

var urlencodedParser = bodyParser.urlencoded({extended: false});

//Schema
var eventSchema = new mongoose.Schema({
    title: String,
    description: String,
    num_persons: Number,
    location: String,
    token: String,
    ownerToken: String,
    ownerName: String,
    participants: Array,
    comments: Array,
    commentsOwners: Array
});

var Event = mongoose.model('Event', eventSchema);

function createToken()
{
    var token="";
    for (var ch=1; ch<=15; ch++)
    {
        var type=Math.floor(Math.random()*3);
        var rand_char;
        /// Aleg grupa de la 0 la 9
        if (type==0)
        {
            randchar=Math.floor(Math.random()*10)+48;
        }
        /// Aleg grupa de la a la b
        else if (type==1)
        {
            randchar=Math.floor(Math.random()*26)+97;
        }
        /// Aleg grupa de la A la B
        else
        {
            randchar=Math.floor(Math.random()*26)+65;
        }
        token=token.concat(String.fromCharCode(randchar));
    }
    return token;
}

module.exports = function(app) {
  app.get('/add',function(req,res){
      res.render('events');
  });

  app.post('/add',urlencodedParser, function(req,res){
      var sess = req.session;
      var loggedIn = (sess.token != null);
      console.log(loggedIn);
      if (!loggedIn) {
        var message = 'Command unavailable. You are not logged in.';
        var title = 'Error';
        res.render('messagePage.ejs', {message: message, title: title});
      }
      else {
        var sess = req.session;
        var title = req.body.title;
        var event_description = req.body.event_description;
        var number_persons = req.body.number_persons;
        var location = req.body.location;
        var token = createToken();

        var event = Event({title:title, description:event_description, num_persons:number_persons,
          location:location, token:token, ownerToken: sess.token, ownerName: sess.username});
        event.save(function(err){
          if (err) throw err;
          console.log('The event has been saved.');
          res.redirect('/');
          res.end();
        });
        userController.updateOwnedEvents(req, token);
      }
  });

  app.post("/activity",urlencodedParser,function(req,res){
      res.end("ok");
  });

  app.get('/activity/:token',function(req,res){
      var token_param=req.params.token;
      var sess = req.session;
      var loggedIn = (sess.token != null);
      Event.findOne({token:token_param},function(err, result) {
          if (err) throw err;
          res.render('selected_activity_page',{title: result.title, description: result.description, num_persons: result.num_persons,
             location: result.location, token: result.token, loggedIn:loggedIn, ownerName: result.ownerName, comments: result.comments, commentsOwners: result.commentsOwners, participants: result.participants});
      });
  });

  app.post('/add-comment/:token', urlencodedParser, function(req, res) {
    var eventToken = req.params.token;
    var loggedIn = (req.session.token != null);
    if (loggedIn) {
      Event.findOneAndUpdate({token: eventToken}, {$push: {comments: req.body.comment, commentsOwners: req.session.username}}, function(err) {
        if (err) throw err;
        console.log("Comment added.");
        res.redirect('/activity/' + eventToken);
      });
    }
    else {
      res.render('messagePage', {title: 'Error', message: 'Command unavailable. You are not logged in.'});
    }
  });

  /// Cand participi la un eveniment si numarul de locuri libere ramase ==1

  app.post('/delete/:token',urlencodedParser,function(req,res){
      var token_param=req.params.token;
      Event.remove({token:token_param},function(err){
          if (err) throw err;
          console.log("Event deleted");
          res.end("OK");
      });
  });

  /// Cand participi la un eveniment si numarul de locuri libere ramase !=1

  app.post('/update/:token', urlencodedParser, function(req,res){
      var token_param=req.params.token;
      var sess = req.session;
      Event.findOne({token: token_param}, function(err, result) {
        if (err) throw err;
        if (result.ownerToken == sess.token) {
          res.render('messagePage', {title:"Error", message: "You are the owner of the event."});
        }
        else {
          var ok = false;
          if (result.participants == undefined)
          ok = true;
          else if (!result.participants.includes(sess.token))
          ok = true;
          if (ok) {
            Event.updateOne({token: token_param}, {$push: {participants: sess.username}, $inc: {num_persons: -1}}, function(err) {
              if (err) throw err;
              console.log("Number of persons edited.");
              res.redirect('/');
            });
            userController.updateJoinedEvents(req, token_param);
          }
          else {
            res.render('messagePage', {title: "Error", message: "You have already joined this event."});
          }
        }
      });
  });

  app.get('/', function(req,res) {
      var loggedIn = (req.session.token != null);
      Event.find({},function(err,data){
          if (err) throw err;
          res.render('activities_page', {events: data, loggedIn: loggedIn});
      });
  });
  app.get('/my-activities', function(req, res) {
    var loggedIn = (req.session.token != null);
    Event.find({ownerToken: req.session.token}, function(err, data) {
      if (err) throw err;
      res.render('activities_page', {events: data, loggedIn: loggedIn});
    });
  });
  app.get('/joined-activities', function(req, res) {
    var loggedIn = (req.session.token != null);
    Event.find({participants: req.session.token}, function(err, data) {
      if (err) throw err;
      res.render('activities_page', {events:data, loggedIn: loggedIn});
    });
  });
};
