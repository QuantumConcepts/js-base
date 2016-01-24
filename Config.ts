export class Config {
    port: number = 8080;
    dataPath: string = ".";
    
    constructor(port: number, dataPath: string) {
        this.port = port;
        this.dataPath = dataPath;
    }
}