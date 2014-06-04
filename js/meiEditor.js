window.meiEditorPlugins = [];

(function ($)
{
    var AceMeiEditor = function(element, options){
        var self = this;
        var settings = {
            pageData: {},
            element: $(element),
            aceTheme: "ace/theme/ambiance",
            iconPane: []
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

        /*
            Returns active panel of the jQuery tab object.
        */
        var getActivePanel = function(){
            var tabIndex = $("#openPages").tabs("option", "active");
            if(!tabIndex){
                $("#openPages").tabs("option", "active", 0);
                tabIndex = 0;
            }
            var activeTab = $($("#pagesList > li > a")[tabIndex]);
            return activeTab;
        }

        /*
            Function called when window is resized/editor pane is changed.
        */
        var resizeComponents = function()
        {
            $("#mei-editor").height($(window).height());
            var activeTab = getActivePanel().attr('href');
            $(activeTab).css('padding', '0px');
            $(activeTab+" > .aceEditorPane").height($("#mei-editor").height() - $(activeTab).offset().top);
        }

        /* 
            Shorthand function for creating a bootstrap modal.
            @param modalID String for a unique identifier for the modal
            @param small Boolean to determine whether or not it is a bootstrap modal-sm
            @param modalBody HTML string for the content of the modal
            @param primaryTitle Text to put on the primary (not-"close") button at the bottom of the modal.
        */
        this.createModal = function(modalID, small, modalBody, primaryTitle)
        {
            var modalSize = small ? "modal-sm" : "modal-lg";
            settings.element.append("<div id='" + modalID + "' class='modal fade'>"
                + '<div class="modal-dialog ' + modalSize + '">'
                    + '<div class="modal-content">'
                        + '<div class="modal-body">'
                            + modalBody
                        + '</div>'
                        + '<div class="modal-footer">'
                            + '<button type="button" class="btn btn-default" id="' + modalID + '-close" data-dismiss="modal">Close</button>'
                            + '<button type="button" class="btn btn-primary" id="' + modalID + '-primary">' + primaryTitle + '</button>'
                        + '</div>'
                    + '</div>'
                + '</div>');
        }

        /*
            Shorthand function for creating an HTML select object from the keys of a JSON object.
            @param idAppend A string to append to the ID of the select object to make it unique.
            @param jsonObject Source for the select object.
        */
        this.createSelect = function(idAppend, jsonObject)
        {
            var retString = "<select id='select" + idAppend + "'>";
            for (curKey in jsonObject){
                retString += "<option name='" + curKey + "'>" + curKey + "</option>";
            }
            return retString + "</select>";
        }

        /*
            Strips a file name of characters that jQuery selectors may misinterpret.
            @param fileName The filename to strip.
        */
        this.stripFilenameForJQuery = function(fileName)
        {
            return fileName.replace(/\W+/g, "");
        }

        /*
            Shorthand function for creating an HTML list object from the keys of a JSON object.
            @param jsonObject Source for the list object.
        */
        this.createList = function(idAppend, jsonObject){
            var retString = "<ul id='list" + idAppend + "'>";
            for (curKey in jsonObject){
                retString += "<li id='" + curKey + "'>" + curKey + "</li>";
            }
            return retString + "</ul>";
        }

        /*
            Called to reset the listeners for icons on the tabs.
        */
        var resetIconListeners = function()
        {
            $(".tabIcon").css('cursor', 'pointer'); //can't do this in CSS file for some reason, likely because it's dynamic
            $(".remove").on('click', function(e){
                var pageName = $($(e.target).siblings("a")[0]).text();
                self.removePageFromProject(pageName, e.target);
            });
            $(".rename").on('click', function(e){
                self.renameFile(e.target);
            });
        }

        /*
            Called to add file visually and in settings.pageData.
            @param fileData Data in the original file.
            @param fileNameStripped Stripped file name for jQuery ID usage. May not be necessary.
            @param fileNameOriginal Original file name for variable usage.
        */
        this.addFileToGUI = function(fileData, fileNameStripped, fileNameOriginal)
        {            
            //add a new tab to the editor
            $("#pagesList").append("<li><a href='#" + fileNameStripped + "wrapper'>" + fileNameOriginal + "</a>" + settings.iconPane.join("") + "</li>");
            $("#openPages").append("<div id='" + fileNameStripped + "wrapper'>" //necessary for CSS to work
                + "<div id='" + fileNameStripped + "' class='aceEditorPane'>"
                + "</div></div>");
            $("#openPages").tabs("refresh");  

            resetIconListeners();

            //add the data to the pageData object
            settings.pageData[fileNameOriginal] = ace.edit(fileNameStripped); //add the file's data into a "pageData" array that will eventually feed into the ACE editor
            settings.pageData[fileNameOriginal].resize();
            settings.pageData[fileNameOriginal].setTheme(settings.aceTheme);
            settings.pageData[fileNameOriginal].setSession(new ace.EditSession(fileData));
            settings.pageData[fileNameOriginal].getSession().setMode("ace/mode/xml");
        }

        /*
            Removes from page without project without saving.
            @param pageName The page to remove.
            @param clicked Remove icon that was clicked.
        */
        this.removePageFromProject = function(pageName, clicked)
        {
            var pageNameStripped = self.stripFilenameForJQuery(pageName);

            //if removed panel is active, set it 
            if(pageName == getActivePanel().text())
            {
                var activeIndex = $("#openPages").tabs("option", "active");
                if(activeIndex != 0)
                {
                    $("#openPages").tabs("option", "active", activeIndex - 1);
                }
            }


            $(clicked).parent().remove();
            $("#"+self.stripFilenameForJQuery(pageName)).remove();
            delete settings.pageData[pageName];

            var curSelectIndex = $("select").length;
            while(curSelectIndex--)
            {
                var childArray = $($("select")[curSelectIndex]).children();
                var curChildIndex = childArray.length;
                while(curChildIndex--)
                {
                    var curChild = $(childArray[curChildIndex]);
                    if(curChild.text() == pageName)
                    {
                        $(curChild).remove();
                    }
                }
            }

            if($("#pagesList").children().length == 0)
            {
                self.addFileToGUI("", "untitled", "untitled");
            }

            self.events.publish("PageWasDeleted", [pageName]); //let whoever is interested know 
        }

        /*
            Renames a file
            @param clicked Rename icon that was clicked.
        */
        this.renameFile = function(clicked)
        {
            var saveRename = function(parentListItem, originalName)
            {
                var newInput = parentListItem.children("input");
                if(newInput.val() == originalName)
                {
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');
                } 
                else 
                {
                    var newName = newInput.val();
                    parentListItem.children("a").text(newName);
                    parentListItem.children("a").attr('href', '#' + self.stripFilenameForJQuery(newName));
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');

                    var editorDiv = $("#"+self.stripFilenameForJQuery(originalName))
                    editorDiv.attr('id', self.stripFilenameForJQuery(newName));
                    editorDiv.parent().attr('id', self.stripFilenameForJQuery(newName)+"wrapper");
                    settings.pageData[newName] = settings.pageData[originalName];

                    var curSelectIndex = $("select").length;
                    while(curSelectIndex--)
                    {
                        var childArray = $($("select")[curSelectIndex]).children();
                        var curChildIndex = childArray.length;
                        while(curChildIndex--)
                        {
                            var curChild = $(childArray[curChildIndex]);
                            if(curChild.text() == originalName)
                            {
                                $(curChild).text(newName);
                                $(curChild).attr('name', newName);
                            }
                        }
                    }
                }
                resetIconListeners();
            }


            var parentListItem = $(clicked).parent();
            var containedLink = parentListItem.children("a");
            containedLink.css('display', 'none');
            var originalName = containedLink.text();

            parentListItem.append("<input class='input-ui-emulator' type='text' value='" + originalName + "''>");

            $(clicked).on('click', function(e)
            {
                saveRename(parentListItem, originalName);
            });

            $(parentListItem.children("input")).on('keyup', function(e)
            {
                if(e.keyCode == 13){
                    saveRename(parentListItem, originalName);
                }
            });

            console.log(originalName);
        }

        /*
            Function ran on initialization.
        */
        var _init = function()
        {
            self.events.subscribe('NewFile', self.addFileToGUI);
            settings.iconPane.push("<span class='rename tabIcon'>&#x270e;</span><span class='remove tabIcon'>&#x2573;</span>");

            settings.element.append('<div class="navbar navbar-inverse navbar-sm" id="topbar">'
                + '<div ckass="container-fluid">'
                + '<div class="collapse navbar-collapse">'
                + '<ul class="nav navbar-nav" id="topbarContent">'
                + '<div class="navbar-brand">ACE MEI Editor</div>'
                + '</ul></div></div></div></div>'
                + '<div id="plugins-maximized-wrapper"></div>'
                + '<div id="openPages">'
                + '<ul id="pagesList">'
                + '</ul>'
                + '</div>'
                );

            //initializes tabs
            $("#openPages").tabs({
                activate: resizeComponents
            });

            //create the initial ACE editor
            self.addFileToGUI("", "untitled", "untitled");

            //graphics stuff
            resizeComponents();
            $(window).on('resize', resizeComponents);

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

                // Call the init function and check return value
                var pluginReturn = curPlugin.init(self, settings);
                
                // If it returns false, consider the plugin disabled
                if (!pluginReturn)
                {
                    $("#" + curPlugin.divName).remove();
                    return;
                }

            });        
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