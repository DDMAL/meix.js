require(['meiEditor', 'https://x2js.googlecode.com/hg/xml2json.js'], function(){
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval =
        {
            init: function(meiEditor, meiEditorSettings)
            {
                /*
                Required settings:
                    divaInstance: A reference to the Diva object created from initializing Diva.
                    oneToOneMEI: A boolean flag, true if one MEI file refers to one Diva page, false if one MEI file contains multiple surfaces where each surface refers to a Diva page.
                */
                if (!("divaInstance" in meiEditorSettings) || !("oneToOneMEI" in meiEditorSettings))
                {
                    console.error("MEI Editor error: The 'Zone Display' plugin requires the 'divaInstance' and 'oneToOneMEI' settings present on intialization.");
                    return false;
                }

                var globals =
                {
                    zoneDict: {},              //dict of zones to highlight represented as {'UUID'(surface): [['ulx': ulx, 'uly': uly, 'lrx': lrx, 'lry': lry, 'divID': uuid(zone)}, {'ulx'...}]}
                    zoneIDs: [],               //an array of IDs for faster lookup
                    //these two are caches of selected/resizable highlights organized by diva pages
                    selectedCache: {},         //where selectedCache[divaItem] = [UUID, UUID...]
                    resizableCache: {},        
                    selectedClass: "editorSelected", //class to identify selected highlights. NOT a selector.
                    resizableClass: "editorResizable", //class to identify resizable highlights. NOT a selector.
                    divaPages: []
                };

                $.extend(meiEditorSettings, globals);

                //"Macro" variables
                var HIGHLIGHT_CLASS = "mei-highlight";
                var HIGHLIGHT_SELECTOR = "." + HIGHLIGHT_CLASS;
                var SINGLE_CLICK_TIMEOUT = 250;


                //local variables that don't need to be attached to the settings object
                var highlightSingleClickTimeout;
                var selectedClass = meiEditorSettings.selectedClass;
                var selectedSelector = "." + selectedClass;
                var resizableClass = meiEditorSettings.resizableClass;
                var resizableSelector = "." + resizableClass;
                var overlayID = "overlay-div";
                var overlaySelector = "#" + overlayID;
                var dragID = "drag-div";
                var dragSelector = "#" + dragID;
                var editorLastFocus = true; //true if something on the editor side was the last thing clicked, false otherwise
                var shiftKeyDown = false;

                var initDragTop, initDragLeft;


                meiEditor.addToNavbar("Zone Display", "zone-display");
                /*$("#dropdown-zone-display").append("<li><a id='file-link-dropdown'>Link files to Diva images...</a></li>" +
                    "<li><a id='file-unlink-dropdown'>Unlink files from Diva images...</a></li>" +
                    "<li><a id='update-diva-dropdown'>Update Diva</a></li>" +
                    "<li><a id='clear-selection-dropdown'>Clear selection</a></li>");
                $("#dropdown-file-upload").append("<li><a id='default-mei-dropdown'>Create default MEI file</a></li>" +
                    "<li><a id='server-load-dropdown'>Load file from server...</a></li>" +
                    "<li><a id='manuscript-dropdown'>Close project</a></li>");*/
                
                //the div that pops up when highlights are hovered over
                meiEditorSettings.element.append('<span id="hover-div"></span>'); 

                $("#help-dropdown").append("<li><a id='zone-display-help'>Zone display</a></li>");
                $("#zone-display-help").on('click', function(){
                    $("#zoneHelpModal").modal();
                });

                $("#dropdown-zone-display").append("<li><a>One-to-one: <input type='checkbox' style='float:right' id='one-to-one-checkbox'></a></li>");

                /*$("#file-link-dropdown").on('click', function()
                {
                    $('#fileLinkModal').modal();
                });

                $("#file-unlink-dropdown").on('click', function()
                {
                    $('#fileUnlinkModal').modal();
                });

                $("#update-diva-dropdown").on('click', function()
                {
                    meiEditor.createHighlights();
                });

                $("#clear-selection-dropdown").on('click', function()
                {
                    meiEditor.deselectAllHighlights();
                    meiEditor.deselectResizable(resizableSelector);
                });

                $("#estimateBox").on('click', function(e){
                    e.stopPropagation();
                });

                $("#server-load-dropdown").on('click', function(e){
                    $("#serverLoadModal").modal();
                });

                $("#zone-display-help").on('click', function()
                {
                    $("#zoneHelpModal").modal();
                });

                $("#manuscript-dropdown").on('click', function()
                {
                    window.location = document.URL.split("?")[0];
                });

                $("#default-mei-dropdown").on('click', function()
                {
                    meiEditor.addDefaultPage(createDefaultMEIString());
                });*/

                /*createModal(meiEditorSettings.element, "fileLinkModal", false,
                    "<span class='modalSubLeft'>" +
                    "Select an MEI file:<br>" +
                    createSelect("file-link", meiEditor.getPageTitles()) +
                    "</span>" +
                    "<span class='modalSubRight'>" +
                    "Select a Diva image:<br>" +
                    createSelect("diva-link", meiEditorSettings.divaPageList, true) +
                    "</span>" +
                    "<div class='clear'></div>" +
                    "<div class='centeredAccept'>" +
                    "<button id='link-files'>Link selected files</button>" +
                    "</div>");

                createModal(meiEditorSettings.element, "fileUnlinkModal", false,
                    "<div id='unlink-wrapper'>" +
                    "Unlink an MEI file from a Diva file:<br>" +
                    "<select id='selectUnlink'></select><br>" +
                    "<button id='unlink-files'>Unlink selected files</button>" +
                    "</div>");

                createModal(meiEditorSettings.element, "zoneHelpModal", false,
                    "<h4>Help for 'Zone Display' menu:</h4>" +
                    "<li>To get highlights from a file to show up in the Diva pane, click 'Link files to Diva images...' from the dropdown menu and select the files you want to link.</li>" +
                    "<br><li>'Auto-link files by filename' will automatically strip file extensions and try to match files so that '001.mei' and '001.tiff' become linked.</li>" +
                    "<br><li>Changes you make to the MEI document will not automatically transfer over; click the 'Update Diva' dropdown option to reload the highlighted objects in the image viewer.</li>" +
                    "<br><li>Clicking on a highlight will select it and move the MEI editor to its line.</li>" +
                    "<li>Holding shift and clicking will select additional highlights.</li>" +
                    "<li>Holding shift and click-dragging the mouse will select everything within a box.</li>" +
                    "<li>To deselect a single highlight, hold shift and click on a selected highlight.</li>" +
                    "<li>To deselect all highlights, choose the 'Clear selection' option of this dropdown.</li>" +
                    "<br><li>To create a new highlight, ctrl+click (Windows) or cmd+click (Mac) on empty space on the image. </li>" +
                    "<li style='margin-left:0.25in'>Only clicking will create a default box that can be resized later.</li>" +
                    "<li style='margin-left:0.25in'>Clicking and dragging will create a box with a specific size.</li>" +
                    "<li style='margin-left:0.25in'>If the 'Estimate line numbers' checkbox is checked in the Diva Page Manager dropdown menu, the program will insert a 'zone' object immediately after the 'surface' object and a 'neume' object immediately after the first 'layer' object. Use this at your own discretion.</li>" +
                    "<br><li>To resize or move a highlight, double-click on it.</li>" +
                    "<li style='margin-left:0.25in'>Click and drag on the edge of the highlight to resize it.</li>" +
                    "<li style='margin-left:0.25in'>Click and drag on the centre of the highlight or with the shift key down to move it.</li>" +
                    "<li style='margin-left:0.25in'>Pressing an arrow key will move a box slightly in the direction of the arrow.</li>" +
                    "<li style='margin-left:0.25in'>Press the 'Escape' key to leave resize/move mode.</li>" +
                    "<br><li>Press the 'delete' key on your keyboard to delete all selected highlights and the MEI lines associated with them.</li>");
                */

                createModal(meiEditorSettings.element, "zoneHelpModal", false,
                    "<h4>Help for 'Zone Display' menu:</h4>" +
                    "<li>Just email Horwitz.</li>");

                //changes the position of the on-hover box
                var changeHoverPosition = function(e)
                {
                    $("#hover-div").offset(
                    {
                        'top': e.pageY - 10,
                        'left': e.pageX + 10
                    });
                };

                
                var lastRow = 0;
                var cursorUpdate = function(a, selection)
                {
                    var curRow = selection.getCursor().row;

                    if (curRow === lastRow)
                        return;
                    else
                        lastRow = curRow;

                    var UUIDs = selection.doc.getLine(curRow).match(/[hm]*-[\dabcdef]{8}-([\dabcdef]{4})-([\dabcdef]{4})-([\dabcdef]{4})-([\dabcdef]{12})/gi);
                    if(!UUIDs) return;

                    var curFacs = UUIDs.length;

                    meiEditor.deselectAllHighlights();

                    while(curFacs--)
                    {
                        meiEditor.selectHighlight($("#" + UUIDs[curFacs]), true);
                    }
                };

                /*
                    Highlight reloading code:
                */
                var reloadOneToOneZones = function()
                {
                    if(!meiEditorSettings.oneToOneMEI)
                    {
                        meiEditor.localError("Multiple surfaces found. Can not reload zones.");
                        return false;
                    }

                    zoneDict = {}; //reset this
                    zoneIDs = []; //and this
                    var curPage;
                    var pageTitles = meiEditor.getPageTitles();
                    var idx = pageTitles.length;

                    while(idx--)
                    {
                        var curTitle = pageTitles[idx];
                        var divaIdx = getDivaIndexForPage(curTitle);
                        
                        if (divaIdx !== false)
                        {
                            zoneDict[divaIdx] = [];
                            var linesArr = meiEditor.getPageData(curTitle).parsed.getElementsByTagName('zone');
                            var lineIdx = linesArr.length;
                            while(lineIdx--)
                            {
                                var line = linesArr[lineIdx];
                                var ulx = line.getAttribute('ulx');
                                var uly = line.getAttribute('uly');
                                var lrx = line.getAttribute('lrx');
                                var lry = line.getAttribute('lry');
                                var xmlID = line.getAttribute('xml:id');

                                //assemble that dict in Diva highlight format
                                var highlightInfo = {'width': lrx - ulx, 'height': lry - uly, 'ulx': ulx, 'uly': uly, 'divID': xmlID};
                                zoneDict[divaIdx].push(highlightInfo);
                                zoneIDs.push(xmlID);
                            }
                        }
                    }

                    return publishZones(zoneDict);
                };

                var reloadMultiPageZones = function()
                {
                    if(meiEditorSettings.oneToOneMEI)
                    {
                        meiEditor.localError("Multiple surfaces not found. Can not reload zones.");
                        return false;
                    }

                    //parsing is now done on page editing in the main code body

                    /*var activePage = meiEditor.getActivePageTitle();
                    var editorRef = meiEditor.getPageData(activePage);
                    var xmlString = editorRef.session.doc.getAllLines().join("\n");
                    editorRef.parsed = meiParser.parseFromString(xmlString, 'text/xml');
                    zoneDict = {}; //reset this
                    zoneIDs = []; //and this
                    var curPage;

                    var surfaceArr = editorRef.parsed.getElementsByTagName('surface');
                    var surfaceIdx = surfaceArr.length;

                    while(surfaceIdx--)
                    {
                            //set current page
                            curPage = lineDict.surface.n;

                            //initialize that key of the dictionary
                            zoneDict[curPage] = [];
                        
                    }

                    var zoneArr = editorRef.parsed.getElementsByTagName('zone');
                    var zoneIdx = zoneArr.length;*/

                    var activePage = meiEditor.getActivePageTitle();
                    var linesArr = meiEditor.getPageData(activePage).session.doc.getAllLines();
                    zoneDict = {}; //reset this
                    zoneIDs = []; //and this
                    var curPage;

                    // iterate through each line
                    for(var line in linesArr)
                    {
                        var lineDict = parseXMLLine(linesArr[line]);

                        //if there's no XML in the current line, we don't care
                        if (!lineDict) continue;
                        //if it's a surface, treat that as the "current page" as all zones are inside that
                        else if (lineDict.hasOwnProperty('surface'))
                        {
                            //set current page
                            curPage = lineDict.surface.n;

                            //initialize that key of the dictionary
                            zoneDict[curPage] = [];
                        }
                        else if (lineDict.hasOwnProperty('zone'))
                        {
                            //assemble that dict in Diva highlight format
                            var highlightInfo = {'width': lineDict.zone.lrx - lineDict.zone.ulx, 'height': lineDict.zone.lry - lineDict.zone.uly, 'ulx': parseInt(lineDict.zone.ulx, 10), 'uly': parseInt(lineDict.zone.uly, 10), 'divID': lineDict.zone['xml:id']};
                            zoneDict[curPage].push(highlightInfo);
                            zoneIDs.push(lineDict.zone['xml:id']);
                        }
                    }
                    return publishZones(zoneDict);
                };

                /*
                    This code is the same between the above two functions.
                    Because anything that manipulates the zones will be manipulating them based off
                        their position in the DOM (as opposed to on each image), add padding/offsets
                */
                var publishZones = function(zoneDict)
                {
                    for (var curPage in zoneDict)
                    {
                        if (zoneDict[curPage].length === 0) delete zoneDict[curPage];
                    }

                    var zoneKeys = [];
                    var zoneVals = [];
                    var curKey;

                    var zoneCopy = JSON.parse(JSON.stringify(zoneDict));

                    for (curKey in zoneCopy) {
                        zoneKeys.push(curKey);
                        zoneVals.push(zoneCopy[curKey]);
                    }

                    //clear any existing highlights
                    meiEditorSettings.divaInstance.resetHighlights();
                    //publish an event that sends out the zone dict
                    meiEditor.events.publish('ZonesWereUpdated', [zoneDict]);

                    // iterate through the pages (by index) and feed them into diva
                    meiEditorSettings.divaInstance.highlightOnPages(zoneKeys, zoneVals, undefined, HIGHLIGHT_CLASS);

                    var paddingTop = 0;
                    var paddingLeft = 0;

                    for (curPage in zoneDict)
                    {
                        var pageOffset = meiEditorSettings.divaInstance.getPageOffset(curPage);

                        for (var zoneIdx in zoneDict[curPage])
                        {
                            curZone = zoneDict[curPage][zoneIdx];
                            curZone.ulx += paddingLeft + pageOffset.left;
                            curZone.uly += paddingTop + pageOffset.top;
                        }
                    }

                    return true;
                };

                //worry about one to one stuff here - if default is on, set the checkbox
                if(meiEditorSettings.oneToOneMEI) $("#one-to-one-checkbox").attr('checked', 'checked');

                meiEditor.toggleOneToOne = function()
                {
                    if ($("#one-to-one-checkbox").prop('checked'))
                    {
                        meiEditorSettings.oneToOneMEI = true;
                        meiEditor.reloadZones = reloadOneToOneZones;
                    }
                    else
                    {
                        meiEditorSettings.oneToOneMEI = false;
                        meiEditor.reloadZones = reloadMultiPageZones;
                    }
                };

                //no matter what, trigger this once to make sure it's the right listener
                meiEditor.toggleOneToOne();
                $("#one-to-one-checkbox").on('change', meiEditor.toggleOneToOne);

                //listener for this
                meiEditor.events.subscribe('UpdateZones', meiEditor.reloadZones);

                /*
                    Highlight selection code:
                */

                /* Event listeners: */

                var highlightMouseEnterHandler = function(e)
                {
                    //if there is a box currently being drawn, don't do anything
                    if (meiEditorSettings.dragActive === true)
                    {
                        return;
                    }

                    var currentTarget = e.target.id;

                    var pageTitle = meiEditor.getActivePageTitle();
                    var pageRef = meiEditor.getPageData(pageTitle);

                    var object = pageRef.parsed.querySelectorAll('[*|facs="' + currentTarget + '"]')[0];

                    if(!object) return;

                    var idx = object.attributes.length;
                    var string = object.tagName + ":<br>";

                    while(idx--)
                    {
                        curAtt = object.attributes[idx];
                        if (curAtt.name !== "xml:id" && curAtt.name !== "facs")
                            string += "<div style='margin-left:5px'>" + curAtt.name + ": " + curAtt.value + "</div>";
                    }

                    $("#hover-div").html(string + "<br>Click to find in document.");
                    $("#hover-div").css(
                    {
                        'height': 'auto',
                        'top': e.pageY - 10,
                        'left': e.pageX + 10,
                        'display': 'block'
                    });

                    //if this isn't selected, change the color 
                    if (!$("#" + currentTarget).hasClass(selectedClass) && !$("#" + currentTarget).hasClass(resizableClass))
                    {
                        $("#"+currentTarget).css('background-color', 'rgba(255, 0, 0, 0.1)');
                    }

                    //needs to be separate function as we have separate document.mousemoves that need to be unbound separately
                    $(document).on('mousemove', changeHoverPosition);
                };

                var highlightMouseLeaveHandler = function(e)
                {
                    currentTarget = e.target.id;
                    $(document).unbind('mousemove', changeHoverPosition); //stops moving the div
                    $("#hover-div").css('display', 'none'); //hides the div
                    $("#hover-div").html("");

                    //if this isn't selected, change the color back to normal
                    if(!$("#" + currentTarget).hasClass(selectedClass) && !$("#" + currentTarget).hasClass(resizableClass))
                    {
                        $("#" + currentTarget).css('background-color', 'rgba(255, 0, 0, 0.2)');
                    }
                };

                //applies various handlers for the highlights; the three parameters are Diva data
                var applyHighlightHandlers = function(pageIdx, filename, pageSelector)
                {
                    $(HIGHLIGHT_SELECTOR).unbind('click', highlightClickHandler);
                    $(HIGHLIGHT_SELECTOR).unbind('dblclick', highlightDoubleClickHandler);
                    $(HIGHLIGHT_SELECTOR).unbind('mouseenter', highlightMouseEnterHandler).on('mouseleave', highlightMouseLeaveHandler);
                    $(HIGHLIGHT_SELECTOR).on('click', highlightClickHandler);
                    $(HIGHLIGHT_SELECTOR).on('dblclick', highlightDoubleClickHandler);
                    $(HIGHLIGHT_SELECTOR).on('mouseenter', highlightMouseEnterHandler).on('mouseleave', highlightMouseLeaveHandler);
                    $(HIGHLIGHT_SELECTOR).css('cursor', 'pointer');

                    var idx = $(HIGHLIGHT_SELECTOR).length;
                    var curID, pageTitle, pageRef, xmlObj, hoverString;

                    //reload highlights from caches
                    if(meiEditorSettings.selectedCache.hasOwnProperty(pageIdx))
                    {
                        idx = meiEditorSettings.selectedCache[pageIdx].length;
                        while(idx--)
                        {
                            meiEditor.selectHighlight($('#' + meiEditorSettings.selectedCache[pageIdx][idx]), true);
                        }
                    }

                    if(meiEditorSettings.resizableCache.hasOwnProperty(pageIdx))
                    {
                        idx = meiEditorSettings.resizableCache[pageIdx].length;
                        while(idx--)
                        {
                            meiEditor.selectResizable('#' + meiEditorSettings.resizableCache[pageIdx][idx], true);
                        }
                    }
                };

                var createOverlay = function()
                {
                    meiEditorSettings.divaInstance.disableScrollable();
                    $("#diva-wrapper").append("<div id='" + overlayID + "'></div>");
                    $(overlaySelector).offset({'top': $("#diva-wrapper").offset().top, 'left': $("#diva-wrapper").offset().left});
                    $(overlaySelector).width($("#diva-wrapper").width());
                    $(overlaySelector).height($("#diva-wrapper").height());    
                    $(overlaySelector).css('background-color', 'rgba(0, 0, 0, 0.5)');
                    $("#hover-div").css('display', 'none'); //hides the div
                    $("#hover-div").html("");


                    //this prevents a graphical glitch with Diva
                    $("#diva-wrapper").on('resize', function(e){
                        e.stopPropagation();
                        e.preventDefault();
                    });
                };

                var destroyOverlay = function()
                {
                    //remove overlay and restore key bindings to Diva
                    $(overlaySelector).remove();
                    meiEditorSettings.divaInstance.enableScrollable();
                    $("#diva-wrapper").unbind('resize');
                };
                
                var highlightDoubleClickHandler = function(e)
                {
                    clearTimeout(highlightSingleClickTimeout);
                    e.stopPropagation();

                    //don't want multiple resizable
                    if ($(".ui-resizable").length > 0) return;

                    //turn off scrollability and put the overlay down
                    createOverlay();

                    $("#hover-div").on('click', function(e)
                    {
                        e.stopPropagation();
                    });

                    origObject = e.target;  
                    meiEditor.selectResizable(origObject);
                };

                var highlightClickHandler = function(e)
                {
                    //no matter what, clear the timeout
                    clearTimeout(highlightSingleClickTimeout);
                    
                    //if we don't hear a double-click after some time, call this
                    highlightSingleClickTimeout = setTimeout(function()
                    {
                        clearTimeout(highlightSingleClickTimeout);
                        e.stopPropagation();

                        //index of the page clicked on
                        var clickedIdx = $(e.target).parent().attr('data-index');
                        var clickedTitle = pageTitleForDivaFilename(meiEditorSettings.divaPages[clickedIdx]);

                        //if the clicked page is not linked, return and do nothing
                        if (clickedTitle === false)
                        {
                            meiEditor.deselectAllHighlights();
                            return false;
                        }

                        //diva index of the page currently clicked on
                        var currentTitle = meiEditorSettings.activePageTitle;
                        var currentIdx = meiEditorSettings.divaPages.indexOf(currentTitle.split(".")[0]);

                        //if the two indices are not the same
                        if (clickedIdx != currentIdx)
                        {
                            meiEditor.switchToPage(clickedTitle);
                        }

                        meiEditor.deselectAllHighlights();
                        meiEditor.selectHighlight(e.target);
                        return true;
                    }, SINGLE_CLICK_TIMEOUT);
                };

                var gotoLineWithID = function(id)
                {
                    var searchNeedle = new RegExp(id, "g");

                    //searches for the facs ID that is also the ID of the highlighted panel
                    var pageTitle = meiEditor.getActivePageTitle();
                    meiEditor.getPageData(pageTitle).selection.removeListener('changeCursor', cursorUpdate);
                    
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

                    meiEditor.getPageData(pageTitle).selection.on('changeCursor', cursorUpdate);

                };

                /*
                    Selects a highlight.
                    @param divToSelect The highlight to select.
                    @param findOverride Overrides jumping to the div in the editor pane.
                */
                meiEditor.selectHighlight = function(divToSelect, findOverride)
                {
                    //don't select resizables
                    if($(divToSelect).hasClass("ui-resizable")) return;

                    if(!findOverride) gotoLineWithID(divToSelect.id);

                    $(divToSelect).addClass(selectedClass);
                    $(divToSelect).css('background-color', 'rgba(0, 255, 0, 0.1)');
                    updateCaches();

                };

                //shortcut to deselect all highlights
                meiEditor.deselectAllHighlights = function()
                {
                    meiEditor.deselectHighlight(selectedSelector);
                };

                //deselects highlights.
                meiEditor.deselectHighlight = function(divToDeselect)
                {
                    $(divToDeselect).css('background-color', 'rgba(255, 0, 0, 0.2)');
                    $(divToDeselect).toggleClass(selectedClass);
                    updateCaches();
                };

                //function to make a div resizable
                meiEditor.selectResizable = function(object, findOverride)
                {
                    //change color to yellow, pop on top of everything
                    $(object).css({'z-index': 150,
                        'background-color': 'rgba(255, 255, 0, 0.5)'});
                    $(object).addClass(resizableClass);

                    //jQuery UI resizable, when resize stops update the box's position in the document
                    if(!$(object).data('uiResizable') && !meiEditorSettings.editModeActive)
                    {
                        $(object).resizable({
                            handles: 'all',
                            start: function(e)
                            {
                                e.stopPropagation();
                                e.preventDefault();
                            },
                            resize: function(e)
                            {
                                e.stopPropagation();
                                e.preventDefault();
                                //check the size and update the icon accordingly
                                checkResizable(resizableSelector); 
                            },
                            stop: function(e, ui)
                            {
                                e.stopPropagation();
                                e.preventDefault();
                                meiEditor.updateBox(ui.helper);
                            }
                        });
 
                        checkResizable(resizableSelector);
                    }
                    //jQuery UI draggable, when drag stops update the box's position in the document
                    if(!$(object).data('uiDraggable'))
                    {
                        $(object).draggable({
                            stop: function(e, ui)
                            {
                                meiEditor.updateBox(ui.helper);
                            }
                        });
                    }

                    if(!findOverride) gotoLineWithID(object.id);

                    updateCaches();
                };

                //deselects a resizable object
                meiEditor.deselectResizable = function(object)
                {
                    if($(object).length !== 0)
                    {
                        //return it to normal
                        $(object).draggable('destroy');
                        $(object).resizable('destroy');
                        $(object).css('z-index', $(".overlay-box").css('z-index'));
                        $(object).css('background-color', 'rgba(255, 0, 0, 0.2)');
                        $(object).toggleClass(resizableClass);
                    }

                    destroyOverlay();
                    updateCaches();
                };

                //writes changes to an object into the document
                meiEditor.updateBox = function(box)
                {
                    var boxPosition = $(box).position();
                    var itemID = $(box).attr('id');
                    var ulx = meiEditorSettings.divaInstance.translateToMaxZoomLevel(boxPosition.left);
                    var uly = meiEditorSettings.divaInstance.translateToMaxZoomLevel(boxPosition.top);
                    var lrx = meiEditorSettings.divaInstance.translateToMaxZoomLevel(boxPosition.left + $(box).outerWidth());
                    var lry = meiEditorSettings.divaInstance.translateToMaxZoomLevel(boxPosition.top + $(box).outerHeight());

                    var pageTitle = meiEditor.getActivePageTitle();
                    var pageRef = meiEditor.getPageData(pageTitle);

                    var zoneArr = pageRef.parsed.querySelectorAll('zone[*|id="' + itemID + '"]');
                    var curZone = zoneArr[0];
                    curZone.setAttribute('ulx', ulx);
                    curZone.setAttribute('uly', uly);
                    curZone.setAttribute('lrx', lrx);
                    curZone.setAttribute('lry', lry);

                    //rewriting will trigger an edit, which in turn will trigger reloading the zones
                    //because this acts like an edit, it can be run multiple times in quick succession and will only upload zones when it's done
                    
                    meiEditor.getPageData(pageTitle).selection.removeListener('changeCursor', cursorUpdate);
                    rewriteAce(pageRef);
                    meiEditor.getPageData(pageTitle).selection.on('changeCursor', cursorUpdate);
                };

                var prepNewHighlight = function(e)
                {
                    $(overlaySelector).append('<div id="' + dragID + '"></div>');
                    $(dragSelector).css('z-index', $(overlaySelector).css('z-index') + 1);
                    initDragTop = e.pageY;
                    initDragLeft = e.pageX;
                    $(dragSelector).offset({'top': e.pageY, 'left':e.pageX});

                    //as you drag, resize it - separate function as we have two document.mousemoves that we need to unbind separately
                    $(document).on('mousemove', changeDragSize);

                    $(document).on('mouseup', createHighlight);
                };

                //updates the size of the drag-div box (spawned on shift/meta+drag)
                var changeDragSize = function(e)
                {
                    clearSelections();

                    //original four sides
                    var dragLeft = $(dragSelector).offset().left;
                    var dragTop = $(dragSelector).offset().top;
                    var dragRight = dragLeft + $(dragSelector).width();
                    var dragBottom = dragTop + $(dragSelector).height();           

                    //if we're moving left
                    if (e.pageX < meiEditorSettings.initDragLeft)
                    {
                        $(dragSelector).offset({'left': e.pageX});
                        $(dragSelector).width(dragRight - e.pageX);
                    }
                    //moving right
                    else $(dragSelector).width(e.pageX - dragLeft);

                    //moving up
                    if (e.pageY < meiEditorSettings.initDragTop)
                    {
                        $(dragSelector).offset({'top': e.pageY});
                        $(dragSelector).height(dragBottom - e.pageY);
                    }
                    //moving down
                    else $(dragSelector).height(e.pageY - dragTop);
                };

                var createHighlight = function(e)
                {
                    //unbind everything that could have caused this
                    $(document).unbind('mousemove', changeDragSize);
                    $(document).unbind('mouseup', createHighlight);
                    
                    //if the clicked page is not linked, warn and do nothing
                    var clickedIdx = meiEditorSettings.divaInstance.getPageIndexForPageXYValues(initDragLeft, initDragTop);
                    if(meiEditorSettings.divaPages[clickedIdx] === undefined) return false;
                    var clickedTitle = pageTitleForDivaFilename(meiEditorSettings.divaPages[clickedIdx]);
                    if (clickedTitle === false)
                    {
                        meiEditor.localError("Current Diva image is not linked.");
                        $(dragSelector).remove();
                        return false;
                    }

                    //aliasing a function for readability here
                    divaTranslate = meiEditorSettings.divaInstance.translateToMaxZoomLevel;
                    var divaPageObj = $("#1-diva-page-" + meiEditorSettings.divaInstance.getCurrentPageIndex());
                        
                    //if this was just a click
                    if ($(dragSelector).width() < 2 && $(dragSelector).height() < 2)
                    {
                        //get the click
                        var centerX = e.pageX;
                        var centerY = e.pageY;

                        centerY = divaTranslate(centerY - divaPageObj.offset().top);
                        centerX = divaTranslate(centerX - divaPageObj.offset().left);

                        //create a new 200*200 object
                        insertNewZone(clickedIdx, centerX - 100, centerY - 100, centerX + 100, centerY + 100);
                    }
                    //else if we dragged to create a neume
                    else 
                    {
                        //left position
                        var draggedBoxLeft = $(dragSelector).offset().left - divaPageObj.offset().left;
                        //translated right position (converted to max zoom level)
                        var draggedBoxRight = divaTranslate(draggedBoxLeft + $(dragSelector).outerWidth());
                        //translated left - we needed the original left to get the right translation, so we translate it now
                        draggedBoxLeft = divaTranslate(draggedBoxLeft);

                        //same vertical
                        var draggedBoxTop = $(dragSelector).offset().top - divaPageObj.offset().top;
                        var draggedBoxBottom = divaTranslate(draggedBoxTop + $(dragSelector).outerHeight());
                        draggedBoxTop = divaTranslate(draggedBoxTop);

                        //create the neume
                        insertNewZone(clickedIdx, draggedBoxLeft, draggedBoxTop, draggedBoxRight, draggedBoxBottom);
                    }

                    $(dragSelector).remove();
                    return true;
                };

                //code to insert a new neume, takes the four corner positions (upper left x/y, lower right x/y) as params
                var insertNewZone = function(divaIndex, ulx, uly, lrx, lry)
                {
                    ulx = parseInt(ulx, 10);
                    uly = parseInt(uly, 10);
                    lrx = parseInt(lrx, 10);
                    lry = parseInt(lry, 10);
                    
                    meiEditor.localLog("Got a new neume at " + ulx + " " + uly + " " + lrx + " " + lry);
                    if (meiEditorSettings.oneToOneMEI)
                    {
                        var divaFilename = meiEditorSettings.divaPages[divaIndex];
                        var pageTitle = pageTitleForDivaFilename(divaFilename);

                        var parsed = meiEditor.getPageData(pageTitle).parsed;
                        var zones = parsed.getElementsByTagName('zone');
                        var idx = zones.length;

                        //create a [xml:id, uly, lry, centerY] object for each zone
                        var highlights = []; 
                        var curZone, xmlID, curUly, curLry;

                        while(idx--)
                        {
                            curZone = zones[idx];
                            xmlID = curZone.getAttribute('xml:id');
                            curUly = parseInt(curZone.getAttribute('uly'), 10);
                            curLry = parseInt(curZone.getAttribute('lry'), 10);
                            highlights.push({'xmlID': xmlID, 'uly':curUly, 'lry':curLry, 'centerY':((curUly-curLry)/2 + curLry)});
                        }

                        //sort these zones by their center point
                        var centeredPoints = highlights.sort(function(a, b){
                            return a.centerY - b.centerY;
                        });

                        //totalCenterGaps is the total distance between the center points of every adjacent pair of highlights
                        var totalCenterGaps = 0;

                        //start at the second one from the end because we're sorting by pairs; calculate average
                        for(idx = centeredPoints.length - 2; idx >= 0; idx--)
                        {
                            totalCenterGaps += centeredPoints[idx + 1].centerY - centeredPoints[idx].centerY;
                            idx--;
                        }
                        var avgGap = (totalCenterGaps / (centeredPoints.length - 1));

                        //re-initialize the array one last time
                        idx = centeredPoints.length - 1;
                        var clusters = [{'ids': [centeredPoints[idx].xmlID], 'uly': centeredPoints[idx].uly, 'lry': centeredPoints[idx].lry}]; //initialize one cluster with the ID of the first object
                        var added = false;

                        //cluster everything together
                        while(idx--)
                        {
                            curPoint = centeredPoints[idx];
                            clIdx = clusters.length;
                            //go through all existing clusters for each point
                            while(clIdx--)
                            {
                                curCluster = clusters[clIdx];
                                //if either extreme point is in the cluster, save the index and break
                                if(isIn(curPoint.lry, curCluster.uly - avgGap, curCluster.lry + avgGap) || isIn(curPoint.uly, curCluster.uly - avgGap, curCluster.lry + avgGap))
                                {
                                    added = clIdx;
                                    break;
                                }
                            }

                            //if it's not inside anything, make a new cluster
                            if (added === false)
                            {
                                clusters.push({'ids': [curPoint.xmlID], 'uly': curPoint.uly, 'lry': curPoint.lry});
                            }
                            //if it's inside something, add it to that cluster and update the extremes
                            else
                            {
                                curCluster = clusters[added];
                                curCluster.ids.push(curPoint.xmlID);
                                
                                if (curPoint.lry > curCluster.lry) curCluster.lry = curPoint.lry;
                                if (curPoint.uly < curCluster.uly) curCluster.uly = curPoint.uly;
                                added = false;
                            }
                        }

                        //and in case any two clusters developed independently, condense them
                        var toDel = [];

                        for (idx = 0; idx < clusters.length; idx++)
                        {
                            curCluster = clusters[idx];
                            if (curCluster === undefined) continue;

                            for (compIdx = (idx + 1); compIdx < clusters.length; compIdx++)
                            {
                                compCluster = clusters[compIdx];
                                if (compCluster === undefined) continue;

                                if (isIn(curCluster.lry, compCluster.uly, compCluster.lry) || isIn(curCluster.uly, compCluster.uly, compCluster.lry))
                                {
                                    if (compCluster.lry > curCluster.lry) curCluster.lry = compCluster.lry;
                                    if (compCluster.uly < curCluster.uly) curCluster.uly = compCluster.uly;
                                    var arr = curCluster.ids;
                                    var compArr = compCluster.ids;
                                    var combArr = arr.concat(compArr);

                                    curCluster.ids = combArr;
                                    delete clusters[compIdx];
                                }
                            }
                        }

                        clusters = condense(clusters).reverse();

                        var chosenIdx = undefined, lastIdx = undefined;

                        for (idx = 0; idx < clusters.length; idx++)
                        {
                            curCluster = clusters[idx];
                            //if the new zone is inside a cluster, we want to stop
                            if (isIn(uly, curCluster.uly - avgGap, curCluster.lry + avgGap) || isIn(lry, curCluster.uly - avgGap, curCluster.lry + avgGap))
                            {
                                chosenIdx = idx;
                                break;
                            }
                            //else if it's below the zone, save the last index
                            else if (lry > curCluster.uly)
                            {
                                lastIdx = idx;
                            }
                        }

                        var orderCluster = function(cluster)
                        {
                            var ids = cluster.ids;
                            var xPoses = [];

                            for (idx = 0; idx < ids.length; idx++)
                            {
                                curZone = parsed.querySelectorAll('zone[*|id=' + ids[idx] + ']')[0];
                                xPoses.push({'zoneRef': curZone, 'ulx': parseInt(curZone.getAttribute('ulx'), 10)});
                            }

                            return xPoses.sort(function(a, b){
                                return a.ulx - b.ulx;
                            });
                        };

                        //find the ID to insert things after
                        var prevZone, nextZone, indentIndex, indentNode;

                        //if we didn't find the right cluster
                        if (chosenIdx === undefined)
                        {
                            //if we found a cluster before the new zone
                            if (lastIdx === undefined) 
                            {
                                sorted = orderCluster(clusters[0]);
                                nextZone = sorted[0].zoneRef;
                            }
                            //if we didn't
                            else
                            {
                                sorted = orderCluster(clusters[lastIdx]);
                                prevZone = sorted[sorted.length - 1].zoneRef;

                                if (clusters[lastIdx + 1] !== undefined)
                                {
                                    sorted = orderCluster(clusters[lastIdx + 1]);
                                    nextZone = sorted[0].zoneRef;
                                }
                            }
                        }
                        //if we did find the right cluster
                        else
                        {
                            sorted = orderCluster(clusters[chosenIdx]);

                            //if it's before everything in the cluster
                            if (ulx < sorted[0].ulx)
                            {
                                nextZone = sorted[0].zoneRef;
                                //grab the last one of the previous cluster if it exists to position it after
                                if (clusters[chosenIdx - 1] !== undefined)
                                {
                                    sorted = orderCluster(clusters[chosenIdx - 1]);
                                    prevZone = sorted[sorted.length - 1].zoneRef;
                                }
                            }
                            //if it's after everything in the cluster
                            else if (ulx > sorted[sorted.length - 1].ulx)
                            {
                                prevZone = sorted[sorted.length - 1].zoneRef;
                                //grab the first one of the next cluster
                                if (clusters[chosenIdx + 1] !== undefined)
                                {
                                    sorted = orderCluster(clusters[chosenIdx + 1]);
                                    nextZone = sorted[0].zoneRef;
                                }
                            } 
                            else
                            {
                                for (idx = 0; idx < sorted.length; idx++)
                                {
                                    if (ulx < sorted[idx].ulx){
                                        prevZone = sorted[idx - 1].zoneRef;
                                        nextZone = sorted[idx].zoneRef;
                                        break;
                                    }
                                }
                            }
                        }

                        var toInsert = parsed.createElement('zone');
                        toInsert.setAttribute('xml:id', 'h'+genUUID());
                        toInsert.setAttribute('ulx', ulx);
                        toInsert.setAttribute('uly', uly);
                        toInsert.setAttribute('lrx', lrx);
                        toInsert.setAttribute('lry', lry);

                        if(nextZone)
                        {
                            indentIndex = Array.prototype.indexOf.call(nextZone.parentElement.childNodes, nextZone);
                            indentNode = nextZone.parentElement.childNodes[indentIndex - 1].cloneNode(false);
                            
                            nextZone.parentElement.insertBefore(toInsert, nextZone);
                            nextZone.parentElement.insertBefore(indentNode, nextZone);
                        }
                        else 
                        {
                            indentIndex = Array.prototype.indexOf.call(prevZone.parentElement.childNodes, prevZone);
                            indentNode = prevZone.parentElement.childNodes[indentIndex - 1].cloneNode(false);

                            inserted = prevZone.insertAdjacentElement("afterEnd", toInsert);
                            inserted.parentElement.insertBefore(indentNode, inserted);
                        }             

                        rewriteAce(meiEditor.getPageData(pageTitle));
                    }
                };

                /******** Various event listeners ********/

                $(document).on('keydown', function(e)
                {
                    if (e.shiftKey && !shiftKeyDown)
                    {
                        shiftKeyDown = true;
                        e.stopPropagation();
                        createOverlay();
                        $(overlaySelector).on('mousedown', prepNewHighlight);
                    } 
                });

                $(document).on('keyup', function(e)
                {
                    var resizableActive = ($(resizableSelector).length > 0);
                    var selectedActive = ($(selectedSelector).length > 0);
                    
                    console.log("down with focus", editorLastFocus);
                    //if the editor was the last thing clicked, we don't want to listen
                    if (editorLastFocus) return;

                    console.log("down but", e.shiftKey, shiftKeyDown);
                    if (!e.shiftKey && shiftKeyDown) 
                    {
                        console.log("destroying");
                        shiftKeyDown = false;
                        e.stopPropagation();
                        $(overlaySelector).unbind('mousedown', prepNewHighlight);
                        destroyOverlay();
                    }
                    //escape to quit whatever the current selection is
                    else if (e.keyCode == 27 && (resizableActive || selectedActive)) 
                    { 
                        e.stopPropagation();
                        ($(resizableSelector).length > 0) ? meiEditor.deselectResizable(resizableSelector) : meiEditor.deselectAllHighlights();
                        destroyOverlay();
                    } 
                    //arrow keys to nudge resizable
                    else if ((e.keyCode < 41) && (e.keyCode > 36) && resizableActive)
                    {
                        e.stopPropagation();
                        e.preventDefault();

                        switch (e.keyCode) 
                        {
                            case 37:
                                $(resizableSelector).offset({'left': $(resizableSelector).offset().left - 1});
                                break;
                            case 38:
                                $(resizableSelector).offset({'top': $(resizableSelector).offset().top - 1});
                                break;
                            case 39:
                                $(resizableSelector).offset({'left': $(resizableSelector).offset().left + 1});
                                break;
                            case 40:
                                $(resizableSelector).offset({'top': $(resizableSelector).offset().top + 1});
                                break;
                            default:
                                break;
                        }
                        meiEditor.updateBox(resizableSelector);
                    }
                    //delete when one is either resizable or selected
                    else if((e.keyCode == 46 || e.keyCode == 8) && (selectedActive || resizableActive))
                    {
                        e.stopPropagation();
                        e.preventDefault();

                        //if double-click active, we want to remove only the resizable, otherwise we want to remove the selected
                        var selector = ($(resizableSelector).length > 0) ? resizableSelector : selectedSelector;
                        
                        var pageTitle = meiEditor.getActivePageTitle();
                        var pageRef = meiEditor.getPageData(pageTitle);

                        var curItemIndex = $(selector).length;
                        var zoneArr = [];
                        while (curItemIndex--) //in case there's multiple
                        {
                            var curItem = $(selector)[curItemIndex];    
                            var itemID = $(curItem).attr('id');

                            //regenerate these every time
                            zoneArr = pageRef.parsed.querySelectorAll('zone[*|id=' + itemID + ']');
                            safelyRemove(zoneArr[0]);

                            zoneArr = pageRef.parsed.querySelectorAll('[facs=' + itemID + ']');
                            safelyRemove(zoneArr[0]);
                        }

                        (selector === resizableSelector) ? meiEditor.deselectResizable(resizableSelector) : meiEditor.deselectAllHighlights();

                        rewriteAce(pageRef);
                        meiEditor.localLog("Deleted highlights."); 
                    }
                });   

                /*
                    Saves highlights/resizable IDs while highlights are being reloaded.
                */
                var updateCaches = function()
                {
                    meiEditorSettings.selectedCache = {};
                    meiEditorSettings.resizableCache = {};
                    var curHighlightObject, idx = $(selectedSelector).length;
                    while(idx--)
                    {
                        curHighlightObject = $($(selectedSelector)[idx]);
                        pageIdx = curHighlightObject.parent().attr('data-index');
                        if (!meiEditorSettings.selectedCache.hasOwnProperty(pageIdx))
                            meiEditorSettings.selectedCache[pageIdx] = [];
                        meiEditorSettings.selectedCache[pageIdx].push(curHighlightObject.attr('id'));
                    }

                    idx = $(resizableSelector).length;
                    while(idx--)
                    {
                        curHighlightObject = $($(resizableSelector)[idx]);
                        pageIdx = curHighlightObject.parent().attr('data-index');
                        if (!meiEditorSettings.resizableCache.hasOwnProperty(pageIdx))
                            meiEditorSettings.resizableCache[pageIdx] = [];
                        meiEditorSettings.resizableCache[pageIdx].push(curHighlightObject.attr('id'));
                    }
                };

                /*
                    Gets the diva page index for a specific page title by stripping extensions.
                    MAKE SURE to === compare to false the result of this - 0 is a valid page index!
                */
                var getDivaIndexForPage = function(pageTitle)
                {
                    var splitName = pageTitle.split(".")[0];
                    var divaIndex = meiEditorSettings.divaPages.length;
                    while(divaIndex--)
                    {
                        splitImage = meiEditorSettings.divaPages[divaIndex];
                        if (splitName == splitImage)
                        {
                            return divaIndex;
                        }
                    }
                    return false;
                };

                var pageTitleForDivaFilename = function(filename)
                {
                    var splitName = filename.split(".")[0];
                    var pageTitles = meiEditor.getPageTitles();
                    var idx = pageTitles.length;
                    var splitPage;

                    while(idx--)
                    {
                        splitPage = pageTitles[idx].split(".")[0];
                        if (splitName == splitPage)
                        {
                            return pageTitles[idx];
                        }
                    }
                    return false;
                };

                //Various editor listeners for filename changes
                meiEditor.events.subscribe("NewFile", function(a, fileName)
                {
                    //if the page is in Diva...
                    var divaIdx = getDivaIndexForPage(fileName);
                    if (divaIdx === false) return;

                    //scroll to it
                    meiEditorSettings.divaInstance.gotoPageByIndex(divaIdx);
                    meiEditor.getPageData(fileName).selection.on('changeCursor', cursorUpdate);
                    meiEditor.events.publish('UpdateZones');
                });

                meiEditor.events.subscribe("ActivePageChanged", function(fileName)
                {
                    //if the page is in Diva...
                    var divaIdx = getDivaIndexForPage(fileName);
                    if (divaIdx === false) return;

                    //scroll to it
                    meiEditorSettings.divaInstance.gotoPageByIndex(divaIdx);
                    meiEditor.getPageData(fileName).selection.on('changeCursor', cursorUpdate);
                    meiEditor.events.publish('UpdateZones');
                });

                meiEditor.events.subscribe("PageWasDeleted", function(pageName)
                {
                    meiEditor.events.publish('UpdateZones');
                });

                meiEditor.events.subscribe("PageEdited", meiEditor.reloadZones);

                meiEditor.events.subscribe("PageWasRenamed", function(originalName, newName)
                {
                    //if the page is in Diva...
                    var divaIdx = getDivaIndexForPage(newName);
                    if (divaIdx === false) return;
                    if (newName !== meiEditor.getActivePageTitle()) return;

                    //scroll to it
                    meiEditorSettings.divaInstance.gotoPageByIndex(divaIdx);
                    meiEditor.getPageData(newName).selection.on('changeCursor', cursorUpdate);
                    meiEditor.events.publish('UpdateZones');
                });

                //if diva scrolls to a new page that's loaded, switch to it in the tabs
                diva.Events.subscribe("HighlightCompleted", applyHighlightHandlers);
                diva.Events.subscribe("ZoomLevelDidChange", updateCaches);
                diva.Events.subscribe("VisiblePageDidChange", function(pageNumber, fileName)
                {
                    var splitImage = fileName.split(".")[0];
                    var pageTitles = meiEditor.getPageTitles();
                    var idx = pageTitles.length;
                    var splitPage;

                    while(idx--)
                    {
                        pageTitle = pageTitles[idx];
                        splitPage = pageTitle.split(".")[0];
                        if(splitImage == splitPage)
                        {
                            for(var curIdx in meiEditorSettings.tabTitlesByIndex)
                            {
                                if (pageTitle == meiEditorSettings.tabTitlesByIndex[curIdx])
                                {
                                    $("#openPages").tabs("option", "active", curIdx);
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                });
                
                var pageTitles = meiEditor.getPageTitles();
                var idx = pageTitles.length;

                while(idx--)
                {
                    meiEditor.getPageData(pageTitles[idx]).selection.on('changeCursor', cursorUpdate);
                }

                for(var curIdx in meiEditorSettings.divaInstance.getSettings().pages)
                {
                    //add all diva image filenames (without extension)
                    meiEditorSettings.divaPages.push(meiEditorSettings.divaInstance.getSettings().pages[curIdx].f.split(".")[0]);
                }

                $(document).on('click', function(e)
                {
                    if ($(e.target).closest('#mei-editor').length > 0) {
                        editorLastFocus = true;
                    }
                    else if ($(e.target).closest('#diva-wrapper').length > 0) {
                        editorLastFocus = false;
                        document.activeElement.blur();
                    }
                });

                return true;
            }
        };
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});
