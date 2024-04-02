import express from "express";
import cors from "cors";
import connectDb from "./config/db.js";
import router from "./user/userRoute.js";
import taskRouter from "./task/taskRoute.js";
import dotenv from "dotenv";
import profileRoute from "./user/userProfileUpload.js";
import taskRoute from "./task/taskUpload.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cron from "node-cron";
import Task from "./task/taskModel.js";
import twilio from "twilio";
import User from "./user/userModel.js";
import blogUpload from "./blog/blogUpload.js";
import updateBlog from "./blog/updateBlog.js";
import blogRouter from "./blog/blogRoutes.js";
import hostedRoute from "./routes/stripe/hostedroute.js";
// import bodyParser from "body-parser";
import stripe from "stripe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.raw({ type: "*/*" }));
// app.use(bodyParser.text());

// app.use(bodyParser.json());
// app.use(
//   bodyParser.json({
//     verify: function (req, res, buf, encoding) {
//       // sha1 content
//       var hash = crypto.createHash("sha1");
//       hash.update(buf);
//       req.hasha = hash.digest("hex");
//       console.log("hash", req.hasha);

//       // get rawBody
//       req.rawBody = buf.toString();
//       console.log("rawBody", req.rawBody);
//     },
//   })
// );

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || process.env.BASE_URL_FRONTEND.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//   })
// );

app.use(cors());

dotenv.config();
const endpointSecret = process.env.WEBHOOK_SIGNING_SECRET;

const MONGO_DB = process.env.MONGO_DB;
connectDb(MONGO_DB);

app.use("/api", router);
app.use("/api", taskRouter);
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/api", profileRoute);
app.use("/api", blogUpload);
app.use("/api", updateBlog);
app.use("/api", taskRoute);
app.use("/api", blogRouter);
app.use("/api", hostedRoute);
app.use("/attchments", express.static(path.join(__dirname, "/attchments")));
app.use("/blogs", express.static(path.join(__dirname, "/blogs")));

app.get("/api/pdf/:id", async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id);
  if (task) {
    if (task?.filename) {
      const filePath = path?.join(__dirname, "attchments", task?.filename);
      res.status(200).json({
        success: true,
        file: filePath,
        comment: task?.comment,
        fileOriginalName: task?.fileOriginalName,
      });
    } else {
      res.status(200).json({
        success: true,
        comment: task?.comment,
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Comments and attachments not found",
    });
  }
});

if (process.env.NODE_ENV === "PRODUCTION") {
  app.use(express.static(path.join(__dirname, "./build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "./build/index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

cron.schedule("* * * * *", async () => {
  // Run the task every minute
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = new twilio(accountSid, authToken);
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const reminders = await Task.find({
    "reminder.date": { $eq: formattedToday },
  });
  // Get the current date and time
  const currentTime = new Date();
  reminders.forEach(async (reminder) => {
    const reminderDate = new Date(reminder.reminder.date);
    const reminderTime = reminder.reminder.time.split(":");
    reminderDate.setHours(reminderTime[0]);
    reminderDate.setMinutes(reminderTime[1]);
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const reminderHours = reminderDate.getHours();
    const reminderMinutes = reminderDate.getMinutes();
    // Check if the current time matches the reminder time

    if (currentHours === reminderHours && currentMinutes === reminderMinutes) {
      const user = await User.findById({ _id: reminder.userId });
      // Use Twilio API to send SMS
      if (user?.phoneNumber) {
        try {
          client.messages
            .create({
              body: `Reminder! your task ${reminder.taskName} with status ${reminder.taskStatus} is pending please check and complete it. If you have already completed your task then please ignore this message Thanks.`,
              to: `+${user?.phoneNumber}`, // Text this number
              // to: "+19145200451", // Text this numberssss
              from: process.env.TWILIO_FROM_NUMBER, // From a valid Twilio number
            })
            .then((message) => console.log(message.body, "body"))
            .catch((res) => console.log(res, "catch"));
        } catch (error) {
          console.log(error?.message, "error");
        }
      }
    }
  });
});

app.post("/create-stripe-session-subscription/:id", async (req, res) => {
  const { price, duration, name, desc } = req.body;
  console.log(price, duration);
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
    // console.log(subscriptions, "sub");
    if (subscriptions.data.length > 0) {
      // Customer already has an active subscription, send them to biiling portal to manage subscription

      const stripeSession = await stripeInstance.billingPortal.sessions.create({
        customer: customer.id,
        return_url: process.env.BASE_URL_FRONTEND,
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
  if (duration === "year") {
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${process.env.BASE_URL_FRONTEND}/success`,
      cancel_url: `${process.env.BASE_URL_FRONTEND}/cancel`,
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
              interval: "year",
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
    res.json({ id: session.id });
  } else {
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${process.env.BASE_URL_FRONTEND}/success`,
      cancel_url: `${process.env.BASE_URL_FRONTEND}/cancel`,
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
              interval: `month`,
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
    res.json({ id: session.id });
  }
});

app.post("/webhook", async (req, res) => {
  // const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const stripeInstance = stripe(process.env.SRTIPE_SECRET_KEY);

  // const db = client.db("subDB");
  // const subscriptions = db.collection("subscriptions");

  const rawBody = req.body.toString();
  const sig = req.headers["stripe-signature"];
  let event;
  console.log(rawBody, sig);
  try {
    event = stripeInstance.webhooks.constructEvent(
      rawBody,
      sig,
      endpointSecret
    );
    // console.log("Received event:", event.type);
  } catch (err) {
    console.log(err, "errorr");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  console.log(event, "event");
  if (event.type === "invoice.payment_succeeded") {
    console.log(event, "event invoice");

    const invoice = event.data.object;

    // On payment successful, get subscription and customer details
    const subscription = await stripeInstance.subscriptions.retrieve(
      event.data.object.subscription
    );
    const customer = await stripeInstance.customers.retrieve(
      event.data.object.customer
    );

    console.log(subscription, customer, "customer");

    if (invoice.billing_reason === "subscription_create") {
      // Handle the first successful payment
      // DB code to update the database for first subscription payment

      const subscriptionDocument = {
        userId: customer?.metadata?.userId,
        subId: event.data.object.subscription,
        endDate: subscription.current_period_end * 1000,
      };

      // // Insert the document into the collection
      const result = await Subscription.insertOne(subscriptionDocument);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
      console.log(
        `First subscription payment successful for Invoice ID: ${customer.email} ${customer?.metadata?.userId}`
      );
    } else if (
      invoice.billing_reason === "subscription_cycle" ||
      invoice.billing_reason === "subscription_update"
    ) {
      // Handle recurring subscription payments
      // DB code to update the database for recurring subscription payments

      // Define the filter to find the document with the specified userId
      const filter = { userId: customer?.metadata?.userId };

      // Define the update operation to set the new endDate
      const updateDoc = {
        $set: {
          endDate: subscription.current_period_end * 1000,
          recurringSuccessful_test: true,
        },
      };

      // Update the document
      const result = await Subscription.updateOne(filter, updateDoc);

      if (result.matchedCount === 0) {
        console.log("No documents matched the query. Document not updated");
      } else if (result.modifiedCount === 0) {
        console.log(
          "Document matched but not updated (it may have the same data)"
        );
      } else {
        console.log(`Successfully updated the document`);
      }

      console.log(
        `Recurring subscription payment successful for Invoice ID: ${invoice.id}`
      );
    }

    console.log(
      new Date(subscription.current_period_end * 1000),
      subscription.status,
      invoice.billing_reason,
      "billing"
    );
  }

  // For canceled/renewed subscription
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    // console.log(event);
    if (subscription.cancel_at_period_end) {
      console.log(`Subscription ${subscription.id} was canceled.`);
      // DB code to update the customer's subscription status in your database
    } else {
      console.log(`Subscription ${subscription.id} was restarted.`);
      // get subscription details and update the DB
    }
  }

  res.status(200).end();
});

const PORT = process.env.PORT;
app.listen(PORT, (req, res) => {
  console.log(`server is running on port ${PORT}`);
});
