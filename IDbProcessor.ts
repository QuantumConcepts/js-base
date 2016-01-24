import {DbCommand} from "./DbCommand";
import {Search} from "./Search";
import {PersistenceError} from "./PersistenceError";

export interface IDbProcessor {
    getSingle(dbCommand: DbCommand, callback: (data: string) => any): void;
    getMany(dbCommand: DbCommand, search: Search, callback: (data: Array<string>, errors: Array<PersistenceError>) => any): void;
    saveSingle(dbCommand: DbCommand, entity: any, callback: (data: string) => any): void;
    saveMany(dbCommand: DbCommand, entities: Array<any>, callback: (data: Array<string>, errors: Array<PersistenceError>) => any): void;
    deleteSingle(dbCommand: DbCommand, callback: () => any): void;
    deleteMany(dbCommand: DbCommand, ids: Array<string>, callback: (ids: Array<string>, errors: Array<PersistenceError>) => any): void;
}