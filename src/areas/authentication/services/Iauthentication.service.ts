import { tb_user } from "@prisma/client";

export interface IAuthentication {
    getUserByEmailAndPwd(email: string, password: string): Promise <tb_user | Error>

    insertUser(username: string, email: string, password: string): Promise <tb_user | Error>
}