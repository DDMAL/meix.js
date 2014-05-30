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
            + '<div id="linked-file-header">Linked files:</div>'
            + '<div id="linked-file-list"></div>'
            + '<button id="linkFiles">Link files</button>',
        minimizedTitle: 'Diva page manager:',
        minimizedAppearance: '',
        _init: function(meiEditor, meiEditorSettings)
        {
            $.extend(meiEditorSettings, {
                divaPageList: [],
            });

            meiEditor.newFunction = function()
            {
                thisFunctionIsOnlyLocal();
            }
            meiEditor.events.subscribe("NewFile", function(fileData, fileName, fileNameOriginal){
                $("#manager-file-list").html($("#manager-file-list").html()
                    + "<div class='meiFile' pageTitle='" + fileName + "' id='validate-" + fileName + "'>" + fileNameOriginal
                    + "<span class='meiFileButtons'>"
                    + "<input type='radio' name='manager-files' value='" + fileName + "'>"
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
                        curPageFileName = data.pgs[curPage].f;
                        fileNameStripped = curPageFileName.replace(/\W+/g, "");
                        meiEditorSettings.divaPageList.push(curPageFileName);
                        $("#diva-file-list").html($("#diva-file-list").html()
                            + "<div class='meiFile' pageTitle='" + fileNameStripped + "' id='validate-" + fileNameStripped + "'>" 
                            + "<span class='meiFileButtons' style='float:left;'>"
                            + "<input type='radio' name='manager-files' value='" + fileNameStripped + "'>"
                            + "</span>"
                            + curPageFileName
                            + "</div>");
                    }
                }
            });
        }
    }
    return retval;
}