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
	'can/util/object',
	'jquerypp/event/drag',
	'jquerypp/event/drop'
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
			operators: {between: 'BETWEEN', equal: '=', ne: '<>', lt: '<', lte: '<=', gt: '>', gte: '>=', like: 'LIKE', in: 'IN', relation: 'relation'},
			init: function(element, options) {

			},
			edit: function(options) {
				var self = this;
				self.options = options;
				var type = 0;
				if(can.route.attr('type')) {
					type = can.route.attr('type');
				}
				self.insight = new Model.Insight({query:'-- Type your query here', current: true, name: '', type: type, variables: {}, fields: {}, filters: {}, relations: {}});
				self.element.data('insight', self);
				Model.Database.findAll().then(function(data) {
					self.databases = data;

					self.element.find('.sidebar').html('//js/app/views/pages/insight/sidebar.ejs', {databases: self.databases, insight: self.insight});
					self.element.find('.inner').html('//js/app/views/pages/insight/content.ejs', {insight: self.insight});
					self.element.find('.tools').html('//js/app/views/pages/insight/tools.ejs', {insight: self.insight});
					var editor = ace.edit(self.element.find('.sql')[0]);
					self.editor = editor;

					if(typeof self.options.id === 'undefined') {
							self.insight.attr('database_id',data[0].attr('id'));
							Global.tabs.push(self.insight);
							self.setupDragDrop();
							self.getStructure();
					} else {
						Model.Insight.findOne({id: self.options.id}).then(function(response) {
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

							self.insight.attr(response.attr(), true);
							self.insight.attr({variables:response.attr('variables')});
							self.insight.attr({fields:response.attr('fields')});
							self.insight.attr({filters:response.attr('filters')});
							self.insight.attr({relations:response.attr('relations')});

							self.updateTabs();
							self.getStructure();
							self.setupDragDrop();
							self.element.find('.applyButton').click();
						});					

					}

					self.editor.setTheme("ace/theme/tomorrow");
					self.editor.getSession().setMode("ace/mode/sql");
					self.element.find('.sql').css('font-size',12);
					self.editor.getSession().setUseWrapMode(true);
					self.editor.renderer.setShowGutter(false);
					
					self.editor.on('change', function() {
						self.getVariables();
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
					self.element.find('.structure').html('//js/app/views/pages/insight/structure.ejs', {structure: {}});

					$.get('/api/databases/structure/'+self.insight.attr('database_id'), function(response) {
						var res = {};
						can.each(response, function(item, index) {
							res[index] = new can.Map(item);
						});
						self.element.find('.structure').html('//js/app/views/pages/insight/structure.ejs', {structure: res});
						$(window).resize();
						self.element.find('.structure > ul > li > ul > li').on(
							{
								'draginit': function(ev, drag) {
									drag.ghost();
									var drops = self.element.find('.dragHere');
									drops.each(function(index, drop) {
										if($(drop).hasClass('hidden')) {
											$(drop).addClass('dragged');
											$(drop).css({
												top: $(drop).prev().position().top,
												height: $(drop).prev().height(),
												lineHeight: ($(drop).prev().innerHeight()-10)+'px'
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
											lineHeight: ''
										});
									});
								}
							}
						);

					});
				}

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
									break;
								}
							}
						}
						wheres.push('`' + item.table + '`.`' + item.field.Field + '` ' + self.operators[operator] + ' ' + where);
					}

					table = '`' + item.table + '`';

					if (tables.indexOf(table) == -1) {
						/*
						if(typeof self.insight.attr('relations.'+item.table+'.relateto') !== 'undefined') {
							self.insight.attr('relations.'+item.table+'.relateto').each(function (item, index) {
								relations.push('`'+item.table+'`.`'+item.field+'` = `'+item.reltable+'`.`'+item.relfield+'`');
							});
						}
						*/
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
			'.tools .toolsPlaceholders input keyup': function(element, event) {
				var self = this;
				self.insight.attr('variables.' + element.attr('placeholder'), element.val());
			},
			fetchData: function(element, page) {
				var self = this;
				var oldContent = element.html();
				var oldWidth = element.width();
				element.addClass('loading');
				element.html('<span class="spin"><i class="fa fa-spinner fa-spin"></i></spin>');
				element.width(oldWidth);
				self.element.find('.queryErrors').hide();
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
						var fields = [];
						if(data.data.length > 0) {
							fields = Object.keys(data.data[0]);
						}
						self.element.find('.results').html('//js/app/views/pages/insight/results.ejs', {fields: fields, results: data.data, count: Math.ceil(data.found_rows/50), page: page});
						if(page > 1) {
							self.element.find('.previous').removeClass('disabled');
						} else if(!self.element.find('.previous').hasClass('disabled')) {
							self.element.find('.previous').addClass('disabled');
						}

						if(page < Math.ceil(data.found_rows/50)) {
							self.element.find('.next').removeClass('disabled');
						} else if(!self.element.find('.next').hasClass('disabled')) {
							self.element.find('.next').addClass('disabled');
						}
						self.page = page;

						//if(Math.ceil(data.found_rows/50) <= page)
					},

					error: function(error) {
						self.element.find('.queryErrors').html(error.responseJSON.errstr).show();
					},
					complete: function() {
						element.removeClass('loading');
						element.html(oldContent);

					}

				});
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
				this.element.find('.editPopup').removeClass('open');
			},
			'.clearButton click': function (element, event) {
				event.preventDefault();
				event.stopImmediatePropagation();
				var self = this;

				if (confirm('You are about to clear query')) {
					self.insight.attr('fields', {});
					self.insight.attr('filters', {});
					self.insight.attr('relations', {});
				}
			},
			'.saveButton click': function(element, event) {
				var self = this;
				event.preventDefault();
				$('.tabs .active .insightTitle').removeClass('error');
				if($('.tabs .active .insightTitle').val().trim() === ''){
					$('.tabs .active .insightTitle').addClass('error').focus();
				} else if(self.element.find('.databaseSelect').val() === 'new') {
					self.element.find('.databaseSelect').addClass('error').focus();
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
						self.element.find('.saveButton .submenu li').click();
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
					removeElement = element.parent('li'),
					id = removeElement.data('field').attr('id');

				if (removeElement.parent('ul').hasClass('fields')) {
					self.insight.removeAttr('fields.' + id);
				} else if (removeElement.parent('ul').hasClass('filters')) {
					self.insight.removeAttr('filters.' + id);
				}

			},
			'.columnList li span click': function (element, event) {
				event.preventDefault();
				event.stopPropagation();
				var parentUl = element.parents('ul.columnList');

				if (!$(parentUl).hasClass('relations')) {
					var self = this;
					var	popup = element.siblings('.editPopup');

					self.element.find('.editPopup').removeClass('open');
					element.siblings('.editPopup').addClass('open');
				}
				if(parentUl.hasClass('filters')) {
					element.parent().find('.editPopup .operator').hide();
					element.parent().find('.editPopup .operator-' + element.parent().find('.editPopup .filterOperator').val()).show();
				}
			},			
			'.saveFilters click': function(element, event) {
				event.preventDefault();

				var operator = element.siblings('select').val();
				var value = new String();
				var values = [];
				var error = false;

				$('.operator:visible input').each (function (index, item) {
					value = $(item).val();

					if (value.length >= 1) {
						if ($(item).parents('div').hasClass('operator-relation')) {
							values.push('`' + value + '`');
						 } else {
						 	values.push('\'' + value + '\'');
						 }
					} else {
						$(item).addClass('error');
						error = true;
					}
				});

				if (error == false) {
					element.parents('li').data('field').attr('field.operator', element.siblings('select').val());
					element.parents('li').data('field').attr('field.val', values);
					element.parents('.editPopup').removeClass('open');
				} else {
					event.stopImmediatePropagation();
				}

			},
			'.toolsFields .editPopup .button click': function(element, event) {
				event.preventDefault();
				var self = this;

				element.parents('li').data('field').attr('field.as', element.siblings('input').val());
				element.parents('.editPopup').removeClass('open');
			},
			'.saveButton span click': function(element, event) {
				event.preventDefault();
				event.stopPropagation();
				element.parent().find('.submenu').show();
				setTimeout(function() {
					$('html').one('click', function(){
						element.parent().find('.submenu').hide();
					});
				}, 50);

			},
			'.submenu li click': function(element, event) {
				event.preventDefault();
				event.stopPropagation();
				element.parent().hide();
				var self = this;

				$('.tabs .active .insightTitle').removeClass('error');
				if($('.tabs .active .insightTitle').val().trim() === ''){
					$('.tabs .active .insightTitle').addClass('error').focus();
				} else if(self.element.find('.databaseSelect').val() === 'new') {
					self.element.find('.databaseSelect').addClass('error').focus();
				} else {
					$('.tabs .active .insightTitle').val('Copy of ' + $('.tabs .active .insightTitle').val().trim());

					var insight = new Model.Insight({
						database_id: self.element.find('.databaseSelect').val(),
						name: $('.tabs .active .insightTitle').val(),
						query: self.editor.getValue(),
						variables: self.insight.attr('variables'),
						type: self.insight.attr('type')
					});
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
				} else {
					self.element.find('.sidebar .newDatabase').html('');
					self.insight.attr('database_id', element.val());
					self.getStructure();
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
						parsleyError(element, data.responseJSON.error);
					});
				}
			},
			'.sidebar .structure > ul > li > span, .sidebar .structure > ul > li > i click': function(element, event) {
				event.preventDefault();
				event.stopPropagation();
				element.parent().toggleClass('open');
			},
			'{window} resize': function() {
				var h = $(window).innerHeight()-400;
				if(h < 200) {
					h = 200;
				}
				this.element.find('.structure > ul').css('max-height', h);
			}

		}
	);
});
