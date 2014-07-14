var passport = require('passport');
var User = require('../models/User');
var path = require('path');

var apn = require('apn');
if (process.env.NODE_ENV !== 'production') {
  var apn_connection = new apn.connection({
    cert: path.join(__dirname, 'cert.pem'),
    key: path.join(__dirname, 'key.pem')
  });
} else {
  var apn_connection = new apn.connection({
    cert: path.join(__dirname, 'cert.pem'),
    key: path.join(__dirname, 'key.pem')
  });
}

apn_connection.on('connected', function() {
    console.log("Connected");
});
apn_connection.on('transmitted', function(notification, device) {
    console.log("Notification transmitted to:" + device.token.toString('hex'));
});
apn_connection.on('transmissionError', function(errCode, notification, device) {
    console.error("Notification caused error: " + errCode + " for device ", device, notification);
});
apn_connection.on('timeout', function () {
    console.log("Connection Timeout");
});
apn_connection.on('disconnected', function() {
    console.log("Disconnected from APNS");
});
apn_connection.on('socketError', console.error);

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
  console.log(req.body);

  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  var errors = req.validationErrors();

  if (errors) {
    return res.json({ error: errors });
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) return res.json({ error: err });
    if (!user) {
      return res.json({ error: info.message });
    }
    req.logIn(user, function(err) {
      if (err) res.json({ error: err });

      user.iphone_push_token = req.query.iphone_push_token;
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

exports.signup = function(req, res) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('username', 'Username is empty').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    return res.json(errors);
  }

  var user = new User({
    email: req.body.email,
    username: req.body.username,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email address already exists.' });
      return res.redirect('/signup');
    }
    user.save(function(err) {
      if (err) return next(err);
      req.logIn(user, function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });
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
  console.log(req.query);
  User.findOne({ username: req.query.recipient }, function(err, user) {
    if (!user) return res.json({ error: "Invalid recipient" });

    //var msg = ["hack[in]", "sleep[in]", "eat[in]", "messag[in]", "[in]charge", "[in]tern", "ride[in]"];
    var i = Math.floor(Math.random() * IN_DICT.length);

    var note = new apn.notification();
    note.expiry = Math.floor(Date.now() / 1000) + 36000; // Expires 1 hour from now.
    note.badge = 3;
    note.retryLimit = 1;
    note.sound = "ping.aiff";
    note.alert = req.user.username + ": " + IN_DICT[i];//": hack[in]";//+ req.query.message;
    note.payload = { 'messageFrom': req.user.username };
    apn_connection.pushNotification(note, user.iphone_push_token);

    return res.json({ message: req.query.message, success: true });
  });
};

// save_friend req:
// {
//   mobile_auth_token: string,
//   friend: string (username to append to array)
// }
// save_friend res:
// {
//   error: string,
//   success: bool
// }
exports.save_friend = function(req, res) {
  req.user.friends.push(req.query.friend);
  req.user.save(function(err) {
    if (err) return res.json({ error: err });
    return res.json({ success: true });
  });
}

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
exports.find_user = function(req, res, next) {
  if (req.query.friend === req.user.username) {
    return res.json({ error: "This is your username" });
  }
  User.findOne({ username: req.query.friend }, function(err, user) {
    if (!user) return res.json({ error: "User not found" });
    next();
  });
};

// get_friends req:
// {
//   mobile_auth_token: string,
// }
// get_friends res:
// {
//   error: string,
//   friends: stringified friends
// }
exports.get_friends = function(req, res) {
  if (!req.user || !req.user.friends) return res.json({ error: "Cannot find friends" });
  return res.json({ friends: req.user.friends });
}

//middleware for mobile auth
exports.auth = function(req, res, next) {
  User.findOne({ mobile_auth_token: req.query.mobile_auth_token }, function (err, user) {
    if (!user) return res.json({ error: "Invalid auth token" });
    req.user = user;
    next();
  });
}

IN_DICT = [
"[in]",
"th[in]k",
"[in]to",
"f[in]d",
"th[in]g",
"[in]",
"someth[in]g",
"beg[in]",
"aga[in]st",
"aga[in]",
"dur[in]g",
"po[in]t",
"br[in]g",
"bus[in]ess",
"k[in]d",
"s[in]ce",
"l[in]e",
"[in]clude",
"cont[in]ue",
"m[in]ute",
"[in]formation",
"noth[in]g",
"anyth[in]g",
"with[in]",
"morn[in]g",
"w[in]",
"everyth[in]g",
"[in]clud[in]g",
"[in]terest",
"beh[in]d",
"rema[in]",
"m[in]d",
"f[in]ally",
"accord[in]g",
"expla[in]",
"[in]ternational",
"build[in]g",
"jo[in]",
"[in]dustry",
"certa[in]",
"po[in]t",
"w[in]dow",
"s[in]gle",
"adm[in]istration",
"[in]volve",
"[in]crease",
"certa[in]ly",
"f[in]e",
"[in]dividual",
"meet[in]g",
"determ[in]e",
"[in]dicate",
"tra[in][in]g",
"feel[in]g",
"f[in]ancial",
"[in]deed",
"s[in]ce",
"f[in]al",
"ma[in]",
"spr[in]g",
"imag[in]e",
"f[in]ish",
"ma[in]ta[in]",
"conta[in]",
"pa[in]",
"[in]terview",
"even[in]g",
"[in]side",
"[in]dividual",
"[in]stitution",
"[in]stead",
"magaz[in]e",
"s[in]g",
"sk[in]",
"mach[in]e",
"[in]vestment",
"f[in]ger",
"pa[in]t[in]g",
"[in]stead",
"[in]terest[in]g",
"d[in]ner",
"w[in]d",
"op[in]ion",
"orig[in]al",
"[in]come",
"n[in]e",
"exam[in]e",
"[in]volved",
"[in]vestigation",
"bra[in]",
"[in]surance",
"beg[in]n[in]g",
"def[in]e",
"Ch[in]ese",
"[in]troduce",
"dr[in]k",
"mounta[in]",
"w[in]ter",
"ga[in]",
"[in]crease",
"[in]dependent",
"will[in]g",
"[in]terested",
"[in]side",
"understand[in]g",
"t[in]y",
"liv[in]g",
"pr[in]ciple",
"[in]sist",
"[in]fluence",
"grow[in]g",
"k[in]d",
"[in]telligence",
"comb[in]e",
"w[in]e",
"learn[in]g",
"rem[in]d",
"follow[in]g",
"medic[in]e",
"f[in]d[in]g",
"tra[in]",
"writ[in]g",
"[in]tend",
"ra[in]",
"[in]jury",
"pa[in]t",
"[in]struction",
"eng[in]e",
"read[in]g",
"[in]creas[in]gly",
"obta[in]",
"[in]vite",
"mean[in]g",
"[in]strument",
"th[in]",
"m[in]ority",
"teach[in]g",
"be[in]g",
"r[in]g",
"tra[in]",
"th[in]k[in]g",
"[in]vestor",
"hear[in]g",
"[in]ternal",
"l[in]k",
"sett[in]g",
"[in]fluence",
"[in]vestigate",
"cha[in]",
"comb[in]ation",
"rat[in]g",
"elim[in]ate",
"compla[in]",
"w[in]g",
"m[in]ister",
"[in]dustrial",
"w[in]ner",
"[in]tervention",
"open[in]g",
"[in]itial",
"crim[in]al",
"[in]cident",
"[in]creased",
"def[in]itely",
"eng[in]eer",
"decl[in]e",
"[in]vest",
"fish[in]g",
"dr[in]k",
"conv[in]ce",
"beh[in]d",
"liv[in]g",
"m[in]d",
"[in]teraction",
"warn[in]g",
"def[in]ition",
"airl[in]e",
"[in]itiative",
"fund[in]g",
"hous[in]g",
"exist[in]g",
"regard[in]g",
"rema[in][in]g",
"plann[in]g",
"wedd[in]g",
"[in]form",
"l[in]k",
"lead[in]g",
"sav[in]g",
"ga[in]",
"pr[in]t",
"jo[in]t",
"m[in]e",
"[in]terview",
"onl[in]e",
"[in]vestigator",
"ord[in]ary",
"discipl[in]e",
"[in]dependence",
"market[in]g",
"amaz[in]g",
"[in]tense",
"[in]spire",
"[in]volvement",
"dom[in]ate",
"park[in]g",
"compla[in]t",
"spend[in]g",
"k[in]g",
"enterta[in]ment",
"[in]creas[in]g",
"r[in]g",
"tw[in]",
"[in]terpretation",
"eng[in]eer[in]g",
"cl[in]ic",
"[in]ner",
"sw[in]g",
"l[in]e",
"adm[in]istrator",
"p[in]k",
"b[in]d",
"test[in]g",
"[in]stall",
"[in]tention",
"draw[in]g",
"prote[in]",
"Lat[in]",
"Palest[in]ian",
"orig[in]",
"m[in]e",
"cl[in]ical",
"rout[in]e",
"[in]gredient",
"[in]corporate",
"m[in]or",
"develop[in]g",
"[in]dex",
"extraord[in]ary",
"ceil[in]g",
"advertis[in]g",
"sp[in]",
"cloth[in]g",
"pa[in]t",
"w[in]d",
"str[in]g",
"[in]fection",
"cab[in]et",
"shopp[in]g",
"cous[in]",
"[in]itially",
"bl[in]d",
"reta[in]",
"[in]centive",
"decl[in]e",
"[in]terpret",
"hunt[in]g",
"[in]nocent",
"surpris[in]g",
"ma[in]ly",
"f[in]ance",
"s[in]k",
"work[in]g",
"s[in]ger",
"shoot[in]g",
"[in]sight",
"orig[in]ally",
"[in]tellectual",
"imag[in]ation",
"prom[in]ent",
"[in]troduction",
"earn[in]gs",
"dist[in]ction",
"excit[in]g",
"d[in][in]g",
"[in]stance",
"depend[in]g",
"ongo[in]g",
"s[in]ce",
"susta[in]",
"[in]",
"appo[in]tment",
"[in]credible",
"pa[in]ful",
"[in]fant",
"guidel[in]e",
"ma[in]tenance",
"exam[in]ation",
"stand[in]g",
"bomb[in]g",
"pr[in]cipal",
"Palest[in]ian",
"pr[in]t",
"cab[in]",
"p[in]e",
"manufactur[in]g",
"discrim[in]ation",
"appo[in]t",
"dom[in]ant",
"[in]flation",
"[in]stitutional",
"operat[in]g",
"[in]structor",
"gra[in]",
"prov[in]ce",
"nom[in]ation",
"dist[in]guish",
"runn[in]g",
"dist[in]ct",
"fight[in]g",
"cont[in]ued",
"cook[in]g",
"sw[in]g",
"kill[in]g",
"s[in]",
"headl[in]e",
"[in]vasion",
"[in]tensity",
"marg[in]",
"pr[in]cipal",
"record[in]g",
"chang[in]g",
"pa[in]ter",
"re[in]force",
"w[in]",
"crim[in]al",
"capta[in]",
"conta[in]er",
"[in]quiry",
"surpris[in]gly",
"[in]dication",
"sh[in]e",
"concern[in]g",
"[in]vent",
"counsel[in]g",
"[in]sect",
"[in]terrupt",
"trad[in]g",
"cont[in]uous",
"[in]tegrate",
"serv[in]g",
"dr[in]k[in]g",
"f[in]al",
"f[in]ance",
"[in]tegrity",
"[in]terior",
"onl[in]e",
"miss[in]g",
"adm[in]istrative",
"[in]itiate",
"ma[in]stream",
"seem[in]gly",
"[in]spector",
"pla[in]",
"[in]evitable",
"overwhelm[in]g",
"[in]tegration",
"[in]spection",
"dra[in]",
"[in]frastructure",
"curta[in]",
"doma[in]",
"walk[in]g",
"m[in]imum",
"cont[in]u[in]g",
"[in]novation",
"stra[in]",
"adm[in]ister",
"[in]digenous",
"land[in]g",
"underm[in]e",
"[in]telligent",
"conv[in]ced",
"driv[in]g",
"vitam[in]",
"[in]jure",
"uncerta[in]ty",
"doctr[in]e",
"genu[in]e",
"f[in]ish",
"mean[in]gful",
"[in]visible",
"tim[in]g",
"bus[in]essman",
"promis[in]g",
"determ[in]ation",
"happ[in]ess",
"report[in]g",
"dest[in]ation",
"[in]dicator",
"start[in]g",
"eat[in]g",
"h[in]t",
"account[in]g",
"suffer[in]g",
"[in]side",
"ch[in]",
"[in]terior",
"bank[in]g",
"dim[in]ish",
"m[in]imize",
"[in]tent",
"[in]ventory",
"offer[in]g",
"disappo[in]ted",
"gather[in]g",
"outstand[in]g",
"cont[in]ent",
"s[in]k",
"rul[in]g",
"deadl[in]e",
"process[in]g",
"burn[in]g",
"spr[in]g",
"div[in]e",
"[in]spiration",
"[in]vitation",
"gasol[in]e",
"nom[in]ee",
"[in]mate",
"fa[in]t",
"[in]put",
"gr[in]",
"comb[in]ed",
"[in]stantly",
"vacc[in]e",
"vot[in]g",
"will[in]gness",
"ru[in]",
"fasc[in]at[in]g",
"coord[in]ator",
"[in]timate",
"[in]st[in]ct",
"alum[in]um",
"m[in]istry",
"[in]struct",
"underly[in]g",
"[in]credibly",
"[in]fluential",
"uncerta[in]",
"roll[in]g",
"[in]sert",
"m[in]imal",
"coca[in]e",
"[in]structional",
"cas[in]o",
"sibl[in]g",
"[in]teract",
"p[in]",
"pass[in]g",
"encourag[in]g",
"co[in]",
"m[in]imum",
"rem[in]der",
"surround[in]g",
"prelim[in]ary",
"[in]terfere",
"outl[in]e",
"[in]novative",
"[in]stallation",
"swimm[in]g",
"[in]stant",
"tra[in]er",
"Thanksgiv[in]g",
"[in]herit",
"shr[in]k",
"emerg[in]g",
"k[in]gdom",
"terra[in]",
"breath[in]g",
"[in]vade",
"[in]formal",
"well-be[in]g",
"lightn[in]g",
"disappo[in]tment",
"m[in]eral",
"dy[in]g",
"strik[in]g",
"fuck[in]g",
"cl[in]g",
"bl[in]k",
"gr[in]",
"ra[in]",
"programm[in]g",
"[in]tact",
"[in]tellectual",
"[in]terval",
"[in]evitably",
"fem[in]ist",
"constra[in]t",
"stra[in]",
"spr[in]kle",
"[in]stant",
"bless[in]g",
"runn[in]g",
"pla[in]",
"screen[in]g",
"danc[in]g",
"com[in]g",
"dist[in]ctive",
"rout[in]ely",
"[in]vention",
"rega[in]",
"[in]tegrated",
"disturb[in]g",
"devastat[in]g",
"neighbor[in]g",
"coord[in]ate",
"with[in]",
"light[in]g",
"sem[in]ar",
"compell[in]g",
"fly[in]g",
"susta[in]able",
"sp[in]e",
"manag[in]g",
"mar[in]e",
"bor[in]g",
"[in]herent"
]
