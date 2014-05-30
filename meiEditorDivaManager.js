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
                    + "<div class='meiFile' pageTitle='" + fileNameStripped + "' id='unlinked-mei-" + fileNameStripped + "'>" + fileNameOriginal
                    + "<span class='meiFileButtons'>"
                    + "<input type='radio' name='manager-files' strippedPage='" + fileNameStripped + "' value='" + fileNameStripped + "'>"
                    + "</span>"
                    + "</div>");
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
                            + "<div class='meiFile' pageTitle='" + fileNameOriginal + "' id='unlinked-diva-" + fileNameStripped + "'>" 
                            + "<span class='meiFileButtons' style='float:left;'>"
                            + "<input type='radio' name='diva-images' strippedPage='" + fileNameStripped + "' value='" + fileNameOriginal + "'>"
                            + "</span>"
                            + fileNameOriginal
                            + "</div>");
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
                $("#unlinked-mei-"+selectedStrippedMEI).remove();
                $("#unlinked-diva-"+selectedStrippedImage).remove();
            });
        }
    }
    return retval;
}