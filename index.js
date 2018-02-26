const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const exphbs  = require('express-handlebars');
const bcrypt = require('bcrypt');
const pgp = require('pg-promise')(); 
const app = express();
const saltRounds = 10;

const db = pgp({
    host: 'localhost',
    port: 5432,
    database: process.env.DATABASE,
    user: process.env.USERNAME,
    password: process.env.PASSWORD
});
// create temporary storage for login data
const storage = {
  1: {
    id: 1,
    username: 'bob',
    password: 'pass'
  },
  2: {
    id: 2,
    username: 'top',
    password: 'secret'
  }
};
let counter = 3;

// helper function to get user by username
function getUserByUsername(username){
  // return Object.values(storage).find( function(user){
  //   return user.username === username;
  // });
  return db.one(`SELECT * from userdata where userdata.email = $1`, [username]);
}

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static('static')) 
app.use('/static', express.static('static'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// configure user session
app.use(session({
  secret: 'any ole random string',
  resave: false,
  saveUninitialized: false
}));

// serialise user into session
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// deserialise user from session
passport.deserializeUser(function(id, done) {
  const user = storage[id];
  done(null, user);
});

// configure passport to use local strategy
// that is use locally stored credentials
passport.use(new LocalStrategy(
  function(username, password, done) {
    getUserByUsername(username).then();
    if (!user) return done(null, false);
    if (user.password != password) return done(null, false);
    return done(null, user);
  }
));

// initialise passport and session
app.use(passport.initialize());
app.use(passport.session());

// helper function to check user is logged in
function isLoggedIn(req, res, next){
  if( req.user && req.user.id ){
    next();
  } else {
    res.status(401).end();
  }
}

// route to accept logins
app.post('/login', passport.authenticate('local', { session: true }), function(req, res) {
  res.redirect('/profile');
});

// route to display user info
app.get('/profile', isLoggedIn, function(req, res){
  // send user info. It should strip password at this stage
  res.json({user:req.user});
});


app.get('/register', (req, res) => {
  res.render('register')
});

app.post('/register', (req, res) => {
   // console.log(req.body)
   const {email,password} = req.body
   // console.log(email,password);
    bcrypt.hash(password,saltRounds,function(err,hash){
      
    db.one('INSERT INTO userdata(email,password) VALUES ($1, $2)', [email.toLowerCase(),hash])
      .then(function(data) {
        res.status(200).send(`User  with email: ${email} has been created`);
      })
      .catch(function(error) {
        res.json({error: error.message});
      })
  //  storage[counter]={
  //   id:counter,
  //   username: req.body.email,
  //   password: req.body.password
  // }
  // counter += 1;

  // console.log(storage);
  });
});
app.listen(8080, function() { // Set app to listen for requests on port 3000
  console.log('Listening on port 8080!'); // Output message to indicate server is listening
});
