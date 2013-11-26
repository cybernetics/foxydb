var mysql = require('mysql');
var check = require('validator').check;

exports.controller = function(app, db) {
	app.get('/api/databases', function(req, res) {
		if(req.session.user) {
			db.serialize(function() {
				db.all("SELECT `id`, `title` FROM `databases`;", function(err, rows) {
					res.send(200, rows);
				});
			});
		} else {
			res.send(401);
		}
	});

	app.post('/api/databases', function(req, res) {
		if(req.session.user) {
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
				password : req.body.password,
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