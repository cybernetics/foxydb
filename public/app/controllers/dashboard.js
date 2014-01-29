steal(
	'app/controllers/database.js',
	'lib/ace'
).then(
	'app/views/pages/dashboard/sidebar.ejs',
	'app/views/pages/dashboard/content.ejs',
	function() {
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

							Model.Insight.findAll().then(function(data) {
								Global.insights.attr(data);
							});
							self.element.find('.sidebar').html('app/views/pages/dashboard/sidebar.ejs', {});
							self.element.find('.inner').html('app/views/pages/dashboard/content.ejs', {insights: Global.insights});
						} else {
							self.element.find('.sidebar').html('');
							self.element.find('.inner').html('');
						}
					});
				},
				'.remove click': function(element, event) {
					event.preventDefault();
					var self = this;

					if (!self.element.find('.confirmModal').length) {
						self.element.find('.inner').append('app/views/layout/modals/confirm.ejs', {title: 'Insight remove', content: 'You are about to remove insight.', positive: 'Remove', negative: 'Cancel'});
					}

					self.element.find('.confirmModal').modal({
						closable: false,
						debug: false,
						detachable: false,
						allowMultiple: false,
						onApprove: function () {
							var insight = element.parents('.item').data('insight');
							insight.destroy();
						}
					}).modal('show');
				}

			}
		)
	}
);
