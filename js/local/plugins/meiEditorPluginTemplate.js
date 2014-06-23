/*

This line is require.js syntax - the first parameter is an array of prerequistes
for this class. External links are acceptable, as are local links. The first 
object, 'meiEditor', refers to a path defined in meiEditorPreloader.js and 
should be left in to make sure that the AceMeiEditor class exists; delete 
'link/to/other/includes' and add your own.

NOTE: Do not include the ".js" extension. require.js automatically appends 
it.

*/
require(['meiEditor', 'link/to/other/includes'], function(){

/*

This function is called automatically when this JavaScript file is included.
Each plugin is automatically appended to window.meiEditorPlugins, an array that 
is traversed in the AceMeiEditor class definition. Pushing a function and 
returning a large json object with specific parameters treats will eventually 
extend the AceMeiEditor class. 

*/
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            init: function(meiEditor, meiEditorSettings)
            {
/*

If there are settings required for your plugin, the logic is your responsibility
to implement. These can be checked for in the meiEditorSettings object.

*/
                if (!("requiredSettingOne" in meiEditorSettings) && !("requiredSettingTwo" in meiEditorSettings))
                {
                    console.error("MEI Editor error: The 'My Plugin' plugin requires either the 'requiredSettingOne' or 'requiredSettingTwo' settings present on intialization.");
                    return false;
                }

/*

Any interactions that need to be done with plugins should be included as a 
Bootstrap navbar menu. A built-in function, meiEditor.addToNavbar, takes two
parameters. The first is the title to show on the nav-bar, the second is a 
string that gets appended to the word "dropdown" to make the dropdown box ID. To
add options to the dropdown, include an anchor tag within a list item tag; 
Bootstrap will automatically format this correctly. You may add on-click 
listeners/hrefs as you wish; the default plugins come with on-click listeners.

To add a help option, append the same structure to the "#help-dropdown"
selector.

*/

                meiEditor.addToNavbar("My Plugin", "my-plugin");
                $("#dropdown-my-plugin").append("<li><a id='first-dropdown'>" + nameForThisOption + "</a></li>");
                $("#help-dropdown").append("<li><a id='" + idForThisHelpOption + "-help'>" + nameForThisPlugin + "</a></li>");
                  
/*

An example of how to chain events off the dropdown/navbar objects.

*/

                $("#first-dropdown").on('click', function()
                {
                    //...
                });

/*

An example of a streamlined way to spawn a modal off a dropdown/navbar object.
The utils.js file contains a function, createModal, to build a Bootstrap modal
automatically and avoid adding ~15 lines of HTML manually. The parameters are:

-A jQuery selector for the element(s) to attach it to (the parent element is fine)
-The id for the modal so it can be displayed (see below)
-A boolean value where true spawns a small modal and false spawns a larger modal
-The body of the modal, in plain text or html.
-The primary button (rightmost and usually coloured) of the modal.

*/

                createModal(meiEditorSettings.element, 'idForTheModal', smallModal, 'Body of the modal', 'Primary Button On Modal');

/*

To spawn the modal, use the builtin Bootstrap function and call .modal() on its
selector (the first parameter of the function above). 

*/
                $("#first-dropdown").on('click', function()
                {
                    $("#idForTheModal").modal();
                });

/*

/*

The icon pane on each open file can be extended using 
meiEditorSettings.iconPane, an array composed of JSON objects. The key for each 
object will be used as the class for all icons on the page; you can access the
page name using jQuery's .parent() function; see meiEditor.js for an example of 
how this function is used. The object properties are as follows:
-title: Title-text shown when the user hovers over the image
-src: The background image for the icon span. Glyphicons work fine.
-click: A function to be applied as a jQuery event listener when the icon is
    clicked on.

If you use this, leave the $.extend(iconPane, localIcons) call in immediately 
after. Extending the iconPane is optional and occurs in the plugin class rather
than the main file.

*/
                var localIcons = {
                    "className": {
                        'title': 'What shows on hover',
                        'src': 'img/backgroundImageSource.png',
                        'click': function(e){
                            whatHappensWhenYouClickTheIcon();
                        }
                    },
                    "class2name": null //...
                };

                $.extend(meiEditorSettings.iconPane, localIcons);

/*

To add settings to the meiEditorSettings object, use jQuery.extend as well.

*/

                $.extend(meiEditorSettings, {
                    newSettings: 'newVal',
                });

/*

meix.js comes with a custom undo manager library with four functions of note.
Calling undoManager.undo() or undoManager.redo() will navigate through the stack
and pop the newest action. undoManager.save() takes two parameters, the unique
identifier for what type of event it is (discussed shortly), and the parameters
for said event. undoManager.newAction() takes up to three parameters:
-Unique identifier
-A function that is called when "undo" is called on this specific type. The 
    current state (top item on the undo stack) of the document is appended 
    as the final parameter to be accessed if needed. 
-A function that is called when "redo" is called on this specific type. Same as 
    above, but is optional. If this is not provided, the function for "undo" is
    called. 

This library is still under development, and an example of its use can be found 
by the PageEdited undo type in meiEditor.js. The function for "undo" and "redo" 
is the same as, regardless, only the text of documents/active document/cursor
positions are changed. The current states of all three are passed in as 
parameters for the "PageEdited" action; the function uses these to replace 
the current state of the GUI.

*/

                meiEditorSettings.undoManager.newAction("TypeOfUndo", function(params){});

/*

meix.js also comes with an events library. This library has three functions,
publish, subscribe, and unsubscribe. Documentation for this is available in 
the meiEditor.js file.

*/
                meiEditor.events.publish("NewEvent", [params]);
                meiEditor.events.subscribe("ThisEventExists", function(params){});

/*

Finally, meix.js comes with a console interface. To write to this console, use 
one of four functions - meiEditor.localLog, .localWarn, .localError, or 
.localMessage. The first three will make the console flash green, yellow, and 
red, respectively; the fourth will not change color. Also keep in mind that, 
unlike console.log, these only takes one parameter - make sure to manually 
concatenate strings into one string before or while calling them.

*/
                meiEditor.localLog("Text!");
                meiEditor.localWarn("Text!");
                meiEditor.localError("Text!");
                meiEditor.localMessage("Text!");

/*

Functions can be created either as locally accessible or accessible from the API
by appending them as properties of the meiEditor object.

*/

                var thisFunctionIsOnlyLocal = function()
                {

                };

                meiEditor.newFunction = function()
                {

                };

/*

If init() does not return true, the plugin is considered to be disabled and 
anything that was added is immediately removed.

*/

                return true;
            }
        };

/*

Everything below this line is needed to make sure every plugin acts the same way
and is added into the DOM correctly.

*/
        return retval;
    })());

    window.pluginLoader.pluginLoaded();

})(jQuery);

});