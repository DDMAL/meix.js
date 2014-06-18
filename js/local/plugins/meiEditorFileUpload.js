require(['meiEditor', window.meiEditorLocation + 'js/lib/FileSaver'], function(){
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            divName: "file-upload",
            title: 'Files',
            dropdownOptions: 
            {
                'Open files...': 'file-load-dropdown',
                'Save a file...': 'file-save-dropdown',
            },
            init: function(meiEditor, meiEditorSettings)
            {
                $("#file-load-dropdown").on('click', function(){
                    $("#fileLoadModal").modal();
                });
                $("#file-save-dropdown").on('click', function(){
                    $("#fileSaveModal").modal();
                });
                $("#file-upload-help").on('click', function(){
                    $("#fileHelpModal").modal();
                })
                
                /*
                    Prompts local download of a page.
                    @param pageName The page to download.
                */
                var savePageToClient = function(pageName)
                {
                    formatToSave = function(lineIn, indexIn)
                    {          
                        if(lineIn !== "") //if the line's not blank (nothing in MEI should be)
                        {
                            formattedData[indexIn] = lineIn + "\n"; //add a newline - it doesn't use them otherwise. Last line will have a newline but this won't stack when pages are re-uploaded as this also removes blank lines.
                        }
                    }
                    
                    var formattedData = [];
                    var lastRow = meiEditorSettings.pageData[pageName].getSession().doc.getLength() - 1; //0-indexed
                    meiEditorSettings.pageData[pageName].getSession().doc.getLines(0, lastRow).forEach(formatToSave); //format each
                    var pageBlob = new Blob(formattedData, {type: "text/plain;charset=utf-8"}); //create a blob
                    saveAs(pageBlob, pageName); //download it! from FileSaver.js
                    $("#fileSaveModal-close").trigger('click');
                };

                /*
                    Adds the currently selected page of the fileLoadModal input to the database
                */
                var addPage = function()
                {
                    var readerArr = [];
                    var readerLength = $(".fileInput").length;
                    while(readerLength--)
                    {
                        var readerArrLength = readerArr.push(new FileReader()) - 1;
                        var reader = readerArr[readerArrLength];
                        if($(".fileInput")[readerLength].files[0] !== undefined)
                        {
                            reader.file = $(".fileInput")[readerLength].files[0];

                            //when the file is loaded as text
                            reader.onload = function(e) 
                            { 
                                fileName = this.file.name;
                                if(fileName in meiEditorSettings.pageData)
                                {
                                    meiEditor.localLog("File name already in database. Please change a file's name and try reloading the file.");
                                    return;
                                }

                                meiEditor.addFileToGUI(this.result, fileName)
                            };
                            reader.readAsText(reader.file);
                        }
                    }
                    //close the modal
                    $("#fileLoadModal-close").trigger('click');
                };

                createModal(meiEditorSettings.element, 'fileLoadModal', true, '<h4>Open files:</h4>'
                    + '<div id="newFiles">'
                    + '<input type="file" class="fileInput" id="fileInput">'
                    + '</div>', "Open file");
                createModal(meiEditorSettings.element, 'fileSaveModal', true, '<h4>Save a file:</h4>'
                    + createSelect("Save", meiEditorSettings.pageData), "Save file");
                createModal(meiEditorSettings.element, 'fileHelpModal', false, '<h4>Help for "Files" menu:</h4>'
                    + '<li>The "Open files..." option will let you load files into the project as new tabs in the editor. You can only select one file per input, but more spaces for uploading files will appear as you use existing ones.</li>'
                    + '<li>The "Save file..." option will let you save a file that you have edited locally. It will save to the folder your browser automatically points to (likely your local Downloads folder).</li>');
                $("#fileLoadModal-primary").on('click', addPage);
                $("#fileSaveModal-primary").on('click', function()
                    {
                        savePageToClient($("#selectSave").find(":selected").text());
                    });

                meiEditor.events.subscribe("NewFile", function(a, fileName)
                {
                    $("#selectSave").append("<option name='" + fileName + "'>" + fileName + "</option>");
                });

                //this is necessary as we need to apply the listener to the new input item
                $(".fileInput").on('change', function(){
                    $("#newFiles").append("<input type='file' class='fileInput' id='fileInput" + $(".fileInput").length + "'>");
                    $(".fileInput").on('change', function(){
                        $("#newFiles").append("<input type='file' class='fileInput' id='fileInput" + $(".fileInput").length + "'>");
                    });
                });
                return true;
            }
        }
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});