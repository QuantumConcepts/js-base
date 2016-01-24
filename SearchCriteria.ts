import {SearchOperator} from "./SearchOperator";

export class SearchCriteria {
    public fieldName: string;
    public operator: SearchOperator;
    public value: any;

    constructor(fieldName: string, operatorName: string, rawValue: any) {
        var operator = (SearchOperator.get(operatorName) || SearchOperator.default);
        var value = operator.parseValue(rawValue);

        this.fieldName = fieldName;
        this.operator = operator;
        this.value = value;
    }

    public validate(): void {
        if (this.fieldName == null)
            throw Error("Search criteria has null field name.");

        if (this.operator == null)
            throw Error("Search criteria has null operator.");

        this.operator.validateValue(this.value);
    };
    
    public matches(entity: Object): boolean {
        return this.operator.exec(entity, this.fieldName, this.value);
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