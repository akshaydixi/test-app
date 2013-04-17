var http = require('http');
var url = require('url');
var sys = require('util');
var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var index;
var app = express();
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
var userSchema = new mongoose.Schema ({
	username : String,
	passwd : String,
	features : [String]});
var userModel = mongoose.model('userModel',userSchema);
var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();
app.configure(function(){
	app.use(express.static(__dirname+'/public'));
	app.use(express.bodyParser());
	app.set('view engine','jade');
	app.set('views',__dirname+'/public')
});
app.get("/",function(request,response){
	console.log(sessionStore);
	if ( sessionStore.loggedIn == true)response.redirect('/success');
	response.sendfile(__dirname+'/public/index.html');
});

app.post("/form",function(request,response){
	var user = request.param("username");
	var password = request.param("password");
	console.log(user+":"+password);
	userModel.find({username : user},function(err,data){
		if(err)console.log(err);
		if(data.length == 0 || data[0].passwd != password)
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


	if (sessionStore.user == undefined || sessionStore.loggedIn == false || sessionStore.loggedIn == undefined){response.redirect('/');}
	else{
	user = sessionStore.user;
	userModel.findOne({username : user},'features',function(err,person){
		console.log(person);
		response.render("success",{name:user,lof:person.features});
	});	
	}

});
app.post("/success",function(request,response){
	var feature = request.param("featurename");
	var featureArray = [];
	user = sessionStore.user;
	userModel.findOne({username : user},'username passwd features',function(err,person){
		featureArray = person.features;
		if(featureArray==undefined)
			{featureArray=[feature];}
		else
			{featureArray.push(feature);}
		console.log("featureArray: "+featureArray);
		userModel.update({username:sessionStore.user},{$set: {features:featureArray}},{upsert: true},function(err,data){});
});
	response.redirect('/success');
});

app.get("/register",function(request,response){
	response.sendfile(__dirname+'/public/register.html');
});

app.post("/register",function(request,response){
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

	userModel.create({username : user, passwd : password,features: ""},function(err,data){
		if (err) console.log("error: "+errr);
				
		else {
			console.log("saved");
			response.sendfile(__dirname+'/public/createSuccess.html');
				}
		});
	});
});

app.listen(8080);
