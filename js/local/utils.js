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

    for (curKeyIndex in jsonObject)
    {
        var curKey = (isArr ? jsonObject[curKeyIndex] : curKeyIndex);
        retString += "<option id='" + idAppend + "-" + curKey + "' name='" + curKey + "'>" + curKey + "</option>";
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

    for (curKeyIndex in jsonObject)
    {
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
    $(toAppendTo).append("<div id='" + modalID + "' class='modal fade' tabindex='-1'>" +
        '<div class="modal-dialog ' + modalSize + '">' +
            '<div class="modal-content">' +
                '<div class="modal-body">' +
                    modalBody +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-default" id="' + modalID + '-close" data-dismiss="modal">Close</button>' +
                     primaryTitleString +
                '</div>' +
            '</div>' +
        '</div>');
};

function Timeout(fn, interval) {
    var id = setTimeout(fn, interval);
    this.cleared = false;
    this.clear = function () {
        this.cleared = true;
        clearTimeout(id);
    };
}

function clearSelections() {
    if (window.getSelection)
    {
        window.getSelection().removeAllRanges();
    }
    else if (document.selection)
    {
        document.selection.empty();
    }
}

function backspacePrevent(e){
    if(e.keyCode == 8)
    {
        e.preventDefault();
    }
}

//credit to http://stackoverflow.com/a/21963136
var lut = []; for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }
function genUUID()
{
  var d0 = Math.random()*0xffffffff|0;
  var d1 = Math.random()*0xffffffff|0;
  var d2 = Math.random()*0xffffffff|0;
  var d3 = Math.random()*0xffffffff|0;
  return 'm-' + lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
    lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
    lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
    lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
}

function findKeyIn(needle, haystack)
{
    for(curItem in haystack)
    {
        if(curItem == needle)
        {
            return haystack[curItem];
        }
        else if(typeof(haystack[curItem]) === "object")
        {
            var found = findKeyIn(needle, haystack[curItem]);
            if(found)
            {
                return found;
            }
            else
            {
                continue;
            }
        }
    }
    return false;
}

function createDefaultMEIString(){
    meiString = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<mei xmlns="http://www.music-encoding.org/ns/mei" xml:id="' + genUUID() + '" meiversion="2013">\n' +
    '  <meiHead xml:id="' + genUUID() + '">\n' +
    '    <fileDesc xml:id="' + genUUID() + '">\n' +
    '      <titleStmt xml:id="' + genUUID() + '">\n' +
    '        <title xml:id="' + genUUID() + '"/>\n' +
    '      </titleStmt>\n' +
    '      <pubStmt xml:id="' + genUUID() + '">\n' +
    '        <date xml:id="' + genUUID() + '"/>\n' +
    '      </pubStmt>\n' +
    '    </fileDesc>\n' +
    '    <encodingDesc xml:id="' + genUUID() + '">\n' +
    '      <projectDesc xml:id="' + genUUID() + '">\n' +
    '        <p xml:id="' + genUUID() + '"/>\n' +
    '      </projectDesc>\n' +
    '    </encodingDesc>\n' +
    '  </meiHead>\n' +
    '  <music xml:id="' + genUUID() + '">\n' +
    '    <facsimile xml:id="' + genUUID() + '">\n' +
    '      <surface xml:id="' + genUUID() + '">\n' +
    '      </surface>\n' +
    '    </facsimile>\n' +
    '    <body xml:id="' + genUUID() + '">\n' +
    '      <mdiv xml:id="' + genUUID() + '">\n' +
    '        <pages xml:id="' + genUUID() + '">\n' +
    '          <page xml:id="' + genUUID() + '">\n' +
    '            <system xml:id="' + genUUID() + '">\n' +
    '              <staff xml:id="' + genUUID() + '">\n' +
    '                <layer xml:id="' + genUUID() + '">\n' +
    '                </layer>\n' +
    '              </staff>\n' +
    '            </system>\n' +
    '          </page>\n' +
    '        </pages>\n' +
    '      </mdiv>\n' +
    '    </body>\n' +
    '  </music>\n' +
    '</mei>';
    return meiString;
}

//stolen mercilessly (but with gratitude) from http://stackoverflow.com/questions/9234830/how-to-hide-a-option-in-a-select-menu-with-css
jQuery.fn.toggleOption = function( show ) 
{
    jQuery( this ).toggle( show );
    if( show ) {
        if( jQuery( this ).parent( 'span.toggleOption' ).length )
            jQuery( this ).unwrap( );
    } else {
        if( jQuery( this ).parent( 'span.toggleOption' ).length === 0 )
            jQuery( this ).wrap( '<span class="toggleOption" style="display: none;" />' );
    }
};

jQuery.fn.hasVisibleOptions = function() 
{
    var childLength = $(this).children('option').length;
    if(childLength === 0)
    {
        return false;
    }
    else
    {
        for(var curChildIndex = 0; curChildIndex < childLength; curChildIndex++)
        {
            if($(this).children('option').css('display') != "none")
            {
                return true;
            }
        }
        return false;
    }
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

//returns a dictionary where {'elementTag': {'attr': 'val', 'attr2': 'val2'}} etc.
function parseXMLLine(text)
{
    var splits = text.split(" ");
    var returnDict = {};
    var returnDictKey;
    for (idx in splits)
    {
        curSplit = splits[idx];

        if(!curSplit || curSplit == " ") continue; //just a blank space

        if(curSplit.match(/\/>/g)) //strip off the last two characters of single-line elements
        {
            curSplit = curSplit.slice(0, -2);
        }
        else if(curSplit.match(/>/g)) //strip last character off multi-line elements
        {
            curSplit = curSplit.slice(0, -1);
        }

        if (curSplit.match(/</g)) //if it's the first one, initialize the dict
        {
            returnDictKey = curSplit.substring(1);
            returnDict[returnDictKey] = {};
        }

        else //add to the dict
        {
            var kv = curSplit.split("=");
            returnDict[returnDictKey][kv[0]] = kv[1].slice(1, -1); 
        }
    }
    return returnDict;
}