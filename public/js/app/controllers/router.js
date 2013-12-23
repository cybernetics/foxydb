define([
	'jquery',
	'can',
	'can/route',
	'app/controllers/account',
	'app/controllers/database',
	'app/controllers/dashboard',
	'app/controllers/tabs',
	'app/controllers/insight',
	'jquery-cookie/jquery.cookie'
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
				console.log('init');
				if($.cookie('loggedIn') == 1) {
					Global.state.attr('loggedIn', true);
					$.ajax({
						url: '/api/users',
						type: 'get',
						dataType: 'json',
						success: function(data) {
							console.log(data);
							Global.user.attr(data);
						},
						error: function(error) {
							Global.state.attr('loggedIn', false);
							$.cookie('loggedIn', 0);
							can.route.attr({route: ''}, true);
						}
					});
				}
				can.route.ready();
			},
			loadPage: function(controller, action, options) {
				console.log(controller, action, options);
				console.log($('.content'));
				if(($.cookie('loggedIn') != 1 && this.options.unauthenticated.indexOf(controller + '/' + action) < 0)){
					can.route.attr({route: ''}, true);
					return;
				}

				options = options || {};
				controller = can.capitalize(controller);
				if(['Dashboard','Insight'].indexOf(controller) == -1) {
					this.element.find('.content').hide();
					this.element.find('.controller').show();
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
						this.element.find('.content').hide();
						this.element.find('.dashboard').show();
					} else if(controller == 'Insight') {
						this.element.find('.content').hide();
						var id = options.id || 0;
						
						if(this.element.find('.insight#insight_' + id).length == 0) {
							var el = $('body').append('/js/app/views/layout/insight.ejs', {id: id});
							var insight = new Controller[controller](this.element.find('.insight#insight_' + id), options);
							insight.edit(options);
						} else {
							this.element.find('.insight#insight_' + id).data('insight').updateTabs();
						}
						this.element.find('.insight#insight_' + id).show();

					}
					
				}

			},
			'route': function() {
				console.log(this.element.html());
				this.loadPage('account', 'index', can.route.attr());
			},
			':controller route': function() {
				console.log(can.route.attr());
				this.loadPage(can.route.attr('controller'), 'index', can.route.attr());
			},
			':controller/:action route': function() {
				this.loadPage(can.route.attr('controller'), can.route.attr('action'), can.route.attr());
			}
		}
	);
	return Controller.Router;
});