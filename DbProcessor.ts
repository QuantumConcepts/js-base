import * as Util            from "util";
import * as Url             from "url";
import * as FS              from "fs";
import * as Path            from "path";
import * as mkdirp          from "mkdirp";
import * as QueryString     from "querystring";
import * as Uuid            from "node-uuid";

import {IDbProcessor}       from "./IDbProcessor";
import {DbCommand}       from "./DbCommand";
import {Config}             from "./Config";
import {Search}             from "./Search";
import {PersistenceError}   from "./PersistenceError";

export class DbProcessor implements IDbProcessor {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    public getSingle(dbCommand: DbCommand, callback: (data: string, err?: string) => any): void {
        FS.exists(dbCommand.getEntityPath(), (exists: boolean) => {
            if (!exists) return callback(null);

            FS.readFile(dbCommand.getEntityPath(), (err: any, entityData: Buffer) => {
                if (err) return callback(null, err);

                callback(entityData.toString());
            });
        });
    }

    public getMany(dbCommand: DbCommand, search: Search, callback: (data: Array<string>, dataErrors: Array<PersistenceError>, err?: any) => any): void {
        var errors = new Array<PersistenceError>();
        
        FS.exists(dbCommand.getEntityRootPath(), (exists: boolean) => {
            if (!exists) return callback(null, errors);

            FS.readdir(dbCommand.getEntityRootPath(), (err: any, filenames: Array<string>) => {
                if (err) return callback(null, errors, err);

                var results = new Array<string>();
                var readFile = (index: number = 0) => {
                    var filename = filenames[index];

                    try {
                        var relativeFilePath = Path.join(dbCommand.getEntityRootPath(), filename);

                        FS.readFile(relativeFilePath, (err: any, buffer: Buffer) => {
                            if (err) throw Error(err);

                            var entityData = buffer.toString();

                            if (search == null || search.test(JSON.parse(entityData)))
                                results.push(entityData);

                            if (index < (filenames.length - 1))
                                readFile(++index);
                            else
                                callback(results, errors);
                        });
                    }
                    catch (err) {
                        var id = (new RegExp("(.+)\.[^\.]+$").exec(filename))[1];

                        errors.push(new PersistenceError(id, err.toString()));
                    }
                };

                readFile();
            });
        });
    }

    public saveSingle(dbCommand: DbCommand, entity: any, callback: (data: string, err?: any) => any): void {
        dbCommand.entityId = (dbCommand.entityId || entity.id || Uuid.v1());
        entity.id = dbCommand.entityId;
        
        mkdirp(dbCommand.getEntityRootPath(), (err: any) => {
            if (err) return callback(null, err);

            var entityData = JSON.stringify(entity);

            FS.writeFile(dbCommand.getEntityPath(), entityData, (err: any) => {
                if (err)
                    throw Error(err);

                callback(entityData);
            });
        });
    }

    public saveMany(dbCommand: DbCommand, entities: Array<any>, callback: (data: Array<string>, errors: Array<PersistenceError>) => any): void {
        var count = entities.length;
        var createdEntities = new Array<any>();
        var errors = new Array<PersistenceError>();

        if (count == 0) return callback(createdEntities, errors);

        var save = (index: number = 0) => {
            var entity = entities[index];

            try {
                this.saveSingle(dbCommand.forEntityId(entity.id), entity, (createdEntityData: string) => {
                    createdEntities.push(createdEntityData);

                    if (index < (count - 1))
                        save(index + 1);
                    else
                        callback(createdEntities, errors);
                });
            }
            catch (err) {
                errors.push(new PersistenceError(entity.id, err));
            }
        };

        save();
    }

    public deleteSingle(dbCommand: DbCommand, callback: (err?: string) => any): void {
        var entityPath = dbCommand.getEntityPath();
        
        FS.exists(entityPath, (exists: boolean) => {
            if (!exists) return callback();

            FS.unlink(entityPath, (err: any) => {
                if (err) return callback(err);

                callback();
            });
        });
    }

    public deleteMany(dbCommand: DbCommand, ids: Array<string>, callback: (deletedIds: Array<string>, errors: Array<PersistenceError>) => any): void {
        var count = ids.length;
        var deletedIds = new Array<any>();
        var errors = new Array<PersistenceError>();

        if (count == 0) return callback(deletedIds, errors);

        var save = (index: number = 0) => {
            var id = ids[index];

            try {
                this.deleteSingle(dbCommand.forEntityId(id), () => {
                    deletedIds.push(id);

                    if (index < (count - 1))
                        save(index + 1);
                    else
                        callback(deletedIds, errors);
                });
            }
            catch (err) {
                errors.push(new PersistenceError(id, err));
            }
        };

        save();
    }
}