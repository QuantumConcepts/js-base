export interface IServer {
    run(callback?: () => any): void;
    stop(callback?: () => any): void;
}