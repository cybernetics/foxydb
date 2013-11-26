define([
	'jquery',
	'can',
	'parsleyerror',
	'app/models/database',
	'app/controllers/database',
	'ace/ace',
	'app/controllers/insight'
], function(
	$,
	can,
	parsleyError
) {
	can.Control(
		'Controller.Dashboard',
		{

		},
		{
			init: function(element, options) {

			},
			index: function(options) {
				var self = this;
				
				
				Model.Database.findAll().then(function(data) {
					if (data.length === 0) {
						can.route.attr({controller: 'database', action: 'add'}, true);
					} else {
						self.element.find('.sidebar').html('//js/app/views/pages/dashboard/sidebar.ejs', {});
						self.element.find('.inner').html('//js/app/views/pages/dashboard/content.ejs', {insights: Model.Insight.findAll()});

					}
				});
			},
			'.insights .delete click': function(element, event) {
				event.preventDefault();
				if(confirm('Are You sure?')) {
					var insight = element.parent().data('insight')
					insight.destroy();
				}
			}

		}
	)
});