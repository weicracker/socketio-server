abstract class UserModuleabs {
    abstract init():boolean;
    abstract initService():boolean;
} 
class UserModule implements UserModuleabs {
    initService(): boolean {
        throw new Error("Method not implemented.");
    }
    init(): boolean {
        throw new Error("Method not implemented.");
    }
    constructor(parameters) {
        
    }
}