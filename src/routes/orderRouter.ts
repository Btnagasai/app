import Elysia, { error, t } from 'elysia';
import { prisma } from '../modules/db';
import { authPlugin } from '../middleware/authPlugin';
import { randomUUIDv7 } from 'bun';

export const orderRouter = new Elysia({ prefix: '/orders' })
  // Middleware for authorization
  .use(authPlugin)
  // Create a new order
  .post(
    '/create',
    async ({ user, body }) => {
      const { deliveryAddress, orderItems, totalPrice } = body; // Extract data from the request body
      const orderId = "order_" + randomUUIDv7();

        // Create a new order in the database
        const newOrder = await prisma.order.create({
          data: {
            user: { connect: { id: user.id } },
            id: orderId,
            deliveryAddress,
            deliveryStatus: "PENDING",
            totalPrice,
            paymentDetails: "",
            paymentStatus: "PENDING",
            paymentIntentId: "",
          },
        });
        
        
      
      // Create order items in the database
      const __orderItems =await prisma.orderItem.createMany({
        data: orderItems.map((orderItem) => ({
          productId: orderItem.productId,
          quantity: orderItem.quantity,
          price: orderItem.price,
          orderId: orderId,
        })),
      });

    return {
      newOrder,
    }
    },
    {
      body: t.Object({
        deliveryAddress: t.String(),
        totalPrice: t.Number(),
        orderItems: t.Array(
          t.Object({
            productId: t.String(),
            quantity: t.Number(),
            price: t.Number(),
          })
        ),
      }),
    }
  );

export default orderRouter;
