var parsleyError = function(element, error) {
	var id = 'parsley-customerror' ;
	var msg = {};
	msg[id] = error.text;
	element.find('input[name="' + error.field + '"]').removeClass('parsley-error').addClass('parsley-error');
	element.find('.field').removeClass('error');
	
	element.find('input[name="' + error.field + '"]').parsley().UI.removeError(id);
	element.find('input[name="' + error.field + '"]').parsley().UI.manageErrorContainer()
	element.find('input[name="' + error.field + '"]').parsley().UI.addError(msg);
	element.find('.parsley-error-list').addClass('ui red pointing above ui label');
	element.find('.parsley-error').parent().addClass('error');
}
