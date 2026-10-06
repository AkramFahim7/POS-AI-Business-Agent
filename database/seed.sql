USE pos_ai_database;

-- Insert Admin User (Password: Admin@123)
INSERT INTO users (name, email, password, role, phone, status)
VALUES ('System Admin', 'admin@pos.local', '$2b$10$adUgLZXeu1rip2kSmYaPzuI0K133ciLgVpbZ79GkiMTIxpG7SWAG6', 'ADMIN', '1234567890', 'ACTIVE');

-- Insert Cashier User (Password: Cashier@123)
INSERT INTO users (name, email, password, role, phone, status)
VALUES ('Store Cashier', 'cashier@pos.local', '$2b$10$kLUIgZbybE7UG19I8RGrRueE7hjb3yJeITzF6U5xUtg0CBT1rVDbe', 'CASHIER', '0987654321', 'ACTIVE');

-- Insert Categories
INSERT INTO categories (name, description, status) VALUES 
('Groceries', 'Everyday grocery items', 'ACTIVE'),
('Electronics', 'Gadgets and electronic devices', 'ACTIVE'),
('Clothing', 'Apparel and accessories', 'ACTIVE');

-- Insert Products
INSERT INTO products (category_id, name, sku, barcode, description, product_type, unit, cost_price, selling_price, stock_quantity, reorder_level, status) VALUES
(1, 'Milk', 'GRO-001', '100000000001', 'Fresh whole milk', 'VOLUME', 'L', 40.00, 50.00, 100.000, 20.000, 'ACTIVE'),
(1, 'Bread', 'GRO-002', '100000000002', 'Whole wheat bread', 'COUNT', 'PCS', 30.00, 45.00, 50.000, 10.000, 'ACTIVE'),
(1, 'Sugar', 'GRO-003', '100000000003', 'White refined sugar', 'WEIGHT', 'KG', 35.00, 45.00, 200.000, 50.000, 'ACTIVE'),
(2, 'Wireless Mouse', 'ELE-001', '200000000001', 'Bluetooth optical mouse', 'COUNT', 'PCS', 300.00, 550.00, 30.000, 5.000, 'ACTIVE'),
(2, 'USB-C Cable', 'ELE-002', '200000000002', '1m fast charging cable', 'COUNT', 'PCS', 50.00, 150.00, 100.000, 20.000, 'ACTIVE'),
(3, 'Cotton T-Shirt', 'CLO-001', '300000000001', 'Men plain white t-shirt M', 'COUNT', 'PCS', 150.00, 299.00, 50.000, 10.000, 'ACTIVE');

-- Insert Sample Customers
INSERT INTO customers (name, phone, email, address, status) VALUES
('John Doe', '555-1001', 'john@example.com', '123 Main St', 'ACTIVE'),
('Jane Smith', '555-1002', 'jane@example.com', '456 Oak Ave', 'ACTIVE');
