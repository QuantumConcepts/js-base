import * as Util from "util";

export class PersistenceError {
    public id: string;
    public error: string;

    constructor(id: string, error: string) {
        this.id = id;
        this.error = error;
    }
    
    public toString(): string {
        return Util.format("%s: %s", this.id, this.error);
    }
}