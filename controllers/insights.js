var mysql = require('mysql');

exports.controller = function(app, db) {

	app.post('/api/insights', function(req, res) {
		if(req.session.user && req.session.user.level == 0) {
			db.run("INSERT INTO `insights` VALUES(NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",[req.body.database_id, req.body.name, req.body.query, req.body.type, JSON.stringify(req.body.variables||{}), JSON.stringify(req.body.fields||{}), JSON.stringify(req.body.filters||{}), JSON.stringify(req.body.relations||{}), req.body.graph, JSON.stringify(req.body.graphopts||{})] , function(err, row) {
				if(err) {

					res.send(500, err);
				} else {
					res.send(200, {id: this.lastID, database_id: req.body.database_id, name: req.body.name, query: req.body.query, type: req.body.type, variables: req.body.variables||{}, fields: req.body.fields||{}, filters: req.body.filters||{}, relations: req.body.relations||{}, graph: req.body.graph, graphopts: req.body.graphopts||{}});
				}
			});


		} else {
			res.send(401);
		}
	});

	app.put('/api/insights/:id', function(req, res) {
		if(req.session.user && req.session.user.level == 0) {
			db.all("UPDATE `insights` SET database_id=?, name=?, query=?, variables=?, fields=?, filters=?, relations=?, graph=?, graphopts=? WHERE `id` = ?",[req.body.database_id, req.body.name, req.body.query, JSON.stringify(req.body.variables||{}), JSON.stringify(req.body.fields||{}), JSON.stringify(req.body.filters||{}), JSON.stringify(req.body.relations||{}), req.body.graph, JSON.stringify(req.body.graphopts||{}), req.params.id] , function(err) {
				if(err) {

					res.send(500, err);
				} else {
					db.get("SELECT * FROM `insights` WHERE `id` = ?;",[req.params.id] , function(err, row) {
						if(err) {

							res.send(500, err);
						} else {
							row.variables = JSON.parse(row.variables);
							row.filters = JSON.parse(row.filters);
							row.fields = JSON.parse(row.fields);
							row.relations = JSON.parse(row.relations);
							row.graphopts = JSON.parse(row.graphopts);
							res.send(200, row);
						}
					});
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
					row.variables = JSON.parse(row.variables);
					row.filters = JSON.parse(row.filters);
					row.fields = JSON.parse(row.fields);
					row.relations = JSON.parse(row.relations);
					row.graphopts = JSON.parse(row.graphopts);

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
		if(req.session.user && req.session.user.level == 0) {
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