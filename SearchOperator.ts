import {ISearchOperatorExecutor} from "./ISearchOperatorExecutor";
import {ArgumentNullError} from "./ArgumentNullError";

export class SearchOperator {
    private static Registry = { };

    public aliases: Array<string>;
    public exec: ISearchOperatorExecutor;
    public parseValue: (value: any) => any;
    public validateValue: (value: any) => void;

    constructor(aliases: string|Array<string>, exec: ISearchOperatorExecutor, parseValue: (value: any) => any = null, validateValue: (value: any) => void = null) {
        ArgumentNullError.check(aliases, "aliases");
        ArgumentNullError.check(exec, "exec");
        
        this.aliases = (Array.isArray(aliases) ? aliases : [aliases]);
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
    
    public getName(): string {
        return this.aliases[0];
    }
}