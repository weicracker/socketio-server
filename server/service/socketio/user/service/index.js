"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const index_1 = require("../../../../config/index");
class UserService {
    static get Instance() {
        if (null == UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }
    getUserId(token) {
        return new Promise((reslove, reject) => {
            request.get(index_1.ConfigManager.Instance.aspApi + "aspuser/1.1/user/tooken", {
                headers: {
                    XASPSESSION: token
                }
            }, (err, res, body) => {
                try {
                    err ? reject(err) : reslove(body ? JSON.parse(body) : "");
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
}
UserService.instance = null;
exports.UserService = UserService;

//# sourceMappingURL=index.js.map
