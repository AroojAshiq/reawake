import stripe from "stripe";
import express from "express";
import User from "../../user/userModel.js";
import bodyParser from "body-parser";
const endpointSecret = process.env.WEBHOOK_SIGNING_SECRET;

const subscriptionRoute = express();

subscriptionRoute.post(
  "/create-stripe-session-subscription/:id",
  async (req, res) => {
    const { price, duration, name, desc } = req.body;
    const { id } = req.params;
    const user = await User.findById({ _id: id });
    // console.log(user, "user");

    const stripeInstance = stripe(process.env.SRTIPE_SECRET_KEY);

    const userEmail = `${user?.email}`; // Replace with actual user email
    let customer;
    const auth0UserId = user?._id;
    // Try to retrieve an existing customer by email
    const existingCustomers = await stripeInstance.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      // Customer already exists
      customer = existingCustomers.data[0];
      // console.log(customer, "customer");
      // Check if the customer already has an active subscription
      const subscriptions = await stripeInstance.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      if (subscriptions.data.length > 0) {
        // Customer already has an active subscription, send them to biiling portal to manage subscription

        const stripeSession =
          await stripeInstance.billingPortal.sessions.create({
            customer: customer.id,
            return_url: "http://localhost:3000/",
          });
        return res.status(409).json({ redirectUrl: stripeSession.url });
      }
    } else {
      // No customer found, create a new one
      customer = await stripeInstance.customers.create({
        email: userEmail,
        metadata: {
          userId: auth0UserId, // Replace with actual Auth0 user ID
        },
      });
    }

    //   console.log(customer);

    // Now create the Stripe checkout session with the customer ID
    const session = await stripeInstance.checkout.sessions.create({
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Reawake",
              description: "task",
            },
            unit_amount: price * 100,
            recurring: {
              interval: `${duration}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: auth0UserId,
      },
      // customer_email: "hello@tricksumo.com",
      customer: customer.id, // Use the customer ID here
    });
    // console.log(session, "wertyui");
    res.json({ id: session.id });
  }
);

subscriptionRoute.post(
  "/webhook",
//   express.raw({ type: "application/json" }),
  async (req, res) => {
    // const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const stripeInstance = stripe(process.env.SRTIPE_SECRET_KEY);

    // const db = client.db("subDB");
    // const subscriptions = db.collection("subscriptions");

    const rawBody = Buffer.from(req.body.toString());
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      console.log(req.body, sig, endpointSecret);
      event = await stripeInstance.webhooks.constructEvent(
        req.body,
        sig,
        Buffer.from(endpointSecret)
      );
      // console.log("Received event:", event.type);
    } catch (err) {
      console.log(err.message, "errorr");
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // console.log(event, "event");
    // if (event.type === "invoice.payment_succeeded") {
    //   console.log(event, "event invoice");

    //   const invoice = event.data.object;

    //   // On payment successful, get subscription and customer details
    //   const subscription = await stripeInstance.subscriptions.retrieve(
    //     event.data.object.subscription
    //   );
    //   const customer = await stripeInstance.customers.retrieve(
    //     event.data.object.customer
    //   );

    //   console.log(subscription, customer, "customer");

    //   if (invoice.billing_reason === "subscription_create") {
    //     // Handle the first successful payment
    //     // DB code to update the database for first subscription payment

    //     const subscriptionDocument = {
    //       userId: customer?.metadata?.userId,
    //       subId: event.data.object.subscription,
    //       endDate: subscription.current_period_end * 1000,
    //     };

    //     // // Insert the document into the collection
    //     const result = await Subscription.insertOne(subscriptionDocument);
    //     console.log(
    //       `A document was inserted with the _id: ${result.insertedId}`
    //     );
    //     console.log(
    //       `First subscription payment successful for Invoice ID: ${customer.email} ${customer?.metadata?.userId}`
    //     );
    //   } else if (
    //     invoice.billing_reason === "subscription_cycle" ||
    //     invoice.billing_reason === "subscription_update"
    //   ) {
    //     // Handle recurring subscription payments
    //     // DB code to update the database for recurring subscription payments

    //     // Define the filter to find the document with the specified userId
    //     const filter = { userId: customer?.metadata?.userId };

    //     // Define the update operation to set the new endDate
    //     const updateDoc = {
    //       $set: {
    //         endDate: subscription.current_period_end * 1000,
    //         recurringSuccessful_test: true,
    //       },
    //     };

    //     // Update the document
    //     const result = await Subscription.updateOne(filter, updateDoc);

    //     if (result.matchedCount === 0) {
    //       console.log("No documents matched the query. Document not updated");
    //     } else if (result.modifiedCount === 0) {
    //       console.log(
    //         "Document matched but not updated (it may have the same data)"
    //       );
    //     } else {
    //       console.log(`Successfully updated the document`);
    //     }

    //     console.log(
    //       `Recurring subscription payment successful for Invoice ID: ${invoice.id}`
    //     );
    //   }

    //   console.log(
    //     new Date(subscription.current_period_end * 1000),
    //     subscription.status,
    //     invoice.billing_reason,
    //     "billing"
    //   );
    // }

    // // For canceled/renewed subscription
    // if (event.type === "customer.subscription.updated") {
    //   const subscription = event.data.object;
    //   // console.log(event);
    //   if (subscription.cancel_at_period_end) {
    //     console.log(`Subscription ${subscription.id} was canceled.`);
    //     // DB code to update the customer's subscription status in your database
    //   } else {
    //     console.log(`Subscription ${subscription.id} was restarted.`);
    //     // get subscription details and update the DB
    //   }
    // }

    res.status(200).end();
  }
);

export default subscriptionRoute;
