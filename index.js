const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Meme = require("./models/meme");
const exphbs = require('express-handlebars');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({path: path.join(__dirname, "./.env")}); 
const methodOverride = require('method-override');
const PORT = process.env.PORT || 8080;
// express app
const app = express();

app.use(methodOverride('_method'));

// connect to mongodb & listen for requests
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  app.listen(PORT , () => {
    console.log('App is on ' + PORT);
  })
}).catch((err) => {
  console.log(err)
});


// register view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
  }));
  app.set('view engine', 'handlebars');


// middleware & static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});
//display all the memes
app.get("/", (req, res) => {
  Meme.find({})
  .lean()
    .sort({ createdAt: -1 })
    .limit(100)
    .then((result) => {
      res.render("index", { memes: result, title: "All Memes" });
    })
    .catch((err) => {
      console.log(err);
    });
});

//create a new meme
app.post("/", (req, res) => {
  const meme = new Meme(req.body);
  meme
    .save()
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/edit/:id' , (req,res) => {
  const id = req.params.id;
  Meme.findById({_id: id})
    .then((result) => {
      res.render('edit' , { 
      title: "Edit Meme"  , 
      name: result.name , 
      caption: result.caption , 
      url: result.url ,
      id: result.id
    })
    })
    .catch((err) => {
      console.log(err);
    });
});

app.patch('/edit/:id' , (req,res) => {
  Meme.findOne({
    _id: req.params.id
  })
  .then( meme => {
      //change new values 
      meme.caption =  req.body.caption , 
      meme.url =  req.body.url

      meme.save()
      .then( meme => {
          res.redirect('/')
      })
  }).catch(err => {
    console.log(err);
  })
})
//to delete the meme
app.get('/delete/:id' , (req,res) => {
  const id = req.params.id;
  Meme.findByIdAndDelete(id)
  .then(res.redirect('/'))
  .catch((err) => {
    console.log(err);
  });
})

//find the meme in sorted manner
app.get("/memes", (req, res) => {
  Meme.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
    });
});
//save the meme in the mongo db
app.post("/memes", (req, res) => {
  const meme = new Meme({
    name: req.body.name,
    url: req.body.url,
    caption: req.body.caption,
  });
  meme
    .save()
    .then((result) => {
      res.json({
        id: result._id,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
//find the meme
app.get("/memes/:id", (req, res) => {
  const id = req.params.id;
  Meme.findById(id)
    .then((result) => {
      res.json({
        id: result._id,
        name: result.name,
        url: result.url,
        caption: result.caption,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
//edit the meme saved
app.post('/edit',(req,res)=>{
  res.render('edit')
});


// 404 page
app.use((req, res) => {
  res.status(404).render("404", { title: "404" });
});
