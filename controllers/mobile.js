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
//   success: bool,
//   error: [string],
//   mobile_auth_token: string
// }
exports.login = function(req, res) {
  console.log(req.body);
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
      return res.json({ success: true, mobile_auth_token: user.mobile_auth_token });
    });
  })(req, res);
};

exports.send = function(req, res) {
  res.render('api/index', {
    title: 'API Examples'
  });
};
