const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const ejs = require("ejs");
const _ = require('lodash');
const passport = require("passport");
const passportLocalMongoose = require( "passport-local-mongoose");
const session = require('express-session');





const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// Passport configuration
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//MongoDB
mongoose.connect('mongodb+srv://ayushmj970:asdf@cluster0.zbhkt38.mongodb.net/BlogDB');//setting up mongoodb


const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  Title: String,
  content: String
  
});

const Data = mongoose.model('Data', postSchema);
//

//Userscheam

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

 //



app.get("/", (req, res) => {

    if (req.isAuthenticated()) {
    Data.find({userId: req.user._id}).then(function(findPost) {
      res.render("home", {
        home_content: homeStartingContent,
        post_content: findPost,
        user: req.user.username
      });
      console.log("Home page!");
    }).catch(function(err) {
      console.log(err);
    });
  } else {
    res.render("opening-page");
  }
});


// Login-Register

app.get("/home", (req, res) => {

  if (req.isAuthenticated()) {
  Data.find({userId: req.user._id}).then(function(findPost) {
    res.render("home", {
      home_content: homeStartingContent,
      post_content: findPost,
      user: req.user.username
    });
    console.log("Home page!");
  }).catch(function(err) {
    console.log(err);
  });
} else {
  res.render("opening-page");
}
});

app.get("/login",function(req, res) {
  res.render("login");
});

app.get("/register",function(req, res) {
  res.render("register");
});


app.post("/register", function(req, res){
    
  User.register({username: req.body.username }, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate('local')(req, res, function(){
          res.redirect("/home");
      });
    }
  });

});


app.post("/login",function(req,res){
  
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err){
      if (err) {
        alert(err);
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/home");
        });
      }
    });
});


app.get("/logout", function(req, res){
  req.logout(function(err) {
      if (err) { return next(err); }
  res.redirect("/");
});
});

///



app.get("/about", function(req, res) {
  if (req.isAuthenticated()) {
  res.render("about", { about_content: aboutContent });
  }
  else{
    res.render("opening-page");
  }
});


app.get("/compose", function(req, res) { 
  if (req.isAuthenticated()) {
  res.render("compose" );
  }
  else{
    res.render("opening-page");
  }
});

app.post("/compose", function(req, res) {
  if (req.isAuthenticated()) {
    const newPost = new Data({
      userId: req.user._id,
      Title: req.body.PostTitle,
      content: req.body.PostBody
    });

    newPost.save().then(function() {
      console.log("Post is created!");
      res.redirect("/home");
    }).catch(function(err) {
      console.log(err);
    });
  } else {
    res.render("opening-page");
  }
});


app.get("/posts/:postId",function(req,res){

  const requestedPostId = req.params.postId;
  Data.findOne({_id:requestedPostId , userId: req.user._id }).then(function(findPost){
    if (findPost) {
      res.render("post", { post_title: findPost.title, post_data: findPost.content });
      console.log("Custom post found!");
    } else {
      res.send("You are not authorized to view this post.");
    }
  }).catch(function(err){
    console.log(err);
  });
});

//Post Delet route

app.post("/posts/:postId/delete", function (req, res) {
  const postId = req.params.postId;
  
  // Update the post's `isDeleted` field to true
  Data.findByIdAndDelete(postId)
    .then(function () {
      console.log("Post is deleted!");
      res.redirect("/home");
    })
    .catch(function (err) {
      console.log(err);
      res.redirect("/home");
    });
});


  
//TO do LIST/////////////////////////////////////////////////////////////////
//TO do LIST/////////////////////////////////////////////////////////////////
//TO do LIST/////////////////////////////////////////////////////////////////
//TO do LIST/////////////////////////////////////////////////////////////////
const itemsSchema =new mongoose.Schema({
  name:String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});
 
const Item = mongoose.model(
  "Item",itemsSchema
);
 
const item1 = new Item({
  name:"work"
})
 
const item2 = new Item({
  name:"play"
})
 
const item3 = new Item({
  name:"gym"
})
 
const listSchema = new mongoose.Schema({
  name:String,
  items:[itemsSchema]
});
 
const defaultItems = [item1,item2,item3];
 
const List = mongoose.model("List", listSchema);
 
 




app.get("/list",function (req,res) {

  if (req.isAuthenticated()) {
  Item.find({userId: req.user._id})
  .then(function(foundItems){
    
    res.render("list", {
      listTitle: "Today", 
      newListItems: foundItems});
  
  })
  .catch(function(err){
    console.log(err);
  })
}
else{
  res.redirect("/login"); 
}
 
});


app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName= req.body.listName;

  if(listName === "Today")
  {
    Item.findByIdAndDelete(checkedItemId)
  .then(function(){
    console.log("deleted item");
    })
  .catch(function(err){
    console.log(err);
    });
  res.redirect("/list");
  }
  else{
    List.findOneAndUpdate({name : listName},{$pull : {items:{_id : checkedItemId}}}).then(function(){
      res.redirect("/list/"+listName);
    }).catch(function(err){
      console.log(err);
    });
  }
  
});
 

app.post("/list", function(req, res){
  if (req.isAuthenticated()) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName,
    userId: req.user._id
  });
  if(listName === "Today")
  {
    item.save();
    res.redirect("/list");
  }
  else{
    List.findOne({name:listName}).then(function(foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/list/" + listName);
    }).catch(function(err){
      console.log(err);
    });
  }
}
else{
  res.redirect("/login"); 
}
});


app.get("/list/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
 
  List.findOne({name:customListName})
    .then(function(foundList){
        
          if(!foundList){
            const list = new List({
              name:customListName,
              items:defaultItems
            });
          
            list.save();
            console.log("creating new list");
            res.redirect("/list/"+customListName);
          }
          else{
            res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
          }
    })
    .catch(function(err){});
})



////to do list code ends
  
  

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
