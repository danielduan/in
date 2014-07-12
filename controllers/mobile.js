var passport = require('passport');
var User = require('../models/User');

// login req:
// {
//   email: string,
//   password: string,
//   iphone_push_token: string
// }
// login res:
// {
//   error: string,
//   username: string,
//   mobile_auth_token: string
// }
exports.login = function(req, res) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  var errors = req.validationErrors();

  if (errors) {
    return res.json({ error: errors.join(" ") });
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) return res.json({ error: err });
    if (!user) {
      return res.json({ error: info.message });
    }
    req.logIn(user, function(err) {
      if (err) res.json({ error: err });

      user.iphone_push_token = req.body.iphone_push_token;
      user.save(function(err) {
        if (err) return res.json({ error: err });
        req.logIn(user, function(err) {
          res.json({ username: user.username,
            mobile_auth_token: user.mobile_auth_token
          });
        });
      });
    });
  })(req, res);
};

// find_user req:
// {
//   mobile_auth_token: string,
//   user: string, (username)
// }
// find_user res:
// {
//   error: string,
//   exists: bool
// }
exports.find_user = function(req, res) {
  if (req.body.user === req.user.username) {
    return res.json({ error: "This is your username" });
  }
  User.findOne({ username: req.body.user }, function(err, user) {
    if (!user) return res.json({ error: "User not found" });
    return res.json({ exists: true });
  });
};

// send req:
// {
//   mobile_auth_token: string,
//   recipient: string, (username)
//   message: string,
// }
// send res:
// {
//   error: string,
//   success: bool
// }
exports.send = function(req, res) {
  User.findOne({ username: req.body.recipient }, function(err, user) {
    if (!user) return res.json({ error: "Invalid recipient" });
    return res.json({ recipient_push_token: user.iphone_push_token,
      message: req.body.message, success: true });
  });
};

//middleware for mobile auth
exports.auth = function(req, res, next) {
  User.findOne({ mobile_auth_token: req.body.mobile_auth_token }, function (err, user) {
    if (!user) return res.json({ error: "Invalid auth token" });
    req.user = user;
    next();
  });
}
