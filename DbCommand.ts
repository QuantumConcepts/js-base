import * as Http from "http";
import * as Util from "util";
import * as Url  from "url";
import * as Path from "path";
import {ArgumentNullError} from "./ArgumentNullError";

export class DbCommand {
    private dataPath: string;
    
    public dbName: string;
    public entityName: string;
    public entityId: string;
    public query: any;
    
    constructor(dataPath: string, dbName: string, entityName?: string, entityId?: string, query?: any) {
        if (!dataPath) throw new ArgumentNullError("dataPath");
        if (!dbName) throw new ArgumentNullError("dbName");
        
        this.dataPath = dataPath;
        this.dbName = dbName;
        this.entityName = entityName;
        this.entityId = entityId;
        this.query = query;
    }
    
    public getDbRootPath(): string {
        return Path.join(this.dataPath, this.dbName)
    }
    
    public getEntityRootPath(): string {
        return Path.join(this.getDbRootPath(), this.entityName)
    }
    
    public getEntityPath(): string {
        return Path.join(this.getEntityRootPath(), this.getFilenameForEntity(this.entityId))
    }
    
    public getFilenameForEntity(id: string) {
        return Util.format("%s.json", id);
    }
    
    public hasEntityName(): boolean {
        return (this.entityName != null);
    }
    
    public hasEntityId(): boolean {
        return (this.hasEntityName() && this.entityId != null);
    }
    
    public forEntityId(id: string): DbCommand {
        return new DbCommand(this.dataPath, this.dbName, this.entityName, id, this.query);
    }
    
    public static parseRequest(dataPath: string, request: Http.IncomingMessage): DbCommand {
        var url = Url.parse(request.url);
        var match = /^\/?([^/?]+)(?:\/([^/?]+))?(?:\/([^/?]+))?/.exec(url.path);

        if (match != null) {
            var dbName = match[1];
            var entityName = match[2];
            var entityId = match[3];
            var dbCommand = new DbCommand(dataPath, dbName, entityName, entityId, url.query);
            
            return dbCommand;
        }
    }
}