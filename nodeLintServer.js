var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var exec = require('child_process').exec;
app = express();

app.use(function (req, res, next) {
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
app.use(bodyParser({limit: '50mb'}));

app.get('/', function(req, res){
    console.log('GET /');
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('get got');
});

app.post('/', function(req, res){
    console.log('POST /');
    var xmlTitle = req.body.xmlTitle;
    var schemaTitle = req.body.schemaTitle;
    var xmlText = req.body.xml;
    var schemaText =req.body.schema;

    var xmllintPreloader = function()
    {
        var ready = {
            'xml': false,
            'schema': false,
        }

        this.loaded = function(which, status, error)
        {
            if(!status)
            {
                res.writeHead(500, {'Content-Type': 'text/html'});
                res.end("We messed up with the " + which + ":" + error);
            }
            else
            {
                ready[which] = true;
            }

            if(ready['xml'] && ready['schema']){
                function puts(error, stdout, stderr) { 
                    console.log("here", stdout.replace("\n", "<br>"), "err", stderr.replace("\n", "<br>"));
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end((stdout || stderr));
                    fs.unlink(schemaTitle);
                    fs.unlink(xmlTitle);
                }
                string = "xmllint --noout --relaxng " + schemaTitle + " " + xmlTitle;
                console.log(string);
                exec(string, puts);
            }
        }
    }

    var preloader = new xmllintPreloader();

    fs.writeFile(xmlTitle, xmlText, function (err) {
        err ? preloader.loaded('xml', false, err) : preloader.loaded('xml', true);
    });
    fs.writeFile(schemaTitle, schemaText, function (err) {
        err ? preloader.loaded('schema', false, err) : preloader.loaded('schema', true);
    });
});
 
app.listen(8008, "132.206.14.122");
console.log('Server running at http://132.206.14.122:8008/');