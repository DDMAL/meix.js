require.config({
    baseUrl: '',
    paths: {
        'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min', //1.10.2
        'jquery-ui': '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min', //1.10.4
        'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min', //3.1.1
        'xml2json': 'https://x2js.googlecode.com/hg/xml2json',

        'filesaver': 'js/lib/FileSaver',
        'ace': 'ace/src/ace',
        'meilint': 'js/local/meilint',
        'meiEditor': 'js/local/meiEditor',
        'undostack': 'js/lib/UndoStack',

        /*
            Do not change anything above this line.
            Desired plugins follow:
        */
    }
});

require(['jquery', 'ace', 'bootstrap', 'undostack'], //prereqs
    function (){
        require(['jquery-ui'], function(){ //relies on jquery
            require(['meiEditor'], function(AceMeiEditor){ //relies on all the above
                var pluginLength = plugins.length;
                while(pluginLength--)
                {
                    require([plugins[pluginLength]], function(){

                    });
                }
                meiEditor = $("#mei-editor").AceMeiEditor(
                    {
                        'validatorLink': '../validation/',
                        'xmllintLoc': '../js/xmllint.js'
                    });
            });
        });
    }); 

