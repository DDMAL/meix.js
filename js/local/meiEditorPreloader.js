/*
    Wrapper class to include require.js functionality around the AceMeiEditor class.

    MeiEditor class requires three parameters:
    @param element The DOM element which the AceMeiEditor data will be appended to. Presented as a jQuery selector string. (for example "#mei-editor")
    @param settings A JSON object with settings for both the MeiEditor class and AceMeiEditor class.
        Settings may contain skipXMLValidator, skipFileUpload, or skipEditPane set to true to skip loading any of the three plugins.
    @param plugins A list of filepaths for desired plugins (other than the default FileUpload, EditPane, and XMLValidator) to include.
*/
var MeiEditor = function(element, settingsIn, pluginsIn){
    var settings = {
        'forceLoadOrder': true,             //forces the default plugins to load Files > Edit > Validator > (pluginsIn) by default. If false, will load all plugins asynchronously.
        'meiEditorLocation': 'meix.js/',    //root folder for the meix.js code
        'skipXMLValidator': false,          //If set to true, will skip loading the XML Validator plugin.
        'skipFileUpload': false,            //If set to true, will skip loading the File manager plugin.
        'skipEditPane': false               //If set to true, will skip loading the Edit pane plugin.
    };

    $.extend(settings, settingsIn)

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
                $(window).trigger('allReady');
            }
        };
    };

    //various variables
    window.meiEditorLocation = settings.meiEditorLocation;
    window.meiEditorPlugins = [];
    var plugins = [];

    //if desired    
    if (!settings.skipFileUpload)
        plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorFileUpload.js");

    if (!settings.skipEditPane)
        plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorEditPane.js");

    if (!settings.skipXMLValidator)
        plugins.push(window.meiEditorLocation + "js/local/plugins/meiEditorXMLValidator.js");

    //merges default with incoming
    plugins = plugins.concat(pluginsIn);

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
        //if the user forces the order
        if(settings.forceLoadOrder)
        {
            function recursePlugins(current)
            {
                //require the current number, when it's finished require the next number
                require([plugins[current]], function()
                    {
                        if(current < plugins.length)
                        {
                            recursePlugins(current + 1);
                        }
                        //until we're at the last one
                        else
                        {
                            return;
                        }
                    });
            }
            //initialize it
            recursePlugins(0);
        }
        else
        {
            //once meiEditor.js exists, initialize each plugin by navigating through the plugins array.
            var pluginLength = plugins.length;

            while (pluginLength--)
            {
                require([plugins[pluginLength]]);
            }

        }
    });
};