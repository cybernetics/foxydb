define(['jquery', 'can', 'squel', 'can/view/modifiers', 'can/view/ejs', 'app/controllers/router', 'less!../../less/style'], function($, can, squel, undefined, undefined, Router) {
	Main = can.Control({

	}, {
		init: function(element, options) {
			
			new Router(this.element);
		}
	});

	Global = can.Construct({
		user: new can.Map({
			name: ''
		}),
		state: new can.Map({
			loggedIn: false
		}),
		tabs: new can.Model.List([]),
		overflowTabs: new can.Model.List([]),
		insights: new can.Model.List([])
	},{
		init: function() {
			Global.state.bind('loggedIn', function (evt, newvalue, oldvalue) {
				if (!newvalue) {
					$('.content.insight').remove();	
				}
			});
		}

	});

	new Global();

	new Main($('body'));
});