//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const https= require("https");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const saltRounds=10;

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";

//Setting up mongoose server
mongoose.connect("mongodb://localhost:27017/postDB",{useNewUrlParser: true, useUnifiedTopology: true});

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Defining schema and making
const postsSchema=new mongoose.Schema({
  title:String,
  content:String
});

const userSchema=new mongoose.Schema({
  email:String,
  password:String
});

const Post=mongoose.model("Post",postsSchema);
const User=new mongoose.model("User",userSchema);


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
      res.redirect("/")
    }
  });

});


//Dynamic page request
app.get("/posts/:postId",function(req,res){
  const requestedPostId=req.params.postId;

  Post.findOne({_id:requestedPostId}, function(err,post){
    res.render("posts", {heading:post.title,body:post.content});
  });

//     var storeTitle=_.lowerCase(post.title);
//     if(requestedTitle===storeTitle){
//       res.render("posts",{title:post.title, body:post.content});
//     }
//   });
});


//Deleting contents
app.get("/delete/:postName",function(req,res){
  const requestedTitle=_.lowerCase(req.params.postName);
  Post.deleteOne({title:requestedTitle},function(err){
    if(err){
      console.log("dumbass");
    }
    else{
      console.log("Success");
      res.render("delete");
    }
  });
});

//-----------------------------------------------------------------------------------------------------
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
    const url="https://us2.api.mailchimp.com/3.0/lists/2a6e083c95";
    const options={
      method:"POST",
      auth:"Mini:4521c6cea515f4ea7c59f9fe03a33982-us2"
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
