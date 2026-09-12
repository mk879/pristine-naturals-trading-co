const Razorpay = require('razorpay');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Razorpay keys are not configured on the server.' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const amount = Number(payload.amount);
    const currency = payload.currency || 'INR';
    const receipt = payload.receipt || `receipt_${Date.now()}`;

    if (!Number.isFinite(amount) || amount < 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid amount. Minimum is 100 paise.' }),
      };
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: keyId,
      }),
    };
  } catch (err) {
    const statusCode = err && err.statusCode === 401 ? 401 : 500;
    const errorMessage = err && err.error && err.error.description
      ? err.error.description
      : err.message || 'Could not create order';

    return {
      statusCode,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
