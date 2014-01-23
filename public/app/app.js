steal(
	'jquery',
	'can',
	'can/view/modifiers',
	'app/controllers/router.js',
	'lib/d3.min.js',
	'lib/md5.js',
	'less/style.less',
	'semantic/css/semantic.min.css'
).then(
	function() {
		Main = can.Control({

		}, {
			init: function(element, options) {
				new Controller.Router(this.element);
			}
		});

		Global = can.Construct({
			user: new can.Map({
				name: '',
				email: ''
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
						$('.pagecontent.insight').remove();	
					}
				});
			}

		});

		$(document).ajaxError(function (event, jqxhr, settings, exception) {
			if (typeof jqxhr.responseJSON === 'undefined') {
				if (jqxhr.status != 404 && typeof jqxhr.responseText !== 'undefined' && jqxhr.responseText.length){
					$('.errorMessage').html(jqxhr.responseText);
					$('.errorMessage').stop(true, true).slideDown();

					setTimeout(function () {
						$('.errorMessage').stop(true, true).slideUp();
					}, 5000);
				}
			}
		});

		new Global();

		new Main($('body'));
	}
);

