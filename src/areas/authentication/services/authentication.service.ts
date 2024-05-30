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


    async getUserById(id: number): Promise<tb_user | null> {
        const user = await this._db.prisma.tb_user.findUnique({
            where: {
                userId: id,
            }
        })
        if (user) {
            return user;
        } else {
            return null;
        }
    }

    async getUserByUsername(_username: string): Promise<tb_user[] | undefined> {
        const users = await this._db.prisma.tb_user.findMany({
            where: {
                username: {
                    startsWith: _username
                }
            }
        })
        if (users) {
            return users;
        } else {
            return undefined;
        }
    }

    async updateUserPassword(userId: number, newPassword: string): Promise<tb_user | null> {
        try {
            // Retrieve the user by ID
            const user = await this._db.prisma.tb_user.findUnique({
                where: {
                    userId: userId,
                },
            });

            if (!user) {
                throw new Error("User not found");
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update the user's password
            const updatedUser = await this._db.prisma.tb_user.update({
                where: {
                    userId: userId,
                },
                data: {
                    password: hashedPassword,
                },
            });

            return updatedUser;
        } catch (error) {
            console.error("Error updating user password:", error);
            return null;
        }
    }
}