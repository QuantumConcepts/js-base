export interface IMultiResult {
    entities: Array<string>;
    errors?: Array<PersistenceError>;
}