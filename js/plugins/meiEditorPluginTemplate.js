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
                'First dropdown...': 'console.log("You clicked the first dropdown!");',
                'Second dropdown...': 'console.log("You clicked the second dropdown!");',
                //'Dropdown title': 'onclick for dropdown'. NOTE: double quotes must be used inside the onclick bit - the two given examples will work.
            },
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