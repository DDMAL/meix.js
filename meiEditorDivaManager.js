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
            + '<div id="diva-manager-button-container">'
            + '<button id="link-files">Link selected files</button>'
            + '<button id="auto-link-files">Automatically link by filename</button>'
            + '<div id="diva-manager-error"></div>'
            + '</div>'
            + '<div id="linked-file-header">Linked files:</div>'
            + '<div id="linked-file-list"></div>'
            + '<button id="updateDiva">Update highlights</button>',
        minimizedTitle: 'Diva page manager:',
        minimizedAppearance: '',
        _init: function(meiEditor, meiEditorSettings)
        {
            $.extend(meiEditorSettings, {
                divaPageList: [], //list of active pages in Diva
                divaImagesToMeiFiles: {}, //keeps track of linked files
            });

            /*
                Creates highlights based on the ACE documents.
            */
            meiEditor.createHighlights = function()
            {      

                /*
                    Function called when sections are rehighlighted to refresh the listeners.
                */
                var reapplyHoverListener = function()
                {
                    $(".overlay-box").hover(function(e) //when the hover starts for an overlay-box
                    {
                        currentTarget = e.target.id;

                        $("#hover-div").html(meiEditorSettings.neumeObjects[currentTarget]+"<br>Click to find in document.");
                        $("#hover-div").css(//create a div with the name of the hovered neume
                        {
                            'height': 'auto',
                            'top': e.pageY - 10,
                            'left': e.pageX + 10,
                            'padding-left': '10px',
                            'padding-right': '10px',
                            'border': 'thin black solid',
                            'background': '#FFFFFF',
                            'display': 'block',
                            'vertical-align': 'middle',
                        });
                        //change the color of the hovered div
                        $("#"+currentTarget).css('background-color', 'rgba(255, 255, 255, 0.05)');

                        $(document).on('mousemove', function(e) //have it follow the mouse
                        {
                            $("#hover-div").offset(
                            {
                                'top': e.pageY - 10,
                                'left': e.pageX + 10,
                            });
                        });
                    }, function(e){
                        currentTarget = e.target.id;
                        $(document).unbind('mousemove'); //stops moving the div
                        $("#hover-div").css('display', 'none'); //hides the div
                        $("#hover-div").html("");

                        $("#"+currentTarget).css('background-color', 'rgba(255, 0, 0, 0.2)'); //color is normal again
                    });
                    $(".overlay-box").click(function(e)
                    {
                        testSearch = meiEditorSettings.editor.find(e.target.id, 
                        {
                            wrap: true,
                            range: null,
                        });
                    });
                };

                var x2js = new X2JS(); //from xml2json.js
                meiEditorSettings.dv.resetHighlights();
                for(curKey in meiEditorSettings.divaImagesToMeiFiles)
                { //for each page
                    var pageName = meiEditorSettings.divaImagesToMeiFiles[curKey];
                    pageIndex = meiEditorSettings.divaPageList.indexOf(curKey);
                    pageText = meiEditorSettings.pageData[pageName].doc.getAllLines().join("\n"); //get the information from the page expressed in one string
                    jsonData = x2js.xml_str2json(pageText); //turn this into a JSON "dict"
                    regions = [];

                    xmlns = jsonData['mei']['_xmlns'] //find the xml namespace file
                    var neume_ulx, neume_uly, neume_width, neume_height;
                    neumeArray = jsonData['mei']['music']['body']['neume'];
                    facsArray = jsonData['mei']['music']['facsimile']['surface']['zone'];
                    for (curZoneIndex in facsArray) //for each "zone" object
                    { 
                        curZone = facsArray[curZoneIndex];
                        neumeID = curZone._neume;
                        for (curNeumeIndex in neumeArray) //find the corresponding neume - don't think there's a more elegant way in JS
                        { 
                            if (neumeArray[curNeumeIndex]["_xml:id"] == neumeID)
                            {
                                curNeume = neumeArray[curNeumeIndex]; //assemble the info on the neume
                                meiEditorSettings.neumeObjects[neumeID] = curNeume['_name']
                                neume_ulx = curZone._ulx;
                                neume_uly = curZone._uly;
                                neume_width = curZone._lrx - neume_ulx;
                                neume_height = curZone._lry - neume_uly;
                                break;
                            }
                        }
                        //add it to regions
                        regions.push({'width': neume_width, 'height': neume_height, 'ulx': neume_ulx, 'uly': neume_uly, 'divID': neumeID});
                    }
                    //at the end of each page, call the highlights
                    meiEditorSettings.dv.highlightOnPage(pageIndex, regions, undefined, "overlay-box", reapplyHoverListener);
                }
            };

            /* 
                Function that links an mei file to a diva image.
                @param selectedMEI The MEI page to link
                @param selectedImage The image to link.
            */
            
            meiEditor.linkMeiToDiva = function(selectedMEI, selectedImage)
            {
                var selectedStrippedMEI = selectedMEI.replace(/\W+/g, "");
                var selectedStrippedImage = selectedImage.replace(/\W+/g, "");

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
            }


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
                //if they're linked, change them
                if(fileName in meiEditorSettings.divaImagesToMeiFiles)
                {
                    activeFileName = meiEditorSettings.divaImagesToMeiFiles[fileName];
                    meiEditor.changeActivePage(activeFileName);
                }
            });

            $("#updateDiva").on('click', meiEditor.createHighlights);

            //when "Link selected files" is clicked
            $("#link-files").on('click', function(){
                //empty the error if necessary
                $("#diva-manager-error").html("");

                //grab the IDs/stripped IDs of the linked files
                var selectedMEI = $('input[name=manager-files]:checked').val();
                var selectedImage = $('input[name=diva-images]:checked').val();

                //if there's not 2 selected files, throw an error
                if(selectedMEI === undefined || selectedImage === undefined)
                {
                    $("#diva-manager-error").html("Please make sure that an MEI file and an image are selected.");
                    return;
                }

                meiEditor.linkMeiToDiva(selectedMEI, selectedImage);
            });

            //automatically links files
            $("#auto-link-files").on('click', function()
            {
                //for each ordered page
                for(curMeiIndex in meiEditorSettings.orderedPageData)
                {
                    //get the extension
                    var curMei = meiEditorSettings.orderedPageData[curMeiIndex];
                    var meiExtLength = curMei.split(".")[1].length + 1;

                    //for each diva image
                    for(curDivaIndex in meiEditorSettings.divaPageList)
                    {
                        //same
                        var curDivaFile = meiEditorSettings.divaPageList[curDivaIndex];
                        var divaExtLength = curDivaFile.split(".")[1].length + 1;

                        //if the two filenames are equal
                        if(curMei.slice(0, -(meiExtLength)) == curDivaFile.slice(0, -(divaExtLength)))
                        {
                            //link 'em, and we found it so break
                            meiEditor.linkMeiToDiva(curMei, curDivaFile);
                            break;
                        }
                    }
                }
            });
        }
    }
    return retval;
}