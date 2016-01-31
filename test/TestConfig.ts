import * as Util from "util";
import {ArgumentNullError} from "../ArgumentNullError";

export class TestConfig {
    public dataPath: string;
    public relativeDataPath: string;
    public dbName: string;
    
    public constructor(dataPath: string, dbName: string){
        if (!dataPath) throw new ArgumentNullError("dataPath");
        if (!dbName) throw new ArgumentNullError("dbName");
        
        this.dataPath = dataPath;
        this.relativeDataPath = Util.format("../%s", dataPath);
        this.dbName = dbName;
    }
    
    public static instance = new TestConfig("data", "mocha_test");
}