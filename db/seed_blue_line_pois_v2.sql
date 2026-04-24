-- =============================================================================
-- Exitwise: Blue Line POI expansion (v2)
-- =============================================================================
-- Adds the 20 missing MRT Blue Line stations (IDs 19-38), key station_exits
-- for each new station, and ~300 new POIs spanning all 38 stations with a
-- ~60/40 niche-to-mainstream mix: famous landmarks + hole-in-the-wall eats,
-- specialty shops, community temples, and local-only markets.
--
-- Existing 18 stations keep their ids (1-18). New stations are appended.
--
-- Idempotency: this script is append-only. Running twice creates duplicate
-- POI rows. Wrap in BEGIN/ROLLBACK to test, or diff before applying.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. STATIONS — add the 20 missing Blue Line nodes.
--    ID map (for reference only; Blue Line codes BL01-BL38):
--      1=Lak Song/BL38   2=Phasi Charoen/BL36   3=Bang Wa/BL34
--      4=Itsaraphap/BL32 5=Sanam Chai/BL31      6=Sam Yot/BL30
--      7=Wat Mangkon/BL29 8=Hua Lamphong/BL28   9=Sam Yan/BL27
--      10=Silom/BL26     11=Lumphini/BL25       12=Sukhumvit/BL22
--      13=Phra Ram 9/BL20 14=Thailand Cultural Centre/BL19
--      15=Kamphaeng Phet/BL12 16=Chatuchak Park/BL13
--      17=Bang Yi Khan/BL05   18=Tha Phra/BL01
--      19=Bang Khae/BL37  20=Phetkasem 48/BL35  21=Bang Phai/BL33
--      22=Charan 13/BL02  23=Fai Chai/BL03      24=Bang Khun Non/BL04
--      25=Sirindhorn/BL06 26=Bang Phlat/BL07    27=Bang O/BL08
--      28=Bang Pho/BL09   29=Tao Poon/BL10      30=Bang Sue/BL11
--      31=Phahonyothin/BL14 32=Lat Phrao/BL15   33=Ratchadaphisek/BL16
--      34=Sutthisan/BL17  35=Huai Khwang/BL18   36=Phetchaburi/BL21
--      37=Queen Sirikit NCC/BL23  38=Khlong Toei/BL24
-- -----------------------------------------------------------------------------
INSERT INTO stations (id, name_en, name_th, line, location) VALUES
(19, 'Bang Khae', 'บางแค', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4218, 13.7127), 4326)),
(20, 'Phetkasem 48', 'เพชรเกษม 48', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4469, 13.7158), 4326)),
(21, 'Bang Phai', 'บางไผ่', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4669, 13.7236), 4326)),
(22, 'Charan 13', 'จรัญฯ 13', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4736, 13.7411), 4326)),
(23, 'Fai Chai', 'ไฟฉาย', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4729, 13.7561), 4326)),
(24, 'Bang Khun Non', 'บางขุนนนท์', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4750, 13.7691), 4326)),
(25, 'Sirindhorn', 'สิรินธร', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4817, 13.7854), 4326)),
(26, 'Bang Phlat', 'บางพลัด', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4894, 13.7953), 4326)),
(27, 'Bang O', 'บางอ้อ', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.4941, 13.8057), 4326)),
(28, 'Bang Pho', 'บางโพ', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5165, 13.8078), 4326)),
(29, 'Tao Poon', 'เตาปูน', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5298, 13.8079), 4326)),
(30, 'Bang Sue', 'บางซื่อ', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5372, 13.8035), 4326)),
(31, 'Phahonyothin', 'พหลโยธิน', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5627, 13.8143), 4326)),
(32, 'Lat Phrao', 'ลาดพร้าว', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5737, 13.8156), 4326)),
(33, 'Ratchadaphisek', 'รัชดาภิเษก', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5738, 13.7970), 4326)),
(34, 'Sutthisan', 'สุทธิสาร', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5738, 13.7894), 4326)),
(35, 'Huai Khwang', 'ห้วยขวาง', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5739, 13.7781), 4326)),
(36, 'Phetchaburi', 'เพชรบุรี', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5672, 13.7487), 4326)),
(37, 'Queen Sirikit NCC', 'ศูนย์การประชุมฯ', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5610, 13.7232), 4326)),
(38, 'Khlong Toei', 'คลองเตย', 'MRT Blue', ST_SetSRID(ST_MakePoint(100.5537, 13.7236), 4326))
ON CONFLICT (id) DO NOTHING;

-- Keep the SERIAL sequence in sync now that we've inserted explicit IDs.
SELECT setval('stations_id_seq', GREATEST((SELECT MAX(id) FROM stations), 1), true);

-- -----------------------------------------------------------------------------
-- 2. STATION_EXITS — key exits for the 20 new stations (landmark-tagged).
-- -----------------------------------------------------------------------------
INSERT INTO station_exits (station_id, exit_number, description, location) VALUES
(19, '1', 'Bang Khae Market', ST_SetSRID(ST_MakePoint(100.4222, 13.7131), 4326)),
(19, '3', 'Wat Nimmananoradee', ST_SetSRID(ST_MakePoint(100.4215, 13.7122), 4326)),
(20, '2', 'Phet Kasem 48 / Wat Chan Praditharam', ST_SetSRID(ST_MakePoint(100.4473, 13.7162), 4326)),
(21, '1', 'Phyathai 3 Hospital', ST_SetSRID(ST_MakePoint(100.4673, 13.7240), 4326)),
(22, '2', 'HomePro Charansanitwong', ST_SetSRID(ST_MakePoint(100.4740, 13.7415), 4326)),
(23, '1', 'Siriraj Hospital West Wing', ST_SetSRID(ST_MakePoint(100.4733, 13.7565), 4326)),
(23, '2', 'Bang Khun Si Market', ST_SetSRID(ST_MakePoint(100.4725, 13.7557), 4326)),
(24, '3', 'Wat Suwannaram Ratchaworawihan', ST_SetSRID(ST_MakePoint(100.4754, 13.7695), 4326)),
(25, '1', 'Tang Hua Seng Sirindhorn', ST_SetSRID(ST_MakePoint(100.4821, 13.7858), 4326)),
(26, '2', 'Bang Phlat District Office', ST_SetSRID(ST_MakePoint(100.4898, 13.7957), 4326)),
(27, '4', 'Yanhee Hospital', ST_SetSRID(ST_MakePoint(100.4945, 13.8061), 4326)),
(28, '1', 'Bang Pho Pier / Teakwood District', ST_SetSRID(ST_MakePoint(100.5169, 13.8082), 4326)),
(29, '3', 'Tao Poon Market / MRT Purple Line Transfer', ST_SetSRID(ST_MakePoint(100.5302, 13.8083), 4326)),
(30, '1', 'Krung Thep Aphiwat Central Terminal', ST_SetSRID(ST_MakePoint(100.5376, 13.8039), 4326)),
(31, '3', 'Central Plaza Lad Phrao', ST_SetSRID(ST_MakePoint(100.5631, 13.8147), 4326)),
(31, '5', 'Union Mall', ST_SetSRID(ST_MakePoint(100.5623, 13.8138), 4326)),
(32, '4', 'Lat Phrao Park-and-Ride / MRT Yellow Line', ST_SetSRID(ST_MakePoint(100.5741, 13.8160), 4326)),
(33, '3', 'Esplanade Ratchada (north)', ST_SetSRID(ST_MakePoint(100.5742, 13.7974), 4326)),
(34, '2', 'Muang Thai Phatra Market', ST_SetSRID(ST_MakePoint(100.5742, 13.7898), 4326)),
(35, '4', 'Huai Khwang Market / Ganesha Shrine', ST_SetSRID(ST_MakePoint(100.5743, 13.7785), 4326)),
(36, '1', 'Makkasan Airport Rail Link Skywalk', ST_SetSRID(ST_MakePoint(100.5676, 13.7491), 4326)),
(36, '2', 'Asoke Pier / Khlong Saen Saep', ST_SetSRID(ST_MakePoint(100.5668, 13.7483), 4326)),
(37, '3', 'Queen Sirikit Convention Centre / Benjakitti Park', ST_SetSRID(ST_MakePoint(100.5614, 13.7236), 4326)),
(38, '1', 'Khlong Toei Fresh Market', ST_SetSRID(ST_MakePoint(100.5541, 13.7240), 4326)),
(38, '2', 'MedPark Hospital', ST_SetSRID(ST_MakePoint(100.5533, 13.7232), 4326));

-- -----------------------------------------------------------------------------
-- 3. POIS — ~300 new points of interest, grouped by station (BL38 -> BL01 -> BL02+ spur).
--    Schema used: name, category_slug, price_level (1-4 or NULL),
--    description (<=150 chars), location (Point 4326).
--    Coordinates are station-anchored approximations suitable for walking
--    distance computation; fine-tune later with Google Maps Place IDs.
-- -----------------------------------------------------------------------------

INSERT INTO pois (name, category_slug, price_level, description, location) VALUES

-- ======================= BL38 Lak Song (id 1, ~100.404, 13.712) =======================
('The Mall Bangkae (Phase 2)', 'shopping_mall', 2, 'The classic mid-range sister wing of The Mall Lifestore — cheaper food court and legacy retail tenants.', ST_SetSRID(ST_MakePoint(100.4059, 13.7119), 4326)),
('Phutthamonthon Sai 3 Street Food Alley', 'culinary', 1, 'Local-only row of skewer carts, boat noodles and moo ping behind the park-and-ride — busiest 6-9pm.', ST_SetSRID(ST_MakePoint(100.4052, 13.7108), 4326)),
('Jay Fai''s Cousin – Kuay Jab Ouan', 'culinary', 1, 'Peppery rolled-noodle pork soup served out of a tin-roof shophouse on Phet Kasem Soi 81. Open 5am-1pm.', ST_SetSRID(ST_MakePoint(100.4033, 13.7135), 4326)),
('Kasemrad Bangkhae Hospital', 'sight', 3, 'Private hospital and 24/7 ER directly served by the Lak Song park-and-ride skybridge.', ST_SetSRID(ST_MakePoint(100.4028, 13.7144), 4326)),
('Lak Song Flea Market (weekend)', 'night_market', 1, 'Sprawling weekend flea lot under the elevated tracks — second-hand tools, vintage denim, street food.', ST_SetSRID(ST_MakePoint(100.4038, 13.7103), 4326)),
('Wat Mai Yai Nuai', 'heritage', 1, 'Quiet community temple with a gilded ordination hall — visited mostly by locals on auspicious days.', ST_SetSRID(ST_MakePoint(100.4072, 13.7142), 4326)),
('Salt Coffee Bangkae', 'cafe', 2, 'Tiny third-wave cafe known for its salted caramel cold brew and minimalist concrete interior.', ST_SetSRID(ST_MakePoint(100.4046, 13.7131), 4326)),
('Phutthamonthon Park (eastern edge)', 'park', 1, 'Monumental Buddha park with 2.5km running loop, lotus ponds, and a 15m standing Buddha statue.', ST_SetSRID(ST_MakePoint(100.3962, 13.7158), 4326)),
('Khao Mun Gai Sanam Luang Sai 3', 'culinary', 1, 'Hainanese chicken rice vendor famous among taxi drivers. Cash only; sold out by 2pm.', ST_SetSRID(ST_MakePoint(100.4044, 13.7145), 4326)),
('Lotus''s Extra Phet Kasem', 'retail', 2, 'Hypermarket with cheap souvenir snacks and a rooftop food court that locals use to escape the heat.', ST_SetSRID(ST_MakePoint(100.4070, 13.7134), 4326)),

-- ======================= BL37 Bang Khae (id 19, ~100.4218, 13.7127) =======================
('Bang Khae Fresh Market', 'culinary', 1, 'Old-school wet market — durians in season, dried squid, hand-pounded curry paste by the kilo.', ST_SetSRID(ST_MakePoint(100.4223, 13.7129), 4326)),
('Wat Nimmananoradee', 'heritage', 1, 'Low-profile community temple dating to early Rattanakosin; famed for its miniature ubosot.', ST_SetSRID(ST_MakePoint(100.4214, 13.7120), 4326)),
('Rajawinit Primary School', 'sight', NULL, 'Heritage public primary school — landmark drop-off point for morning commuters.', ST_SetSRID(ST_MakePoint(100.4226, 13.7134), 4326)),
('Guay Tiew Rua Bang Khae', 'culinary', 1, 'Pork-blood boat noodles stall so tiny you eat standing at a makeshift counter. ฿35 per bowl.', ST_SetSRID(ST_MakePoint(100.4219, 13.7121), 4326)),
('Phetkasem Night Food Street', 'night_market', 1, 'Nightly food carts that set up along Phet Kasem soi 62 — grilled pork, mango sticky rice, Thai-Isan fare.', ST_SetSRID(ST_MakePoint(100.4211, 13.7136), 4326)),
('Jek Pia Old-School Bakery', 'culinary', 1, 'Pandan custard buns and coconut cream cake from a 40-year-old Teochew-Thai family bakery.', ST_SetSRID(ST_MakePoint(100.4233, 13.7126), 4326)),
('Phetkasem 77 Dessert Row', 'culinary', 1, 'Cluster of tiny Thai dessert stalls — ruam mit, bua loy, luk chup — all open until sundown.', ST_SetSRID(ST_MakePoint(100.4207, 13.7123), 4326)),
('Bang Khae Public Library', 'sight', 1, 'Small community library with free AC — a known secret study spot for local university students.', ST_SetSRID(ST_MakePoint(100.4230, 13.7139), 4326)),
('SB Furniture Flagship Bang Khae', 'retail', 3, 'Full-scale Thai furniture showroom — often used as a Sunday air-con escape by families.', ST_SetSRID(ST_MakePoint(100.4237, 13.7118), 4326)),

-- ======================= BL36 Phasi Charoen (id 2, ~100.435, 13.714) =======================
('Seacon Bangkae Food Park', 'culinary', 2, 'Mid-market food court inside Seacon with Thai-Chinese-Japanese options at hawker prices.', ST_SetSRID(ST_MakePoint(100.4359, 13.7147), 4326)),
('Phetkasem 2 Hospital', 'sight', 3, 'Full-service private hospital directly accessible from the Seacon skywalk.', ST_SetSRID(ST_MakePoint(100.4344, 13.7130), 4326)),
('Phetkasem 35 Pier', 'transit', NULL, 'Klong Phasi Charoen boat stop — ฿15 canal commute westward toward Nonthaburi.', ST_SetSRID(ST_MakePoint(100.4345, 13.7156), 4326)),
('Pochana Soi 35 Pork Leg Rice', 'culinary', 1, 'Family-run Khao Kha Moo joint with broth simmered since dawn; ask for extra chilli vinegar.', ST_SetSRID(ST_MakePoint(100.4347, 13.7152), 4326)),
('Somtam Jay Daeng Phasi Charoen', 'culinary', 1, 'Cult Isan-style papaya salad stall — try the tam poo pla ra if you dare.', ST_SetSRID(ST_MakePoint(100.4336, 13.7137), 4326)),
('Bansomdejchaopraya Rajabhat University', 'sight', NULL, 'Old-school Thai university campus; the lotus pond lawn is a quiet photo spot.', ST_SetSRID(ST_MakePoint(100.4330, 13.7154), 4326)),
('Tek Heng Juice Corner', 'cafe', 1, 'Legacy Chinese-Thai juice bar — famous for its bittersweet chrysanthemum-longan cooler.', ST_SetSRID(ST_MakePoint(100.4360, 13.7139), 4326)),
('Wat Paknam Phasi Charoen', 'heritage', 1, 'Stunning glass stupa temple with a 69m bronze Buddha — a photographic pilgrimage spot for many.', ST_SetSRID(ST_MakePoint(100.4676, 13.7186), 4326)),
('Klong Phasi Charoen Bike Path', 'park', 1, 'Canal-side bicycle and jogging path along the old waterway — rentals near Exit 3.', ST_SetSRID(ST_MakePoint(100.4355, 13.7160), 4326)),

-- ======================= BL35 Phetkasem 48 (id 20, ~100.4469, 13.7158) =======================
('Wat Chan Praditharam', 'heritage', 1, 'Peaceful local temple — the monks offer free meditation classes on Saturday mornings.', ST_SetSRID(ST_MakePoint(100.4474, 13.7163), 4326)),
('Wat Rang Bua', 'heritage', 1, 'Tiny temple with hand-carved wooden pillars — almost never crowded, unlike inner-city temples.', ST_SetSRID(ST_MakePoint(100.4455, 13.7141), 4326)),
('Shrine of the Tiger God', 'sight', 1, 'Small Chinese folk-religion shrine on Phet Kasem Soi 48 — devotees offer pork rinds for luck.', ST_SetSRID(ST_MakePoint(100.4462, 13.7162), 4326)),
('Phet Kasem 48 Morning Market', 'culinary', 1, 'Dawn produce market that disappears by 9am — best place for banana blossoms and freshwater fish.', ST_SetSRID(ST_MakePoint(100.4472, 13.7155), 4326)),
('Tao Gia Seng Khanom Jeen', 'culinary', 1, 'Tiny shophouse specializing in fermented rice noodles with fish curry — locals only.', ST_SetSRID(ST_MakePoint(100.4468, 13.7152), 4326)),
('Phetkasem Soi 48 Cafe Alley', 'cafe', 2, 'Three-storey loft cafe tucked into a car-repair alley — artsy crowd, strong espresso.', ST_SetSRID(ST_MakePoint(100.4463, 13.7171), 4326)),
('Family-Run Thai Massage Phet 48', 'sight', 2, 'Untouristed massage shop — ฿300/hr by grandma practitioners. No English menu.', ST_SetSRID(ST_MakePoint(100.4476, 13.7158), 4326)),
('Khanom Tokyo Phet Kasem', 'culinary', 1, 'Legendary cart selling tokyo pancakes (tiny sausage or sweet coconut filling). ฿10 each.', ST_SetSRID(ST_MakePoint(100.4471, 13.7162), 4326)),

-- ======================= BL34 Bang Wa (id 3, ~100.457, 13.720) =======================
('Saai Plara Kaen Noey', 'culinary', 1, 'Fiery southern-Thai fish curry on Phetkasem Soi 36/1 — rice vanishes fast at lunch.', ST_SetSRID(ST_MakePoint(100.4565, 13.7208), 4326)),
('Bang Phai Thong Chicken and Rice', 'culinary', 1, 'Long-running Khao Man Gai stall famed for its crisp soy-braised chicken. Get there before 1pm.', ST_SetSRID(ST_MakePoint(100.4576, 13.7212), 4326)),
('Bang Wa Pier', 'transit', NULL, 'Klong Phasi Charoen boat terminus — 200m elevated walkway links to the MRT/BTS interchange.', ST_SetSRID(ST_MakePoint(100.4566, 13.7198), 4326)),
('BTS Bang Wa Interchange', 'transit', NULL, 'Transfer to BTS Silom Line — skip the CBD congestion entirely.', ST_SetSRID(ST_MakePoint(100.4571, 13.7209), 4326)),
('The Mall Lifestore Tha Phra', 'shopping_mall', 2, 'Recently refreshed lifestyle mall aimed at Thonburi families. Good rainy-day hideout.', ST_SetSRID(ST_MakePoint(100.4752, 13.7288), 4326)),
('Bang Wa Klong-Side Cafe', 'cafe', 2, 'Wooden deck cafe overhanging the canal — locals bring their dogs at sunset.', ST_SetSRID(ST_MakePoint(100.4560, 13.7202), 4326)),
('Talat Phlu Street Food (northern entry)', 'culinary', 1, 'Entry into the legendary Talat Phlu hawker area, reachable by 15-min walk or short songthaew.', ST_SetSRID(ST_MakePoint(100.4750, 13.7250), 4326)),
('Wat Chantharam', 'heritage', 1, 'Hidden canal-side temple ignored by tour groups; serene gold-leaf main hall.', ST_SetSRID(ST_MakePoint(100.4558, 13.7220), 4326)),
('Bang Wa Night Food Row', 'night_market', 1, 'Nightly cluster of sticky-rice mango, grilled pork neck and oyster omelette carts.', ST_SetSRID(ST_MakePoint(100.4572, 13.7195), 4326)),

-- ======================= BL33 Bang Phai (id 21, ~100.4669, 13.7236) =======================
('Phyathai 3 Hospital', 'sight', 3, 'Private hospital complex — the main medical anchor of the Thonburi-south corridor.', ST_SetSRID(ST_MakePoint(100.4673, 13.7241), 4326)),
('Bang Phai Hospital', 'sight', 2, 'Mid-market general hospital — known for affordable orthopedic care.', ST_SetSRID(ST_MakePoint(100.4665, 13.7230), 4326)),
('Wat Pradu Bang Chak', 'heritage', 1, 'Tiny historic temple tucked among auto-parts shops — local legend says it blesses new cars.', ST_SetSRID(ST_MakePoint(100.4680, 13.7245), 4326)),
('Bang Phai Noodle Alley', 'culinary', 1, 'Cluster of duck, beef and tom yum noodle stalls along Soi 37 — all open by 5:30am.', ST_SetSRID(ST_MakePoint(100.4672, 13.7227), 4326)),
('Porpia Sod Tao Kae', 'culinary', 1, 'Old Teochew cart making fresh popiah spring rolls to order — the turnip filling is the magic.', ST_SetSRID(ST_MakePoint(100.4676, 13.7239), 4326)),
('Bang Phai Small Park', 'park', 1, 'Pocket park with a lap-pool-sized pond — locals do tai chi here at 6am.', ST_SetSRID(ST_MakePoint(100.4663, 13.7243), 4326)),
('Ruan Thai Furniture Souvenir Shop', 'retail', 2, 'Hidden teakwood souvenir workshop — handmade miniature Thai houses.', ST_SetSRID(ST_MakePoint(100.4674, 13.7228), 4326)),
('Cafe de Bang Phai', 'cafe', 1, 'Unpretentious neighborhood cafe with ฿45 lattes and zero tourists.', ST_SetSRID(ST_MakePoint(100.4668, 13.7244), 4326)),

-- ======================= BL32 Itsaraphap (id 4, ~100.485, 13.738) =======================
('Kudi Chin Community', 'heritage', 1, 'Historic Portuguese-descended community on the Thonburi bank — Kanom Farang Kudi Chin buns are the local specialty.', ST_SetSRID(ST_MakePoint(100.4880, 13.7388), 4326)),
('Santa Cruz Church', 'heritage', 1, 'Pink-domed Catholic church at the heart of Kudi Chin — free to enter outside service hours.', ST_SetSRID(ST_MakePoint(100.4882, 13.7392), 4326)),
('Thanusingha Cake House', 'culinary', 1, 'Fifth-generation bakery making Kanom Farang — cupcake-sized Portuguese-Thai fusion since 1807.', ST_SetSRID(ST_MakePoint(100.4884, 13.7390), 4326)),
('Wat Hong Rattanaram Ratchaworawihan', 'heritage', 1, 'Royal Thonburi-era temple with golden swan iconography — mirrored inside Itsaraphap station.', ST_SetSRID(ST_MakePoint(100.4869, 13.7385), 4326)),
('Wat Kalayanamitr', 'heritage', 1, 'Riverside temple housing the largest indoor Buddha in Bangkok — quiet even on weekends.', ST_SetSRID(ST_MakePoint(100.4889, 13.7402), 4326)),
('Taweethapisek School', 'sight', NULL, 'Century-old Thai public school; its art-deco facade is an IG-hidden gem.', ST_SetSRID(ST_MakePoint(100.4862, 13.7380), 4326)),
('Thonburi Hospital', 'sight', 3, 'Major private hospital for the west bank — direct songthaew link to Itsaraphap.', ST_SetSRID(ST_MakePoint(100.4835, 13.7398), 4326)),
('Krua Apsorn Thonburi (secret branch)', 'culinary', 2, 'Lesser-known second outlet of the Michelin-Bib crab-omelette legend; no tourist queue.', ST_SetSRID(ST_MakePoint(100.4870, 13.7385), 4326)),
('Chao Phraya Cross-River Ferry (Tha Tian)', 'transit', 1, '฿5 ferry to Wat Arun and onward to Wat Pho — the cheapest river ride in Bangkok.', ST_SetSRID(ST_MakePoint(100.4886, 13.7434), 4326)),
('Baan Silapin (Artist''s House)', 'heritage', 1, 'Wooden canal-side artist compound with daily Thai puppet shows at 2pm on weekends.', ST_SetSRID(ST_MakePoint(100.4688, 13.7362), 4326)),

-- ======================= BL31 Sanam Chai (id 5, ~100.493, 13.743) =======================
('Wat Pho (Temple of Reclining Buddha)', 'heritage', 2, 'Home to the 46m gold-leafed Reclining Buddha and the birthplace of Thai massage.', ST_SetSRID(ST_MakePoint(100.4932, 13.7466), 4326)),
('Museum Siam', 'sight', 1, 'Interactive Thai-identity museum right above the station — AC relief with real content.', ST_SetSRID(ST_MakePoint(100.4931, 13.7449), 4326)),
('Pak Khlong Talat (Flower Market)', 'night_market', 1, '24-hour wholesale flower market — most atmospheric between 11pm and 3am.', ST_SetSRID(ST_MakePoint(100.4970, 13.7413), 4326)),
('Yodpiman River Walk', 'retail', 2, 'Neo-colonial riverside mall — boutique souvenirs, quiet rooftop views of Wat Arun.', ST_SetSRID(ST_MakePoint(100.4976, 13.7431), 4326)),
('Rajinee Pier', 'transit', NULL, 'Chao Phraya Express Boat and Mine Smart Ferry stop — direct to Icon Siam, Asiatique.', ST_SetSRID(ST_MakePoint(100.4936, 13.7465), 4326)),
('Tha Tian Market', 'culinary', 1, 'Historic covered market next to Wat Pho — the mango sticky rice stall is cheaper than Yaowarat.', ST_SetSRID(ST_MakePoint(100.4920, 13.7456), 4326)),
('The Deck by Arun Residence', 'restaurant', 4, 'Tourist-famous but genuinely stunning riverside Thai restaurant facing Wat Arun.', ST_SetSRID(ST_MakePoint(100.4903, 13.7437), 4326)),
('Sala Rattanakosin Rooftop Bar', 'restaurant', 4, 'Hidden rooftop bar with the postcard Wat Arun view — sunset reservations only.', ST_SetSRID(ST_MakePoint(100.4899, 13.7442), 4326)),
('Chetawan Thai Traditional Medical School', 'sight', 2, 'Wat Pho''s affiliated school — book a 90-min massage from a master for ฿520.', ST_SetSRID(ST_MakePoint(100.4928, 13.7470), 4326)),
('Jay Fai (satellite night cart)', 'culinary', 3, 'Lesser-known disciple of the Michelin crab-omelette queen — opens 6pm, sold out by 10pm.', ST_SetSRID(ST_MakePoint(100.4962, 13.7443), 4326)),
('Klong Lod Canal Walk', 'park', 1, 'Shaded canal promenade north of Museum Siam — unreal sunset colour palette.', ST_SetSRID(ST_MakePoint(100.4950, 13.7465), 4326)),

-- ======================= BL30 Sam Yot (id 6, ~100.503, 13.746) =======================
('Phahurat Market (Little India)', 'culinary', 1, 'Dense textile district — grab a plate of samosa and chai on Chakraphet Road.', ST_SetSRID(ST_MakePoint(100.5009, 13.7458), 4326)),
('The Old Siam Plaza', 'retail', 1, 'Traditional mall for Thai snacks, silks and regional sweets — skip the global chains.', ST_SetSRID(ST_MakePoint(100.5025, 13.7452), 4326)),
('Suan Rommaneenat Park', 'park', 1, 'Shaded pocket park with a heritage prison-wall ruin and free morning tai chi classes.', ST_SetSRID(ST_MakePoint(100.5029, 13.7479), 4326)),
('Wat Suthat (Giant Swing)', 'heritage', 2, 'Famed temple with the towering red Sao Ching Cha — breathtaking Ramakien murals inside.', ST_SetSRID(ST_MakePoint(100.5012, 13.7514), 4326)),
('Amulet Market (Wang Burapha)', 'sight', 2, 'Oldest amulet trading row in Bangkok — monks and collectors haggle over 100-year charms.', ST_SetSRID(ST_MakePoint(100.5028, 13.7467), 4326)),
('Banglamphu Pickled-Fruit Street', 'culinary', 1, 'Warren of mom-and-pop sellers of ma-kam and salted plums — great edible souvenirs.', ST_SetSRID(ST_MakePoint(100.5021, 13.7461), 4326)),
('Jipatha Gelato', 'cafe', 2, 'Hole-in-the-wall Thai-flavor gelato: durian, pandan, salted-egg yolk.', ST_SetSRID(ST_MakePoint(100.5038, 13.7459), 4326)),
('Sikh Gurudwara Phahurat', 'heritage', 1, 'Golden-domed Sikh temple — free langar meal every afternoon, all welcome.', ST_SetSRID(ST_MakePoint(100.5018, 13.7456), 4326)),
('India Emporium', 'retail', 2, 'Air-conditioned multi-storey market for saris, spices, Indian sweets — an AC escape.', ST_SetSRID(ST_MakePoint(100.5019, 13.7461), 4326)),
('Wang Burapha Record Shops', 'retail', 2, 'Cluster of vintage vinyl shops — Thai pop from the 70s at bargain prices.', ST_SetSRID(ST_MakePoint(100.5034, 13.7463), 4326)),

-- ======================= BL29 Wat Mangkon (id 7, ~100.509, 13.743) =======================
('Pa Jin''s Blanched Cockles', 'culinary', 1, 'Street stall off Phadung Dao Rd famed for hoy kraeng — ฿100, eat while standing.', ST_SetSRID(ST_MakePoint(100.5099, 13.7412), 4326)),
('Sweet Time Dessert', 'culinary', 1, 'Tiny dessert shop for mango sticky rice and durian sticky rice — open until 2am.', ST_SetSRID(ST_MakePoint(100.5102, 13.7415), 4326)),
('Sampeng Lane', 'retail', 1, 'Narrow wholesale alley — everything from hair clips to Lego knockoffs at rock-bottom prices.', ST_SetSRID(ST_MakePoint(100.5075, 13.7431), 4326)),
('Am Chinatown (The Arts Mall)', 'retail', 2, 'Small air-conditioned cultural mall with Thai-Chinese artist shops.', ST_SetSRID(ST_MakePoint(100.5098, 13.7419), 4326)),
('Suea Pa Plaza Electronics', 'retail', 2, 'Crowded electronics tower — best prices on cables, speakers, used cameras.', ST_SetSRID(ST_MakePoint(100.5083, 13.7451), 4326)),
('Nai Mong Hoi Thod', 'culinary', 1, 'Michelin-Bib crispy oyster-omelette shophouse in an alley off Soi Phlap Phla Chai.', ST_SetSRID(ST_MakePoint(100.5085, 13.7429), 4326)),
('T&K Seafood', 'restaurant', 2, 'Iconic green-shirted corner seafood joint with grilled river prawns and crab curry.', ST_SetSRID(ST_MakePoint(100.5098, 13.7411), 4326)),
('Hua Seng Hong', 'restaurant', 2, 'Legendary Teochew restaurant for shark fin soup (ethical options now) and duck rice.', ST_SetSRID(ST_MakePoint(100.5109, 13.7412), 4326)),
('Teck Heng Yoo Juice', 'cafe', 1, 'Third-generation herbal juice stand — try the cactus juice if you dare.', ST_SetSRID(ST_MakePoint(100.5091, 13.7425), 4326)),
('Talat Noi Street Art', 'heritage', 1, 'Riverside micro-neighborhood of vintage auto-parts, IG cafes, and heritage shophouse art.', ST_SetSRID(ST_MakePoint(100.5134, 13.7372), 4326)),
('Wat Traimit South Entrance', 'heritage', 1, 'Back gate to the solid gold Buddha temple — shorter queue than Hua Lamphong''s main gate.', ST_SetSRID(ST_MakePoint(100.5139, 13.7377), 4326)),

-- ======================= BL28 Hua Lamphong (id 8, ~100.517, 13.736) =======================
('Wat Traimit (Golden Buddha)', 'heritage', 1, 'Home to the world''s largest solid gold Buddha (5.5 tonnes) — skip the museum entry, the temple alone is worth it.', ST_SetSRID(ST_MakePoint(100.5139, 13.7377), 4326)),
('Hua Lamphong Railway Station', 'heritage', 1, '1916 Italian-designed railway terminus — train-spotting and architecture even after scheduled trains moved.', ST_SetSRID(ST_MakePoint(100.5170, 13.7379), 4326)),
('Eiah Sae Coffee (since 1927)', 'cafe', 1, 'Thailand''s oldest roastery — ฿30 for a kopi with a sweetened-condensed-milk pull.', ST_SetSRID(ST_MakePoint(100.5159, 13.7372), 4326)),
('Unical Hom (vintage tea room)', 'cafe', 2, 'Heritage shophouse cafe serving Thai oolong and pandan chiffon cake under fifty-year-old beams.', ST_SetSRID(ST_MakePoint(100.5164, 13.7369), 4326)),
('Chua Kuang Heng (gai yang)', 'culinary', 1, 'Charcoal-grilled-chicken master since 1972 — Isan-style with tamarind dipping sauce.', ST_SetSRID(ST_MakePoint(100.5146, 13.7376), 4326)),
('Song Wat Road', 'heritage', 1, 'Recently revitalized historic commercial street — indie cafes, art galleries, pre-war architecture.', ST_SetSRID(ST_MakePoint(100.5138, 13.7374), 4326)),
('Mother Roaster', 'cafe', 2, 'Top-floor loft cafe in a Talat Noi shophouse — single-origin Thai beans, tiny capacity.', ST_SetSRID(ST_MakePoint(100.5140, 13.7370), 4326)),
('Lo-Fi Spot Bangkok', 'cafe', 2, 'Lo-fi study cafe with cassette deco — hidden on a Chinatown side soi.', ST_SetSRID(ST_MakePoint(100.5158, 13.7368), 4326)),
('The Kraft Bangkok', 'cafe', 2, 'Industrial craft-beer taproom in a converted warehouse. ฿200 pints — rare in old town.', ST_SetSRID(ST_MakePoint(100.5163, 13.7374), 4326)),
('Wat Chakrawat Crocodile', 'heritage', 1, 'Weird free attraction — a small temple keeps live crocodiles in its back pond.', ST_SetSRID(ST_MakePoint(100.5083, 13.7405), 4326)),

-- ======================= BL27 Sam Yan (id 9, ~100.528, 13.732) =======================
('Chulalongkorn University Main Campus', 'sight', NULL, 'Thailand''s oldest university — scenic lawn, Chamchuri statue, weekly student events.', ST_SetSRID(ST_MakePoint(100.5324, 13.7387), 4326)),
('Sam Yan Market', 'culinary', 1, 'Traditional wet market with cult-favorite hor mok and 40-year-old pad kra prao vendor.', ST_SetSRID(ST_MakePoint(100.5298, 13.7338), 4326)),
('Queen Saovabha Snake Farm', 'sight', 2, 'Live snake-milking demo by the Thai Red Cross; venomous species on show. Quirky must-see.', ST_SetSRID(ST_MakePoint(100.5348, 13.7334), 4326)),
('Wat Hua Lamphong', 'heritage', 1, 'Popular merit-making temple for coffin donations — uniquely Thai ritual, tourists welcome.', ST_SetSRID(ST_MakePoint(100.5298, 13.7311), 4326)),
('Chamchuri Square', 'shopping_mall', 2, 'Office-retail mall connected by tunnel — surprisingly good Thai-Chinese food court.', ST_SetSRID(ST_MakePoint(100.5287, 13.7335), 4326)),
('Jay Fai Fried Mussel Omelette Soi Chula 42', 'culinary', 1, 'Chula-student favorite — no relation to the Michelin one, just equally delicious.', ST_SetSRID(ST_MakePoint(100.5311, 13.7359), 4326)),
('Jamjuree Art Gallery', 'sight', 1, 'Free student-curated gallery inside Chula — rotating exhibitions.', ST_SetSRID(ST_MakePoint(100.5320, 13.7392), 4326)),
('100 Mahaseth', 'restaurant', 3, 'Nose-to-tail modern Isan restaurant in a heritage rowhouse — bone-marrow laap is the signature.', ST_SetSRID(ST_MakePoint(100.5263, 13.7349), 4326)),
('Chula Centenary Park', 'park', 1, 'Tiered eco-park with urban farming plots, free art installations, sunset views.', ST_SetSRID(ST_MakePoint(100.5298, 13.7375), 4326)),
('Rongros Samyan (craft cocktails)', 'restaurant', 3, 'Speakeasy-ish bar in a converted rice mill off Banthat Thong — Thai-herb-forward drinks.', ST_SetSRID(ST_MakePoint(100.5278, 13.7342), 4326)),
('Banthat Thong Food Street', 'culinary', 1, 'Thailand''s most-instagrammed foodie corridor — Jeh O tom yum mama, Yaowarat rice porridge.', ST_SetSRID(ST_MakePoint(100.5275, 13.7360), 4326)),

-- ======================= BL26 Silom (id 10, ~100.537, 13.728) =======================
('Lumphini Park', 'park', 1, 'Bangkok''s central lung — rent a paddle boat, spot monitor lizards, catch aerobics at 5pm.', ST_SetSRID(ST_MakePoint(100.5430, 13.7305), 4326)),
('Patpong Night Market', 'night_market', 2, 'Infamous night market — souvenirs above, red-light district around.', ST_SetSRID(ST_MakePoint(100.5334, 13.7284), 4326)),
('Dusit Thani Hotel (new tower)', 'sight', 4, 'Recently rebuilt landmark luxury hotel — legendary afternoon tea in the top-floor lounge.', ST_SetSRID(ST_MakePoint(100.5380, 13.7279), 4326)),
('Pa Suk Nam Ngiao', 'culinary', 1, 'Silom Soi 3 Lanna-style noodle soup joint — rare northern-Thai food in the CBD.', ST_SetSRID(ST_MakePoint(100.5365, 13.7272), 4326)),
('POP MART Central Park', 'retail', 3, 'Designer toy blind-box store — long queues on weekends.', ST_SetSRID(ST_MakePoint(100.5421, 13.7290), 4326)),
('Silom Complex', 'shopping_mall', 3, 'Vertical lunch-hour mall for office workers — Mum Aroi coconut ice cream on the 4th floor.', ST_SetSRID(ST_MakePoint(100.5342, 13.7283), 4326)),
('Maha Uma Devi (Sri Mariamman) Temple', 'heritage', 1, 'Riotous Tamil Hindu temple with colorful gopuram — Friday pujas are intense.', ST_SetSRID(ST_MakePoint(100.5203, 13.7255), 4326)),
('Soi Convent Food Row', 'culinary', 2, 'Office-worker lunch alley — the pad kra prao kai dao stall is a ten-year classic.', ST_SetSRID(ST_MakePoint(100.5351, 13.7284), 4326)),
('Vertigo & Moon Bar (Banyan Tree)', 'restaurant', 4, '61st-floor open-air rooftop cocktail bar — dress code enforced.', ST_SetSRID(ST_MakePoint(100.5430, 13.7237), 4326)),
('Silom Soi 4', 'sight', 3, 'Mixed nightlife alley — gay bars, jazz lounges, late-night pad thai stalls.', ST_SetSRID(ST_MakePoint(100.5331, 13.7273), 4326)),
('Thanon Silom Sunday Walking Lane', 'sight', 1, 'Silom Road closes to cars on some Sundays — impromptu street food and art.', ST_SetSRID(ST_MakePoint(100.5349, 13.7287), 4326)),

-- ======================= BL25 Lumphini (id 11, ~100.545, 13.725) =======================
('Lumpini Boxing Stadium (legacy site)', 'sight', 3, 'Famous Muay Thai venue — now mostly cultural ceremonies; worth the detour for the murals.', ST_SetSRID(ST_MakePoint(100.5431, 13.7225), 4326)),
('Chinese Clock Tower (Lumphini)', 'heritage', 1, 'Ornate Qing-style clock tower donated by the Chinese community; photogenic at golden hour.', ST_SetSRID(ST_MakePoint(100.5417, 13.7258), 4326)),
('Silom Thai Cooking School', 'sight', 2, 'Hands-on market-to-kitchen cooking class — 3hrs, ฿1000, hidden near Soi Convent.', ST_SetSRID(ST_MakePoint(100.5439, 13.7251), 4326)),
('Sawasdee Silom Food Hall', 'culinary', 2, 'Basement food court with regional Thai specialties — Southern gaeng tai pla is on point.', ST_SetSRID(ST_MakePoint(100.5441, 13.7268), 4326)),
('One Bangkok (West Piazza)', 'shopping_mall', 4, 'Luxury mixed-use opened 2024 — art installations, designer flagship stores, open plaza concerts.', ST_SetSRID(ST_MakePoint(100.5458, 13.7265), 4326)),
('Chinese Embassy Neighborhood Sunday Market', 'night_market', 1, 'Small Sunday rotating market on Rama IV — Uyghur-style lamb skewers, dumplings.', ST_SetSRID(ST_MakePoint(100.5468, 13.7248), 4326)),
('Witthayu (Wireless) Embassy Row', 'heritage', NULL, 'Tree-lined street of colonial-era embassies — free quiet walk, zero tourists.', ST_SetSRID(ST_MakePoint(100.5476, 13.7285), 4326)),
('Polo Fried Chicken Soi Polo', 'culinary', 2, 'Isaan-style crispy fried chicken with sticky rice — iconic 50-year-old joint.', ST_SetSRID(ST_MakePoint(100.5471, 13.7324), 4326)),
('Suan Lum Night Market (new site)', 'night_market', 2, 'Reopened night market footprint — food trucks and craft beer in a pocket-size setting.', ST_SetSRID(ST_MakePoint(100.5449, 13.7242), 4326)),
('Lumphini Park Chinese Pavilion', 'park', 1, 'The lotus pond pavilion near Exit 3 is the quietest corner of the whole park.', ST_SetSRID(ST_MakePoint(100.5414, 13.7299), 4326)),

-- ======================= BL24 Khlong Toei (id 38, ~100.5537, 13.7236) =======================
('Khlong Toei Market', 'culinary', 1, 'Bangkok''s biggest wholesale fresh market — open-air, chaotic, best at 6am for the fish auction.', ST_SetSRID(ST_MakePoint(100.5557, 13.7245), 4326)),
('MedPark Hospital', 'sight', 4, 'Futuristic mega-hospital complex — specialist care for international patients.', ST_SetSRID(ST_MakePoint(100.5530, 13.7229), 4326)),
('Thailand Tobacco Factory (park redevelopment)', 'park', 1, 'Former tobacco factory now greened into an urban park extension of Benjakitti.', ST_SetSRID(ST_MakePoint(100.5506, 13.7265), 4326)),
('Khlong Toei Slum Food Tour starting point', 'culinary', 1, 'Gritty community kitchens — Muslim-Thai curries and fresh-made roti.', ST_SetSRID(ST_MakePoint(100.5578, 13.7218), 4326)),
('Penang Market Thai-Muslim Food', 'culinary', 1, 'Hidden halal food row near Rama IV — beef satay and khao mok gai for ฿60.', ST_SetSRID(ST_MakePoint(100.5572, 13.7208), 4326)),
('Bang Kachao Ferry Pier (Khlong Toei)', 'transit', 1, '฿5 ferry to Bang Kachao — aka Bangkok''s green lung, perfect for cycling day trips.', ST_SetSRID(ST_MakePoint(100.5609, 13.7187), 4326)),
('Metropolitan Electricity Authority', 'sight', NULL, 'Legacy infrastructure landmark — mostly for address reference.', ST_SetSRID(ST_MakePoint(100.5519, 13.7262), 4326)),
('Klong Toey Shop-House Cafe Stretch', 'cafe', 2, 'Recently revived stretch of pre-war shop houses converted into micro-cafes.', ST_SetSRID(ST_MakePoint(100.5555, 13.7233), 4326)),
('Thai-Japanese Community Market', 'culinary', 2, 'Weekend Japanese expat market with homemade ramen and onigiri — tucked near Soi Phrom Phong.', ST_SetSRID(ST_MakePoint(100.5549, 13.7208), 4326)),

-- ======================= BL23 Queen Sirikit NCC (id 37, ~100.561, 13.7232) =======================
('Benjakitti Forest Park', 'park', 1, 'Massive redeveloped wetland-forest park — elevated skywalk with CBD views.', ST_SetSRID(ST_MakePoint(100.5583, 13.7276), 4326)),
('Queen Sirikit National Convention Centre', 'sight', 2, 'Recently rebuilt mega-venue for trade shows, book fairs, and gadget expos.', ST_SetSRID(ST_MakePoint(100.5613, 13.7240), 4326)),
('Stock Exchange of Thailand (observation lobby)', 'sight', NULL, 'Free lobby exhibit on Thai capital markets — quirky weekday photo opportunity.', ST_SetSRID(ST_MakePoint(100.5656, 13.7237), 4326)),
('Em Quartier Helix Dining', 'restaurant', 4, 'Spiraling ramp of international restaurants reached by a 500m canal path.', ST_SetSRID(ST_MakePoint(100.5695, 13.7303), 4326)),
('Khlong Toei Bird Farm', 'sight', 1, 'Tucked-away parrot sanctuary and rehoming center — free to visit weekdays.', ST_SetSRID(ST_MakePoint(100.5625, 13.7218), 4326)),
('Benjakitti Lake Running Loop', 'park', 1, '1.8km run around a restored reservoir — flat, shaded, free lockers near Exit 3.', ST_SetSRID(ST_MakePoint(100.5590, 13.7275), 4326)),
('Sunday Sangkha Market (QSNCC lot)', 'night_market', 2, 'Monthly indie-craft market on the convention center lot — zero-waste vendors, indie beer.', ST_SetSRID(ST_MakePoint(100.5618, 13.7238), 4326)),
('Asok Montri Skywalk', 'transit', NULL, '600m elevated walkway connecting QSNCC to Sukhumvit/Asok — AC relief for summer commutes.', ST_SetSRID(ST_MakePoint(100.5602, 13.7259), 4326)),
('Tonkin-Annam', 'restaurant', 3, 'Modern Vietnamese rowhouse restaurant in a converted shop — pho with slow-braised brisket.', ST_SetSRID(ST_MakePoint(100.5625, 13.7248), 4326)),

-- ======================= BL22 Sukhumvit (id 12, ~100.561, 13.737) =======================
('Terminal 21 Asok', 'shopping_mall', 2, 'Airport-themed mall where each floor is a world city — Pier 21 basement food court is unbeatable.', ST_SetSRID(ST_MakePoint(100.5611, 13.7379), 4326)),
('Soi Cowboy', 'sight', 3, 'Neon-saturated go-go alley — famous for the light show even if you just walk through.', ST_SetSRID(ST_MakePoint(100.5632, 13.7381), 4326)),
('Korean Town Sukhumvit Plaza', 'culinary', 3, 'Three-floor Korean mini-mall with authentic KBBQ, tofu stew, and karaoke rooms.', ST_SetSRID(ST_MakePoint(100.5576, 13.7386), 4326)),
('Cabbages & Condoms Restaurant', 'restaurant', 3, 'Famed safe-sex themed Thai restaurant; proceeds support the PDA NGO.', ST_SetSRID(ST_MakePoint(100.5615, 13.7358), 4326)),
('Robot Building (UOB Headquarters)', 'sight', NULL, 'Postmodern robot-shaped skyscraper — 1986, by Sumet Jumsai. Best viewed from Soi 18.', ST_SetSRID(ST_MakePoint(100.5611, 13.7348), 4326)),
('Oasis Spa Sukhumvit 31', 'sight', 3, 'Garden-villa spa hidden off Soi 31 — day-spa deals are half the hotel-spa price.', ST_SetSRID(ST_MakePoint(100.5674, 13.7432), 4326)),
('Arab Street (Soi Sukhumvit 3)', 'culinary', 2, 'Nakhon Kasem-meets-Cairo strip — shisha, falafel, Lebanese grill until 4am.', ST_SetSRID(ST_MakePoint(100.5540, 13.7421), 4326)),
('Asok Night Food Carts', 'night_market', 1, 'Sukhumvit 23 night stretch — cult-status guay tiew rua and grilled squid.', ST_SetSRID(ST_MakePoint(100.5640, 13.7393), 4326)),
('Times Square Building Ground Floor Food Court', 'culinary', 2, 'Old-school office-block food court — 12 Thai regional stalls, no-tourist vibe.', ST_SetSRID(ST_MakePoint(100.5605, 13.7381), 4326)),
('Tukta Cafe (Soi 33/1)', 'cafe', 2, 'Pastel-pink vintage cafe run by Thai film director — weekend brunch with homemade jams.', ST_SetSRID(ST_MakePoint(100.5664, 13.7397), 4326)),

-- ======================= BL21 Phetchaburi (id 36, ~100.5672, 13.7487) =======================
('Makkasan Airport Rail Link', 'transit', 2, 'Elevated skywalk to ARL Makkasan — direct 30-min train to Suvarnabhumi Airport.', ST_SetSRID(ST_MakePoint(100.5687, 13.7512), 4326)),
('Khlong Saen Saep Boat (Asoke Pier)', 'transit', 1, '฿10-20 canal taxi eastward to Ramkhamhaeng or westward to the Old Town — fastest rush-hour option.', ST_SetSRID(ST_MakePoint(100.5670, 13.7491), 4326)),
('Singha Complex Food Court', 'culinary', 2, 'Corporate tower food court — try the century-egg congee stall upstairs.', ST_SetSRID(ST_MakePoint(100.5679, 13.7478), 4326)),
('Italthai Tower Heritage Cafe', 'cafe', 2, 'Quiet lobby cafe in an iconic postmodern tower — hidden from office workers.', ST_SetSRID(ST_MakePoint(100.5663, 13.7481), 4326)),
('Makkasan Heritage Railway Site', 'heritage', 1, 'Former SRT workshops with classic locomotives rusting in situ — loved by urbex photographers.', ST_SetSRID(ST_MakePoint(100.5600, 13.7510), 4326)),
('Nana Plaza Indian-Muslim Food Row', 'culinary', 1, 'Soi 5 food cluster — biryani, roti canai, Pakistani mutton curry at local prices.', ST_SetSRID(ST_MakePoint(100.5548, 13.7453), 4326)),
('Flow House Bangkok (artificial surf)', 'sight', 3, 'Flow-rider surf pool indoors — niche attraction for Sukhumvit expats and tourists.', ST_SetSRID(ST_MakePoint(100.5693, 13.7443), 4326)),
('The Market Bangkok', 'shopping_mall', 2, 'Air-conditioned reinvention of the old Pratunam wholesale market vibe.', ST_SetSRID(ST_MakePoint(100.5420, 13.7505), 4326)),

-- ======================= BL20 Phra Ram 9 (id 13, ~100.565, 13.757) =======================
('Central Plaza Rama 9', 'shopping_mall', 3, 'Anchor shopping mall — the 7th-floor observation deck is free.', ST_SetSRID(ST_MakePoint(100.5654, 13.7574), 4326)),
('Fortune Town IT Mall', 'retail', 2, 'Legendary tech retail tower — open-box deals on phones, cables, vintage electronics.', ST_SetSRID(ST_MakePoint(100.5650, 13.7565), 4326)),
('The Street Ratchada', 'shopping_mall', 2, '24-hour mall — midnight Muay Thai gym, 3am noodle courts, bowling till dawn.', ST_SetSRID(ST_MakePoint(100.5730, 13.7638), 4326)),
('G Tower Observation Sky Lobby', 'sight', NULL, 'Corporate-tower sky lobby with free panoramic views — enter via the west elevator.', ST_SetSRID(ST_MakePoint(100.5645, 13.7555), 4326)),
('Super Rich 1965 Exchange', 'sight', 2, 'Famous money-changer with the best THB rates in Bangkok — bring ID.', ST_SetSRID(ST_MakePoint(100.5647, 13.7572), 4326)),
('Unicorn Cafe (Rama 9 satellite)', 'cafe', 2, 'Rainbow-themed dessert cafe — the pastel-blue pancakes are Instagram staples.', ST_SetSRID(ST_MakePoint(100.5662, 13.7571), 4326)),
('Central Rama 9 Food Park', 'culinary', 2, 'Basement food hall — try the 60-baht Hainanese chicken rice stall called Ah Heng.', ST_SetSRID(ST_MakePoint(100.5655, 13.7571), 4326)),
('Khao Tom Yommarat 1951', 'culinary', 1, 'Late-night rice soup spot — opens 10pm, packed with club-hopping students until 4am.', ST_SetSRID(ST_MakePoint(100.5678, 13.7585), 4326)),
('Rama IX Royal Park (north entrance)', 'park', 1, 'Huge botanical garden 15 mins east by taxi — worth a half-day trip, especially in December.', ST_SetSRID(ST_MakePoint(100.6340, 13.7210), 4326)),

-- ======================= BL19 Thailand Cultural Centre (id 14, ~100.570, 13.766) =======================
('The One Ratchada', 'night_market', 2, 'White-tented night market — mid-century souvenirs, craft beer lanes, photogenic from the parking rooftop.', ST_SetSRID(ST_MakePoint(100.5713, 13.7666), 4326)),
('Esplanade Cineplex & Ice Rink', 'sight', 3, 'Rare downtown ice-skating rink + indie cinema — great monsoon-day activity.', ST_SetSRID(ST_MakePoint(100.5698, 13.7657), 4326)),
('Siam Niramit (new concept)', 'sight', 4, 'Thai cultural extravaganza show — elephants, acrobatics, classical dance. 8pm nightly.', ST_SetSRID(ST_MakePoint(100.5765, 13.7771), 4326)),
('Chinese Embassy', 'sight', NULL, 'Large embassy compound — visa applicants enter from Ratchadaphisek side.', ST_SetSRID(ST_MakePoint(100.5718, 13.7664), 4326)),
('Jodd Fairs Ratchada', 'night_market', 1, 'Viral successor to the old Ratchada train market — orange-lit food carts, rainbow view from rooftop.', ST_SetSRID(ST_MakePoint(100.5660, 13.7504), 4326)),
('Cafe Velodrome Ratchada', 'cafe', 2, 'Cyclist-themed cafe in a cyclist clubhouse — breakfast burritos and cold brew.', ST_SetSRID(ST_MakePoint(100.5721, 13.7679), 4326)),
('Thailand Cultural Centre Main Hall', 'sight', 3, 'Classical music and ballet venue — ฿200 student tickets for Bangkok Symphony concerts.', ST_SetSRID(ST_MakePoint(100.5708, 13.7672), 4326)),
('Pranakorn Noodle Ratchada', 'culinary', 1, 'Late-night duck noodle stall open 10pm-4am — office crowd at midnight.', ST_SetSRID(ST_MakePoint(100.5717, 13.7668), 4326)),
('Seafood Market Ratchada (mookata)', 'restaurant', 2, 'Pick-your-seafood BBQ-and-hotpot place famous with locals — endless prawns.', ST_SetSRID(ST_MakePoint(100.5723, 13.7671), 4326)),

-- ======================= BL18 Huai Khwang (id 35, ~100.5739, 13.7781) =======================
('Ganesha Shrine Huai Khwang', 'heritage', 1, '24-hour bright-red Hindu shrine — locals make offerings of sugarcane on Tuesdays.', ST_SetSRID(ST_MakePoint(100.5744, 13.7789), 4326)),
('Huai Khwang Night Market', 'night_market', 1, 'Nightly clothes + food market on Pracha Songkhro — shark fin soup stalls and Thai-Chinese hotpots.', ST_SetSRID(ST_MakePoint(100.5751, 13.7789), 4326)),
('Drum BBQ', 'restaurant', 3, 'Thai-Korean mookata buffet popular with office workers — BYO soju from 7-Eleven.', ST_SetSRID(ST_MakePoint(100.5738, 13.7772), 4326)),
('Yok Chinese Restaurant', 'restaurant', 3, 'Massive Teochew-style banquet hall — go for the roast duck.', ST_SetSRID(ST_MakePoint(100.5737, 13.7782), 4326)),
('Belong Bar & Bistro', 'restaurant', 2, 'Cozy Thai-fusion bistro, craft cocktails — live acoustic on weekends.', ST_SetSRID(ST_MakePoint(100.5742, 13.7776), 4326)),
('M9 Square', 'retail', 2, 'Small office-retail block — basement Japanese udon stall is a local favorite.', ST_SetSRID(ST_MakePoint(100.5731, 13.7784), 4326)),
('Tha Kreng BBQ Pork Buns', 'culinary', 1, 'Char siu bao stall open since 1975 — weekends only, sold out by noon.', ST_SetSRID(ST_MakePoint(100.5744, 13.7791), 4326)),
('The Emerald Hotel Karaoke', 'sight', 3, 'Old-school hotel karaoke rooms — a time capsule of 90s Thai pop.', ST_SetSRID(ST_MakePoint(100.5739, 13.7775), 4326)),
('Atrium Boutique Resort Pool Day-Use', 'sight', 3, 'Pool day-pass at a quiet boutique hotel — ฿400 with a cocktail.', ST_SetSRID(ST_MakePoint(100.5729, 13.7792), 4326)),
('Huai Khwang Thai Dessert Alley', 'culinary', 1, 'Tucked-away soi lined with lod chong, kluai buat chee, and ice gem Thai sweets.', ST_SetSRID(ST_MakePoint(100.5734, 13.7785), 4326)),

-- ======================= BL17 Sutthisan (id 34, ~100.5738, 13.7894) =======================
('Muang Thai Phatra Market', 'culinary', 2, 'Office workers'' weekday food court — quick pad see ew and ฿30 Thai iced tea.', ST_SetSRID(ST_MakePoint(100.5740, 13.7897), 4326)),
('Sutthisan Food Row', 'culinary', 1, 'Sidewalk row of 8+ food stalls open 5pm-midnight — try the jade noodle soup.', ST_SetSRID(ST_MakePoint(100.5736, 13.7892), 4326)),
('Sutthisan Rangsit Beer Garden', 'restaurant', 2, 'Old-school open-air beer garden with live Thai country music at 8pm.', ST_SetSRID(ST_MakePoint(100.5747, 13.7901), 4326)),
('Saen Saep Local Canal Temple', 'heritage', 1, 'Small working-class temple — Thursday morning long-tail-boat alms offerings.', ST_SetSRID(ST_MakePoint(100.5719, 13.7888), 4326)),
('Sutthisan Morning Market', 'culinary', 1, 'Low-key morning market — fried cruller (patongko) with hot soy milk for ฿25.', ST_SetSRID(ST_MakePoint(100.5734, 13.7891), 4326)),
('Thai Film Archive (satellite screening)', 'sight', 2, 'Occasional monthly screenings of restored Thai classic films — announced on Facebook.', ST_SetSRID(ST_MakePoint(100.5750, 13.7889), 4326)),
('Ar Ja Noodle Shop', 'culinary', 1, 'Third-generation crispy wonton noodle joint — the BBQ pork is cut to order.', ST_SetSRID(ST_MakePoint(100.5739, 13.7895), 4326)),
('Sutthisan Photo Studio Row', 'retail', 2, 'Three shops dealing in second-hand film cameras and darkroom supplies.', ST_SetSRID(ST_MakePoint(100.5731, 13.7900), 4326)),

-- ======================= BL16 Ratchadaphisek (id 33, ~100.5738, 13.7970) =======================
('Esplanade Ratchada', 'shopping_mall', 2, 'Multi-use entertainment mall — go-kart track, indoor badminton, bookshop.', ST_SetSRID(ST_MakePoint(100.5744, 13.7973), 4326)),
('Olympia Thai Tower', 'sight', NULL, 'Corporate landmark tower — ground-floor Thai-Chinese noodle shop used by office staff.', ST_SetSRID(ST_MakePoint(100.5741, 13.7967), 4326)),
('Ratchada Rot Fai Park (old site, now park)', 'park', 1, 'Converted rail-yard night market now a pocket park — quiet weekday walking track.', ST_SetSRID(ST_MakePoint(100.5726, 13.7958), 4326)),
('Robinson Lifestyle Ratchada', 'shopping_mall', 2, 'Mid-range department store — good for cheap souvenirs and Thai-brand cosmetics.', ST_SetSRID(ST_MakePoint(100.5745, 13.7962), 4326)),
('Sensory Studio Thai Perfume', 'retail', 3, 'Indie Thai-scent perfumery — 30-min personalized fragrance blending workshop.', ST_SetSRID(ST_MakePoint(100.5739, 13.7976), 4326)),
('Sum Bum Burmese Tea Leaf Salad', 'culinary', 1, 'Small Burmese-Thai lunch counter — the pickled tea-leaf salad is extraordinary.', ST_SetSRID(ST_MakePoint(100.5742, 13.7965), 4326)),
('Wat Saen Saeb Ratchada', 'heritage', 1, 'Canal-side temple with 400-year-old teak ubosot — candles-only at dusk.', ST_SetSRID(ST_MakePoint(100.5720, 13.7948), 4326)),
('Cafe Phra Ram 9 Vintage Vinyl', 'cafe', 2, 'Records + craft coffee, vinyl-only playlists — loved by local DJs.', ST_SetSRID(ST_MakePoint(100.5748, 13.7979), 4326)),

-- ======================= BL15 Lat Phrao (id 32, ~100.5737, 13.8156) =======================
('Suan Lum Night Bazaar Ratchadapisek', 'night_market', 2, 'Resurrected version of the original Suan Lum — food stalls, vintage lifestyle vendors.', ST_SetSRID(ST_MakePoint(100.5745, 13.8143), 4326)),
('The Bazaar Bangkok Hotel Rooftop Bar', 'restaurant', 3, 'Rarely-crowded rooftop — good for northern-view sunset.', ST_SetSRID(ST_MakePoint(100.5730, 13.8151), 4326)),
('MRT Yellow Line Interchange', 'transit', NULL, 'Transfer to the Yellow monorail — direct to Srinakharinwirot and the eastern suburbs.', ST_SetSRID(ST_MakePoint(100.5741, 13.8162), 4326)),
('Pho Lat Phrao Park-and-Ride', 'sight', NULL, '9-floor ฿30/day parking — commuters'' ground floor vendor sells 6am dim sum.', ST_SetSRID(ST_MakePoint(100.5748, 13.8166), 4326)),
('Lat Phrao Food Soi 1', 'culinary', 1, 'First-soi street-food stretch — evening open-air food court of 15+ vendors.', ST_SetSRID(ST_MakePoint(100.5735, 13.8148), 4326)),
('Ratchada BBQ Buffet 199', 'restaurant', 1, 'Suburban-cult BBQ buffet — 199 baht for 2 hours, always full of Thai students.', ST_SetSRID(ST_MakePoint(100.5731, 13.8144), 4326)),
('Lat Phrao Flower Market (morning)', 'retail', 1, 'Small dawn flower market — orchids and marigolds at wholesale rates.', ST_SetSRID(ST_MakePoint(100.5726, 13.8158), 4326)),
('Muay Thai Kru Dam Gym', 'sight', 2, 'Legit working Muay Thai gym — drop-in 1-hour classes at ฿400.', ST_SetSRID(ST_MakePoint(100.5751, 13.8153), 4326)),

-- ======================= BL14 Phahonyothin (id 31, ~100.5627, 13.8143) =======================
('Central Plaza Lad Phrao', 'shopping_mall', 3, 'Legacy mega-mall since 1982 — Ping Pong pool hall on the top floor, cheap cinema.', ST_SetSRID(ST_MakePoint(100.5625, 13.8145), 4326)),
('Union Mall', 'shopping_mall', 1, 'Four-floor wholesale fashion mall — Korean-style youth trends at ฿100 price points.', ST_SetSRID(ST_MakePoint(100.5614, 13.8137), 4326)),
('Horwang School (heritage)', 'sight', NULL, 'Prestigious Thai public school — art deco main building is a listed structure.', ST_SetSRID(ST_MakePoint(100.5639, 13.8131), 4326)),
('Phahon Yothin 7 Soi Food Court', 'culinary', 1, 'Office-worker lunch alley — try the Thai-Chinese chicken rice.', ST_SetSRID(ST_MakePoint(100.5626, 13.8150), 4326)),
('Sweetheart Bakery Union', 'culinary', 1, 'Vintage Thai bakery — Hokkaido pastel-green pandan buns for ฿25.', ST_SetSRID(ST_MakePoint(100.5617, 13.8142), 4326)),
('K Village Lat Phrao 71', 'shopping_mall', 3, 'Open-air community mall — boutique petstore, good BKK brunch cafes.', ST_SetSRID(ST_MakePoint(100.5884, 13.7892), 4326)),
('Or Tor Kor Morning Produce', 'culinary', 3, 'Pre-8am vendor corner with the best mangos and durian selections.', ST_SetSRID(ST_MakePoint(100.5483, 13.7965), 4326)),
('Central Rama 2 Pet Market', 'retail', 2, 'Dedicated weekend pet-supply market — koi fish, birds, small mammals.', ST_SetSRID(ST_MakePoint(100.5605, 13.8162), 4326)),

-- ======================= BL13 Chatuchak Park (id 16, ~100.553, 13.802) =======================
('Chatuchak Weekend Market (main)', 'night_market', 1, '15,000-stall weekend labyrinth — get there 9am Sat, exit via the food court at Section 26.', ST_SetSRID(ST_MakePoint(100.5510, 13.8000), 4326)),
('Rot Fai (Railway) Park', 'park', 1, 'Massive railway-themed park — free bike rentals, Butterfly Garden inside.', ST_SetSRID(ST_MakePoint(100.5472, 13.8058), 4326)),
('Queen Sirikit Park', 'park', 1, 'Adjoining botanical park — rare orchid greenhouse and shaded running paths.', ST_SetSRID(ST_MakePoint(100.5488, 13.8045), 4326)),
('JJ Mall', 'shopping_mall', 1, 'Air-conditioned weekday alternative to JJ Market — wholesale housewares and tropical plants.', ST_SetSRID(ST_MakePoint(100.5528, 13.8028), 4326)),
('Mixt Chatuchak', 'shopping_mall', 2, 'New-ish indoor mall on the JJ edge — youth-oriented second-hand fashion.', ST_SetSRID(ST_MakePoint(100.5525, 13.8023), 4326)),
('Chatuchak Fish Market Section 8', 'night_market', 2, 'Tropical aquarium fish section — dragon fish and rare plecos.', ST_SetSRID(ST_MakePoint(100.5511, 13.8012), 4326)),
('Cafe Amazon Hidden Section 2', 'cafe', 1, 'Only Amazon Cafe inside JJ with air-conditioning — lifesaver at market midday.', ST_SetSRID(ST_MakePoint(100.5515, 13.8005), 4326)),
('Viva 8 Live Music Cafe', 'restaurant', 2, 'Section 8 cafe with afternoon live blues — a weekend social hub.', ST_SetSRID(ST_MakePoint(100.5513, 13.8007), 4326)),
('Pat''s Paella (Section 8)', 'restaurant', 2, 'Cult cast-iron paella vendor at JJ — the saffron broth is legit.', ST_SetSRID(ST_MakePoint(100.5512, 13.8006), 4326)),
('Butterfly Garden and Insectarium', 'park', 1, 'Free walk-through butterfly dome inside Rot Fai Park — peaceful weekday visit.', ST_SetSRID(ST_MakePoint(100.5466, 13.8068), 4326)),

-- ======================= BL12 Kamphaeng Phet (id 15, ~100.548, 13.797) =======================
('Or Tor Kor Market', 'culinary', 3, 'Thailand''s premier fresh market — best durian, glass-box curated seafood, and street snacks.', ST_SetSRID(ST_MakePoint(100.5478, 13.7975), 4326)),
('Red Vintage Building (Section 26)', 'retail', 2, 'Antique furniture and rare-collectible pavilion — 1930s cameras, vintage Thai posters.', ST_SetSRID(ST_MakePoint(100.5488, 13.7971), 4326)),
('Or Tor Kor Food Court', 'culinary', 2, 'Blue-tiled food court inside OTK — famous khao soi and massaman curry stalls.', ST_SetSRID(ST_MakePoint(100.5479, 13.7979), 4326)),
('Mixt Chatuchak (south side)', 'shopping_mall', 2, 'Quieter wing of the Mixt complex — boutique chocolate and Thai wine sellers.', ST_SetSRID(ST_MakePoint(100.5490, 13.7981), 4326)),
('Gump''s Chatuchak', 'shopping_mall', 2, 'New-wave community mall built around former rice silos — IG-famous food hall.', ST_SetSRID(ST_MakePoint(100.5489, 13.7984), 4326)),
('Khun Poo Sticky Rice & Grilled Chicken', 'culinary', 1, 'OTK stall with cult-status charcoal chicken and crispy Isan rice.', ST_SetSRID(ST_MakePoint(100.5476, 13.7977), 4326)),
('Wat Phra Siri Mahathat', 'heritage', 1, 'Important monastic school temple with a 14m bronze Buddha — weekday meditation sessions.', ST_SetSRID(ST_MakePoint(100.5390, 13.8188), 4326)),
('Kamphaeng Phet Design Center', 'sight', 2, 'Collective workshop used by emerging Thai designers — monthly open studios.', ST_SetSRID(ST_MakePoint(100.5482, 13.7968), 4326)),

-- ======================= BL11 Bang Sue (id 30, ~100.5372, 13.8035) =======================
('Krung Thep Aphiwat Central Terminal', 'transit', 1, 'Thailand''s replacement for Hua Lamphong — high-ceilinged modern hub with sleeper trains north.', ST_SetSRID(ST_MakePoint(100.5373, 13.8033), 4326)),
('SRT Red Line Bang Sue', 'transit', 1, 'Suburban rail to Rangsit and Taling Chan — quick escape to airport-adjacent neighborhoods.', ST_SetSRID(ST_MakePoint(100.5370, 13.8029), 4326)),
('Siam Cement Group Office Park', 'sight', NULL, 'Corporate campus — monumental modernist sculpture visible from the station.', ST_SetSRID(ST_MakePoint(100.5412, 13.8069), 4326)),
('Central Juvenile and Family Court', 'sight', NULL, 'Historic government building — grand neo-classical facade.', ST_SetSRID(ST_MakePoint(100.5385, 13.8028), 4326)),
('Bang Sue Teochew Phalo Soup', 'culinary', 1, '40-year-old rice-noodle shop for aromatic Phalo pork broth; cash only.', ST_SetSRID(ST_MakePoint(100.5366, 13.8025), 4326)),
('Kuai Chap Nai Ek Bang Sue', 'culinary', 1, 'Peppery rolled noodle pork broth — legit local late-breakfast.', ST_SetSRID(ST_MakePoint(100.5362, 13.8020), 4326)),
('Pracha Rat Food Row', 'culinary', 1, 'Nightly sidewalk row of 6+ vendors — Thai-Chinese and southern-Thai curries.', ST_SetSRID(ST_MakePoint(100.5374, 13.8041), 4326)),
('Gateway Bang Sue', 'shopping_mall', 2, 'Japanese-themed community mall — Daiso, Don Don Donki, Japanese-style ramen court.', ST_SetSRID(ST_MakePoint(100.5448, 13.8050), 4326)),

-- ======================= BL10 Tao Poon (id 29, ~100.5298, 13.8079) =======================
('MRT Purple Line (Tao Poon Interchange)', 'transit', NULL, 'Transfer to MRT Purple Line — reach Nonthaburi and the Chao Phraya western suburbs.', ST_SetSRID(ST_MakePoint(100.5301, 13.8082), 4326)),
('Tao Poon Market', 'culinary', 1, 'Fresh morning market — baked salt-mackerel and curry paste ground to order.', ST_SetSRID(ST_MakePoint(100.5306, 13.8085), 4326)),
('Children''s Discovery Museum', 'sight', 2, 'Hands-on museum for kids (dinosaur bone dig, water play lab) — free on Thursdays.', ST_SetSRID(ST_MakePoint(100.5556, 13.8120), 4326)),
('Bangkok Butterfly Garden and Insectarium', 'park', 1, 'Free netted butterfly dome inside Rot Fai Park — ride rental bike from Tao Poon.', ST_SetSRID(ST_MakePoint(100.5466, 13.8068), 4326)),
('Bella Casa Italian Thai Fusion', 'restaurant', 3, 'Charming small restaurant — green curry linguine, stir-fried noodles with krached.', ST_SetSRID(ST_MakePoint(100.5294, 13.8071), 4326)),
('Vises Kaiyang', 'culinary', 1, 'Charcoal-grilled Isan chicken — served with spicy orange papaya salad.', ST_SetSRID(ST_MakePoint(100.5287, 13.8082), 4326)),
('The Standard Burger Tao Poon', 'restaurant', 2, 'Smash-burger joint with craft beer — popular with young locals.', ST_SetSRID(ST_MakePoint(100.5291, 13.8076), 4326)),
('Wat Rachathiwat', 'heritage', 1, 'Royal temple with Bangkok''s earliest Khmer-influenced prang; quiet canal-side walks.', ST_SetSRID(ST_MakePoint(100.5158, 13.7869), 4326)),

-- ======================= BL09 Bang Pho (id 28, ~100.5165, 13.8078) =======================
('Bang Pho Pier', 'transit', 1, 'Chao Phraya Express Boat stop — direct to Asiatique or Nonthaburi.', ST_SetSRID(ST_MakePoint(100.5169, 13.8082), 4326)),
('Bang Pho Teakwood District', 'retail', 2, 'Unique cluster of 50+ teakwood furniture workshops — carved Buddha altars on display.', ST_SetSRID(ST_MakePoint(100.5159, 13.8075), 4326)),
('Bang Pho Market', 'culinary', 1, 'Wet market with a cult sticky-rice & grilled chicken stall on the corner.', ST_SetSRID(ST_MakePoint(100.5163, 13.8080), 4326)),
('Quartermaster School', 'sight', NULL, 'Royal Thai Army heritage compound — visitable on open days.', ST_SetSRID(ST_MakePoint(100.5148, 13.8068), 4326)),
('Wat Mai Amataros', 'heritage', 1, 'Low-profile riverside temple — quiet morning alms-giving tradition.', ST_SetSRID(ST_MakePoint(100.5155, 13.8085), 4326)),
('Riverfront Teakwood Cafe', 'cafe', 2, 'Cafe built inside a timber workshop — raw teak beams, Mae Salong oolong tea.', ST_SetSRID(ST_MakePoint(100.5167, 13.8078), 4326)),
('Bang Pho Vegetarian Restaurant', 'restaurant', 1, 'Family-run jay (vegetarian) kitchen — daily rotating curries for ฿50.', ST_SetSRID(ST_MakePoint(100.5170, 13.8075), 4326)),

-- ======================= BL08 Bang O (id 27, ~100.4941, 13.8057) =======================
('Yanhee Hospital', 'sight', 4, 'Famed for cosmetic surgery and gender-affirming care — international patients welcome.', ST_SetSRID(ST_MakePoint(100.4945, 13.8061), 4326)),
('Samakki Suthawawas Temple', 'heritage', 1, 'Community temple with a serene lotus pond — free Thai-language Dharma talks.', ST_SetSRID(ST_MakePoint(100.4938, 13.8052), 4326)),
('Bang O Mosque', 'heritage', 1, 'Historic community mosque — Friday prayer draws Thai-Malay community.', ST_SetSRID(ST_MakePoint(100.4932, 13.8055), 4326)),
('Halal Roti Mataba Bang O', 'culinary', 1, 'Old Thai-Muslim stall — Mataba stuffed roti is stuffed-to-order.', ST_SetSRID(ST_MakePoint(100.4931, 13.8054), 4326)),
('Bang O Morning Pier', 'transit', 1, 'Quiet morning ferry — riders catch sunrise view of the river.', ST_SetSRID(ST_MakePoint(100.4930, 13.8070), 4326)),
('Bang O Flower Shop Row', 'retail', 1, 'Three generations of flower-garland makers for funerals and temples.', ST_SetSRID(ST_MakePoint(100.4937, 13.8050), 4326)),
('Mae Kim Lanna Coffee', 'cafe', 2, 'Mini Lanna-themed cafe under a banyan tree — best cold brew in the area.', ST_SetSRID(ST_MakePoint(100.4943, 13.8062), 4326)),

-- ======================= BL07 Bang Phlat (id 26, ~100.4894, 13.7953) =======================
('Bang Phlat District Office', 'sight', NULL, 'Government office — backup visa extension + residence paper stop.', ST_SetSRID(ST_MakePoint(100.4896, 13.7955), 4326)),
('Wat Awut Wiksitaram', 'heritage', 1, 'Rarely-visited Thonburi-era temple — lotus-pond courtyard, carved gable panels.', ST_SetSRID(ST_MakePoint(100.4889, 13.7948), 4326)),
('Charansanitwong 75 Cafe Strip', 'cafe', 2, 'Stretch of small indie cafes in converted townhouses — opened post-2020.', ST_SetSRID(ST_MakePoint(100.4899, 13.7961), 4326)),
('Bang Phlat Suan Krua Fusion', 'restaurant', 2, 'Home-cook style Thai kitchen — seasonal menu, the curry of the day is the bet.', ST_SetSRID(ST_MakePoint(100.4892, 13.7950), 4326)),
('Bang Phlat Morning Veg Market', 'culinary', 1, 'Rabbit-hole produce market opening 5am — local farmers bring fresh morning glory.', ST_SetSRID(ST_MakePoint(100.4898, 13.7947), 4326)),
('Papa Indian Tailor Shop', 'retail', 2, '40-year-old bespoke tailor — suits from ฿4500, 3-day turnaround.', ST_SetSRID(ST_MakePoint(100.4905, 13.7960), 4326)),

-- ======================= BL06 Sirindhorn (id 25, ~100.4817, 13.7854) =======================
('Wat Sing', 'heritage', 1, 'Hidden 18th-century temple with stone-lion guardians; free.', ST_SetSRID(ST_MakePoint(100.4823, 13.7863), 4326)),
('Bangkok Noi Land Office', 'sight', NULL, 'Government office — foreign-land-deed assistance on Thursdays.', ST_SetSRID(ST_MakePoint(100.4815, 13.7850), 4326)),
('Tang Hua Seng Sirindhorn', 'shopping_mall', 2, 'Mid-range department store chain — good for Thai school uniforms and kitchenware.', ST_SetSRID(ST_MakePoint(100.4821, 13.7858), 4326)),
('Charansanitwong Pork-Leg Rice', 'culinary', 1, 'Old Chinese-Thai family stall — slow-braised khao kha moo since 1968.', ST_SetSRID(ST_MakePoint(100.4813, 13.7849), 4326)),
('Sirindhorn Night Food Corner', 'night_market', 1, 'Weekend night corner with 15+ food carts — grilled squid and crispy pork skin are the highlights.', ST_SetSRID(ST_MakePoint(100.4816, 13.7848), 4326)),
('Bangkok Dog Run Park', 'park', 1, 'Small dog park popular with expat families — public and free.', ST_SetSRID(ST_MakePoint(100.4828, 13.7852), 4326)),
('Riverside Herbal Clinic Thonburi', 'sight', 2, 'Thai traditional medicine clinic — herbal massage ฿500/hr.', ST_SetSRID(ST_MakePoint(100.4810, 13.7855), 4326)),

-- ======================= BL05 Bang Yi Khan (id 17, ~100.479, 13.778) =======================
('Central Pinklao', 'shopping_mall', 3, 'Large western-Bangkok mall — family-friendly food hall, IMAX cinema.', ST_SetSRID(ST_MakePoint(100.4798, 13.7785), 4326)),
('Major Cineplex Pinklao', 'sight', 2, 'Classic cinema with English subtitles — cheap Monday tickets.', ST_SetSRID(ST_MakePoint(100.4802, 13.7790), 4326)),
('Pata Department Store', 'shopping_mall', 1, 'Legendary old-school mall with a rooftop zoo (gorilla pair has been there since the 80s).', ST_SetSRID(ST_MakePoint(100.4793, 13.7780), 4326)),
('Indy Market Pinklao (food strip)', 'night_market', 1, 'Inside the Indy Market — 20+ grilled and desserts stalls. Opens 6pm.', ST_SetSRID(ST_MakePoint(100.4796, 13.7781), 4326)),
('Wat Dusitdaram', 'heritage', 1, 'Quiet royal temple — carved Buddha images rarely seen in guidebooks.', ST_SetSRID(ST_MakePoint(100.4801, 13.7748), 4326)),
('Pinklao Teak Bridge Heritage Viewpoint', 'heritage', 1, 'Riverside viewpoint of the historic bridge connecting Thonburi to Rattanakosin.', ST_SetSRID(ST_MakePoint(100.4881, 13.7691), 4326)),
('Baan Song Thai Wooden House Museum', 'heritage', 1, 'Two restored 100-year-old teak houses — ฿50, includes Thai tea service.', ST_SetSRID(ST_MakePoint(100.4789, 13.7787), 4326)),
('Pinklao Cafe & Boardgame', 'cafe', 2, 'Two-storey boardgame cafe with 500+ games — open until midnight.', ST_SetSRID(ST_MakePoint(100.4799, 13.7775), 4326)),

-- ======================= BL04 Bang Khun Non (id 24, ~100.475, 13.7691) =======================
('Wat Suwannaram Ratchaworawihan', 'heritage', 1, 'Rare Rama III-era royal temple — the mural paintings are masterpieces.', ST_SetSRID(ST_MakePoint(100.4755, 13.7696), 4326)),
('Si Sudaram Temple', 'heritage', 1, 'Canal-side temple where local monks still collect morning alms by boat.', ST_SetSRID(ST_MakePoint(100.4757, 13.7685), 4326)),
('Suwannaram School', 'sight', NULL, 'Heritage community school — free weekday courtyard access.', ST_SetSRID(ST_MakePoint(100.4743, 13.7692), 4326)),
('Metropolitan Waterworks Authority (MWA) Bangkok Noi', 'sight', NULL, 'Architecturally interesting art-deco waterworks compound.', ST_SetSRID(ST_MakePoint(100.4740, 13.7698), 4326)),
('Makro Charansanitwong', 'retail', 2, 'Wholesale hypermarket — great for bulk souvenir snacks and Thai sauces.', ST_SetSRID(ST_MakePoint(100.4751, 13.7705), 4326)),
('Bang Khun Non Teochew Dim Sum', 'culinary', 1, 'Third-generation Teochew dim sum stall — only steamed, no fried.', ST_SetSRID(ST_MakePoint(100.4748, 13.7688), 4326)),
('Bang Noi Canal Community', 'heritage', 1, 'Preserved old wooden-house canal row — one of the last in central Bangkok.', ST_SetSRID(ST_MakePoint(100.4761, 13.7695), 4326)),

-- ======================= BL03 Fai Chai (id 23, ~100.4729, 13.7561) =======================
('Bang Khun Si Market', 'culinary', 1, 'Dawn fresh market — the pork leg vendor has been there since 1970.', ST_SetSRID(ST_MakePoint(100.4725, 13.7557), 4326)),
('Siriraj Hospital (west wing)', 'sight', 3, 'Thailand''s oldest hospital — huge public compound with a medical museum.', ST_SetSRID(ST_MakePoint(100.4733, 13.7565), 4326)),
('Siriraj Medical Museum (Death Museum)', 'sight', 1, 'Anatomy, forensics, parasites — niche cult favorite for the morbidly curious.', ST_SetSRID(ST_MakePoint(100.4730, 13.7575), 4326)),
('Queen Savang Vadhana Memorial Hospital', 'sight', 3, 'Historic hospital wing — heritage architecture.', ST_SetSRID(ST_MakePoint(100.4736, 13.7558), 4326)),
('Wat Amarinthararam', 'heritage', 1, 'Ayutthaya-era temple — impressive seven-tiered prang.', ST_SetSRID(ST_MakePoint(100.4725, 13.7552), 4326)),
('Fai Chai Morning Coffee Cart', 'cafe', 1, 'Legend old-style cart — ฿25 for iced oliang since 1989.', ST_SetSRID(ST_MakePoint(100.4730, 13.7562), 4326)),
('Bang Khun Si Thai Herbal Shop', 'retail', 2, 'Licensed traditional medicine shop — herbal balls, tonics, traditional massage oil.', ST_SetSRID(ST_MakePoint(100.4727, 13.7559), 4326)),

-- ======================= BL02 Charan 13 (id 22, ~100.4736, 13.7411) =======================
('HomePro Charansanitwong', 'retail', 2, 'DIY hypermarket — also hosts a weekend plant market.', ST_SetSRID(ST_MakePoint(100.4740, 13.7415), 4326)),
('Siam Technology College', 'sight', NULL, 'Private technical college — nice modern architecture.', ST_SetSRID(ST_MakePoint(100.4730, 13.7408), 4326)),
('Wat Chao Mool', 'heritage', 1, 'Tiny temple with a famously lucky Buddha image — favored before exams.', ST_SetSRID(ST_MakePoint(100.4738, 13.7418), 4326)),
('Wat Pho Riang', 'heritage', 1, 'Small neighborhood temple — 17th-century bell tower.', ST_SetSRID(ST_MakePoint(100.4728, 13.7403), 4326)),
('Charan 13 Pad Thai Master', 'culinary', 1, 'Sidewalk pad thai wok since 1978 — peanuts ground to order.', ST_SetSRID(ST_MakePoint(100.4735, 13.7412), 4326)),
('Charan Sanitwong Fabric Row', 'retail', 1, 'Cluster of 5+ fabric shops — cheap silks and cotton by the meter.', ST_SetSRID(ST_MakePoint(100.4741, 13.7417), 4326)),
('Charan 13 Boat-Noodle Stall', 'culinary', 1, 'Hole-in-the-wall boat noodle shop — ฿20 mini-bowls.', ST_SetSRID(ST_MakePoint(100.4737, 13.7410), 4326)),

-- ======================= BL01 Tha Phra (id 18, ~100.474, 13.729) =======================
('Guay Chup Uan Photchana', 'culinary', 1, 'Legendary rolled noodle pork soup — peppery broth and crispy pork since 1962.', ST_SetSRID(ST_MakePoint(100.4752, 13.7252), 4326)),
('Ba Mee Tong Leng', 'culinary', 1, 'Famous BBQ pork egg noodle stall — thin-egg noodles made in-house.', ST_SetSRID(ST_MakePoint(100.4749, 13.7253), 4326)),
('Agoo Chive Dumplings', 'culinary', 1, 'Pan-fried chive dumpling specialist — crispy bottoms, sweet chili soy dip.', ST_SetSRID(ST_MakePoint(100.4747, 13.7254), 4326)),
('Wat Tha Phra', 'heritage', 1, 'Neighborhood temple with a rare Khmer-style chedi at the entrance.', ST_SetSRID(ST_MakePoint(100.4748, 13.7295), 4326)),
('Bangkok Yai District Office', 'sight', NULL, 'Government office — visa address confirmation issued Monday-Friday 8:30-4:30.', ST_SetSRID(ST_MakePoint(100.4740, 13.7290), 4326)),
('Khlong Bang Luang Floating Market', 'night_market', 1, 'Artisan-focused floating community — art galleries and Thai puppet shows 2pm weekends.', ST_SetSRID(ST_MakePoint(100.4621, 13.7327), 4326)),
('Talat Phlu Night Market', 'night_market', 1, 'Classic west-bank night-food district — guay chup, stingray fish noodles, mango sticky rice.', ST_SetSRID(ST_MakePoint(100.4753, 13.7246), 4326)),
('Tha Phra Interchange Viewpoint', 'transit', NULL, 'Where the Blue Line crosses over itself — photo spot for transit enthusiasts.', ST_SetSRID(ST_MakePoint(100.4747, 13.7293), 4326)),
('Baan Silapin (Artist House Thonburi)', 'heritage', 1, 'Century-old wooden house community — free daily puppet performance at 2pm weekends.', ST_SetSRID(ST_MakePoint(100.4688, 13.7362), 4326)),
('Kung Pao Talat Phlu', 'restaurant', 2, '40-year-old Chinese-Thai seafood shophouse — drunken noodles and salted egg prawns.', ST_SetSRID(ST_MakePoint(100.4751, 13.7244), 4326));

-- -----------------------------------------------------------------------------
-- 4. Backfill category legacy column (migrate_003 uses it) + default timezone.
-- -----------------------------------------------------------------------------
UPDATE pois
   SET category = CASE category_slug
       WHEN 'shopping_mall' THEN 'Retail'
       WHEN 'cafe'          THEN 'Culinary'
       WHEN 'restaurant'    THEN 'Culinary'
       WHEN 'culinary'      THEN 'Culinary'
       WHEN 'heritage'      THEN 'Heritage'
       WHEN 'night_market'  THEN 'Night Market'
       WHEN 'retail'        THEN 'Retail'
       WHEN 'park'          THEN 'Park'
       WHEN 'sight'         THEN 'Sight'
       WHEN 'transit'       THEN 'Transit'
       ELSE category
   END
 WHERE category IS NULL;

COMMIT;
