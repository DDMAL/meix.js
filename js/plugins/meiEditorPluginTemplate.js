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
                var localIcons = {
                    "className": {
                        'title': 'What shows on hover',
                        'src': 'img/backgroundImageSource',
                        'click': function(e){
                            whatHappensWhenYouClickTheIcon();
                        }
                    },
                    "class2name": //...
                };

                $.extend(meiEditorSettings.iconPane, localIcons);

                $.extend(meiEditorSettings, {
                    newSettings: 'newVal',
                });

                $("#first-dropdown").on('click', function()
                {
                    //...
                });

                $("#second-dropdown").on('click', function()
                {
                    $("#idForTheModal").modal();
                });

                meiEditor.createModal('idForTheModal', (iWantTheModalToBeSmall ? true : false), 'Body of the modal', 'Primary Button On Modal');


                var thisFunctionIsOnlyLocal = function()
                {

                }

                meiEditor.newFunction = function()
                {

                }
                return true;
            }
        }
        return retval;
    })());
})(jQuery);