var progress = require('progress');
var fs = require('fs');

var version = 1;
var tables = 3; //How many tables we need to create
exports.install = function(db) {

	db.serialize(function() {
		db.get("SELECT `name` FROM `sqlite_master` WHERE `type` = 'table' AND `name` = 'users';", function(err, row) {
			if(typeof row == 'undefined') {
				console.log('First run detected. We will now create the required tables.')
				var bar = new progress(':percent :bar', {total: tables, width: 30});
				fs.writeFileSync('.version', version);
				db.serialize(function() {
					db.run("CREATE TABLE `users` (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, level INTEGER);", function(err, row) { bar.tick() });
					db.run("CREATE TABLE `databases` (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, type TEXT, host TEXT, port INTEGER, name TEXT, username TEXT, password TEXT);", function(err, row) { bar.tick() });
					db.run("CREATE TABLE `insights` (id INTEGER PRIMARY KEY AUTOINCREMENT, database_id INTEGER, name TEXT, query TEXT);", function(err, row) { bar.tick() });
				});
			}
		});
	});

}

exports.upgrade = function(db) {
	//TODO create upgrade procedure
}