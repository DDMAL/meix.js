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
                //'Upload validator': '$("#testModal").modal();',
                "Validate a file...": '$("#fileValidateModal").modal();',
            },

            maximizedAppearance: 'Active RelaxNG schema: <select id="validatorSelect"></select>'
                + '<div id="validate-file-list" class="file-list"></div>',
            minimizedAppearance: '<span id="numNewMessages">0</span>',
            init: function(meiEditor, meiEditorSettings){
                $.extend(meiEditorSettings, {
                    validatorNames: ["all", "all_anyStart", "CMN", "Mensural", "Neumes"],
                    validators: {},
                });

                /* 
                    Function called to reapply button listeners
                */
                var reapplyXMLValidatorButtonListeners = function(){
                    $(".meiClear").on('click', function(e)
                    {
                        fileName = $(e.target).attr('pageTitle'); //grabs page title from custom attribute
                        $("#validate-output-" + fileName).html("");
                    });
                    $(".meiValidate").on('click', function(e)
                    {
                        fileName = $(e.target).attr('pageTitle'); //grabs page title from custom attribute
                        fileNameOriginal = $(e.target).attr('pageTitleOrig'); //grabs page title from custom attribute
                        meiEditor.validateMei(fileName, fileNameOriginal);
                    });
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
                        console.log(event.data);
                    }

                    var Module = 
                    {
                        xml: meiEditorSettings.pageData[pageName].getSession().doc.getAllLines().join("\n"),
                        schema: meiEditorSettings.validators[validatorName],
                        xmlTitle: pageName,
                        schemaTitle: "mei-" + validatorName + ".rng",
                    }

                    validateMEI(Module, {'pageName': pageName}, callbackFunction);

                    $("#validate-output-" + pageName).html("Validating " + Module['xmlTitle'] + " against " + Module['schemaTitle'] + ".");
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
                            url: 'validation/mei-'+curValidator+'.rng',
                            success: function(data)
                            {
                                meiEditorSettings.validators[curValidator] = data;
                                $("#validatorSelect").html($("#validatorSelect").html()+"<option value='" + curValidator + "'>" + curValidator + "</option>");
                                meiEditor.events.publish("NewValidator", [curValidator]);
                            }
                        });
                    }
                    singleAjax(meiEditorSettings.validatorNames[curValidatorCount]);
                }

                //create some modals
                var fileSelectString = meiEditor.createSelect("Validate", meiEditorSettings.pageData);
                var validatorSelectString = meiEditor.createSelect("Validators", meiEditorSettings.validators);

                meiEditor.createModal('fileValidateModal', true, "Select a file: " + fileSelectString + "<br>Select a validator: " + validatorSelectString, "Validate file");
                $("#fileValidateModal-primary").on('click', function(){meiEditor.validateMei($("#meiSelectValidate").find(":selected").text(), $("#meiSelectValidators").find(":selected").text())});

                meiEditor.events.subscribe("NewFile", function(a, b, fileNameOriginal)
                {
                    $("#meiSelectValidate").append("<option name='" + fileNameOriginal + "'>" + fileNameOriginal + "</option>");
                });
                meiEditor.events.subscribe("NewValidator", function(validatorName)
                {
                    $("#meiSelectValidators").append("<option name='" + validatorName + "'>" + validatorName + "</option>");
                });
                return true;
            }
        }
        return retval;
    })());
})(jQuery);