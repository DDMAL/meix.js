require(['meiEditor', window.meiEditorLocation + 'js/lib/UndoStack.js'], function(){
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            init: function(meiEditor, meiEditorSettings)
            {
                var globals = {
                    undoManager: new UndoStack(), //ref to the UndoStack object
                    initCursor: "",         //initial point for the cursor when restoring undos
                    initDoc: "",            //initial document when restoring undos
                    editTimeout: ""         //timeout object to stop edit compilation
                };

                $.extend(meiEditorSettings, globals);

                meiEditor.addToNavbar("Edit", "edit-pane");
                $("#dropdown-edit-pane").append("<li><a id='undo-dropdown'>Undo</a></li>");
                $("#dropdown-edit-pane").append("<li><a id='redo-dropdown'>Redo</a></li>");
                $("#dropdown-edit-pane").append("<li><a id='find-dropdown'>Find...</a></li>");
                $("#dropdown-edit-pane").append("<li><a id='replace-dropdown'>Replace...</a></li>");
                $("#help-dropdown").append("<li><a id='edit-pane-help'>Edit</a></li>");

                $("#undo-dropdown").on('click', function()
                {
                    var retVal = meiEditorSettings.undoManager.undo();

                    if (!retVal)
                    {
                        meiEditor.localWarn("Nothing to undo.");
                    }
                });

                $("#redo-dropdown").on('click', function()
                {
                    var retVal = meiEditorSettings.undoManager.redo();

                    if (!retVal)
                    {
                        meiEditor.localWarn("Nothing to redo.");
                    }
                });

                $("#find-dropdown").on('click', function()
                {
                    var editor = meiEditor.getPageData(meiEditor.getActivePanel().text());
                    var config = require("ace/config");

                    config.loadModule("ace/ext/searchbox", function(e)
                    {
                        e.Search(editor);
                    });
                });

                $("#replace-dropdown").on('click', function()
                {
                    var editor = meiEditor.getPageData(meiEditor.getActivePanel().text());
                    var config = require("ace/config");

                    config.loadModule("ace/ext/searchbox", function(e)
                    {
                        e.Search(editor, true);
                    });

                });

                $("#edit-pane-help").on('click', function(){
                    $("#editHelpModal").modal();
                });

                createModal(meiEditorSettings.element, 'editHelpModal', false, '<h4>Help for "Edit" menu:</h4>' +
                    '<li>The undo option (also accessible by pressing ctrl+z on Mac) will undo the last action performed.</li>' +
                    '<li>The redo option (also accessible by pressing ctrl+y on Mac) will redo the last action performed.</li>' +
                    '<li>The find option (also accessible by pressing ctrl+f on Windows or command+f on Mac) will open a find box based on the currently open page.</li>' +
                    '<li>The replace option (also accessible by pressing ctrl+h on Windows or command+option+f on Mac) will open a find/replace box based on the currently open page.</li>' +
                    '<li>Pressing Ctrl+G will open a prompt to navigate to a specific line number.</li>');

                meiEditor.reloadUndoListeners = function(fileName)
                {        
                    //get rid of this sometime. happens when pages are renamed            
                    if(fileName === undefined)
                    {
                        return;
                    }

                    //when each document changes
                    meiEditor.getPageData(fileName).on('change', function(delta, editor)
                    {
                        //clear the previous doc and get the current cursor/document settings
                        window.clearTimeout(meiEditorSettings.editTimeout);

                        if(delta.lines.length > 0)
                        {
                            if (!meiEditorSettings.initCursor)
                            {
                                meiEditorSettings.initCursor = editor.getCursorPosition();
                            }

                            if (!meiEditorSettings.initDoc)
                            {
                                meiEditorSettings.initDoc = $("#openPages").tabs('option', 'active');
                            }    
                        }

                        meiEditorSettings.editTimeout = setTimeout(function(arr)
                        {
                            meiEditorSettings.initCursor = undefined;
                            meiEditorSettings.activeDoc = undefined;
                            //if it's been 500ms since the last change, get the current text, cursor position, and active document number, then save that as an undo
                            var texts = arr[0];
                            var cursorPos = arr[1];
                            var activeDoc = arr[2];
                            var pageTitle = meiEditorSettings.tabTitlesByIndex[activeDoc];
                            meiEditorSettings.undoManager.save('PageEdited', [texts, cursorPos, activeDoc]);
                            meiEditor.reparseAce(pageTitle);

                            meiEditor.events.publish("PageEdited", [pageTitle]);
                        }, 500, [meiEditor.getAllTexts(), meiEditorSettings.initCursor, meiEditorSettings.initDoc]); //after no edits have been done for a second, save the page in the undo stack
                    });
                };

                $(document).on('keydown', function(e)
                {
                    if (e.ctrlKey)
                    {
                        if (e.keyCode == 90)
                        {
                            e.preventDefault();

                            //shorthand for triggering an undo
                            $("#undo-dropdown").trigger('click');
                        }
                        else if (e.keyCode == 89)
                        {
                            e.preventDefault();

                            //shorthand for triggering an redo
                            $("#redo-dropdown").trigger('click');
                        }
                    }
                });

                var pageTitles = meiEditor.getPageTitles();
                var idx = pageTitles.length;

                while(idx--)
                {
                    meiEditor.reloadUndoListeners(pageTitles[idx]);
                }

                meiEditor.events.subscribe("NewFile", function(fileData, fileName)
                {
                    meiEditor.reloadUndoListeners(fileName);
                    meiEditorSettings.undoManager.save('PageEdited', [meiEditor.getAllTexts(), [{'row':0, 'column':0}], $("#pagesList li").length - 1]);
                });

                meiEditor.events.subscribe("PageWasRenamed", function(oldName, newName)
                {
                    meiEditor.reloadUndoListeners(newName);
                    meiEditorSettings.undoManager.save('PageEdited', [meiEditor.getAllTexts(), [{'row':0, 'column':0}], $("#pagesList li").length - 1]);
                });

                //when editor pane changes are undone
                meiEditorSettings.undoManager.newAction('PageEdited', function(texts, cursor, doc, currentState)
                {
                    //replace the editsession for that title
                    for (var curTitle in texts)
                    {
                        meiEditor.getPageData(curTitle).setSession(new ace.EditSession(texts[curTitle]));
                        meiEditor.getPageData(curTitle).resize();
                        meiEditor.getPageData(curTitle).focus();
                    }


                    //swap back to that tab
                    $("#openPages").tabs('option', 'active', doc);

                    //move cursor to before first alpha-numberic character of most recent change
                    var title = meiEditor.getActivePageTitle();
                    var newCursor = currentState.parameters[1];

                    meiEditor.getPageData(title).gotoLine(newCursor.row + 1, newCursor.column, true); //because 1-indexing is always the right choice
                    meiEditor.getPageData(title).resize();
                    meiEditor.getPageData(title).getSession().setMode("ace/mode/xml");
                });

                return true;
            }
        };
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});