//TODO : Implement deletion 
//Initialize dependencies
var http = require('http');
var url = require('url');
var sys = require('util');
var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');


var index;
var app = express(); // the main express object
mongoose.connect('mongodb://localhost/test'); // initialize the databse
var db = mongoose.connection;


/*
Model for each user info in the database: 
  username : a string containing the name
  passwd : a string containing the password
  features : a CSV format string array containing the features
*/

var userSchema = new mongoose.Schema ({  
 	username : String,
	passwd : String,
	features : [String]});

var userModel = mongoose.model('userModel',userSchema);
var MemoryStore = express.session.MemoryStore; 
var sessionStore = new MemoryStore(); // For storing session variables

app.configure(function(){
	app.use(express.static(__dirname+'/public'));
	app.use(express.bodyParser());
	app.set('view engine','jade');
	app.set('views',__dirname+'/public')
}); // Express settings for views and statics files

app.get("/",function(request,response){ // The index page controller
	console.log(sessionStore);
	if ( sessionStore.loggedIn == true)response.redirect('/success'); // Redirection if already logged in
	response.sendfile(__dirname+'/public/index.html');
});

app.post("/form",function(request,response){ // The form page controller
	var user = request.param("username");
	var password = request.param("password");
	userModel.find({username : user},function(err,data){
		if(err)throw err;
		if(data.length == 0 || data[0].passwd != password) 
		// Check if passwords match!
		{
			response.sendfile(__dirname+'/public/error.html');
			console.log("error");
		}
			else{
			sessionStore.user = user;
			sessionStore.loggedIn = true;
			response.redirect('/success');
		}
	});
});

app.get("/success",function(request,response){ 
// The basic homepage after logging in


	if (sessionStore.user == undefined || sessionStore.loggedIn == false || sessionStore.loggedIn == undefined)
		response.redirect('/'); // redirect back to prevent pre-emptive logins
	else{
		user = sessionStore.user;
		userModel.findOne({username : user},'features',function(err,person){
		response.render("success",{name:user,lof:person.features});
			});	
		}

});


app.post("/success",function(request,response){
	// The POST controller for the homepage
	var feature = request.param("featurename");
	var featureArray = [];
	user = sessionStore.user;
	userModel.findOne({username : user},'features',function(err,person){
		featureArray = person.features;
		if(featureArray==undefined) // Holding check for the first time
			featureArray=[feature];
		else
			{featureArray.push(feature);}
		console.log("featureArray: "+featureArray);
		userModel.update({username:sessionStore.user},{$set: {features:featureArray}},{upsert: true},function(err,data){});
			});
	response.redirect('/success');
});

app.get("/register",function(request,response){ 
	//The register page GET controller
	response.sendfile(__dirname+'/public/register.html');
});

app.post("/register",function(request,response){
	// The register page POST controller
	var user = request.param("username");
	var password = request.param("password");
	console.log(user+":"+password);
	userModel.find({username : user},function(err,data){
		console.log(data);
		if(err)console.log(err);
		if(data.length > 0 )
		{
			response.sendfile(__dirname+'/public/error.html');
			console.log('user is already present');
		}
	else
	userModel.create({username : user, passwd : password,features: ""},function(err,data)
		{
		if (err) handleErr(err);
				
		else 
			response.sendfile(__dirname+'/public/createSuccess.html');
				
		});
	});
});

app.listen(8080);
