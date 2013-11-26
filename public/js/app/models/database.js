define([
	'can',
	'can/model'
	],
	function(can) {
		can.Model(
			'Model.Database',
			{
				'findAll': 'GET /api/databases',
				'create': 'POST /api/databases'
			},
			{

			}
		);
	}
);