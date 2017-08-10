import { UserModel } from "../model/index";
import * as request from "request";
import { ConfigManager } from "../../../../config/index";
interface User {
    imgId: string;
    userName: string;
    userid: string;
}

class UserService {
    private static instance: UserService = null;
    static get Instance(): UserService {
        if (null == UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }
    getUserId(token: string): Promise<User> {
        return new Promise((reslove, reject) => {
            request.get(ConfigManager.Instance.aspApi + "aspuser/1.1/user/tooken", {
                headers: {
                    XASPSESSION: token
                }
            }, (err: Error, res, body: any) => {
                try {
                    err ? reject(err) : reslove(body ? JSON.parse(body) : "");
                } catch (error) {
                     reject(error)
                }
            })
        })
    }
}
export { UserService,User }