$.fn.toEm = function(settings)
{
    settings = jQuery.extend({
        scope: 'body'
    }, settings);

    var that = parseInt(this[0], 10),
        scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo(settings.scope),
        scopeVal = scopeTest.height();

    scopeTest.remove();

    return that / scopeVal;
};


$.fn.toPx = function(settings)
{
    settings = jQuery.extend({
        scope: 'body'
    }, settings);

    var that = parseFloat(this[0]),
        scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo(settings.scope),
        scopeVal = scopeTest.height();

    scopeTest.remove();

    return that * scopeVal;
};

/*
    Shorthand function for creating an HTML select object from the keys of a JSON object/values of an array.
    @param idAppend A string to append to the ID of the select object to make it unique.
    @param jsonObject Source for the select object.
    @param isArr [optional] Set to true if jsonObject is actually an array; will use values
*/
createSelect = function(idAppend, jsonObject, isArr)
{
    var retString = "<select id='select" + idAppend + "'>";

    for (var curKeyIndex in jsonObject)
    {
        var curKey = (isArr ? jsonObject[curKeyIndex] : curKeyIndex);
        retString += "<option name='" + curKey + "'>" + curKey + "</option>";
    }

    return retString + "</select>";
};

/*
    Shorthand function for creating an HTML list object from the keys of a JSON object/values of an array.
    @param idAppend A string to append to the ID of the list object to make it unique.
    @param jsonObject Source for the list object.
    @param isArr [optional] Set to true if jsonObject is actually an array; will use values
*/
createList = function(idAppend, jsonObject, isArr)
{
    var retString = "<ul id='list" + idAppend + "'>";

    for (var curKey in jsonObject)
    {
        // NB (AH): curKey is being reassigned -- is this really what you want?
        var curKey = (isArr ? jsonObject[curKeyIndex] : curKeyIndex);
        retString += "<li id='" + curKey + "'>" + curKey + "</li>";
    }

    return retString + "</ul>";
};

/* 
    Shorthand function for creating a bootstrap modal.
    @param toAppendTo jQuery selector for an element to append the modal to.
    @param modalID String for a unique identifier for the modal
    @param small Boolean to determine whether or not it is a bootstrap modal-sm
    @param modalBody HTML string for the content of the modal
    @param primaryTitle [Optional] Text to put on the primary (not-"close") button at the bottom of the modal. Will only have a close button if not included.
*/
createModal = function(toAppendTo, modalID, small, modalBody, primaryTitle)
{
    var modalSize = small ? "modal-sm" : "modal-md";
    var primaryTitleString = primaryTitle ? '<button type="button" class="btn btn-primary" id="' + modalID + '-primary">' + primaryTitle + '</button>' : "";
    $(toAppendTo).append("<div id='" + modalID + "' class='modal fade'>"
        + '<div class="modal-dialog ' + modalSize + '">'
            + '<div class="modal-content">'
                + '<div class="modal-body">'
                    + modalBody
                + '</div>'
                + '<div class="modal-footer">'
                    + '<button type="button" class="btn btn-default" id="' + modalID + '-close" data-dismiss="modal">Close</button>'    
                    +  primaryTitleString
                + '</div>'
            + '</div>'
        + '</div>');
};