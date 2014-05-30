var meiEditorDivaManager = function()
{
    var retval = 
    {
        divName: "diva-manager",
        maximizedAppearance: '<div style="width:50%;display:inline-block;">'
            + 'Loaded files:<br>'
            + '<div id="manager-file-list">Testing</div>'
            + '</div>'
            + '<div style="width:50%;display:inline-block;">'
            + 'Files in Diva:<br>'
            + '<div id="diva-file-list">Testy</div>'
            + '</div>',
        minimizedTitle: 'Diva page manager:',
        minimizedAppearance: '',
        _init: function(meiEditor, meiEditorSettings)
        {

            meiEditor.newFunction = function()
            {
                thisFunctionIsOnlyLocal();
            }

            meiEditorSettings.newSetting = true;
        }
    }
    return retval;
}