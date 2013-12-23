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
	'can/util/object'
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
			init: function(element, options) {

			},
			edit: function(options) {
				var self = this;
				self.options = options;
				var type = 0;
				if(can.route.attr('type')) {
					type = can.route.attr('type');
				}
				self.insight = new Model.Insight({query:'-- Type your query here', current: true, name: '', type: type, variables: {}});
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
							self.getStructure();
					} else {
							Model.Insight.findOne({id: self.options.id}).then(function(response) {
								self.insight.attr(response.attr(), true);
								self.insight.attr({variables:response.attr('variables')});
								console.log (self.insight.attr('variables'), response);

								if(!self.insight.attr('variables')) {
									self.insight.attr('variables', {});
								}

								self.updateTabs();
								self.getStructure();
								self.element.find('.applyButton').click();

							});
							Global.tabs.forEach(function(tab, index) {
								if(typeof tab.attr('id') === 'undefined'){
									tab.destroy();
								}
							});

					}



					self.editor.setTheme("ace/theme/tomorrow");
					self.editor.getSession().setMode("ace/mode/sql");
					$('.sql')[0].style.fontSize='14px';
					self.editor.getSession().setUseWrapMode(true);
					self.editor.renderer.setShowGutter(false);
					
					self.editor.on('change', function() {
						self.getVariables();
					});
					self.insight.bind('query',function(event, newVal, oldVal) {
						self.editor.setValue(newVal);
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

			},
			getStructure: function() {
				var self = this;

				console.log(self.insight.attr('type'));

				if(self.insight.attr('type') == 0) {
					self.editor.setReadOnly(true);
					var structure = new can.Map();
					self.element.find('.structure').html('//js/app/views/pages/insight/structure.ejs', {structure: structure});
					$.get('/api/databases/structure/'+self.insight.attr('database_id'), function(response) {
						structure.attr(response);
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
			'.tools .innerContent input keyup': function(element, event) {
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
						database_id: $('.databaseSelect').val(),
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
				if($('.databaseSelect').val() === 'new') {
					self.element.find('.databaseSelect').addClass('error').focus();
				} else {
					if(!element.hasClass('loading')) {
						this.fetchData(element, 1);
						self.element.find('#sql textarea').focus();
					}
				}
			},
			'.saveButton click': function(element, event) {
				var self = this;
				event.preventDefault();
				$('.tabs .active .insightTitle').removeClass('error');
				if($('.tabs .active .insightTitle').val().trim() === ''){
					$('.tabs .active .insightTitle').addClass('error').focus();
				} else if($('.databaseSelect').val() === 'new') {
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
				console.log(1);
				event.preventDefault();
				event.stopPropagation();
				element.parent().hide();
				var self = this;

				$('.tabs .active .insightTitle').removeClass('error');
				if($('.tabs .active .insightTitle').val().trim() === ''){
					$('.tabs .active .insightTitle').addClass('error').focus();
				} else if($('.databaseSelect').val() === 'new') {
					self.element.find('.databaseSelect').addClass('error').focus();
				} else {
					$('.tabs .active .insightTitle').val('Copy of ' + $('.tabs .active .insightTitle').val().trim());

					var insight = new Model.Insight({
						database_id: $('.databaseSelect').val(),
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
			'.databaseSelect change': function(element, event) {
				var self = this;
				event.preventDefault();
				$(self).removeClass('error');
				if(element.val() === 'new') {
					self.element.find('.sidebar .newDatabase').html('//js/app/views/pages/insight/database.ejs', {});
					self.element.find('.sidebar .newDatabase form').parsley();
				} else {
					self.element.find('.sidebar .newDatabase').html('');
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
			'.sidebar .structure > ul > li click': function(element, event) {
				event.preventDefault();
				element.toggleClass('open');
			}

		}
	);
});