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
			add: function(options) {
				// console.log ('eo me');
				this.element.find('.sidebar').html('//js/app/views/pages/database/sidebar.ejs', {});
				this.element.find('.inner').html('//js/app/views/pages/database/content.ejs', {});
				this.element.find('form').parsley();
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