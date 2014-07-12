var apn = require('apn');

var apn_connection = new apn.connection({
  gateway:'gateway.sandbox.push.apple.com'
});
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

export send = function(req, res) {
  var note = new apn.notification();
  note.setAlertText(req.message);
  note.badge = 1;

  apn_connection.pushNotification(note, req.push.token);
}
