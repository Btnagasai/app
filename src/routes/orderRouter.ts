import Elysia, { error, t } from "elysia";
import { prisma } from "../modules/db";
import { authPlugin } from "../middleware/authPlugin";
import { randomUUID } from "crypto";
import { DeliveryStatus, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";

const stripeClient = new Stripe(Bun.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia",
});

export const orderRouter = new Elysia({ prefix: "/orders" })
.get ("/", async() => {
  const orders = await prisma.order.findMany({})
      return orders;
})
  .use(authPlugin)
  .post(
    "/create",
    async ({ user, body }) => {
      try {
        const { deliveryAddress, orderItems, totalPrice } = body;

        const orderId = `order_${randomUUID()}`;

        // Create new order
        const newOrder = await prisma.order.create({
          data: {
            id: orderId,
            user: { connect: { id: user.id } },
            deliveryAddress,
            deliveryStatus: DeliveryStatus.PENDING,
            totalPrice,
            paymentDetails: "",
            paymentStatus: PaymentStatus.PENDING,
            paymentIntentId: "",
          },
        });

        console.log("New Order:", newOrder);

        // Create associated order items
        await prisma.orderItem.createMany({
          data: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            orderId,
          })),
        });

        // Create Stripe PaymentIntent
        const paymentIntent = await stripeClient.paymentIntents.create({
          amount: Math.round(totalPrice * 100), // Amount in smallest currency unit (e.g., cents)
          currency: "inr", // Adjust currency as per your requirements
          metadata: {
            orderId,
            userId: user.id,
          },
        });

        // Update order with paymentIntent details
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentDetails: JSON.stringify(paymentIntent),
            paymentStatus: PaymentStatus.PENDING,
            paymentIntentId: paymentIntent.id,
          },
        });

        return {
          status: 200,
          message: "Order created successfully",
          data: {
            newOrder,
            clientSecret: paymentIntent.client_secret,
          },
        };
      } catch (err) {
        console.error("Error creating order:", err);
        return error(500, "Failed to create order.");
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
