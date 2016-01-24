import {AppInfo} from "./AppInfo";
import {Config} from "./Config";
import {DbProcessor} from "./DbProcessor";
import {HttpServer} from "./HttpServer";

var appInfo = new AppInfo("js-base", "0.0.0");
var config = new Config(8080, "./data/");
var dbProcessor = new DbProcessor(config);
var server = new HttpServer(appInfo, config, dbProcessor);

server.run();