export interface ISearchOperatorExecutor {
    (entity: Object, fieldName: string, value: any): boolean;
}