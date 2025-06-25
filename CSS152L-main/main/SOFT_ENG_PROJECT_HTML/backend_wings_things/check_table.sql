-- Check if inventory_items table exists and show its structure
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'inventory_items'
);

-- If table exists, show its structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'inventory_items'; 