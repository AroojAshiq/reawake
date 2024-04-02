import express from "express";
import stripe from "stripe";

const hostedRoute = express();

hostedRoute.post("/hosted/create-checkout-session", async (req, res) => {
  const { amount, plan } = req.body;

  const stripeInstance = stripe(process.env.SRTIPE_SECRET_KEY);
  const product = await stripeInstance.products.create({
    name: plan,
  });
  if (product) {
    var price = await stripeInstance.prices.create({
      product: `${product?.id}`,
      unit_amount: amount * 100,
      currency: "usd",
    });
  }
  if (price.id) {
    var session = await stripeInstance.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: `${price.id}`,
          quantity: 1,
        },
      ],
      customer_email: "someone@gmail.com",
      mode: "payment",
      success_url: `${process.env.BASE_URL}/hosted/success`,
      cancel_url: `${process.env.BASE_URL}/hosted/cancel`,
    });
    if (session && session.url) {
      return res.json({ url: session.url });
    } else {
      console.error("Invalid session or session URL:", session);
      res.status(500).send("Invalid session or session URL");
    }
  }
});

hostedRoute.get("/hosted/success", async (req, res) => {
  try {
    return res.redirect(`${process.env.BASE_URL_FRONTEND}/success`);
  } catch (error) {
    console.error(error.message);
  }
});

hostedRoute.get("/hosted/cancel", async (req, res) => {
  try {
    return res.redirect(`${process.env.BASE_URL_FRONTEND}/failure`);
  } catch (error) {
    console.error(error.message);
  }
});

export default hostedRoute;
