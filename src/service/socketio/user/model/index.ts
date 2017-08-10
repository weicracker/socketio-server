import * as mysql from "mysql"
import { ConfigManager } from "../../../../config/index";
import * as uuid from "uuid";
import * as moment from "moment";
interface userByUseridVO {
    id: string,
    connected: number,
    userid: string,
    clientid: string
}
interface ConverBySourceVO {
    id: string,
    count: string,
    ownerID: string,
    sourceClientID: string,
    type: string,
    updataTime: string
}
interface offlineMsgVO {
    sourceClientID: string,
    targetClientID: string,
    msgContent: string,
    msgApp: string,
    type: string,
    messageType: string,
    receiveUser: string,
    chatId: string,
    createTime: string
    sourceName?: string,
    sourceAvatarId?: string
}
interface conversationVO {
    id?: string,
    sourceClientID: string,
    ownerID: string,
    type: string,
    count: number
}
interface groupMembersVO {
    id: string,
    groupid: string,
    memberid: string,
    createtime: string,
    power: string,
    name: string,
    img: string,
    conversation: string,
}

interface chatMessageVO {
    id?: string,
    sourceClientId: string,
    targetClientId: string,
    msgContent: string,
    createTime?: string,
    msgApp: string,
    chatId: string
}
interface groupChatMessageVO {
    id?: string,
    sourceClientId: string,
    groupId: string,
    msgContent: string,
    createTime?: string,
    msgApp: string,
    chatId: string
}

class UserModel {
    private db: mysql.IConnection;
    private static instance: UserModel = null;
    constructor() {

    }
    static get Instance(): UserModel {
        if (null == UserModel.instance) {
            UserModel.instance = new UserModel();
        }
        return UserModel.instance;
    }
    public init(db: mysql.IConnection) {
        this.db = db;
    }
    public get onlineUsers() {
        return
    }
    private get uuid() {
        return uuid.v1();
    }
    private dataTime(): string {
        return moment().format("YYYY-MM-DD HH:mm:ss");
    }
    public set onlineUsers(skt: SocketIOStatic) {
    }
    public userClientInfoDB(userId: string, clientId: string, token: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let connected = 1;
            this.db.query(`INSERT INTO T_CLIENTINFO (id,token,userid,lastconnecteddate,clientid,connected) VALUES ('${this.uuid}','${token}','${userId}','${this.dataTime()}','${clientId}','${connected}')`, (err, result, fieid) => {
                //err ? reject(err) : resolve(true);
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        })
    }
    /**
     * getCurrentOnlineInfoDB
     */
    public findClientByUseridDB(userId: string): Promise<userByUseridVO[]> {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT id,connected,userid,clientid FROM t_clientinfo WHERE userid = '${userId}'`, function (err, results: userByUseridVO[]) {
                err ? reject(err) : resolve(results);
            })
        })
    }
    /**
     * getConverBySource
     */
    public getConverBySourceDB(sourceId: string, ownerId: string, type: string): Promise<ConverBySourceVO[]> {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT id,sourceClientID,ownerID,type,count,updataTime FROM CONVERSATION WHERE SOURCECLIENTID = '${sourceId}' AND OWNERID = '${ownerId}' AND TYPE = '${type}'`, function (err, results: ConverBySourceVO[]) {
                err ? reject(err) : resolve(results);
            })
        })
    }
    /**
     * deleteOnlineStatus
     * 
     */
    public deleteOnlineStatusDB(clientId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.query(`DELETE FROM t_clientinfo WHERE clientid = '${clientId}'`, function (err, results: ConverBySourceVO[]) {
                err ? reject(err) : resolve(true);
            })
        })
    }
    /**
     * insertOfflineMessageDB
     * 新增离线消息
     */
    public insertOfflineMessageDB({sourceClientID,targetClientID,msgContent,msgApp="",type,messageType,receiveUser,chatId,sourceName="",sourceAvatarId=""}: offlineMsgVO): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO CHATMSG_OFFLINE (SOURCECLIENTID,TARGETCLIENTID,MSGCONTENT,CREATETIME,MSGAPP,TYPE,MESSAGETYPE,RECEIVEUSER,CHATID,SOURCENAME,SOURCEAVATARID) VALUES ('${sourceClientID}','${targetClientID}','${msgContent}','${this.dataTime()}','${msgApp}','${type}','${messageType}','${receiveUser}','${chatId}','${sourceName}','${sourceAvatarId}')`, function (err, results: any) {
                err ? reject(err) : resolve(true);
            })
        })
    }
    /**
     * queryOfflineMessageDB
     * 获取离线消息
     */
    public queryOfflineMessageDB(receiveUser: string): Promise<offlineMsgVO[]> {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT sourceClientID,targetClientID,msgContent,createTime,msgApp,type,messageType,chatId,sourceName,sourceAvatarId FROM CHATMSG_OFFLINE WHERE RECEIVEUSER = '${receiveUser}' ORDER BY ROWNUM desc`, function (err, results: offlineMsgVO[]) {
                err ? reject(err) : resolve(results);
            })
        })
    }
    /**
     * removeOfflineMessageDB
     * 删除离线消息
     */
    public removeOfflineMessageDB(receiveUser: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.query(`DELETE FROM CHATMSG_OFFLINE WHERE RECEIVEUSER = '${receiveUser}'`, function (err, results: any) {
                err ? reject(err) : resolve(true);
            })
        })
    }
    /**
     * insertConversationDB
     * 当不存在会话ID，向会话插入信息
     */
    public insertConversationDB(conversation: conversationVO): Promise<string> {
        let uuid: string = this.uuid;
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO CONVERSATION (ID,SOURCECLIENTID,OWNERID,TYPE,COUNT,UPDATATIME) VALUES ('${uuid}','${conversation.sourceClientID}','${conversation.ownerID}','${conversation.type}','${conversation.count}','${this.dataTime()}')`, function (err, results: any) {
                err ? reject(err) : resolve(uuid);
            })
        })
    }
    /**
     * getGroupByIdDB
     */
    public getGroupByIdDB(groupId: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT a.id,a.name,a.img,a.creator,a.count,a.createtime FROM FRGROUP a WHERE ID = '${groupId}' AND a.LOGICDELETE='no'`, function (err, results: any) {
                err ? reject(err) : resolve(results);
            })
        })
    }
    /**
     * selectFrgroupMemberDB
     * 通过群组ID过去群组信息成员信息9个群组头像
     */
    public selectFrgroupMember9DB(groupId: string): Promise<groupMembersVO[]> {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT a.id,a.groupid,a.memberid,a.createtime,a.power,b.name,b.img,a.conversation,IFNULL(a.memberAlias,'') memberAlias FROM (SELECT id,groupid,memberid,createtime,power,conversation,IFNULL(memberAlias,'') memberAlias FROM FRGROUPMEMBER WHERE GROUPID = '${groupId}' LIMIT 9) a LEFT JOIN USER b ON a.memberid = b.ID`, function (err, results: groupMembersVO[]) {
                err ? reject(err) : resolve(results);
            })
        })
    }
    /**
     * selectFrgroupMemberDB
     * 通过群组ID过去群组信息成员信息
     */
    public selectFrgroupMemberDB(groupId: string): Promise<groupMembersVO[]> {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT a.id,a.groupid,a.memberid,a.createtime,a.power,b.name,b.img,a.conversation,IFNULL(a.memberAlias,'') memberAlias FROM (SELECT id,groupid,memberid,createtime,power,conversation,IFNULL(memberAlias,'') memberAlias FROM FRGROUPMEMBER WHERE GROUPID = '${groupId}') a LEFT JOIN USER b ON a.memberid = b.ID`, function (err, results: groupMembersVO[]) {
                err ? reject(err) : resolve(results);
            })
        })
    }
    /**
     * getConverLogBySourceDB
     * 获取历史会话,从历史查找会话ID
     */
    public getConverLogBySourceDB(sourceId: string, ownerId: string, type: string): Promise<conversationVO[]> {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT id,sourceClientID,ownerID,type,count,updataTime FROM CONVERSATION_LOG WHERE SOURCECLIENTID = '${sourceId}' AND OWNERID = '${ownerId}' AND TYPE = '${type}'`, function (err, results: conversationVO[]) {
                err ? reject(err) : resolve(results);
            })
        })
    }
    /**
     * insertConversationLogDB
     * 将会话ID存入数据库及会话信息
     */
    public insertConversationLogDB(conversationLog: conversationVO) {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO CONVERSATION_LOG (ID,SOURCECLIENTID,OWNERID,TYPE,COUNT,UPDATATIME) VALUES ('${conversationLog.id}','${conversationLog.sourceClientID}','${conversationLog.ownerID}','${conversationLog.type}','${conversationLog.count}','${this.dataTime()}')`, function (err, results: any[]) {
                err ? reject(err) : resolve(results);
            })
        })
    }
    /**
     * insertChatMessage
     * 异步存放聊天记录
     */
    public insertChatMessageDB({ chatId, sourceClientId, targetClientId, msgContent, msgApp }: chatMessageVO): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO CHATMSG (CHATID,ID,SOURCECLIENTID,TARGETCLIENTID,MSGCONTENT,CREATETIME,MSGAPP) VALUES ('${chatId}','${this.uuid}','${sourceClientId}','${targetClientId}','${msgContent}','${this.dataTime()}','${msgApp}')`, function (err, results: any[]) {
                err ? reject(err) : resolve(true);
            })
        })
    }
    /**
     * insertGroupChatDB
     * 异步存放群组聊天记录
     */
    public insertGroupChatDB({ chatId, sourceClientId, groupId, msgContent, msgApp }:groupChatMessageVO) {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO FRGROUPSCHAT (CHATID,ID,SOURCECLIENTID,GROUPID,MSGCONTENT,CREATETIME,MSGAPP) VALUES ('${chatId}','${this.uuid}','${sourceClientId}','${groupId}','${msgContent}','${this.dataTime()}','${msgApp}')`, function (err, results: any[]) {
                err ? reject(err) : resolve(true);
            })
        })
    }
}

export { UserModel, userByUseridVO, ConverBySourceVO, offlineMsgVO };