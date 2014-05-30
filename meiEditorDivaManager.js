var meiEditorDivaManager = function()
{
    var retval = 
    {
        divName: "diva-manager",
        maximizedAppearance: '<div class="manager-sub-wrapper">'
            + 'Unlinked files:<br>'
            + '<div id="manager-file-list"></div>'
            + '</div>'
            + '<div class="manager-sub-wrapper" style="text-align:right;">'
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
                divaPageList: [],
                meiFilesToDivaImages: {},
            });

            meiEditor.events.subscribe("NewFile", function(fileData, fileNameStripped, fileNameOriginal){
                $("#manager-file-list").html($("#manager-file-list").html()
                    + "<div class='meiFileWrapper'>"
                    + "<div class='meiFile' pageTitle='" + fileNameStripped + "' id='unlinked-mei-" + fileNameStripped + "' style='display:inline-block;'>" + fileNameOriginal
                    + "<span class='linkRadioButtons'>"
                    + "<input type='radio' name='manager-files' strippedPage='" + fileNameStripped + "' value='" + fileNameOriginal + "'>"
                    + "</span>"
                    + "</div><br></div>");
            });

            $.ajax({
                url: meiEditorSettings.jsonFileLocation,
                cache: true,
                dataType: 'json',
                success: function (data, status, jqxhr)
                {
                    for(curPage in data.pgs){
                        fileNameOriginal = data.pgs[curPage].f;
                        fileNameStripped = fileNameOriginal.replace(/\W+/g, "");
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

            $("#link-files").on('click', function(){
                $("#diva-manager-error").html("");
                var selectedMEI = $('input[name=manager-files]:checked').val();
                var selectedImage = $('input[name=diva-images]:checked').val();
                var selectedStrippedMEI = $('input[name=manager-files]:checked').attr('strippedPage');
                var selectedStrippedImage = $('input[name=diva-images]:checked').attr('strippedPage');
                if(selectedMEI === undefined || selectedImage === undefined)
                {
                    $("#diva-manager-error").html("Please make sure that an MEI file and an image are selected.");
                    return;
                }
                meiEditorSettings.meiFilesToDivaImages[selectedImage] = selectedMEI;
                $("#unlinked-mei-"+selectedStrippedMEI).parent().css('display', 'none');
                $("#unlinked-diva-"+selectedStrippedImage).parent().css('display', 'none');
                $("#linked-file-list").html($("#linked-file-list").html()
                    + "<div class='linkedMeiWrapper'>"
                    + "<span class='meiFile' id='linked-" + selectedStrippedMEI + "'>" + selectedMEI + "</span>"
                    + "<span class='meiFile' id='linked-" + selectedStrippedImage + "'>" + selectedImage + "</span>"
                    + "<button class='unlink'>Unlink</button>"
                    + "</div>");
                $(".unlink").on('click', function()
                {
                    var numberOfChildren = $(this).parent().children("span").length;
                    while(numberOfChildren--)
                    {
                        curChild = $(this).parent().children("span")[numberOfChildren];
                        console.log(curChild);
                        var tempID = curChild.id.split("-")[1];
                        console.log(tempID);
                        $("#unlinked-mei-"+tempID).parent().css('display', 'inline-block');
                        $("#unlinked-diva-"+tempID).parent().css('display', 'inline-block');
                        $("#linked"+tempID).remove();
                    }
                    $(this).parent().remove()
                });
            });
        }
    }
    return retval;
}