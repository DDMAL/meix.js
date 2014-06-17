require(['meiEditor', window.meiEditorLocation + 'js/lib/UndoStack'], function(){
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            divName: "edit-pane", 
            title: "Edit", //text for the dropdown div, required
            dropdownOptions: //the <li> objects present when the dropdown is clicked
            {
                'Undo': 'undo-dropdown',
                'Redo': 'redo-dropdown',
                //'Dropdown title': 'id for dropdown'
            },
            init: function(meiEditor, meiEditorSettings)
            {
                $.extend(meiEditorSettings, {
                    newSettings: 'newVal',
                });

                $("#undo-dropdown").on('click', function()
                {
                    var retVal = meiEditorSettings.undoManager.undo();
                    if(!retVal)
                    {
                        meiEditor.localLog("Nothing to undo.");
                    }
                });

                $("#redo-dropdown").on('click', function()
                {
                    var retVal = meiEditorSettings.undoManager.redo();
                    if(!retVal)
                    {
                        meiEditor.localLog("Nothing to redo.");
                    }
                });

                return true;
            }
        }
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});