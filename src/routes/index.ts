import * as Koa from "koa";
import * as Router from "koa-router"
import { ConfigManager } from "../config/index";
const router:Router = require("koa-router")();

import { user } from "./user";


function routerRef(app: Koa) {
    router.use(ConfigManager.Instance.prefix, user.routes(), user.allowedMethods());
    app.use(router.routes());
}
          
export { routerRef };