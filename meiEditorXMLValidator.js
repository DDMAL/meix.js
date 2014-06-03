(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            divName: "xml-validator",
            minimizedTitle: "Files to validate:",
            maximizedAppearance: 'Files to validate:<br><div id="validate-file-list" class="file-list"></div>'
                +'Active RelaxNG schema: <select id="validatorSelect"></select>',
            minimizedAppearance: '<span id="numNewMessages">0</span>',
            init: function(meiEditor, meiEditorSettings){
                $.extend(meiEditorSettings, {
                    validatorLinks: ["all", "all_anyStart", "CMN", "Mensural", "Neumes"],
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
                meiEditor.validateMei = function(pageName, pageNameOriginal)
                {
                    callbackFunction = function(event)
                    {
                        pageName = this.pageName;
                        $("#validate-output-" + pageName).html($("#validate-output-" + pageName).html() + "<br>" + event.data);
                        if($("#xml-validator").hasClass('minimized')){
                            var curCount = 0;
                            if($("#numNewMessages").html() != ""){
                                curCount = parseInt($("#numNewMessages").html())
                            }
                            curCount += 1;
                            $("#numNewMessages").html(curCount);
                            $("#numNewMessages").css('display', 'inline');
                        }
                    }

                    var Module = 
                    {
                        xml: meiEditorSettings.pageData[pageNameOriginal].doc.getAllLines().join("\n"),
                        schema: meiEditorSettings.validators[$(validatorSelect).find(":selected").text()],
                        xmlTitle: pageNameOriginal,
                        schemaTitle: "mei-"+$(validatorSelect).find(":selected").text()+".rng",
                    }

                    validateMEI(Module, {'pageName': pageName}, callbackFunction);

                    $("#validate-output-" + pageName).html("Validating " + Module['title'] + " against " + Module['schemaTitle'] + ".");
                }

                meiEditor.events.subscribe("NewFile", function(fileData, fileName, fileNameOriginal){
                    $("#validate-file-list").html($("#validate-file-list").html()
                        + "<div class='meiFile' pageTitle='" + fileName + "' id='validate-" + fileName + "'>" + fileNameOriginal
                        + "<span class='meiFileButtons'>"
                        + "<button class='meiClear' pageTitle='" + fileName + "'>Clear output</button>"
                        + "<button class='meiValidate' pageTitle='" + fileName + "' pageTitleOrig='" + fileNameOriginal + "'>Validate</button>"
                        + "</span>"
                        + "<div class='validateOutput' id='validate-output-" + fileName + "'></div>"
                        + "</div>");
                    reapplyXMLValidatorButtonListeners();
                });

                meiEditor.events.subscribe("NewOrder", function(newOrder)
                {
                    var tempChildren = [];
                    var curPage = 0;
                    while(curPage < newOrder.length)
                    {
                        var curPageTitle = newOrder[curPage];
                        var curChildren = $("#validate-file-list").children();
                        var curCount = curChildren.length;
                        while(curCount--)
                        {
                            if($(curChildren[curCount]).attr('pageTitle') == curPageTitle)
                            {
                                tempChildren.push(curChildren[curCount].outerHTML);
                                break;
                            } 
                        }
                        curPage++;
                    }
                    $("#validate-file-list").html(tempChildren.join(""));
                    reapplyXMLValidatorButtonListeners();
                });

                meiEditor.events.subscribe("PageWasDeleted", function(pageName, pageNameOriginal)
                {
                    $("#validate-" + pageName).remove();
                });

                //load in the XML validator
                curValidatorCount = meiEditorSettings.validatorLinks.length;
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
                            }
                        });
                    }
                    singleAjax(meiEditorSettings.validatorLinks[curValidatorCount]);
                }

                $("#" + this.divName).on('maximize', function(){
                    $("#numNewMessages").css('display', 'block');
                    $("#numNewMessages").html('0');
                });

                $("#" + this.divName).on('minimize', function(){
                    if($("#numNewMessages").html() == '0'){
                        $("#numNewMessages").css('display', 'none');
                    }
                });
                return true;
            }
        }
        return retval;
    })());
})(jQuery);