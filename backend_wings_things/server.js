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

app.post('/api/payment', async (req, res) => {
  // Items specify the amount, name, and quantity
  // the subtotals and total are already computed by the system so only the base price is needed
  // request body should be in this format {id:1, line_items: [{"name":"name", "amount":100, "quantity":1}]}
  valid = true
  if (Array.isArray(req.body.line_items)) {
    line_items = req.body.line_items
    for (var i = 0; i < line_items.length; i++) {
      if (!line_items[i].name | !line_items[i].amount | !line_items[i].quantity) {
        valid = false
        break
      }
      if (line_items[i].amount <= 0 | line_items[i].quantity <= 0) {
        valid = false
        break
      }
      line_items[i].currency = "PHP";
      line_items[i].amount = line_items[i].amount * 100;
    }
  }else {
    valud = false;
  }

  if (!valid) {
    res.status(400).send('Bad Request! Please provide all the necessary information');
  }

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: 'Basic c2tfdGVzdF85cDhhYWE2ckM1M050cFVCWTdQUktXcHQ6'
    },
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          line_items: line_items,
          payment_method_types: ['gcash'],
          description: 'WingsNThings Payment Details'
        }
      }
    })
  };

  fetch('https://api.paymongo.com/v1/checkout_sessions', options)
  .then(response => response.json())
  .then(response => {
    pool.query(`INSERT INTO payment_sessions (paymongo_id, cart_id) VALUES ('${response.data.id}', ${req.body.id}) ON CONFLICT DO NOTHING`).then(result => {
      res.status(200).send(response.data.attributes.checkout_url);
    });
  }).catch(err => res.status(400).send('Paymongo request failed!'));
});

app.post('/api/payment/successful', (req, res) => {
  id = res.body.data.attributes.data.id;
  pool.query(`UPDATE payment_sessions SET paid = true WHERE paymongo_id = '${id}'`).then(result => console.log(Payment succesful!));
  res.status(200).send('Payment successful!')
});

// --- Root Route ---
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(Server is listening on http://localhost:${PORT});
});
