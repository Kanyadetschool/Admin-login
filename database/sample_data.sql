USE school_inventory;

-- Insert Categories
INSERT INTO categories (category_name, description) VALUES
('Equipment', 'School equipment and devices'),
('Supplies', 'General office and school supplies'),
('Books', 'Textbooks and reference materials'),
('Furniture', 'School furniture');

-- Insert Locations
INSERT INTO locations (location_name, building, room_number) VALUES
('Main Storage', 'Building A', 'R001'),
('Science Lab Storage', 'Building B', 'R101'),
('Library Storage', 'Building C', 'R201'),
('Office Storage', 'Admin Building', 'R301');

-- Insert Items
INSERT INTO items (name, category_id, quantity, minimum_quantity, unit_price, location_id, status) VALUES
('Laptop', 1, 25, 5, 799.99, 1, 'good'),
('Projector', 1, 10, 3, 499.99, 1, 'good'),
('Whiteboard Markers', 2, 100, 50, 1.99, 4, 'good'),
('Science Textbooks', 3, 45, 40, 79.99, 3, 'low'),
('Student Chairs', 4, 150, 20, 45.99, 1, 'good'),
('Lab Equipment Set', 1, 8, 5, 299.99, 2, 'low');

-- Insert Sample Transactions
INSERT INTO transactions (item_id, transaction_type, quantity, notes) VALUES
(1, 'in', 30, 'Initial stock'),
(1, 'out', 5, 'Assigned to Computer Lab'),
(2, 'in', 15, 'New procurement'),
(2, 'out', 5, 'Classroom distribution'),
(3, 'in', 200, 'Bulk purchase'),
(3, 'out', 100, 'Teacher distribution');
