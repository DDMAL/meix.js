define([window.meiEditorLocation + 'ace/src/ace', window.meiEditorLocation + 'js/local/utils'], function(){
(function ($)
{
    var AceMeiEditor = function(element, options){
        var self = this;
        var settings = {
            pageData: {},
            element: $(element),
            aceTheme: "",
            iconPane: {},
            oldPageY: "",
            recentDelete: "",
            animationInProgress: false,
        };

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
                if (cache[topic])
                {
                    var thisTopic = cache[topic],
                        i = thisTopic.length;

                    while (i--)
                    {
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
                if (!cache[topic])
                    cache[topic] = [];

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

                if (cache[t])
                {
                    while (i--)
                    {
                        if (cache[t][i] === handle[1])
                        {
                            cache[t].splice(cache[t][i], 1);
                            if (completely)
                                delete cache[t];
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
            Strips a file name of characters that jQuery selectors may misinterpret.
            @param fileName The filename to strip.
        */
        this.stripFilenameForJQuery = function(fileName)
        {
            return fileName.replace(/\W+/g, "");
        };

        /*
            Makes a string formatted for the tab header out of the iconPane object.
        */
        this.makeIconString = function()
        {
            var iconString = "";
            for(var curIcon in settings.iconPane)
            {
                var thisIcon = settings.iconPane[curIcon];
                iconString += "<span class='tabIcon " + curIcon + "' title='" + thisIcon.title + "' style='background-image:url(" + thisIcon.src + ")'></span>";
            }
            return iconString;
        };

        /*
            Returns active panel of the jQuery tab object.
        */
        this.getActivePanel = function()
        {
            var tabIndex = $("#openPages").tabs("option", "active");
            if (tabIndex === 0)
            {
                $("#openPages").tabs("option", "active", 1);
                tabIndex = 1;
            }
            var activeTab = $($("#pagesList > li > a")[tabIndex]);
            return activeTab;
        };

        /*
            Function called when window is resized/editor pane is changed.
        */
        this.resizeComponents = function()
        {
            $("#mei-editor").offset({'top': '0'});
            $("#mei-editor").height($(window).height());

            var editorConsoleHeight = $("#editorConsole").outerHeight();
            var topbarHeight = $("#topbar").outerHeight();
            var workableHeight = $("#mei-editor").height() - editorConsoleHeight - topbarHeight;
            var heightDiff = $("#openPages").outerHeight() - $("#openPages").height();

            $("#openPages").height(workableHeight - heightDiff);

            var activeTab = self.getActivePanel().attr('href');
            $(activeTab).css('padding', '0em');
            $(activeTab).height($("#openPages").height() - $("#pagesList").height() - heightDiff);
            $(activeTab + " > .aceEditorPane").height($(activeTab).height());

            var innerComponentWidth = $("#mei-editor").width() - $("#openPages").css('padding-left') - $("#openPages").css('padding-right');
            $("#openPages").width(innerComponentWidth);
            $(".aceEditorPane").width(innerComponentWidth);
            $(".aceEditorPane").parent().width(innerComponentWidth);
        };

        /*
            Called to reset the listeners for icons on the tabs.
        */
        this.resetIconListeners = function()
        {

            for (var curIcon in settings.iconPane)
            {
                var thisIcon = settings.iconPane[curIcon];
                $("." + curIcon).unbind('click');
                $("." + curIcon).on('click', thisIcon.click);
            }

            $(".tabIcon").css('cursor', 'pointer'); //can't do this in CSS file for some reason, likely because it's dynamic

        };

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
            self.addFileToProject("", newPageTitle);
        };

        /*
            Called to add file to settings.pageData.
            @param fileData Data in the original file.
            @param fileName Original file name.
        */
        this.addFileToProject = function(fileData, fileName)
        {            
            var fileNameStripped = self.stripFilenameForJQuery(fileName);

            //add a new tab to the editor
            $("#pagesList").append("<li id='" + fileNameStripped + "-listitem'><a href='#" + fileNameStripped + "-wrapper' class='linkWrapper'>" + fileName + "</a>" + self.makeIconString() + "</li>");
            $("#openPages").append("<div id='" + fileNameStripped + "-wrapper'>" //necessary for CSS to work
                + "<div id='" + fileNameStripped + "' originalName='" + fileName + "' class='aceEditorPane'>"
                + "</div></div>");
            
            self.resetIconListeners();

            //add the data to the pageData object and initialize the editor
            settings.pageData[fileName] = ace.edit(fileNameStripped); //add the file's data into a "pageData" array that will eventually feed into the ACE editor
            settings.pageData[fileName].resize();
            settings.pageData[fileName].setTheme(settings.aceTheme);
            settings.pageData[fileName].setSession(new ace.EditSession(fileData));
            settings.pageData[fileName].getSession().setMode("ace/mode/xml");
            settings.pageData[fileName].highlightedLines = {};

            //refresh the tab list with the new one in mind
            var numTabs = $("#pagesList li").length - 1;
            $("#openPages").tabs("refresh");
            $("#openPages").tabs({active: numTabs}); //load straight to the new one
            settings.pageData[fileName].resize();
        
            //when the document is clicked
            $("#" + fileNameStripped).on('click', function(e) //parent of editorPane
            {
                var pageName = $($(e.target).parent()).parent().attr('originalName');
                var docRow = settings.pageData[pageName].getCursorPosition().row; //0-index to 1-index

                //if the document row that was clicked on has a gutter decoration, remove it
                if(docRow in settings.pageData[pageName].getSession().$decorations)
                {
                    settings.pageData[pageName].getSession().removeGutterDecoration(parseInt(docRow), settings.pageData[pageName].getSession().$decorations[docRow].substring(1));
                } 
            });

            self.events.publish("NewFile", [fileData, fileName]);
        };

        this.getAllTexts = function()
        {
            var textArr = {};
            for (var curPageTitle in settings.pageData)
            {
                textArr[curPageTitle] = settings.pageData[curPageTitle].session.doc.getAllLines();
            }
            return textArr;
        };

        /*
            Removes from page without project without saving.
            @param pageName The page to remove.
        */
        this.removePageFromProject = function(pageName)
        {
            saveDelete = function(pageName)
            {
                var pageNameStripped = self.stripFilenameForJQuery(pageName);
                var activeIndex = $("#openPages").tabs("option", "active");

                //if removed panel is active, set it to one less than the current or keep it at 0 if this is 0
                if (pageName == self.getActivePanel().text())
                {
                    // NB (AH) activeIndex is already defined
                    var activeIndex = $("#openPages").tabs("option", "active");
                    var numTabs = $("#pagesList li").length - 1;
                    
                    //if there's 2 or less tabs open, it's only one and the "new-tab" tab, which we don't want open
                    if (numTabs <= 2)
                    {
                        $("#openPages").tabs("option", "active", 2);
                    }
                    //else if the rightmost tab is open, switch to the one to the left
                    else if (activeIndex == (numTabs))
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

                while (curSelectIndex--)
                {
                    //...and their children...
                    var childArray = $($("select")[curSelectIndex]).children();
                    var curChildIndex = childArray.length;

                    while (curChildIndex--)
                    {
                        var curChild = $(childArray[curChildIndex]);

                        //...for this page.
                        if (curChild.text() == pageName)
                        {
                            $(curChild).remove();
                        }
                    }
                }

                self.events.publish("PageWasDeleted", [pageName]); //let whoever is interested know 
                self.localLog("Removed " + pageName + " from the project.")

                //if nothing else exists except the new tab button, create a new default page
                if ($("#pagesList li").length == 1)
                {
                    self.addDefaultPage();
                }  

                //reloads the tab list with this one deleted to make sure tab indices are correct
                $("#openPages").tabs("refresh");

            };

            //turn on the confirmation modal
            $("#fileRemoveModal").modal();
            $("#deletionName").text(pageName);
            settings.recentDelete = pageName;

            $("#fileRemoveModal-close").on('click', function()
            {
                $("#deletionName").text();
                settings.recentDelete = "";
                //so that these events don't stack
                $("#fileRemoveModal-primary").unbind('click');
            });

            $("#fileRemoveModal-primary").on('click', function()
            {
                //actually delete it, then close the modal.
                saveDelete(settings.recentDelete);
                $("#fileRemoveModal-close").trigger('click');
            });
        };

        /*
            Renames a file
            @param clicked Rename icon that was clicked.
        */
        this.renamePage = function(pageName)
        {
            //used to commit file renaming
            var saveRename = function(parentListItem)
            {
                var containedLink = parentListItem.children("a");
                var originalName = containedLink.text();
                var newInput = parentListItem.children("input");
                var newName = newInput.val();

                //if this name already exists (including if it's unchanged)
                if (newInput.val() in settings.pageData)
                {
                    //if it's not the same as it was
                    if (newName !== parentListItem.children("a").css('display', 'block').text())
                    {
                        self.localError("Error in renaming " + originalName + ": this page name already exists in this project. Please choose another.");
                    }
                    //remove the input item and make the original link visible again
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');
                }
                else if (self.stripFilenameForJQuery(newName) === "")
                {
                    self.localError("Error in renaming " + originalName + ": please choose a filename that contains alphanumeric characters.");
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');
                }
                else if ($("#"+self.stripFilenameForJQuery(newName)).length)
                {
                    self.localError("Error in renaming " + originalName + ": this filename is too similar to one that already exists in this project. Please close the other or choose a different name.");
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');   
                }
                else 
                {
                    var activeHold = $("#openPages").tabs("option", "active");
                    //change the link's text and href
                    parentListItem.children("a").text(newName);
                    parentListItem.children("a").attr('href', '#' + self.stripFilenameForJQuery(newName));
                    
                    //remove the input and make the original link visible again
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');

                    //change this for the listitem, editor and wrapper as well
                    var listitemDiv = $("#" + self.stripFilenameForJQuery(originalName) + "-listitem");
                    listitemDiv.attr('id', self.stripFilenameForJQuery(newName) + "-listitem");
                    $(listitemDiv.children("a")[0]).attr("href", "#" + self.stripFilenameForJQuery(newName) + "-wrapper");

                    var editorDiv = $("#" + self.stripFilenameForJQuery(originalName));
                    editorDiv.attr('id', self.stripFilenameForJQuery(newName));
                    editorDiv.attr('originalName', newName);

                    var wrapperDiv = $("#" + self.stripFilenameForJQuery(originalName) + "-wrapper");
                    wrapperDiv.attr('id', self.stripFilenameForJQuery(newName) + "-wrapper");

                    //refresh to make sure all these IDs are set
                    $("#openPages").tabs("refresh");
                    $("#openPages").tabs("option", "active", activeHold);
                    
                    //change it in the pageData variable and in the select
                    settings.pageData[newName] = settings.pageData[originalName];
                    delete settings.pageData[originalName];

                    var curSelectIndex = $("select").length;

                    while (curSelectIndex--)
                    {
                        var childArray = $($("select")[curSelectIndex]).children();
                        var curChildIndex = childArray.length;
                        while (curChildIndex--)
                        {
                            var curChild = $(childArray[curChildIndex]);
                            if (curChild.text() == originalName)
                            {
                                $(curChild).text(newName);
                                $(curChild).attr('name', newName);
                            }
                        }
                    }

                    self.localLog("Renamed " + originalName + " to " + newName + ".");
                }
                //lastly, remove the old bindings for the icons and put the original ones back on
                self.resetIconListeners();
            };

            //get a pointer to the <li> and the rename object, get the original name to feed into the input item
            var parentListItem = $("#" + self.stripFilenameForJQuery(pageName) + "-listitem");
            var clicked = parentListItem.children("span.rename");
            var containedLink = parentListItem.children("a");
            var originalName = containedLink.text();

            //create the input field on top of where the name was before
            parentListItem.prepend("<input class='input-ui-emulator' type='text' value='" + originalName + "''>");

            //hide the contained link while the input is open
            containedLink.css('display', 'none');

            //when the pencil is clicked again
            $(clicked).unbind('click');

            $(clicked).on('click', function(e)
            {
                saveRename(parentListItem);
            });

            //or when the enter key is pressed in the field
            $(parentListItem.children("input")).on('keyup', function(e)
            {
                if (e.keyCode == 13){
                    saveRename(parentListItem);
                }
            });
        };

        /*
            Adds text to the meiEditor console.
            @param text Text to add. Gets a line break and a ">" character to signal a new line by default.
        */
        this.localLog = function(text)
        {
            localPost(text, "log");
        };

        this.localWarn = function(text)
        {
            localPost(text, "warn");
        };

        this.localError = function(text)
        {
            localPost(text, "error");
        };

        this.localMessage = function(text)
        {
            localPost(text, "neutral");
        };

        /*
            The previous three are a wrapper for this.
            @param style Determines color to flash (green, yellow, or red) depending on severity of message.
        */
        localPost = function(text, style)
        {
            var newClass = style + "Border";

            //this takes care of some random lines xmllint spits out that aren't useful
            if (text.length < 2)
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

            //highlight the div quickly then switch back, if no other changes are happening
            if (!settings.animationInProgress)
            {
                settings.animationInProgress = true;
                $("#editorConsole").switchClass("regularBorder", newClass,
                {
                    duration: 100,
                    complete: function(){
                        $("#editorConsole").switchClass(newClass, "regularBorder",
                        {
                            duration: 100,
                            complete: function(){
                                settings.animationInProgress = false;
                            }
                        });
                    },
                });
            }

            //inner div serves to float on bottom; when its height is bigger, snap it to the same height as the parent div
            var editorPadding = ($("#editorConsole").outerHeight() - $("#editorConsole").height());

            if ($("#consoleText").outerHeight() + editorPadding > $("#editorConsole").height())
            {
                $("#consoleText").height($("#editorConsole").height() - parseInt($("#consoleText").css('padding-top')) - parseInt($("#consoleText").css('padding-bottom'))); 
            }
            else
            {
                $("#consoleText").height("auto");
            }

            //automatically scroll to bottom when new text is added
            document.getElementById("consoleText").scrollTop = document.getElementById("consoleText").scrollHeight;
        };

        /*
            Function ran on initialization.
        */
        var _init = function()
        {
            var localIcons = {"rename": {
                    'title': 'Rename file',
                    'src': options.meiEditorLocation + 'img/glyphicons_030_pencil.png',
                    'click': function(e){
                        var pageName = $($(e.target).siblings("a")[0]).text();
                        self.renamePage(pageName); 
                    }
                },
                "remove": {
                    'title': 'Remove file',
                    'src': options.meiEditorLocation + 'img/glyphicons_207_remove_2.png',
                    'click': function(e){
                        var pageName = $($(e.target).siblings("a")[0]).text();
                        self.removePageFromProject(pageName);
                    }
                }
            };

            $.extend(settings.iconPane, localIcons);

            settings.element.append(
                '<div class="navbar navbar-inverse navbar-sm" id="topbar">'
                    + '<div class="container-fluid">'
                        + '<div class="collapse navbar-collapse">'
                            + '<ul class="nav navbar-nav" id="topbarContent">'
                                + '<li class="navbar-brand"> ACE MEI Editor </li>'
                                + '<li class="dropdown navbar-right">'
                                    + '<a href="#" class="dropdown-toggle navbar" data-toggle="dropdown"> Help <b class="caret"></b></a>'
                                    + '<ul class="dropdown-menu" id="help-dropdown">'
                                    + '</ul>'
                                + '</li>'
                            + '</ul>'
                        + '</div>'
                    + '</div>'
                + '</div>'
                + '<div id="openPages">'
                    + '<ul id="pagesList">'
                        + '<li id="newTabButton">'
                            + '<a href="#new-tab" onclick="$(\'#mei-editor\').data(\'AceMeiEditor\').addDefaultPage()">+</a>'
                        + '</li>'
                    + '</ul>'
                    + '<div id="new-tab"></div>' //this will never be seen, but is needed to prevent a bug or two
                + '</div>'
                + '<div id="editorConsole" class="regularBorder">'
                    + '<div id="consoleResizeDiv"></div>'
                    + '<div id="consoleText">Console loaded!</div>'
                + '</div>'
                );

            $("#consoleText").css('bottom', $(($("#editorConsole").outerHeight() - $("#editorConsole").height())/2).toEm().toString() + 'em');

            $("#consoleResizeDiv").on('mousedown', function()
            {
                $("mei-editor").css('cursor', 'ns-resize');

                //most of this was taken from resizeComponents(), as was the top-down idea
                $(document).on('mousemove', function(e)
                {
                    //this prevents horizontal movement from triggering this event, hopefully saving some time
                    if (settings.oldPageY == e.pageY)
                    {
                        return;
                    }
                    //set up the tab container to the right e.pageY height first
                    var editorConsoleHeight = $("#editorConsole").outerHeight();
                    var topbarHeight = $("#topbar").outerHeight();
                    var heightDiff = $("#openPages").outerHeight() - $("#openPages").height(); 
                    var newHeight = e.pageY - topbarHeight - heightDiff;

                    $("#openPages").height(newHeight);

                    //make the active child of openPages and its subcomponents match above
                    var activePanel = self.getActivePanel();
                    var activeTab = activePanel.attr('href');
                    $(activeTab).css('padding', '0em');
                    $(activeTab).height($("#openPages").height() - $("#pagesList").height() - heightDiff);
                    $(activeTab + " > .aceEditorPane").height($(activeTab).height());

                    //reload the editor to fit
                    var pageName = activePanel.text();
                    settings.pageData[pageName].resize();

                    //resize console to take up rest of the screen
                    var consoleDiff = $("#editorConsole").outerHeight() - $("#editorConsole").height();
                    $("#editorConsole").offset({'top': $("#openPages").outerHeight() + $("#topbar").outerHeight()});

                    // NB (AH) newHeight is already defined.
                    var newHeight = parseInt(window.innerHeight - $("#openPages").outerHeight() - topbarHeight - consoleDiff + 1);
                    $("#editorConsole").height(newHeight);

                    // NB (AH) consoleDiff is already defined.
                    //make sure that the child of the console that holds the text is at the right size
                    var consoleDiff = $("#editorConsole").outerHeight() - $("#editorConsole").height();
                    $("#consoleText").css('bottom', $(consoleDiff/2).toEm().toString() + 'em');

                    //var currentHeight = document.getElementById("consoleText").scrollHeight;
                    //var maxHeight = window.innerHeight - $("#topbar").outerHeight() - $("#openPages").outerHeight() - consoleDiff;
                    $("#consoleText").height(Math.min(document.getElementById("consoleText").scrollHeight, $("#editorConsole").height()));                    

                    //this prevents horizontal movement from triggering this event with the if statement at the top
                    settings.oldPageY = e.pageY;
                });

                $(document).on('mouseup', function()
                {
                    settings.oldPageY = 0;
                    $("mei-editor").css('cursor', 'default');
                    $(document).unbind('mousemove');
                    $(document).unbind('mouseup');
                    //document.getElementById("consoleText").scrollTop = document.getElementById("consoleText").scrollHeight;
                });
            });

            $("#main-help-dropdown").on('click', function()
            {
                $("#mainHelpModal").modal();
            });

            //initializes tabs
            $("#openPages").tabs(
            {
                activate: function(e, ui)
                {
                    //close all open renaming boxes and return to the default
                    $("input.input-ui-emulator").remove();
                    $(".linkWrapper").css('display', 'inline-block');

                    var activePage = self.getActivePanel().text();
                    
                    //resize components to make sure the newly activated tab is the right size
                    settings.pageData[activePage].resize();
                    settings.pageData[activePage].focus();
                    self.resizeComponents(); 

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
                //go through requiredSettings for each plugin
                if (curPlugin.requiredSettings !== undefined)
                {
                    var requirementsLength = curPlugin.requiredSettings.length;
                    var requirementSkip = false;

                    while (requirementsLength--)
                    {
                        //if this one's a logical OR
                        if (curPlugin.requiredSettings[requirementsLength].match(/\|\|/))
                        {
                            orArr = curPlugin.requiredSettings[requirementsLength].split(/ \|\| /);
                            var curIndex = orArr.length;
                            var requirementMet = false;

                            while (curIndex--)
                            {
                                var curRequirement = orArr[curIndex];
                                //if either is true, requirementMet should be true
                                requirementMet = settings[curRequirement] || requirementMet;
                            }

                            //skip if requirementMet is false
                            requirementSkip = !requirementMet;

                            if (requirementSkip)
                            {
                                //if we don't find anything in the or statement, throw an error and break (throwing an exception would stop everything, this only stops this plugin)
                                console.error("MEI Editor error: the " + curPlugin.title + " plugin could not find, but requires one of the following settings: (" + orArr.join(", ") + "). Disabling plugin.");
                            }
                        }
                        else if (settings[curPlugin.requiredSettings[requirementsLength]] === undefined)
                        {
                            //if we don't find the plugin, throw an error and break (throwing an exception would stop everything, this only stops this plugin)
                            console.error("MEI Editor error: the " + curPlugin.title + " plugin could not find the '" + curPlugin.requiredSettings[requirementsLength] + "' setting. Disabling plugin.");
                            requirementSkip = true;
                        }
                    }

                    //this has to be thrown down here so that it breaks the $.each, not the while. $.each also needs "return", not "break"
                    if (requirementSkip)
                    {
                        return;
                    }
                }

                if (curPlugin.skipHelp !== true)
                {
                    $("#help-dropdown").append("<li><a id='" + curPlugin.divName + "-help'>" + curPlugin.title + "</a></li>");
                }

                //append a dropdown menu to the navbar
                if (curPlugin.dropdownOptions !== undefined)
                {
                    $("#topbarContent").append('<li class="dropdown">'
                        + '<a href="#" class="dropdown-toggle" data-toggle="dropdown">' + curPlugin.title + ' <b class="caret"></b></a>'
                        + '<ul class="dropdown-menu" id="dropdown-' + curPlugin.divName + '">'
                        + '</ul></li>');

                    for (var optionName in curPlugin.dropdownOptions)
                    {
                        optionClick = curPlugin.dropdownOptions[optionName];
                        $("#dropdown-" + curPlugin.divName).append("<li><a id='" + optionClick + "'>" + optionName + "</a></li>");
                    }
                }
                //and if dropdownOptions doesn't exist, just append a button
                else
                {
                    $("#topbarContent").append('<li><a id="' + curPlugin.divName + '">' + curPlugin.title + '</a></li>');
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

            //deletion conformation modal
            createModal(settings.element, 'fileRemoveModal', true, 'Are you sure you want to remove "<span id="deletionName"></span>" from this project?', 'Remove file');

            //graphics stuff
            self.resizeComponents();
            $(window).on('resize', self.resizeComponents);
        };

        _init();

    };

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