/*
	Require in the express module and create the "app", which is our middleware container.
*/
var express = require("express");
var app = express();
var fs = require("fs");

/*
	Require in the body-parser module, which allows us to read in POST data using the handy "req.body" shorthand.
*/
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

/*
	Require in the express-session module, which allows us to save a "cookie" to each users' computer, identifying that user. This provides a property called req.session, which contains properties unique to every user.
*/
var session = require("express-session");
app.use(session({
	secret: 'keyboard cat', // keep it secret keep it safe
	resave: false, // default value, don't save unmodified req.session objects.
	saveUninitialized: true, // default value, do save new users' objects even if they haven't logged in
}));

/*
	Sometimes we'll want to make sure that a URL or similar is safe. In order to do this we can run these replacements on the text. Strings like "<script>" will become safe to display.

	We should always check dilligently on the backend to make sure that users aren't able to inject arbitrary javascript.
*/
function escapeHtml(unsafe) {
return unsafe
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#039;");
}

/*
	This is our array of images... for now (until we get a proper database hooked up).
*/
var images = [
	{
		author: "erty",
		url: "http://www.catgifpage.com/gifs/318.gif",
		vote: 0
	},
	{
		author: "erty",
		url: "http://www.catgifpage.com/gifs/212.gif",
		vote: 0
	}
];

//create a array of users
var users = [
{
	username: "erty",
	password: 1234
}]

/*
	POST /api/login
	Returns TEXT: "success" on successful login, "error" if username or password was wrong.
*/
app.post("/api/login", function(req, res) {
	// Check that the user is providing a username/password
	if (!req.body.username || !req.body.password) {
		res.send("error");
		return;
	}
	for (var i = 0; i < users.length; i++) {			//loop to make sure user password is correct
		if (req.body.username === users[i].username){   //if usename is found
			if (req.body.password === users[i].password){ //check if password matches
				req.session.user = users[i];  //set session

				res.send("success");  
				return;
			}
			else res.send("error");
			return;
		}
	}
	return res.send("error");
});

app.post("/api/register", function(req, res) { //set up new user registratio
	for (var i = 0; i < users.length; i++) { //loop through existing users
		if (req.body.username === users[i].username){ //make sure name doesn't exist
			res.send("error") //return error if duplicate
			return;
		}	
	};
	users.push(req.body); //build user array
	req.session.user = users[i];  //set session
	res.send("success")
});

app.post("/vote", function (req, res) {  //
	// console.log(req.body.imageId);
	imageId = req.body.imageId;  //tag vote to imageID
	images[imageId].vote += 1; //add one vote
	// console.log(images[imageId].vote);
	res.send(JSON.stringify(images[imageId].vote));  //return vote count
});
/*
	GET /api/gallery
	Returns JSON: The entire array of images
	(this is what populates the index.html homepage with images)
*/
app.get("/api/gallery", function(req, res) {
	res.send(JSON.stringify(images));
});

app.get("/image/:selectedImageId", function(req, res) { //backend of single image dis[lay]
	var imageId = req.params.selectedImageId;  //id of image 
	// console.log(images[imageId]);
	fs.readFile("public/image.html", function(err, data) { //take in page 
		if (err) {
			console.log(err);
			return;
		}
		s = data.toString(); //string the data
		s = s.replace(/###/g, images[imageId].url); //replace the missing reference
		res.send(s); //rebuild the page with the url for the image selected
	});
});

/*
	POST /api/logout
	Return: TEXT (always "success")
	Delete the req.session.user object so the user is no longer authenticated
*/
app.post("/api/logout", function(req, res) {
	req.session.user = false;
	res.send("success");
});

/*
	GET /upload.html
	Return: HTML or Redirect
	Intercept a call to upload.html, so that users that are not authenticated are sent instead to the login page
*/
app.get('/upload.html', function(req, res) {
	// If the user is not logged in ...
	if (!req.session.user) {
		// Send them instead to the login page
		// We can only redirect because this is *not* an API call - this is a request for HTML ("upload.html")
		res.redirect("/login.html");
		return;
	} else {
		// Otherwise we manually send them the upload.html file that they wanted.
		res.sendFile(__dirname + "/public/upload.html");
	}
});

/*
	POST /api/upload
	Return TEXT: "success" or "error" (or 403 forbidden)
*/
app.post('/api/upload', function(req, res) {
	// If the user is not logged in, we send an error: 403 forbidden. We don't redirect because this is an API call (not a call for HTML)
	if (!req.session.user) {
		res.status(403);
		res.send("Forbidden! >:| ");
		return;
	}

	// If they don't send us a URL, we can't post anything
	if (!req.body.url) {
		res.send("error");
		return;
	}

	// At this point we've passed the "guard clauses", and are allowed to push our image into the array. Note that we get the data for the username from our own req.session -- we don't allow the user to provide this.
	images.push({ 
		url: req.body.url,
		author: req.session.user.username,  //add username input to object
		vote: 0 //set votes for new images to 0
	});

	// Send success!
	res.send("success");
});

// Serve Static Files
app.use(express.static('public'));

// 404 Middleware
app.use(function(req, res, next) {
	res.status(404);
	res.send("404 File Not Found ... :( ");
});

// 500 Middleware
app.use(function(err, req, res, next) {
	console.log(err);
	res.status(500);
	res.send("500 Internal server error... D:");
});


// Actually Start the Server
app.listen(8080, function() {
	console.log("ok you have a server :)");
});
