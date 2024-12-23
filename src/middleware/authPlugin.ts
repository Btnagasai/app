import jwt from "@elysiajs/jwt";

import Elysia, { error } from "elysia";
import { prisma } from "../modules/db";

console.log(Bun.env.JWT_TOKEN, "token");
export const authPlugin = (app: Elysia) =>
    app.use(
        jwt({
            secret:Bun.env.JWT_TOKEN as string,
        })
    ).derive(async({jwt, headers}) =>{
        const authorization = headers.authorization;
        if (!authorization?.startsWith("Bearer"))
        {
            return error(401, "Unauthorized");
        }
        const token = authorization.slice(7);
        const payload = await jwt.verify(token);
        if(!payload) {
            return error(401, "Unauthorized");
        }
        console.log(payload, "payload");
        const user = await prisma.user.findUnique({
            where: {
                id: payload.sub as string,
                },
        });
        if (!user) {
            return error(401, "Unauthorized");
            }
            return {
                user: {
                    name: user.name,
                    email: user.email,
                    image:user.image,
                },
            };
    });