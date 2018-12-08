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
    location: String,
    token: String
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

app.get('/add',function(req,res){
    
    res.render('events');
});

app.post('/add',urlencodedParser, function(req,res){
    console.log(req.body);
    var title = req.body.title;
    var event_description = req.body.event_description;
    var number_persons = req.body.number_persons;
    var location = req.body.location;
    var token=createToken();
    
    var event = Event({title:title, description:event_description, num_persons:number_persons, location:location, token:token});
    event.save(function(err){
        if (err) throw err;
        console.log("event added");
    });
    res.redirect('/');
    
});

app.post("/activity",urlencodedParser,function(req,res){
    var url_redirect="/activity/"+req.params.token;
    console.log ("a intrat pe post");
    res.redirect('/activity/o');
});

app.get('/activity/o',function(req,res){
    res.writeHead(200);
    res.end("hello world\n");
    console.log("MARIAN");
    res.redirect("/abccc");
});

app.get("/abccc",function(req,res){
    res.writeHead(200);
    res.end("hello world\n");
});

app.get('/', function(req,res){
    Event.find({},function(err,data){
        if (err) throw err;
        res.render('activities_page',{events: data});
    });
});

app.listen(3000);
