define([
	'jquery',
	'can',
	'parsley',
	'parsleyerror',
	'formParams',
	'app/models/database',
	'app/models/insight',
	'ace/ace',
	'ace/mode-sql',
	'ace/theme-github',
	'ace/ext-language_tools',
	'can/util/object',
	'jquerypp/event/drag',
	'jquerypp/event/drop',
	'rickshaw',
	'css!../../../css/rickshaw.min'
], function(
	$,
	can,
	undefined,
	parsleyError
) {
	can.Control(
		'Controller.Insight',
		{

		},
		{
			changed: false,
			langTools: null,
			operators: {between: 'BETWEEN', equal: '=', ne: '<>', lt: '<', lte: '<=', gt: '>', gte: '>=', like: 'LIKE', in: 'IN', relation: 'relation'},
			init: function(element, options) {
				var self = this;

				$(window).bind('beforeunload', function() {
					if (self.changed) {
						return "Insight was updated, maybe You should save it?";
					}
				});
			},
			tables: [],
			fields: [],
			currentResults: {},
			currentPage: 0,
			edit: function(options) {
				var self = this;

				var sqlCompleter = {
					sqlKeywords: ['SELECT', 'FROM', 'DISTINCT', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIKE', 'IN', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'BETWEEN', 'UNION', 'NOT', 'NULL'],
					sqlFunctions: ['AVG()', 'COUNT()', 'FIRST()', 'LAST()', 'MAX()', 'MIN()', 'SUM()', 'MID()', 'LEN()', 'ROUND()', 'NOW()', 'CONCAT()', 'RAND()'],
					getCompletions: function(editor, session, pos, prefix, callback) {
						if (prefix.length === 0) { callback(null, []); return }
			            var results = [];
			            var filteredKeywords = this.sqlKeywords.filter(function(element) {
			            	if(element.indexOf(prefix.toUpperCase()) !== -1){
			            		return true;
			            	}
			            });
			            var filteredFunctions = this.sqlFunctions.filter(function(element) {
			            	if(element.indexOf(prefix.toUpperCase()) !== -1){
			            		return true;
			            	}
			            });
			            var filteredTables = self.tables.filter(function(element) {
			            	if(element.toUpperCase().indexOf(prefix.toUpperCase()) !== -1){
			            		return true;
			            	}
			            });
			            var filteredFields = self.fields.filter(function(element) {
			            	if(element.toUpperCase().indexOf(prefix.toUpperCase()) !== -1){
			            		return true;
			            	}
			            });
			            filteredKeywords.forEach(function(item) {
			            	results.push({name: item, value: item, score: 0, meta: 'Keyword'});
			            });
			            filteredFunctions.forEach(function(item) {
			            	results.push({name: item, value: item, score: 0, meta: 'Function'});
			            });
			            filteredTables.forEach(function(item) {
			            	results.push({name: item, value: item, score: 0, meta: 'Table'});
			            });
			            filteredFields.forEach(function(item) {
			            	results.push({name: item, value: item, score: 0, meta: 'Field'});
			            });
			            callback(null, results);
					}
				};

				self.options = options;
				var type = 0;
				if(can.route.attr('type')) {
					type = can.route.attr('type');
				}
				self.insight = new Model.Insight({query:'-- Type your query here', current: true, name: '', type: type, variables: {}, fields: {}, filters: {}, relations: {}, graph: 0, graphopts: {}});
				self.element.data('insight', self);
				Model.Database.findAll().then(function(data) {
					self.databases = data;

					self.element.find('.sidebar').html('//js/app/views/pages/insight/sidebar.ejs', {databases: self.databases, insight: self.insight});
					self.element.find('.inner').html('//js/app/views/pages/insight/content.ejs', {insight: self.insight});
					self.element.find('.tools').html('//js/app/views/pages/insight/tools.ejs', {insight: self.insight});
					self.langTools = ace.require("ace/ext/language_tools");
					var editor = ace.edit(self.element.find('.sql')[0]);
					self.editor = editor;
					//setup autocomplete

					self.editor.setOptions({
						enableBasicAutocompletion: true
					});
					self.editor.completers = [sqlCompleter];
					
					if(typeof self.options.id === 'undefined') {
							self.insight.attr('database_id',data[0].attr('id'));
							Global.tabs.push(self.insight);
							self.setupDragDrop();
							self.getStructure();
							self.changed = false;
					} else {
						Model.Insight.findOne({id: self.options.id},function(response) {
							if(!response.attr('variables')) {
								response.attr('variables', {});
							}

							if(!response.attr('fields')) {
								response.attr('fields', {});
							}

							if(!response.attr('filters')) {
								response.attr('filters', {});
							}

							if(!response.attr('relations')) {
								response.attr('relations', {});
							}
							if(!response.attr('graphopts')) {
								response.attr('graphopts', {});
							}
							self.insight.attr(response.attr(), true);
							self.insight.attr({variables:response.attr('variables')});
							self.insight.attr({fields:response.attr('fields')});
							self.insight.attr({filters:response.attr('filters')});
							self.insight.attr({relations:response.attr('relations')});
							self.insight.attr({graphopts:response.attr('graphopts')});
							
							self.updateTabs();
							self.getStructure();
							self.setupDragDrop();

							self.element.find('.applyButton').click();
							self.changed = false;
						});					

					}

					self.editor.setTheme("ace/theme/tomorrow");
					self.editor.getSession().setMode("ace/mode/mysql");
					self.element.find('.sql').css('font-size',12);
					self.editor.getSession().setUseWrapMode(true);
					self.editor.renderer.setShowGutter(false);

					self.editor.on('change', function() {
						self.getVariables();
						self.changed = true;
					});
					
					self.insight.bind('query',function(event, newVal, oldVal) {
						self.editor.setValue(newVal);
					});

					self.insight.bind('change', function(ev, attr, how, newVal, oldVal) {
						var isField = (attr.indexOf('fields.') == 0);
						var isFilter = (attr.indexOf('filters.') == 0);
						var counter = 0;

						if (isField || isFilter) {
							if (isFilter && how == 'remove') {
								self.insight.attr('filters').each(function (item) {
									if (item.table == oldVal.table) {
										counter++;
									}
								});

								if (!counter) {
									self.insight.attr('fields').each (function (item, index) {
										if (item.table == oldVal.table) {
											self.insight.removeAttr('fields.' + index);
										}
									});

									self.insight.removeAttr('relations.' + oldVal.table);
								}
							}

							self.changed = true;
							self.generateQuery();
						}
					});

				});
			},
			updateTabs: function() {
				var self = this;
				$('.tabs .new').removeClass('noshadow');
				var found = false;
				Global.tabs.forEach(function(tab) {
					tab.attr({current: false});
					if(parseInt(self.insight.attr('id')) === tab.attr('id')){
						tab.attr('current', true);
						found = true;
					}
				});
				if(!found) {
					self.insight.attr({current: true});
					Global.tabs.push(self.insight);
				}
				$(window).resize();
				Global.tabs.forEach(function(tab, index) {
					if(typeof tab.attr('id') === 'undefined'){
						$('#insight_0').remove();
						tab.destroy();
					}
				});

			},
			setupDragDrop: function() {
				var self = this;
				if(self.insight.attr('type') == 0) {
					self.element.find('.dragHere').on({
						'dropon': function(ev, drop, drag) {
							var id;
							var found = false;
							var tmpid = ("id_" + new Date().getTime() + (Math.random() * 100000)).replace('.','');
							if (drop.element.hasClass('fields')) {

								self.insight.attr('filters').each (function (item, index) {
									if (item.table == drag.element.data('table')) {
										found = true;
									}
								});

								if (found) {
									id = drag.element.data('table') + '_' + drag.element.data('field').attr('Field');
									drag.element.data('id', id);

									if (!self.insight.attr('fields.' + id)) {
										self.insight.attr('fields.' + id, drag.element.data());
									}
								} else {
									alert('You can only use fields found in filters tables');
								}

							} else if (drop.element.hasClass('filters')) {
								id = drag.element.data('table') + '_' + drag.element.data('field').attr('Field') + '_' + tmpid;
								drag.element.data('id', id);

								if(!self.insight.attr('relations.' + drag.element.data('table'))) {
									self.insight.attr('relations.' + drag.element.data('table'), {table: drag.element.data('table'), relations: []});
								}
								self.insight.attr('filters.' + id, {field: drag.element.data('field').attr(), table: drag.element.data('table'), id: drag.element.data('id')});
							}
						}
					});

				}
			},
			getStructure: function() {
				var self = this;

				if(self.insight.attr('type') == 0) {
					self.editor.setReadOnly(true);
				}

				self.element.find('.structure').html('//js/app/views/pages/insight/structure.ejs', {structure: {}, insight: self.insight});

				$.get('/api/databases/structure/'+self.insight.attr('database_id'), function(response) {
					var res = {};
					can.each(response, function(item, index) {
						res[index] = new can.Map(item);
					});
					self.tables = Object.keys(res);
					self.fields = [];
					Object.keys(res).forEach(function(table) {
						Object.keys(res[table]).forEach(function(field) {
							if(typeof res[table][field].Field !== 'undefined') {
								self.fields.push(res[table][field].Field);
							}
						})
					});
					self.element.find('.structure').html('//js/app/views/pages/insight/structure.ejs', {structure: res, insight: self.insight});
					//self.element.find('.structure .list .item').popup();
					$(window).resize();
					if(self.insight.attr('type') == 0) {
						//setup drag/drop
						self.element.find('.structure .list .item').on(
							{
								'draginit': function(ev, drag) {
									
									var newDrag = drag.ghost();
									newDrag.addClass('ghost');
									self.element.find('.structure').append(newDrag.remove());
									drag.representative(self.element.find('.structure .ghost'));
									
									var drops = self.element.find('.dragHere');
									drops.each(function(index, drop) {
										if($(drop).hasClass('hidden')) {
											$(drop).addClass('dragged');
											$(drop).css({
												top: Math.floor($(drop).prev().position().top)-1,
												left: $(drop).prev().position().left-1,
												height: $(drop).prev().outerHeight()+2,
												width: $(drop).prev().width()+2,
												lineHeight: ($(drop).prev().innerHeight()-16)+'px'
											});
										}
									});
								},
							
								'dragend': function(ev, drag) {
									var drops = self.element.find('.dragHere');
									drops.each(function(index, drop) {
										$(drop).removeClass('dragged');
										$(drop).css({
											top: '',
											height: '',
											width: '',
											lineHeight: ''
										});
									});
								}
							}
						);
					}
				}).fail(function (response) {
					self.element.find('.structure .message').addClass('red').html(response.responseJSON.errstr);
				});

			},
			getVariables: function() {
				var self = this;
				var value = this.editor.getValue();
				var vars = value.match(/\:[a-zA-Z0-9]+\:/g);

				if(vars) {
					vars.forEach(function(item, index) {
						if(!self.insight.attr('variables.' + item.replace(/\:/g,''))) {
							self.insight.attr('variables.' + item.replace(/\:/g,''), '');
						}
					});
				}
				var currentVars = self.insight.attr('variables');

				if(currentVars) {
						currentVars.each(function(item, index) {
						if(vars) {
							if(vars.indexOf(':' + index + ':') == -1) {
								self.insight.attr('variables').removeAttr(index);
							}
						} else {

							can.each(self.insight.attr('variables').attr(),function(item, index) {
								self.insight.attr('variables').removeAttr(index);
							});

						}
					});
				}
				can.trigger(self.insight.attr('variables'),'length');

			},
			generateQuery: function () {
				var self = this;
				var	query = new String();
				var	fields = new Array();
				var	field = new String();
				var	filters = new Array();
				var	table = new String();
				var	where = new String();
				var	wheres = new Array();
				var	tables = new Array();
				var	relations = new Array();
				var operator;

				self.element.find('.exportButton').data('export', false);
				self.element.find('.exportButton').addClass('disabled');

				query = 'SELECT ';
				self.insight.attr('fields').each(function(item, index) {

					if (item.field.as) {
						field = '`' + item.table + '`.`' + item.field.Field + '` AS `' + item.field.as + '`';
					} else {
						field = '`' + item.table + '`.`' + item.field.Field + '`';
					}

					fields.push(field);

					table = '`' + item.table + '`';

					if (tables.indexOf(table) == -1) {
						tables.push (table);
					}

				});

				self.insight.attr('filters').each(function(item, index) {
					filters.push('`' + item.table + '`.`' + item.field.Field + '`');

					if (typeof item.field.operator !== 'undefined') {
						if (typeof item.field.val !== 'undefined') {
							operator = item.field.operator;

							switch (operator) {
								case 'between': {
									where = item.field.val.join(' AND ');
									break;
								}
								case 'in': {
									where = '(' + item.field.val[0] + ')';
									break;
								}
								case 'relation': {
									where = item.field.val.join('.');
									operator = 'equal';
									break;
								}
								default: {
									where = item.field.val[0];
									where = '\'' + where.replace(/\'/g, "\'") + '\'';

									break;
								}
							}
						}
						wheres.push('`' + item.table + '`.`' + item.field.Field + '` ' + self.operators[operator] + ' ' + where);
					}

					table = '`' + item.table + '`';

					if (tables.indexOf(table) == -1) {
						tables.push (table);
					}

				});

				if (!(fields.length + filters.length)){
					query = '-- Drag fields or filters to create insight';
				} else {
					if (!fields.length) {
						fields.push('*');
					}

					query = query + fields.join(',') + ' FROM ' + tables.join(', ');

					wheres = wheres.concat(relations);
					if (wheres.length) {
						query +=  ' WHERE ' + wheres.join(' AND ');
					}
				}

				self.insight.attr('query', query + ';');
				self.editor.setValue(self.insight.attr('query'));
			},
			'.relationCancel click': function (element, event) {
				event.preventDefault();

				element.parents('.innerUpdate').hide();
				element.parents('div').siblings('.relationNew').show();
				element.parents('div').siblings('.relationsInner').show();
				
			},
			'.relationNew click': function (element, event) {
				event.preventDefault();

				element.hide();
				element.siblings('.innerUpdate').show();

				if (element.siblings('.innerUpdate').find('.relationCurrent:visible').length) {
				 	element.siblings('.innerUpdate').find('.relationCurrent:visible').html('//js/app/views/pages/insight/selectcolumns.ejs', {columns: this.element.find('.' + element.parents('li').data('field').table).data('table')});
				 	element.siblings('.innerUpdate').find('.relationTable:visible').html('//js/app/views/pages/insight/selecttable.ejs', {rels: this.insight.attr('relations'), table: element.parents('li').data('field').table});
				 	element.siblings('.innerUpdate').find('.relationColumn').attr('disabled', true);
				 	element.siblings('.innerUpdate').find('.relationUpdate').hide();
				 	element.siblings('.innerUpdate').find('.relationSave').show();
				 	element.siblings('.relationsInner').hide();
				}
			},
			'.relationsInner span click': function (element, event) {
				event.preventDefault();
				event.stopImmediatePropagation();

				var elm = element.parents('li');
				var form = elm.parents('ul').siblings('.innerUpdate');
				var datas = elm.data('field').relateto['id_'+elm.index()];

				form.find('.relationCurrent').html('//js/app/views/pages/insight/selectcolumns.ejs', {columns: this.element.find('.' + elm.data('field').table).data('table'), selected: datas.field});
				form.find('.relationColumn').html('//js/app/views/pages/insight/selectcolumns.ejs', {columns: this.element.find('.' + datas.reltable).data('table'), selected: datas.relfield});
				form.find('.relationTable').html('//js/app/views/pages/insight/selecttable.ejs', {rels: this.insight.attr('relations'), table: datas.table, selected: datas.reltable});
				form.find('.relationColumn').attr('disabled', false);
			 	form.find('.relationUpdate').data('updateId', elm.index());
			 	form.find('.relationUpdate').show();
			 	form.find('.relationSave').hide();
				form.siblings('.relationNew').hide();
				elm.parents('ul.relationsInner').hide();
				form.show()
			},
			'.relationSave, .relationUpdate click': function (element, event) {
				var updateId = -1;

				if (typeof element.data('updateId') !== 'undefined') {
					updateId = element.data('updateId');
				}

				event.preventDefault();
				event.stopImmediatePropagation();

				var self = this;
				var create = true;
				var table = element.parents('li').data('field').table;
				var column = element.siblings('.relationCurrent').val();
				var relTable = element.siblings('.relationTable').val();
				var relColumn = element.siblings('.relationColumn').val();

				if (relTable != -1) {
					var rels = self.insight.attr('relations.'+table+'.relateto') || {};

					if (rels.length > 0) {
						rels.each (function(item, index) {
							if (item.field == column && item.table == table && item.relfield == relColumn && item.reltable == relTable) {
								create = false;
							}
						});
					}

					if (create) {

						var newRel = {
							table: table,
							field: column,
							reltable: relTable,
							relfield: relColumn
						};

						var key;
						if (updateId != -1) {
							key = updateId;
						} else {
							try {
								key = Object.keys(rels.attr()).length;
							} catch (e) {
								key = 0;
							}
						}

						if (updateId == -1) {
							self.insight.attr('relations.'+table+'.relateto.id_' + key, newRel);
						} else {
							self.insight.attr('relations.'+table+'.relateto.id_'+updateId, Object.create(newRel));

						}

						self.generateQuery();
					}
				} else {
					element.siblings('.relationTable').addClass('error');
				}
			},
			'.relationTable change': function (element, event) {
				var tableClass = element.val();

				if (tableClass != -1) {
					var datas = this.element.find('.'+tableClass).data('table');

					this.element.find('.relationColumn:visible').html('//js/app/views/pages/insight/selectcolumns.ejs', {columns: datas});
					this.element.find('.relationColumn:visible').attr('disabled', false);
				} else {
					this.element.find('.relationColumn:visible').attr('disabled', true);
				}
			},
			'.toolsPlaceholders input keyup': function(element, event) {
				var self = this;

				self.insight.attr('variables.' + element.attr('placeholder'), element.val());
			},
			'.exportButton click': function(element, event) {
				event.preventDefault();

				if (element.data('export') == true) {
					var self = this;
					var value = self.editor.getValue();
					can.each(self.insight.attr('variables').attr(),function(item, index) {
						value = value.replace(new RegExp(':' + index + ':','g'),item);
					});
					self.element.find('.exportQuery').val(value);
					self.element.find('.exportDB').val(self.element.find('.databaseSelect').val());
					
					self.element.find('.exportForm').submit();
				}
			},
			generateGraph: function() {
				var self = this;
				var fields = [];
				var palette = new Rickshaw.Color.Palette( { scheme: 'spectrum14' } );
				if(self.currentResults.data.length > 0) {
					fields = Object.keys(self.currentResults.data[0]);
				}
				self.element.find('.displayMode.graph').html('//js/app/views/pages/insight/graph.ejs', {type:self.insight.attr('graphopts.type'), x:self.insight.attr('graphopts.x'), y:self.insight.attr('graphopts.y'), controller: self, fields: fields, results: self.currentResults.data, count: Math.ceil(self.currentResults.found_rows/50), page: self.currentPage, insight: self.insight});
				if(typeof self.insight.attr('graphopts.x') == 'undefined' || typeof self.insight.attr('graphopts.y') == 'undefined'){

				} else {
					var series = [];
					var xs = {};
					self.currentResults.data.forEach(function(resitem, index) {
						xs[resitem[self.insight.attr('graphopts.x')]] = index;
					});
					self.insight.attr('graphopts.y').each(function(index, item) {
						var data = []
						self.currentResults.data.forEach(function(resitem) {
							data.push({x: xs[resitem[self.insight.attr('graphopts.x')]], y: parseInt(resitem[item])||0});
						});
						var serie = {
							data: data,
							color: palette.color(),
							name: item
						};
						series.push(serie);

					});
					var type = (self.insight.attr('graphopts.type')||'line').split('_');
					try {
						var graph = new Rickshaw.Graph(
						{
							element: document.querySelector('#insight_'+(self.insight.attr('id')||0)+' .graphArea'),
							width: $('#insight_'+self.insight.attr('id')+' .graphArea').width()-40,
							height: 400,
							renderer: type[0],
							series: series
						});

						var y_ticks = new Rickshaw.Graph.Axis.Y( {
							graph: graph,
							orientation: 'left',
							tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
							element: document.querySelector('#insight_'+(self.insight.attr('id')||0)+' .graphAreaY'),
						} );
						var hoverDetail = new Rickshaw.Graph.HoverDetail( {
							graph: graph,
							formatter: function(series, x, y, formattedX, formattedY){
								return series.name + ':&nbsp;' + formattedY;
							},
							xFormatter: function(x) {
								return self.currentResults.data[x][self.insight.attr('graphopts.x')];
							}
						} );
						if(typeof type[1] == 'undefined') {
							graph.configure({offset: 'zero', unstack: true});
						}
						graph.render();
					} catch(e) {
						console.log(e);
					}
				}
				
				self.updatePages(self.currentPage, self.currentResults.found_rows);

			},
			'updateAxis': function() {
				var self = this;
				can.batch.start();
				self.insight.attr('graphopts.x', '');
				self.insight.removeAttr('graphopts.y');
				self.insight.attr('graphopts.y', {});
				self.element.find('.graphYAxis input:checked').each(function() {
					self.insight.attr('graphopts.y.'+$(this).val(),$(this).val());
				});
				self.element.find('.graphXAxis input:checked').each(function() {
					self.insight.attr('graphopts.x', $(this).val());
				});
				self.element.find('.graphType input:checked').each(function() {
					self.insight.attr('graphopts.type', $(this).val());
				});
				can.batch.stop(true, true);
				self.generateGraph();
			},
			fetchData: function(element, page) {
				var self = this;
				self.currentPage = page;
				var oldContent = element.html();
				var oldWidth = element.width();
				element.addClass('loading');
				//element.html('<span class="spin"><i class="fa fa-spinner fa-spin"></i></spin>');
				//element.width(oldWidth);
				self.element.find('.queryErrors').hide();
				self.element.find('.queryStats').hide();
				var value = self.editor.getValue();
				can.each(self.insight.attr('variables').attr(),function(item, index) {
					value = value.replace(new RegExp(':' + index + ':','g'),item);
				});
				$.ajax({
					url: '/api/query/execute',
					method: 'post',
					data: {
						database_id: self.element.find('.databaseSelect').val(),
						query: value,
						offset: (page-1) * 50,
						row_count: 50
					},
					success: function(data) {
						self.currentResults = data;
						var fields = [];
						if(data.data.length > 0) {
							fields = Object.keys(data.data[0]);
							self.element.find('.exportButton').data('export', true);
							self.element.find('.exportButton').removeClass('disabled');
						} else {
							self.element.find('.exportButton').data('export', false);
							self.element.find('.exportButton').addClass('disabled');
						}

						self.element.find('.displayMode.results').html('//js/app/views/pages/insight/results.ejs', {fields: fields, results: data.data, count: Math.ceil(data.found_rows/50), page: page});
						
						self.generateGraph();
						 
						
						self.element.find('.results .resultsContent').width(self.element.find('.results').width());
						self.updatePages(page, data.found_rows);
						
						self.element.find('.queryStats').html('Query executed in ' + data.execution_time + 'ms').show();
						//if(Math.ceil(data.found_rows/50) <= page)
					},

					error: function(error) {
						self.element.find('.queryErrors').html(error.responseJSON.errstr).show();
						self.element.find('.exportButton').data('export', false);
						self.element.find('.exportButton').addClass('disabled');
					},
					complete: function() {
						element.removeClass('loading');
						//element.html(oldContent);

					}

				});
			},
			'updatePages': function(page, found_rows) {
				var self = this;
				if(page > 1) {
					self.element.find('.previous').removeClass('disabled');
				} else if(!self.element.find('.previous').hasClass('disabled')) {
					self.element.find('.previous').addClass('disabled');
				}

				if(page < Math.ceil(found_rows/50)) {
					self.element.find('.next').removeClass('disabled');
				} else if(!self.element.find('.next').hasClass('disabled')) {
					self.element.find('.next').addClass('disabled');
				}
				self.page = page;
			},
			'.previous click': function(element, event) {
				event.preventDefault();
				if(!element.hasClass('disabled') && !element.hasClass('loading')) {
					this.fetchData(element, this.page-1);
				}
			},
			'.next click': function(element, event) {
				event.preventDefault();
				if(!element.hasClass('disabled') && !element.hasClass('loading')) {
					this.fetchData(element, this.page+1);
				}
			},
			'.applyButton click': function(element, event) {
				var self = this;
				event.preventDefault();
				if(self.element.find('.databaseSelect').val() === 'new') {
					self.element.find('.databaseSelect').addClass('error').focus();
				} else {
					if(!element.hasClass('loading')) {
						this.fetchData(element, 1);
						self.element.find('#sql textarea').focus();
					}
				}
			},
			'.closeButton click': function (element, event) {
				this.element.find('.editPopup').removeClass('visible');
			},
			'.clearButton click': function (element, event) {
				event.preventDefault();
				event.stopImmediatePropagation();
				var self = this;

				if (confirm('You are about to clear query')) {
					if (self.insight.attr('type') == 0) {
						self.insight.attr('fields', {});
						self.insight.attr('filters', {});
						self.insight.attr('relations', {});
						self.generateQuery();
					} else {
						self.insight.attr('variables', {});
						self.insight.attr('query', '-- Type your query here');
					}

					self.element.find('.exportButton').data('export', false);
					self.element.find('.exportButton').addClass('disabled');
				}
			},
			'.saveButton click': function(element, event) {
				var self = this;
				event.preventDefault();
				$('.tabs .active .insightTitle').parent().removeClass('error');
				if($('.tabs .active .insightTitle').val().trim() === ''){
					$('.tabs .active .insightTitle').parent().addClass('error');
					$('.tabs .active .insightTitle').focus();
				} else if(self.element.find('.databaseSelect').val() === 'new' || !self.element.find('.databaseSelect').val()) {
					self.element.find('.databaseSelect').parent().addClass('error');
					self.element.find('.databaseSelect').focus();
				} else {
					// var vars = self.insight.attr('variables').attr();
					// var type = self.insight.attr('type');
					// self.insight.attr({
					// 	database_id: $('.databaseSelect').val(),
					// 	name: $('.tabs .active .insightTitle').val().trim(),
					// 	query: self.editor.getValue(),
					// 	variables: vars,
					// 	type: type
					// });
					self.insight.attr('database_id', self.element.find('.databaseSelect').val());
					self.insight.attr('name', $('.tabs .active .insightTitle').val().trim());
					var value = self.editor.getValue();
					self.insight.attr('query', value);

					self.insight.save().then(function(response) {
						self.element.attr('id', 'insight_' + response.id);
						self.insight.attr(response.attr());
						if(typeof self.options.id === 'undefined') {
							Global.insights.push(self.insight);
						}

						self.changed = false;
						self.options.id = response.id;
						can.route.attr('id',self.options.id);
					});
				}

			},
			'{window} keydown': function(element, event) {
				var self = this;
				if(self.element.is(':visible')) {
					if (event.ctrlKey && event.shiftKey && event.keyCode == 83) {
						event.preventDefault();
						self.element.find('.saveButton .menu div').click();
					} else if (event.ctrlKey && event.keyCode == 83) {
						event.preventDefault();
						self.element.find('.saveButton').click();
					} else if (event.ctrlKey && event.keyCode == 13) {
						event.preventDefault();

						self.element.find('.applyButton').click();
					}
				}
			},
			'.columnList i.removeButton click': function (element, event) {
				
				var self = this,
					removeElement = element.parent('.item'),
					id = removeElement.data('field').attr('id');

				if (removeElement.parent('.list').hasClass('fields')) {
					self.insight.removeAttr('fields.' + id);
				} else if (removeElement.parent('.list').hasClass('filters')) {
					self.insight.removeAttr('filters.' + id);
				}

			},
			'.columnList .item click': function (element, event) {
				event.preventDefault();
				event.stopPropagation();
				var parentUl = element.parents('.columnList');

				if (!$(parentUl).hasClass('relations')) {
					var self = this;

					self.element.find('.editPopup').removeClass('visible');
					element.find('.editPopup').addClass('visible');

					if(parentUl.hasClass('filters')) {
						element.find('.editPopup .operator').hide();
						element.find('.editPopup .operator-' + element.find('.editPopup .filterOperator').val()).show();
					}
				}
			},
			'.saveFilters click': function(element, event) {
				event.preventDefault();

				var operator = element.parent().find('.filterOperator').val();
				var value = new String();
				var values = [];
				var error = false;

				element.parent().find('.operator:visible input').each (function (index, item) {
					value = $(item).val();

					if (value.length >= 1) {
						if ($(item).parents('div').hasClass('operator-relation')) {
							values.push('`' + value + '`');
						 } else {
						 	values.push(value);
						 }
					} else {
						$(item).addClass('error');
						error = true;
					}
				});

				if (error == false) {

					element.parents('.item').data('field').attr({'field': {'operator': element.parent().find('.filterOperator').val(), 'val': values}});

					element.parents('.editPopup').removeClass('visible');
				} else {
					event.stopImmediatePropagation();
				}

			},
			'.editPopup click': function(element, event) {
				event.stopImmediatePropagation();
			},
			'.toolsFields .editPopup .button click': function(element, event) {
				event.preventDefault();
				var self = this;

				element.parents('.item').data('field').attr('field.as', element.parent().find('input').val());
				element.parents('.editPopup').removeClass('visible');
			},
			'.saveCopy click': function(element, event) {
				event.preventDefault();
				var self = this;
				element.removeClass('active');
				$('.tabs .active .insightTitle').parent().removeClass('error');
				if($('.tabs .active .insightTitle').val().trim() === ''){
					$('.tabs .active .insightTitle').parent().addClass('error');
					$('.tabs .active .insightTitle').focus();
				} else if(self.element.find('.databaseSelect').val() === 'new') {
					self.element.find('.databaseSelect').parent().addClass('error')
					self.element.find('.databaseSelect').focus();
				} else {
					$('.tabs .active .insightTitle').val('Copy of ' + $('.tabs .active .insightTitle').val().trim());

					var insight = new Model.Insight(self.insight.attr());
					insight.attr('name',$('.tabs .active .insightTitle').val());
					insight.removeAttr('id');
					insight.save().then(function(response) {
						self.insight.attr(response.attr());
						self.options.id = response.id;
						can.route.attr('id',self.options.id);
					});
				}


			},
			'.filterOperator change': function (element, event) {
				this.element.find('.operator').hide();
				this.element.find('.operator-' + element.val()).show();

				if (element.val() == 'relation') {
					element.siblings('.operator:visible').find('.relTables').html('//js/app/views/pages/insight/selecttable.ejs', {rels: this.insight.attr('relations'), table: element.parents('li').data('field').table});
				}
			},
			'.relTables change': function (element, event) {
				var table = element.val();

				element.siblings('.relt').val(table);
				element.siblings('.relc').val('');
				element.siblings('.relColumn:visible').html('//js/app/views/pages/insight/selectcolumns.ejs', {columns: this.element.find('.' + table).data('table')});
			},
			'.relColumn change': function (element, event) {
				var column = element.val();
				if (column == -1) {
					element.siblings('.relc').val('	');
				} else {
					element.siblings('.relc').val(column);
				}
			},
			'.databaseSelect change': function(element, event) {
				var self = this;
				event.preventDefault();
				$(self).removeClass('error');
				if(element.val() === 'new') {
					self.element.find('.sidebar .newDatabase').html('//js/app/views/pages/insight/database.ejs', {});
					self.element.find('.sidebar .newDatabase form').parsley();
				} else if (element.val()){
					self.element.find('.sidebar .newDatabase').html('');
					self.insight.attr('database_id', element.val());
					self.getStructure();
				} else {
					self.element.find('.structure').html('');
				}
			},
			'.sidebar .newDatabase form submit': function(element, event) {
				event.preventDefault();
				var self = this;
				if(element.parsley('validate')) {
					var database = new Model.Database(element.formParams());
					database.save().then(function(data) {
						Model.Database.findAll().then(function(data) {
							self.databases = data;
							self.insight.attr('database_id',database.attr('id'));

							self.element.find('.sidebar').html('//js/app/views/pages/insight/sidebar.ejs', {databases: self.databases, insight: self.insight});
						});
					}).fail(function(data) {
						if (typeof data.responseJSON != 'undefined'){
							parsleyError(element, data.responseJSON.error);
						}
					});
				}
			},
			'.sidebar .structure > ul > li > span, .sidebar .structure > ul > li > i click': function(element, event) {
				event.preventDefault();
				event.stopPropagation();
				element.parent().toggleClass('open');
			},
			'.displayType .button click': function(element, event) {
				event.preventDefault();
				var self = this;
				if(element.hasClass('dTable')) {
					self.insight.attr('graph', 0);
				} else {
					self.insight.attr('graph', 1);
				}
			},
			'{window} resize': function() {
				var h = window.innerHeight-300;
				if(h < 200) {
					h = 200;
				}
				this.element.find('.structure > .menu').css('max-height', h);
				if(this.insight.attr('graph') && Object.keys(this.currentResults).length > 0) {
					this.generateGraph();
				}
			}
		}
	);
});
