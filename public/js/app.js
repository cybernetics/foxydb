require.config({
    baseUrl: 'js/lib',
    paths: {
    	app: '../app',
        jquery: 'jquery-2.0.3.min',
        squel: 'squel/squel',
        parsley: 'parsleyjs/parsley',
        formParams: 'jquery.formParams/jquery.formParams'
    },
    map: {
	  '*': {
	    'less': 'require-less/less',
	    'text': 'requirejs-text/text',
	    'ejs': 'canjs-require-ejs/src/plugin/ejs'
	  }
	}
});
less = { relativeUrls: true }
requirejs(['app/main']);