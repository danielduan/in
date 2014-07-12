var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var User = require('../models/User');
var LocalStrategy = require('passport-local').Strategy;


// login req:
// {
//   email: string,
//   password: string,
//   iphone_push_token: string
// }
// login res:
// {
//   success: bool,
//   error: [string],
//   mobile_auth_token: string
// }

exports.login = function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  console.log("req");
  passport.use(new LocalStrategy(function(email, password) {
    User.findOne({ email: email }, function(err, user) {
      if (err) {
        return res.json({ error: err });
      }
      if (!user) {
        return res.json({ error: 'Incorrect email.' });
      }
      if (!user.comparePassword(password, function(err, success) {
        if (err) {
          return res.json({ error: 'Incorrect password.' });
        } else {
          return res.json({
            success: true,
            mobile_auth_token: user.mobile_auth_token
          });
        }
      }));
    });
  }));
};

exports.send = function(req, res) {
  res.render('api/index', {
    title: 'API Examples'
  });
};
