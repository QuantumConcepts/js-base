import * as Mocha from "mocha";
import * as Assert from "assert";
import * as Util from "util";
import * as Http from "http";
import * as HttpStatusCodes from "http-status-codes";
import * as Path from "path";
import * as rimraf from "rimraf";
import {HttpServer} from "../HttpServer";
import {AppInfo} from "../AppInfo";
import {Config} from "../Config";
import {DbProcessor} from "../DbProcessor";
import {TestConfig} from "./TestConfig";

var testConfig = TestConfig.instance;
var config = new Config(60001, testConfig.relativeDataPath);
var server = new HttpServer(testConfig.appInfo, config, new DbProcessor(config));

server.run();

describe("HTTP Server", function () {
    it("should support CRUD", function (done: MochaDone) {
        var originalEntity = <any>{
            firstName: "Jim",
            lastName: "Smythe"
        };
        
        // POST
        Http.request(getHttpOptions("/" + testConfig.dbName + "/people", "POST"), function (response) {
            var entityLocation = response.headers["location"];
            
            Assert.equal(response.statusCode, HttpStatusCodes.CREATED);
            Assert.notEqual(entityLocation, null);
            
            readEntity(response, function (entity: any) {
                Assert.equal(entity.firstName, originalEntity.firstName);
                Assert.equal(entity.lastName, originalEntity.lastName);
                
                originalEntity.firstName = "Tammie";
                originalEntity.age = 22;
                
                // PUT
                Http.request(getHttpOptions(entityLocation, "PUT"), function (response) {
                    Assert.equal(HttpStatusCodes.OK, response.statusCode);
                    
                    readEntity(response, function (entity: any) {
                        Assert.equal(entity.firstName, originalEntity.firstName);
                        Assert.equal(entity.age, originalEntity.age);
                        
                        // GET
                        Http.request(getHttpOptions(entityLocation, "GET"), function (response) {
                            Assert.equal(HttpStatusCodes.OK, response.statusCode);
                            
                            readEntity(response, function (entity: any) {
                                Assert.equal(entity.firstName, originalEntity.firstName);
                                Assert.equal(entity.lastName, originalEntity.lastName);
                                Assert.equal(entity.age, originalEntity.age);
                                
                                // DELETE
                                Http.request(getHttpOptions(entityLocation, "DELETE"), function (response) {
                                    Assert.equal(response.statusCode, HttpStatusCodes.OK);
                                    
                                    // Get (again)
                                    Http.request(getHttpOptions(entityLocation, "GET"), function (response) {
                                        Assert.equal(response.statusCode, HttpStatusCodes.NOT_FOUND);
                                        
                                        done();
                                    })
                                    .end();
                                })
                                .end();
                            });
                        })
                        .end();
                    });
                })
                .end(JSON.stringify(originalEntity));
            });
        })
        .end(JSON.stringify(originalEntity));
    });
    
    it("can GET multiple", function (done: MochaDone) {
        var path = "/" + testConfig.dbName + "/people";
        var total = 9;
        var current = 0;
        var postNext = function () {
            if (current != total) {
                var entity = {
                    firstName: "First" + current,
                    lastName: "Last" + current
                };
                
                Http.request(getHttpOptions(path, "POST"), function (response) {
                    Assert.equal(response.statusCode, HttpStatusCodes.CREATED);
                    
                    current++;
                    postNext();
                })
                .end(JSON.stringify(entity));
            }
            else
                getAll();
        };
        var getAll = function () {
            Http.request(getHttpOptions(path, "GET"), function (response) {
                readEntity(response, function (entities: Array<any>) {
                    Assert.notEqual(entities, null);
                    Assert.equal(Array.isArray(entities), true);
                    Assert.equal(entities.length >= total, true);
                    
                    for (var i = 0; i < entities.length; i++) {
                        var entity = entities[i];
                        
                        Assert.notEqual(entity, null);
                        Assert.equal(entity.hasOwnProperty("firstName"), true);
                        Assert.notEqual(entity.firstName, null);
                        Assert.equal(entity.hasOwnProperty("lastName"), true);
                        Assert.notEqual(entity.lastName, null);
                    }
                    
                    done();
                });
            })
            .end();
        };
        
        postNext();
    });
    
    it ("can execute simple search", function (done: MochaDone) {
        this.timeout(0);
        
        var path = "/" + testConfig.dbName + "/people";
        
        Http.request(getHttpOptions(path, "POST"), function (response) {
            Assert.equal(response.statusCode, HttpStatusCodes.CREATED);
            
            var search = {
                firstName: {
                    fieldName: "firstName",
                    operator: "equals",
                    value: "Jim"
                }
            };
            var qs = Util.format("search=%s", encodeURIComponent(JSON.stringify(search)));
            var searchPath = Util.format("%s?%s", path, qs);
            
            Http.request(getHttpOptions(searchPath, "GET"), function (response) {
                readEntity(response, function (entities: Array<any>) {
                    Assert.notEqual(entities, null);
                    Assert.equal(Array.isArray(entities), true);
                    Assert.equal(entities.length > 0, true);
                    
                    for (var i = 0; i < entities.length; i++) {
                        var entity = entities[i];
                        
                        Assert.equal(entity.firstName, search.firstName.value);
                    }
                    
                    done();
                });
            })
            .end();
        })
        .end(JSON.stringify({
            firstName: "Jim",
            lastName: "Smythe"
        }));
    });
    
    after(function (done: MochaDone) {
        rimraf(Path.resolve(testConfig.dataPath, testConfig.dbName), (err: Error) => {
            server.stop();
            done(err);
        });
    });
});

function getHttpOptions(path: string, method: string) {
    return {
        host: process.env.IP,
        port: config.port,
        method: method,
        path: path
    };
}

function readEntity(response: Http.IncomingMessage, callback: (entity: any) => any) {
    var rawData = "";
    
    response.on("data", function (chunk: Buffer) { rawData += chunk.toString(); });
    response.on("end", function () {
        var parsedEntity: Object = null;
        
        try {
            parsedEntity = JSON.parse(rawData);
        }
        catch (err) {
            throw Error(Util.format("Could not parse JSON returned from URL \"%s\": %s", response.url, rawData));
        }
        
        callback(parsedEntity);
    });
}