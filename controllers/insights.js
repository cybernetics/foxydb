var mysql = require('mysql');

exports.controller = function(app, db) {

	app.post('/api/insights', function(req, res) {
		if(req.session.user) {
			db.run("INSERT INTO `insights` VALUES(NULL, ?, ?, ?);",[req.body.database_id, req.body.name, req.body.query] , function(err, row) {
				if(err) {

					res.send(500, err);
				} else {
					res.send(200, {id: this.lastID, database_id: req.body.database_id, name: req.body.name, query: req.body.query});
				}
			});


		} else {
			res.send(401);
		}
	});

	app.get('/api/insights/:id', function(req, res) {
		if(req.session.user) {
			db.get("SELECT * FROM `insights` WHERE `id` = ?;",[req.params.id] , function(err, row) {
				if(err) {

					res.send(500, err);
				} else {
					res.send(200, row);
				}
			});


		} else {
			res.send(401);
		}
	});
	app.get('/api/insights', function(req, res) {
		if(req.session.user) {
			db.all("SELECT * FROM `insights`", function(err, rows) {
				if(err) {

					res.send(500, err);
				} else {
					res.send(200, rows);
				}
			});


		} else {
			res.send(401);
		}
	});
	app.delete('/api/insights/:id', function(req, res) {
		if(req.session.user) {
			db.all("DELETE FROM `insights` WHERE `id` = ?",[req.params.id] , function(err) {
				if(err) {

					res.send(500, err);
				} else {
					res.send(200, {});
				}
			});


		} else {
			res.send(401);
		}
	});
};