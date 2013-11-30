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
	'ace/theme-github'
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
				self.insight = new Model.Insight({query:'-- Type your query here'});
				Model.Database.findAll().then(function(data) {
					self.databases = data;
					if(typeof self.options.id === 'undefined') {
							self.insight.attr('database_id',data[0].attr('id'));
					} else {
							Model.Insight.findOne({id: self.options.id}).then(function(response) {
								self.insight.attr(response.attr(), true);
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
								Global.tabs.forEach(function(tab) {
									if(typeof tab.attr('id') === 'undefined'){ 
										tab.destroy();
									}
								});
								$(window).resize();
							});
					}


					self.element.find('.sidebar').html('//js/app/views/pages/insight/sidebar.ejs', {databases: self.databases, insight: self.insight});
					self.element.find('.inner').html('//js/app/views/pages/insight/content.ejs', {insight: self.insight});
					//setup editor
					var editor = ace.edit("sql");
					editor.setTheme("ace/theme/github");
					editor.getSession().setMode("ace/mode/sql");
					document.getElementById('sql').style.fontSize='14px';
					editor.getSession().setUseWrapMode(true);
					editor.renderer.setShowGutter(false);
					self.editor = editor;
					self.insight.bind('query',function(event, newVal, oldVal) {
						self.editor.setValue(newVal);
						self.element.find('.applyButton').click();
					});

				});
			},
			fetchData: function(element, page) {
				var self = this;
				var oldContent = element.html();
				var oldWidth = element.width();
				element.addClass('loading');
				element.html('<span class="spin"><i class="fa fa-spinner fa-spin"></i></spin>');
				element.width(oldWidth);
				self.element.find('.queryErrors').hide();
				$.ajax({
					url: '/api/query/execute',
					method: 'post',
					data: {
						database_id: $('.databaseSelect').val(),
						query: self.editor.getValue(),
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

				self.element.find('.active .insightTitle').removeClass('error');
				if(self.element.find('.active .insightTitle').val().trim() === ''){
					self.element.find('.active .insightTitle').addClass('error').focus();
				} else if($('.databaseSelect').val() === 'new') {
					self.element.find('.databaseSelect').addClass('error').focus();
				} else {
					var insight = new Model.Insight({
						database_id: $('.databaseSelect').val(),
						name: self.element.find('.active .insightTitle').val().trim(),
						query: self.editor.getValue()
					});
					insight.save().then(function(response) {
						self.insight.attr(response.attr());
						self.options.id = response.id;
						can.route.attr('id',self.options.id);
					});
				}

			},
			'#sql textarea keydown': function(element, event) {
				var self = this;
				if (event.ctrlKey && event.keyCode == 13) {
					event.preventDefault();

					self.element.find('.applyButton').click();
				}

			},
			'{window} keydown': function(element, event) {
				var self = this;
				if (event.ctrlKey && event.shiftKey && event.keyCode == 83) {
					event.preventDefault();
					self.element.find('.saveButton .submenu li').click();
				} else if (event.ctrlKey && event.keyCode == 83) {
					event.preventDefault();
					self.element.find('.saveButton').click();
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

				self.element.find('.active .insightTitle').removeClass('error');
				if(self.element.find('.active .insightTitle').val().trim() === ''){
					self.element.find('.active .insightTitle').addClass('error').focus();
				} else if($('.databaseSelect').val() === 'new') {
					self.element.find('.databaseSelect').addClass('error').focus();
				} else {
					self.element.find('.active .insightTitle').val('Copy of ' + self.element.find('.active .insightTitle').val().trim());
					
					var insight = new Model.Insight({
						database_id: $('.databaseSelect').val(),
						name: self.element.find('.active .insightTitle').val(),
						query: self.editor.getValue()
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
			}

		}
	);
});