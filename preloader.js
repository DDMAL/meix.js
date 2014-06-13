var meiEditorPluginLoader = function(pluginsIn)
{
    var plugins = pluginsIn;
    var completed = [];
    
    this.pluginLoaded = function()
    {
        completed.push(true);
        if(completed.length == plugins.length){
            init();
        }
    }
}

require.config({
    baseUrl: '',
    paths: {
        'jquery': '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min', //1.10.2
        'jquery-ui': '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min', //1.10.4
        'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min', //3.1.1

        'ace': 'ace/src/ace',
        'meiEditor': 'js/local/meiEditor',
        'undostack': 'js/lib/UndoStack',
    }
});

/*
    The tree of dependencies needs to be manually assembled here to make sure that the
    jQuery $ identifier is present in the scope where the meiEditor is created.
*/
var pluginLoader = new meiEditorPluginLoader(plugins);
require(['jquery', 'ace', 'undostack'], //prereqs
    function ($){
        require(['jquery-ui', 'bootstrap'], function(){ //rely on jquery
            require(['meiEditor'], function(AceMeiEditor){ //relies on all the above
                var pluginLength = plugins.length;
                while(pluginLength--)
                {
                    require([plugins[pluginLength]], function(){
                    });
                }
            });
        });
    }); 

