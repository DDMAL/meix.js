(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            divName: "file-upload",
            maximizedAppearance: '<input type="file" id="fileInput">' 
                + '<br>Files loaded:'
                + '<div id="file-list" class="file-list"></div>',
            minimizedTitle: 'Files loaded:',
            minimizedAppearance: '',
            init: function(meiEditor, meiEditorSettings)
            {
                $.extend(meiEditorSettings, {
                    activeDoc: "",
                    currentPage: "",
                    currentDocPosition: {'row': 1, 'col': 1},
                    pageData: {},
                    orderedPageData: [],
                    whiteSpaceConversion: {},
                    neumeObjects: [],
                    currentTarget: "",
                });

                /*
                    Changes the active page in the editor.
                    @param pageName The page to switch to.
                */
                meiEditor.changeActivePage = function(pageName)
                {
                    meiEditorSettings.editor.setSession(meiEditorSettings.pageData[pageName]); //inserts text
                    meiEditorSettings.activeDoc = meiEditorSettings.editor.getSession().doc;
                };

                /*
                    Prompts local download of a page.
                    @param pageName The page to download.
                    @param pageNameOriginal The page to download with whitespace/periods/hyphens.
                */
                meiEditor.savePageToClient = function(pageName)
                {
                    formatToSave = function(lineIn, indexIn)
                    {          
                        if(lineIn !== "") //if the line's not blank (nothing in MEI should be)
                        {
                            formattedData[indexIn] = lineIn + "\n"; //add a newline - it doesn't use them otherwise. Last line will have a newline but this won't stack when pages are re-uploaded as this also removes blank lines.
                        }
                    }

                    var formattedData = [];
                    var lastRow = meiEditorSettings.pageData[pageName].doc.getLength() - 1; //0-indexed
                    meiEditorSettings.pageData[pageName].doc.getLines(0, lastRow).forEach(formatToSave); //format each
                    var pageBlob = new Blob(formattedData, {type: "text/plain;charset=utf-8"}); //create a blob
                    saveAs(pageBlob, pageName); //download it! from FileSaver.js
                };

                /*
                    Removes from page without project without saving.
                    @param pageName The page to remove.
                    @param pageNameOriginal The page to remove with whitespace/periods/hyphens.
                */
                meiEditor.removePageFromProject = function(pageName)
                {   
                    if(pageName in meiEditorSettings.pageData)
                    {
                        if(meiEditorSettings.editor.getSession() == meiEditorSettings.pageData[pageName]) //if the deleted page was the active page
                        {
                            meiEditorSettings.editor.setSession(new ace.EditSession("", "ace/mode/xml")); //reset to editor to a blank edit session
                        }
                        delete meiEditorSettings.pageData[pageName];
                    }

                    if(pageName in meiEditorSettings.whiteSpaceConversion) //delete from the whiteSpace -> original arr
                    {
                        delete meiEditorSettings.whiteSpaceConversion[pageName];
                    }

                    var orderedIndex = meiEditorSettings.orderedPageData.indexOf(pageName); //delete from the orderedPageData arr
                    if(orderedIndex !== -1)
                    {
                        delete meiEditorSettings.orderedPageData[orderedIndex];
                    }

                    $("#"+pageName).remove();

                    meiEditor.events.publish("PageWasDeleted", [pageName]); //let whoever is interested know
                }

                /*
                    Adds a page to the database
                    @param pageDataIn The result of a FileReader.readAsText operation containing the data from the MEI file.
                    @param fileNameIn The name of the file to be referenced in the database.
                */
                meiEditor.addPage = function(pageDataIn, fileNameIn)
                {
                    meiEditorSettings.pageData[fileNameIn] = new ace.EditSession(pageDataIn, "ace/mode/xml"); //add the file's data into a "pageData" array that will eventually feed into the ACE editor
                    meiEditorSettings.orderedPageData.push(fileNameIn); //keep track of the page orders to push the right highlights to the right pages
                };

                /*$('#fileInput').click(function(e)
                {
                    e.preventDefault(); //we don't want anything to happen here because this is supposed to be draggable and there's not much empty to space to drag.
                });*/

                //when a new file is uploaded; easier to write inline than separately because of the "this" references
                $('#fileInput').change(function(e)
                { 
                    var reader = new FileReader();
                    reader.file = this.files[0];

                    //when the file is loaded as text
                    reader.onload = function(e) 
                    { 
                        fileNameOriginal = this.file.name;
                        fileNameStripped = this.file.name.replace(/\W+/g, ""); //this one strips spaces/periods so that it can be used as a jQuery selector
                        meiEditor.addPage(this.result, fileNameOriginal); 
                        meiEditorSettings.whiteSpaceConversion[fileNameStripped] = fileNameOriginal;

                        $("#file-list").html($("#file-list").html() //add the file to the GUI
                            + "<div class='meiFile' id='" + fileNameStripped + "' pageTitleOrig='" + fileNameOriginal + "'>" + fileNameOriginal
                            + "<span class='meiFileButtons'>"
                            + "<button class='meiLoad' pageTitle='" + fileNameStripped + "' pageTitleOrig='" + fileNameOriginal + "'>Load</button>"
                            + "<button class='meiSave' pageTitle='" + fileNameStripped + "' pageTitleOrig='" + fileNameOriginal + "'>Save</button>"
                            + "<button class='meiRemove' pageTitle='" + fileNameStripped + "' pageTitleOrig='" + fileNameOriginal + "'>Remove from project</button>"
                            + "</span>"
                            + "</div>");

                        meiEditor.events.publish("NewFile", [this.result, fileNameStripped, fileNameOriginal])

                        var reapplyFileUploadButtonListeners = function(){
                            $(".meiLoad").on('click', function(e)
                            {
                                fileNameOriginal = $(e.target).attr('pageTitleOrig'); //grabs page title from custom attribute
                                meiEditor.changeActivePage(fileNameOriginal);
                            });

                            $(".meiSave").on('click', function(e)
                            {
                                fileNameOriginal = $(e.target).attr('pageTitleOrig'); //grabs page title from custom attribute
                                meiEditor.savePageToClient(fileNameOriginal); 
                            });

                            $(".meiRemove").on('click', function(e)
                            {
                                fileNameStripped = $(e.target).attr('pageTitle'); //grabs page title from custom attribute
                                fileNameOriginal = $(e.target).attr('pageTitleOrig'); //grabs page title from custom attribute
                                meiEditor.removePageFromProject(fileNameStripped, fileNameOriginal); 
                            });
                        }
                        reapplyFileUploadButtonListeners();   
                    };
                    reader.readAsText(this.files[0]);
                });

                //make the files re-orderable
                $("#file-list").sortable(
                    {
                        'forcePlaceholderSize': true, 
                    });
                $("#file-list").on("sortstart", function(e, ui)
                {
                    //there's gotta be a more graceful way to do this, but long story short, meiFile items sometimes have fractional widths, and jQueryUI forces them to whole digits and causes extra line breaks. this prevents that.
                    $(ui.item).width($(ui.item).width() + 1);
                    $(ui.placeholder).height($(ui.item).height());

                });
                //$("#file-list").disableSelection();
                $("#file-list").on("sortstop", function(e, ui) //when dragging a sortable item ends
                {
                    $(ui.item).width('auto');
                    /*
                        Reorders the MEI files in the data to reflect the GUI.
                        @param newOrder A list of the filenames in the desired order.
                    */
                    var reorderFiles = function(newOrder)
                    {
                        meiEditorSettings.orderedPageData = [];
                        var curPage = 0;
                        while(curPage < newOrder.length) //go through new order 
                        {
                            meiEditorSettings.orderedPageData.push(newOrder[curPage]); //push them into ordered array
                            curPage++;
                        }
                        meiEditor.events.publish("NewOrder", [newOrder]);
                    };
                    fileList = $("#file-list .meiFile"); //gets a list of all objects with the "meiFile" class
                    newOrder = [];
                    numberOfFiles = $("#file-list .meiFile").length;
                    for(curFileIndex = 0; curFileIndex < numberOfFiles; curFileIndex++)
                    {
                        newOrder.push($(fileList[curFileIndex]).attr('pageTitleOrig')); //creates an array with the new order
                    }
                    reorderFiles(newOrder);
                });
                return true;
            }
        }
        return retval;
    })());
})(jQuery);