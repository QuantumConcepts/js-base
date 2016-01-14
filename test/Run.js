var Mocha = require("mocha");

var mocha = new Mocha();

mocha.addFile("ServerTests.js");
mocha.addFile("DbProcessorTests.js");

mocha.run(process.exit);