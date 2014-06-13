require.config({
    baseUrl: '',
    paths: {
        // the left side is the module ID,
        // the right side is the path to
        // the jQuery file, relative to baseUrl.
        // Also, the path should NOT include
        // the '.js' file extension. This example
        // is using jQuery 1.9.0 located at
        // js/lib/jquery-1.9.0.js, relative to
        // the HTML page.
        /*jquery: 'js/lib/jquery.min', //1.10.2
        jquery-ui: 'js/lib/jquery-ui.min', //1.10.4
        bootstrap: 'js/lib/bootstrap.min', //3.1.1
        xml2json: 'js/lib/xml2json',*/

        'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min', //1.10.2
        'jquery-ui': '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min', //1.10.4
        'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min', //3.1.1
        'xml2json': 'https://x2js.googlecode.com/hg/xml2json',

        'filesaver': 'js/lib/FileSaver',
        'ace': 'ace/src/ace',
        'meilint': 'js/local/meilint',
        'meiEditor': 'js/local/meiEditor',
        'undostack': 'js/lib/UndoStack'
    }
});

require(['jquery'],
    function ($){
        require(['ace', 'jquery-ui', 'bootstrap', 'undostack'], function(ace){
            require(['meiEditor'], function(AceMeiEditor){ //param may not be needed
                meiEditor = $("#mei-editor").AceMeiEditor(
                    {
                        'validatorLink': '../validation/',
                        'xmllintLoc': '../js/xmllint.js'
                    });
            });
        });
    }); 

