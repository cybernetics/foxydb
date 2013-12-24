var config = require('./config.js');
var express = require('express');
var fs = require('fs');
var sqlite = require('sqlite3');
var db = new sqlite.Database('foxydb.sqlite');

var installer = require('./install.js');
installer.install(db);
installer.upgrade(db);

var app = express();
var server = require('http').createServer(app);


app.configure(function() {
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({secret: config.application.sessionSecret}));
	app.use(express['static'](__dirname + '/public'));
});

fs.readdirSync('./controllers').forEach(function (file) {
  if(file.substr(-3) == '.js') {
      route = require('./controllers/' + file);
      route.controller(app, db);
  }
});

app.get('*', function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
});




server.listen(config.application.port);
console.log('Listening on port ' + config.application.port);