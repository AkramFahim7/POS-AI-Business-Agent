USE pos_system;

-- Preserve the legacy units long enough to classify and normalize existing products.
ALTER TABLE products
    ADD COLUMN product_type ENUM('COUNT', 'WEIGHT', 'VOLUME') NOT NULL DEFAULT 'COUNT' AFTER description;

UPDATE products
SET product_type = CASE
        WHEN LOWER(unit) IN ('kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams') THEN 'WEIGHT'
        WHEN LOWER(unit) IN ('l', 'liter', 'litre', 'liters', 'litres', 'ml', 'milliliter', 'millilitre') THEN 'VOLUME'
        ELSE 'COUNT'
    END,
    unit = CASE
        WHEN LOWER(unit) IN ('kg', 'kilogram', 'kilograms') THEN 'KG'
        WHEN LOWER(unit) IN ('g', 'gram', 'grams') THEN 'G'
        WHEN LOWER(unit) IN ('l', 'liter', 'litre', 'liters', 'litres') THEN 'L'
        WHEN LOWER(unit) IN ('ml', 'milliliter', 'millilitre') THEN 'ML'
        ELSE 'PCS'
    END;

ALTER TABLE products
    MODIFY COLUMN unit ENUM('PCS', 'KG', 'G', 'L', 'ML') NOT NULL DEFAULT 'PCS',
    MODIFY COLUMN stock_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    MODIFY COLUMN reorder_level DECIMAL(10, 3) NOT NULL DEFAULT 0.000;

ALTER TABLE sale_items
    MODIFY COLUMN quantity DECIMAL(10, 3) NOT NULL,
    ADD COLUMN unit ENUM('PCS', 'KG', 'G', 'L', 'ML') NOT NULL DEFAULT 'PCS' AFTER quantity;

UPDATE sale_items si
JOIN products p ON p.id = si.product_id
SET si.unit = p.unit;

ALTER TABLE stock_movements
    MODIFY COLUMN quantity DECIMAL(10, 3) NOT NULL,
    MODIFY COLUMN previous_quantity DECIMAL(10, 3) NOT NULL,
    MODIFY COLUMN new_quantity DECIMAL(10, 3) NOT NULL,
    ADD COLUMN unit ENUM('PCS', 'KG', 'G', 'L', 'ML') NOT NULL DEFAULT 'PCS' AFTER new_quantity;

UPDATE stock_movements sm
JOIN products p ON p.id = sm.product_id
SET sm.unit = p.unit;