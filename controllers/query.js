var mysql = require('mysql');

exports.controller = function(app, db) {

	app.post('/api/query/execute', function(req, res) {
		if(req.session.user) {
			db.get("SELECT * FROM `databases` WHERE `id` = ?;",req.body.database_id , function(err, row) {
				console.log(err, row, req.body);
				var connection = mysql.createConnection({
					host     : row.host,
					port 	 : row.port,
					database : row.name,
					user     : row.username,
					password : row.password,
				});
				connection.connect(function(err) {
					if(err) {
						res.send(400, {error: {text: 'Cannot connect to the database', field: 'host'}});
					} else {
						connection.query(req.body.query, function(err, rows) {
							console.log(typeof rows);
							if(err) {

								res.send(500, {errstr: err.message});
							} else {
								if(typeof rows.splice === 'undefined') {
									res.send(200, {data:[], found_rows: 0});
								} else {
									len = rows.length;

									res.send(200, {data: rows.splice(req.body.offset, req.body.row_count), found_rows: len});
								}
							}
							connection.end();
						});
					}
				});
			});


		} else {
			res.send(401);
		}
	});

};