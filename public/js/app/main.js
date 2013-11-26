define(['jquery', 'can', 'squel', 'can/view/modifiers', 'can/view/ejs', 'app/controllers/router', 'less!../../less/style'], function($, can, squel, undefined, undefined, Router) {
	Main = can.Control({

	}, {
		init: function(element, options) {
			
			console.log(Controller);
			new Router(this.element);
		}
	});

	Global = can.Construct({
		user: new can.Observe({
			name: ''
		}),
		state: new can.Observe({
			loggedIn: false
		})
	},{});



	new Main($('body'));
});