/*
    Wrapper class to include require.js functionality around the AceMeiEditor class.

    MeiEditor class requires three parameters:
    @param element The DOM element which the AceMeiEditor data will be appended to. Presented as a jQuery selector string. (for example "#mei-editor")
    @param settings A JSON object with settings for both the MeiEditor class and AceMeiEditor class. Documented in meiEditor.js.
        Settings may contain skipXMLValidator, skipFileUpload, or skipEditPane set to true to skip loading any of the three plugins.
    @param plugins A list of filepaths for plugins (other than the default FileUpload and XMLValidator) to include.
*/
var MeiEditor = function(element, settings, plugins){
    var localSettings = {
        'meiEditorLocation': 'meix.js/'
    };

    //Checking for jQuery, jQueryUI, and Bootstrap 3+
    if (window.jQuery === undefined)
    {
        console.error("The ACE MEI Editor requires jQuery to function. Please make sure it is included above meiEditorPreloader.js and require.js.");
        return;
    }

    if ($.ui === undefined)
    {
        console.error("The ACE MEI Editor requires jQueryUI to function. Please make sure it is included above meiEditorPreloader.js and require.js.");
        return;
    }

    // NB (AH): JSHint complained of confusing use of !; switched to !==
    if (typeof $().emulateTransitionEnd !== 'function')
    {
        console.error("The ACE MEI Editor requires Twitter's Bootstrap library (version 3+) to function. Please make sure its JavaScript file is included above meiEditorPreloader.js and require.js.");
        return;
    }

    $.extend(localSettings, settings);

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
                meiEditor = $(element).AceMeiEditor(settings);

                //trigger a resize event to finalize layout of the screen
                $(window).trigger('resize');
            }
        };
    };

    //various variables
    window.meiEditorLocation = settings.meiEditorLocation;
    window.meiEditorPlugins = [];
    
    //if desired
    if (!settings.skipXMLValidator)
        plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorXMLValidator.js");

    if (!settings.skipFileUpload)
        plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorFileUpload.js");

    if (!settings.skipEditPane)
        plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorEditPane.js");

    window.pluginLoader = new meiEditorPluginLoader(plugins);

    //standardize the meiEditor path for require.js
    require.config({
        paths: {
            'meiEditor': window.meiEditorLocation + 'js/local/meiEditor'
        }
    });

    //initialize the dependency chain
    require(['meiEditor'], function()
    { 
        //once meiEditor.js exists, initialize each plugin by navigating through the plugins array.
        var pluginLength = plugins.length;

        while (pluginLength--)
        {
            require([plugins[pluginLength]]);
        }
    });
};