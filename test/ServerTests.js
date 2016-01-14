var Assert = require("assert");
var Util = require("util");
var Http = require("http");

require("../Server.js");

describe("Server", function () {
    it(Util.format("Should listen on port %s", process.env.PORT), function (done) {
        Http.request({
            host: process.env.IP,
            port: process.env.PORT,
            method: "GET",
            path: "/"
        }, function (response) {
            Assert.equal(200, response.statusCode);
            done();
        }).end();
    });
});