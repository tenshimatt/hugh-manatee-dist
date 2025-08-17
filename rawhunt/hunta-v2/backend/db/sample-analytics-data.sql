-- Sample Analytics Data for Testing Live Dashboard
-- Insert sample API requests
INSERT INTO api_requests (id, method, endpoint, full_path, status_code, response_time, user_id, user_agent, ip_address, request_size, response_size, timestamp) VALUES
('req1', 'GET', '/api/dogs/list', '/api/dogs/list', 200, 89, 'user123', 'Mozilla/5.0', '192.168.1.1', 0, 1024, datetime('now', '-2 hours')),
('req2', 'GET', '/api/events/list', '/api/events/list', 200, 124, 'user456', 'Mozilla/5.0', '192.168.1.2', 0, 2048, datetime('now', '-1 hour')),
('req3', 'POST', '/api/dogs/create', '/api/dogs/create', 201, 256, 'user123', 'Mozilla/5.0', '192.168.1.1', 512, 1024, datetime('now', '-30 minutes')),
('req4', 'GET', '/api/posts/feed', '/api/posts/feed', 200, 178, 'user789', 'Chrome/120.0', '192.168.1.3', 0, 4096, datetime('now', '-15 minutes')),
('req5', 'POST', '/api/auth/login', '/api/auth/login', 401, 45, NULL, 'Safari/17.0', '192.168.1.4', 256, 128, datetime('now', '-10 minutes')),
('req6', 'GET', '/api/gear/reviews', '/api/gear/reviews', 200, 167, 'user456', 'Firefox/121.0', '192.168.1.2', 0, 3072, datetime('now', '-5 minutes')),
('req7', 'GET', '/api/routes/list', '/api/routes/list', 500, 2500, 'user123', 'Mozilla/5.0', '192.168.1.1', 0, 0, datetime('now', '-3 minutes')),
('req8', 'GET', '/api/dogs/list', '/api/dogs/list', 200, 95, 'user999', 'Mobile Safari', '192.168.1.5', 0, 1536, datetime('now', '-1 minute'));

-- Insert endpoint summaries
INSERT INTO api_endpoints (endpoint, method, total_calls, success_calls, error_calls, total_response_time, min_response_time, max_response_time, last_called) VALUES
('/api/dogs/list', 'GET', 3, 3, 0, 273, 89, 95, datetime('now', '-1 minute')),
('/api/events/list', 'GET', 1, 1, 0, 124, 124, 124, datetime('now', '-1 hour')),
('/api/dogs/create', 'POST', 1, 1, 0, 256, 256, 256, datetime('now', '-30 minutes')),
('/api/posts/feed', 'GET', 1, 1, 0, 178, 178, 178, datetime('now', '-15 minutes')),
('/api/auth/login', 'POST', 1, 0, 1, 45, 45, 45, datetime('now', '-10 minutes')),
('/api/gear/reviews', 'GET', 1, 1, 0, 167, 167, 167, datetime('now', '-5 minutes')),
('/api/routes/list', 'GET', 1, 0, 1, 2500, 2500, 2500, datetime('now', '-3 minutes'));

-- Insert daily stats
INSERT INTO api_daily_stats (date, total_requests, unique_users, total_errors, total_response_time, status_200, status_201, status_401, status_500) VALUES
(date('now'), 8, 4, 2, 3637, 5, 1, 1, 1),
(date('now', '-1 day'), 45, 12, 3, 6789, 38, 4, 2, 1),
(date('now', '-2 days'), 67, 18, 4, 8234, 58, 5, 3, 1);

-- Insert user activity
INSERT INTO user_activity (user_id, ip_address, user_agent, first_seen, last_seen, total_requests) VALUES
('user123', '192.168.1.1', 'Mozilla/5.0', datetime('now', '-2 days'), datetime('now', '-3 minutes'), 15),
('user456', '192.168.1.2', 'Mozilla/5.0', datetime('now', '-1 day'), datetime('now', '-5 minutes'), 8),
('user789', '192.168.1.3', 'Chrome/120.0', datetime('now', '-1 day'), datetime('now', '-15 minutes'), 12),
('user999', '192.168.1.5', 'Mobile Safari', datetime('now', '-1 hour'), datetime('now', '-1 minute'), 3);

-- Insert error logs
INSERT INTO error_log (endpoint, method, status_code, error_message, user_id, request_id, user_agent, ip_address, timestamp) VALUES
('/api/auth/login', 'POST', 401, 'Invalid credentials provided', NULL, 'req5', 'Safari/17.0', '192.168.1.4', datetime('now', '-10 minutes')),
('/api/routes/list', 'GET', 500, 'Database connection timeout', 'user123', 'req7', 'Mozilla/5.0', '192.168.1.1', datetime('now', '-3 minutes'));

-- Insert sample gear reviews for testing
INSERT INTO gear_reviews (id, user_id, gear_name, gear_category, brand, model, rating, review_text, pros, cons, recommended, price_range, created_at) VALUES
('gear1', 'user123', 'SportDOG TEK 2.0 GPS', 'gps', 'SportDOG', 'TEK 2.0', 5, 'Excellent GPS collar for serious hunters. Battery life is outstanding and the accuracy is spot on even in thick cover.', 'Long battery life, accurate tracking, waterproof', 'Expensive, bulky design', 1, '$500-$700', datetime('now', '-5 days')),
('gear2', 'user456', 'Garmin Alpha 200i', 'gps', 'Garmin', 'Alpha 200i', 4, 'Great GPS unit with two-way communication. The mapping features are incredible but the learning curve is steep.', 'Two-way communication, detailed maps, durable', 'Complex interface, battery drain', 1, '$700-$900', datetime('now', '-3 days')),
('gear3', 'user789', 'Acme Thunderer Whistle', 'whistle', 'Acme', 'Thunderer', 5, 'Classic whistle that every dog trainer should have. Clear, loud tone that cuts through wind and distance.', 'Loud clear tone, durable, classic design', 'Can be too loud for close work', 1, '$20-$30', datetime('now', '-2 days')),
('gear4', 'user999', 'Ruffwear Web Master Harness', 'vest', 'Ruffwear', 'Web Master', 4, 'Solid working harness for active dogs. The chest and belly support distribute weight well during long hunts.', 'Comfortable fit, durable materials, good support', 'Can be hot in summer, sizing runs small', 1, '$80-$120', datetime('now', '-1 day')),
('gear5', 'user123', 'SportDOG FieldTrainer', 'collar', 'SportDOG', 'FieldTrainer', 3, 'Basic e-collar that gets the job done. Good for beginners but lacks advanced features.', 'Simple operation, affordable, reliable', 'Limited range, basic features only', 1, '$150-$200', datetime('now', '-8 hours')),
('gear6', 'user456', 'Ruffwear Grip Trex Boots', 'boots', 'Ruffwear', 'Grip Trex', 4, 'Best dog boots for rough terrain. They stay on and provide excellent protection from thorns and rocks.', 'Stay secure, excellent protection, breathable', 'Takes time to fit properly, expensive', 1, '$60-$80', datetime('now', '-4 hours')),
('gear7', 'user789', 'Dokken DeadFowl Trainer', 'training', 'Dokken', 'DeadFowl', 5, 'Revolutionary training dummy that feels like real game. My dogs love retrieving these and it shows in their performance.', 'Realistic feel, scented, durable', 'More expensive than regular dummies', 1, '$25-$35', datetime('now', '-2 hours')),
('gear8', 'user999', 'Yeti Roadie 24 Cooler', 'vehicle', 'Yeti', 'Roadie 24', 4, 'Perfect size cooler for day hunts. Keeps everything cold and the build quality is bomb-proof.', 'Excellent insulation, very durable, perfect size', 'Heavy when loaded, expensive', 1, '$200-$250', datetime('now', '-1 hour'));