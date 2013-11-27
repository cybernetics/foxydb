define([
	'jquery',
	'can'
], function(
	$,
	can
) {
	can.Control(
		'Controller.Tabs',
		{

		},
		{
			init: function(element, options) {
				var self = this;
				var found = false;
				if(options.insight.attr('id') !== 'new') {
					Global.tabs.forEach(function(tab) {
						if(parseInt(can.route.attr('id')) === tab.attr('id')){ 
							found = true;
						}
					});
					if(!found) {
						Global.tabs.push(options.insight);
					}
				} else {
					Global.tabs.forEach(function(tab) {
						console.log(tab.attr);
						if(typeof tab.attr('id') === 'undefined'){ 
							tab.destroy();
						}
					});
				}
				self.element.html('//js/app/views/pages/insight/tabs.ejs', {currentInsight: options.insight});
			}

		}
	)
});