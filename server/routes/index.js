"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../config/index");
const router = require("koa-router")();
const user_1 = require("./user");
function routerRef(app) {
    router.use(index_1.ConfigManager.Instance.prefix, user_1.user.routes(), user_1.user.allowedMethods());
    app.use(router.routes());
}
exports.routerRef = routerRef;

//# sourceMappingURL=index.js.map
