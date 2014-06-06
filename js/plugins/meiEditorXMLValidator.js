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
                'Validate a file...': '$("#fileValidateModal").modal();',
                'Upload validator...': '$("#validatorLoadModal").modal();',
            },
            init: function(meiEditor, meiEditorSettings){
                $.extend(meiEditorSettings, {
                    validatorNames: ["mei-all", "mei-all_anyStart", "mei-CMN", "mei-Mensural", "mei-Neumes"],
                    validators: {},
                });

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
                        meiEditor.localLog(event.data);
                    }

                    var Module = 
                    {
                        xml: meiEditorSettings.pageData[pageName].getSession().doc.getAllLines().join("\n"),
                        schema: meiEditorSettings.validators[validatorName],
                        xmlTitle: pageName,
                        schemaTitle: validatorName + ".rng",
                    }

                    validateMEI(Module, {'pageName': pageName}, callbackFunction);

                    meiEditor.localLog("Validating " + Module['xmlTitle'] + " with " + Module['schemaTitle'] + ".");
                    $("#fileValidateModal-close").trigger('click');
                }

                //load in the XML validator
                curValidatorCount = meiEditorSettings.validatorNames.length;
                while(curValidatorCount--)
                {
                    function singleAjax(curValidator)
                    {
                        $.ajax(
                        {
                            url: 'validation/'+curValidator+'.rng',
                            success: function(data)
                            {
                                meiEditorSettings.validators[curValidator] = data;
                                meiEditor.events.publish("NewValidator", [curValidator]);
                            }
                        });
                    }
                    singleAjax(meiEditorSettings.validatorNames[curValidatorCount]);
                }

                //create some modals
                var fileSelectString = meiEditor.createSelect("Validate", meiEditorSettings.pageData);
                var validatorSelectString = meiEditor.createSelect("Validators", meiEditorSettings.validators);
                var validatorListString = meiEditor.createList("Validators", meiEditorSettings.validators);



                meiEditor.createModal('fileValidateModal', true, "Select a file: " + fileSelectString + "<br>Select a validator: " + validatorSelectString, "Validate file");
                meiEditor.createModal('validatorLoadModal', true, "Validators currently uploaded: " + validatorListString + "<br>Upload a new validator: <br><input type='file' id='validatorInput'>", "Load validator")
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
})(jQuery);