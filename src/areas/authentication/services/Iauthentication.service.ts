import { tb_user } from "@prisma/client";

export interface IAuthentication {
    getUserByEmailAndPwd(email: string, password: string): Promise <tb_user | Error>

    insertUser(username: string, email: string, password: string): Promise <tb_user | Error>

    getUserById(id: number): Promise<tb_user | Error>

    getUserByUsername(_username: string): Promise<tb_user[] | undefined>
}