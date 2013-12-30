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
				this.index();
			},
			index: function(options) {
				var self = this;
				
				Global.state.bind('loggedIn', function (evt, newvalue, oldvalue) {
					if (newvalue) {
						Global.insights = new can.Model.List([]);
						Model.Database.findAll().then(function(data) {
							if (data.length === 0) {
								can.route.attr({controller: 'database', action: 'add'}, true);
								// window.location.hash = '!database/add';
							} else {
								Model.Insight.findAll().then(function(data) {
									Global.insights.attr(data);
								});
								self.element.find('.sidebar').html('//js/app/views/pages/dashboard/sidebar.ejs', {});
								self.element.find('.inner').html('//js/app/views/pages/dashboard/content.ejs', {insights: Global.insights});
							}
						});
					} else {
						self.element.find('.sidebar').html('');
						self.element.find('.inner').html('');
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