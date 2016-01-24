import * as Mocha from "mocha";
import * as Assert from "assert";
import * as Util from "util";
import {Config} from "../Config";
import {DbProcessor} from "../DbProcessor";
import {DbCommand} from "../DbCommand";
import {Search} from "../Search";
import {PersistenceError} from "../PersistenceError";
import {TestConfig} from "./TestConfig";

var testConfig = TestConfig.instance;
var config = new Config(60001, testConfig.relativeDataPath);
var dbProcessor = new DbProcessor(config);

describe("DB Processor", function () {
    it("can save single new entity", (done) => {
        var cmd = new DbCommand(testConfig.dataPath, testConfig.dbName, "people");
        var entity = makeEntity();
        
        dbProcessor.saveSingle(cmd, entity, (data: string, err: string) => {
            if (err) throw Error(err);
            
            var savedEntity = JSON.parse(data)
            
            Assert.equal(savedEntity.firstName, entity.firstName);
            Assert.equal(savedEntity.lastName, entity.lastName);
            
            done();
        })
    });
    
    it("can save multiple new entities", (done) => {
        var cmd = new DbCommand(testConfig.dataPath, testConfig.dbName, "people");
        var entities = makeEntities(10);
        
        dbProcessor.saveMany(cmd, entities, (data: Array<string>, errs: Array<PersistenceError>) => {
            if (errs.length > 0) throw Error(errs.toString());
            
            Assert.equal(data.length, entities.length);
            
            for (var i = 0; i < data.length; i++) {
                var savedEntity = JSON.parse(data[i])
                
                Assert.equal(savedEntity.firstName, entities[i].firstName);
                Assert.equal(savedEntity.lastName, entities[i].lastName);
            }
            
            done();
        })
    });
});

function makeEntities(count: number, seed: number = 0): Array<any> {
    var entities = new Array<any>();
    
    for (var i = 0; i < count; i++)
        entities.push(makeEntity(seed + i));
    
    return entities;
}

function makeEntity(seed: number = 0): any {
    return {
        firstName: "Person" + seed,
        lastName: "Person" + seed,
        age: (10 + seed)
    };
}