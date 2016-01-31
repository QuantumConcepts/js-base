import * as Mocha from "mocha";
import * as Assert from "assert";
import * as Util from "util";
import {Search} from "../Search";

describe("Search", function () {
    it("can parse simple query-string search", function () {
        var expected = {
            firstName: {
                fieldName: "firstName",
                operator: "equals",
                value: "Jim"
            }
        };
        var actual = Search.parse({
            firstName: expected.firstName.value
        });
        
        Assert.notEqual(actual, null);
        Assert.notEqual(actual.criteria[0], null);
        Assert.notEqual(actual.criteria[0].operator, null);
        Assert.equal(actual.criteria[0].fieldName, expected.firstName.fieldName);
        Assert.equal(actual.criteria[0].operator.aliases.indexOf(expected.firstName.operator) >= 0, true);
        Assert.equal(actual.criteria[0].value, expected.firstName.value);
    });
    
    it("can parse simple JSON search", function () {
        var expected = {
            firstName: {
                fieldName: "firstName",
                operator: "equals",
                value: "Jim"
            }
        };
        var actual = Search.parse({
            search: JSON.stringify(expected)
        });
        
        Assert.notEqual(actual, null);
        Assert.notEqual(actual.criteria[0], null);
        Assert.notEqual(actual.criteria[0].operator, null);
        Assert.equal(actual.criteria[0].fieldName, expected.firstName.fieldName);
        Assert.equal(actual.criteria[0].operator.aliases.indexOf(expected.firstName.operator) >= 0, true);
        Assert.equal(actual.criteria[0].value, expected.firstName.value);
    });
});