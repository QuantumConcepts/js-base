import * as Util from "util";
import {AppInfo} from "../AppInfo";
import {ArgumentNullError} from "../ArgumentNullError";

export class TestConfig {
    public appInfo: AppInfo;
    public dataPath: string;
    public relativeDataPath: string;
    public dbName: string;
    
    public constructor(appInfo: AppInfo, dataPath: string, dbName: string){
        if (!appInfo) throw new ArgumentNullError("appInfo");
        if (!dataPath) throw new ArgumentNullError("dataPath");
        if (!dbName) throw new ArgumentNullError("dbName");
        
        this.appInfo = appInfo;
        this.dataPath = dataPath;
        this.relativeDataPath = Util.format("../%s", dataPath);
        this.dbName = dbName;
    }
    
    public static instance = new TestConfig(
        new AppInfo("js-base-test", "0.0.0"),
        "data",
        "mocha_test");
}