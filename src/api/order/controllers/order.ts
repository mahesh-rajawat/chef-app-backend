'use strict';

/**
 * order controller
 */

module.exports = ({ strapi }) => ({
  async createPaymentIntent(ctx) {
    try {
      const data = await strapi.service('api::order.order').createPaymentIntent(ctx);
      ctx.send(data);
    } catch (error) {
      ctx.throw(500, error);
    }
  },
  async createPaytrailPayment(ctx) {
    try {
      const user = ctx.state.user;
      console.log(user);
      if (!user) {
        return ctx.unauthorized('You must be logged in to make a payment.');
      }
      
      const { totalFee } = ctx.request.body.data;
      const orderId = `order_${Date.now()}`; // Generate a unique order ID

      const payment = await strapi
        .service('api::order.paytrail')
        .createPayment({ totalFee, orderId, user });

      ctx.send(payment);
    } catch (error) {
      ctx.badRequest('Payment creation failed', { details: error.message });
    }
  },
});
