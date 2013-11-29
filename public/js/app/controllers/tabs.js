define([
	'jquery',
	'can',
	'can/map/sort'
], function(
	$,
	can
) {
	can.Control(
		'Controller.Tabs',
		{

		},
		{
			calculating: false,
			init: function(element, options) {
				var self = this;
				self.element.html('//js/app/views/pages/insight/tabs.ejs', {controller: this});
				self.element.find('.new').addClass('noshadow');
				Global.tabs.bind('length', function(ev, length) {
					self.updateSize();
				});


			},
			'.fa-times click': function(element, event) {
				index = element.parent().index();
				Global.tabs.splice(index, 1);
			},
			'li click': function(element, event) {
				event.stopPropagation();
				event.preventDefault();
				console.log(event);
				if($(event.target).is(':not(li)') && $(event.target).is(':not(a)') && $(event.target).is(':not(.fa-plus)')) {
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
				this.updateSize();
			},
			':controller route': function(){
				var r = can.route.attr();
				console.log('tabs route', r);
				if(r.controller == 'dashboard'){
					this.element.find('li').removeClass('active');
					this.element.find('.new').addClass('noshadow');	
				}
				this.updateSize();
			},
			updateSize: function() {
				if(!this.calculating) { 
					this.calculating = true;
					var usableWidth = $('header').width()-250-$('.tabsControls .new').width()-30;
					var totalWidth = 0;
					var visibleWidth = 0;
					var lastVisibleIndex = 0;

					this.element.find('.tabsInner li').each(function(index, item) {
						var tabWidth = $(item).outerWidth()+5;
						totalWidth += tabWidth;
						if(totalWidth <= usableWidth) {
							visibleWidth+= tabWidth;
							lastVisibleIndex = index;
						}


					});
					if(visibleWidth < totalWidth) {
						this.element.find('.drop').show();
						Global.tabs.comparator = 'sorter';
						if(this.element.find('.active').index() > lastVisibleIndex) {
							Global.tabs.sort();
							can.trigger(Global.tabs, 'length');
						}

					} else {
						this.element.find('.drop').hide();
					}
					

					this.element.find('.tabsInner').width(visibleWidth);
					this.calculating = false;
				} 
			},
			'{window} resize': function(element, event) {
				this.updateSize();
			}

		}
	)
});