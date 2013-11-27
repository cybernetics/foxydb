define(['jquery', 'can', 'squel', 'can/view/modifiers', 'can/view/ejs', 'app/controllers/router', 'less!../../less/style'], function($, can, squel, undefined, undefined, Router) {
	Main = can.Control({

	}, {
		init: function(element, options) {
			
			console.log(Controller);
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
		tabs: new can.Model.List()
	},{});



	new Main($('body'));
});