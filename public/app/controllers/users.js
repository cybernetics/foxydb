steal(
	'lib/parsleyjs/parsley.js',
	'lib/parsleyerror.js',
	'lib/jquery.formParams/jquery.formParams.js',
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
					this.element.find('.inner').html('app/views/pages/users/list.ejs', {users: Model.User.findAll({})});
				},
				add: function(element, options) {
					this.element.find('.inner').html('app/views/pages/users/new.ejs', {});
					//this.element.find('form').parsley();
				},
				edit: function(element, options) {
					if (typeof element.id !== 'undefined') {
						this.element.find('.inner').html('app/views/pages/users/update.ejs', {user: Model.User.findOne({id: element.id})});
						//this.element.find('form').parsley();				
					} else {
						can.route.attr({controller: 'users'}, true);
					}
				},
				'.delete click': function(element, event) {
					event.preventDefault();

					if (confirm('You are about to remove user ' + element.data('user').name)) {
						$.ajax({
							url: '/api/user/' + element.data('user').id,
							type: 'delete',
							success: function(msg) {
								can.route.attr({controller: 'users'}, true);
							}
						});
					}
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

						if (typeof userObject.level === 'undefined') {
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