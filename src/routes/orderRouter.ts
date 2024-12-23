import Elysia from "elysia";

export const orderRouter = new Elysia({prefix: "/order"})
.get("/list", async({}) => {
    return [];
})