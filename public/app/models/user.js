steal(
	'can/model'
).then(
	function() {
		can.Model(
			'Model.User',
			{
				'create': 'POST /api/users',
				'findAll': 'GET /api/users',
				'findOne': 'GET /api/user/{id}',
				'update': 'PUT /api/user/{id}',
				'destroy': 'DELETE /api/user/{id}'
			},
			{

			}
		);
	}
);
