import {AppInfo} from "./AppInfo";
import {Config} from "./Config";
import {DbProcessor} from "./DbProcessor";
import {HttpServer} from "./HttpServer";

var config = new Config(8080, "./data/");
var dbProcessor = new DbProcessor(config);
var server = new HttpServer(config, dbProcessor);

server.run();