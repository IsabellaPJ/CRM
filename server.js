require('module-alias/register');
const mongoose = require('mongoose');

// Make sure we are running node 7.6+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 14 || (major === 14 && minor <= 0)) {
  console.log('Please go to nodejs.org and download version 8 or greater. 👌\n ');
  process.exit();
}

// import environmental variables from our variables.env file
require('dotenv').config({ path: '.variables.env' });

// Connect to our Database and handle any bad connections
// mongoose.connect(process.env.DATABASE);

mongoose.connect("mongodb+srv://Isabella:isabella2k@cluster0.zocxl46.mongodb.net/test");
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
  console.error(`🚫 Error → : ${err.message}`);
});

const glob = require('glob');
const path = require('path');

glob.sync('./models/**/*.js').forEach(function (file) {
  require(path.resolve(file));
});

// Start our app!
const app = require('./app');
app.set('port', process.env.PORT || 8888);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → On PORT : ${server.address().port}`);
});

const express = require('express');
const jsforce = require('jsforce');

const app = express();

const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com'
});

conn.login('your_salesforce_username', 'your_salesforce_password_with_security_token', function(err, res) {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Logged in to Salesforce');

  // Query some data from Salesforce
  conn.query("SELECT Id, Name FROM Account", function(err, result) {
    if (err) {
      console.error(err);
      return;
    }

    console.log('Query result:', result.records);

    // Close the connection
    conn.logout(function(err) {
      if (err) {
        console.error(err);
        return;
      }

      console.log('Logged out from Salesforce');
    });
  });
});


