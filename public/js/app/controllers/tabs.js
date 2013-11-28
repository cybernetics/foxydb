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
				self.element.html('//js/app/views/pages/insight/tabs.ejs', {});
				self.element.find('.new').addClass('noshadow');
				
			},
			'.fa-times click': function(element, event) {
				index = element.parent().index();
				Global.tabs.splice(index, 1);
			},
			'li click': function(element, event) {
				event.stopPropagation();
				event.preventDefault();
				console.log(event);
				if($(event.target).is(':not(li)') && $(event.target).is(':not(a)')) {
					return;
				}
				if(element.hasClass('new')) {
					can.route.attr({controller: 'dashboard'}, true);
					element.addClass('noshadow');
				} else {
					this.element.find('.new').removeClass('noshadow');
					element.addClass('active')
					var data = element.data('insight');
					can.route.attr({controller: 'insight', action: 'edit', id: data.attr('id')}, true);
				}
				Global.tabs.forEach(function(tab) {
					tab.attr({current: false});
				});
			},
			':controller route': function(){
				var r = can.route.attr();
				console.log('tabs route', r);
				if(r.controller == 'dashboard'){
					this.element.find('li').removeClass('active');
					this.element.find('.new').addClass('noshadow');	
				}
			}

		}
	)
});