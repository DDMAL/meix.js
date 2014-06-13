require(['ace/src/ace', 'js/lib/UndoStack'], function(){
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
            undoManager: new UndoStack(),
            editTimeout: "",
            initCursor: "",
            initDoc: "",
        }

        $.extend(settings, options);

        //for topbar plugins
        var previousSizes = {};

        this.events = (function ()
        {
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
            @param primaryTitle [Optional] Text to put on the primary (not-"close") button at the bottom of the modal. Will only have a close button if not included.
        */
        this.createModal = function(modalID, small, modalBody, primaryTitle)
        {
            var modalSize = small ? "modal-sm" : "modal-md";
            var primaryTitleString = primaryTitle ? '<button type="button" class="btn btn-primary" id="' + modalID + '-primary">' + primaryTitle + '</button>' : "";
            settings.element.append("<div id='" + modalID + "' class='modal fade'>"
                + '<div class="modal-dialog ' + modalSize + '">'
                    + '<div class="modal-content">'
                        + '<div class="modal-body">'
                            + modalBody
                        + '</div>'
                        + '<div class="modal-footer">'
                            + '<button type="button" class="btn btn-default" id="' + modalID + '-close" data-dismiss="modal">Close</button>'    
                            +  primaryTitleString
                        + '</div>'
                    + '</div>'
                + '</div>');
        }

        /*
            Shorthand function for creating an HTML select object from the keys of a JSON object/values of an array.
            @param idAppend A string to append to the ID of the select object to make it unique.
            @param jsonObject Source for the select object.
            @param isArr [optional] Set to true if jsonObject is actually an array; will use values
        */
        this.createSelect = function(idAppend, jsonObject, isArr)
        {
            var retString = "<select id='select" + idAppend + "'>";
            for (curKeyIndex in jsonObject)
            {
                var curKey = (isArr ? jsonObject[curKeyIndex] : curKeyIndex);
                retString += "<option name='" + curKey + "'>" + curKey + "</option>";
            }
            return retString + "</select>";
        }

        /*
            Shorthand function for creating an HTML list object from the keys of a JSON object.
            @param jsonObject Source for the list object.
        */
        this.createList = function(idAppend, jsonObject)
        {
            var retString = "<ul id='list" + idAppend + "'>";
            for (curKey in jsonObject)
            {
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

        /*
            Makes a string formatted for the tab header out of the iconPane object.
        */
        this.makeIconString = function()
        {
            var iconString = "";
            for(curIcon in settings.iconPane)
            {
                var thisIcon = settings.iconPane[curIcon];
                iconString += "<span class='tabIcon " + curIcon + "' title='" + thisIcon['title'] + "' style='background-image:url(" + thisIcon['src'] + ")'></span>";
            }
            return iconString;
        }

        /*
            Returns active panel of the jQuery tab object.
        */
        this.getActivePanel = function()
        {
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
            $("#mei-editor").offset({'top': '0'});
            $("#mei-editor").height($(window).height());
            var editorConsoleHeight = $("#editorConsole").outerHeight();
            var topbarHeight = $("#topbar").outerHeight();
            var workableHeight = $("#mei-editor").height() - editorConsoleHeight - topbarHeight;
            var heightDiff = $("#openPages").outerHeight() - $("#openPages").height();

            $("#openPages").height(workableHeight - heightDiff);

            var activeTab = self.getActivePanel().attr('href');
            $(activeTab).css('padding', '0px');
            $(activeTab).height($("#mei-editor").height() - $(activeTab).offset().top - heightDiff);
            $(activeTab + " > .aceEditorPane").height($("#mei-editor").height() - $(activeTab).offset().top - heightDiff - editorConsoleHeight);

            var innerComponentWidth = $("#mei-editor").width() - $("#openPages").css('padding-left') - $("#openPages").css('padding-right');
            $("#openPages").width(innerComponentWidth);
            $(".aceEditorPane").width(innerComponentWidth);
            $(".aceEditorPane").parent().width(innerComponentWidth);
        }

        /*
            Called to reset the listeners for icons on the tabs.
        */
        this.resetIconListeners = function()
        {

            for(curIcon in settings.iconPane)
            {
                var thisIcon = settings.iconPane[curIcon];
                $("." + curIcon + " > img").unbind('click');
                $("." + curIcon + " > img").on('click', thisIcon['click']);
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
        
            self.events.publish("NewFile", [fileData, fileName]);
        
            //when each document changes
            settings.pageData[fileName].on('change', function(delta, editor)
            {
                //clear the previous doc and get the current cursor/document settings
                window.clearTimeout(settings.editTimeout);
                var newText = delta.data.text;

                if(!/[^a-zA-Z0-9]/.test(newText))
                {
                    if(!settings.initCursor)
                    {
                        settings.initCursor = editor.getCursorPosition();
                    }
                    if(!settings.initDoc)
                    {
                        settings.initDoc = $("#openPages").tabs('option', 'active');
                    }    
                }

                settings.editTimeout = setTimeout(function(arr)
                {
                    settings.initCursor = undefined;
                    settings.activeDoc = undefined;
                    //if it's been 500ms since the last change, get the current text, cursor position, and active document number, then save that as an undo
                    var texts = arr[0];
                    var cursorPos = arr[1];
                    var activeDoc = arr[2];
                    settings.undoManager.save('PageEdited', [texts, cursorPos, activeDoc]);
                }, 500, [self.getAllTexts(), settings.initCursor, settings.initDoc]); //after no edits have been done for a second, save the page in the undo stack
            });
            settings.undoManager.save('PageEdited', [self.getAllTexts(), [{'row':0, 'column':0}], numTabs]);
        }

        this.getAllTexts = function()
        {
            var textArr = {};
            for(curPageTitle in settings.pageData)
            {
                textArr[curPageTitle] = settings.pageData[curPageTitle].session.doc.getAllLines();
            }
            return textArr;
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
                
                //if there's 2 or less tabs open, it's only one and the "new-tab" tab, which we don't want open
                if(numTabs <= 2)
                {
                    $("#openPages").tabs("option", "active", 2);
                }

                //else if the rightmost tab is open, switch to the one to the left
                else if(activeIndex == (numTabs))
                {
                    $("#openPages").tabs("option", "active", activeIndex - 1);
                }

                //else switch to one left of the open one
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
                    self.localLog("This page name already exists in this project. Please choose another.");
                    
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
                    editorDiv.parent().attr('id', self.stripFilenameForJQuery(newName) + "wrapper");
                    
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
            Adds text to the meiEditor console.
            @param text Text to add. Gets a line break and a ">" character to signal a new line by default.
        */
        this.localLog = function(text)
        {
            //this takes care of some random lines xmllint spits out that aren't useful
            if(text.length < 2)
            {
                return;
            }
            var curDate = new Date();
            var curHours = curDate.getHours();
            var curMinutes = curDate.getMinutes();
            var curSeconds = curDate.getSeconds();

            //make sure it prints out with two digit minutes/seconds; JavaScript defaults to 11:4:4 instead of 11:04:04
            var timeStr = curHours + ":" 
                + (curMinutes > 9 ? curMinutes : "0" + curMinutes) + ":" 
                + (curSeconds > 9 ? curSeconds : "0" + curSeconds);
            $("#consoleText").append("<br>" + timeStr + "> " + text);

            //highlight the border quickly then switch back
            $("#editorConsole").switchClass("regularBorder", "alertBorder",
            {
                duration: 200,
                complete: function(){
                    $("#editorConsole").switchClass("alertBorder", "regularBorder", 200);
                },
            });

            //inner div serves to float on bottom; when its height is bigger, snap it to the same height as the parent div
            if($("#consoleText").height() > $("#editorConsole").height())
            {
                $("#consoleText").height($("#editorConsole").height() - parseInt($("#consoleText").css('padding-top')) - parseInt($("#consoleText").css('padding-bottom'))); 
            }

            //automatically scroll to bottom when new text is added
            document.getElementById("consoleText").scrollTop = document.getElementById("consoleText").scrollHeight;
        }

        /*
            Function ran on initialization.
        */
        var _init = function()
        {
            var localIcons = {"rename": {
                    'title': 'Rename file',
                    'src': 'img/glyphicons_030_pencil.png',
                    'click': function(e){
                        var pageName = $($(e.target).siblings("a")[0]).text();
                        self.renamePage(pageName); 
                    }
                },
                "remove": {
                    'title': 'Remove file',
                    'src': 'img/glyphicons_207_remove_2.png',
                    'click': function(e){
                        var pageName = $($(e.target).siblings("a")[0]).text();
                        self.removePageFromProject(pageName);
                    }
                }
            };

            $.extend(settings.iconPane, localIcons);

            //when editor pane changes are undone
            settings.undoManager.newAction('PageEdited', function(texts, cursor, doc, currentState)
            {
                //replace the editsession for that title
                for(curTitle in texts)
                {
                    settings.pageData[curTitle].setSession(new ace.EditSession(texts[curTitle]));
                    settings.pageData[curTitle].resize();
                    settings.pageData[curTitle].focus();
                }

                self.events.publish("PageEdited");

                //swap back to that tab
                $("#openPages").tabs('option', 'active', doc);

                //move cursor to before first alpha-numberic character of most recent change
                var title = self.getActivePanel().text();
                var newCursor = currentState.parameters[1];
                settings.pageData[title].gotoLine(newCursor['row'] + 1, newCursor['column'], true); //because 1-indexing is always the right choice
                settings.pageData[title].resize();
            });

            settings.element.append('<div class="navbar navbar-inverse navbar-sm" id="topbar">'
                + '<div ckass="container-fluid">'
                + '<div class="collapse navbar-collapse">'
                + '<ul class="nav navbar-nav" id="topbarContent">'
                + '<li class="dropdown">'
                + '<a href="#" class="dropdown-toggle navbar-brand" data-toggle="dropdown"> ACE MEI Editor <b class="caret"></b></a>'
                //+ '<li class="navbar-brand dropdown">ACE MEI Editor</li>'
                + '<ul class="dropdown-menu" id="dropdown-main">'
                + '<li><a id="undo-dropdown">Undo</a></li>'
                + '<li><a id="redo-dropdown">Redo</a></li>'
                + '<li><a id="main-help-dropdown">Help...</a></li>'
                + '</ul>'     
                + '</li>'
                + '</ul></div></div></div></div>'
                + '<div id="plugins-maximized-wrapper"></div>'
                + '<div id="openPages">'
                + '<ul id="pagesList">'
                + '<li id="newTabButton"><a href="#new-tab" onclick="$(\'#mei-editor\').data(\'AceMeiEditor\').addDefaultPage()">New tab</a></li>'
                + '</ul>'
                + '<div id="new-tab"></div>' //this will never be seen, but is needed to prevent a bug or two
                + '</div>'
                + '<div id="editorConsole" class="regularBorder"><div id="consoleText">Console loaded!</div></div>'
                );

            $("#undo-dropdown").on('click', function()
            {
                var retVal = settings.undoManager.undo();
                if(!retVal)
                {
                    self.localLog("Nothing to undo.");
                }
            });

            $("#redo-dropdown").on('click', function()
            {
                var retVal = settings.undoManager.redo();
                if(!retVal)
                {
                    self.localLog("Nothing to redo.");
                }
            });

            $("#main-help-dropdown").on('click', function()
            {
                $("#mainHelpModal").modal();
            });

            self.createModal('mainHelpModal', false, 
                '<li>Press ctrl+z to undo or click on the undo option of the main dropdown.</li>'
                + '<li>Press ctrl+y to redo or click on the redo option of the main dropdown.</li>');

            //initializes tabs
            $("#openPages").tabs(
            {
                activate: function(e, ui)
                {
                    var activePage = $("#" + ui.newTab.attr('id') + " > a").text();
                    //resize components to make sure the newly activated tab is the right size
                    self.resizeComponents(); 
                    settings.pageData[activePage].resize();
                    settings.pageData[activePage].focus();

                    //usually, the URL bar will change to the last tab visited because jQueryUI tabs use <a> href attributes; this prevents that by repalcing every URL change with "index.html" and no ID information
                    var urlArr = document.URL.split("/");
                    window.history.replaceState("","", urlArr[urlArr.length - 1]);
                }
            });

            $("#newTabButton").attr('tabindex', -1); //make sure the new tab button isn't shown as default active

            //create the initial ACE editor
            self.addDefaultPage();

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
                    $("#dropdown-" + curPlugin.divName).append("<li><a id='" + optionClick + "'>" + optionName + "</a></li>");
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

            //graphics stuff
            self.resizeComponents();
            $(window).on('resize', self.resizeComponents);     
            $(document).on('keydown', function(e)
            {
                if (e.ctrlKey)
                {
                    if (e.keyCode == 90)
                    {
                        var retVal = settings.undoManager.undo();
                        if(!retVal)
                        {
                            self.localLog("Nothing to undo.");
                        }
                    }
                    else if (e.keyCode == 89)
                    {
                        var retVal = settings.undoManager.redo();
                        if(!retVal)
                        {
                            self.localLog("Nothing to redo.");
                        }
                    }
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
});