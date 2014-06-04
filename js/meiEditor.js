window.meiEditorPlugins = [];

(function ($)
{
    var AceMeiEditor = function(element, options){
        var self = this;
        var settings = {
            editor: "",
            element: $(element)
        }

        $.extend(settings, options);

        //for topbar plugins
        var previousSizes = {};

        this.events = (function (){
            var cache = {},
            /**
             *      Events.publish
             *      e.g.: Events.publish("/Article/added", [article], this);
             *
             *      @class Events
             *      @method publish
             *      @param topic {String}
             *      @param args     {Array}
             *      @param scope {Object} Optional
             */
            publish = function (topic, args, scope) {
                if (cache[topic]) {
                    var thisTopic = cache[topic],
                        i = thisTopic.length;

                    while (i--) {
                        thisTopic[i].apply( scope || this, args || []);
                    }
                }
            },
            /**
             *      Events.subscribe
             *      e.g.: Events.subscribe("/Article/added", Articles.validate)
             *
             *      @class Events
             *      @method subscribe
             *      @param topic {String}
             *      @param callback {Function}
             *      @return Event handler {Array}
             */
            subscribe = function (topic, callback) {
                if (!cache[topic]) {
                    cache[topic] = [];
                }
                cache[topic].push(callback);
                return [topic, callback];
            },
            /**
             *      Events.unsubscribe
             *      e.g.: var handle = Events.subscribe("/Article/added", Articles.validate);
             *              Events.unsubscribe(handle);
             *
             *      @class Events
             *      @method unsubscribe
             *      @param handle {Array}
             *      @param completely {Boolean}
             */
            unsubscribe = function (handle, completely) {
                var t = handle[0],
                    i = cache[t].length;

                if (cache[t]) {
                    while (i--) {
                        if (cache[t][i] === handle[1]) {
                            cache[t].splice(cache[t][i], 1);
                            if(completely){ delete cache[t]; }
                        }
                    }
                }
            };

            return {
                    publish: publish,
                    subscribe: subscribe,
                    unsubscribe: unsubscribe
            };
        }());

        /*
            Stolen with no mercy from http://stackoverflow.com/questions/881510/jquery-sorting-json-by-properties
        */
        var jsonSort = function(jsonObject, prop, asc) 
        {
            newJsonObject = jsonObject.sort(function(a, b) 
            {
                if (asc) return (a[prop] > b[prop]);
                else return (b[prop] > a[prop]);
            });
            return newJsonObject;
        }

        var getActivePanel = function(){
            var tabIndex = $("#openPages").tabs("option", "active");
            var activeTab = $($("#pagesList > li > a")[tabIndex]).attr('href');
            console.log(activeTab);
            return activeTab;
        }

        var resizeComponents = function()
        {
            $("#mei-editor").height($(window).height());
            var activeTab = getActivePanel();
            $(activeTab).height($("#mei-editor").height() - $(activeTab).offset().top);
        }

        this.createModal = function(modalClass, small, modalBody, primaryTitle){
            var modalSize = small ? "modal-sm" : "modal-lg";
            settings.element.append("<div id='" + modalClass + "' class='modal fade'>"
                + '<div class="modal-dialog ' + modalSize + '">'
                    + '<div class="modal-content">'
                        + '<div class="modal-body">'
                            + modalBody
                        + '</div>'
                        + '<div class="modal-footer">'
                            + '<button type="button" class="btn btn-default" id="' + modalClass + '-close" data-dismiss="modal">Close</button>'
                            + '<button type="button" class="btn btn-primary" id="' + modalClass + '-primary">' + primaryTitle + '</button>'
                        + '</div>'
                    + '</div>'
                + '</div>');
        }

        /*
            Function ran on initialization.
        */
        var _init = function()
        {
            settings.element.append('<div class="navbar navbar-inverse navbar-sm" id="topbar">'
                + '<div ckass="container-fluid">'
                + '<div class="collapse navbar-collapse">'
                + '<ul class="nav navbar-nav" id="topbarContent">'
                + '<div class="navbar-brand">ACE MEI Editor</div>'
                //+ '<span class="headerObject dropdown" control="plugins" id="plugins-dropdown">&#x25bc;</span>'
                + '</ul></div></div></div></div>'
                + '<div id="plugins-maximized-wrapper"></div>'
                + '<div id="openPages">'
                + '<ul id="pagesList">'
                + '<li><a href="#editor">New Document</a></li>'
                + '</ul>'
                + '<div id="editor"></div>'
                + '</div>'
                );

            //for each plugin...
            $.each(window.meiEditorPlugins, function(index, curPlugin)
            {
                //append a formattable structure
                $("#topbarContent").append('<li class="dropdown">'
                    + '<a href="#" class="dropdown-toggle" data-toggle="dropdown">' + curPlugin.title + ' <b class="caret"></b></a>'
                    + '<ul class="dropdown-menu" id="dropdown-' + curPlugin.divName + '">'
                    + '</ul></li>');

                for(optionName in curPlugin.dropdownOptions){
                    optionClick = curPlugin.dropdownOptions[optionName];
                    $("#dropdown-"+curPlugin.divName).append("<li><a onclick='" + optionClick + "'>" + optionName + "</a></li>");
                }

                /*$("#topbar").append("<div class='headerObject title'>"+curPlugin.minimizedTitle+"</div>");
                $("#plugins-maximized-wrapper").append('<div id="' + curPlugin.divName + '" class="toolbar-object">' //creates toolbar object
                    + '<div id="' + curPlugin.divName + '-title-wrapper" class="title-wrapper">'
                    + '<span id="' + curPlugin.divName + '-minimized-title" class="plugin-title">' + curPlugin.minimizedTitle + '</span>'
                    + curPlugin.minimizedAppearance //also user-settable
                    + '<span class="dropdown" control="' + curPlugin.divName + '" id="' + curPlugin.divName + '-dropdown">&#x25bc;</span>' //maximize button
                    + '</div>'
                    + '<div id="' + curPlugin.divName + '-maximized-wrapper" class="maximized-wrapper">'
                    + curPlugin.maximizedAppearance //user-settable
                    + '</div>'
                    + '</div>'
                    );*/

                // Call the init function and check return value
                var pluginReturn = curPlugin.init(self, settings);
                
                // If it returns false, consider the plugin disabled
                if (!pluginReturn)
                {
                    $("#" + curPlugin.divName).remove();
                    return;
                }

            });  

            $(".dropdown").on('click', function(e)
            {
                controlledDiv = $(e.target).attr('control');
                $("#" + controlledDiv + "-maximized-wrapper").slideToggle({'complete': function(){
                    if($("#" + controlledDiv + "-maximized-wrapper").is(':visible'))
                    {
                        $("#" + controlledDiv + "-dropdown").html('&#x25b2;');
                    } 
                    else
                    {
                        $("#" + controlledDiv + "-dropdown").html('&#x25bc;');
                    }
                }});
                $("")
            });        
            $("#openPages").tabs({
                activate: function(event, ui){
                    $("#mei-editor").height($(window).height());
                    $(ui.newPanel).height($(window).height() - $(ui.newPanel).offset().top);
                }
            });
            settings.editor = ace.edit("editor"); //create the ACE editor
            //settings.editor.setTheme("ace/theme/ambiance");
            settings.editor.getSession().setMode("ace/mode/xml");

            resizeComponents();
            $(window).on('resize', resizeComponents);
        };

        _init();

    }

    $.fn.AceMeiEditor = function (options)
    {
        return this.each(function ()
        {
            var element = $(this);

            // Return early if this element already has a plugin instance
            if (element.data('AceMeiEditor'))
                return;

            // Save the reference to the container element
            options.parentSelector = element;

            // Otherwise, instantiate the document viewer
            var meiEditor = new AceMeiEditor(this, options);
            element.data('AceMeiEditor', meiEditor);
        });
    };

})(jQuery);