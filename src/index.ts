import * as Koa from "koa";
import { connection } from "./db/index";
import { service } from "./service/index";
import * as socketio from "socket.io";
import * as http from "http";
import * as bodyParse from "koa-body"
import { ConfigManager } from "./config/index";
import { UserModel } from "./service/socketio/user/model/index";
import { routerRef } from "./routes/index";
const port: number = ConfigManager.Instance.port;
const app: Koa = new Koa();

const socketServer = http.createServer(app.callback());
const io: SocketIO.Server = socketio(socketServer);
const db = connection();

// 1.加载中间件
app.use(bodyParse({
    multipart: true,
    json:true
}))
// 2.加载路由接口
routerRef(app);
// 3. 初始化user模块数据库
UserModel.Instance.init(db);
socketServer.listen(port);
// 4. 监听socket客户端连接事件
io.on("connection", socket => {
    //当有新用户加入聊天时，初始化当前用户模块
    const userModule = new service.UserModule();
    userModule.init(io, socket).then(ret => {
        if (ret) {
            userModule.allowUserConnect();
        } else {
            socket.disconnect();
        }
    }).catch(rej => {
        console.log(rej)
    })
})
console.log("socketio server runner " + port);


