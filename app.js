var express = require('express');
var app = express();
var spawn = require('child_process').spawn; // For running python script
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');
var Campground = require('./models/campground');
var Comment = require('./models/comment')
var User = require('./models/user');
var seedDb = require('./seedDb');

mongoose.connect('mongodb+srv://User_1:9410529104@yelpcamp.02g9d.mongodb.net/yelpcamp?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));
app.use(flash());
// app.use(bodyParser.json());

// seedDb();

app.use(require('express-session')({
	secret : "This is the secret key",
	resave : false,
	saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Campground.create({
// 	name: "Salmon Creek",
// 	image: "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
// 	description: "The Salmon Creek is a very beautiful place. I loved it"
// }, function(err , campground){
// 	if(err)
// 	{
// 		console.log(err);
// 	}
// 	else
// 	{
// 		console.log("New Camp Added");
// 		console.log(campground);
// 	}
// });

// var campgrounds = [
// 		{name : "Salmon Creek" , image : "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"} ,
// 		{name : "Granite Hill" , image : "https://images.pexels.com/photos/699558/pexels-photo-699558.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"} ,
// 		{name : "Mountain Goat's Rest" , image : "https://inteng-storage.s3.amazonaws.com/img/iea/MRw4y5ABO1/sizes/camping-tech-trends_resize_md.jpg"} ,
// 		{name : "Salmon Creek" , image : "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"} ,
// 		{name : "Granite Hill" , image : "https://images.pexels.com/photos/699558/pexels-photo-699558.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"} ,
// 		{name : "Mountain Goat's Rest" , image : "https://inteng-storage.s3.amazonaws.com/img/iea/MRw4y5ABO1/sizes/camping-tech-trends_resize_md.jpg"} ,
// 		{name : "Salmon Creek" , image : "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"} ,
// 		{name : "Granite Hill" , image : "https://images.pexels.com/photos/699558/pexels-photo-699558.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"} ,
// 		{name : "Mountain Goat's Rest" , image : "https://inteng-storage.s3.amazonaws.com/img/iea/MRw4y5ABO1/sizes/camping-tech-trends_resize_md.jpg"} ,
// 		{name : "Salmon Creek" , image : "https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"} ,
// 		{name : "Granite Hill" , image : "https://images.pexels.com/photos/699558/pexels-photo-699558.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"} ,
// 		{name : "Mountain Goat's Rest" , image : "https://inteng-storage.s3.amazonaws.com/img/iea/MRw4y5ABO1/sizes/camping-tech-trends_resize_md.jpg"}
// 	];

app.set("view engine" , "ejs");

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.get('/', function(req , res){
	res.render("landing.ejs");
});

app.get('/campgrounds', function(req , res){
	Campground.find({}, function(err , allCampgrounds){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("campgrounds/campgrounds.ejs" , {campgrounds : allCampgrounds});		
		}
	});
	
});

app.post('/campgrounds' , isLoggedIn, function(req , res){
	// console.log(req.body);
	var name = req.body.name;
	var image = req.body.image;
	var desc = req.body.description;
	var rooms = parseInt(req.body.rooms);
	var author = {
		id : req.user._id,
		username : req.user.username
	}

	var obj = {name : name , image : image, rooms : rooms, description: desc, author};

	Campground.create(obj , function(err, campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			// console.log(campground);
			res.redirect('/campgrounds');
		}
	});

	
});

app.get('/campgrounds/new' , isLoggedIn,function(req , res){
	res.render("campgrounds/newCamp.ejs");
});

app.get('/campgrounds/:id' , function(req , res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			// console.log(foundCampground.rooms);
			res.render("campgrounds/show.ejs", {campground:foundCampground});
		}
	});
	
});


// Edit Campground Route

app.get('/campgrounds/:id/edit', checkCampgroundOwnership, function(req, res){
	
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("campgrounds/edit.ejs", {campground : foundCampground});
		}
	});
});





app.get('/campgrounds/:id/bookingform', isLoggedIn,function(req, res){

	Campground.findById(req.params.id, function(err, foundCampground){

		if(err)
		{
			console.log(err);
		}
		else
		{

			if(foundCampground.rooms > 0)
			{
				res.render("campgrounds/booking_form.ejs", {campground : foundCampground, user : req.user.username});
				// foundCampground.rooms = foundCampground.rooms - 1;

				// Campground.findByIdAndUpdate(foundCampground.id, foundCampground, function(err, updatedCampground){
				// 	// console.log(updatedCampgrounds);
				// });
			}
			else
			{
				res.redirect("/campgrounds/"+foundCampground.id);
			}
		}
	});
});


app.post('/campgrounds/:id/booknow', isLoggedIn,function(req, res){

	Campground.findById(req.params.id, function(err, foundCampground){

		if(err)
		{
			console.log(err);
		}
		else
		{

			if(foundCampground.rooms > 0)
			{
				var name = req.body.name;
				var phone = req.body.phone;
				var address = req.body.address;
				var email = req.body.email;

				var booker = {name:name, phone:phone, address:address, email:email};

				res.render("campgrounds/booknow.ejs", {campground : foundCampground, user : req.user.username, booker : booker});
				foundCampground.rooms = foundCampground.rooms - 1;

				req.user.hotels.push(foundCampground.name);
				User.findByIdAndUpdate(req.user.id, req.user, function(err, updatedUser){

				});

				Campground.findByIdAndUpdate(foundCampground.id, foundCampground, function(err, updatedCampground){
					// console.log(updatedCampgrounds);
				});
			}
			else
			{
				res.redirect("/campgrounds/"+foundCampground.id);
			}
		}
	});
});


// Booking and Cancellation Routes

app.get('/campgrounds/:id/cancelbooking', isLoggedIn,function(req, res){
	// res.render("campgrounds/cancelbooking.ejs");

	Campground.findById(req.params.id, function(err, foundCampground){

		var foundHotelToBeCancelled = 0;
		var hotel_index = 0;

		hotel_names = req.user.hotels;
		// console.log(hotel_names);

		var i = 0;

		hotel_names.forEach(function(hotelName){
			// console.log(hotelName);
			if(hotelName == foundCampground.name)
			{
				foundHotelToBeCancelled = 1;
				hotel_index = i;
			}
			++i;
		});

		// console.log(foundHotelToBeCancelled);

		if(foundHotelToBeCancelled == 1)
		{
			res.render("campgrounds/cancelbooking.ejs", {campground : foundCampground});

			foundCampground.rooms = foundCampground.rooms + 1;
			delete req.user.hotels[hotel_index];

			User.findByIdAndUpdate(req.user.id, req.user, function(err, updatedUser){

			});

			// console.log(req.user);

			Campground.findByIdAndUpdate(req.params.id, foundCampground, function(err, updatedCampground){
				// console.log(updatedCampgrounds);
			});
		}
		else
		{
			alert("No Booking found");
			res.redirect("/campgrounds/"+foundCampground.id);
		}
		
	});
});


// Update Campground Route

app.put('/campgrounds/:id', checkCampgroundOwnership, function(req, res){
	// find and update

	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampgrounds){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.redirect('/campgrounds/' + req.params.id);
		}
	});
});

// Destroy Campground ROUTE

app.delete('/campgrounds/:id', checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndRemove(req.params.id, function(err){
		if(err)
		{
			console.log(err);
		}
		else
		{
			req.flash("success", "Campground Removed");
			res.redirect('/campgrounds');
		}
	});
});


//===========================
//	COMMENTS ROUTES	
//===========================



app.get('/campgrounds/:id/comments/new', isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render("comments/new.ejs", {campground : campground});
		}
	});
	
});

app.post('/campgrounds/:id/comments', isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err)
		{
			console.log(err);
		}
		else
		{
			// console.log(req.body.comment);
			
			Comment.create(req.body.comment, function(err, comment){
				if(err)
				{
					console.log(err);
				}
				else
				{
					// Add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					// save comment
					comment.save();

					campground.comments.push(comment);
					campground.save();

					// console.log(comment);
					req.flash("success", "Successfully added Comment");
					res.redirect('/campgrounds/' + campground._id);
				}
			});


			// check_sentiment(req.body.comment);
			// function check_sentiment(comment)
			// {
			// 	var sentiment1 = "";

			// 	var python = spawn('python3', ['script2.py', comment.text]);
			// 	console.log("what is wrong")
			// 	python.stdout.on('data', function(data){
			// 		sentiment1 = data.toString();
			// 	});

			// 	python.on('close', function(code){
			// 		comment.sentiment = sentiment1[0];
			// 		// 	comment.save();
			// 		console.log(comment);
			// 		Comment.create(req.body.comment, function(err, comment){
			// 			if(err)
			// 			{
			// 				console.log(err);
			// 			}
			// 			else
			// 			{
			// 				campground.comments.push(comment);
			// 				campground.save();
			// 				res.redirect('/campgrounds/' + campground._id);
			// 			}
			// 		});
			// 	});
			// }
		}
	});
});

// =================
// Authentication Routes
// =================

app.get('/register', function(req, res){
	res.render('register.ejs');
});

app.post('/register', function(req, res){
	var newUser = new User({username : req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err)
		{
			req.flash("error", err.message);
			return res.render('register.ejs');
		}

		passport.authenticate('local')(req, res, function(){
			req.flash("success", "Welcome to YelpCamp" + user.username);
			res.redirect('/campgrounds');
		});

		// res.redirect('/login');
	});
});

app.get('/login', function(req, res){
	res.render("login.ejs");
});

app.post('/login', passport.authenticate("local", 
	{
		successRedirect : "/campgrounds",
		failureRedirect : "/login"
	}
	),function(req, res){

});

app.get('/logout', function(req, res){
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect('/campgrounds');
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated())
	{
		return next();
	}
	req.flash("error", "Please Login First!");
	res.redirect('/login');
}

function checkCampgroundOwnership(req, res, next)
{
	if(req.isAuthenticated())
	{
		Campground.findById(req.params.id, function(err, foundCampground){
			if(err)
			{
				res.redirect("back");
			}
			else
			{
				// does user own the campground
				if(foundCampground.author.id.equals(req.user._id))
				{
					next();
				}
				else
				{
					req.flash("error", "You do not have permission to do that");
					res.redirect("back");
				}
			}
		});
	}
	else
	{
		req.flash("error", "You need to be Logged In to do that")
		res.redirect("back");
	}
}

app.listen(process.env.PORT || 3000);