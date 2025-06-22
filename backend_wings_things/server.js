const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const pool = require('./db'); // PostgreSQL pool
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// --- Database Routes ---

// Get menu items
app.get('/api/wings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_items ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Save cart item to DB
app.post('/api/cart', async (req, res) => {
  const { name, quantity, subtotal } = req.body;

  try {
    await pool.query(
      'INSERT INTO cart_items (name, quantity, subtotal) VALUES ($1, $2, $3)',
      [name, quantity, subtotal]
    );
    res.status(200).json({ message: 'Item added to cart successfully' });
  } catch (err) {
    console.error('Error inserting cart item:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all cart items
app.get('/api/cart', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cart_items ORDER BY "added_at" DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cart items:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- PayMongo Integration ---

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_HEADERS = {
  headers: {
    Authorization: 'Basic ' + Buffer.from(PAYMONGO_SECRET + ':').toString('base64'),
    'Content-Type': 'application/json'
  }
};

// Create Payment Intent
app.post('/api/payment', async (req, res) => {
  const {
    name,
    email,
    address,
    city,
    province,
    postal,
    cardNumber,
    expiry,
    cvc,
    cart
  } = req.body;

  // Validate input data
  if (!name || !email || !address || !city || !province || !postal || !cardNumber || !expiry || !cvc || !cart || cart.length === 0) {
    return res.status(400).json({ error: 'Missing required payment details or empty cart' });
  }

  try {
    // Parse expiry MM/YY
    const [exp_month, exp_yearShort] = expiry.split('/');
    const exp_year = 2000 + parseInt(exp_yearShort);

    // Step 1: Create Payment Method (card)
    const paymentMethodResponse = await axios.post(
      'https://api.paymongo.com/v1/payment_methods',
      {
        data: {
          attributes: {
            details: {
              card_number: cardNumber.replace(/\s+/g, ''), // remove spaces
              exp_month: parseInt(exp_month),
              exp_year: exp_year,
              cvc: cvc
            },
            type: 'card'
          }
        }
      },
      PAYMONGO_HEADERS
    );

    const paymentMethodId = paymentMethodResponse.data.data.id;

    // Calculate total amount in centavos (PHP smallest currency unit)
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const amount = Math.round(total * 100); // assuming subtotal is in pesos

    // Step 2: Create Payment Intent
    const paymentIntentResponse = await axios.post(
      'https://api.paymongo.com/v1/payment_intents',
      {
        data: {
          attributes: {
            amount: amount,
            payment_method_allowed: ['card'],
            payment_method_options: {
              card: {
                request_three_d_secure: 'automatic'
              }
            },
            currency: 'PHP',
            capture_type: 'automatic'
          }
        }
      },
      PAYMONGO_HEADERS
    );

    const paymentIntentId = paymentIntentResponse.data.data.id;

    // Step 3: Attach Payment Method to Intent
    await axios.post(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`,
      {
        data: {
          attributes: {
            payment_method: paymentMethodId
          }
        }
      },
      PAYMONGO_HEADERS
    );

    // Step 4: Save order details to PostgreSQL
    await pool.query(
      'INSERT INTO orders (customer_name, customer_email, address, city, province, postal, total_amount, payment_intent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [name, email, address, city, province, postal, total, paymentIntentId]
    );

    res.json({ message: 'Payment successful', paymentIntentId });
  } catch (err) {
    console.error('Error processing payment:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || 'Internal Server Error' });
  }
});

// --- Root Route ---
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
