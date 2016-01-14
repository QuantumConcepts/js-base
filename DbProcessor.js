var Util = require("util");
var Url = require("url");
var Fs = require("fs");
var Path = require("path");
var mkdirp = require("mkdirp");
var HttpStatusCodes = require("http-status-codes");
var Querystring = require("querystring");
var Uuid = require("uuid");

var DbProcessor = function () {
    var DbProcessor = function (dbPath, dbName) {
        if (dbPath == null)
            throw "Parameter 'dbPath' is required.";
            
        if (dbName == null)
            throw "Parameter 'dbName' is required.";

        this.dbPath = dbPath;
        this.dbName = dbName;
        this.actionMap = {
            "GET": this.processGetAction.bind(this),
            "POST": this.processPostAction.bind(this),
            "PUT": this.processPutAction.bind(this),
            "DELETE": this.processDeleteAction.bind(this)
        };
    };

    DbProcessor.prototype.processDbAction = function (request, response) {
        var dbReady = function () {
            var url = Url.parse(request.url, true, false);
            var action = this.actionMap[request.method];
            
            if (action == null)
                throw Util.format("Unhandled method '%s'.", request.method);
        
            try {
                action(url, request, response);
            }
            catch (err) {
                this.badRequest(err, response);
            }
        };
        
        Fs.exists(this.dbPath, function (exists) {
            if (!exists)
                Fs.mkdir(this.dbPath, 0770, dbReady.bind(this));
            else
                dbReady.call(this);
        }.bind(this));
    };

    DbProcessor.prototype.processGetAction = function (url, request, response) {
        var entityName = this.getEntityName(url);
        var entityId = this.getEntityId(url, true);
        
        if (entityId == null) {
            var search = DbProcessor.parseSearch(url.query);
            
            this.getMany(response, entityName, search);
        }
        else
            this.getSingle(response, entityName, entityId);
    };
    
    DbProcessor.prototype.processPostAction = function (url, request, response) {
        var entityName = this.getEntityName(url);
        
        this.readAndParseRequestBody(request, function (entity) {
            if (entity == null) {
                this.badRequest("Could not parse payload as JSON.");
                return;
            }
            
            this.postSingle(response, entityName, entity);
        }.bind(this));
    };
    
    DbProcessor.prototype.processPutAction = function (url, request, response) {
        var entityName = this.getEntityName(url);
        var entityId = this.getEntityId(url);
        
            
        this.readAndParseRequestBody(request, function (entity) {
            if (entity == null) {
                this.badRequest("Could not parse payload as JSON.");
                return;
            }
            
            this.putSingle(response, entityName, entityId, entity);
        }.bind(this));
    };
    
    DbProcessor.prototype.processDeleteAction = function (url, request, response) {
        var entityName = this.getEntityName(url);
        var entityId = this.getEntityId(url);
        
        this.deleteSingle(response, entityName, entityId);
    };
    
    DbProcessor.prototype.getMany = function (response, entityName, query) {
        var relativeFolderPath = Path.join(this.dbPath, entityName);
        
        Fs.readdir(relativeFolderPath, function (err, filenames) {
            var readFile = function (index) {
                var filename = filenames[index];
                var relativeFilePath = Path.join(this.dbPath, entityName, filename);
                
                Fs.readFile(relativeFilePath, function (err, entityData) {
                    if (err != null) {
                        this.badRequest(response, err);
                        return;
                    }
                    
                    response.write(entityData);
                    
                    if (index < (filenames.length - 1)) {
                        response.write(",");
                        readFile(++index);
                    }
                    else
                        response.end("]");
                });
            }.bind(this);
            
            if (err != null) {
                this.badRequest(response, err);
                return;
            }
            
            response.statusCode = HttpStatusCodes.OK;
            response.write("[");
            
            readFile(0);
        }.bind(this));
    };
    
    DbProcessor.prototype.getSingle = function (response, entityName, entityId) {
        var relativeFilePath = Path.join(this.dbPath, entityName, Util.format("%s.json", entityId));
        
        Fs.exists(relativeFilePath, function (exists) {
            if (!exists) {
                response.statusCode = HttpStatusCodes.NOT_FOUND;
                response.end();
                return;
            }
            
            Fs.readFile(relativeFilePath, function (err, entityData) {
                if (err != null) {
                    this.badRequest(response, err);
                    return;
                }
                
                response.statusCode = HttpStatusCodes.OK;
                response.end(entityData);
            }.bind(this)) ;
        }.bind(this));
    };
    
    DbProcessor.prototype.postSingle = function (response, entityName, entity) {
        var relativeFolderPath = null;
        var relativeFilePath = null;
        
        entity.id = Uuid.v1();
        
        relativeFolderPath = Path.join(this.dbPath, entityName);
        relativeFilePath = Path.join(relativeFolderPath, Util.format("%s.json", entity.id));
        
        mkdirp(relativeFolderPath, function (mkdirErr) {
            var entityData = null;
            
            if (mkdirErr != null) {
                this.badRequest(response, mkdirErr);
                return;
            }
            
            entityData = JSON.stringify(entity);
            
            Fs.writeFile(relativeFilePath, entityData, function (writeErr) {
                if (writeErr != null) {
                    this.badRequest(response, writeErr);
                    return;
                }
                
                response.statusCode = HttpStatusCodes.CREATED;
                response.setHeader("Location", Util.format("/%s/%s/%s", this.dbName, entityName, entity.id));
                response.write(entityData);
                response.end();
            }.bind(this));
        }.bind(this));
    };
    
    DbProcessor.prototype.putSingle = function (response, entityName, entityId, entity) {
        var relativeFilePath = Path.join(this.dbPath, entityName, Util.format("%s.json", entityId));
        var entityData = null;
        
        entity.id = entityId;
        entityData = JSON.stringify(entity);
        
        Fs.writeFile(relativeFilePath, entityData, function (writeErr) {
            if (writeErr != null) {
                this.badRequest(response, writeErr);
                return;
            }
            
            response.statusCode = HttpStatusCodes.OK;
            response.write(entityData);
            response.end();
        }.bind(this));
    };
    
    DbProcessor.prototype.deleteSingle = function (response, entityName, entityId) {
        var relativeFilePath = Path.join(this.dbPath, entityName, Util.format("%s.json", entityId));
        
        Fs.exists(relativeFilePath, function (exists) {
            if (!exists) {
                response.statusCode = HttpStatusCodes.NOT_FOUND;
                response.end();
                return;
            }
            
            Fs.unlink(relativeFilePath, function (err) {
                if (err != null) {
                    this.badRequest(response, err);
                    return;
                }
                
                response.statusCode = HttpStatusCodes.OK;
                response.end();
            }.bind(this)) ;
        }.bind(this));
    };
    
    DbProcessor.prototype.getEntityName = function (url) {
        var match = (new RegExp("^/?[^/]+?/([^/?]+)")).exec(url.pathname);
        
        if (match == null)
            throw "Expected entity name in URL.";
        
        return match[1];
    };
    
    DbProcessor.prototype.getEntityId = function (url, allowNull) {
        var match = (new RegExp("^/?[^/]+?/[^/]+?/([^/?]+)")).exec(url.pathname);
        
        if (match != null)
            return match[1];
            
        if (allowNull !== true)
            throw "Expected entity identifier in URL.";
        
        return null;
    };
    
    DbProcessor.prototype.readRequestBody = function (request, callback) {
        var rawData = "";
        
        request.on("data", function (chunk) {
            rawData += chunk;
        });
        request.on("end", function () {
            callback(rawData);
        }.bind(this));
    };
    
    DbProcessor.prototype.readAndParseRequestBody = function (request, callback) {
        this.readRequestBody(request, function (rawData) {
           var data = JSON.parse(rawData);
           
           callback(data);
        }.bind(this));
    };
    
    DbProcessor.prototype.badRequest = function (response, err) {
        response.statusCode = HttpStatusCodes.BAD_REQUEST;
        response.end(err.toString());
    };
    
    DbProcessor.parseSearch = function (querystring) {
        if (querystring == null)
            return null;
        
        var dict = Querystring.parse(querystring);
        var searchParameter = dict[DbProcessor.SearchKeys.search];
        var search = { };
        
        if (searchParameter != null) {
            try {
                searchParameter = JSON.parse(searchParameter);
            }
            catch (err) {
                throw Util.format("Parameter \"&s\" could not be parsed as JSON: %s", DbProcessor.SearchKeys.search, err);
            }
            
            for (var key in searchParameter) {
                var criteria = searchParameter[key];
                
                try {
                    DbProcessor.validateCriteria(criteria);
                }
                catch (err) {
                    throw Util.format("Search criteria for \"%s\" could not be validated: %s", key, err);
                }
                
                search[key] = criteria;
            }
        }
        
        for (var key in dict) {
            // Only parse keys which are not "special".
            if (DbProcessor.SearchKeys[key] == null) {
                var criteria = DbProcessor.parseCriteria(key, dict[key]);
                
                if (criteria != null) {
                    try {
                        DbProcessor.validateCriteria(criteria);
                    }
                    catch (err) {
                        throw Util.format("Search criteria for \"%s\" could not be validated: %s", key, err);
                    }
                    
                    search[key] = criteria;
                }
            }
        }
        
        return search;
    };
    
    DbProcessor.parseCriteria = function (key, value) {
        var match = /^(.+?)(?::(.+))?$/.exec(key);
        
        if (match != null) {
            var fieldName = match[1];
            var operatorName = match[2];
            
            return DbProcessor.makeCriteria(fieldName, operatorName, value);
        }
        
        return null;
    };
    
    DbProcessor.makeCriteria = function (fieldName, operatorName, rawValue) {
        var operator = (DbProcessor.SearchOperators[operatorName] || DbProcessor.SearchOperators.equals);
        var value = (operator.parseValue ? operator.parseValue(rawValue) : rawValue);
        
        return {
            fieldName: fieldName,
            operator: operator,
            value: value
        };
    };
    
    DbProcessor.validateCriteria = function (criteria) {
        if (criteria == null)
            throw "Search criteria is null.";
        
        if (criteria.fieldName == null)
            throw "Search criteria has null field name.";
        
        if (criteria.operator == null)
            throw "Search criteria has null operator.";
        
        if (criteria.operator.validate != null)
            criteria.operator.validateValue(criteria.value);
    };
    
    DbProcessor.SearchKeys = {
        search: "search"
    };
    
    DbProcessor.SearchOperators = {
        equals: {
            name: "equals",
            predicate: (entity, criteria) => {
                return (entity[criteria.fieldName] == criteria.value);
            }
        }
    };
    
    return DbProcessor;
}();

module.exports = DbProcessor;