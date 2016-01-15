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
    it("should support CRUD", function (done) {
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
    
    it("can GET multiple", function (done) {
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
    
    it ("can parse simple query-string search", function () {
        var expected = {
            firstName: {
                fieldName: "firstName",
                operator: "equals",
                value: "Jim"
            }
        };
        var actual = DbProcessor.parseSearch({
            firstName: expected.firstName.value
        });
        
        Assert.notEqual(actual, null);
        Assert.notEqual(actual.firstName, null);
        Assert.notEqual(actual.firstName.operator, null);
        Assert.equal(actual.firstName.fieldName, expected.firstName.fieldName);
        Assert.equal(actual.firstName.operator.name, expected.firstName.operator);
        Assert.equal(actual.firstName.value, expected.firstName.value);
    });
    
    it ("can parse simple JSON search", function () {
        var expected = {
            firstName: {
                fieldName: "firstName",
                operator: "equals",
                value: "Jim"
            }
        };
        var actual = DbProcessor.parseSearch({
            search: JSON.stringify(expected)
        });
        
        Assert.notEqual(actual, null);
        Assert.notEqual(actual.firstName, null);
        Assert.notEqual(actual.firstName.operator, null);
        Assert.equal(actual.firstName.fieldName, expected.firstName.fieldName);
        Assert.equal(actual.firstName.operator.name, expected.firstName.operator);
        Assert.equal(actual.firstName.value, expected.firstName.value);
    });
    
    it ("can execute simple search", function (done) {
        this.timeout(0);
        
        var path = "/" + testDbName + "/people";
        
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
                readEntity(response, function (entities) {
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