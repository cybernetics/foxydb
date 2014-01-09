define([
	'jquery', 
	'can', 
	'parsley', 
	'parsleyerror',
	'formParams', 
	'app/models/user'
], function(
	$, 
	can,
	undefined,
	parsleyError
) {
	can.Control(
		'Controller.Users',
		{

		},
		{
			init: function(element, options) {
				this.element.find('.sidebar').html('/js/app/views/pages/users/sidebar.ejs', {});
			},
			index: function() {
				this.element.find('.inner').html('/js/app/views/pages/users/list.ejs', {users: Model.User.findAll({})});
			}
		}
	)
});