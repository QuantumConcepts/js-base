import {SearchOperator} from "./SearchOperator";
import {SearchOperatorRegistry} from "./SearchOperatorRegistry";

export class SearchCriteria {
    public fieldName: string;
    public operator: SearchOperator;
    public value: any;
    public invert = false;

    constructor(fieldName: string, operator: SearchOperator|string, rawValue?: any, invert: boolean = false) {
        var resolvedOperator = SearchOperatorRegistry.resolve(operator);
        var value = resolvedOperator.parseValue(rawValue);

        this.fieldName = fieldName;
        this.operator = resolvedOperator;
        this.value = value;
        this.invert = invert;
    }

    public validate(): void {
        if (this.fieldName == null)
            throw Error("Search criteria has null field name.");

        if (this.operator == null)
            throw Error("Search criteria has null operator.");

        this.operator.validateValue(this.value);
    };
    
    public test(entity: Object): boolean {
        var result = this.operator.exec(entity, this.fieldName, this.value);
        
        if (this.invert)
            result = !result;
        
        return result;
    }

    public static parse(key: string, value: any) {
        var match = /^(.+?)(?::(.+))?$/.exec(key);

        if (match != null) {
            var fieldName = match[1];
            var operatorName = match[2];

            return new SearchCriteria(fieldName, operatorName, value);
        }

        return null;
    };
}