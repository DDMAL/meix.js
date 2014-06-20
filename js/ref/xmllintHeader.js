/* Use bits of this as needed to add to emcc output. */

this.addEventListener('message', function(event){
  Module = event.data;
  Module['print'] = function(x) {
      postMessage(x);
    };
  Module['printErr'] = function(x) {
    postMessage(x);
  };
  validateXML(Module);
}, false);

// NB (AH): JSHint complaining about unmatched { here.
function validateXML(Module) {
  Module['preRun'] = function() {
    FS.createDataFile('/', Module['title'], Module['intArrayFromString'](Module['xml']), true, true);
    FS.createDataFile('/', 'test.rng', Module['intArrayFromString'](Module['schema']), true, true);
};
Module.arguments = ['--noout', '--relaxng', 'test.rng', Module['title']];