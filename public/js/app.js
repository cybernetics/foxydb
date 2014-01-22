require.config({
    baseUrl: 'js/lib',
    paths: {
    	app: '../app',
        jquery: 'jquery-2.0.3.min',
        squel: 'squel/squel',
        parsley: 'parsleyjs/parsley',
        formParams: 'jquery.formParams/jquery.formParams',
        d3: 'd3.min'
    },
    map: {
	  '*': {
        'less': 'require-less/less',
        'css': 'require-css/css',
	    'text': 'requirejs-text/text',
	    'ejs': 'canjs-require-ejs/src/plugin/ejs'
	  }
	},
    shim: {
        d3: {
            exports: 'd3.min'
        }
    }
});
less = { relativeUrls: true }
requirejs(['app/main']);