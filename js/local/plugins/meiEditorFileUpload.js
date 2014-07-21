require(['meiEditor', window.meiEditorLocation + 'js/lib/FileSaver'], function(){
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            init: function(meiEditor, meiEditorSettings)
            {
                meiEditor.addToNavbar("File", "file-upload");
                $("#dropdown-file-upload").append("<li><a id='file-load-dropdown'>Open files...</a></li>");
                $("#dropdown-file-upload").append("<li><a id='file-save-dropdown'>Save a file...</a></li>");
                $("#help-dropdown").append("<li><a id='file-upload-help'>Files</a></li>");
                  
                $("#file-load-dropdown").on('click', function()
                {
                    $("#fileLoadModal").modal();
                });

                $("#file-save-dropdown").on('click', function()
                {
                    $("#fileSaveModal").modal();
                });

                $("#file-upload-help").on('click', function()
                {
                    $("#fileHelpModal").modal();
                });

                /*
                    Prompts local download of a page.
                    @param pageName The page to download.
                */
                var savePageToClient = function(pageName)
                {
                    formatToSave = function(lineIn, indexIn)
                    {          
                        if (lineIn !== "") //if the line's not blank (nothing in MEI should be)
                        {
                            formattedData[indexIn] = lineIn + "\n"; //add a newline - it doesn't use them otherwise. Last line will have a newline but this won't stack when pages are re-uploaded as this also removes blank lines.
                        }
                    };
                    
                    var formattedData = [];
                    var lastRow = meiEditorSettings.pageData[pageName].getSession().doc.getLength() - 1; //0-indexed

                    meiEditorSettings.pageData[pageName].getSession().doc.getLines(0, lastRow).forEach(formatToSave); //format each

                    var pageBlob = new Blob(formattedData, {type: "text/plain;charset=utf-8"}); //create a blob

                    saveAs(pageBlob, pageName); //download it! from FileSaver.js
                    $("#fileSaveModal-close").trigger('click');
                    meiEditor.localLog("Saved " + pageName + " to your computer.");
                };

                /*
                    Adds all currently selected pages of the fileLoadModal input to the database
                */
                var addPages = function()
                {
                    var readerArr = [];
                    var readerLength = $(".fileInput").length;

                    while (readerLength--)
                    {
                        var readerArrLength = readerArr.push(new FileReader()) - 1;
                        var reader = readerArr[readerArrLength];

                        if ($(".fileInput")[readerLength].files[0] !== undefined)
                        {
                            reader.file = $(".fileInput")[readerLength].files[0];

                            //when the file is loaded as text
                            reader.onload = function(e)
                            { 
                                fileName = this.file.name;

                                if (fileName in meiEditorSettings.pageData)
                                {
                                    meiEditor.localError("Error in adding " + fileName + ": a file with the same name is already in the project. Please change a file's name and try readding the file.");
                                    return;
                                }

                                meiEditor.addFileToProject(this.result, fileName);
                                meiEditor.localLog("Added " + fileName + " to project.");
                            };

                            reader.readAsText(reader.file);
                        }
                    }
                    //close the modal
                    $("#fileLoadModal-close").trigger('click');
                };

                /*
                    Adds a new fileInput object, removes the change event from all previously existing ones, and adds a new event listener to the newly created one.
                */
                var addNewFileInput = function()
                {
                    deactivateFakeInput();
                    var initialLength = $(".fileInput").length;

                    //if one already exists (any time other than page load, keep in mind this is being called AFTER the previous one changes)
                    if(initialLength > 0)
                    {
                        //grab the old file name
                        var oldVal = document.getElementById("fileInput" + (initialLength - 1)).value;
                        var fileName = oldVal.substring(oldVal.lastIndexOf("\\") + 1);

                        //put it on a span that is part of the fake wrapper
                        $("#fileName" + (initialLength - 1)).text(fileName);

                        //make only the bottom, newest one spawn a new one
                        $(".fileInput").unbind('change');

                        //but make it keep changing the name as necessary in case the user changes the file
                        $("#fileInput" + (initialLength - 1)).on('change', function(e)
                            {
                                var fileInputIndex = $(e.target).attr('id').split("fileInput")[1];
                                var oldVal = document.getElementById("fileInput" + (fileInputIndex)).value;
                                var fileName = oldVal.substring(oldVal.lastIndexOf("\\") + 1);
                                $("#fileName" + (fileInputIndex)).text(fileName);
                            });
                    }

                    //append a fake object on top of a real one with opacity=0
                    $("#newFiles").append("<div class='fileInputFake' id='fakeWrapper" + initialLength + "'>" +
                            "<button>Select a file...</button>" +
                            "<span id='fileName" + initialLength + "'>No file chosen.</span>" +
                        "</div>" +
                        "<input type='file' class='fileInput' id='fileInput" + initialLength + "'>");
                    $("#fakeWrapper" + initialLength).offset({'top': $("#fileInput" + initialLength).offset().top});

                    //make this happen again when the new one changes
                    $("#fileInput" + initialLength).on('change', addNewFileInput);

                    //on mousedown, make the fake one seem like it's being clicked
                    $(".fileInput").on('mousedown', function(e){
                        var idNumber = e.target.id.split("fileInput")[1];
                        $("#fakeWrapper" + idNumber).addClass('fileInputFakeActive');
                        $(document).on('mouseup', deactivateFakeInput);
                    });

                    //change this to plural
                    if(initialLength == 1)
                    {
                        $("#fileLoadModal-primary").text('Open files');
                    }
                };

                //turns off the fake input press class
                var deactivateFakeInput = function()
                {
                    $(".fileInputFake").removeClass('fileInputFakeActive');
                    $(document).unbind('mouseup', deactivateFakeInput);
                };

                createModal(meiEditorSettings.element, 'fileLoadModal', false, '<h4>Open files:</h4>' +
                    '<div id="newFiles">' +
                    '</div>', "Open file");

                addNewFileInput();

                createModal(meiEditorSettings.element, 'fileSaveModal', true, '<h4>Save a file:</h4>' +
                    createSelect("Save", meiEditorSettings.pageData), "Save file");

                createModal(meiEditorSettings.element, 'fileHelpModal', false, '<h4>Help for "Files" menu:</h4>' +
                    '<li>The "Open files..." option will let you load files into the project as new tabs in the editor. You can only select one file per input, but more spaces for uploading files will appear as you use existing ones.</li>' +
                    '<li>The "Save file..." option will let you save a file that you have edited locally. It will save to the folder your browser automatically points to (likely your local Downloads folder).</li>');

                $("#fileLoadModal-primary").on('click', addPages);

                $("#fileSaveModal-primary").on('click', function()
                {
                        savePageToClient($("#selectSave").find(":selected").text());
                });

                meiEditor.events.subscribe("NewFile", function(a, fileName)
                {
                    $("#selectSave").append("<option name='" + fileName + "'>" + fileName + "</option>");
                });

                $("#fileLoadModal-close").on('click', function()
                {
                    $(".fileInput").remove();
                    $(".fileInputFake").remove();
                    addNewFileInput();
                });

                return true;
            }
        };
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});