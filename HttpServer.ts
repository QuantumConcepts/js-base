import * as Http from "http";
import * as Path from "path";
import * as Util from "util";
import * as Url  from "url";
import * as FS   from "fs";
import * as HttpStatusCodes from "http-status-codes";

import {IServer} from "./IServer";
import {AppInfo} from "./AppInfo";
import {Config} from "./Config";
import {IDbProcessor} from "./IDbProcessor";
import {DbCommand} from "./DbCommand";
import {Search} from "./Search";
import {IErrorCallback} from "./IErrorCallback";
import {ArgumentNullError} from "./ArgumentNullError";

export class HttpServer implements IServer {
    private actionMap = {
        "GET": this.processGetAction.bind(this),
        "POST": this.processPostAction.bind(this),
        "PUT": this.processPutAction.bind(this),
        "DELETE": this.processDeleteAction.bind(this)
    };
    private appInfo: AppInfo = new AppInfo("js-base", "0.0.1-beta");
    private config: Config;
    private server: Http.Server;
    private dbProcessor: IDbProcessor;

    constructor(config: Config, dbProcessor: IDbProcessor) {
        if (!config) throw new ArgumentNullError("config");
        if (!dbProcessor) throw new ArgumentNullError("dbProcessor");
        
        this.config = config;
        this.dbProcessor = dbProcessor;
        this.server = Http.createServer(this.handleRequest.bind(this));
    }

    public run(): void {
        this.server.listen(this.config.port, () => {
            console.log("Server listening on port %s.", this.config.port);
        });
    }
    
    public stop(): void {
        this.server.close();
    }

    private handleRequest(request: Http.IncomingMessage, response: Http.ServerResponse) {
        if ("/" == request.url) {
            response.statusCode = HttpStatusCodes.OK;
            response.write(Util.format("%s v%s", this.appInfo.name, this.appInfo.version));
            response.end();
            return;
        }
        else
            this.processDbRequest(request, response);
    }

    private processDbRequest(request: Http.IncomingMessage, response: Http.ServerResponse) {
        var dbCommand = DbCommand.parseRequest(this.config.dataPath, request);
        var dbPath = dbCommand.getDbRootPath();
        var dbReady = () => {
            var action = this.actionMap[request.method];

            if (action == null)
                throw Error(Util.format("Unhandled method '%s'.", request.method));

            try {
                action(dbCommand, request, response);
            }
            catch (err) {
                this.badRequest(response, err);
            }
        };

        FS.exists(dbPath, (exists: boolean) => {
            if (!exists)
                FS.mkdir(dbPath, 770, () => dbReady());
            else
                dbReady();
        });
    }

    private processGetAction(dbCommand: DbCommand, request: Http.IncomingMessage, response: Http.ServerResponse) {
        if (!dbCommand.hasEntityId()) {
            var search = Search.parseString(dbCommand.query);

            this.dbProcessor.getMany(dbCommand, search, (data: Array<string>) => {
                response.statusCode = HttpStatusCodes.OK;
                response.write("[");

                data.forEach((item, index) => {
                    response.write(item);

                    if (index < (data.length - 1))
                        response.write(",");
                });

                response.end("]");
            });
        }
        else {
            this.dbProcessor.getSingle(dbCommand, (data: string) => {
                if (data) {
                    response.statusCode = HttpStatusCodes.OK;
                    response.end(data);
                }
                else {
                    response.statusCode = HttpStatusCodes.NOT_FOUND;
                    response.end();
                }
            });
        }
    }

    private processPostAction(dbCommand: DbCommand, request: Http.IncomingMessage, response: Http.ServerResponse) {
        this.readAndParseRequestBody(request, (entity: any) => {
            if (entity == null) {
                this.badRequest(response, "Could not parse payload as JSON.");
                return;
            }

            this.dbProcessor.saveSingle(dbCommand, entity, (data: string) => {
                response.statusCode = HttpStatusCodes.CREATED;
                response.setHeader("Location", Util.format("/%s/%s/%s", dbCommand.dbName, dbCommand.entityName, entity.id));
                response.end(data);
            });
        }, (err: any) => this.badRequest(response, err));
    }

    private processPutAction(dbCommand: DbCommand, request: Http.IncomingMessage, response: Http.ServerResponse) {
        this.readAndParseRequestBody(request, (entity: any) => {
            if (entity == null) {
                this.badRequest(response, "Could not parse payload as JSON.");
                return;
            }

            // TODO Add config option to optionally perform/enforce this.
            if (entity.id != null && entity.id != dbCommand.entityId) {
                this.badRequest(response, "The entity identifier in the URL must match that of the entity in the request body.");
                return;
            }

            this.dbProcessor.saveSingle(dbCommand, entity, (data: string) => {
                response.statusCode = HttpStatusCodes.OK;
                response.end(data);
            });
        }, (err: any) => this.badRequest(response, err));
    }

    private processDeleteAction(dbCommand: DbCommand, request: Http.IncomingMessage, response: Http.ServerResponse) {
        this.dbProcessor.deleteSingle(dbCommand, () => {
            response.statusCode = HttpStatusCodes.OK;
            response.end();
        });
    }

    private readRequestBody(request: Http.IncomingMessage, callback: (rawData: string) => any) {
        var rawData = "";

        request.on("data", (chunk: any) => {
            rawData += chunk;
        });
        request.on("end", () => {
            callback(rawData);
        });
    }

    private readAndParseRequestBody(request: Http.IncomingMessage, callback: (data: any) => any, errorCallback: IErrorCallback) {
        this.readRequestBody(request, (rawData: string) => {
            var data: any = null;
            
            try {
                data = JSON.parse(rawData);
            }
            catch (err) {
                errorCallback(Util.format("Unable to parse request body as JSON. %s", err));
                return;
            }

            callback(data);
        });
    }

    private badRequest(response: Http.ServerResponse, err: any) {
        response.statusCode = HttpStatusCodes.BAD_REQUEST;
        response.end(err.toString());
    }
}