var mysql = require('mysql');
var check = require('validator').check;
var flow = require('flow');
var cache = {};

exports.controller = function(app, db) {
	app.get('/api/database/:id', function(req, res) {
		if (req.session.user) {
			var query;

			if (req.session.user.level == 0) {
				query = "SELECT * FROM `databases` WHERE `id` = ?;";
			} else {
				query = "SELECT `id`, `title`, `host`, `port`, `name`, `username` FROM `databases` WHERE `id` = ?;";
			}

			db.serialize(function() {
				db.get(query, req.params.id, function(err, row) {
					if (err) {
						res.send(401, err);
					} else {
						res.send(200, row)
					}
				});
			});

		} else {
			res.send(401);
		}
	});
	app.get('/api/databases', function(req, res) {
		if(req.session.user) {
			var query; 

			if (req.session.user.level == 0) {
				query = "SELECT * FROM `databases`;";
			} else {
				query = "SELECT `id`, `title` FROM `databases`;";
			}

			db.serialize(function() {
				db.all(query, function(err, rows) {
					if (err) {
						res.send(401, err);
					} else {
						res.send(200, rows);
					}
				});
			});
		} else {
			res.send(401);
		}
	});

	app.get('/api/databases/structure/:database_id', function(req, res) {
		if(req.session.user) {
			if(typeof cache[req.params.database_id] == 'undefined') {
				db.get("SELECT * FROM `databases` WHERE `id` = ?;",req.params.database_id , function(err, row) {
					if(err || !row) {
						return res.send(500, {errstr: err || 'Database not found'});
					}
					var connection = mysql.createConnection({
						host     : row.host,
						port     : row.port,
						database : row.name,
						user     : row.username,
						password : row.password,
					});
					var dbName = row.name;
					var structure = {};
					connection.connect(function(err) {
						if(err) {
							res.send(400, {error: {text: 'Cannot connect to the database', field: 'host'}});
						} else {
							connection.query('SHOW TABLES;', function(err, rows) {
								if(err) {
									res.send(500, {errstr: err.message});
								} else {
									flow.serialForEach(rows, function(row) {
										var f = this;
										connection.query('SHOW COLUMNS FROM ' + row['Tables_in_'+dbName], function(err, rows) {
											structure[row['Tables_in_'+dbName]] = rows;
											f();
										});
									}, function(error, newVal) {

									}, function() {
										connection.end();
										cache[req.params.database_id] = structure;
										setTimeout(function() {
											delete cache[req.params.database_id];
										},3600000);
										res.send(structure);
									});
								}

							});
						}
					});
				});

			} else {
				res.send(cache[req.params.database_id]);
			}

		} else {
			res.send(401);
		}
	});
	app.put('/api/database/:id', function(req, res) {
		if(GLOBAL.demoMode) {
			res.send(401, 'Updating databases is disabled in demo mode');
		} else if(req.session.user && req.session.user.level == 0) {
			try {
				check(req.body.title, {
					notEmpty: 'Title is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'title'}});
			}

			try {
				check(req.body.host, {
					notEmpty: 'Hostname is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'host'}});
			}

			try {
				check(req.body.port, {
					notEmpty: 'Port is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'port'}});
			}

			try {
				check(req.body.name, {
					notEmpty: 'Name is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'name'}});
			}

			try {
				check(req.body.username, {
					notEmpty: 'Username is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'username'}});
			}

			var connection = mysql.createConnection({
				host     : req.body.host,
				port 	 : req.body.port,
				database : req.body.name,
				user     : req.body.username,
				password : req.body.password
			});

			connection.connect(function(err) {
				if(err) {
					res.send(400, {error: {text: 'Cannot connect to the database', field: 'host'}});
				} else {
					db.run("UPDATE `databases` SET `title` = ?, `host` = ?, `port` = ?, `name` = ?, `username` = ?, `password` = ? WHERE `id` = ?;", [req.body.title, req.body.host, req.body.port, req.body.name, req.body.username, req.body.password, req.params.id], function(err) {
						if(err) {
							res.send(500, err);
						} else {
							res.send(200, {id: req.params.id, title: req.body.title, host: req.body.host, port: req.body.port,name : req.body.name, username: req.body.username, password: req.body.password});
						}
					})
				}
			});
		} else {
			res.send(401);
		}
	});
	
	app.delete('/api/database/:id', function(req, res) {
		if (req.session.user && req.session.user.level == 0) {
			db.run('DELETE FROM `databases` WHERE `id`= ?', req.params.id, function(err) {
				if (err) {
					res.send(500, err);
				} else {
					res.send(200);
				}
			});
		} else {
			res.send(401);
		}
	});

	app.post('/api/databases', function(req, res) {
		if(GLOBAL.demoMode) {
			res.send(401, 'Creating databases is disabled in demo mode');
		} else if(req.session.user && req.session.user.level == 0) {
			try {
				check(req.body.title, {
					notEmpty: 'Title is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'title'}});
			}

			// try {
			// 	check(req.body.type, {
			// 		notEmpty: 'Type is required'
			// 	}).notEmpty();
			// } catch (e) {
			// 	res.send(400, {error: {text: e.message, field: 'type'}});
			// }

			try {
				check(req.body.host, {
					notEmpty: 'Hostname is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'host'}});
			}

			try {
				check(req.body.port, {
					notEmpty: 'Port is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'port'}});
			}

			try {
				check(req.body.name, {
					notEmpty: 'Name is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'name'}});
			}

			try {
				check(req.body.username, {
					notEmpty: 'Username is required'
				}).notEmpty();
			} catch (e) {
				res.send(400, {error: {text: e.message, field: 'username'}});
			}

			var connection = mysql.createConnection({
				host     : req.body.host,
				port 	 : req.body.port,
				database : req.body.name,
				user     : req.body.username,
				password : req.body.password
			});
			connection.connect(function(err) {
				if(err) {
					res.send(400, {error: {text: 'Cannot connect to the database', field: 'host'}});
				} else {
					db.run("INSERT INTO `databases` VALUES(NULL, ?, ?, 'mysql', ?, ?, ?, ?, ?)", [req.session.user.id, req.body.title, req.body.host, req.body.port, req.body.name, req.body.username, req.body.password], function(err) {
						if(err) {
							res.send(500, err);
						} else {
							res.send(200, {id: this.lastID, title: req.body.title});
						}
					})
				}
			});
		} else {
			res.send(401);
		}
	});

}