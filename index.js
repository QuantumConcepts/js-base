const Fs = require("fs");
const Util = require("util");
const Path = require("path");

const distPath = Util.format("%s/dist/", __dirname);
const filesToExclude = ["Start.js"];

Fs.readdirSync(distPath).forEach(filename => {
    if (filesToExclude.indexOf(filename) < 0) {
        var match = filename.match(/^(.+)\.js$/);
        
        if (match) {
            var name = match[1];
            var filePath = Path.join(distPath, filename);
            
            module.exports[name] = require(filePath)[name]; 
        }
    }
});