import {ISingleResult} from "./ISingleResult";
import {IMultiResult} from "./IMultiResult";
import {DbCommand} from "./DbCommand";
import {Search} from "./Search";
import {PersistenceError} from "./PersistenceError";

export interface IDbProcessor {
    getSingle(dbCommand: DbCommand): Promise<SingleResult>;
    getMany(dbCommand: DbCommand, search: Search): Promise<MultiResult>;
    saveSingle(dbCommand: DbCommand, entity: any): Promise<SingleResult>;
    saveMany(dbCommand: DbCommand, entities: Array<any>): Promise<MultiResult>;
    deleteSingle(dbCommand: DbCommand): Promise<SingleResult>;
    deleteMany(dbCommand: DbCommand): Promise<MultiResult>;
}