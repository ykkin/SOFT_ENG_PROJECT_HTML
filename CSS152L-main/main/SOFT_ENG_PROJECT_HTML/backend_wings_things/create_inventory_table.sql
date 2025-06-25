-- Drop the table if it exists
DROP TABLE IF EXISTS inventory_items;

-- Create inventory_items table
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO inventory_items (name, quantity, price) VALUES
    ('Sample Item 1', 10, 99.99),
    ('Sample Item 2', 5, 149.99); 