-- Clear existing data if necessary
DELETE FROM trips;
DELETE FROM station_exits;
DELETE FROM pois;
DELETE FROM stations;

-- Prevent sequence sync issues if needed
ALTER SEQUENCE stations_id_seq RESTART WITH 1;
ALTER SEQUENCE station_exits_id_seq RESTART WITH 1;
ALTER SEQUENCE pois_id_seq RESTART WITH 1;

-- ==========================================
-- 1. STATIONS
-- Note: ST_MakePoint takes (longitude, latitude)
-- ==========================================
INSERT INTO stations (id, name_en, name_th, line, location) VALUES 
(1, 'Lak Song', 'หลักสอง', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.404, 13.712), 4326)),
(2, 'Phasi Charoen', 'ภาษีเจริญ', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.435, 13.714), 4326)),
(3, 'Bang Wa', 'บางหว้า', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.457, 13.720), 4326)),
(4, 'Itsaraphap', 'อิสรภาพ', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.485, 13.738), 4326)),
(5, 'Sanam Chai', 'สนามไชย', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.493, 13.743), 4326)),
(6, 'Sam Yot', 'สามยอด', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.503, 13.746), 4326)),
(7, 'Wat Mangkon', 'วัดมังกร', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.509, 13.743), 4326)),
(8, 'Hua Lamphong', 'หัวลำโพง', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.517, 13.736), 4326)),
(9, 'Sam Yan', 'สามย่าน', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.528, 13.732), 4326)),
(10, 'Silom', 'สีลม', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.537, 13.728), 4326)),
(11, 'Lumphini', 'ลุมพินี', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.545, 13.725), 4326)),
(12, 'Sukhumvit', 'สุขุมวิท', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.561, 13.737), 4326)),
(13, 'Phra Ram 9', 'พระราม 9', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.565, 13.757), 4326)),
(14, 'Thailand Cultural Centre', 'ศูนย์วัฒนธรรมฯ', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.570, 13.766), 4326)),
(15, 'Kamphaeng Phet', 'กำแพงเพชร', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.548, 13.797), 4326)),
(16, 'Chatuchak Park', 'สวนจตุจักร', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.553, 13.802), 4326)),
(17, 'Bang Yi Khan', 'บางยี่ขัน', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.479, 13.778), 4326)),
(18, 'Tha Phra', 'ท่าพระ', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.474, 13.729), 4326));

-- ==========================================
-- 2. STATION EXITS (Slightly offset from station core)
-- ==========================================
INSERT INTO station_exits (station_id, exit_number, description, location) VALUES 
(1, '4', 'The Mall Lifestore Bang Khae Skywalk', ST_SetSRID(ST_MakePoint(100.4042, 13.7121), 4326)),
(2, '2', 'Seacon Bangkae Direct Access', ST_SetSRID(ST_MakePoint(100.4352, 13.7142), 4326)),
(4, '2', 'Gateway to Wat Arun Ferry', ST_SetSRID(ST_MakePoint(100.4851, 13.7381), 4326)),
(5, '1', 'Grand Palace / Wat Pho Entry', ST_SetSRID(ST_MakePoint(100.4930, 13.7435), 4326)),
(5, '2', 'Pak Khlong Talat / Yodpiman', ST_SetSRID(ST_MakePoint(100.4932, 13.7428), 4326)),
(7, '1', 'Plaeng Nam Rd / Street Food District', ST_SetSRID(ST_MakePoint(100.5091, 13.7431), 4326)),
(8, '1', 'Wat Traimit Access', ST_SetSRID(ST_MakePoint(100.5173, 13.7365), 4326)),
(11, '1B', 'One Bangkok Underpass', ST_SetSRID(ST_MakePoint(100.5451, 13.7251), 4326)),
(11, '3', 'Witthayu (Wireless) Road', ST_SetSRID(ST_MakePoint(100.5455, 13.7258), 4326)),
(13, '2', 'Central Plaza Rama 9', ST_SetSRID(ST_MakePoint(100.5651, 13.7571), 4326)),
(14, '3', 'The One Ratchada Night Market', ST_SetSRID(ST_MakePoint(100.5702, 13.7662), 4326)),
(15, '1', 'Red Antique Building / Or Tor Kor Market', ST_SetSRID(ST_MakePoint(100.5478, 13.7972), 4326)),
(17, '1', 'Indy Market Pinklao', ST_SetSRID(ST_MakePoint(100.4791, 13.7778), 4326));

-- ==========================================
-- 3. POINTS OF INTEREST
-- ==========================================
INSERT INTO pois (name, category, price_level, description, location) VALUES 
('The Mall Lifestore Bang Khae', 'Retail', 3, 'Massive western suburban retail hub immediately connected to Lak Song.', ST_SetSRID(ST_MakePoint(100.4045, 13.7125), 4326)),
('Seacon Bangkae', 'Retail', 2, 'Major shopping center directly connected to Phasi Charoen station.', ST_SetSRID(ST_MakePoint(100.4355, 13.7145), 4326)),
('Wat Arun (Temple of Dawn)', 'Heritage', 1, 'Monumental riverside temple accessible via ferry from Itsaraphap Exit 2.', ST_SetSRID(ST_MakePoint(100.4880, 13.7437), 4326)),
('The Grand Palace & Wat Phra Kaew', 'Heritage', 3, 'The symbolic heart of Bangkok, walking distance from Sanam Chai Exit 1.', ST_SetSRID(ST_MakePoint(100.4910, 13.7500), 4326)),
('Wat Mangkon Kamalawat', 'Heritage', 1, 'The largest and most important Chinese temple in Bangkok Chinatown.', ST_SetSRID(ST_MakePoint(100.5095, 13.7435), 4326)),
('Kua Gai Nai Hong', 'Culinary', 2, 'Legendary charcoal chicken noodles in Chinatown off Plaeng Nam Rd.', ST_SetSRID(ST_MakePoint(100.5098, 13.7425), 4326)),
('Samyan Mitrtown', 'Retail', 2, '24-hour retail and academic hub utilized by Chulalongkorn students.', ST_SetSRID(ST_MakePoint(100.5285, 13.7330), 4326)),
('Tim Hortons (Samyan)', 'Culinary', 1, 'Canadian coffee shop famous for Maple Dip donuts.', ST_SetSRID(ST_MakePoint(100.5286, 13.7331), 4326)),
('One Bangkok', 'Retail', 4, 'Massive ultra-luxury mixed-use development accessible via Lumphini Underpass.', ST_SetSRID(ST_MakePoint(100.5460, 13.7260), 4326)),
('Terminal 21', 'Retail', 3, 'Airport-themed shopping complex at the Asok/Sukhumvit interchange.', ST_SetSRID(ST_MakePoint(100.5605, 13.7375), 4326)),
('Korean Town (Sukhumvit Plaza)', 'Culinary', 3, 'Primary enclave for authentic Korean dining near Sukhumvit Station.', ST_SetSRID(ST_MakePoint(100.5580, 13.7380), 4326)),
('The One Ratchada Night Market', 'Night Market', 2, 'Sprawling night market with food, bars, and fashion under white tents.', ST_SetSRID(ST_MakePoint(100.5710, 13.7665), 4326)),
('Chatuchak Weekend Market', 'Retail', 1, 'One of the largest open-air markets globally.', ST_SetSRID(ST_MakePoint(100.5500, 13.8000), 4326)),
('Or Tor Kor Market', 'Culinary', 3, 'High-end prestigious agricultural and seafood market.', ST_SetSRID(ST_MakePoint(100.5475, 13.7975), 4326)),
('Indy Market Pinklao', 'Night Market', 1, 'Vibrant suburban night market operating near Bang Yi Khan.', ST_SetSRID(ST_MakePoint(100.4795, 13.7780), 4326)),
('Talat Phlu Street Food', 'Culinary', 1, 'Budget-friendly historical street food hub near Tha Phra station.', ST_SetSRID(ST_MakePoint(100.4750, 13.7250), 4326));
