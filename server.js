'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const dns = require('dns')
const lookup = dns.lookup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }); 
const Schema = mongoose.Schema
const createHash = require('create-hash')
const createIdentifier = createHash


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.use(express.urlencoded())

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const URLSetSchema = new Schema({
  original_url: {type:String,required:true},
  short_url: String
})

const URLSet = mongoose.model("URLSet", URLSetSchema)


// used to lookup original non-short url in MongoDB
const generateIdentifier = () => {
  const random_string = Math.random().toString(32).substring(2, 5) + Math.random().toString(32).substring(2, 5);    
  return random_string
}

// make and save new short URL to database
const createNewURLSet = function(originalURL,res) {
    const newURLSet = new URLSet({
      original_url : originalURL,
      short_url: generateIdentifier()
    })
    newURLSet.save((err,data)=>{
      if (err) console.log('Error while saving new URL set',err)
      res.json(data)
    })
}

// search Mongo using identifier from url parameter
const findOneAndRedirect = function(identifier, res){
  URLSet.findOne({short_url: identifier},(err,data)=>{
    if(err) return err
    res.redirect(data.original_url)
  })
}

// use dns.lookup to see if entered URL is real and valid
// this function designed to all own done function for success case
const isValidURL = (url,done,res)=> {
  const REPLACE_REGEX = /^https?:\/\//i
  lookup(url.replace(REPLACE_REGEX, ''), (err,address,family) => {
      if (err) {
        res.json({error: 'Invalid URL'})
      } else {
        console.log('User URL is Valid')
        done(url, res)
      }
    })
}


// takes ubmission from from (cannot specify short url at this time)
app.post("/api/shorturl/new/", (req, res) => { 
  const originalURL = req.body.url
  isValidURL(originalURL, createNewURLSet, res)
});

// takes a users previously received short URI e.g. 'Xjdkfl'
app.get("/api/shorturl/:destination", (req,res) => {
  const dest = req.params.destination
  findOneAndRedirect(dest, res)
})




// -------

app.listen(port, function () {
  console.log('Node.js listening ...');
});