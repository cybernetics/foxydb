define([
	'jquery',
	'can',
	'can/route',
	'app/controllers/account',
	'app/controllers/users',
	'app/controllers/database',
	'app/controllers/dashboard',
	'app/controllers/tabs',
	'app/controllers/insight',
	'jquery-cookie/jquery.cookie',
	 '../../../semantic/javascript/semantic.min'
], function(
	$,
	can
) {
	can.Control(
		'Controller.Router',
		{
			defaults: {
				unauthenticated: [
					'account/index',
					'account/register'
				]
			}
		},
		{
			currentController: '',
			currentControllerInstance: null,
			init: function(element, options) {

				this.element.html('/js/app/views/layout/layout.ejs', {});
				if($.cookie('loggedIn') == 1) {
					Global.state.attr('loggedIn', true);
					$.ajax({
						url: '/api/user',
						type: 'get',
						dataType: 'json',
						success: function(data) {
							Global.user.attr(data);
							can.route.ready();
						},
						error: function(error) {
							Global.state.attr('loggedIn', false);
							$.cookie('loggedIn', 0);
							can.route.attr({route: ''}, true);
							can.route.ready();
						}
					});
				} else {
					$.cookie('loggedIn', 0);
					can.route.ready();
				}
				
			},
			loadPage: function(controller, action, options) {
				var self = this;

				if(($.cookie('loggedIn') != 1 && this.options.unauthenticated.indexOf(controller + '/' + action) < 0)){
					can.route.attr({route: ''}, true);
					return;
				}

				options = options || {};
				controller = can.capitalize(controller);

				if(['Dashboard','Insight'].indexOf(controller) == -1) {
					$('.tabs').hide();
					this.element.find('.pagecontent').hide();
					this.element.find('.controller').show();

					if (typeof action !== 'undefined' && action == 'register') {
						if (typeof config.allowRegister !== 'undefined' && !config.allowRegister) {
							can.route.attr({controller: 'account', action: 'login'}, true);
						}
					}
					
					if(this.currentController != controller) {
						this.element.find('.controller').replaceWith('/js/app/views/layout/controller.ejs', {});
						this.currentControllerInstance = new Controller[controller](this.element.find('.controller'), options);
						this.currentController = controller;

					}

					if(typeof action != 'undefined') {
						this.currentControllerInstance[action](options);
					}
				} else {
					if(controller == 'Dashboard') {
						Model.Database.findAll().then(function(data) {
							if (data.length === 0) {
								can.route.attr({controller: 'database', action: 'add'}, true);
							} else {
								$('.tabs').show();
								self.element.find('.pageContent').hide();
								self.element.find('.dashboard').show();
							}
						});
					} else if(controller == 'Insight') {
						$('.tabs').show();
						this.element.find('.pagecontent').hide();
						var id = options.id || 0;
						
						if(this.element.find('.insight#insight_' + id).length == 0) {
							var el = $('.pagecontent:last').after('/js/app/views/layout/insight.ejs', {id: id});
							var insight = new Controller[controller](this.element.find('.insight#insight_' + id), options);
							insight.edit(options);
						} else {
							this.element.find('.insight#insight_' + id).data('insight').updateTabs();
						}
						this.element.find('.insight#insight_' + id).show();

					}
					
				}
				$(window).resize();

			},
			'route': function() {
				if (!Global.state.attr('loggedIn')) {
					this.loadPage('account', 'index', can.route.attr());
				} else {
					this.loadPage('dashboard', 'index', can.route.attr());
				}
			},
			':controller route': function() {
				this.loadPage(can.route.attr('controller'), 'index', can.route.attr());
			},
			':controller/:action route': function() {
				this.loadPage(can.route.attr('controller'), can.route.attr('action'), can.route.attr());
			},
			'{window} resize': function(element, event) {
				this.element.find('.pagecontent').css('padding-top',this.element.find('header').height()+'px');
				this.element.find('.tabs').css('top',(this.element.find('header').height()-this.element.find('.tabs').height())+'px');
			}
		}
	);
	return Controller.Router;
});