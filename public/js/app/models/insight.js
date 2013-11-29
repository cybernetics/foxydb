define([
	'can',
	'can/model'
	],
	function(can) {
		can.Model(
			'Model.Insight',
			{
				'findOne': 'GET /api/insights/{id}',
				'findAll': 'GET /api/insights',
				'create': 'POST /api/insights',
				'destroy': 'DELETE /api/insights/{id}'
			},
			{
				sorter: can.compute(function() {
					console.log(this.attr('current'));
					return this.attr('current')?0:1;
				})
			}
		);
	}
);