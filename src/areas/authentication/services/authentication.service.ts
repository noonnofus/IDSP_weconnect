import DBClient from "../../../prisma";
import { IAuthentication } from "./Iauthentication.service";

export class AuthenticationService implements IAuthentication{
    // db connect logic
    readonly _db: DBClient = DBClient.getInstance();

    constructor (_db: DBClient) {
        this._db = _db;
    }

    async findByEmail(email: string): Promise <User | Error> {
        const user = await this._db.prisma.findUnique({
            where: {
                email: email,
            }
        })
        if (user === null) {
            throw new Error("User not found with the email. Please try again with different email.");
        } else if (user) {
            return user;
        }
    }

    // private async 
}