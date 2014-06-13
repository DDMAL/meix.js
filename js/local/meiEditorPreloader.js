/*
    Wrapper class to include require.js functionality around the AceMeiEditor class.

    MeiEditor class requires three parameters:
    @param element The DOM element which the AceMeiEditor data will be appended to. Presented as a jQuery selector string. (for example "#mei-editor")
    @param options A JSON object with options for both the MeiEditor class and AceMeiEditor class. Documented in meiEditor.js.
    @param plugins A list of filepaths for plugins (other than the default FileUpload and XMLValidator) to include.
*/
var MeiEditor = function(element, options, plugins){

    /*
        Used to asynchronously monitor loading plugins.

        @param pluginsIn List of plugins passed into the MeiEditor object, with XMLValidator and FileUpload added.
    */
    var meiEditorPluginLoader = function(pluginsIn)
    {
        var plugins = pluginsIn;
        var completed = [];
        
        //when another plugin is loaded...
        this.pluginLoaded = function()
        {
            //push an item into completed
            completed.push(true);

            //once completed is the same length as plugins
            if(completed.length == plugins.length){
                //initialize the editor
                meiEditor = $(element).AceMeiEditor(options);

                //trigger a resize event to finalize layout of the screen
                $(window).trigger('resize');
            }
        }
    }

    //various variables
    options.meiEditorLocation = (options.meiEditorLocation || 'meix.js/');
    window.meiEditorLocation = options.meiEditorLocation;
    window.meiEditorPlugins = [];
    plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorXMLValidator.js");
    plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorFileUpload.js");
    window.pluginLoader = new meiEditorPluginLoader(plugins);
    
    //standardize the meiEditor path for require.js
    require.config({
        paths: {
            'meiEditor': options.meiEditorLocation + 'js/local/meiEditor',
        }
    });

    //initialize the dependency chain
    require(['meiEditor'], function()
    { 
        //once meiEditor.js exists, initialize each plugin by navigating through the plugins array.
        var pluginLength = plugins.length;
        while(pluginLength--)
        {
            require([plugins[pluginLength]]);
        }
    });
};