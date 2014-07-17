/*

Copyright (C) 2014 by Andrew Horwitz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

//Various imports - run npm install body-parser and express to get those two, other three should be included. Install xmllint (the C version, not the Emscripten version) to run this.
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var exec = require('child_process').exec;
var app = express();

function addZero(number)
{
    return String(number).length == 1 ? "0" + number : number;
}

function timeLog(text)
{
    var now = new Date();
    var formattedDate = now.getFullYear() + "/" + addZero(now.getMonth()) + "/" + addZero(now.getDate()) + " - " + addZero(now.getHours()) + ":" + addZero(now.getMinutes()) + ":" + addZero(now.getSeconds()) + "." + now.getMilliseconds() + ": ";
    console.log(formattedDate + text);
}

//Allow cross-origin requests as necessary.
app.use(function (req, res, next) 
{
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:8000');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

//Limit is needed to transfer both large files.
app.use(bodyParser({limit: '50mb'}));

app.use(function(req, res, next)
{
    timeLog(req.connection.remoteAddress + ":" + req.method + " - " + req.url);
    next();
});

//On receiving a post...
app.post('/', function(req, res)
{
    //Get the expected parameters...
    var xmlTitle = req.body.xmlTitle;
    var schemaTitle = req.body.schemaTitle;
    var xmlText = req.body.xml;
    var schemaText = req.body.schema;

    timeLog("Request received - xml: " + xmlTitle + " and schema: " + schemaTitle);

    var xmllintPreloader = function(xmlTitle, schemaTitle)
    {
        var ready = {
            'xml': false,
            'schema': false
        };

        this.loaded = function(which, status, error)
        {
            //if one file fails to write for some reason, send an error.
            if (!status)
            {
                res.writeHead(500, {'Content-Type': 'text/html'});
                res.end("Error detected in the " + which + " file:" + error);
            }
            else
            {
                //otherwise if it worked, keep going
                ready[which] = true;
                timeLog("Loaded ", which, ".");
            }

            //once both have loaded...
            if (ready.xml && ready.schema)
            {
                function puts(error, stdout, stderr) 
                { 
                    stdout = stdout.replace('in.rng', schemaTitle);
                    stderr = stderr.replace('in.xml', xmlTitle);
                    //print and send the output
                    timeLog((stdout || stderr));
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end((stdout || stderr));

                    //delete the files
                    fs.unlink('in.rng');
                    fs.unlink('in.xml');
                }

                //execute the command on the server
                string = "xmllint --noout --relaxng in.rng in.xml";
                timeLog(string);
                exec(string, puts);
            }
        };
    };

    //create an asynch monitor class
    var preloader = new xmllintPreloader(xmlTitle, schemaTitle);

    //write the files to disk
    fs.writeFile('in.xml', xmlText, function (err) {
        err ? preloader.loaded('xml', false, err) : preloader.loaded('xml', true);
    });

    fs.writeFile('in.rng', schemaText, function (err) {
        err ? preloader.loaded('schema', false, err) : preloader.loaded('schema', true);
    });
});
 
app.listen(8008);
timeLog('Server running at http://localhost:8008/');