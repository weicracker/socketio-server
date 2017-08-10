"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConfigManager {
    constructor() {
        this.serverPort = 8081;
        this.aspApi = "http://api.bjsasc.com/";
        this.prefix = "/aspchat";
    }
    static get Instance() {
        if (null == ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    get port() {
        return this.serverPort;
    }
    set port(port) {
        this.serverPort = port;
    }
    get mysqlConfig() {
        return {
            database: "bjasp",
            user: "root",
            password: "123456",
            host: '10.0.37.11',
            port: 3306
        };
    }
}
ConfigManager.instance = null;
exports.ConfigManager = ConfigManager;

//# sourceMappingURL=index.js.map
