/*

Copyright (C) 2014 by Andrew Horwitz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

define([], function ($)
{
    var AceMeiEditor = function(element, options){
        var self = this;
        var settings = {
            pageTitle: "Ace MEI Editor", //title for the navbar-brand object
            aceTheme: "",           //which ace theme to use, passed in as a string. Check setTheme() on http://ace.c9.io/#nav=api&api=editor
            navbarClass: "navbar navbar-inverse", //allows the user to set the class string for the navigation bar and change its theme
            initializeWithFile: null //If this is not null, it will attempt to automatically open this parameter as a file
        };

        $.extend(settings, options);

        var globals = {
            element: $(element),    //jQuery reference to the object that contains the MEI editor
            iconPane: {},           //stores a template for all icon objects to display on open tabs
            oldPageY: "",           //saves position of editor console/editor divider to facilitate resizing.
            recentDelete: "",       //saves name of almost-deleted file to allow for a confirmation screen.
            expandedTopbar: true,   //true if all plugins are displayed in the topbar, false if it's condensed
            thresholdTopbarWidth: 0,//threshold at which to toggle the expanded bar
            activePageTitle: "",    //title of the currently visible tab
            activeTabIndex: null,   //index of the currently visible tab
            tabTitlesByIndex: []    //array of the two above
        };

        $.extend(settings, globals);

        //various globals that don't need to be in settings
        var addingPage = false;     //if a page is being added, don't throw the "activate" event
        var renamingEditedPage = false; //retains asterisk
        var pageData = {};           //stores the editors and all associated data for all pages.


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
            publish = function (topic, args, scope)
            {
                if (cache[topic])
                {
                    var thisTopic = cache[topic],
                        i = thisTopic.length;

                    while (i--)
                        thisTopic[i].apply( scope || this, args || []);
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
            subscribe = function (topic, callback)
            {
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
            unsubscribe = function (handle, completely)
            {
                var t = handle[0];

                if (cache[t])
                {
                    var i = cache[t].length;
                    while (i--)
                    {
                        if (cache[t][i] === handle[1])
                        {
                            cache[t].splice(i, 1);
                            if (completely)
                                delete cache[t];
                            return true;
                        }
                    }
                }
                return false;
            };

            return {
                    publish: publish,
                    subscribe: subscribe,
                    unsubscribe: unsubscribe
            };
        }());

        /*
            Makes a string formatted for the tab header out of the iconPane object.
        */
        this.makeIconString = function()
        {
            var iconString = "";
            for (var curIcon in settings.iconPane)
            {
                var thisIcon = settings.iconPane[curIcon];
                iconString += "<span class='tabIcon " + curIcon + "' title='" + thisIcon.title + "' style='background-image:url(" + thisIcon.src + ")'></span>";
            }
            return iconString;
        };

        /*
            Returns active panel of the jQuery tab object.
        */
        var getActivePanel = function()
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

        this.getActivePageTitle = function()
        {
            return settings.activePageTitle;
        };

        /*
            Gets/sets pageData for a specific page title (accessible by getActivePanel.text())
        */
        this.getPageData = function(pageTitle)
        {
            return pageData[pageTitle];
        };

        this.getPageTitles = function()
        {
            return Object.keys(pageData);
        };

        updateTabTitles = function()
        {
            var tabArr = $("#pagesList > li > a");
            for (var curTabIndex = 0; curTabIndex < tabArr.length; curTabIndex++)
            {
                settings.tabTitlesByIndex[curTabIndex] = $(tabArr[curTabIndex]).text();
            }
        };

        this.reparseAce = function(pageTitle)
        {
            var xmlString = pageData[pageTitle].session.doc.getAllLines().join("\n");
            pageData[pageTitle].parsed = meiParser.parseFromString(xmlString, 'text/xml');
        };

        /*
            Function called when window is resized/editor pane is changed.
        */
        this.resizeComponents = function()
        {
            //toggles between the two different topbar views
            if(($(element).width() <= settings.thresholdTopbarWidth) && settings.expandedTopbar)
            {
                self.toggleTopbar(false);
            }
            else if(($(element).width() > settings.thresholdTopbarWidth) && !settings.expandedTopbar)
            {
                self.toggleTopbar(true);
            }

            $(element).offset({'top': '0'});
            $(element).height($(window).height() - ($(element).outerHeight() - $(element).height()));

            var editorConsoleHeight = $("#editorConsole").outerHeight();
            var topbarHeight = (settings.expandedTopbar ? $("#expandedTopbar").outerHeight() : $("#compactTopbar").outerHeight());
            var workableHeight = $(element).height() - editorConsoleHeight - topbarHeight;
            var heightDiff = $("#openPages").outerHeight() - $("#openPages").height();

            $("#openPages").height(workableHeight - heightDiff);

            var activeTab = getActivePanel().attr('href');
            $(activeTab).css('padding', '0em');
            $(activeTab).height($("#openPages").height() - $("#pagesList").height() - heightDiff);
            $(activeTab + " > .aceEditorPane").height($(activeTab).height());

            var innerComponentWidth = $(element).width() - $("#openPages").css('padding-left') - $("#openPages").css('padding-right');
            $("#openPages").width(innerComponentWidth);
            $(".aceEditorPane").width(innerComponentWidth);
            $(".aceEditorPane").parent().width(innerComponentWidth);

        };

        /*
            Called to switch from expanded topbar to compact or vice versa.
            @param toExpanded Boolean; if true, converts to expanded nav, if false converts to compact.
        */
        this.toggleTopbar = function(toExpanded)
        {
            var dropdownArr, curDropdown;
            if(toExpanded)
            {
                //caret icons
                $("li > a > b").show();

                //all the main dropdowns
                dropdownArr = $("#compact-dropdown > li");
                for(curDropdown = 0; curDropdown < dropdownArr.length; curDropdown++)
                {
                    //add submenu class and add them to the topbar
                    $(dropdownArr[curDropdown]).addClass('dropdown').removeClass('dropdown-submenu');
                    $("#topbarContent").append(dropdownArr[curDropdown]);
                }

                //move help separately cause it's right-float
                $("#topbarRightContent").append($("#help-dropdown-wrapper"));
                $("#help-dropdown-wrapper").addClass('dropdown').removeClass('dropdown-submenu');

                //finalize changes
                $("#compact-dropdown").html("");
                $("#expandedTopbar").show();
                $("#compactTopbar").hide();
            }
            else
            {
                //opposite of the above
                dropdownArr = $("#topbarContent > li");
                for(curDropdown = 0; curDropdown < dropdownArr.length; curDropdown++)
                {
                    $(dropdownArr[curDropdown]).addClass('dropdown-submenu').removeClass('dropdown');
                    $("#compact-dropdown").append(dropdownArr[curDropdown]);
                }
                $("#compact-dropdown").append($("#help-dropdown-wrapper"));
                $("#help-dropdown-wrapper").addClass('dropdown-submenu').removeClass('dropdown');
                $("#topbarRightContent").html("");
                $("#topbarContent").html("");
                $("#compact-dropdown > li > a > b").hide();
                $("#expandedTopbar").hide();
                $("#compactTopbar").show();

            }
            settings.expandedTopbar = toExpanded;
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

        checkDuplicatePageTitles = function(newTitle)
        {
            var titles = Object.keys(pageData);
            for (var idx = 0; idx < titles.length; idx++)
            {
                var stripped = titles[idx].replace(/\*/g, "");
                if (stripped == newTitle) return true;
            }

            if ($("#"+jQueryStrip(newTitle)).length) return true;
            return false;
        };

        /*
            Called to add the next available "untitled" page to the GUI.
        */
        this.addDefaultPage = function(pageText)
        {
            pageText = pageText === undefined ? "" : pageText;
            //check for a new version of "untitled__" that's not in use
            var newPageTitle = "untitled";
            var suffixNumber = 1;
            while (newPageTitle in pageData)
            {
                suffixNumber += 1;
                newPageTitle = "untitled" + suffixNumber;
            }
            self.addFileToProject(pageText, newPageTitle);
        };

        /*
            Called to add file to pageData.
            @param fileData Data in the original file.
            @param fileName Original file name.
        */
        this.addFileToProject = function(fileData, fileName)
        {
            if (checkDuplicatePageTitles(fileName))
            {
                self.localError("Error in adding " + fileName + ": this filename is too similar to one that already exists in this project. Please close the other or choose a different name.");
                return false;
            }


            addingPage = true;
            var pageDataKeys = Object.keys(pageData);

            var fileNameStripped = jQueryStrip(fileName);
            //add a new tab to the editor
            $("#pagesList").append("<li id='" + fileNameStripped + "-listitem'><a href='#" + fileNameStripped + "-wrapper' id='" + fileNameStripped +"-tab' class='linkWrapper'>" + fileName + "</a>" + self.makeIconString() + "</li>");
            $("#openPages").append("<div id='" + fileNameStripped + "-wrapper'>" + //necessary for CSS to work
                "<div id='" + fileNameStripped + "' originalName='" + fileName + "' class='aceEditorPane'>" +
                "</div></div>");

            self.resetIconListeners();

            //add the data to the pageData object and initialize the editor
            pageData[fileName] = ace.edit(fileNameStripped); //add the file's data into a "pageData" array that will eventually feed into the ACE editor
            editor = pageData[fileName];
            editor.$blockScrolling = Infinity;
            editor.resize();
            editor.setTheme(settings.aceTheme);
            editor.setSession(new ace.EditSession(fileData));
            editor.getSession().setMode("ace/mode/xml");
            editor.highlightedLines = {};
            editor.setShowPrintMargin(false);

            //Hankinson wants his keyboard shortcuts, so we'll give them to him...
            /*editor.commands.removeCommand('gotoline');
            editor.commands.addCommand({
                name: "gotoline",
                bindKey: {win: "Ctrl-G", mac: "Ctrl-G"},
                exec: function(editor) {
                    var line = parseInt(prompt("Enter line number:"), 10);
                    if (!isNaN(line)) {
                        editor.gotoLine(line);
                    }
                },
                readOnly: true
            });*/

            self.reparseAce(fileName);

            //refresh the tab list with the new one in mind
            var numTabs = $("#pagesList li").length - 1;
            $("#openPages").tabs("refresh");
            $("#openPages").tabs({active: numTabs}); //load straight to the new one
            pageData[fileName].resize();

            //when the document is clicked
            $("#" + fileNameStripped).on('click', function(e) //parent of editorPane
            {
                if ($(e.target).hasClass('ace_scroller')){
                    return;
                }

                var pageName = $($(e.target).parent()).parent().attr('originalName');
                var docRow = pageData[pageName].getCursorPosition().row; //0-index to 1-index

                //if the document row that was clicked on has a gutter decoration, remove it
                if (docRow in pageData[pageName].getSession().$decorations)
                {
                    pageData[pageName].getSession().removeGutterDecoration(parseInt(docRow, 10), pageData[pageName].getSession().$decorations[docRow].substring(1));
                }
            });

            //pageDataKeys was called before page was added - if only an untitled page existed before, delete it
            if(pageDataKeys.length == 1 && pageDataKeys[0] == "untitled")
            {
                if(pageData["untitled"].getSession().doc.getLength() == 1 && pageData["untitled"].getSession().doc.getLine(0) === "")
                {
                    self.removePageFromProject("untitled", true);
                }
            }

            self.localLog("Added " + fileName + " to project.");

            self.events.publish("NewFile", [fileData, fileName]);
            addingPage = false;
        };

        /*
            Returns an array of the raw texts for all editor objects.
        */
        this.getAllTexts = function()
        {
            var textArr = {};
            for (var curPageTitle in pageData)
            {
                textArr[curPageTitle] = pageData[curPageTitle].session.doc.getAllLines();
            }
            return textArr;
        };

        /*
            Removes from page without project without saving.
            @param pageName The page to remove.
            @param override Skips a confirmation modal if true.
        */
        this.removePageFromProject = function(pageName, override)
        {
            saveDelete = function(pageName)
            {
                var pageNameStripped = jQueryStrip(pageName);
                var activeIndex = $("#openPages").tabs("option", "active");

                //if removed panel is active, set it to one less than the current or keep it at 0 if this is 0
                if (pageName == self.getActivePageTitle())
                {
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
                pageData[pageName].selection.off('changeCursor', cursorUpdate);
                delete pageData[pageName];

                self.events.publish("PageWasDeleted", [pageName]); //let whoever is interested know
                self.localLog("Removed " + pageName + " from the project.")

                //if nothing else exists except the new tab button, create a new default page
                if ($("#pagesList li").length == 1)
                {
                    self.addDefaultPage();
                }

                //reloads the tab list with this one deleted to make sure tab indices are correct
                $("#openPages").tabs("refresh");
                updateTabTitles();
            };

            if(override)
            {
                saveDelete(pageName);
            }
            else
            {
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
            }
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
                if (checkDuplicatePageTitles(newInput.val()))
                {
                    //if it's not the same as it was
                    if (newName !== parentListItem.children("a").css('display', 'block').text())
                    {
                        self.localError("Error in renaming " + newInput.val() + ": this filename is too similar to one that already exists in this project. Please close the other or choose a different name.");
                    }
                    //remove the input item and make the original link visible again
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');
                }
                else if (jQueryStrip(newName) === "")
                {
                    self.localError("Error in renaming " + originalName + ": please choose a filename that contains alphanumeric characters.");
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');
                }
                else
                {
                    var activeHold = $("#openPages").tabs("option", "active");
                    //change the link's text and href
                    parentListItem.children("a").text(newName);
                    parentListItem.children("a").attr('href', '#' + jQueryStrip(newName));
                    parentListItem.children("a").attr('id', jQueryStrip(newName) + "-tab");

                    //remove the input and make the original link visible again
                    newInput.remove();
                    parentListItem.children("a").css('display', 'block');

                    //change this for the listitem, editor and wrapper as well
                    var listitemDiv = $("#" + jQueryStrip(originalName) + "-listitem");
                    listitemDiv.attr('id', jQueryStrip(newName) + "-listitem");
                    $(listitemDiv.children("a")[0]).attr("href", "#" + jQueryStrip(newName) + "-wrapper");

                    var editorDiv = $("#" + jQueryStrip(originalName));
                    editorDiv.attr('id', jQueryStrip(newName));
                    editorDiv.attr('originalName', newName);

                    var wrapperDiv = $("#" + jQueryStrip(originalName) + "-wrapper");
                    wrapperDiv.attr('id', jQueryStrip(newName) + "-wrapper");

                    //refresh to make sure all these IDs are set
                    $("#openPages").tabs("refresh");
                    $("#openPages").tabs("option", "active", activeHold);

                    //change it in the pageData variable
                    pageData[newName] = pageData[originalName];
                    delete pageData[originalName];

                    self.reparseAce(newName);
                    if(originalName === settings.activePageTitle) settings.activePageTitle = newName;

                    updateTabTitles();

                    self.localLog("Renamed " + originalName + " to " + newName + ".");
                    self.events.publish('PageWasRenamed', [originalName, newName]);
                }
                if (renamingEditedPage) parentListItem.children("a").append("<span>*</span>");
                renamingEditedPage = false;
                //lastly, remove the old bindings for the icons and put the original ones back on
                self.resetIconListeners();
                self.reloadUndoListeners();
            };

            //get a pointer to the <li> and the rename object, get the original name to feed into the input item
            if (pageName.indexOf("*") > -1) renamingEditedPage = true;
            var parentListItem = $("#" + jQueryStrip(pageName) + "-listitem");
            var clicked = parentListItem.children("span.rename");
            var containedLink = parentListItem.children("a");
            containedLink.children('span').remove();
            var originalName = containedLink.text();

            //create the input field on top of where the name was before
            parentListItem.prepend("<input class='input-ui-emulator' type='text' value='" + originalName + "''>");

            //avoid a glitch where jQueryUI used the arrow keys to move between tabs
            $('.input-ui-emulator').on('keydown', function(e){
                e.stopPropagation();
            });

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
            The previous four are a wrapper for this.
            @param style Determines color to flash (green, yellow, or red) depending on severity of message.
        */
        var localPost = function(text, style)
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
            var timeStr = curHours + ":" +
                (curMinutes > 9 ? curMinutes : "0" + curMinutes) + ":" +
                (curSeconds > 9 ? curSeconds : "0" + curSeconds);
            $("#consoleText").append("<br/><span id='console" + curDate.getTime() + "' style='font-weight:bold'>" + timeStr + "> " + text + "</span>");

            //highlight the div quickly then switch back
            $("#editorConsole").switchClass("regularBorder", newClass,
            {
                duration: 300,
                complete: function(){
                    $("#editorConsole").switchClass(newClass, "regularBorder",
                    {
                        duration: 300,
                        complete: function(){
                            $("#console" + curDate.getTime()).css('font-weight', 'normal');
                        }
                    });
                }
            });

            //inner div serves to float on bottom; when its height is bigger, snap it to the same height as the parent div
            var editorPadding = ($("#editorConsole").outerHeight() - $("#editorConsole").height());

            if ($("#consoleText").outerHeight() + editorPadding > $("#editorConsole").height())
            {
                $("#consoleText").height($("#editorConsole").height() - parseInt($("#consoleText").css('padding-top'), 10) - parseInt($("#consoleText").css('padding-bottom'), 10));
            }
            else
            {
                $("#consoleText").height("auto");
            }

            //automatically scroll to bottom when new text is added
            document.getElementById("consoleText").scrollTop = document.getElementById("consoleText").scrollHeight;
        };

        /*
            Adds a navbar menu for a plugin.
            @param title The title of the plugin.
            @param divName Will be appended to "dropdown-" to add options to the dropdown.
        */

        this.addToNavbar = function(title, divName)
        {
            $("#topbarContent").append('<li class="dropdown">' +
                '<a href="#" class="dropdown-toggle" data-toggle="dropdown">' + title + ' <b class="caret"></b></a>' +
                '<ul class="dropdown-menu" id="dropdown-' + divName + '">' +
                '</ul></li>');
        };
        /*
            Finds the first line in the MEI that matches <tag>, <tag att>, or <tag att="val">
            @param tag The element name to look for.
            @param att (optional) The attribute to look for.
            @param val (optional) The value to look for if att is found.
        */
        this.findLineInEditor = function(tag, att, val)
        {
            var linesArr = pageData[self.getActivePageTitle()].session.doc.getAllLines();

            var line = 0;
            while (line < linesArr.length)
            {
                var retLine = parseInt(line, 10) + 1;
                var lineDict = parseXMLLine(linesArr[line]);
                if(!lineDict) continue;
                else if (lineDict.hasOwnProperty(tag))
                {
                    if (!att) return [retLine, lineDict];
                    else if (lineDict[tag].hasOwnProperty(att))
                    {
                        if (!val) return [retLine, lineDict];
                        else if (lineDict[tag][att] == val)
                            return [retLine, lineDict];
                    }
                }
                line++;
            }
            return false;
        };

        this.gotoLineWithID = function(id)
        {
            var meiEditor = this;
            var searchNeedle = new RegExp(id, "g");

            //searches for the facs ID that is also the ID of the highlighted panel
            var pageTitle = meiEditor.getActivePageTitle();

            var initSelection = meiEditor.getPageData(pageTitle).selection.getCursor();
            var initRow = initSelection.row;
            var initCol = initSelection.column;

            //this is needed to prevent a glitch where if the editor is not clicked first, find sometimes does not work
            //I will permanently fix this later, but as of now this will suffice
            if(initRow === 0 && initCol === 0)
            {
                meiEditor.getPageData(pageTitle).selection.selectTo(1, 1);
            }

            var pageRef = meiEditor.getPageData(pageTitle);
            var facsSearch = pageRef.find(searchNeedle,
            {
                wrap: true,
                range: null
            });

            var newRow = facsSearch.start.row;
            var nextRow = newRow, lineText;

            do {
                //gets the full text from the search result row
                lineText = pageRef.session.doc.getLine(nextRow);

                //if it doesn't include "zone" it's what we want
                if (!lineText.match(/zone/g))
                {
                    break;
                }

                //if we didn't break, find the next one
                pageRef.findNext();
                nextRow = pageRef.getSelectionRange().start.row;

            } while (newRow != nextRow);
        };


        /*
            Switches to the jQueryUI tab that has a specific title.
            @param pageTitle Title of the page to switch to.
        */
        this.switchToPage = function(pageTitle)
        {
            var idx = settings.tabTitlesByIndex.length;
            while(idx--)
            {
                if (settings.tabTitlesByIndex[idx] == pageTitle)
                {
                    $("#openPages").tabs("option", "active", idx);
                    return true;
                }
            }
            return false;
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
                '<nav class="' + settings.navbarClass + '" id="expandedTopbar">' +
                    '<div class="container-fluid" id="topbarContainer">' +
                        '<div class="navbar-header pull-left">' +
                            '<div id="site-logo" class="navbar-brand">' + settings.pageTitle + '</div>' +
                        '</div>' +
                        '<div class="collapse navbar-collapse pull-left" id="topbarContentWrapper">' +
                            '<ul class="nav navbar-nav pull-left" id="topbarContent">' +
                            '</ul>' +
                        '</div>' +
                        '<div class="nav navbar-nav pull-right" id="topbarRightContent">' +
                            '<li class="dropdown" id="help-dropdown-wrapper">' +
                                '<a href="#" class="dropdown-toggle" data-toggle="dropdown"> Help <b class="caret"></b></a>' +
                                '<ul class="dropdown-menu dropdown-menu-right pull-right" id="help-dropdown" style="z-index:1000">' +
                                '</ul>' +
                            '</li>' +
                        '</div>' +
                    '</div>' +
                '</nav>' +
                '<nav class="' + settings.navbarClass + '" id="compactTopbar">' +
                    '<div class="container-fluid" id="topbarContainer">' +
                        '<ul class="nav navbar-header pull-left">' +
                            '<li class="dropdown" id="brandLI">' +
                                '<div id="site-logo" class="dropdown-toggle navbar-brand" data-toggle="dropdown" style="cursor:pointer">' + settings.pageTitle + '<b class="caret"></b></div>' +
                                '<ul class="dropdown-menu" id="compact-dropdown" style="top:50px">' +
                                '</ul>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                '</nav>' +
                '<div id="openPages">' +
                    '<ul id="pagesList">' +
                        '<li id="newTabButton">' +
                            '<a href="#new-tab">+</a>' +
                        '</li>' +
                    '</ul>' +
                    '<div id="new-tab"></div>' + //this will never be seen, but is needed to prevent a bug or two
                '</div>' +
                '<div id="editorConsole" class="regularBorder">' +
                    '<div id="consoleResizeDiv"></div>' +
                    '<div id="consoleText">Console loaded!</div>' +
                '</div>');

            $("#newTabButton > a").on('click', function()
            {
                $(element).data('AceMeiEditor').addDefaultPage();
            });

            //To enable second-tier dropdown menus in Bootstrap, stolen mercilessly from https://www.gaslampmedia.com/multilevel-dropdown-menus-bootstrap-3-x/
            //Has to be called after divs exist
            $('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
                // Avoid following the href location when clicking
                event.preventDefault();
                // Avoid having the menu to close when clicking
                event.stopPropagation();
                // Re-add .open to parent sub-menu item
                $(this).parent().addClass('open');
                $(this).parent().find("ul").parent().find("li.dropdown").addClass('open');
            });

            $("#compactTopbar").hide();

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
                    var topbarHeight = (settings.expandedTopbar ? $("#expandedTopbar").outerHeight() : $("#compactTopbar").outerHeight());
                    var heightDiff = $("#openPages").outerHeight() - $("#openPages").height();
                    var newHeight = e.pageY - topbarHeight - heightDiff;

                    $("#openPages").height(newHeight);

                    //make the active child of openPages and its subcomponents match above
                    var activePanel = getActivePanel();
                    var activeTab = activePanel.attr('href');
                    $(activeTab).css('padding', '0em');
                    $(activeTab).height($("#openPages").height() - $("#pagesList").height() - heightDiff);
                    $(activeTab + " > .aceEditorPane").height($(activeTab).height());

                    //reload the editor to fit
                    var pageName = activePanel.text();
                    pageData[pageName].resize();

                    //resize console to take up rest of the screen
                    var consoleDiff = $("#editorConsole").outerHeight() - $("#editorConsole").height();
                    $("#editorConsole").offset({'top': $("#openPages").outerHeight() + (settings.expandedTopbar ? $("#expandedTopbar").outerHeight() : $("#compactTopbar").outerHeight())});

                    newHeight = parseInt(window.innerHeight - $("#openPages").outerHeight() - topbarHeight - consoleDiff + 1, 10);
                    $("#editorConsole").height(newHeight);

                    //make sure that the child of the console that holds the text is at the right size
                    consoleDiff = $("#editorConsole").outerHeight() - $("#editorConsole").height();
                    $("#consoleText").css('bottom', $(consoleDiff/2).toEm().toString() + 'em');

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

                    var activePage = getActivePanel().nochildtext();
                    settings.activePageTitle = activePage;
                    settings.activeTabIndex = ui.newTab.index();

                    updateTabTitles();

                    //resize components to make sure the newly activated tab is the right size
                    pageData[activePage].resize();
                    self.resizeComponents();

                    //usually, the URL bar will change to the last tab visited because jQueryUI tabs use <a> href attributes; this prevents that by repalcing every URL change with "index.html" and no ID information
                    var urlArr = document.URL.split("/");
                    window.history.replaceState("","", urlArr[urlArr.length - 1]);
                    if (!addingPage) self.events.publish('ActivePageChanged', [activePage]);
                }
            });

            $("#newTabButton").attr('tabindex', -1); //make sure the new tab button isn't shown as default active

            //for each plugin...
            $.each(window.meiEditorPlugins, function(index, curPlugin)
            {
                // Call the init function and check return value
                // If it returns false, consider the plugin disabled and exit.
                if (!curPlugin.init(self, settings))
                {
                    return;
                }
            });

            //deletion conformation modal
            createModal(settings.element, 'fileRemoveModal', true, 'Are you sure you want to remove "<span id="deletionName"></span>" from this project?', 'Remove file');

            //create the initial ACE editor
            if (settings.initializeWithFile !== null)
            {
                $.ajax(settings.initializeWithFile, {
                    dataType: 'text',
                    success: function(data, status, jsxhr) {
                        var fileSplit = settings.initializeWithFile.split("/");
                        var fileName = fileSplit[fileSplit.length - 1];
                        self.addFileToProject(data, fileName);

                        //if we make this ajax call, we need to let all listeners know it's fully loaded.
                        $(window).trigger('meiEditorLoaded');
                    },
                    error: function(a, b, desc) {
                        self.localError("Could not load default file at URL " + settings.initializeWithFile + " with the error '" + desc + ".' Loading default untitled page instead.");
                        self.addDefaultPage();
                    }
                });
            }
            else
            {
                self.addDefaultPage();
            }

            //graphics stuff
            $(".ui-corner-all").toggleClass("ui-corner-all"); //get rid of border radii
            settings.thresholdTopbarWidth = $("#site-logo").outerWidth() + $("#topbarContentWrapper").outerWidth() + $("#topbarRightContent").outerWidth() + parseInt($("#topbarContainer").css('padding-left'), 10);
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

            //if we didn't trigger the AJAX call, let everyone know this is loaded; otherwise it's done a bit above.
            if (options.initializeWithFile === undefined)
            {
                $(window).trigger('meiEditorLoaded');
            }
        });
    };

}(jQuery));
