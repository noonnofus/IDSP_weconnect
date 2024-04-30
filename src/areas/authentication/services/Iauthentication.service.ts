export interface IAuthentication {
    findByEmail(email: string): Promise<User | Error>

}