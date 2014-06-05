window.meiEditorPlugins = [];

(function ($)
{
    var AceMeiEditor = function(element, options){
        var self = this;
        var settings = {
            pageData: {},
            element: $(element),
            aceTheme: "",
            iconPane: {},
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
            Strips a file name of characters that jQuery selectors may misinterpret.
            @param fileName The filename to strip.
        */
        this.stripFilenameForJQuery = function(fileName)
        {
            return fileName.replace(/\W+/g, "");
        }

        this.makeIconString = function()
        {
            var iconString = "";
            for(curIcon in settings.iconPane)
            {
                var thisIcon = settings.iconPane[curIcon];
                iconString += "<span class='tabIcon " + curIcon + "' title='" + thisIcon['title'] + "'>" + thisIcon['body'] + "</span>";
            }
            return iconString;
        }

        /*
            Returns active panel of the jQuery tab object.
        */
        this.getActivePanel = function(){
            var tabIndex = $("#openPages").tabs("option", "active");
            if(!tabIndex){
                $("#openPages").tabs("option", "active", 1);
                tabIndex = 1;
            }
            var activeTab = $($("#pagesList > li > a")[tabIndex]);
            return activeTab;
        }

        /*
            Function called when window is resized/editor pane is changed.
        */
        this.resizeComponents = function()
        {
            //these magic numbers are necessary for some reason to prevent a scrollbar. I'll look into this later when I have the time.
            $("#mei-editor").height($(window).height() - 5);
            var editorConsoleHeight = $("#editorConsole").height();
            $("#openPages").height($("#mei-editor").height() - $("#openPages").offset().top - 5 - editorConsoleHeight);
            var activeTab = self.getActivePanel().attr('href');
            $(activeTab).css('padding', '0px');
            $(activeTab).height($("#mei-editor").height() - $(activeTab).offset().top - 5);
            $(activeTab+" > .aceEditorPane").height($("#mei-editor").height() - $(activeTab).offset().top - 5 - editorConsoleHeight);
        }

        /*
            Called to reset the listeners for icons on the tabs.
        */
        this.resetIconListeners = function()
        {
                        
            /*
            $(".remove").unbind('click');
            $(".rename").unbind('click');
            $(".remove").on('click', function(e){
                var pageName = $($(e.target).siblings("a")[0]).text();
                self.removePageFromProject(pageName);
            });
            $(".rename").on('click', function(e){
                var pageName = $($(e.target).siblings("a")[0]).text();
                self.renamePage(pageName); 
            });*/
            for(curIcon in settings.iconPane)
            {
                var thisIcon = settings.iconPane[curIcon];
                $("." + curIcon).unbind('click');
                $("." + curIcon).on('click', thisIcon['click']);
            }
            $(".tabIcon").css('cursor', 'pointer'); //can't do this in CSS file for some reason, likely because it's dynamic

        }

        /*
            Called to add file visually and in settings.pageData.
            @param fileData Data in the original file.
            @param fileName Original file name.
        */
        this.addFileToGUI = function(fileData, fileName)
        {            
            var fileNameStripped = self.stripFilenameForJQuery(fileName);

            //add a new tab to the editor
            $("#pagesList").append("<li id='" + fileNameStripped + "-listitem'><a href='#" + fileNameStripped + "-wrapper'>" + fileName + "</a>" + self.makeIconString() + "</li>");
            $("#openPages").append("<div id='" + fileNameStripped + "-wrapper'>" //necessary for CSS to work
                + "<div id='" + fileNameStripped + "' class='aceEditorPane'>"
                + "</div></div>");
            
            self.resetIconListeners();

            //add the data to the pageData object and initialize the editor
            settings.pageData[fileName] = ace.edit(fileNameStripped); //add the file's data into a "pageData" array that will eventually feed into the ACE editor
            settings.pageData[fileName].resize();
            settings.pageData[fileName].setTheme(settings.aceTheme);
            settings.pageData[fileName].setSession(new ace.EditSession(fileData));
            settings.pageData[fileName].getSession().setMode("ace/mode/xml");

            //refresh the tab list with the new one in mind
            var numTabs = $("#pagesList li").length - 1;
            $("#openPages").tabs("refresh");
            $("#openPages").tabs({active: numTabs}); //load straight to the new one
        }

        /*
            Called to add the next available "untitled" page to the GUI.
        */
        this.addDefaultPage = function()
        {
            //check for a new version of "untitled__" that's not in use
            var newPageTitle = "untitled";
            var suffixNumber = 1;
            while(newPageTitle in settings.pageData)
            {
                suffixNumber += 1;
                newPageTitle = "untitled" + suffixNumber;
            }
            self.addFileToGUI("", newPageTitle);
        }

        /*
            Removes from page without project without saving.
            @param pageName The page to remove.
        */
        this.removePageFromProject = function(pageName)
        {
            var pageNameStripped = self.stripFilenameForJQuery(pageName);
            var activeIndex = $("#openPages").tabs("option", "active");

            //if removed panel is active, set it to one less than the current or keep it at 0 if this is 0
            if(pageName == self.getActivePanel().text())
            {
                var activeIndex = $("#openPages").tabs("option", "active");
                var numTabs = $("#pagesList li").length - 1;
                if(numTabs <= 2)
                {
                    $("#openPages").tabs("option", "active", 2);
                }
                else if(activeIndex == (numTabs))
                {
                    $("#openPages").tabs("option", "active", activeIndex - 1);
                }
                else 
                {
                    $("#openPages").tabs("option", "active", activeIndex + 1);

                }
            }

            //remove the <li> item in the tab list
            $("#" + pageNameStripped + "-listitem").remove();
            //remove the editor div
            $("#" + pageNameStripped + "-wrapper").remove();
            //delete the pageData item
            delete settings.pageData[pageName];

            //look through the selects...
            var curSelectIndex = $("select").length;
            while(curSelectIndex--)
            {
                //...and their children...
                var childArray = $($("select")[curSelectIndex]).children();
                var curChildIndex = childArray.length;
                while(curChildIndex--)
                {
                    var curChild = $(childArray[curChildIndex]);
                    //...for this page.
                    if(curChild.text() == pageName)
                    {
                        $(curChild).remove();
                    }
                }
            }

            //if nothing else exists except the new tab button, create a new default page
            if($("#pagesList li").length == 1)
            {
                self.addDefaultPage();
            }  

            //reloads the tab list with this one deleted to make sure tab indices are correct
            $("#openPages").tabs("refresh");
 
            self.events.publish("PageWasDeleted", [pageName]); //let whoever is interested know 
        }

        /*
            Renames a file
            @param clicked Rename icon that was clicked.
        */
        this.renamePage = function(pageName)
        {
            //used to commit file renaming
            var saveRename = function(parentListItem, originalName)
            {
                var newInput = parentListItem.children("input");

                //if this name already exists (including if it's unchanged)
                if(newInput.val() in settings.pageData)
                {
                    settings.meiConsole.append("<br>This page name already exists in this project. Please choose another.");
                    //remove the input item and make the original link visible again
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');
                }
                else 
                {
                    var newName = newInput.val();
                    //change the link's text and href
                    parentListItem.children("a").text(newName);
                    parentListItem.children("a").attr('href', '#' + self.stripFilenameForJQuery(newName));
                    
                    //remove the input and make the original link visible again
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');

                    //change this for the listitem, editor and wrapper as well
                    var listitemDiv = $("#" + self.stripFilenameForJQuery(originalName) + "-listitem");
                    listitemDiv.attr('id', self.stripFilenameForJQuery(newName) + "-listitem");
                    var editorDiv = $("#" + self.stripFilenameForJQuery(originalName));
                    editorDiv.attr('id', self.stripFilenameForJQuery(newName));
                    editorDiv.parent().attr('id', self.stripFilenameForJQuery(newName)+"wrapper");
                    
                    //change it in the pageData variable and in the select
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
                //lastly, remove the old bindings and put the original ones back on
                self.resetIconListeners();
            }

            //variables we may or may not need
            var parentListItem = $("#" + self.stripFilenameForJQuery(pageName) + "-listitem");
            var clicked = parentListItem.children("span.rename");
            var containedLink = parentListItem.children("a");
            containedLink.css('display', 'none');
            var originalName = containedLink.text();

            //create the input field on top of where the name was before
            parentListItem.append("<input class='input-ui-emulator' type='text' value='" + originalName + "''>");

            //when the pencil is clicked again
            $(clicked).unbind('click');
            $(clicked).on('click', function(e)
            {
                saveRename(parentListItem, originalName);
            });

            //or when the enter key is pressed in the field
            $(parentListItem.children("input")).on('keyup', function(e)
            {
                if(e.keyCode == 13){
                    saveRename(parentListItem, originalName);
                }
            });
        }

        /*
            Function ran on initialization.
        */
        var _init = function()
        {
            self.events.subscribe('NewFile', self.addFileToGUI);
            var localIcons = {"rename": {
                    'title': 'Rename file',
                    'body': '&#x270e;',
                    'click': function(e){
                        var pageName = $($(e.target).siblings("a")[0]).text();
                        self.renamePage(pageName); 
                    }
                },
                "remove": {
                    'title': 'Remove file',
                    'body': '&#x2573;',
                    'click': function(e){
                        var pageName = $($(e.target).siblings("a")[0]).text();
                        self.removePageFromProject(pageName);
                    }
                }
            };

            $.extend(settings.iconPane, localIcons);

            settings.element.append('<div class="navbar navbar-inverse navbar-sm" id="topbar">'
                + '<div ckass="container-fluid">'
                + '<div class="collapse navbar-collapse">'
                + '<ul class="nav navbar-nav" id="topbarContent">'
                + '<div class="navbar-brand">ACE MEI Editor</div>'
                + '</ul></div></div></div></div>'
                + '<div id="plugins-maximized-wrapper"></div>'
                + '<div id="openPages">'
                + '<ul id="pagesList">'
                + '<li id="newTabButton"><a href="#new-tab" onclick="$(\'#mei-editor\').data(\'AceMeiEditor\').addDefaultPage()">New tab</a></li>'
                + '</ul>'
                + '<div id="new-tab"></div>' //this will never be seen, but is needed to prevent a bug or two
                + '</div>'
                + '<div id="editorConsole">Console loaded!</div>'
                );

            settings.meiConsole = $("#editorConsole");

            //initializes tabs
            $("#openPages").tabs(
            {
                activate: function(){
                    //resize components to make sure the newly activated tab is the right size
                    self.resizeComponents(); 

                    //usually, the URL bar will change to the last tab visited because jQueryUI tabs use <a> href attributes; this prevents that by repalcing every URL change with "index.html" and no ID information
                    window.history.replaceState("","", "index.html");
                }
            });

            $("#newTabButton").attr('tabindex', -1); //make sure the new tab button isn't shown as default active

            //create the initial ACE editor
            self.addDefaultPage();

            //graphics stuff
            self.resizeComponents();
            $(window).on('resize', self.resizeComponents);

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