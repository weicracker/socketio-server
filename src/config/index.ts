class ConfigManager {
    private serverPort: number = 8081;
    public aspApi: string = "";
    public prefix: string = "/aspchat";
    private static instance: ConfigManager = null;
    constructor() {
    }
    static get Instance(): ConfigManager {
        if (null == ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    public get port(): number {
        return this.serverPort;
    }
    public set port(port: number) {
        this.serverPort = port;
    }
    public get mysqlConfig() {
        return {
            database: "bjasp",
            user: "root",
            password: "123456",
            host: '10.0.37.11',
            port: 3306
        }
    }
}

export { ConfigManager };