define([
	'can',
	'can/model'
	],
	function(can) {
		can.Model(
			'Model.User',
			{
				'create': 'POST /api/users',
				'findAll': 'GET /api/users'
			},
			{

			}
		);
	}
);