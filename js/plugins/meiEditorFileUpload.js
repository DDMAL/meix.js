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
                'Upload files...': 'file-load-dropdown',
                'Save a file...': 'file-save-dropdown',
            },
            minimizedAppearance: '',
            init: function(meiEditor, meiEditorSettings)
            {
                $("#file-load-dropdown").on('click', function(){
                    $("#fileLoadModal").modal();
                });
                $("#file-save-dropdown").on('click', function(){
                    $("#fileSaveModal").modal();
                });

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

                meiEditor.createModal('fileLoadModal', true, '<div id="newFiles">'
                + '<input type="file" class="fileInput" id="fileInput">'
                + '</div>', "Load file");
                meiEditor.createModal('fileSaveModal', true, meiEditor.createSelect("Save", meiEditorSettings.pageData), "Save file");
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
            }
        }
        return retval;
    })());
})(jQuery);