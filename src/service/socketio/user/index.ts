import { UserService, User } from "./service/index";
import { UserModel, userByUseridVO, ConverBySourceVO } from "./model/index";
import * as moment from "moment";
enum msgType {
    my = "my",
    chat = "chat"
}
enum dbcovType {
    PTP = "PTP",
    PTS = "PTS"
}
interface chatMessageVO {
    chatId: string,
    msgApp: string,
    msgContent: string,
    msgType: string,
    sourceClientId: string,
    createTime: string
}
interface chatMessagePTPVO extends chatMessageVO {
    targetClientId: string
}
interface chatMessagePTSVO extends chatMessageVO {
    groupId: string,
    sourceName: string,
    sourceAvatarId: string
}

abstract class UserModuleabs {
    abstract init(sktsvr: SocketIO.Server, skt: SocketIO.Socket): void;
}
class UserModule implements UserModuleabs {
    private token: string;
    private userId: string;
    private userName: string;
    private avatarId: string;
    private model: UserModel;
    private static instance: UserModule = null;

    static get Instance(): UserModule {
        if (null == UserModule.instance) {
            UserModule.instance = new UserModule();
        }
        return UserModule.instance;
    }
    private sktsvr: SocketIO.Server;
    private skt: SocketIO.Socket;
    private userService: UserService;

    async init(sktsvr: SocketIO.Server, skt: SocketIO.Socket): Promise<boolean> {
        this.skt = skt;
        this.sktsvr = sktsvr;
        this.userService = UserService.Instance;
        this.model = UserModel.Instance;
        let ret = await this.userClientInfo();
        if (ret) {
            return true;
        } else {
            return false;
        }
    }
    allowUserConnect() {
        // 1.当用户上线时将离线消息推送至用户
        this.pushPTPOfflineMsg();
        // 2.监听当前用户给其他用户发消息事件
        this.addEventListenerPTPEvent();
        // 3.监听当前用户给群组发消息事件
        this.addEventListenerPTSEvent();
        // 4.解散群组通知所有群成员，群组已解散
        this.addEventListenDestroyGroup();
        // 5.当群组成员发送变更时，通知群成员 
        this.addEventListenGroupMemberModify();
        // 6.监听当前用户掉线，将用户在数据库状态设置为离线状态
        this.listenCurUserDisconnect();
    }
    public async userClientInfo(): Promise<boolean> {
        let clientId: string = this.skt.id;
        let token: string = this.skt.client.request._query.clientid;
        try {
            let user: User = await this.userService.getUserId(token);
            let userId: string = user.userid;
            if (userId) {
                // 设置当前链接用户的基本信息
                this.userId = userId;
                this.userName = user.userName;
                this.avatarId = user.imgId;
                this.token = token;
                // 将用户的链接信息存入数据库
                await this.model.userClientInfoDB(userId, clientId, token);
                return true;
            } else {
                return false
            }
        } catch (error) {
            console.log(moment().format("MM-DD HH:mm") + "user信息获取失败已拒绝clientId:" + clientId + error);
            return false;
        }
    }
    /**
     * addEventListenerotovent
     */
    public addEventListenerPTPEvent() {
        this.skt.on("otoevent", async (message: chatMessagePTPVO) => {
            //异步将聊天信息插入数据库
            try {
                this.model.insertChatMessageDB({
                    sourceClientId: message.sourceClientId,
                    targetClientId: message.targetClientId,
                    msgContent: message.msgContent,
                    msgApp: message.msgApp,
                    chatId: message.chatId
                })
            } catch (error) {
                console.log("聊天信息插入数据库失败：" + error);
            }
            let sourceClientId: string = message.sourceClientId;
            let targetClientId: string = message.targetClientId;
            //1.从数据库中获取当前在线的当前用户。2.并获取在线的目标用户
            let onlineCurUser: userByUseridVO[] = await this.model.findClientByUseridDB(sourceClientId);
            let onlineTargetUser: userByUseridVO[] = await this.model.findClientByUseridDB(targetClientId);
            //3.将消息发送给所有在线的当前发送信息的用户（因为考虑到不同终端的问题）
            let chatList: ConverBySourceVO[] = await this.model.getConverBySourceDB(sourceClientId, targetClientId, dbcovType.PTP);
            onlineCurUser.forEach(user => {
                if (user.connected == 1) {
                    this.sendMessagetoPTPevent(user.clientid, {
                        ...message,
                        createTime: moment().format("MM-DD HH:mm")
                    });
                }
            })
            let sendToTargetMsg: chatMessagePTPVO = {
                chatId: "",
                msgApp: message.msgApp ? message.msgApp : "",
                msgContent: message.msgContent,
                msgType: msgType.chat,
                sourceClientId: message.targetClientId,
                targetClientId: message.sourceClientId,
                createTime: moment().format("MM-DD HH:mm")
            }
            if (null != chatList && chatList.length > 0) {
                //4。将要发送给目标用户的消息
                sendToTargetMsg.chatId = chatList[0].id;
            } else {
                //获取会话历史，看看是否存在，存在新增conversation,不存在新增conversation和conversation_log
                let converLogList = await this.model.getConverLogBySourceDB(sourceClientId, targetClientId, dbcovType.PTP);
                if (null != converLogList && converLogList.length > 0) {
                    sendToTargetMsg.chatId = converLogList[0].id;
                } else {
                    //如果chatId不存在,则新建一个会话ID,并存入数据库
                    let conv = {
                        sourceClientID: message.sourceClientId,
                        ownerID: message.targetClientId,
                        type: dbcovType.PTP,
                        count: 0
                    }
                    //如果不存在会话ID则生成一个会话ID并将新鲜存入表内
                    let chatId = await this.model.insertConversationDB(conv)
                    await this.model.insertConversationLogDB({
                        ...conv,
                        id: chatId
                    })
                    sendToTargetMsg.chatId = chatId;
                }
            }
            //5.检测目标用户是否在线
            let isTagetUserOnline = false;
            for (let i = 0; i < onlineTargetUser.length; i++) {
                if (onlineTargetUser[i].connected == 1) {
                    isTagetUserOnline = true;
                    this.sendMessagetoPTPevent(onlineTargetUser[i].clientid, sendToTargetMsg);
                }
            }
            //6.如果目标用户不在线，则将离线数据存入数据库
            if (!isTagetUserOnline) {
                this.PTPofflineMsg(sendToTargetMsg);
            }
        })
    }
    /**
     * addEventListenerPTSEvent
     * 监听当前用户与群组间的会话，对当前用户的群组会话的处理
     */
    public addEventListenerPTSEvent() {
        this.skt.on("groupChat", async (fromGroupMsg: chatMessagePTSVO) => {
            //异步将聊天信息插入数据库
            try {
                this.model.insertGroupChatDB({
                    sourceClientId: fromGroupMsg.sourceClientId,
                    groupId: fromGroupMsg.groupId,
                    msgContent: fromGroupMsg.msgContent,
                    msgApp: fromGroupMsg.msgApp ? fromGroupMsg.msgApp : "",
                    chatId: fromGroupMsg.chatId
                })
            } catch (error) {
                console.log("聊天信息插入数据库失败：" + error);
            }
            let groupId = fromGroupMsg.groupId;
            let groupList = await this.model.getGroupByIdDB(groupId);
            if (null == groupList || groupList.length == 0) return;
            let groupMembersList = await this.model.selectFrgroupMemberDB(groupId);
            if (null != groupMembersList && groupMembersList.length > 0) {
                groupMembersList.forEach(async member => {
                    //将消息发送给群组内所有成员
                    let memberId: string = member.memberid;
                    let chatIdList: ConverBySourceVO[] = await this.model.getConverBySourceDB(groupId, memberId, dbcovType.PTS);
                    //判断chatId是否存在
                    let groupMsg: chatMessagePTSVO = {
                        chatId: "",
                        msgApp: fromGroupMsg.msgApp ? fromGroupMsg.msgApp : "",
                        msgContent: fromGroupMsg.msgContent,
                        msgType: memberId == this.userId ? msgType.my : msgType.chat,
                        sourceClientId: fromGroupMsg.sourceClientId,
                        groupId: groupId,
                        sourceAvatarId: this.avatarId,
                        sourceName: this.userName,
                        createTime: moment().format("MM-DD HH:mm")
                    }
                    if (null != chatIdList && chatIdList.length !== 0) {
                        //如果chatId存在
                        groupMsg.chatId = chatIdList[0].id;
                    } else {
                        //获取会话历史，看看是否存在，存在新增conversation,不存在新增conversation和conversation_log
                        let converLogList = await this.model.getConverLogBySourceDB(groupId, memberId, dbcovType.PTS);
                        if (null != converLogList && converLogList.length > 0) {
                            groupMsg.chatId = converLogList[0].id;
                        } else {
                            //如果chatId不存在,则新建一个会话ID,并存入数据库
                            let conv = {
                                sourceClientID: groupId,
                                ownerID: memberId,
                                type: dbcovType.PTS,
                                count: 0
                            }
                            let chatId = await this.model.insertConversationDB(conv)
                            await this.model.insertConversationLogDB({
                                ...conv,
                                id: chatId
                            })
                            groupMsg.chatId = chatId;
                        }
                    }
                    //检测群组接收方是否在线
                    let onlineMemberUser: userByUseridVO[] = await this.model.findClientByUseridDB(memberId);
                    //如果在线，则向接收方所有终端发送当前会话消息
                    let isMemberOnline = false;
                    for (let i = 0; i < onlineMemberUser.length; i++) {
                        if (onlineMemberUser[i].connected == 1) {
                            isMemberOnline = true;
                            this.sendMessagetoPTSevent(onlineMemberUser[i].clientid, groupMsg);
                        }
                    }
                    if (!isMemberOnline) {
                        //如果不在线，则将当前会话内容存入数据库，当用户上线时，将会话内容发送给用户
                        this.PTSofflineMsg(groupMsg);
                    }
                })
            }
        })
    }
    /**
     * addEventListenDestroyGroup
     * 解散群组
     */
    public addEventListenDestroyGroup() {

    }
    /**
     * addEventListenGroupMemberModify
     * 当群组成员发送变更时，通知群成员 ：
     */
    public addEventListenGroupMemberModify() {

    }
    /**
     * listenCurUserDisconnect
     */
    public listenCurUserDisconnect() {
        //当前终端下线时将此用户从此数据库删除
        this.skt.on("disconnect", async (reason: any) => {
            await this.model.deleteOnlineStatusDB(this.skt.id);
        })
    }
    /**
     * sendMessagetoOtoevent
     */
    public sendMessagetoPTPevent(clientId: string, message: chatMessagePTPVO) {
        try {
            this.sktsvr.sockets.connected[clientId].emit("otoevent", message);
        } catch (error) {
            //当前向将要发送信息的终端用户，此时已下线，需要将此消息存入离线消息数据库，待此用户上线时一并发送给此用户
            //this.PTPofflineMsg(message);
        }
    }
    /**
     * sendMessagetoPTSevent
     */
    public sendMessagetoPTSevent(clientId: string, message: chatMessagePTSVO) {
        try {
            this.sktsvr.sockets.connected[clientId].emit("groupChat", message);
        } catch (error) {
            //当前向将要发送信息的终端用户，此时已下线，需要将此消息存入离线消息数据库，待此用户上线时一并发送给此用户
            //this.PTSofflineMsg(message);
        }
    }
    /**
     * PTPofflineMsg
     * 储存目标用户的个人聊天消息
     */
    public async PTPofflineMsg(sendToTargetMsg: chatMessagePTPVO): Promise<boolean> {
        return await this.model.insertOfflineMessageDB({
            sourceClientID: sendToTargetMsg.targetClientId,
            targetClientID: sendToTargetMsg.sourceClientId,
            msgContent: sendToTargetMsg.msgContent,
            msgApp: sendToTargetMsg.msgApp,
            type: dbcovType.PTP,
            messageType: sendToTargetMsg.msgType,
            receiveUser: sendToTargetMsg.sourceClientId,
            chatId: sendToTargetMsg.chatId,
            createTime: moment().format("MM-DD HH:mm")
        })
    }
    /**
     * PTPofflineMsg
     * 储存目标用户的群组聊天消息
     */
    public async PTSofflineMsg(groupMsg: chatMessagePTSVO): Promise<boolean> {
        return await this.model.insertOfflineMessageDB({
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
        })
    }
    /**
     * pushOfflineMsg
     */
    public async pushPTPOfflineMsg() {
        // 1.查找离线消息
        let offlineMessageList = await this.model.queryOfflineMessageDB(this.userId);
        if (null != offlineMessageList && offlineMessageList.length > 0) {
            // 2.删除数据库存在的当前用户的离线消息
            await this.model.removeOfflineMessageDB(this.userId);
            // 3.将离线消息分条发给用户
            offlineMessageList.forEach(offlineMsg => {
                if (offlineMsg.type == dbcovType.PTP) {
                    let offlineMsgData: chatMessagePTPVO = {
                        chatId: offlineMsg.chatId,
                        msgApp: offlineMsg.msgApp,
                        msgContent: offlineMsg.msgContent,
                        msgType: offlineMsg.messageType,
                        sourceClientId: offlineMsg.targetClientID,
                        targetClientId: offlineMsg.sourceClientID,
                        createTime: offlineMsg.createTime
                    }
                    this.sendMessagetoPTPevent(this.skt.id, offlineMsgData);
                } else if (offlineMsg.type == dbcovType.PTS) {
                    let offlineMsgData: chatMessagePTSVO = {
                        chatId: offlineMsg.chatId,
                        msgApp: offlineMsg.msgApp,
                        msgContent: offlineMsg.msgContent,
                        msgType: offlineMsg.messageType,
                        sourceClientId: offlineMsg.targetClientID,
                        groupId: offlineMsg.sourceClientID,
                        createTime: offlineMsg.createTime,
                        sourceName: offlineMsg.sourceName,
                        sourceAvatarId: offlineMsg.sourceAvatarId
                    }
                }
            })
        }
    }
}
export { UserModule };