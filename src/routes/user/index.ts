import * as Router from "koa-router"
import controller from "./user.controller";
const router: Router = require("koa-router")();
router
    .post('/notifications/groups/member',controller.groupMemberModify)
    .get('/', (cxt, next) => {
        cxt.body = "aaaa"
    })
    .get('/user', (cxt, next) => {
        cxt.body = "bbbb"
    })
    .get('/chat', (cxt, next) => {
        cxt.body = "bbbb"
    })
export { router as user }