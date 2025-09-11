'use strict';
const cryptoLib = require('crypto');

module.exports = ({ strapi }) => ({
  /**
   * Create a new Paytrail payment
   * @param {object} orderDetails - Details of the order
   * @returns {Promise<object>} - The created payment object for Paytrail API
   */
  async createPayment(orderDetails) {
    const { totalFee, orderId, user } = orderDetails;

    // The body of the request to Paytrail
    const body = {
      stamp: `ChefLink_${orderId}`, // Unique ID for this payment
      reference: `ChefLink_${orderId}`,
      amount: Math.round(totalFee * 100), // Amount in cents
      currency: 'EUR',
      language: 'EN',
      items: [
        {
          unitPrice: Math.round(totalFee * 100),
          units: 1,
          vatPercentage: 14,
          productCode: 'CHEF_SERVICE',
          description: 'Private Chef Service',
        },
      ],
      customer: {
        email: user.email,
        firstName: user.username,
      },
      redirectUrls: {
        success: 'https://cheflink.app/payment-success',
        cancel: 'https://cheflink.app/payment-cancel',
      },
      callbackUrls: {
        success: `${process.env.STRAPI_API_URL}/api/paytrail-callback`,
        cancel: `${process.env.STRAPI_API_URL}/api/paytrail-callback`,
      },
    };
    console.log('paytrail', process.env.PAYTRAIL_SECRET_KEY);
    // 1. Get all headers, except for the signature
    const headers = {
      'checkout-account': process.env.PAYTRAIL_MERCHANT_ID,
      'checkout-algorithm': 'sha256',
      'checkout-method': 'POST',
      'checkout-nonce': cryptoLib.randomBytes(16).toString('hex'),
      'checkout-timestamp': new Date().toISOString(),
    };

     const hmacPayload = Object.keys(headers)
      .sort()
      .map(key => `${key}:${headers[key]}`)
      .join('\n') + '\n' + JSON.stringify(body);

    // 3. Calculate the HMAC signature using the sorted payload
    const signature = cryptoLib
      .createHmac('sha256', process.env.PAYTRAIL_SECRET_KEY)
      .update(hmacPayload)
      .digest('hex');
      
    // 4. Make the API call to Paytrail
    const paytrailResponse = await fetch('https://services.paytrail.com/payments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers, // Spread the sorted headers
            'signature': signature,
        },
        body: JSON.stringify(body),
    });

    if (!paytrailResponse.ok) {
        const errorBody = await paytrailResponse.text();
        console.error("Paytrail API Error:", errorBody);
        throw new Error('Failed to create Paytrail payment.');
    }

    return await paytrailResponse.json();
  },
});
