//Taken from http://requirejs.org/docs/faq-advanced.html#css with the minimal amount of gratitude required to satisfy
function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
}

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

    window.meiEditorLocation = settings.meiEditorLocation;

    //Checking for jQuery, jQueryUI, and Bootstrap 3+
    if (window.jQuery === undefined)
    {
        console.warn("The ACE MEI Editor did not find jQuery included. Loading from assets.");
        require([window.meiEditorLocation + "js/lib/jquery.min.js"]);
    }

    if ($.ui === undefined)
    {
        console.warn("The ACE MEI Editor did not find jQueryUI included. Loading from assets.");
        require([window.meiEditorLocation + "js/lib/jquery-ui.min.js"]);
        loadCss(window.meiEditorLocation + "css/jquery-ui.min.css");
        loadCss(window.meiEditorLocation + "css/jquery-ui.structure.min.css");
        loadCss(window.meiEditorLocation + "css/jquery-ui.theme.min.css");
    }

    if (typeof $().emulateTransitionEnd !== 'function')
    {
        console.warn("The ACE MEI Editor did not find Bootstrap included. Loading from assets.");
        require([window.meiEditorLocation + "js/lib/bootstrap.min.js"]);
        loadCss(window.meiEditorLocation + "css/bootstrap.min.css");
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
                this.loadEditor();
            }
        };

        this.loadEditor = function()
        {
            $(element).AceMeiEditor(settings);
        };
    };

    //various variables
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
    if(pluginsIn)
    {
        plugins = plugins.concat(pluginsIn);
    }

    window.pluginLoader = new meiEditorPluginLoader(plugins);

    //standardize the meiEditor path for require.js
    require.config({
        paths: {
            'meiEditor': window.meiEditorLocation + 'js/local/meiEditor'
        }
    });

    //initialize the dependency chain
    require([window.meiEditorLocation + 'ace/src/ace.js', window.meiEditorLocation + 'js/local/utils.js'], function()
    { 
        require(['meiEditor'], function(){
            if(plugins.length === 0) window.pluginLoader.loadEditor();

            //if the user forces the order
            else if(settings.forceLoadOrder)
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
    });
};