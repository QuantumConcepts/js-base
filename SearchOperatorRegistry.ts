import * as Util from "util";
import {SearchOperator} from "./SearchOperator";
import {ISearchOperatorExecutor} from "./ISearchOperatorExecutor";

export module SearchOperatorRegistry {
    export var Equals = add(["equals", "eq"], (entity: Object, fieldName: string, value: any): boolean => {
        return (entity[fieldName] == value);
    });
    
    export var NotEquals = add(["not-equals", "neq"], (entity: Object, fieldName: string, value: any): boolean => {
        return !Equals.exec(entity, fieldName, value);
    });
    
    export var Matches = add(["matches", "regex", "re"], (entity: Object, fieldName: string, value: any): boolean => {
        var regexp = <RegExp>value;
        
        return (regexp.exec(entity[fieldName]) != null);
    }, (value: any) => new RegExp(value));
    
    export var NotMatches = add(["not-matches", "not-regex", "nre"], (entity: Object, fieldName: string, value: any): boolean => {
        return !Matches.exec(entity, fieldName, value);
    }, (value: any) => new RegExp(value));
    
    export var LessThan = add(["less-than", "lt"], (entity: Object, fieldName: string, value: any): boolean => {
        var entityValue = entity[fieldName];
        
        return (entityValue != null && entityValue < value);
    });
    
    export var LessThanOrEqual = add(["less-than-equal", "lte"], (entity: Object, fieldName: string, value: any): boolean => {
        var entityValue = entity[fieldName];
        
        return (entityValue != null && entityValue <= value);
    });
    
    export var GreaterThan = add(["greater-than", "gt"], (entity: Object, fieldName: string, value: any): boolean => {
        var entityValue = entity[fieldName];
        
        return (entityValue != null && entityValue > value);
    });
    
    export var GreaterThanOrEqual = add(["greater-than-equal", "gte"], (entity: Object, fieldName: string, value: any): boolean => {
        var entityValue = entity[fieldName];
        
        return (entityValue != null && entityValue >= value);
    });
    
    export var In = add("in", (entity: Object, fieldName: string, value: any): boolean => {
        var values = <Array<string>>value;
        
        return (values.indexOf(entity[fieldName]) >= 0);
    }, (value: any) => value.toString().split(","));
    
    export var NotIn = add("not-in", (entity: Object, fieldName: string, value: any): boolean => {
        return !In.exec(entity, fieldName, value);
    }, (value: any) => value.toString().split(","));
    
    export var Default = SearchOperatorRegistry.Equals;

    export function add(aliases: string|Array<string>, exec: ISearchOperatorExecutor, parseValue: (value: any) => any = null, validateValue: (value: any) => void = null): SearchOperator {
        return addOperator(new SearchOperator(aliases, exec, parseValue, validateValue));
    }

    export function addOperator(operator: SearchOperator): SearchOperator {
        operator.aliases.forEach((alias: string) => {
            SearchOperatorRegistry[alias] = operator;
        });
        
        return operator;
    }

    export function get(name: string): SearchOperator {
        return SearchOperatorRegistry[name];
    }
    
    export function resolve(operator: SearchOperator|string): SearchOperator {
        var resolvedOperator: SearchOperator = null;
        
        if (operator == null)
            resolvedOperator = SearchOperatorRegistry.Default;
        else if (operator instanceof SearchOperator)
            resolvedOperator = operator;
        else if (typeof operator === "string")
            resolvedOperator = SearchOperatorRegistry.get(<string>operator);
        
        if (resolvedOperator != null)
            return resolvedOperator;
        
        throw Error(Util.format("Could not resolve operator \"%s\".", operator));
    }
}