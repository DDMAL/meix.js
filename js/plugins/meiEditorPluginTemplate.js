//add a new plugin to the AceMeiEditor constructor in the main HTML page.
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            divName: "name-of-the-div",
            maximizedAppearance: '<div>This HTML is what will show up when this plugin is maximized.</div>',
            minimizedTitle: 'This string will show up when the plugin is minimized',
            minimizedAppearance: '<div>This HTML is what will show up on the taskbar in addition to the title when the plugin is minimized.</div>', //can be empty
            init: function(meiEditor, meiEditorSettings)
            {
                $.extend(meiEditorSettings, {
                    newSettings: 'newVal',
                });

                var thisFunctionIsOnlyLocal = function()
                {

                }

                meiEditor.newFunction = function()
                {
                    thisFunctionIsOnlyLocal();
                }
                return true;
            }
        }
        return retval;
    })());
})(jQuery);