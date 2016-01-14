const APP = {
  name: "jsBase",
  version: "0.0.1"
};
const DATA_PATH = "data";

var Http = require("http");
var Path = require("path");
var Util = require("util");
var DbProcessor = require("./DbProcessor.js");

var server = Http.createServer(handleRequest);

function handleRequest(request, response) {
  if ("/" == request.url) {
    response.statusCode = 200;
    response.write(Util.format("%s v%s", APP.name, APP.version));
    response.end();
    return;
  }
  
  var match = (new RegExp("^/([^/]+)")).exec(request.url);
  
  if (match != null && match.length == 2) {
    var db = match[1];
    var dbPath = Path.join(DATA_PATH, db);
    var processor = new DbProcessor(dbPath, db);
    
    processor.processDbAction(request, response);
  }
}

function run(port) {
  server.listen(port, function () {
    console.log("Server listening on port %s.", port);
  });
}

run(process.env.PORT);