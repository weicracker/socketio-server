"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
const index_1 = require("../config/index");
function connection() {
    let connection = mysql.createConnection(index_1.ConfigManager.Instance.mysqlConfig);
    return connection;
}
exports.connection = connection;

//# sourceMappingURL=index.js.map
