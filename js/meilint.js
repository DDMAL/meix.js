/*
	Wrapper for xmllint.js to validate MEI files.
	@param moduleIn A JSON object with the following attributes:
		moduleIn['xml'] - the xml text to validate (as a string joined by "\n" characters)
		moduleIn['schema'] - the schema text (as a string joined by "\n" characters)
		moduleIn['xmlTitle'] (optional) - the title of a temporary file created by xmllint.js; all diagnostic messages will refer to the xml text by this title. If this is empty, "in.mei" will be used.
		moduleIn['schemaTitle'] (optional) - same as xmlTitle, but for the schema. If this is empty, "in.rng" will be used.
	@param workerAttributes A JSON object used to extend the validationWorker for variables to be accessed in the callback function
	@param onMessage A function called when xmllint.js produces a new diagnostic message.

*/
function validateMEI(moduleIn, workerAttributes, onMessage)
{
    validationWorker = new Worker("/js/xmllint.js");
    $.extend(validationWorker, workerAttributes);
    validationWorker.onmessage = onMessage;
    validationWorker.postMessage(moduleIn);
}