//add a new meiEditorGenericPlugin() (or the name of yours) to the AceMeiEditor constructor in the main HTML page.
var meiEditorGenericPlugin = function()
{
    var retval = 
    {
        divName: "name-of-the-div",
        maximizedAppearance: '<div>This HTML is what will show up when this plugin is maximized.</div>',
        minimizedTitle: 'This string will show up when the plugin is minimized',
        minimizedAppearance: '<div>This HTML is what will show up on the taskbar in addition to the title when the plugin is minimized.</div>', //can be empty
        _init: function(meiEditor, meiEditorSettings)
        {
            var thisFunctionIsOnlyLocal = function()
            {

            }

            meiEditor.newFunction = function()
            {
                thisFunctionIsOnlyLocal();
            }

            meiEditorSettings.newSetting = true;
        }
    }
    return retval;
}