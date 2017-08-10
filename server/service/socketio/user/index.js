"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./service/index");
const index_2 = require("./model/index");
const moment = require("moment");
var msgType;
(function (msgType) {
    msgType["my"] = "my";
    msgType["chat"] = "chat";
})(msgType || (msgType = {}));
var dbcovType;
(function (dbcovType) {
    dbcovType["PTP"] = "PTP";
    dbcovType["PTS"] = "PTS";
})(dbcovType || (dbcovType = {}));
class UserModuleabs {
}
class UserModule {
    static get Instance() {
        if (null == UserModule.instance) {
            UserModule.instance = new UserModule();
        }
        return UserModule.instance;
    }
    init(sktsvr, skt) {
        return __awaiter(this, void 0, void 0, function* () {
            this.skt = skt;
            this.sktsvr = sktsvr;
            this.userService = index_1.UserService.Instance;
            this.model = index_2.UserModel.Instance;
            let ret = yield this.userClientInfo();
            if (ret) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    allowUserConnect() {
        this.pushPTPOfflineMsg();
        this.addEventListenerPTPEvent();
        this.addEventListenerPTSEvent();
        this.addEventListenDestroyGroup();
        this.addEventListenGroupMemberModify();
        this.listenCurUserDisconnect();
    }
    userClientInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let clientId = this.skt.id;
            let token = this.skt.client.request._query.clientid;
            try {
                let user = yield this.userService.getUserId(token);
                let userId = user.userid;
                if (userId) {
                    this.userId = userId;
                    this.userName = user.userName;
                    this.avatarId = user.imgId;
                    this.token = token;
                    yield this.model.userClientInfoDB(userId, clientId, token);
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                console.log(moment().format("MM-DD HH:mm") + "user信息获取失败已拒绝clientId:" + clientId + error);
                return false;
            }
        });
    }
    addEventListenerPTPEvent() {
        this.skt.on("otoevent", (message) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.model.insertChatMessageDB({
                    sourceClientId: message.sourceClientId,
                    targetClientId: message.targetClientId,
                    msgContent: message.msgContent,
                    msgApp: message.msgApp,
                    chatId: message.chatId
                });
            }
            catch (error) {
                console.log("聊天信息插入数据库失败：" + error);
            }
            let sourceClientId = message.sourceClientId;
            let targetClientId = message.targetClientId;
            let onlineCurUser = yield this.model.findClientByUseridDB(sourceClientId);
            let onlineTargetUser = yield this.model.findClientByUseridDB(targetClientId);
            let chatList = yield this.model.getConverBySourceDB(sourceClientId, targetClientId, dbcovType.PTP);
            onlineCurUser.forEach(user => {
                if (user.connected == 1) {
                    this.sendMessagetoPTPevent(user.clientid, Object.assign({}, message, { createTime: moment().format("MM-DD HH:mm") }));
                }
            });
            let sendToTargetMsg = {
                chatId: "",
                msgApp: message.msgApp ? message.msgApp : "",
                msgContent: message.msgContent,
                msgType: msgType.chat,
                sourceClientId: message.targetClientId,
                targetClientId: message.sourceClientId,
                createTime: moment().format("MM-DD HH:mm")
            };
            if (null != chatList && chatList.length > 0) {
                sendToTargetMsg.chatId = chatList[0].id;
            }
            else {
                let converLogList = yield this.model.getConverLogBySourceDB(sourceClientId, targetClientId, dbcovType.PTP);
                if (null != converLogList && converLogList.length > 0) {
                    sendToTargetMsg.chatId = converLogList[0].id;
                }
                else {
                    let conv = {
                        sourceClientID: message.sourceClientId,
                        ownerID: message.targetClientId,
                        type: dbcovType.PTP,
                        count: 0
                    };
                    let chatId = yield this.model.insertConversationDB(conv);
                    yield this.model.insertConversationLogDB(Object.assign({}, conv, { id: chatId }));
                    sendToTargetMsg.chatId = chatId;
                }
            }
            let isTagetUserOnline = false;
            for (let i = 0; i < onlineTargetUser.length; i++) {
                if (onlineTargetUser[i].connected == 1) {
                    isTagetUserOnline = true;
                    this.sendMessagetoPTPevent(onlineTargetUser[i].clientid, sendToTargetMsg);
                }
            }
            if (!isTagetUserOnline) {
                this.PTPofflineMsg(sendToTargetMsg);
            }
        }));
    }
    addEventListenerPTSEvent() {
        this.skt.on("groupChat", (fromGroupMsg) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.model.insertGroupChatDB({
                    sourceClientId: fromGroupMsg.sourceClientId,
                    groupId: fromGroupMsg.groupId,
                    msgContent: fromGroupMsg.msgContent,
                    msgApp: fromGroupMsg.msgApp ? fromGroupMsg.msgApp : "",
                    chatId: fromGroupMsg.chatId
                });
            }
            catch (error) {
                console.log("聊天信息插入数据库失败：" + error);
            }
            let groupId = fromGroupMsg.groupId;
            let groupList = yield this.model.getGroupByIdDB(groupId);
            if (null == groupList || groupList.length == 0)
                return;
            let groupMembersList = yield this.model.selectFrgroupMemberDB(groupId);
            if (null != groupMembersList && groupMembersList.length > 0) {
                groupMembersList.forEach((member) => __awaiter(this, void 0, void 0, function* () {
                    let memberId = member.memberid;
                    let chatIdList = yield this.model.getConverBySourceDB(groupId, memberId, dbcovType.PTS);
                    let groupMsg = {
                        chatId: "",
                        msgApp: fromGroupMsg.msgApp ? fromGroupMsg.msgApp : "",
                        msgContent: fromGroupMsg.msgContent,
                        msgType: memberId == this.userId ? msgType.my : msgType.chat,
                        sourceClientId: fromGroupMsg.sourceClientId,
                        groupId: groupId,
                        sourceAvatarId: this.avatarId,
                        sourceName: this.userName,
                        createTime: moment().format("MM-DD HH:mm")
                    };
                    if (null != chatIdList && chatIdList.length !== 0) {
                        groupMsg.chatId = chatIdList[0].id;
                    }
                    else {
                        let converLogList = yield this.model.getConverLogBySourceDB(groupId, memberId, dbcovType.PTS);
                        if (null != converLogList && converLogList.length > 0) {
                            groupMsg.chatId = converLogList[0].id;
                        }
                        else {
                            let conv = {
                                sourceClientID: groupId,
                                ownerID: memberId,
                                type: dbcovType.PTS,
                                count: 0
                            };
                            let chatId = yield this.model.insertConversationDB(conv);
                            yield this.model.insertConversationLogDB(Object.assign({}, conv, { id: chatId }));
                            groupMsg.chatId = chatId;
                        }
                    }
                    let onlineMemberUser = yield this.model.findClientByUseridDB(memberId);
                    let isMemberOnline = false;
                    for (let i = 0; i < onlineMemberUser.length; i++) {
                        if (onlineMemberUser[i].connected == 1) {
                            isMemberOnline = true;
                            this.sendMessagetoPTSevent(onlineMemberUser[i].clientid, groupMsg);
                        }
                    }
                    if (!isMemberOnline) {
                        this.PTSofflineMsg(groupMsg);
                    }
                }));
            }
        }));
    }
    addEventListenDestroyGroup() {
    }
    addEventListenGroupMemberModify() {
    }
    listenCurUserDisconnect() {
        this.skt.on("disconnect", (reason) => __awaiter(this, void 0, void 0, function* () {
            yield this.model.deleteOnlineStatusDB(this.skt.id);
        }));
    }
    sendMessagetoPTPevent(clientId, message) {
        try {
            this.sktsvr.sockets.connected[clientId].emit("otoevent", message);
        }
        catch (error) {
        }
    }
    sendMessagetoPTSevent(clientId, message) {
        try {
            this.sktsvr.sockets.connected[clientId].emit("groupChat", message);
        }
        catch (error) {
        }
    }
    PTPofflineMsg(sendToTargetMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.insertOfflineMessageDB({
                sourceClientID: sendToTargetMsg.targetClientId,
                targetClientID: sendToTargetMsg.sourceClientId,
                msgContent: sendToTargetMsg.msgContent,
                msgApp: sendToTargetMsg.msgApp,
                type: dbcovType.PTP,
                messageType: sendToTargetMsg.msgType,
                receiveUser: sendToTargetMsg.sourceClientId,
                chatId: sendToTargetMsg.chatId,
                createTime: moment().format("MM-DD HH:mm")
            });
        });
    }
    PTSofflineMsg(groupMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.insertOfflineMessageDB({
                sourceClientID: groupMsg.groupId,
                targetClientID: groupMsg.sourceClientId,
                msgContent: groupMsg.msgContent,
                msgApp: groupMsg.msgApp,
                type: dbcovType.PTS,
                messageType: groupMsg.msgType,
                receiveUser: groupMsg.sourceClientId,
                chatId: groupMsg.chatId,
                createTime: moment().format("MM-DD HH:mm"),
                sourceName: groupMsg.sourceName,
                sourceAvatarId: groupMsg.sourceAvatarId
            });
        });
    }
    pushPTPOfflineMsg() {
        return __awaiter(this, void 0, void 0, function* () {
            let offlineMessageList = yield this.model.queryOfflineMessageDB(this.userId);
            if (null != offlineMessageList && offlineMessageList.length > 0) {
                yield this.model.removeOfflineMessageDB(this.userId);
                offlineMessageList.forEach(offlineMsg => {
                    if (offlineMsg.type == dbcovType.PTP) {
                        let offlineMsgData = {
                            chatId: offlineMsg.chatId,
                            msgApp: offlineMsg.msgApp,
                            msgContent: offlineMsg.msgContent,
                            msgType: offlineMsg.messageType,
                            sourceClientId: offlineMsg.targetClientID,
                            targetClientId: offlineMsg.sourceClientID,
                            createTime: offlineMsg.createTime
                        };
                        this.sendMessagetoPTPevent(this.skt.id, offlineMsgData);
                    }
                    else if (offlineMsg.type == dbcovType.PTS) {
                        let offlineMsgData = {
                            chatId: offlineMsg.chatId,
                            msgApp: offlineMsg.msgApp,
                            msgContent: offlineMsg.msgContent,
                            msgType: offlineMsg.messageType,
                            sourceClientId: offlineMsg.targetClientID,
                            groupId: offlineMsg.sourceClientID,
                            createTime: offlineMsg.createTime,
                            sourceName: offlineMsg.sourceName,
                            sourceAvatarId: offlineMsg.sourceAvatarId
                        };
                    }
                });
            }
        });
    }
}
UserModule.instance = null;
exports.UserModule = UserModule;

//# sourceMappingURL=index.js.map
