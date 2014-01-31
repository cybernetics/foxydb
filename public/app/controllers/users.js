steal(
	'lib/parsleyjs/parsley.js',
	'lib/parsleyerror.js',
	'jquery/dom/form_params',
	'app/models/user.js'
).then(
	'app/views/pages/users/sidebar.ejs',
	'app/views/pages/users/list.ejs',
	'app/views/pages/users/new.ejs',
	'app/views/pages/users/update.ejs',
	function() {
		can.Control(
			'Controller.Users',
			{

			},
			{
				init: function(element, options) {
					this.element.find('.sidebar').html('app/views/pages/users/sidebar.ejs', {});
				},
				index: function() {
					var self = this;

					if (Global.user.level == 0) {
						self.element.find('.inner').html('app/views/pages/users/list.ejs', {users: Model.User.findAll({})});
					} else {
						self.element.find('.inner').html('app/views/pages/users/update.ejs', {user: Model.User.findOne({id: Global.user.id})});
					}
				},
				add: function(element, options) {
					this.element.find('.inner').html('app/views/pages/users/new.ejs', {});
					//this.element.find('form').parsley();
				},
				edit: function(element, options) {
					if (typeof element.id !== 'undefined') {
						this.element.find('.inner').html('app/views/pages/users/update.ejs', {user: Model.User.findOne({id: element.id})});
					} else {
						can.route.attr({controller: 'users'}, true);
					}
				},
				'.delete click': function(element, event) {
					event.preventDefault();
					var self = this;

					if (!self.element.find('.confirmModal').length) {
						self.element.find('.inner').append('app/views/layout/modals/confirm.ejs', {title: 'User remove', content: 'You are about to remove user.', positive: 'Delete', negative: 'Cancel'});
					}

					self.element.find('.confirmModal .content').html('<p>You are about to delete user ' + element.data('user').name);
					self.element.find('.confirmModal').modal({
						closable: false,
						debug: false,
						detachable: false,
						allowMultiple: false,
						onApprove: function () {
							$.ajax({
								url: '/api/user/' + element.data('user').id,
								type: 'delete',
								success: function(msg) {
									can.route.attr({controller: 'users'}, true);
								}
							});
						}
					}).modal('show');
				},
				'form.create submit': function(element, event) {
					event.preventDefault();
					if(element.parsley('validate')) {
						var user = new Model.User(element.formParams());
						user.save().then(function(data) {
							can.route.attr({controller: 'users'}, true);
						}).fail(function(data) {
							if (typeof data.responseJSON != 'undefined'){
								parsleyError(element, data.responseJSON.error);
							}
						});
					}
				},
				'form.update submit': function(element, event) {
					event.preventDefault();

					if (element.parsley('validate')) {
						var userObject = element.formParams();
						var user = element.data('user');

						if (typeof userObject.level === 'undefined' || Global.user.level == 1) {
							user.attr('level', 1);
						} else {
							user.attr('level', userObject.level);
						}

						if (userObject.password.length) {
							user.attr('password', userObject.password);
						}

						user.attr('name', userObject.name);
						user.attr('email', userObject.email);

						user.save().then(function(data) {
							if (Global.user.id == user.id) {
								Global.user.attr(user.attr());
							}
							can.route.attr({controller: 'users'}, true);
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