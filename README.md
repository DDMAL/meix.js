ACE MEI Editor (meix.js)
========

Setup instructions:
--------
* Clone recursively (git clone --recursive https://github.com/DDMAL/meix.js.git) to download the entire repository and the ACE code. If meix.js/ace does not populate, it can be downloaded from [this github respository](https://github.com/ajaxorg/ace-builds). This has only been tested with the stable builds of Ace; use the [nightly builds](https://github.com/ajaxorg/ace) at your own risk.
* meix.js should run straight out of the box - run `python -m SimpleHTTPServer` in the meix.js directory and go to `127.0.0.1:8000/index.html` in your browser of choice.

Development instructions:
--------
* Additional functionality should be written as plugins, following the general structure of `meiEditorPluginTemplate.js`, found in `meix.js/js/plugins`. Two plugins, `meiEditorFileUpload.js` and `meiEditorXMLValidator.js`, come with the package by default. 
* Plugins are enabled simply by including their JavaScript files. `meiEditor.js` will recognize any loaded plugins when it is initialized.
* We recommend that additional features either be incorporated as dropdown options (Undo/Redo off title menu), as modals that spawn off dropdown clicks(Load/Save files off "Files" menu), or as icons on each tab pane. Examples of how to implement these can be found in `meiEditorPluginTemplate.js`; submit an issue if the code in `meiEditor.js` does not explain this well enough.
* To embed an meiEditor instance in your own page, include a div on the page with a distinct `id` attribute, and include the following code:
<pre><code>meiEditor = $("#meiEditorID").AceMeiEditor(
{
    'validatorLink': '', //required for XML validator plugin
    'xmllintLoc': '', //required for XML validator plugin
});</code></pre>
* You can access the public data/functions elsewhere in the code by calling `$("#meiEditorID").data('AceMeiEditor')`. Because the meiEditorPreloader class loads plugins asynchronously, this data will be available when the JavaScript `meiEditorLoaded` event is published. The `index.html` page included with this repository includes an example of accessing the data.
