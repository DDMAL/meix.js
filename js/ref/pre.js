  Module['preRun'] = function() {
    FS.createDataFile('/', Module['title'], Module['intArrayFromString'](Module['xml']), true, true);
    FS.createDataFile('/', 'test.rng', Module['intArrayFromString'](Module['schema']), true, true);
  };
  Module.arguments = ['--noout', '--relaxng', 'test.rng', Module['title']];
 

