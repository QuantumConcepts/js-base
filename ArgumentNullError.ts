import * as Util from "util";

export class ArgumentNullError extends Error {
    private static DefaultMessage = "This argument must not be null.";
    
    constructor(name: string, message?: string) {
        super(Util.format("%s: %s", name, (message || ArgumentNullError.DefaultMessage)));
    }
    
    public static check(value: any, name: string, message?: string): void {
        if (!value)
            throw new ArgumentNullError(name, message);
    }
}