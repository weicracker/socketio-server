"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_controller_1 = require("./user.controller");
const router = require("koa-router")();
exports.user = router;
router
    .post('/notifications/groups/member', user_controller_1.default.groupMemberModify)
    .get('/', (cxt, next) => {
    cxt.body = "aaaa";
})
    .get('/user', (cxt, next) => {
    cxt.body = "bbbb";
})
    .get('/chat', (cxt, next) => {
    cxt.body = "bbbb";
});

//# sourceMappingURL=index.js.map
