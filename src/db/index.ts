import * as mysql from "mysql"
import { ConfigManager } from "../config/index";
function connection() {
    let connection = mysql.createConnection(ConfigManager.Instance.mysqlConfig);
    return connection;
}
export {connection};