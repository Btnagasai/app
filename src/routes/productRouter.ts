import Elysia, { error, t } from "elysia";
import { prisma } from "../modules/db";
import { authPlugin } from "../middleware/authPlugin";

export const productRouter = new Elysia({ prefix: "/products" })
  .get(
    "/",
    async () => {
      try {
        const products = await prisma.product.findMany({});
        return products;
      } catch (e) {
        return error(500, "Failed to fetch products.");
      }
    }
  )
  .use(authPlugin)
  .get(
    "/:id",
    async ({ params }) => {
      const { id } = params;
      try {
        const product = await prisma.product.findUnique({
          where: { id },
        });
        if (!product) return error(404, "Product not found.");
        return product;
      } catch (e) {
        return error(500, "Failed to fetch the product.");
      }
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  );
