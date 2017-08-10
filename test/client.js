var io = require('socket.io-client');
var socket = io("http://localhost:8080" ,{
    "reconnect": true,
    "auto connect": true,
    "force new connection": true
})
socket.on('connect', function () {
    console.log("connect 连接成功")
});
socket.on('disconnect', function () {
    console.log("disconnect")
    clearInterval(timer)
});
socket.on("connect_error", () => {
    console.log('connect_error')
})
var i = 0;
var timer = setInterval(() => {
    socket.emit("msg", {
        name:"jiwei",
        message:"jiwei向msg发送消息" + new Date().toLocaleString()
    })
    console.log(i++)
}, 2000)
socket.on('msg', function (data) {
    console.log("接收到" + JSON.stringify(data));
    console.log('ceshi返回');
});