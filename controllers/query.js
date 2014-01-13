var mysql = require('mysql');
var simpleSqlParser = require('simple-sql-parser');

exports.controller = function(app, db) {
	app.post('/api/query/export', function(req,res) {
		if (req.session.user) {
			if (typeof req.body.exportQuery !== 'undefined' && req.body.exportQuery.length) {
				db.serialize(function() {
					db.get("SELECT * FROM `databases` WHERE `id` = ?;", req.body.exportDB, function (err, row) {
						var connection = mysql.createConnection({
							host     : row.host,
							port 	 : row.port,
							database : row.name,
							user     : row.username,
							password : row.password,
						});

						connection.connect(function(err) {
							if (err) {
								res.send(500, 'Cannot connect to database.');
							} else {
								connection.query(req.body.exportQuery, function(err, row) {
									if (err) {
										res.send(500, 'Error, Something went wrong. Please check Your query.');
									} else {
										if (typeof row.fieldCount !== 'undefined' && !row.fieldCount) {
											res.send(200, 'Result is empty.');
										} else {
											var header = new String();
											var contents = new String();

											row.forEach(function (data) {
												var cur = [];

												if (!header.length) {
													header = Object.keys(data).join(',');
												}

												Object.keys(data).forEach(function (test) {
													cur.push(data[test]);
												});

												contents = contents + '\n' + cur.join(',');
											});

											contents = header + contents;

											var time = new Date().getTime();
											var filename = 'foxyexport-' + time +'.csv';

										  	res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  											res.setHeader('Content-type', 'application/octet-stream');

											res.send(contents);
										}
									}
									connection.end();
								});
							}
						});
					});
				});
			} else {
				res.send(500);
			}
		} else {
			res.send(401);
		}
	});
	app.post('/api/query/execute', function(req, res) {
		if(req.session.user) {
			db.get("SELECT * FROM `databases` WHERE `id` = ?;",req.body.database_id , function(err, row) {
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
						var time = new Date();
						var ast = simpleSqlParser.sql2ast(req.body.query);
						if(Object.keys(ast).length == 0) {
							connection.query(req.body.query, function(err, rows) {
								if(err) {
									res.send(500, {errstr: err.message});
								} else {
									res.send(500, {errstr: 'Something went wrong, please submit a bug report, with a query you used'});
								}
								connection.end();
							});
						} else {
							if(typeof ast.LIMIT !== 'undefined') {
								limitOffset = ast.LIMIT.from;
								limitCount = ast.LIMIT.nb;
							}
							ast.SELECT = [{name: 'COUNT(*) AS cnt'}];

							connection.query(simpleSqlParser.ast2sql(ast), function(err, rows) {
								if(err) {
									res.send(500, {errstr: err.message});
									connection.end();
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
										var timeCompleted = new Date();
										if(err) {
											res.send(500, {errstr: err.message});
										} else {
											if(typeof rows.splice === 'undefined') {
												res.send(200, {data:[], found_rows: 0, executed_query: simpleSqlParser.ast2sql(newAst), execution_time: timeCompleted.getTime() - time.getTime()});
											} else {
												res.send(200, {data: rows, found_rows: totalCount, executed_query: simpleSqlParser.ast2sql(newAst), execution_time: timeCompleted.getTime() - time.getTime()});
											}
										}
										connection.end();
									});
								}
							});
						}
						
						
					}
				});
			});


		} else {
			res.send(401);
		}
	});

};