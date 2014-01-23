steal(
	'lib/parsleyjs/parsley.js',
	'lib/parsleyerror.js',
	'lib/jquery.formParams/jquery.formParams.js',
	'app/models/user.js'
).then(
	'app/views/pages/account/sidebar.ejs',
	'app/views/pages/account/login.ejs',
	'app/views/pages/account/register.ejs',
	function() {
		can.Control(
			'Controller.Account',
			{

			},
			{
				init: function(element, options) {
					this.element.find('.sidebar').html('app/views/pages/account/sidebar.ejs', {});
				},
				index: function() {
					this.element.find('.inner').html('app/views/pages/account/login.ejs', {});
					this.element.find('form').parsley();
				},
				register: function() {
					this.element.find('.inner').html('app/views/pages/account/register.ejs', {});
					this.element.find('form').parsley();
				},
				logout: function(options) {
						$.ajax({
							url: '/api/users/logout',
							type: 'delete',
							success: function(data) {
								$.cookie('loggedIn',0);
								Global.user.attr({name: '', email: ''}, true);
								Global.state.attr('loggedIn', false);
								$('.tabsInner').remove();
								can.route.attr({route: '/'}, true);
							}
						});
					},
					'form.login submit': function(element, event) {
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
					'form.register submit': function(element, event) {
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
	}
);
