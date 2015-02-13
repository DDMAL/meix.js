require(['meiEditor', 'https://x2js.googlecode.com/hg/xml2json.js'], function(){

(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
            {
            divName: "zone-display",
            title: 'Diva page manager',
            dropdownOptions: 
            {
                "Link files to Diva images...": "file-link-dropdown",
                "Unlink files from Diva images...": "file-unlink-dropdown",
                "Auto-link files by filename": "auto-link-dropdown",
                "Update Diva": "update-diva-dropdown",
                "Clear selection": "clear-selection-dropdown"
            },
            init: function(meiEditor, meiEditorSettings)
            {
                /*
                Required settings:
                    divaInstance: A reference to the Diva object created from initializing Diva.
                    jsonFileLocation: A link to the .json file retrieved from Diva's process/generateJson.py files
                    oneToOneMEI: A boolean flag, true if one MEI file refers to one Diva page, false if one MEI file contains multiple surfaces where each surface refers to a Diva page.
                */
                if (!("divaInstance" in meiEditorSettings) || !("jsonFileLocation" in meiEditorSettings) || !("oneToOneMEI" in meiEditorSettings))
                {
                    console.error("MEI Editor error: The 'Diva Manager' plugin requires the 'divaInstance', 'jsonFileLocation', 'currentSite', and 'siglum_slug' settings present on intialization.");
                    return false;
                }

                /*var globals = 
                {
                    divaPageList: [],           //list of active pages in Diva
                    divaImagesToMeiFiles: {},   //keeps track of linked files
                    neumeObjects: {},           //keeps track of neume objects
                    initDragTop: "",            //when a drag-div is being created, this stores the mouse's initial Y coordinate
                    initDragLeft: "",           //when a drag-div is being created, this stores the mouse's initial X coordinate
                    dragActive: false,          //prevents .overlay-box objects from appearing on mouseover while a drag is occuring
                    editModeActive: false,      //determines if the shift key is being held down
                    createModeActive: false,    //determines if the meta key is being held down
                    boxSingleTimeout: "",       //stores the timeout object for determining if a box was double-clicked or single-clicked
                    boxClickHandler: "",        //stores the current function to be called when a box is single-clicked; this changes depending on whether or not shift is down
                    highlightedCache: [],       //cache of highlighted items used to reload display once createHighlights is called
                    resizableCache: [],         //cache of resizable items used to reload display once createHighlights is called
                    lastClicked: "",            //determines which delete listener to use by storing which side was last clicked on
                    highlightHandle: "",        //handler for the highlight event, needs to be committed to memory
                    activeNeumeChoices: [],      //list of neumes present on the active page to choose from when creating new zones
                    foreignPageNames: [],
                    pageLoadedByScrolling: false,
                };*/

                var globals = 
                {
                    zoneDict: {},              //dict of zones to highlight represented as {'UUID'(surface): [['ulx': ulx, 'uly': uly, 'lrx': lrx, 'lry': lry, 'divID': uuid(zone)}, {'ulx'...}]}
                    zoneIDs: [],               //an array of IDs for faster lookup
                };

                $.extend(meiEditorSettings, globals);

                meiEditor.addToNavbar("Zone Display", "zone-display");
                $("#dropdown-zone-display").append("<li><a id='file-link-dropdown'>Link files to Diva images...</a></li>" +
                    "<li><a id='file-unlink-dropdown'>Unlink files from Diva images...</a></li>" +
                    "<li><a id='update-diva-dropdown'>Update Diva</a></li>" +
                    "<li><a id='clear-selection-dropdown'>Clear selection</a></li>");
                $("#dropdown-file-upload").append("<li><a id='default-mei-dropdown'>Create default MEI file</a></li>" +
                    "<li><a id='server-load-dropdown'>Load file from server...</a></li>" + 
                    "<li><a id='manuscript-dropdown'>Close project</a></li>");
                $("#help-dropdown").append("<li><a id='zone-display-help'>Diva page manager</a></li>");

                $("#file-link-dropdown").on('click', function()
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
                    meiEditor.deselectResizable(".resizableSelected");
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
                });

                createModal(meiEditorSettings.element, "fileLinkModal", false, 
                    "<span class='modalSubLeft'>" +
                    "Select an MEI file:<br>" +
                    createSelect("file-link", meiEditorSettings.pageData) +
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
    
                var reloadOneToOneZones = function()
                {
                    if(!meiEditorSettings.oneToOneMEI) 
                    {
                        meiEditor.localError("Multiple surfaces found. Can not reload zones.");
                        return false;
                    }
                    meiEditor.localWarn("reloadOneToOneZones not implemented yet.");
                    return false;
                };

                var reloadMultiPageZones = function()
                {
                    console.log('called');
                    if(meiEditorSettings.oneToOneMEI) 
                    {
                        meiEditor.localError("Multiple surfaces not found. Can not reload zones.");
                        return false;
                    }

                    var activePage = meiEditor.getActivePageTitle();
                    var linesArr = meiEditorSettings.pageData[activePage].session.doc.getAllLines();
                    zoneDict = {}; //reset this
                    var curPage;

                    // iterate through each line
                    for(line in linesArr)
                    {
                        var lineDict = parseXMLLine(linesArr[line]);
                     
                        //if there's no XML in the current line, we don't care    
                        if (!lineDict) continue;
                        //if it's a surface, treat that as the "current page" as all zones are inside that
                        else if (lineDict.hasOwnProperty('surface'))
                        {
                            //set current page
                            curPage = lineDict['surface']['n'];

                            //initialize that key of the dictionary
                            zoneDict[curPage] = [];
                        }
                        else if (lineDict.hasOwnProperty('zone'))
                        {
                            //assemble that dict in Diva highlight format
                            var highlightInfo = {'width': lineDict['zone']['lrx'] - lineDict['zone']['ulx'], 'height': lineDict['zone']['lry'] - lineDict['zone']['uly'], 'ulx':lineDict['zone']['ulx'], 'uly': lineDict['zone']['uly'], 'divID': lineDict['zone']['xml:id']};
                            zoneDict[curPage].push(highlightInfo);
                        }
                    }
                    
                    //clear any existing highlights
                    divaData.resetHighlights();
                    // iterate through the pages (by index) and feed them into diva
                    for (page in zoneDict)
                    {
                        divaData.highlightOnPage(page, zoneDict[page]);
                    } 

                    //publish an event that sends out the zone dict
                    meiEditor.events.publish('ZonesWereUpdated', [zoneDict]);
                    return true;
                };

                //public function to re-parse XML
                meiEditor.reloadZones = (meiEditorSettings.oneToOneMEI ? reloadOneToOneZones : reloadMultiPageZones);
                //so zone reloading can be triggered
                meiEditor.events.subscribe('UpdateZones', meiEditor.reloadZones);              


                return true;
            }
        };
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});