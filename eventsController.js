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
    ownerToken: String
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

      if (!sess.token) {
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
          location:location, token:token, ownerToken: sess.token});
        event.save(function(err){
          if (err) throw err;
          console.log('The event has been saved.');
        });
        userController.updateOwnedEvents(req, token);
        res.redirect('/');
        res.end();
      }
  });

  app.post("/activity",urlencodedParser,function(req,res){
      res.end("ok");
  });

  app.get('/activity/:token',function(req,res){
      var token_param=req.params.token;
      Event.find({token:token_param},function(err,data){
          if (err) throw err;
          res.render('selected_activity_page',{title: data[0].title, description: data[0].description, num_persons: data[0].num_persons,
             location: data[0].location, token: "/activity/"+data[0].token});
          res.end();
      });
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
      Event.findOneAndUpdate({token:token_param},{$set:{num_persons:req.body.updated_value}},function(err,doc){
          if (err) throw err;
          console.log("Number of persons edited");
          res.end("OK");
      });
      userController.updateJoinedEvents(req, token_param);
  });

  app.get('/', function(req,res) {
      var sess = req.session;
      var loggedIn = (sess.token != null);
      Event.find({},function(err,data){
          if (err) throw err;
          res.render('activities_page', {events: data, loggedin: loggedIn});
          res.end();
      });
  });
  app.get('/profile', function(req, res) {
    var sess = req.session;
    Event.find({ownerToken: sess.token}, function(err, data) {
      if (err) throw err;
      res.render('profile', {events: data, name: sess.username});
    });
  });
};
