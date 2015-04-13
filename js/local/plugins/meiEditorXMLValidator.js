require(['meiEditor', window.meiEditorLocation + 'js/local/meilint.js'], function(){
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            init: function(meiEditor, meiEditorSettings){
                /*
                Required settings:
                -xmllintLocation: if using the browser-based version of xmllint, where to find it in the server directory relative to the page containing the meiEditor.
                -xmllintServer: if using the web-based version of xmllint, the URL for the instance.
                    Optional: -validatorLink: a directory holding only a set of validators to preload into the interface, used for both the browser-based and web-based versions of xmllint.
                */
                var aceRange = ace.require('ace/range').Range;

                if (!("xmllintLocation" in meiEditorSettings) && !("xmllintServer" in meiEditorSettings))
                {
                    console.error("MEI Editor error: The 'XML Validator' plugin requires either the 'xmllintLocation' or 'xmllintServer' settings present on intialization.");
                    return false;
                }

                $.extend(meiEditorSettings, {
                    validators: {} //list of validator objects
                });


                meiEditor.addToNavbar("Validator", "xml-validator");
                $("#dropdown-xml-validator").append("<li><a id='file-validate-dropdown'>Validate a file...</a></li>");
                $("#dropdown-xml-validator").append("<li><a id='validator-load-dropdown'>Upload validator...</a></li>");
                $("#help-dropdown").append("<li><a id='xml-validator-help'>Validator</a></li>");

                $("#file-validate-dropdown").on('click', function(){
                    $("#fileValidateModal").modal();
                });

                $("#validator-load-dropdown").on('click', function(){
                    $("#validatorLoadModal").modal();
                });

                $("#xml-validator-help").on('click', function(){
                    $("#validatorHelpModal").modal();
                });

                createModal(meiEditorSettings.element, 'validatorHelpModal', false, '<h4>Help for "Validator" menu:</h4>' + 
                '<li>The "Validate a file" option will bring you to a list of files in the editor and a list of validators loaded automatically. Choosing "validate a file" will run in the background and update you on its progress in both the console pane and highlight errors or warnings in the file.</li>' +
                '<li>The "Upload validator" option allows you to upload a custom validator other than the five that are included normally.</li>');

                /* 
                    Function called to reapply button listeners
                */
                var loadValidator = function()
                {   
                    var reader = new FileReader();
                    reader.file = document.getElementById("validatorInput").files[0];

                    //when the file is loaded as text
                    reader.onload = function(e) 
                    { 
                        //file name with no extension
                        fileName = this.file.name.split(".")[0];

                        meiEditorSettings.validators[fileName] = this.result;
                        meiEditor.events.publish("NewValidator", [fileName]);
                       
                        //close the modal
                        $("#validatorLoadModal-close").trigger('click');
                    };
                    reader.readAsText(reader.file);
                };
                
                /* 
                    Validates MEI using the locally-hosted .RNG files
                    @param pageName The page to validate.
                    @param pageNameOriginal The non-stripped version of the filename.
                */
                meiEditor.validateMei = function(pageName, validatorName)
                {
                    validateCallback = function(source, res)
                    {
                        //if they're using the ajax version, this will be called with 'web', else it'll be called with 'browser'
                        var resultsString = (source === "web") ? res : res.data;
                        var resultsArray = resultsString.split(":");
                        var rowNumber = resultsArray[1];
                        var pageName = resultsArray[0];
                        
                        //if the second block of text is an integer (if it's a line number)
                        if (parseInt(rowNumber, 10) === rowNumber)
                        {
                            var zeroedRowNumber = rowNumber - 1; //0-indexing!
                            var gutterClass = resultsString.match(/error/) ? "gutterError" : "gutterWarning";

                            if (gutterClass === "gutterError")
                            {
                                meiEditor.localError(resultsString);
                            }
                            else 
                            {
                                meiEditor.localWarn(resultsString);
                            }
                            //if the line number is in, but not the word "error", it's less important so it's colored yellow

                            //if it already exists and it's an error, do nothing
                            if (zeroedRowNumber in meiEditor.getPageData(pageName).getSession().$decorations)
                            {
                                //if it was a warning and is now an error, replace it
                                if ((gutterClass == "gutterError") && (meiEditor.getPageData(pageName).session.$decorations[rowNumber] == "gutterWarning"))
                                {
                                    meiEditor.getPageData(pageName).session.removeGutterDecoration(zeroedRowNumber, meiEditor.getPageData(pageName).highlightedLines[docRow]);
                                    meiEditor.getPageData(pageName).session.addGutterDecoration(zeroedRowNumber, gutterClass);
                                }
                            }
                            //if it doesn't know there's an error already, put it in
                            else
                            {
                                meiEditor.getPageData(pageName).session.addGutterDecoration(zeroedRowNumber, gutterClass);
                            }
                        }
                        //it's not an error
                        else 
                        {
                            meiEditor.localLog(resultsString);
                        }
                    };

                    var Module = 
                    {
                        xml: meiEditor.getPageData(pageName).session.doc.getAllLines().join("\n"),
                        schema: meiEditorSettings.validators[validatorName],
                        xmlTitle: pageName,
                        schemaTitle: validatorName
                    };

                    try
                    {
                        //if a server link is present, use that, else use the in-browser way
                        if (meiEditorSettings.xmllintServer)
                        {
                            $.ajax({
                                url: meiEditorSettings.xmllintServer,
                                type: 'POST', 
                                contentType: 'application/json',
                                data: JSON.stringify(Module),
                                processData: false,
                                success: function(e){
                                    var eArr = e.split("\n");

                                    for (var curLine in eArr)
                                    {
                                        validateCallback("web", eArr[curLine]);
                                    } 
                                },
                                error: function(a, b, c){
                                    if(c !== "")
                                    {
                                        meiEditor.localError("Error in validating '" + Module['xmlTitle'] + "': " + b + ", " + c + ".");
                                    }
                                    else 
                                    {
                                        meiEditor.localError("Error in validating '" + Module['xmlTitle'] + "': unspecified problem.");
                                    }
                                }
                            });
                        }
                        else
                        {
                            validateMEI(Module, {'pageName': pageName}, function(res){validateCallback('browser', res);}, meiEditorSettings.xmllintLocation);
                        }
                    }
                    catch(err)
                    {
                        console.log(err);
                    }

                    meiEditor.localMessage("Validating " + Module.xmlTitle + " with " + Module.schemaTitle + ".");

                    $("#fileValidateModal-close").trigger('click');
                };

                //load in the XML validator
                var validatorNames = [];

                function singleAjax(curValidator)
                {
                    $.ajax(
                    {
                        url: meiEditorSettings.validatorLink + curValidator,
                        success: function(data)
                        {
                            meiEditorSettings.validators[curValidator] = data;
                            meiEditor.events.publish("NewValidator", [curValidator]);
                        }
                    });
                }

                $.ajax(
                {
                    url: meiEditorSettings.validatorLink,
                    success: function(data)
                    {
                        //for each line of text in the page
                        var dataArr = data.split("\n");
                        var dataLength = dataArr.length;
                        while (dataLength--)
                        {
                            //that is not empty
                            if (!dataArr[dataLength])
                            {
                                continue;
                            }

                            //find a link
                            var foundLink = dataArr[dataLength].match(/<a href=".*">/g);

                            if (foundLink)
                            {
                                //strip the outside, make sure it has ".rng"
                                linkText = foundLink[0].slice(9, -2);
                                if(linkText.match(/rng/))
                                {
                                    validatorNames.push(foundLink[0].slice(9, -2));
                                }
                            }
                        }
                        curValidatorCount = validatorNames.length;
                        while (curValidatorCount--)
                        {
                            //grab the contents of each validator
                            singleAjax(validatorNames[curValidatorCount]);
                        }
                    }
                });


                //create some modals
                var fileSelectString = createSelect("Validate", meiEditor.getPageTitles());
                var validatorSelectString = createSelect("Validators", meiEditorSettings.validators);
                var validatorListString = createList("Validators", meiEditorSettings.validators);

                createModal(meiEditorSettings.element, 'fileValidateModal', true, "Select a file: " + fileSelectString + "<br/>Select a validator: " + validatorSelectString, "Validate file");
                createModal(meiEditorSettings.element, 'validatorLoadModal', true, "Validators currently uploaded: " + validatorListString + "<br/>Upload a new validator: <br/><input type='file' id='validatorInput'/>", "Load validator");

                $("#fileValidateModal-primary").on('click', function()
                    {
                        meiEditor.validateMei($("#selectValidate").find(":selected").text(), $("#selectValidators").find(":selected").text());
                    });
                $("#validatorLoadModal-primary").on('click', loadValidator);

                //subscribe to some events
                meiEditor.events.subscribe("NewFile", function(a, fileName)
                {
                    $("#selectValidate").append("<option id='validate-" + jQueryStrip(fileName) + "' name='" + fileName + "'>" + fileName + "</option>");
                });

                meiEditor.events.subscribe("PageWasDeleted", function(fileName)
                {
                    $("#selectValidate").find(':contains("' + fileName + '")').remove();
                });

                meiEditor.events.subscribe("PageWasRenamed", function(oldName, newName)
                {
                    $("#validate-" + jQueryStrip(oldName)).attr('id', "validate-" + jQueryStrip(newName)).attr('name', jQueryStrip(newName));
                });

                meiEditor.events.subscribe("NewValidator", function(validatorName)
                {
                    $("#selectValidators").append("<option name='" + validatorName + "'>" + validatorName + "</option>");
                });

                meiEditor.events.subscribe("NewValidator", function(validatorName)
                {
                    $("#listValidators").append("<li id='" + validatorName + "'>" + validatorName + "</li>");
                });

                return true;
            }
        };

        return retval;
    })());

    window.pluginLoader.pluginLoaded();

})(jQuery);

});