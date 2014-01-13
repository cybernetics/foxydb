define([
	'jquery', 
	'can', 
	'parsleyerror',
	'app/models/database'
], function(
	$, 
	can,
	parsleyError
) {
	can.Control(
		'Controller.Database',
		{

		},
		{
			init: function(element, options) {

			},
			list: function(element, options) {
				this.element.find('.inner').html('//js/app/views/pages/database/list.ejs', {database: Model.Database.findAll()});
				this.element.find('.sidebar').html('//js/app/views/pages/insight/database.ejs', {});
			},
			edit: function(element, options) {
				if (typeof element.id !== 'undefined' && element.id) {
					this.element.find('.inner').html('//js/app/views/pages/database/edit.ejs', {database: Model.Database.findOne({id: element.id})});
				} else {
					can.route.attr({controller: 'database', action: 'list'}, true);
				}
			},
			add: function(options) {
				this.element.find('.sidebar').html('//js/app/views/pages/database/sidebar.ejs', {});
				this.element.find('.inner').html('//js/app/views/pages/database/content.ejs', {});
				this.element.find('form').parsley();
			},
			'.sidebar form submit': function(element, event) {
				event.preventDefault();
				var self = this;
				if(element.parsley('validate')) {
					var database = new Model.Database(element.formParams());
					database.save().then(function(data) {
						Model.Database.findAll().then(function(data) {
							can.route.attr({controller: 'database', action: 'list'}, true);
						});
					}).fail(function(data) {
						if (typeof data.responseJSON != 'undefined'){
							parsleyError(element, data.responseJSON.error);
						}
					});
				}
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
			'.updateDatabase form submit': function(element, event) {
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
			'.database form submit': function(element, event) {
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
});