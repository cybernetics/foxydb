var check = require('validator').check;
var crypto = require('crypto')

exports.controller = function(app, db) {

	app.get('/api/users', function(req, res) {
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
					req.session.user = {loggedIn: true, id: row.id};
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
		if(typeof GLOBAL.frontConfig.allowRegister !== 'undefined' && !GLOBAL.frontConfig.allowRegister) {
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

		//Check if E-Mail is already used
		db.serialize(function() {
			db.get("SELECT * FROM `users` WHERE `email` = ?;",req.body.email , function(err, row) {
				if(typeof row == 'undefined') {
					var shasum = crypto.createHash('sha1');
					shasum.update(req.body.password);
					db.run("INSERT INTO `users` VALUES(NULL, ?, ?, ?, 0)", [req.body.name, req.body.email, shasum.digest('hex')], function(err) {
						if(err) {
							res.send(500, err);
						} else {
							req.session.user = {loggedIn: true, id: this.lastID};
							res.send(200, {id: this.lastID, name: req.body.name, email: req.body.email});
						}
					})
				} else {
					res.send(400, {error: {text: 'E-Mail already used', field: 'email'}});
				}
			});
		});

	});
}