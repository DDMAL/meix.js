$.fn.toEm = function(settings)
{
    settings = jQuery.extend({
        scope: 'body'
    }, settings);

    var that = parseInt(this[0], 10),
        scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;"></div>').appendTo(settings.scope),
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
        scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;"></div>').appendTo(settings.scope),
        scopeVal = scopeTest.height();

    scopeTest.remove();

    return that * scopeVal;
};

$.fn.nochildtext = function() {
    var str = '';

    this.contents().each(function() {
        if (this.nodeType == 3) {
            str += this.textContent || this.innerText || '';
        }
    });

    return str;
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
    
    appendString = "<div id='" + modalID + "' class='modal fade' tabindex='-1'>" +
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
        '</div>' +
    '</div>';

    $(toAppendTo).append(appendString);
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
};

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.findall = function(needle) 
{
    var matches = [], found;
    while ((found = needle.exec(this)) !== null) {
        matches.push(found[0]);
    }
    return matches;
};

//returns a dictionary where {'elementTag': {'attr': 'val', 'attr2': 'val2'}} etc.
function parseXMLLine(text)
{
    //if it's just a closing tag or if it's whitespace, we don't want it
    if ((text.match(/<\/[^ ]*?>/g)) || !(/\S/.test(text))) return false;

    var splits = text.findall(/\S*="[^"]*?"/g);
    var tag = text.findall(/<[^ ]*/g)[0].substring(1); //matches < then any amount of non-space chars
    var xmlDict = {};

    for (idx in splits)
    {
        curSplit = splits[idx];

        var keyVal = curSplit.split("=");
        xmlDict[keyVal[0]] = keyVal[1].slice(1, -1); //get rid of the first quote mark and last quote mark/trailing space 
    }

    var returnDict = {};
    returnDict[tag] = xmlDict;
    return returnDict;
}

/*
    Strips a file name of characters that jQuery selectors may misinterpret.
    @param fileName The filename to strip.
*/
function jQueryStrip(fileName)
{
    return fileName.replace(/\W+/g, "");
}

var meiParser = new window.DOMParser();

function rewriteAce(editorRef)
{
    var initSelection = editorRef.selection.getCursor();

    //keep all the processing instruction lines (<?xml ... ?>)
    var startRow = 0;
    while(editorRef.session.doc.getLine(startRow).match(/\?xml/g) !== null) startRow++;

    var length = editorRef.session.doc.getLength();
    var newText = editorRef.parsed.documentElement.outerHTML;
    var aceRange = require('ace/range').Range;
    var range = new aceRange(startRow, 0, length, 0);

    editorRef.session.doc.replace(range, newText);
    //+1 is because 1-indexing the accessor but 0-indexing the setter is an AMAZING idea
    editorRef.gotoLine(initSelection.row + 1, initSelection.column, false);
}

//detects whether the current resizable object is too small to hold the ui-resizable icon
var checkResizable = function(selector)
{
    //if it's so small that the icon would be outside of the box
    var resizableIsTooSmall = ($(selector).width() < 16 || $(selector).height() < 16);
    //if it has the classes
    var resizableHasClasses = $(selector + " > .ui-resizable-se").hasClass("ui-icon");

    //if these are even we need to toggle the classes
    if(resizableIsTooSmall === resizableHasClasses)
    {
        $(selector + " > .ui-resizable-se").toggleClass("ui-icon ui-icon-gripsmall-diagonal-se");
    }
};

//safely removes an element from a DOMParser along with the textnode before it representing its indentation
var safelyRemove = function(element)
{
    var parent = element.parentElement;
    var prev = element.previousSibling;
    parent.removeChild(element);
    if (prev !== null && 
        prev.nodeType == Node.TEXT_NODE &&
        prev.nodeValue.trim().length === 0) {
        parent.removeChild(prev);
    }
};

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

function isIn(test, min, max) {
    return ((test >= min) && (test <= max));
}


//credit to http://stackoverflow.com/questions/11660090/
function condense(a) { 
    var b = []; 
    for(var i = 0;i < a.length;i++) { 
        if (a[i] !== undefined && a[i] !== null) b.push(a[i]); 
    } 
    return b; 
}