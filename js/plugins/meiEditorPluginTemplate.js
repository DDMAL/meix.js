//add a new plugin to the AceMeiEditor constructor in the main HTML page.
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            divName: "xml-validator", //id for the dropdown div
            title: "Validator", //text for the dropdown div
            dropdownOptions: 
            {
                'First dropdown...': 'first-dropdown',
                'Second dropdown...': 'second-dropdown',
                //'Dropdown title': 'id for dropdown'
            },
            init: function(meiEditor, meiEditorSettings)
            {
                $.extend(meiEditorSettings, {
                    newSettings: 'newVal',
                });

                $("#first-dropdown").on('click', function(){
                    //...
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