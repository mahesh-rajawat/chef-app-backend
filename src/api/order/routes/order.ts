'use strict';

/**
 * order router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/orders/payment', // This is the endpoint your app will call
      handler: 'order.createPaymentIntent',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
        method: 'POST',
        path: '/orders/paytrail-payment', // New route for Paytrail
        handler: 'order.createPaytrailPayment',
        config: {
          policies: [],
        },
      },
  ],
};
