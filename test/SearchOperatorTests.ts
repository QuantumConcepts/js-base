import * as Mocha from "mocha";
import * as Assert from "assert";
import * as Util from "util";
import {Search} from "../Search";
import {IDbProcessor} from "../IDbProcessor";
import {DbCommand} from "../DbCommand";
import {SearchCriteria} from "../SearchCriteria";
import {SearchOperatorRegistry} from "../SearchOperatorRegistry";
import {PersistenceError} from "../PersistenceError";

var testData = [
    { id: 1, firstName: "Jim", lastName: "Smythe", dob: new Date(1980, 5, 10), sex: "male" },
    { id: 2, firstName: "Tammie", lastName: "Smythe", dob: new Date(1950, 12, 24), sex: "female" },
    { id: 3, firstName: "Adam", lastName: "Allen", dob: null, sex: "male" },
    { id: 4, firstName: "Erica", lastName: "Wilson", dob: null, sex: null }
];
var mockDbProcessor = <IDbProcessor>{
    getMany: function(dbCommand: DbCommand, search: Search, callback: (data: Array<string>, errors?: Array<PersistenceError>) => any): void {
        var results = new Array<string>();
        
        for (var i = 0; i < testData.length; i++) {
            var entity = testData[i];
            var isMatch = search.test(entity);
            
            if (isMatch)
                results.push(JSON.stringify(entity));
        }
        
        callback(results);
    }
};
var mockDbCommand = <DbCommand>{ };

describe("Search Operator", function () {
    it("can filter by 'equals'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("firstName", SearchOperatorRegistry.Equals, "Jim"));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1], done);
        });
    });
    
    it("can filter by 'equals' with null value", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.Equals, null));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [3, 4], done);
        });
    });
    
    it("can filter by 'equals' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("firstName", SearchOperatorRegistry.Equals, "Jim", true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [2, 3, 4], done);
        });
    });
    
    it("can filter by 'not-equals'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("firstName", SearchOperatorRegistry.NotEquals, "Jim"));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [2, 3, 4], done);
        });
    });
    
    it("can filter by 'not-equals' with null value", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.NotEquals, null));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1, 2], done);
        });
    });
    
    it("can filter by 'not-equals' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("firstName", SearchOperatorRegistry.NotEquals, "Jim", true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1], done);
        });
    });
    
    it("can filter by 'regex'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("firstName", SearchOperatorRegistry.Matches, /m/));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1, 2, 3], done);
        });
    });
    
    it("can filter by 'regex' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("firstName", SearchOperatorRegistry.Matches, /m/, true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [4], done);
        });
    });
    
    it("can filter by 'less-than'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.LessThan, new Date(1980, 5, 10)));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [2], done);
        });
    });
    
    it("can filter by 'less-than' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.LessThan, new Date(1980, 5, 10), true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1, 3, 4], done);
        });
    });
    
    it("can filter by 'less-than-equal'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.LessThanOrEqual, new Date(1980, 5, 10)));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1, 2], done);
        });
    });
    
    it("can filter by 'less-than-equal' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.LessThanOrEqual, new Date(1980, 5, 10), true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [3, 4], done);
        });
    });
    
    it("can filter by 'greater-than'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.GreaterThan, new Date(1980, 5, 10)));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [], done);
        });
    });
    
    it("can filter by 'greater-than' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.GreaterThan, new Date(1980, 5, 10), true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1, 2, 3, 4], done);
        });
    });
    
    it("can filter by 'greater-than-equal'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.GreaterThanOrEqual, new Date(1980, 5, 10)));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1], done);
        });
    });
    
    it("can filter by 'greater-than-equal' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("dob", SearchOperatorRegistry.GreaterThanOrEqual, new Date(1980, 5, 10), true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [2, 3, 4], done);
        });
    });
    
    it("can filter by 'in'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("lastName", SearchOperatorRegistry.In, ["Allen", "Wilson"]));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [3, 4], done);
        });
    });
    
    it("can filter by 'in' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("lastName", SearchOperatorRegistry.In, ["Allen", "Wilson"], true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1 ,2], done);
        });
    });
    
    it("can filter by 'not-in'", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("lastName", SearchOperatorRegistry.NotIn, ["Allen", "Wilson"]));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [1, 2], done);
        });
    });
    
    it("can filter by 'not-in' (inverse)", function (done) {
        var search = new Search();
        
        search.criteria.push(new SearchCriteria("lastName", SearchOperatorRegistry.NotIn, ["Allen", "Wilson"], true));
        mockDbProcessor.getMany(mockDbCommand, search, (data: Array<string>) => {
            assertTestData(data, [3, 4], done);
        });
    });
});

function assertTestData(data: Array<string>, expectedIds: Array<number>, done: () => any): void {
    var dataIds = new Array<number>();
    var unexpectedIds = new Array<number>();
    var missingIds = new Array<number>();
    
    for (var i = 0; i < data.length; i++)
        dataIds.push(JSON.parse(data[i]).id);
        
    Assert.deepEqual(dataIds, expectedIds);
    
    done();
}