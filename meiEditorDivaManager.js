var meiEditorDivaManager = function()
{
    var retval = 
    {
        divName: "diva-manager",
        maximizedAppearance: '<div class="manager-sub-wrapper">'
            + 'Unlinked files:<br>'
            + '<div id="manager-file-list"></div>'
            + '</div>'
            + '<div class="manager-sub-wrapper" style="text-align:right;">' //helps keep height/width standard
            + 'Unlinked files in Diva:<br>'
            + '<div id="diva-file-list"></div>'
            + '</div>'
            + '<div id="diva-manager-button-container"><button id="link-files">Link selected files</button><div id="diva-manager-error"></div></div>'
            + '<div id="linked-file-header">Linked files:</div>'
            + '<div id="linked-file-list"></div>',
        minimizedTitle: 'Diva page manager:',
        minimizedAppearance: '',
        _init: function(meiEditor, meiEditorSettings)
        {
            $.extend(meiEditorSettings, {
                divaPageList: [], //list of active pages in Diva
                divaImagesToMeiFiles: {}, //keeps track of linked files
            });

            meiEditor.events.subscribe("NewFile", function(fileData, fileNameStripped, fileNameOriginal)
            {
                $("#manager-file-list").html($("#manager-file-list").html() //create a new file div
                    + "<div class='meiFileWrapper'>" //needed because of the line break to separate them. I LOVE CSS.
                    + "<div class='meiFile' pageTitle='" + fileNameStripped + "' id='unlinked-mei-" + fileNameStripped + "' style='display:inline-block;'>" + fileNameOriginal
                    + "<span class='linkRadioButtons'>"
                    + "<input type='radio' name='manager-files' strippedPage='" + fileNameStripped + "' value='" + fileNameOriginal + "'>"
                    + "</span>"
                    + "</div><br></div>");
            });

            $.ajax( //this grabs the json file to get another list of the image filepaths
            {
                url: meiEditorSettings.jsonFileLocation,
                cache: true,
                dataType: 'json',
                success: function (data, status, jqxhr)
                {
                    for(curPage in data.pgs){
                        fileNameOriginal = data.pgs[curPage].f; //original file name
                        fileNameStripped = fileNameOriginal.replace(/\W+/g, ""); //used for jQuery selectors as they can't handle periods easily
                        meiEditorSettings.divaPageList.push(fileNameOriginal);
                        $("#diva-file-list").html($("#diva-file-list").html()
                            + "<div class='meiFileWrapper'>"
                            + "<div class='meiFile' pageTitle='" + fileNameOriginal + "' id='unlinked-diva-" + fileNameStripped + "' style='display:inline-block;'>" 
                            + "<span class='linkRadioButtons' style='float:left;'>"
                            + "<input type='radio' name='diva-images' strippedPage='" + fileNameStripped + "' value='" + fileNameOriginal + "'>"
                            + "</span>"
                            + fileNameOriginal
                            + "</div><br></div>");
                    }
                }
            });

            //when the page changes, make the editor reflect that
            Events.subscribe("VisiblePageDidChange", function(pageNumber, fileName)
            {
                console.log(fileName, meiEditorSettings.divaImagesToMeiFiles);

                if(fileName in meiEditorSettings.divaImagesToMeiFiles)
                {
                    activeFileName = meiEditorSettings.divaImagesToMeiFiles[fileName];
                    console.log(meiEditorSettings.whiteSpaceConversion[activeFileName]);
                    //meiEditor.changeActivePage(meiEditorSettings.whiteSpaceConversion[activeFileName]);
                }
                //gets the extension length
                var fileExtLength = fileName.split(".")[1].length + 1;

                //whiteSpaceConversion is ([white space removed] = with periods/hyphens/spaces)
                for(curKeyIndex in meiEditorSettings.whiteSpaceConversion)
                {
                    //I hate JSON a bit
                    curKey = meiEditorSettings.whiteSpaceConversion[curKeyIndex];
                    //if the two filenames are equal
                    if(fileName.slice(0, -(fileExtLength)) == curKey.slice(0, -4))
                    {
                        //change pages and we found it so break
                        console.log(curKeyIndex);
                        meiEditor.changeActivePage(curKeyIndex);
                        break;
                    }
                }
            });

            //when "Link selected files" is clicked
            $("#link-files").on('click', function(){
                //empty the error if necessary
                $("#diva-manager-error").html("");

                //grab the IDs/stripped IDs of the linked files
                var selectedMEI = $('input[name=manager-files]:checked').val();
                var selectedImage = $('input[name=diva-images]:checked').val();
                var selectedStrippedMEI = $('input[name=manager-files]:checked').attr('strippedPage');
                var selectedStrippedImage = $('input[name=diva-images]:checked').attr('strippedPage');

                //if there's not 2 selected files, throw an error
                if(selectedMEI === undefined || selectedImage === undefined)
                {
                    $("#diva-manager-error").html("Please make sure that an MEI file and an image are selected.");
                    return;
                }

                //make the link
                meiEditorSettings.divaImagesToMeiFiles[selectedImage] = selectedMEI;

                //hide the linked items (in case they're unlinked later)
                $("#unlinked-mei-"+selectedStrippedMEI).parent().css('display', 'none');
                $("#unlinked-diva-"+selectedStrippedImage).parent().css('display', 'none');

                //add a linked file line
                $("#linked-file-list").html($("#linked-file-list").html()
                    + "<div class='linkedMeiWrapper'>"
                    + "<span class='meiFile' id='linked-" + selectedStrippedMEI + "'>" + selectedMEI + "</span>"
                    + "<span class='meiFile' id='linked-" + selectedStrippedImage + "'>" + selectedImage + "</span>"
                    + "<button class='unlink'>Unlink</button>"
                    + "</div>");

                //when they want to unlink them
                $(".unlink").on('click', function()
                {
                    //easier to do this than "2" - this is the two .meiFile span objects
                    var numberOfChildren = $(this).parent().children("span").length;
                    while(numberOfChildren--)
                    {
                        curChild = $(this).parent().children("span")[numberOfChildren];
                        var tempID = curChild.id.split("-")[1]; //get the suffix that corresponds to the page filename

                        //show the unlinked objects again
                        $("#unlinked-mei-"+tempID).parent().css('display', 'inline-block');
                        $("#unlinked-diva-"+tempID).parent().css('display', 'inline-block');
                    }
                    //remove the linked object because we'll just make a new one if needed.
                    $(this).parent().remove()
                });
            });
        }
    }
    return retval;
}