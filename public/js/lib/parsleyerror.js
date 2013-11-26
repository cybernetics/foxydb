define([
	'jquery'
], function(
	$
) {
	var parsleyError = function(element, error) {
		var id = 'parsley-customerror' ;
		var msg = {};
		msg[id] = error.text;
		element.find('input[name="' + error.field + '"]').removeClass('parsley-error').addClass('parsley-error');
		element.find('input[name="' + error.field + '"]').parsley().UI.removeError(id);
		element.find('input[name="' + error.field + '"]').parsley().UI.manageErrorContainer()
		element.find('input[name="' + error.field + '"]').parsley().UI.addError(msg);
	}
	return parsleyError;
});