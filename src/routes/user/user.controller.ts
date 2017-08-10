import * as Router from "koa-router"
class UserController {
    static async groupMemberModify(ctx: Router.IRouterContext, next: any) {
        ctx.status = 200;
        console.log(ctx.request.body);
        ctx.body = {data:"success"};
    }
}
export default UserController;