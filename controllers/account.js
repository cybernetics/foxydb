var check = require('validator').check;
var crypto = require('crypto');

exports.controller = function(app, db) {

	app.get('/api/user', function(req, res) {
		if(req.session.user) {
			db.serialize(function() {
				db.get("SELECT * FROM `users` WHERE `id` = ?;",req.session.user.id , function(err, row) {
					if(typeof row == 'undefined') {
						res.send(404);
					} else {
						res.send(200, row);
					}
				});
			});
		} else {
			res.send(404);
		}
	});
	app.get('/api/user/:id', function(req, res) {
		if(req.session.user && req.session.user.level == 0) {
			db.serialize(function() {
				db.get("SELECT name, email, level, id FROM `users` WHERE `id` = ?;",req.params.id , function(err, row) {
					if(typeof row == 'undefined') {
						res.send(404);
					} else {
						res.send(200, row);
					}
				});
			});
		} else {
			res.send(401, 'Only administrators are allowed to manage users');
		}
	});
	app.put('/api/user/:id', function(req, res) {
		if (req.session.user && req.session.user.level == 0) {
			db.serialize(function() {
				var query;
				var values = [];

				if (typeof req.body.password === 'undefined' || !req.body.password.length) {
					query = "UPDATE `users` SET `name` = ?, `email` = ?, `level` = ? WHERE `id` = ?;";
					values = [req.body.name, req.body.email, req.body.level, req.params.id];
				} else {
					var shasum = crypto.createHash('sha1');
					shasum.update(req.body.password);

					query = "UPDATE `users` SET `name` = ?, `email` = ?, `password` = ?, `level` = ? WHERE `id` = ?;";
					values = [req.body.name, req.body.email, shasum.digest('hex'), req.body.level, req.params.id];
				}

				db.run(query, values, function(err) {
					if (err) {
						res.send(500, {error: err});
					} else {
						res.send(200, {});
					}
				});
			});
		}
	});
	app.delete('/api/user/:id', function(req, res) {
		if (req.session.user && req.session.user.level == 0) {
			if (req.params.id != req.session.user.id) {
				db.serialize(function() {
					db.run('DELETE FROM `users` WHERE `id` = ?', [req.params.id], function(err) {
						if (err) {
							res.send(500, {error: err});
						} else {
							res.send(200, {});
						}
					});
				});
			} else {
				req.send(500, 'You cannot delete Your account.');
			}
		}
	});
	app.get('/api/users', function(req, res) {
		if(req.session.user && req.session.user.level == 0) {
			db.serialize(function() {
				db.all("SELECT name, email, level, id FROM `users`;" , function(err, rows) {
					if(err) {
						res.send(500, err);
					}
					res.send(200, rows);
				});
			});
		} else {
			res.send(401, 'Only administrators are allowed to manage users');
		}
	});
	app.post('/api/users/login', function(req, res) {

		try {
			check(req.body.email, {
				notEmpty: 'E-Mail is required',
				isEmail: 'Invalid E-Mail'
			}).notEmpty().isEmail();
		} catch (e) {
			res.send(400, {error: {text: e.message, field: 'email'}});
		}

		try {
			check(req.body.password, {
				notEmpty: 'Password is required'
			}).notEmpty();
		} catch (e) {
			res.send(400, {error: {text: e.message, field: 'password'}});
		}

		db.serialize(function() {
			var shasum = crypto.createHash('sha1');
			shasum.update(req.body.password);
			db.get("SELECT * FROM `users` WHERE `email` = ? AND `password` = ?;",[req.body.email, shasum.digest('hex')], function(err, row) {
				if(typeof row == 'undefined') {
					res.send(404, {error: {text: 'Wrong E-Mail or password', field: 'email'}});
				} else {
					req.session.user = {loggedIn: true, id: row.id, level: row.level};
					res.send(row);
				}
			});
		});

	});

	app.delete('/api/users/logout', function (req, res) {
		if (req.session.user) {
			delete req.session.user;
			res.send(200, {});
		} else {
			res.send(401);
		}
	});

	app.post('/api/users', function(req, res) {

		//Validate fields
		if(typeof GLOBAL.frontConfig.allowRegister !== 'undefined' && !GLOBAL.frontConfig.allowRegister && (!req.session.user || req.session.user && req.session.user.level != 0)) {
			return res.send(401, "Registration is disabled by administrator.");
		}

		try {
			check(req.body.name, {
				notEmpty: 'Name is required'
			}).notEmpty();
		} catch (e) {
			res.send(400, {error: {text: e.message, field: 'name'}});
		}

		try {
			check(req.body.email, {
				notEmpty: 'E-Mail is required',
				isEmail: 'Invalid E-Mail'
			}).notEmpty().isEmail();
		} catch (e) {
			res.send(400, {error: {text: e.message, field: 'email'}});
		}

		try {
			check(req.body.password, {
				notEmpty: 'Password is required',
				len: 'Password must be at least 6 characters long'
			}).notEmpty().len(6);
		} catch (e) {
			res.send(400, {error: {text: e.message, field: 'password'}});
		}
		var level = 1;

		if (req.session.user && req.session.user.level == 0) {
			level = req.body.level || 1;
		}

		//Check if E-Mail is already used
		db.serialize(function() {
			db.get("SELECT * FROM `users` WHERE `email` = ?;",req.body.email , function(err, row) {
				if(typeof row == 'undefined') {
					db.get("SELECT `id` FROM `users` LIMIT 1;", function(err, row) {
						if (typeof row == 'undefined') {
							level = 0;
						}
						
						var shasum = crypto.createHash('sha1');
						shasum.update(req.body.password);
						db.run("INSERT INTO `users` VALUES(NULL, ?, ?, ?, ?)", [req.body.name, req.body.email, shasum.digest('hex'), level], function(err) {
							if(err) {
								res.send(500, err);
							} else {
								if (!req.session.user) {
									req.session.user = {loggedIn: true, id: this.lastID, level: level};
								}

								res.send(200, {id: this.lastID, name: req.body.name, email: req.body.email, level: level});
							}
						})
					});
				} else {
					res.send(400, {error: {text: 'E-Mail already used', field: 'email'}});
				}
			});
		});

	});
}