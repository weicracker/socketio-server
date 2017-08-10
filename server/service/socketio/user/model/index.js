"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const moment = require("moment");
class UserModel {
    constructor() {
    }
    static get Instance() {
        if (null == UserModel.instance) {
            UserModel.instance = new UserModel();
        }
        return UserModel.instance;
    }
    init(db) {
        this.db = db;
    }
    get onlineUsers() {
        return;
    }
    get uuid() {
        return uuid.v1();
    }
    dataTime() {
        return moment().format("YYYY-MM-DD HH:mm:ss");
    }
    set onlineUsers(skt) {
    }
    userClientInfoDB(userId, clientId, token) {
        return new Promise((resolve, reject) => {
            let connected = 1;
            this.db.query(`INSERT INTO T_CLIENTINFO (id,token,userid,lastconnecteddate,clientid,connected) VALUES ('${this.uuid}','${token}','${userId}','${this.dataTime()}','${clientId}','${connected}')`, (err, result, fieid) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    findClientByUseridDB(userId) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT id,connected,userid,clientid FROM t_clientinfo WHERE userid = '${userId}'`, function (err, results) {
                err ? reject(err) : resolve(results);
            });
        });
    }
    getConverBySourceDB(sourceId, ownerId, type) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT id,sourceClientID,ownerID,type,count,updataTime FROM CONVERSATION WHERE SOURCECLIENTID = '${sourceId}' AND OWNERID = '${ownerId}' AND TYPE = '${type}'`, function (err, results) {
                err ? reject(err) : resolve(results);
            });
        });
    }
    deleteOnlineStatusDB(clientId) {
        return new Promise((resolve, reject) => {
            this.db.query(`DELETE FROM t_clientinfo WHERE clientid = '${clientId}'`, function (err, results) {
                err ? reject(err) : resolve(true);
            });
        });
    }
    insertOfflineMessageDB({ sourceClientID, targetClientID, msgContent, msgApp = "", type, messageType, receiveUser, chatId, sourceName = "", sourceAvatarId = "" }) {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO CHATMSG_OFFLINE (SOURCECLIENTID,TARGETCLIENTID,MSGCONTENT,CREATETIME,MSGAPP,TYPE,MESSAGETYPE,RECEIVEUSER,CHATID,SOURCENAME,SOURCEAVATARID) VALUES ('${sourceClientID}','${targetClientID}','${msgContent}','${this.dataTime()}','${msgApp}','${type}','${messageType}','${receiveUser}','${chatId}','${sourceName}','${sourceAvatarId}')`, function (err, results) {
                err ? reject(err) : resolve(true);
            });
        });
    }
    queryOfflineMessageDB(receiveUser) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT sourceClientID,targetClientID,msgContent,createTime,msgApp,type,messageType,chatId,sourceName,sourceAvatarId FROM CHATMSG_OFFLINE WHERE RECEIVEUSER = '${receiveUser}' ORDER BY ROWNUM desc`, function (err, results) {
                err ? reject(err) : resolve(results);
            });
        });
    }
    removeOfflineMessageDB(receiveUser) {
        return new Promise((resolve, reject) => {
            this.db.query(`DELETE FROM CHATMSG_OFFLINE WHERE RECEIVEUSER = '${receiveUser}'`, function (err, results) {
                err ? reject(err) : resolve(true);
            });
        });
    }
    insertConversationDB(conversation) {
        let uuid = this.uuid;
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO CONVERSATION (ID,SOURCECLIENTID,OWNERID,TYPE,COUNT,UPDATATIME) VALUES ('${uuid}','${conversation.sourceClientID}','${conversation.ownerID}','${conversation.type}','${conversation.count}','${this.dataTime()}')`, function (err, results) {
                err ? reject(err) : resolve(uuid);
            });
        });
    }
    getGroupByIdDB(groupId) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT a.id,a.name,a.img,a.creator,a.count,a.createtime FROM FRGROUP a WHERE ID = '${groupId}' AND a.LOGICDELETE='no'`, function (err, results) {
                err ? reject(err) : resolve(results);
            });
        });
    }
    selectFrgroupMember9DB(groupId) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT a.id,a.groupid,a.memberid,a.createtime,a.power,b.name,b.img,a.conversation,IFNULL(a.memberAlias,'') memberAlias FROM (SELECT id,groupid,memberid,createtime,power,conversation,IFNULL(memberAlias,'') memberAlias FROM FRGROUPMEMBER WHERE GROUPID = '${groupId}' LIMIT 9) a LEFT JOIN USER b ON a.memberid = b.ID`, function (err, results) {
                err ? reject(err) : resolve(results);
            });
        });
    }
    selectFrgroupMemberDB(groupId) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT a.id,a.groupid,a.memberid,a.createtime,a.power,b.name,b.img,a.conversation,IFNULL(a.memberAlias,'') memberAlias FROM (SELECT id,groupid,memberid,createtime,power,conversation,IFNULL(memberAlias,'') memberAlias FROM FRGROUPMEMBER WHERE GROUPID = '${groupId}') a LEFT JOIN USER b ON a.memberid = b.ID`, function (err, results) {
                err ? reject(err) : resolve(results);
            });
        });
    }
    getConverLogBySourceDB(sourceId, ownerId, type) {
        return new Promise((resolve, reject) => {
            this.db.query(`SELECT id,sourceClientID,ownerID,type,count,updataTime FROM CONVERSATION_LOG WHERE SOURCECLIENTID = '${sourceId}' AND OWNERID = '${ownerId}' AND TYPE = '${type}'`, function (err, results) {
                err ? reject(err) : resolve(results);
            });
        });
    }
    insertConversationLogDB(conversationLog) {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO CONVERSATION_LOG (ID,SOURCECLIENTID,OWNERID,TYPE,COUNT,UPDATATIME) VALUES ('${conversationLog.id}','${conversationLog.sourceClientID}','${conversationLog.ownerID}','${conversationLog.type}','${conversationLog.count}','${this.dataTime()}')`, function (err, results) {
                err ? reject(err) : resolve(results);
            });
        });
    }
    insertChatMessageDB({ chatId, sourceClientId, targetClientId, msgContent, msgApp }) {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO CHATMSG (CHATID,ID,SOURCECLIENTID,TARGETCLIENTID,MSGCONTENT,CREATETIME,MSGAPP) VALUES ('${chatId}','${this.uuid}','${sourceClientId}','${targetClientId}','${msgContent}','${this.dataTime()}','${msgApp}')`, function (err, results) {
                err ? reject(err) : resolve(true);
            });
        });
    }
    insertGroupChatDB({ chatId, sourceClientId, groupId, msgContent, msgApp }) {
        return new Promise((resolve, reject) => {
            this.db.query(`INSERT INTO FRGROUPSCHAT (CHATID,ID,SOURCECLIENTID,GROUPID,MSGCONTENT,CREATETIME,MSGAPP) VALUES ('${chatId}','${this.uuid}','${sourceClientId}','${groupId}','${msgContent}','${this.dataTime()}','${msgApp}')`, function (err, results) {
                err ? reject(err) : resolve(true);
            });
        });
    }
}
UserModel.instance = null;
exports.UserModel = UserModel;

//# sourceMappingURL=index.js.map
