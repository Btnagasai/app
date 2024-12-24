import Elysia, { error, t } from 'elysia';
import { prisma } from '../modules/db';
import { authPlugin } from '../middleware/authPlugin';
import { randomUUIDv7 } from 'bun';
import { DeliveryStatus, PaymentStatus } from '@prisma/client'; // Import Enums

export const orderRouter = new Elysia({ prefix: '/orders' })
  // Middleware for authorization
  .use(authPlugin)
  // Create a new order
  .post(
    '/create',
    async ({ user, body }) => {
      try {
        const { deliveryAddress, orderItems, totalPrice } = body; // Extract data from the request body
        const orderId = "order_" + randomUUIDv7();

        // Create a new order in the database
        const newOrder = await prisma.order.create({
          data: {
            user: { connect: { id: user.id } },
            id: orderId,
            deliveryAddress,
            deliveryStatus: DeliveryStatus.PENDING, // Use enum
            totalPrice,
            paymentDetails: "",
            paymentStatus: PaymentStatus.PENDING, // Use enum
            paymentIntentId: "",
          },
        });

        // Create order items in the database
        await prisma.orderItem.createMany({
          data: orderItems.map((orderItem) => ({
            productId: orderItem.productId,
            quantity: orderItem.quantity,
            price: orderItem.price,
            orderId: orderId, // Use the created order ID
          })),
        });

        return {
          status: 200,
          message: "Order created successfully",
          data: newOrder,
        };
      } catch (err) {
        console.error("Error creating order:", err);
        return error(500, "Failed to create order");
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
