import {ISearchOperatorExecutor} from "./ISearchOperatorExecutor";
import {ArgumentNullError} from "./ArgumentNullError";

export class SearchOperator {
    private static registry = { };

    public static default: SearchOperator;

    public name: string;
    public exec: ISearchOperatorExecutor;
    public parseValue: (value: any) => any;
    public validateValue: (value: any) => void;

    constructor(name: string, exec: ISearchOperatorExecutor);
    constructor(name: string, exec: ISearchOperatorExecutor, parseValue: (value: any) => any)
    constructor(name: string, exec: ISearchOperatorExecutor, parseValue: (value: any) => any = null, validateValue: (value: any) => void = null) {
        ArgumentNullError.check(name, "name");
        ArgumentNullError.check(exec, "exec");
        
        this.name = name;
        this.exec = this.wrapExec(exec);

        if (parseValue != null)
            this.parseValue = parseValue;
        else
            this.parseValue = (value: any) => { return value; };

        if (validateValue != null)
            this.validateValue = validateValue;
        else
            this.validateValue = (value: any) => { };
    }
    
    private wrapExec(exec: ISearchOperatorExecutor): ISearchOperatorExecutor {
        return (entity: Object, fieldName: string, value: any) => {
            if (entity.hasOwnProperty(fieldName))
                return exec(entity, fieldName, value);
            
            return true;
        };
    }

    public static add(operator: SearchOperator): void {
        SearchOperator.registry[operator.name] = operator;
    }

    public static get(name: string): SearchOperator {
        return SearchOperator.registry[name];
    }
}

SearchOperator.default = new SearchOperator("equals",
    (entity: Object, fieldName: string, value: any): boolean => {
        return (entity[fieldName] == value);
    });
SearchOperator.add(SearchOperator.default);