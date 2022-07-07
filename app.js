const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const _ = require('lodash');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}));
//sets up passport for using authentication
app.use(passport.initialize());
//using passport for session
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/ToyuserDB", {useNewUrlParser:true});
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const toySchema = new mongoose.Schema({
  ToyName: String,
  description: String
})

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const Toy = new mongoose.model("toy", toySchema);

app.get("/",(req,res)=>{
  res.render("home");
})

app.get("/register",(req,res)=>{
  res.render("register");
})

app.get("/login",(req,res)=>{
  res.render("login");
})

app.get("/toy",(req,res)=>{
  Toy.find({}, (err,toys)=>{
    if(!err){
      res.render("toy", {toys: toys});
    }
  })

})

app.get("/submitToy",(req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login")
  }
})

app.post("/register",(req,res)=>{
  User.register({username: req.body.username}, req.body.password, (err,user)=>{
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,()=>{
        res.redirect("/toy");
      })
    }
  })
})

app.post("/login", (req,res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err)=>{
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,()=>{
        res.redirect("/toy");
      })
    }
  })
});

app.post("/submitToy", (req,res)=>{
  const toy = new Toy({
    ToyName: _.capitalize(req.body.ToyName),
    description: req.body.description
  });
  toy.save((err)=>{
    if(!err){
      res.redirect("/toy");
    }
  })
})

app.post("/search", (req,res)=>{
  const receivedToyName = _.capitalize(req.body.ToyName);
  Toy.findOne({ToyName: receivedToyName}, (err, foundToy)=>{
    if(err){console.log(err);}
    else{
      if(foundToy){
        res.render("toydetails",{Toy: foundToy});
      }else{console.log('no toy with this name');}
    }
  })
});

app.post("/delete",(req,res)=>{
  const toyId = req.body.toysid;
  Toy.findByIdAndRemove(toyId, (err)=>{
    if (!err) {
      console.log('successfull deleted item with item');
      res.redirect("/toy");
    }
  })
})

app.post("/update", (req,res)=>{
  Toy.findOneAndUpdate({ToyName: req.body.ToyName}, {description: req.body.description}, (err, foundToy)=>{
    if(!err){
      console.log('updated');
      res.redirect('/toy');
    }
  })
})

app.listen(3000, ()=>{
  console.log('server running on port 3000');
});
