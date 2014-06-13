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
        'meiEditor': 'js/local/meiEditor',
    }
});

var pluginLoader = new meiEditorPluginLoader(plugins);
require(['meiEditor'], function(AceMeiEditor)
{ 
    var pluginLength = plugins.length;
    while(pluginLength--)
    {
        require([plugins[pluginLength]]);
    }
});

