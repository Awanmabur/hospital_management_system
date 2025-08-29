require('dotenv').config()
const express =require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { urlencoded } = require('body-parser');
const session = require('cookie-session');
const flash = require('connect-flash');
// const { SitemapStream, streamToPromise } = require('sitemap');
// const { createGzip } = require('zlib');
// const compression = require('compression');
const moment = require('moment');
// const cron = require('node-cron');
const { MongoClient } = require('mongodb');

const app = express();


app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

const PORT = process.env.PORT || 3000

// ************************  Database Connection  **********************************//
const {connectMonggose} = require('./config/db')
connectMonggose();

app.use(express.json());

// app.use(compression());

//run seeders
const {superAdmin} = require('./seeders/admin');
superAdmin();

// *************************    Assets    ****************************************//
app.use(urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Configure express-flash and express-session
app.use(session({
  secret: 'jwtSecret',
  resave: false,
  saveUninitialized: false,
}));


app.use(flash());

// Middleware to set user token if not present
app.use((req, res, next) => {
  if (!req.cookies.userToken) {
    res.cookie('userToken', new mongoose.Types.ObjectId(), { maxAge: 2 * 365 * 24 * 60 * 60 * 1000, httpOnly: true });
  }
  next();
});

// Middleware for flash messages
app.use(function (req, res, next) {
  res.locals.successMessage = req.flash('success');
  res.locals.welcomeMessage = req.flash('welcome');
  res.locals.errorMessage = req.flash('error');
  res.locals.logoutMessage = req.flash('logout');
  res.locals.warningMessage = req.flash('warning');
  next();
});


// In your Node code
app.locals.shortTime = function(date) {
  const now = moment();
  const duration = moment.duration(now.diff(date));
  const hours = Math.floor(duration.asHours());
  const days = Math.floor(duration.asDays());

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return '1d ago';
  return `${days}d ago`;
};

// In your main server file (e.g., app.js or server.js)
app.locals.isProfileOwner = function(loggedInUserId, profileUserId) {
  return loggedInUserId.toString() === profileUserId.toString();
};

// // Schedule to run daily at 2 AM
// cron.schedule('0 2 * * *', async () => {
//   console.log('🧹 Running expired match cleanup...');
//   await cleanupExpiredMatches();
// });


// (async () => {
//   const uri = process.env.DATABASE_URL;
//   const client = new MongoClient(uri);
//
//   try {
//     await client.connect();
//     const db = client.db(); // Gets DB from URI
//
//     const collectionName = 'services'; // exact collection name
//
//     // Check if collection exists
//     const collections = await db.listCollections({ name: collectionName }).toArray();
//
//     if (collections.length) {
//       await db.dropCollection(collectionName);
//       console.log(`✅ Collection '${collectionName}' dropped successfully.`);
//     } else {
//       console.log(`⚠️ Collection '${collectionName}' does not exist.`);
//     }
//   } catch (err) {
//     console.error('❌ Error dropping collection:', err.message);
//   } finally {
//     await client.close();
//   }
// })();

// ***********************************Routes ********************************//
app.use(require("./routes/index"))
app.use(require("./routes/users"))
// app.use(require("./routes/event"))
// app.use(require("./routes/blog"))
// app.use(require("./routes/service"))
// app.use(require("./routes/attendee"))
// app.use(require("./routes/account"))
// app.use(require("./routes/booking"))
// app.use(require("./routes/payment"))
// app.use(require("./routes/promotion"))
// app.use(require("./routes/sitemap"))

// const eventsRoutes = require("./routes/event");
// app.use("/events", eventsRoutes);
//
// app.get('/robots.txt', (req, res) => {
//     res.type('text/plain');
//     res.sendFile(path.join(__dirname, 'public/robots.txt'));
// });

// ************************* PORT ***********************************//

app.listen(PORT, () => console.log("Server started on http://localhost:3000"));
