require(['meiEditor', window.meiEditorLocation + 'js/local/meilint'], function(){
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            divName: "xml-validator",
            title: "Validator",
            dropdownOptions: 
            {
                'Validate a file...': 'file-validate-dropdown',
                'Upload validator...': 'validator-load-dropdown',
            },
            requiredSettings: ['validatorLink', 'xmllintLoc'],
            init: function(meiEditor, meiEditorSettings){
                var aceRange = ace.require('ace/range').Range;
                $.extend(meiEditorSettings, {
                    validators: {},
                });

                $("#file-validate-dropdown").on('click', function(){
                    $("#fileValidateModal").modal();
                });
                $("#validator-load-dropdown").on('click', function(){
                    $("#validatorLoadModal").modal();
                });
                $("#xml-validator-help").on('click', function(){
                    $("#validatorHelpModal").modal();
                });

                createModal(meiEditorSettings.element, 'validatorHelpModal', false, '<h4>Help for "Validator" menu:</h4>'  
                + '<li>The "Validate a file" option will bring you to a list of files in the editor and a list of validators loaded automatically. Choosing "validate a file" will run in the background and update you on its progress in both the console pane and highlight errors or warnings in the file.</li>'
                + '<li>The "Upload validator" option allows you to upload a custom validator other than the five that are included normally.</li>');

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
                }
                
                /* 
                    Validates MEI using the locally-hosted .RNG files
                    @param pageName The page to validate.
                    @param pageNameOriginal The non-stripped version of the filename.
                */
                meiEditor.validateMei = function(pageName, validatorName)
                {
                    callbackFunction = function(event)
                    {
                        var resultsString = event.data;
                        meiEditor.localLog(resultsString);
                        var resultsArray = resultsString.split(":");
                        var rowNumber = resultsArray[1];
                        var pageName = resultsArray[0];
                        
                        //if the second block of text is an integer (if it's a line number)
                        if(parseInt(rowNumber) == rowNumber)
                        {
                            var zeroedRowNumber = rowNumber - 1; //0-indexing!
                            //if the line number is in, but not the word "error", it's less important so it's colored yellow
                            var gutterClass = resultsString.match(/error/) ? "gutterError" : "gutterWarning";

                            //if it already exists and it's an error, do nothing
                            if(zeroedRowNumber in meiEditorSettings.pageData[pageName].getSession().$decorations)
                            {
                                //if it was a warning and is now an error, replace it
                                if((gutterClass == "gutterError") && (meiEditorSettings.pageData[pageName].getSession().$decorations[rowNumber] == "gutterWarning"))
                                {
                                    meiEditorSettings.pageData[pageName].getSession().removeGutterDecoration(zeroedRowNumber, meiEditorSettings.pageData[pageName].highlightedLines[docRow]);
                                    meiEditorSettings.pageData[pageName].getSession().addGutterDecoration(zeroedRowNumber, gutterClass);
                                }
                            }

                            //if it doesn't know there's an error already, put it in
                            else
                            {
                                meiEditorSettings.pageData[pageName].getSession().addGutterDecoration(zeroedRowNumber, gutterClass);
                            }
                        }
                    }

                    var Module = 
                    {
                        xml: meiEditorSettings.pageData[pageName].getSession().doc.getAllLines().join("\n"),
                        schema: meiEditorSettings.validators[validatorName],
                        xmlTitle: pageName,
                        schemaTitle: validatorName,
                    }
                    try
                    {
                        validateMEI(Module, {'pageName': pageName}, callbackFunction, meiEditorSettings.xmllintLoc);
                    }
                    catch(err)
                    {
                        console.log(err);
                    }
                    meiEditor.localLog("Validating " + Module['xmlTitle'] + " with " + Module['schemaTitle'] + ".");
                    $("#fileValidateModal-close").trigger('click');
                }

                //load in the XML validator
                var validatorNames = [];
                $.ajax(
                {
                    url: meiEditorSettings.validatorLink,
                    success: function(data)
                    {
                        var dataArr = data.split("\n");
                        var dataLength = dataArr.length;
                        while(dataLength--)
                        {
                            if(!dataArr[dataLength])
                            {
                                continue;
                            }
                            var foundLink = dataArr[dataLength].match(/<a href=".*">/g);
                            if(foundLink)
                            {
                                validatorNames.push(foundLink[0].slice(9, -2));
                            }
                        }
                        curValidatorCount = validatorNames.length;
                        while(curValidatorCount--)
                        {
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
                            singleAjax(validatorNames[curValidatorCount]);
                        }
                    }
                });


                //create some modals
                var fileSelectString = createSelect("Validate", meiEditorSettings.pageData);
                var validatorSelectString = createSelect("Validators", meiEditorSettings.validators);
                var validatorListString = createList("Validators", meiEditorSettings.validators);

                createModal(meiEditorSettings.element, 'fileValidateModal', true, "Select a file: " + fileSelectString + "<br>Select a validator: " + validatorSelectString, "Validate file");
                createModal(meiEditorSettings.element, 'validatorLoadModal', true, "Validators currently uploaded: " + validatorListString + "<br>Upload a new validator: <br><input type='file' id='validatorInput'>", "Load validator")
                $("#fileValidateModal-primary").on('click', function()
                    {
                        meiEditor.validateMei($("#selectValidate").find(":selected").text(), $("#selectValidators").find(":selected").text());
                    });
                $("#validatorLoadModal-primary").on('click', loadValidator);

                //subscribe to some events
                meiEditor.events.subscribe("NewFile", function(a, fileName)
                {
                    $("#selectValidate").append("<option name='" + fileName + "'>" + fileName + "</option>");
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
        }
        return retval;
    })());
    window.pluginLoader.pluginLoaded();
})(jQuery);

});