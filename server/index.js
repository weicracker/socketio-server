"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Koa = require("koa");
const index_1 = require("./db/index");
const index_2 = require("./service/index");
const socketio = require("socket.io");
const http = require("http");
const bodyParse = require("koa-body");
const index_3 = require("./config/index");
const index_4 = require("./service/socketio/user/model/index");
const index_5 = require("./routes/index");
const port = index_3.ConfigManager.Instance.port;
const app = new Koa();
const socketServer = http.createServer(app.callback());
const io = socketio(socketServer);
const db = index_1.connection();
app.use(bodyParse({
    multipart: true,
    json: true
}));
index_5.routerRef(app);
index_4.UserModel.Instance.init(db);
socketServer.listen(port);
io.on("connection", socket => {
    const userModule = new index_2.service.UserModule();
    userModule.init(io, socket).then(ret => {
        if (ret) {
            userModule.allowUserConnect();
        }
        else {
            socket.disconnect();
        }
    }).catch(rej => {
        console.log(rej);
    });
});
console.log("socketio server runner " + port);

//# sourceMappingURL=index.js.map
