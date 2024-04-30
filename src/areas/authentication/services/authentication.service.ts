import DBClient from "../../../prisma";
import { IAuthentication } from "./Iauthentication.service";
import bcrypt from "bcrypt";


export class AuthenticationService implements IAuthentication{
    // db connect logic
    readonly _db: DBClient = DBClient.getInstance();

    constructor (_db: DBClient) {
        this._db = _db;
    }

    // async findByEmail(email: string): Promise <User | Error> {
    //     const user = await this._db.prisma.findUnique({
    //         where: {
    //             email: email,
    //         }
    //     })
    //     if (user === null) {
    //         throw new Error("User not found with the email. Please try again with different email.");
    //     } else if (user) {
    //         return user;
    //     }
    // }

    async getUserByEmailAndPwd(email: string, password: string): Promise <User | Error> {
        const userWithEmail = await this._db.prisma.findUnique({
            where: {
                email: email,
            }
        })
        const validPwd = bcrypt.compareSync(password, userWithEmail.password);
        if (validPwd === true) {
            return false;
        } else {
            throw new Error("Invalid email or password. Please try again.")
        }
    }
}