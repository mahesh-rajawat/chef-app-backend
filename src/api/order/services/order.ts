'use strict';

/**
 * order service
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = ({ strapi }) => ({
  async createPaymentIntent(ctx) {
    const { totalFee } = ctx.request.body.data;

    if (!totalFee) {
      return ctx.throw(400, 'Total fee is required');
    }

    try {
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalFee * 100), // Amount must be in the smallest currency unit (e.g., cents)
        currency: 'eur',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      strapi.log.error('Stripe error:', error);
      return ctx.throw(500, 'An error occurred while creating the payment intent.');
    }
  },
});
