steal(
	'lib/parsleyjs/parsley.js',
	'lib/parsleyerror.js',
	'jquery/dom/form_params',
	'app/models/database.js'
).then(
	'app/views/pages/database/list.ejs',
	'app/views/pages/database/sidebar.ejs',
	'app/views/pages/database/edit.ejs',
	'app/views/pages/database/content.ejs',
	function() {
		can.Control(
			'Controller.Database',
			{

			},
			{
				init: function(element, options) {

				},
				list: function(element, options) {
					this.element.find('.inner').html('app/views/pages/database/list.ejs', {database: Model.Database.findAll()});
					this.element.find('.sidebar').html('app/views/pages/database/sidebar.ejs', {custom: 'Edit, delete or create new database within a second.'});
				},
				edit: function(element, options) {
					if (typeof element.id !== 'undefined' && element.id) {
						this.element.find('.inner').html('app/views/pages/database/edit.ejs', {database: Model.Database.findOne({id: element.id})});
					this.element.find('.sidebar').html('app/views/pages/database/sidebar.ejs', {});

					} else {
						can.route.attr({controller: 'database', action: 'list'}, true);
					}
				},
				add: function(options) {
					this.element.find('.sidebar').html('app/views/pages/database/sidebar.ejs', {});
					this.element.find('.inner').html('app/views/pages/database/content.ejs', {});
					this.element.find('form').parsley();
				},
				'.delete click': function(element, event) {
					event.preventDefault();

					if (confirm('You are about to remove database ' + element.data('database').title)) {
						$.ajax({
							url: '/api/database/' + element.data('database').id,
							type: 'delete',
							success: function(msg) {
								can.route.attr({controller: 'database', action: 'list'}, true);
							}
						});
					}
				},
				'form.updateDatabase submit': function(element, event) {
					event.preventDefault();

					if(element.parsley('validate')) {
						var database = element.data('database');
						database.attr(element.formParams());

						database.save().then(function(data) {
							can.route.attr({controller: 'database', action: 'list'}, true);
						}).fail(function(data) {
							if (typeof data.responseJSON != 'undefined'){
								parsleyError(element, data.responseJSON.error);
							}
						});
					}
				},
				'form.database submit': function(element, event) {
					event.preventDefault();
					if(element.parsley('validate')) {
						var database = new Model.Database(element.formParams());
						database.save().then(function(data) {
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