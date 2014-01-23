steal(
	'can/model'
).then(
	function() {
		can.Model(
			'Model.Database',
			{
				'findAll': 'GET /api/databases',
				'findOne': 'GET /api/database/{id}',
				'create': 'POST /api/databases',
				'update': 'PUT /api/database/{id}',
				'delete': 'DELETE /api/database/{id}'
			},
			{

			}
		);
	}
);
