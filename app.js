//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const https= require("https");
const mongoose=require("mongoose");
const env=require("env");
const bcrypt=require("bcrypt");
const saltRounds=10;
const password1=process.env.Pass;

const homeStartingContent = "Hey its me Jaskaran.Its actually my first time working with Databases. In this app I have used a non SQL database to be more specific i am using MongoDb. I really found i easy to work with Mongo.In my earlier version I was using arrays to store the post and as a result it was not persistent and my posts got deleted after a little time.But now using databse This problem will no more be persistent.This time I even made separate interfaces for admin and the user .Admin will be able to delete, edit and compose posts.To sigin up users i have used special incription to savegaurd their information through hashing and salting.Contact us page is not working for the moment because I really foolishly uploded this project on github, exposing my api for the world to see as a result mailchimp deactivated it.";
const aboutContent = "The site is basically meant to be for a person or an organization.They can use to promote themselves and post daily their new ideas and thoughts.There is a contact us page that can be used to contact the person or orf=ganization by providing your Mail and phone number.There is a profile page for the admin of the blog where he or she can tell about themselves which is currently filled with loremIpsum at the moment and a pic of my sister as that page was actually meant for her at first but I decided adding it here beleiving it would enhance this blog post site.";

//Setting up mongoose server
mongoose.connect("mongodb+srv://Jaskaran-Singh:"+password1+"@cluster0.nxtak.mongodb.net/postDB",{useNewUrlParser: true, useUnifiedTopology: true});

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Defining schema and making model
const postsSchema=new mongoose.Schema({
  title:String,
  content:String
});

const userSchema=new mongoose.Schema({
  email:String,
  password:String
});

const adminSchema=new mongoose.Schema({
  email:String,
  password:String
});

const Post=mongoose.model("Post",postsSchema);
const User=new mongoose.model("User",userSchema);
const Admin=new mongoose.model("Admin",adminSchema);



//Admin login and control......................................................................................
app.get("/loginAsAdmin",function(req,res) {
  res.render("adminLogin");
});

app.get("/adminHome",function(req,res){
  Post.find({},function(err,posts){
    res.render("adminHome",{homeDescription:homeStartingContent,posts:posts});
  });
});

app.post("/loginAsAdmin",function(req,res){
  Admin.findOne({email:req.body.username},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else if(foundUser.password === req.body.password){
      Post.find({},function(err,posts){
        res.render("adminHome",{homeDescription:homeStartingContent,posts:posts});
      });
    }
    else{
      res.render("adminLogin");
    }

  });
});

//Deleting contents
app.get("/delete/:postId",function(req,res){
  const requestedTitle=req.params.postId;
  Post.deleteOne({_id:requestedTitle},function(err){
    if(err){
      console.log("dumbass");
    }
    else{
      console.log("Success");
      res.render("delete");
    }
  });
});

//edit your post
app.get("/edit/:postId",function(req,res){
  const requestedTitle=req.params.postId;
  Post.findOne({_id:requestedTitle},function(err,post){
    if(err){
      console.log(err);
    }
    else{
      res.render("edit",{posts:post});
    }
  });

Post.deleteOne({_id:requestedTitle},function(err){
  if(err){
    console.log("dumbass");
  }
  else{
    console.log("Success");
  }
});
});

//Dynamic page request
app.get("/post/:postId",function(req,res){
  const requestedPostId=req.params.postId;

  Post.findOne({_id:requestedPostId}, function(err,post){
    res.render("post", {heading:post.title,body:post.content});
  });

});



//Login and registeration section.............................................................................................................................

app.get("/",function(req,res) {
  res.render("home2");
});

app.get("/login",function(req,res) {
  res.render("login");
});

app.get("/register",function(req,res) {
  res.render("register");
});

app.get("/logout",function(req,res){
  res.render("home2");
});


app.post("/register",function(req,res){

  bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    const newUser= new User({
      email:req.body.username,
      //password:md5(req.body.password)
      password:hash
    });
    newUser.save(function(err){
      if(err){
        console.log(err);
      }
      else{
        Post.find({},function(err,posts){
          res.render("home",{homeDescription:homeStartingContent,posts:posts});
        });
      }
     });
  });
});

//Salting and hashing
app.post("/login",function(req,res){
  const username=req.body.username;
  const password=req.body.password;

  User.findOne({email: username},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser)
      {
        bcrypt.compare(password,foundUser.password,function(err,result){
          if(result===true){
            Post.find({},function(err,posts){
              res.render("home",{homeDescription:homeStartingContent,posts:posts});
            });
          }
        });
      }
    }
  });
});

//Blog section.......................................................................................................................

app.get("/home",function(req,res){
  Post.find({},function(err,posts){
    res.render("home",{homeDescription:homeStartingContent,posts:posts});
  });
});

app.get("/about",function(req,res){
  res.render("about",{aboutDescription:aboutContent});
});


app.get("/compose",function(req,res){
  res.render("compose");
});


//Posting from the compose page
app.post("/compose",function(req,res){
  const post=new Post({
    title:req.body.postTitle,
    content:req.body.postBody
  });
  post.save(function(err){
    if(!err){
      res.redirect("/adminHome");
    }
  });

});


//Dynamic page request
app.get("/posts/:postId",function(req,res){
  const requestedPostId=req.params.postId;

  Post.findOne({_id:requestedPostId}, function(err,post){
    res.render("posts", {heading:post.title,body:post.content});
  });

});


//Using mail chimp api to collect info--------------------------------------------------------------------------------------------------------------
app.post("/contact",function(req,res){
    var fn=req.body.firstName;
    var ln=req.body.lastName;
    var em=req.body.mail;
    var data={
      members:[{
        email_address: em,
        status:"subscribed",
        merge_fields:{
          FNAME:fn,
          PHONE:ln
        }
      }]
    };
    var jsonData=JSON.stringify(data);
    const url=process.env.Api;
    const options={
      method:"POST",
      auth:process.env.Auth;
    };
    const request=https.request(url,options,function(response){

      if(response.statusCode==200){
        res.sendFile(__dirname+"/success.html");
      }
      else{
        res.sendFile(__dirname+"/failure.html");
      }

      response.on("data",function(data){
        console.log(JSON.parse(data));
      });
    });
    request.write(jsonData);
    request.end();
});

app.post("/failure",function(req,res){
  res.sendFile(__dirname+"/contact.html");
});

app.post("/profile",function(req,res){
  res.sendFile(__dirname+"/contact.html");
});

app.get("/profile",function(req,res){
  res.sendFile(__dirname+"/profile.html");
});

app.get("/contact",function(req,res){
  res.sendFile(__dirname+"/contact.html");
});


app.get("/profile2",function(req,res){
  res.sendFile(__dirname+"/profile2.html");
});

//Server setup
app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
//..............................................................................................................
