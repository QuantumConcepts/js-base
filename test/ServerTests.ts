import * as Mocha from "mocha";
import * as Assert from "assert";
import * as Util from "util";
import * as Http from "http";
import {HttpServer} from "../HttpServer";
import {AppInfo} from "../AppInfo";
import {Config} from "../Config";
import {DbProcessor} from "../DbProcessor";

var appInfo = new AppInfo("js-base", "0.0.0");
var config = new Config(60000, "../data/");
var server = new HttpServer(appInfo, config, new DbProcessor(config));

server.run();

describe("Server", function () {
    it(Util.format("Should listen on port %s", config.port), function (done) {
        Http.request({
            host: process.env.IP,
            port: config.port,
            method: "GET",
            path: "/"
        }, function (response) {
            Assert.equal(200, response.statusCode);
            done();
        }).end();
    });
    
    after(function () {
        server.stop();
    });
});