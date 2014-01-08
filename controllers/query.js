var mysql = require('mysql');
var simpleSqlParser = require('simple-sql-parser');

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
						var limitOffset = -1;
						var limitCount = -1;
						var totalCount = 0;
						var ast = simpleSqlParser.sql2ast(req.body.query);
						if(typeof ast.LIMIT !== 'undefined') {
							limitOffset = ast.LIMIT.from;
							limitCount = ast.LIMIT.nb;
						}
						ast.SELECT = [{name: 'COUNT(*) AS cnt'}];

						connection.query(simpleSqlParser.ast2sql(ast), function(err, rows) {
							if(err) {
								res.send(500, {errstr: err.message});
							} else {
								totalCount = limitCount;
								if(rows.length > 0) {
									totalCount = rows[0].cnt;	
								}
									
								var newAst = simpleSqlParser.sql2ast(req.body.query);

								if(limitOffset === -1) {
									newAst.LIMIT = {nb:req.body.row_count, from: req.body.offset};
								} else {
									newAst.LIMIT = {nb:req.body.row_count, from: parseInt(req.body.offset)+parseInt(limitOffset)};
								}
								connection.query(simpleSqlParser.ast2sql(newAst), function(err, rows) {
									if(typeof rows.splice === 'undefined') {
										res.send(200, {data:[], found_rows: 0});
									} else {
										res.send(200, {data: rows, found_rows: totalCount, executed_query: simpleSqlParser.ast2sql(newAst)});
									}
								});
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