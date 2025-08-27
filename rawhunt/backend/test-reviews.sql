-- Create some test users first
INSERT INTO users (email, password_hash, first_name, last_name, paws_balance) VALUES 
('test1@example.com', '$2b$12$hash1', 'John', 'Smith', 150),
('test2@example.com', '$2b$12$hash2', 'Sarah', 'Johnson', 220),
('test3@example.com', '$2b$12$hash3', 'Mike', 'Wilson', 180);

-- Create some test reviews
INSERT INTO reviews (user_id, rawgle_supplier_id, rating, title, content, is_verified, created_at) VALUES 
(1, 1, 5, 'Excellent raw food quality!', 'Healthy Paws has the best selection of raw dog food in the city. My German Shepherd loves their frozen patties and the staff is incredibly knowledgeable about nutrition.', TRUE, '2024-01-15 10:30:00'),
(2, 1, 4, 'Good selection, slightly pricey', 'Great variety of raw foods and treats. Prices are a bit higher than other places but the quality is worth it. They also offer delivery which is convenient.', TRUE, '2024-02-20 14:15:00'),
(3, 2, 5, 'Amazing organic options', 'Natural Pet Market is my go-to for organic cat food. They carry brands I cannot find anywhere else and the staff always has great recommendations.', TRUE, '2024-01-10 09:45:00'),
(1, 2, 5, 'Raw cat food specialist', 'Finally found a place that understands raw feeding for cats! Their freeze-dried options are perfect for travel.', TRUE, '2024-03-05 16:20:00'),
(2, 3, 4, 'Great wholesale prices', 'Raw Feeders Supply offers bulk pricing that makes raw feeding affordable. Their delivery is always on time and products well-packaged.', TRUE, '2024-02-01 11:00:00'),
(3, 4, 5, 'Knowledgeable staff', 'Paws & Claws helped me transition my rescue dog to raw food. The staff spent an hour explaining everything and gave me a feeding plan.', TRUE, '2024-01-25 15:30:00');