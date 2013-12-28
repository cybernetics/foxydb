var progress = require('progress');
var fs = require('fs');

var version = 3;
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
					db.run("CREATE TABLE `insights` (id INTEGER PRIMARY KEY AUTOINCREMENT, database_id INTEGER, name TEXT, query TEXT, type INTEGER, variables TEXT, fields TEXT, filters TEXT, relations TEXT);", function(err, row) { bar.tick() });
				});
			} else {
				upgrade(db);
			}
		});
	});

}

function upgrade(db) {
	var currentVersion = parseInt(fs.readFileSync('.version'));
	if(currentVersion < version) {
		console.log('Upgrading the database.')
		var bar = new progress(':percent :bar', {total: version - currentVersion, width: 30});
		for(var i=currentVersion+1; i <= version; i++) {
			switch(i) {
				case 2:
					db.run("ALTER TABLE `insights` ADD COLUMN fields TEXT;", function(err, row) {
						db.run("ALTER TABLE `insights` ADD COLUMN filters TEXT;", function(err, row) {
							bar.tick();
						});
					});
					break;
				case 3:
					db.run("ALTER TABLE `insights` ADD COLUMN relations TEXT;", function(err, row) {
						bar.tick();
					});
					break;	
			}
			fs.writeFileSync('.version', i);
		}
	}
}