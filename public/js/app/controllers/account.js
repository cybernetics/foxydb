define([
	'jquery', 
	'can', 
	'parsley', 
	'parsleyerror',
	'formParams', 
	'app/models/user'
], function(
	$, 
	can,
	undefined,
	parsleyError
) {
	can.Control(
		'Controller.Account',
		{

		},
		{
			init: function(element, options) {
				this.element.find('.sidebar').html('/js/app/views/pages/account/sidebar.ejs', {});
			},
			index: function() {
				this.element.find('.inner').html('/js/app/views/pages/account/login.ejs', {});
				this.element.find('form').parsley();
			},
			register: function() {
				this.element.find('.inner').html('/js/app/views/pages/account/register.ejs', {});
				this.element.find('form').parsley();
			},
			logout: function(options) {
					$.ajax({
						url: '/api/users/logout',
						type: 'delete',
						success: function(data) {
							$.cookie('loggedIn',0);
							Global.user.attr({user: ''}, true);
							Global.state.attr('loggedIn', false);
							$('.tabsInner').remove();
							can.route.attr({route: '/'}, true);
						}
					});
				},
				'.login form submit': function(element, event) {
					event.preventDefault();
					if(element.parsley('validate')) {
						$.ajax({
							url: '/api/users/login',
							type: 'post',
							data: element.formParams(),
							success: function(data) {
								$.cookie('loggedIn',1);
								Global.user.attr(data);
								
								can.route.attr({controller: 'dashboard'}, true);
								Global.state.attr('loggedIn', true);
							},
							error: function(error) {
								parsleyError(element, error.responseJSON.error);
							}
						});
					}
				},
				'.register form submit': function(element, event) {
					event.preventDefault();
					if(element.parsley('validate')) {
						var user = new Model.User(element.formParams());
						user.save().then(function(data) {
							$.cookie('loggedIn',1);
							Global.user.attr(data.attr());
							Global.state.attr('loggedIn', true);
							can.route.attr({controller: 'dashboard'}, true);
						}).fail(function(data) {
							if (typeof data.responseJSON != 'undefined'){
								parsleyError(element, data.responseJSON.error);
							}
						});
					}
				}
		}
	)
});