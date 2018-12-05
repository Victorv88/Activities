var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var app = express();

mongoose.connect('mongodb://eventsapp:eventsapp123@ds235833.mlab.com:35833/eventsapp');

app.set('view engine','ejs');
app.use('/styles', express.static('styles'));

var urlencodedParser = bodyParser.urlencoded({extended: false});

//Schema
var eventSchema = new mongoose.Schema({
    title: String,
    description: String,
    num_persons: Number,
    location: String
});

var Event = mongoose.model('Event', eventSchema);


app.get('/add',function(req,res){
    res.render('events');
});

app.post('/add',urlencodedParser, function(req,res){
    console.log(req.body);
    var title = req.body.title;
    var event_description = req.body.event_description;
    var number_persons = req.body.number_persons;
    var location = req.body.location;
    
    var event = Event({title:title, description:event_description, num_persons:number_persons, location:location});
    event.save(function(err){
        if (err) throw err;
        console.log("event added");
    });
    res.redirect('/');
    
});

app.get('/', function(req,res){
    Event.find({},function(err,data){
        if (err) throw err;
        res.render('activities_page',{events: data});
    });
});

app.listen(3000);
