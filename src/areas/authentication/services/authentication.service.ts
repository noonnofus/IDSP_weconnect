import { tb_user } from "@prisma/client";
import DBClient from "../../../prisma";
import { IAuthentication } from "./Iauthentication.service";
import bcrypt from "bcrypt";


export class AuthenticationService implements IAuthentication{
    readonly _db: DBClient = DBClient.getInstance();

    async getUserByEmailAndPwd(email: string, password: string): Promise <tb_user | Error> {
        const user = await this._db.prisma.tb_user.findUnique({
            where: {
                email: email,
            }
        })
        if (user !== null) {
            const validPwd = bcrypt.compareSync(password, user.password);
            if (validPwd === true) {
                return user;
            } else {
                throw new Error("Invalid password. Please try again.")
            }
        } else {
            throw new Error("Invalid email. Please try again");
        }
    }

    async insertUser(username: string, email: string, password: string): Promise <tb_user | Error> {
        const validEmail = await this._db.prisma.tb_user.findUnique({
            where: {
                email: email,
            }
        })
        if (validEmail === null) {
            const hashed_pwd = await bcrypt.hash(password, 10);
            const newUser = await this._db.prisma.tb_user.create({
                data: {
                    email: email,
                    password: hashed_pwd,
                    username: username,
                }
            })
            return newUser;
        } else {
            throw new Error("The user with email is already exists. Please try again with another email.")
        }
    }
}