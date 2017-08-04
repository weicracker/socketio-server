import * as Koa from "koa";
import * as socketio from "socket.io";
import * as http from "http";

const port: number = 8080;
const app: Koa = new Koa();

app.use(ctx=>{
    ctx.body = "<h2 style='color:skyblue;'>socketio node server already runner "+port+"</h2>";
})
const socketServer = http.createServer(app.callback());
const io: SocketIO.Server = socketio(socketServer);

socketServer.listen(port);
io.on("connection", socket => {
    
})
console.log("socketio server runner " + port);

