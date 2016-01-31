import * as Mocha from "mocha";
import * as Assert from "assert";
import * as Util from "util";
import {SearchOperatorRegistry} from "../SearchOperatorRegistry";

describe("Search Operator Registry", () => {
    it("can find operator by alias", () => {
        var operator = SearchOperatorRegistry.get("equals");
        
        Assert.notEqual(operator, null);
    });
    
    it("can find operator by secondary alias", () => {
        var operator = SearchOperatorRegistry.get("eq");
        
        Assert.notEqual(operator, null);
    });
    
    it("can resolve operator by alias", () => {
        var operator = SearchOperatorRegistry.resolve("equals");
        
        Assert.notEqual(operator, null);
    });
    
    it("can resolve operator by static instance", () => {
        var operator = SearchOperatorRegistry.resolve(SearchOperatorRegistry.Equals);
        
        Assert.notEqual(operator, null);
    });
});