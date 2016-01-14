var Assert = require("assert");
var Util = require("util");
var Http = require("http");
var HttpStatusCodes = require("http-status-codes");
var Path = require("path");
var DbProcessor = require("../DbProcessor.js");

var rmdir = require("rmdir");

var testDbName = "mocha_test";

require("../Server.js");

describe("DB Processor", function () {
    it("Should support CRUD", function (done) {
        var originalEntity = {
            firstName: "Jim",
            lastName: "Smythe"
        };
        
        // POST
        Http.request(getHttpOptions("/" + testDbName + "/people", "POST"), function (response) {
            var entityLocation = response.headers["location"];
            
            Assert.equal(response.statusCode, HttpStatusCodes.CREATED);
            Assert.notEqual(entityLocation, null);
            
            readEntity(response, function (entity) {
                Assert.equal(entity.firstName, originalEntity.firstName);
                Assert.equal(entity.lastName, originalEntity.lastName);
                
                originalEntity.firstName = "Tammie";
                originalEntity.age = 22;
                
                // PUT
                Http.request(getHttpOptions(entityLocation, "PUT"), function (response) {
                    Assert.equal(HttpStatusCodes.OK, response.statusCode);
                    
                    readEntity(response, function (entity) {
                        Assert.equal(entity.firstName, originalEntity.firstName);
                        Assert.equal(entity.age, originalEntity.age);
                        
                        // GET
                        Http.request(getHttpOptions(entityLocation, "GET"), function (response) {
                            Assert.equal(HttpStatusCodes.OK, response.statusCode);
                            
                            readEntity(response, function (entity) {
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
    
    it("Can GET multiple", function (done) {
        var path = "/" + testDbName + "/people";
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
                readEntity(response, function (entities) {
                    Assert.notEqual(entities, null);
                    Assert.equal(Array.isArray(entities), true);
                    Assert.equal(entities.length, total);
                    
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
    
    it ("Should parse simple search", function () {
        var expected = {
            firstName: {
                fieldName: "firstName",
                operator: "equals",
                value: "Jim"
            }
        };
        var qs = Util.format("%s=%s", expected.firstName.fieldName, expected.firstName.value);
        var actual = DbProcessor.parseSearch(qs);
        
        Assert.notEqual(actual, null);
        Assert.notEqual(actual.firstName, null);
        Assert.equal(actual.firstName.fieldName, expected.firstName.fieldName);
        Assert.equal(actual.firstName.operator.name, expected.firstName.operator);
        Assert.equal(actual.firstName.value, expected.firstName.value);
    });
    
    after(function (done) {
        rmdir(Path.resolve("data", testDbName), done);
    });
});

function getHttpOptions(path, method) {
    return {
        host: process.env.IP,
        port: process.env.PORT,
        method: method,
        path: path
    };
}

function readEntity(response, callback) {
    var rawData = "";
    
    response.on("data", function (chunk) { rawData += chunk; });
    response.on("end", function () {
        var entity = JSON.parse(rawData);
        
        callback(entity);
    });
}