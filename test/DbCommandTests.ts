import * as Mocha from "mocha";
import * as Assert from "assert";
import * as Util from "util";
import * as Path from "path";
import {IncomingMessage} from "http";
import {DbCommand} from "../DbCommand";
import {TestConfig} from "./TestConfig";

var testConfig = TestConfig.instance;

describe("DB Command", function () {
    it("can parse DB-only request", () => {
        var url = Util.format("/%s", testConfig.dbName);
        var cmd = DbCommand.parseRequest(testConfig.dataPath, buildRequest(url));
        
        Assert.equal(cmd.dbName, testConfig.dbName);
    });
    
    it("can parse entity request", () => {
        var url = Util.format("/%s/people", testConfig.dbName);
        var cmd = DbCommand.parseRequest(testConfig.dataPath, buildRequest(url));
        
        Assert.equal(cmd.dbName, testConfig.dbName);
        Assert.equal(cmd.entityName, "people");
    });
    
    it("can parse entity ID request", () => {
        var url = Util.format("/%s/people/123", testConfig.dbName);
        var cmd = DbCommand.parseRequest(testConfig.dataPath, buildRequest(url));
        
        Assert.equal(cmd.dbName, testConfig.dbName);
        Assert.equal(cmd.entityName, "people");
        Assert.equal(cmd.entityId, "123");
    });
    
    it("can parse querystring request", () => {
        var url = Util.format("/%s/people/123?x=y", testConfig.dbName);
        var cmd = DbCommand.parseRequest(testConfig.dataPath, buildRequest(url));
        
        Assert.equal(cmd.dbName, testConfig.dbName);
        Assert.equal(cmd.entityName, "people");
        Assert.equal(cmd.entityId, "123");
        Assert.equal(cmd.query, "x=y");
    });
    
    it("builds correct DB root path", () => {
        var cmd = getCommand();
        var expected = Path.join(testConfig.dataPath, testConfig.dbName);
        
        Assert.equal(cmd.getDbRootPath(), expected);
    });
    
    it("builds correct entity root path", () => {
        var cmd = getCommand();
        var expected = Path.join(testConfig.dataPath, testConfig.dbName, "people");
        
        Assert.equal(cmd.getEntityRootPath(), expected);
    });
    
    it("builds correct entity path", () => {
        var cmd = getCommand();
        var expected = Path.join(testConfig.dataPath, testConfig.dbName, "people", "123.json");
        
        Assert.equal(cmd.getEntityPath(), expected);
    });
});

function buildRequest(url: string): IncomingMessage {
    var x = <IncomingMessage><any>{};
    
    x.url = url;
    
    return x;
    
    // return <IncomingMessage> {
    //     httpVersion: "1.1",
    //     headers: null,
    //     rawHeaders: new Array<string>(),
    //     trailers: null,
    //     rawTrailers: null,
    //     method: "GET",
    //     url: url,
    //     statusCode: 200,
    //     statusMessage: "OK",
    //     socket: null,
    //     setTimeout: (msecs: number, callback: Function) => <NodeJS.Timer>null,
    //     addListener: null,
    //     on: null,
    //     once: null,
    //     removeListener = null,
    //     removeAllListeners = null,
    //     setMaxListeners = null,
    //     getMaxListeners = null,
    //     listeners = null,
    //     listenerCount = null,
    //     
    // };
}

function getCommand(): DbCommand {
    return new DbCommand(testConfig.dataPath, testConfig.dbName, "people", "123");
}