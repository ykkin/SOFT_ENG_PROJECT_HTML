const pool = require('./db');

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(6,2) NOT NULL,
    image_url TEXT
  );
`;

const insertSampleData = `
  INSERT INTO menu_items (name, description, price, image_url)
  VALUES
    ('Buffalo Wings', 'Classic spicy buffalo wings', 299.99, 'images/buffalo_wings.jpg'),
    ('Garlic Parmesan Wings', 'Wings with garlic parmesan flavor', 319.99, 'images/garlic_parmesan.jpg'),
    ('Honey BBQ Wings', 'Sweet and smoky honey BBQ wings', 309.99, 'images/honey_bbq.jpg')
  ON CONFLICT DO NOTHING;
`;

async function init() {
  try {
    await pool.query(createTableQuery);
    console.log('✅ Table created or already exists.');

    await pool.query(insertSampleData);
    console.log('✅ Sample data inserted.');
  } catch (err) {
    console.error('❌ Error initializing DB:', err);
  } finally {
    pool.end();
  }
}

init();
