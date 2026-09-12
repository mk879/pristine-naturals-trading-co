const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Razorpay key is not configured on the server.' }),
    };
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = JSON.parse(event.body || '{}');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing payment details' }),
      };
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const verified = expectedSignature === razorpay_signature;

    if (!verified) {
      return {
        statusCode: 400,
        body: JSON.stringify({ verified: false, error: 'Signature mismatch' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ verified: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
