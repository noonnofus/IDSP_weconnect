import { tb_user, tb_room } from "@prisma/client";

export interface IAuthentication {
    getUserByEmailAndPwd(email: string, password: string): Promise <tb_user | Error>

    insertUser(username: string, email: string, password: string): Promise <tb_user | Error>

    getUserById(id: number): Promise<tb_user | null>

    getUserByUsername(_username: string): Promise<tb_user[] | undefined>
}