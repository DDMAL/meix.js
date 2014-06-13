var MeiEditor = function(element, options, plugins){
    var editorInit = function()
    {
        meiEditor = $(element).AceMeiEditor(options);
    }     

    var meiEditorPluginLoader = function(pluginsIn)
    {
        var plugins = pluginsIn;
        var completed = [];
        
        this.pluginLoaded = function()
        {
            completed.push(true);
            if(completed.length == plugins.length){
                editorInit();
                $(window).trigger('resize');
            }
        }
    }

    options.meiEditorLocation = (options.meiEditorLocation || 'meix.js/');
    window.meiEditorLocation = options.meiEditorLocation;
    window.meiEditorPlugins = [];
    plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorXMLValidator.js");
    plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorFileUpload.js");
    window.pluginLoader = new meiEditorPluginLoader(plugins);
    require.config({
        baseUrl: '',
        paths: {
            'meiEditor': options.meiEditorLocation + 'js/local/meiEditor',
        }
    });

    require(['meiEditor'], function()
    { 
        var pluginLength = plugins.length;
        while(pluginLength--)
        {
            require([plugins[pluginLength]]);
        }
    });
};