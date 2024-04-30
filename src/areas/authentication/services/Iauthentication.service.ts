export interface IAuthentication {
    // findByEmail(email: string): Promise<User | Error>
    getUserByEmailAndPwd(email: string, password: string): Promise <User | Error>
}