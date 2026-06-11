// airports.js - Worldwide commercial airport data and Leaflet rendering
// Uses Leaflet (L global). No imports required.

window._airportsLayer = null;

// AIRPORTS array: { iata, name, city, country, lat, lng, tier }
// tier 3 = major hub (15M+ pax/yr), tier 2 = medium international (3-15M), tier 1 = regional
const AIRPORTS = [
  // ─── TIER 3: MAJOR HUBS ────────────────────────────────────────────────────

  // North America
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", country: "USA", lat: 33.6407, lng: -84.4277, tier: 3 },
  { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "USA", lat: 33.9425, lng: -118.4081, tier: 3 },
  { iata: "ORD", name: "O'Hare International", city: "Chicago", country: "USA", lat: 41.9742, lng: -87.9073, tier: 3 },
  { iata: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "USA", lat: 32.8998, lng: -97.0403, tier: 3 },
  { iata: "DEN", name: "Denver International", city: "Denver", country: "USA", lat: 39.8561, lng: -104.6737, tier: 3 },
  { iata: "JFK", name: "John F. Kennedy International", city: "New York", country: "USA", lat: 40.6413, lng: -73.7781, tier: 3 },
  { iata: "SFO", name: "San Francisco International", city: "San Francisco", country: "USA", lat: 37.6213, lng: -122.379, tier: 3 },
  { iata: "SEA", name: "Seattle-Tacoma International", city: "Seattle", country: "USA", lat: 47.4502, lng: -122.3088, tier: 3 },
  { iata: "LAS", name: "Harry Reid International", city: "Las Vegas", country: "USA", lat: 36.084, lng: -115.1537, tier: 3 },
  { iata: "MCO", name: "Orlando International", city: "Orlando", country: "USA", lat: 28.4294, lng: -81.309, tier: 3 },
  { iata: "EWR", name: "Newark Liberty International", city: "Newark", country: "USA", lat: 40.6895, lng: -74.1745, tier: 3 },
  { iata: "MIA", name: "Miami International", city: "Miami", country: "USA", lat: 25.7959, lng: -80.287, tier: 3 },
  { iata: "PHX", name: "Phoenix Sky Harbor International", city: "Phoenix", country: "USA", lat: 33.4373, lng: -112.0078, tier: 3 },
  { iata: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "USA", lat: 29.9902, lng: -95.3368, tier: 3 },
  { iata: "BOS", name: "Logan International", city: "Boston", country: "USA", lat: 42.3656, lng: -71.0096, tier: 3 },
  { iata: "MSP", name: "Minneapolis-Saint Paul International", city: "Minneapolis", country: "USA", lat: 44.8848, lng: -93.2223, tier: 3 },
  { iata: "DTW", name: "Detroit Metropolitan Wayne County", city: "Detroit", country: "USA", lat: 42.2124, lng: -83.3534, tier: 3 },
  { iata: "PHL", name: "Philadelphia International", city: "Philadelphia", country: "USA", lat: 39.8721, lng: -75.2411, tier: 3 },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "USA", lat: 40.7769, lng: -73.874, tier: 3 },
  { iata: "FLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale", country: "USA", lat: 26.0742, lng: -80.1506, tier: 3 },
  { iata: "BWI", name: "Baltimore/Washington International", city: "Baltimore", country: "USA", lat: 39.1754, lng: -76.6683, tier: 3 },
  { iata: "SLC", name: "Salt Lake City International", city: "Salt Lake City", country: "USA", lat: 40.7884, lng: -111.9778, tier: 3 },
  { iata: "DCA", name: "Ronald Reagan Washington National", city: "Washington D.C.", country: "USA", lat: 38.8521, lng: -77.0377, tier: 3 },
  { iata: "IAD", name: "Washington Dulles International", city: "Washington D.C.", country: "USA", lat: 38.9445, lng: -77.4558, tier: 3 },
  { iata: "MDW", name: "Chicago Midway International", city: "Chicago", country: "USA", lat: 41.7868, lng: -87.7522, tier: 3 },
  { iata: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "Canada", lat: 43.6777, lng: -79.6248, tier: 3 },
  { iata: "YVR", name: "Vancouver International", city: "Vancouver", country: "Canada", lat: 49.1947, lng: -123.1792, tier: 3 },
  { iata: "YUL", name: "Montréal-Pierre Elliott Trudeau International", city: "Montreal", country: "Canada", lat: 45.4706, lng: -73.7408, tier: 3 },
  { iata: "YYC", name: "Calgary International", city: "Calgary", country: "Canada", lat: 51.1215, lng: -114.0076, tier: 3 },
  { iata: "MEX", name: "Benito Juárez International", city: "Mexico City", country: "Mexico", lat: 19.4363, lng: -99.0721, tier: 3 },
  { iata: "CUN", name: "Cancún International", city: "Cancún", country: "Mexico", lat: 21.0365, lng: -86.8771, tier: 3 },

  // Europe
  { iata: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", lat: 51.4775, lng: -0.4614, tier: 3 },
  { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479, tier: 3 },
  { iata: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3086, lng: 4.7639, tier: 3 },
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", lat: 50.0379, lng: 8.5622, tier: 3 },
  { iata: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid", country: "Spain", lat: 40.4936, lng: -3.5668, tier: 3 },
  { iata: "BCN", name: "Josep Tarradellas Barcelona–El Prat Airport", city: "Barcelona", country: "Spain", lat: 41.2974, lng: 2.0833, tier: 3 },
  { iata: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome", country: "Italy", lat: 41.8003, lng: 12.2389, tier: 3 },
  { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", lat: 48.3538, lng: 11.786, tier: 3 },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", lat: 41.2753, lng: 28.7519, tier: 3 },
  { iata: "DME", name: "Domodedovo International Airport", city: "Moscow", country: "Russia", lat: 55.4088, lng: 37.9063, tier: 3 },
  { iata: "SVO", name: "Sheremetyevo International Airport", city: "Moscow", country: "Russia", lat: 55.9726, lng: 37.4146, tier: 3 },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", lat: 47.4582, lng: 8.5555, tier: 3 },
  { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "Austria", lat: 48.1103, lng: 16.5697, tier: 3 },
  { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", lat: 50.9014, lng: 4.4844, tier: 3 },
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", lat: 55.6180, lng: 12.6508, tier: 3 },
  { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden", lat: 59.6519, lng: 17.9186, tier: 3 },
  { iata: "OSL", name: "Oslo Gardermoen Airport", city: "Oslo", country: "Norway", lat: 60.1976, lng: 11.1004, tier: 3 },
  { iata: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland", lat: 60.3172, lng: 24.9633, tier: 3 },
  { iata: "LIS", name: "Humberto Delgado Airport", city: "Lisbon", country: "Portugal", lat: 38.7813, lng: -9.1359, tier: 3 },
  { iata: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece", lat: 37.9364, lng: 23.9445, tier: 3 },
  { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland", lat: 52.1657, lng: 20.9671, tier: 3 },
  { iata: "BUD", name: "Budapest Ferenc Liszt International Airport", city: "Budapest", country: "Hungary", lat: 47.4369, lng: 19.2556, tier: 3 },
  { iata: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "Czech Republic", lat: 50.1008, lng: 14.26, tier: 3 },

  // Asia-Pacific
  { iata: "PEK", name: "Beijing Capital International", city: "Beijing", country: "China", lat: 40.0799, lng: 116.6031, tier: 3 },
  { iata: "PKX", name: "Beijing Daxing International", city: "Beijing", country: "China", lat: 39.5098, lng: 116.4105, tier: 3 },
  { iata: "PVG", name: "Shanghai Pudong International", city: "Shanghai", country: "China", lat: 31.1443, lng: 121.8083, tier: 3 },
  { iata: "SHA", name: "Shanghai Hongqiao International", city: "Shanghai", country: "China", lat: 31.1979, lng: 121.3362, tier: 3 },
  { iata: "CAN", name: "Guangzhou Baiyun International", city: "Guangzhou", country: "China", lat: 23.3925, lng: 113.2988, tier: 3 },
  { iata: "SZX", name: "Shenzhen Bao'an International", city: "Shenzhen", country: "China", lat: 22.6393, lng: 113.8107, tier: 3 },
  { iata: "CTU", name: "Chengdu Tianfu International", city: "Chengdu", country: "China", lat: 30.3125, lng: 104.444, tier: 3 },
  { iata: "HGH", name: "Hangzhou Xiaoshan International", city: "Hangzhou", country: "China", lat: 30.2295, lng: 120.4346, tier: 3 },
  { iata: "KMG", name: "Kunming Changshui International", city: "Kunming", country: "China", lat: 24.9924, lng: 102.7433, tier: 3 },
  { iata: "XIY", name: "Xi'an Xianyang International", city: "Xi'an", country: "China", lat: 34.4471, lng: 108.7516, tier: 3 },
  { iata: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798, tier: 3 },
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", lat: 35.7647, lng: 140.3864, tier: 3 },
  { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "Japan", lat: 34.4347, lng: 135.2440, tier: 3 },
  { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea", lat: 37.4602, lng: 126.4407, tier: 3 },
  { iata: "GMP", name: "Gimpo International Airport", city: "Seoul", country: "South Korea", lat: 37.5583, lng: 126.7906, tier: 3 },
  { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", lat: 22.3080, lng: 113.9185, tier: 3 },
  { iata: "TPE", name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", lat: 25.0797, lng: 121.2342, tier: 3 },
  { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", lat: 1.3644, lng: 103.9915, tier: 3 },
  { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", lat: 2.7456, lng: 101.7099, tier: 3 },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", lat: 13.6900, lng: 100.7501, tier: 3 },
  { iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia", lat: -6.1256, lng: 106.6559, tier: 3 },
  { iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines", lat: 14.5086, lng: 121.0197, tier: 3 },
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", lat: 28.5562, lng: 77.1000, tier: 3 },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India", lat: 19.0896, lng: 72.8656, tier: 3 },
  { iata: "BLR", name: "Kempegowda International Airport", city: "Bengaluru", country: "India", lat: 13.1979, lng: 77.7063, tier: 3 },
  { iata: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India", lat: 12.9941, lng: 80.1709, tier: 3 },
  { iata: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "India", lat: 17.2403, lng: 78.4294, tier: 3 },
  { iata: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753, tier: 3 },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", lat: -37.6690, lng: 144.8410, tier: 3 },
  { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", lat: -27.3842, lng: 153.1175, tier: 3 },

  // Middle East & Africa
  { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE", lat: 25.2532, lng: 55.3657, tier: 3 },
  { iata: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "UAE", lat: 24.4330, lng: 54.6511, tier: 3 },
  { iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar", lat: 25.2609, lng: 51.6138, tier: 3 },
  { iata: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia", lat: 24.9576, lng: 46.6988, tier: 3 },
  { iata: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia", lat: 21.6796, lng: 39.1565, tier: 3 },
  { iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt", lat: 30.1219, lng: 31.4056, tier: 3 },
  { iata: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg", country: "South Africa", lat: -26.1392, lng: 28.246, tier: 3 },
  { iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya", lat: -1.3192, lng: 36.9275, tier: 3 },
  { iata: "ADD", name: "Addis Ababa Bole International Airport", city: "Addis Ababa", country: "Ethiopia", lat: 8.9779, lng: 38.7993, tier: 3 },

  // South America
  { iata: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo", country: "Brazil", lat: -23.4356, lng: -46.4731, tier: 3 },
  { iata: "GIG", name: "Rio de Janeiro/Galeão International Airport", city: "Rio de Janeiro", country: "Brazil", lat: -22.8099, lng: -43.2505, tier: 3 },
  { iata: "BSB", name: "Brasília International Airport", city: "Brasília", country: "Brazil", lat: -15.8711, lng: -47.9186, tier: 3 },
  { iata: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina", lat: -34.8222, lng: -58.5358, tier: 3 },
  { iata: "BOG", name: "El Dorado International Airport", city: "Bogotá", country: "Colombia", lat: 4.7016, lng: -74.1469, tier: 3 },
  { iata: "SCL", name: "Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile", lat: -33.3930, lng: -70.7858, tier: 3 },
  { iata: "LIM", name: "Jorge Chávez International Airport", city: "Lima", country: "Peru", lat: -12.0219, lng: -77.1143, tier: 3 },

  // ─── TIER 2: MEDIUM INTERNATIONAL ─────────────────────────────────────────

  // USA Tier 2
  { iata: "TPA", name: "Tampa International Airport", city: "Tampa", country: "USA", lat: 27.9755, lng: -82.5332, tier: 2 },
  { iata: "PDX", name: "Portland International Airport", city: "Portland", country: "USA", lat: 45.5887, lng: -122.5975, tier: 2 },
  { iata: "HOU", name: "William P. Hobby Airport", city: "Houston", country: "USA", lat: 29.6454, lng: -95.2789, tier: 2 },
  { iata: "DAL", name: "Dallas Love Field", city: "Dallas", country: "USA", lat: 32.8471, lng: -96.8518, tier: 2 },
  { iata: "OAK", name: "Oakland International Airport", city: "Oakland", country: "USA", lat: 37.7213, lng: -122.2208, tier: 2 },
  { iata: "SAN", name: "San Diego International Airport", city: "San Diego", country: "USA", lat: 32.7338, lng: -117.1933, tier: 2 },
  { iata: "MCI", name: "Kansas City International Airport", city: "Kansas City", country: "USA", lat: 39.2976, lng: -94.7139, tier: 2 },
  { iata: "CLE", name: "Cleveland Hopkins International Airport", city: "Cleveland", country: "USA", lat: 41.4117, lng: -81.8498, tier: 2 },
  { iata: "PIT", name: "Pittsburgh International Airport", city: "Pittsburgh", country: "USA", lat: 40.4915, lng: -80.2329, tier: 2 },
  { iata: "STL", name: "St. Louis Lambert International Airport", city: "St. Louis", country: "USA", lat: 38.7487, lng: -90.37, tier: 2 },
  { iata: "RDU", name: "Raleigh-Durham International Airport", city: "Raleigh", country: "USA", lat: 35.8776, lng: -78.7875, tier: 2 },
  { iata: "MEM", name: "Memphis International Airport", city: "Memphis", country: "USA", lat: 35.0424, lng: -89.9767, tier: 2 },
  { iata: "BNA", name: "Nashville International Airport", city: "Nashville", country: "USA", lat: 36.1245, lng: -86.6782, tier: 2 },
  { iata: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin", country: "USA", lat: 30.1975, lng: -97.6664, tier: 2 },
  { iata: "SAT", name: "San Antonio International Airport", city: "San Antonio", country: "USA", lat: 29.5337, lng: -98.4698, tier: 2 },
  { iata: "MSY", name: "Louis Armstrong New Orleans International Airport", city: "New Orleans", country: "USA", lat: 29.9934, lng: -90.258, tier: 2 },
  { iata: "IND", name: "Indianapolis International Airport", city: "Indianapolis", country: "USA", lat: 39.7173, lng: -86.2944, tier: 2 },
  { iata: "CMH", name: "John Glenn Columbus International Airport", city: "Columbus", country: "USA", lat: 39.9980, lng: -82.8919, tier: 2 },
  { iata: "JAX", name: "Jacksonville International Airport", city: "Jacksonville", country: "USA", lat: 30.4941, lng: -81.6879, tier: 2 },
  { iata: "ABQ", name: "Albuquerque International Sunport", city: "Albuquerque", country: "USA", lat: 35.0402, lng: -106.6091, tier: 2 },
  { iata: "OGG", name: "Kahului Airport", city: "Maui", country: "USA", lat: 20.8986, lng: -156.4305, tier: 2 },
  { iata: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu", country: "USA", lat: 21.3187, lng: -157.9225, tier: 2 },
  { iata: "ANC", name: "Ted Stevens Anchorage International Airport", city: "Anchorage", country: "USA", lat: 61.1744, lng: -149.9964, tier: 2 },
  { iata: "ONT", name: "Ontario International Airport", city: "Ontario", country: "USA", lat: 34.0560, lng: -117.6012, tier: 2 },
  { iata: "SJC", name: "Norman Y. Mineta San Jose International Airport", city: "San Jose", country: "USA", lat: 37.3626, lng: -121.9290, tier: 2 },
  { iata: "BUF", name: "Buffalo Niagara International Airport", city: "Buffalo", country: "USA", lat: 42.9405, lng: -78.7322, tier: 2 },
  { iata: "OMA", name: "Eppley Airfield", city: "Omaha", country: "USA", lat: 41.3032, lng: -95.8941, tier: 2 },
  { iata: "RSW", name: "Southwest Florida International Airport", city: "Fort Myers", country: "USA", lat: 26.5362, lng: -81.7552, tier: 2 },
  { iata: "PBI", name: "Palm Beach International Airport", city: "West Palm Beach", country: "USA", lat: 26.6832, lng: -80.0956, tier: 2 },

  // Canada Tier 2
  { iata: "YEG", name: "Edmonton International Airport", city: "Edmonton", country: "Canada", lat: 53.3097, lng: -113.5797, tier: 2 },
  { iata: "YOW", name: "Ottawa Macdonald-Cartier International Airport", city: "Ottawa", country: "Canada", lat: 45.3225, lng: -75.6692, tier: 2 },
  { iata: "YHZ", name: "Halifax Stanfield International Airport", city: "Halifax", country: "Canada", lat: 44.8808, lng: -63.5086, tier: 2 },
  { iata: "YWG", name: "Winnipeg James Armstrong Richardson International Airport", city: "Winnipeg", country: "Canada", lat: 49.9100, lng: -97.2398, tier: 2 },

  // Mexico & Caribbean Tier 2
  { iata: "GDL", name: "Miguel Hidalgo y Costilla Guadalajara International Airport", city: "Guadalajara", country: "Mexico", lat: 20.5218, lng: -103.3111, tier: 2 },
  { iata: "MTY", name: "General Mariano Escobedo International Airport", city: "Monterrey", country: "Mexico", lat: 25.7785, lng: -100.1067, tier: 2 },
  { iata: "SJD", name: "Los Cabos International Airport", city: "Los Cabos", country: "Mexico", lat: 23.1518, lng: -109.7212, tier: 2 },
  { iata: "MID", name: "Manuel Crescencio Rejón International Airport", city: "Mérida", country: "Mexico", lat: 20.9370, lng: -89.6577, tier: 2 },
  { iata: "MBJ", name: "Sangster International Airport", city: "Montego Bay", country: "Jamaica", lat: 18.5037, lng: -77.9134, tier: 2 },
  { iata: "SJU", name: "Luis Muñoz Marín International Airport", city: "San Juan", country: "Puerto Rico", lat: 18.4394, lng: -66.0018, tier: 2 },
  { iata: "NAS", name: "Lynden Pindling International Airport", city: "Nassau", country: "Bahamas", lat: 25.0390, lng: -77.4662, tier: 2 },
  { iata: "PUJ", name: "Punta Cana International Airport", city: "Punta Cana", country: "Dominican Republic", lat: 18.5674, lng: -68.3634, tier: 2 },
  { iata: "SDQ", name: "Las Américas International Airport", city: "Santo Domingo", country: "Dominican Republic", lat: 18.4297, lng: -69.6689, tier: 2 },
  { iata: "PTY", name: "Tocumen International Airport", city: "Panama City", country: "Panama", lat: 9.0714, lng: -79.3835, tier: 2 },
  { iata: "GUA", name: "La Aurora International Airport", city: "Guatemala City", country: "Guatemala", lat: 14.5833, lng: -90.5275, tier: 2 },
  { iata: "SJO", name: "Juan Santamaría International Airport", city: "San José", country: "Costa Rica", lat: 9.9939, lng: -84.2088, tier: 2 },

  // South America Tier 2
  { iata: "CGH", name: "Congonhas Airport", city: "São Paulo", country: "Brazil", lat: -23.6261, lng: -46.6564, tier: 2 },
  { iata: "CNF", name: "Belo Horizonte Tancredo Neves International Airport", city: "Belo Horizonte", country: "Brazil", lat: -19.6244, lng: -43.9719, tier: 2 },
  { iata: "FOR", name: "Pinto Martins International Airport", city: "Fortaleza", country: "Brazil", lat: -3.7763, lng: -38.5326, tier: 2 },
  { iata: "REC", name: "Guararapes International Airport", city: "Recife", country: "Brazil", lat: -8.1265, lng: -34.9230, tier: 2 },
  { iata: "POA", name: "Salgado Filho International Airport", city: "Porto Alegre", country: "Brazil", lat: -29.9944, lng: -51.1714, tier: 2 },
  { iata: "SSA", name: "Deputado Luís Eduardo Magalhães International Airport", city: "Salvador", country: "Brazil", lat: -12.9086, lng: -38.3225, tier: 2 },
  { iata: "MDE", name: "José María Córdova International Airport", city: "Medellín", country: "Colombia", lat: 6.1645, lng: -75.4231, tier: 2 },
  { iata: "CLO", name: "Alfonso Bonilla Aragón International Airport", city: "Cali", country: "Colombia", lat: 3.5432, lng: -76.3816, tier: 2 },
  { iata: "CCS", name: "Simón Bolívar International Airport", city: "Caracas", country: "Venezuela", lat: 10.6012, lng: -66.9913, tier: 2 },
  { iata: "UIO", name: "Mariscal Sucre International Airport", city: "Quito", country: "Ecuador", lat: -0.1292, lng: -78.3575, tier: 2 },
  { iata: "GYE", name: "José Joaquín de Olmedo International Airport", city: "Guayaquil", country: "Ecuador", lat: -2.1574, lng: -79.8836, tier: 2 },
  { iata: "MVD", name: "Carrasco International Airport", city: "Montevideo", country: "Uruguay", lat: -34.8384, lng: -56.0308, tier: 2 },
  { iata: "ASU", name: "Silvio Pettirossi International Airport", city: "Asunción", country: "Paraguay", lat: -25.2400, lng: -57.5191, tier: 2 },
  { iata: "VVI", name: "Viru Viru International Airport", city: "Santa Cruz", country: "Bolivia", lat: -17.6448, lng: -63.1354, tier: 2 },

  // UK & Ireland Tier 2
  { iata: "LGW", name: "London Gatwick Airport", city: "London", country: "United Kingdom", lat: 51.1481, lng: -0.1903, tier: 2 },
  { iata: "STN", name: "London Stansted Airport", city: "London", country: "United Kingdom", lat: 51.8850, lng: 0.2350, tier: 2 },
  { iata: "LTN", name: "London Luton Airport", city: "Luton", country: "United Kingdom", lat: 51.8747, lng: -0.3683, tier: 2 },
  { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", lat: 53.3537, lng: -2.275, tier: 2 },
  { iata: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", lat: 55.9500, lng: -3.3725, tier: 2 },
  { iata: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", lat: 55.8719, lng: -4.4331, tier: 2 },
  { iata: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom", lat: 52.4539, lng: -1.7480, tier: 2 },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", lat: 53.4213, lng: -6.2701, tier: 2 },
  { iata: "SNN", name: "Shannon Airport", city: "Shannon", country: "Ireland", lat: 52.7020, lng: -8.9248, tier: 2 },

  // Germany Tier 2
  { iata: "BER", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", lat: 52.3667, lng: 13.5033, tier: 2 },
  { iata: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Germany", lat: 51.2895, lng: 6.7668, tier: 2 },
  { iata: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Germany", lat: 53.6304, lng: 9.9882, tier: 2 },
  { iata: "STR", name: "Stuttgart Airport", city: "Stuttgart", country: "Germany", lat: 48.6899, lng: 9.2220, tier: 2 },
  { iata: "CGN", name: "Cologne Bonn Airport", city: "Cologne", country: "Germany", lat: 50.8659, lng: 7.1427, tier: 2 },
  { iata: "NUE", name: "Nuremberg Airport", city: "Nuremberg", country: "Germany", lat: 49.4987, lng: 11.0669, tier: 2 },

  // France Tier 2
  { iata: "ORY", name: "Paris Orly Airport", city: "Paris", country: "France", lat: 48.7233, lng: 2.3794, tier: 2 },
  { iata: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", lat: 43.6584, lng: 7.2087, tier: 2 },
  { iata: "MRS", name: "Marseille Provence Airport", city: "Marseille", country: "France", lat: 43.4365, lng: 5.2214, tier: 2 },
  { iata: "LYS", name: "Lyon–Saint-Exupéry Airport", city: "Lyon", country: "France", lat: 45.7256, lng: 5.0811, tier: 2 },
  { iata: "TLS", name: "Toulouse–Blagnac Airport", city: "Toulouse", country: "France", lat: 43.6293, lng: 1.3638, tier: 2 },

  // Italy Tier 2
  { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "Italy", lat: 45.6306, lng: 8.7281, tier: 2 },
  { iata: "LIN", name: "Milan Linate Airport", city: "Milan", country: "Italy", lat: 45.4495, lng: 9.2767, tier: 2 },
  { iata: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "Italy", lat: 45.5053, lng: 12.3519, tier: 2 },
  { iata: "NAP", name: "Naples International Airport", city: "Naples", country: "Italy", lat: 40.886, lng: 14.2908, tier: 2 },
  { iata: "CTA", name: "Catania-Fontanarossa Airport", city: "Catania", country: "Italy", lat: 37.4668, lng: 15.0664, tier: 2 },
  { iata: "PMO", name: "Falcone–Borsellino Airport", city: "Palermo", country: "Italy", lat: 38.1759, lng: 13.0910, tier: 2 },

  // Spain Tier 2
  { iata: "PMI", name: "Palma de Mallorca Airport", city: "Palma", country: "Spain", lat: 39.5517, lng: 2.7388, tier: 2 },
  { iata: "AGP", name: "Málaga–Costa del Sol Airport", city: "Málaga", country: "Spain", lat: 36.6749, lng: -4.4991, tier: 2 },
  { iata: "ALC", name: "Alicante-Elche Miguel Hernández Airport", city: "Alicante", country: "Spain", lat: 38.2822, lng: -0.5582, tier: 2 },
  { iata: "VLC", name: "Valencia Airport", city: "Valencia", country: "Spain", lat: 39.4893, lng: -0.4816, tier: 2 },
  { iata: "SVQ", name: "Seville Airport", city: "Seville", country: "Spain", lat: 37.4180, lng: -5.8931, tier: 2 },
  { iata: "BIO", name: "Bilbao Airport", city: "Bilbao", country: "Spain", lat: 43.3011, lng: -2.9106, tier: 2 },
  { iata: "TFN", name: "Tenerife North Airport", city: "Tenerife", country: "Spain", lat: 28.4827, lng: -16.3415, tier: 2 },
  { iata: "TFS", name: "Tenerife South Airport", city: "Tenerife", country: "Spain", lat: 28.0445, lng: -16.5725, tier: 2 },
  { iata: "LPA", name: "Gran Canaria Airport", city: "Las Palmas", country: "Spain", lat: 27.9319, lng: -15.3866, tier: 2 },

  // Other European Tier 2
  { iata: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", lat: 46.2380, lng: 6.1089, tier: 2 },
  { iata: "BSL", name: "EuroAirport Basel-Mulhouse-Freiburg", city: "Basel", country: "Switzerland", lat: 47.5896, lng: 7.5299, tier: 2 },
  { iata: "LJU", name: "Ljubljana Jože Pučnik Airport", city: "Ljubljana", country: "Slovenia", lat: 46.2237, lng: 14.4576, tier: 2 },
  { iata: "ZAG", name: "Zagreb Airport", city: "Zagreb", country: "Croatia", lat: 45.7429, lng: 16.0688, tier: 2 },
  { iata: "DBV", name: "Dubrovnik Airport", city: "Dubrovnik", country: "Croatia", lat: 42.5614, lng: 18.2682, tier: 2 },
  { iata: "SPU", name: "Split Airport", city: "Split", country: "Croatia", lat: 43.5389, lng: 16.2980, tier: 2 },
  { iata: "TGD", name: "Podgorica Airport", city: "Podgorica", country: "Montenegro", lat: 42.3594, lng: 19.2519, tier: 2 },
  { iata: "SKP", name: "Skopje International Airport", city: "Skopje", country: "North Macedonia", lat: 41.9616, lng: 21.6214, tier: 2 },
  { iata: "TIA", name: "Tirana International Airport Nënë Tereza", city: "Tirana", country: "Albania", lat: 41.4147, lng: 19.7206, tier: 2 },
  { iata: "BEG", name: "Belgrade Nikola Tesla Airport", city: "Belgrade", country: "Serbia", lat: 44.8184, lng: 20.3091, tier: 2 },
  { iata: "SOF", name: "Sofia Airport", city: "Sofia", country: "Bulgaria", lat: 42.6952, lng: 23.4114, tier: 2 },
  { iata: "OTP", name: "Henri Coandă International Airport", city: "Bucharest", country: "Romania", lat: 44.5722, lng: 26.1022, tier: 2 },
  { iata: "KBP", name: "Kyiv Boryspil International Airport", city: "Kyiv", country: "Ukraine", lat: 50.3450, lng: 30.8947, tier: 2 },
  { iata: "RIX", name: "Riga International Airport", city: "Riga", country: "Latvia", lat: 56.9236, lng: 23.9711, tier: 2 },
  { iata: "TLL", name: "Lennart Meri Tallinn Airport", city: "Tallinn", country: "Estonia", lat: 59.4133, lng: 24.8328, tier: 2 },
  { iata: "VNO", name: "Vilnius International Airport", city: "Vilnius", country: "Lithuania", lat: 54.6341, lng: 25.2858, tier: 2 },
  { iata: "GDN", name: "Gdańsk Lech Wałęsa Airport", city: "Gdańsk", country: "Poland", lat: 54.3776, lng: 18.4662, tier: 2 },
  { iata: "KRK", name: "Kraków John Paul II International Airport", city: "Kraków", country: "Poland", lat: 50.0777, lng: 19.7848, tier: 2 },
  { iata: "KEF", name: "Keflavík International Airport", city: "Reykjavík", country: "Iceland", lat: 63.9850, lng: -22.6056, tier: 2 },
  { iata: "BGO", name: "Bergen Airport, Flesland", city: "Bergen", country: "Norway", lat: 60.2934, lng: 5.2181, tier: 2 },
  { iata: "GOT", name: "Gothenburg Landvetter Airport", city: "Gothenburg", country: "Sweden", lat: 57.6628, lng: 12.2798, tier: 2 },
  { iata: "AAL", name: "Aalborg Airport", city: "Aalborg", country: "Denmark", lat: 57.0927, lng: 9.8492, tier: 2 },
  { iata: "TMP", name: "Tampere-Pirkkala Airport", city: "Tampere", country: "Finland", lat: 61.4141, lng: 23.6044, tier: 2 },
  { iata: "FNC", name: "Madeira Airport", city: "Funchal", country: "Portugal", lat: 32.6979, lng: -16.7745, tier: 2 },
  { iata: "OPO", name: "Francisco de Sá Carneiro Airport", city: "Porto", country: "Portugal", lat: 41.2481, lng: -8.6814, tier: 2 },
  { iata: "FAO", name: "Faro Airport", city: "Faro", country: "Portugal", lat: 37.0144, lng: -7.9659, tier: 2 },
  { iata: "SKG", name: "Thessaloniki International Airport", city: "Thessaloniki", country: "Greece", lat: 40.5197, lng: 22.9709, tier: 2 },
  { iata: "HER", name: "Heraklion International Airport", city: "Heraklion", country: "Greece", lat: 35.3397, lng: 25.1803, tier: 2 },
  { iata: "CFU", name: "Ioannis Kapodistrias International Airport", city: "Corfu", country: "Greece", lat: 39.6019, lng: 19.9117, tier: 2 },
  { iata: "RHO", name: "Diagoras International Airport", city: "Rhodes", country: "Greece", lat: 36.4054, lng: 28.0862, tier: 2 },

  // Turkey Tier 2
  { iata: "SAW", name: "Sabiha Gökçen International Airport", city: "Istanbul", country: "Turkey", lat: 40.8985, lng: 29.3092, tier: 2 },
  { iata: "ADB", name: "Adnan Menderes Airport", city: "İzmir", country: "Turkey", lat: 38.2924, lng: 27.1570, tier: 2 },
  { iata: "AYT", name: "Antalya Airport", city: "Antalya", country: "Turkey", lat: 36.8987, lng: 30.8005, tier: 2 },
  { iata: "ESB", name: "Ankara Esenboğa Airport", city: "Ankara", country: "Turkey", lat: 40.1281, lng: 32.9951, tier: 2 },

  // Russia Tier 2
  { iata: "VKO", name: "Vnukovo International Airport", city: "Moscow", country: "Russia", lat: 55.5915, lng: 37.2615, tier: 2 },
  { iata: "LED", name: "Pulkovo Airport", city: "St. Petersburg", country: "Russia", lat: 59.8003, lng: 30.2625, tier: 2 },
  { iata: "OVB", name: "Tolmachevo Airport", city: "Novosibirsk", country: "Russia", lat: 54.9663, lng: 82.6067, tier: 2 },
  { iata: "SVX", name: "Koltsovo Airport", city: "Yekaterinburg", country: "Russia", lat: 56.8431, lng: 60.8027, tier: 2 },

  // Middle East Tier 2
  { iata: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "Jordan", lat: 31.7226, lng: 35.9932, tier: 2 },
  { iata: "BEY", name: "Beirut–Rafic Hariri International Airport", city: "Beirut", country: "Lebanon", lat: 33.8209, lng: 35.4884, tier: 2 },
  { iata: "TLV", name: "Ben Gurion International Airport", city: "Tel Aviv", country: "Israel", lat: 32.0114, lng: 34.8867, tier: 2 },
  { iata: "KWI", name: "Kuwait International Airport", city: "Kuwait City", country: "Kuwait", lat: 29.2267, lng: 47.9689, tier: 2 },
  { iata: "BAH", name: "Bahrain International Airport", city: "Manama", country: "Bahrain", lat: 26.2708, lng: 50.6336, tier: 2 },
  { iata: "MCT", name: "Muscat International Airport", city: "Muscat", country: "Oman", lat: 23.5933, lng: 58.2844, tier: 2 },
  { iata: "SAH", name: "Sana'a International Airport", city: "Sana'a", country: "Yemen", lat: 15.4763, lng: 44.2197, tier: 2 },
  { iata: "BGW", name: "Baghdad International Airport", city: "Baghdad", country: "Iraq", lat: 33.2625, lng: 44.2346, tier: 2 },
  { iata: "IKA", name: "Imam Khomeini International Airport", city: "Tehran", country: "Iran", lat: 35.4161, lng: 51.1522, tier: 2 },
  { iata: "THR", name: "Mehrabad International Airport", city: "Tehran", country: "Iran", lat: 35.6892, lng: 51.3134, tier: 2 },
  { iata: "KHI", name: "Jinnah International Airport", city: "Karachi", country: "Pakistan", lat: 24.9065, lng: 67.1608, tier: 2 },
  { iata: "LHE", name: "Allama Iqbal International Airport", city: "Lahore", country: "Pakistan", lat: 31.5216, lng: 74.4036, tier: 2 },
  { iata: "ISB", name: "Islamabad International Airport", city: "Islamabad", country: "Pakistan", lat: 33.5487, lng: 72.8258, tier: 2 },

  // Africa Tier 2
  { iata: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "Morocco", lat: 33.3675, lng: -7.5898, tier: 2 },
  { iata: "RAK", name: "Marrakech Menara Airport", city: "Marrakech", country: "Morocco", lat: 31.6069, lng: -8.0363, tier: 2 },
  { iata: "ALG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria", lat: 36.6910, lng: 3.2154, tier: 2 },
  { iata: "TUN", name: "Tunis-Carthage International Airport", city: "Tunis", country: "Tunisia", lat: 36.8510, lng: 10.2272, tier: 2 },
  { iata: "TIP", name: "Mitiga International Airport", city: "Tripoli", country: "Libya", lat: 32.8942, lng: 13.2760, tier: 2 },
  { iata: "ACC", name: "Kotoka International Airport", city: "Accra", country: "Ghana", lat: 5.6052, lng: -0.1668, tier: 2 },
  { iata: "ABJ", name: "Félix-Houphouët-Boigny International Airport", city: "Abidjan", country: "Côte d'Ivoire", lat: 5.2614, lng: -3.9263, tier: 2 },
  { iata: "DKR", name: "Blaise Diagne International Airport", city: "Dakar", country: "Senegal", lat: 14.6706, lng: -17.0728, tier: 2 },
  { iata: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria", lat: 6.5774, lng: 3.3213, tier: 2 },
  { iata: "ABV", name: "Nnamdi Azikiwe International Airport", city: "Abuja", country: "Nigeria", lat: 9.0068, lng: 7.2632, tier: 2 },
  { iata: "KGL", name: "Kigali International Airport", city: "Kigali", country: "Rwanda", lat: -1.9686, lng: 30.1395, tier: 2 },
  { iata: "DAR", name: "Julius Nyerere International Airport", city: "Dar es Salaam", country: "Tanzania", lat: -6.8781, lng: 39.2026, tier: 2 },
  { iata: "CPT", name: "Cape Town International Airport", city: "Cape Town", country: "South Africa", lat: -33.9649, lng: 18.6017, tier: 2 },
  { iata: "DUR", name: "King Shaka International Airport", city: "Durban", country: "South Africa", lat: -29.6144, lng: 31.1197, tier: 2 },
  { iata: "HRE", name: "Robert Gabriel Mugabe International Airport", city: "Harare", country: "Zimbabwe", lat: -17.9318, lng: 31.0929, tier: 2 },
  { iata: "LUN", name: "Kenneth Kaunda International Airport", city: "Lusaka", country: "Zambia", lat: -15.3308, lng: 28.4526, tier: 2 },
  { iata: "GBE", name: "Sir Seretse Khama International Airport", city: "Gaborone", country: "Botswana", lat: -24.5552, lng: 25.9182, tier: 2 },
  { iata: "TNR", name: "Ivato International Airport", city: "Antananarivo", country: "Madagascar", lat: -18.7969, lng: 47.4788, tier: 2 },
  { iata: "MRU", name: "Sir Seewoosagur Ramgoolam International Airport", city: "Port Louis", country: "Mauritius", lat: -20.4302, lng: 57.6836, tier: 2 },
  { iata: "SEZ", name: "Seychelles International Airport", city: "Victoria", country: "Seychelles", lat: -4.6743, lng: 55.5218, tier: 2 },

  // South/Southeast Asia Tier 2
  { iata: "CMB", name: "Bandaranaike International Airport", city: "Colombo", country: "Sri Lanka", lat: 7.1808, lng: 79.8841, tier: 2 },
  { iata: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "Bangladesh", lat: 23.8433, lng: 90.3979, tier: 2 },
  { iata: "KTM", name: "Tribhuvan International Airport", city: "Kathmandu", country: "Nepal", lat: 27.6966, lng: 85.3591, tier: 2 },
  { iata: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India", lat: 22.6520, lng: 88.4467, tier: 2 },
  { iata: "COK", name: "Cochin International Airport", city: "Kochi", country: "India", lat: 10.1520, lng: 76.3919, tier: 2 },
  { iata: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad", country: "India", lat: 23.0772, lng: 72.6347, tier: 2 },
  { iata: "PNQ", name: "Pune Airport", city: "Pune", country: "India", lat: 18.5822, lng: 73.9197, tier: 2 },
  { iata: "GOI", name: "Goa International Airport", city: "Goa", country: "India", lat: 15.3808, lng: 73.8314, tier: 2 },
  { iata: "RGN", name: "Yangon International Airport", city: "Yangon", country: "Myanmar", lat: 16.9073, lng: 96.1332, tier: 2 },
  { iata: "VTE", name: "Wattay International Airport", city: "Vientiane", country: "Laos", lat: 17.9883, lng: 102.5633, tier: 2 },
  { iata: "PNH", name: "Phnom Penh International Airport", city: "Phnom Penh", country: "Cambodia", lat: 11.5466, lng: 104.8440, tier: 2 },
  { iata: "REP", name: "Siem Reap–Angkor International Airport", city: "Siem Reap", country: "Cambodia", lat: 13.4107, lng: 103.8129, tier: 2 },
  { iata: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam", lat: 21.2212, lng: 105.8072, tier: 2 },
  { iata: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", lat: 10.8188, lng: 106.6520, tier: 2 },
  { iata: "DAD", name: "Da Nang International Airport", city: "Da Nang", country: "Vietnam", lat: 16.0439, lng: 108.1993, tier: 2 },
  { iata: "DPS", name: "Ngurah Rai International Airport", city: "Bali", country: "Indonesia", lat: -8.7482, lng: 115.1670, tier: 2 },
  { iata: "SUB", name: "Juanda International Airport", city: "Surabaya", country: "Indonesia", lat: -7.3798, lng: 112.7869, tier: 2 },
  { iata: "UPG", name: "Sultan Hasanuddin International Airport", city: "Makassar", country: "Indonesia", lat: -5.0617, lng: 119.5540, tier: 2 },

  // China Tier 2
  { iata: "WUH", name: "Wuhan Tianhe International Airport", city: "Wuhan", country: "China", lat: 30.7838, lng: 114.2081, tier: 2 },
  { iata: "CSX", name: "Changsha Huanghua International Airport", city: "Changsha", country: "China", lat: 28.1892, lng: 113.2196, tier: 2 },
  { iata: "NKG", name: "Nanjing Lukou International Airport", city: "Nanjing", country: "China", lat: 31.7420, lng: 118.8620, tier: 2 },
  { iata: "CKG", name: "Chongqing Jiangbei International Airport", city: "Chongqing", country: "China", lat: 29.7192, lng: 106.6417, tier: 2 },
  { iata: "XMN", name: "Xiamen Gaoqi International Airport", city: "Xiamen", country: "China", lat: 24.5440, lng: 118.1277, tier: 2 },
  { iata: "TSN", name: "Tianjin Binhai International Airport", city: "Tianjin", country: "China", lat: 39.1244, lng: 117.3460, tier: 2 },
  { iata: "HAK", name: "Haikou Meilan International Airport", city: "Haikou", country: "China", lat: 19.9349, lng: 110.4589, tier: 2 },
  { iata: "SYX", name: "Sanya Phoenix International Airport", city: "Sanya", country: "China", lat: 18.3029, lng: 109.4122, tier: 2 },
  { iata: "URC", name: "Ürümqi Diwopu International Airport", city: "Ürümqi", country: "China", lat: 43.9071, lng: 87.4742, tier: 2 },

  // Japan Tier 2
  { iata: "ITM", name: "Osaka Itami Airport", city: "Osaka", country: "Japan", lat: 34.7847, lng: 135.4381, tier: 2 },
  { iata: "CTS", name: "New Chitose Airport", city: "Sapporo", country: "Japan", lat: 42.7752, lng: 141.6922, tier: 2 },
  { iata: "FUK", name: "Fukuoka Airport", city: "Fukuoka", country: "Japan", lat: 33.5858, lng: 130.4511, tier: 2 },
  { iata: "OKA", name: "Naha Airport", city: "Okinawa", country: "Japan", lat: 26.1958, lng: 127.6461, tier: 2 },
  { iata: "NGO", name: "Chubu Centrair International Airport", city: "Nagoya", country: "Japan", lat: 34.8583, lng: 136.8054, tier: 2 },

  // Australia & Pacific Tier 2
  { iata: "PER", name: "Perth Airport", city: "Perth", country: "Australia", lat: -31.9403, lng: 115.9669, tier: 2 },
  { iata: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "Australia", lat: -34.9450, lng: 138.5306, tier: 2 },
  { iata: "OOL", name: "Gold Coast Airport", city: "Gold Coast", country: "Australia", lat: -28.1644, lng: 153.5047, tier: 2 },
  { iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", lat: -37.0082, lng: 174.7850, tier: 2 },
  { iata: "CHC", name: "Christchurch International Airport", city: "Christchurch", country: "New Zealand", lat: -43.4894, lng: 172.5322, tier: 2 },
  { iata: "WLG", name: "Wellington International Airport", city: "Wellington", country: "New Zealand", lat: -41.3272, lng: 174.8050, tier: 2 },
  { iata: "NAN", name: "Nadi International Airport", city: "Nadi", country: "Fiji", lat: -17.7554, lng: 177.4431, tier: 2 },
  { iata: "PPT", name: "Faa'a International Airport", city: "Papeete", country: "French Polynesia", lat: -17.5534, lng: -149.6062, tier: 2 },
  { iata: "GUM", name: "Antonio B. Won Pat International Airport", city: "Hagåtña", country: "Guam", lat: 13.4834, lng: 144.7960, tier: 2 },

  // Central Asia Tier 2
  { iata: "ALA", name: "Almaty International Airport", city: "Almaty", country: "Kazakhstan", lat: 43.3521, lng: 77.0405, tier: 2 },
  { iata: "NQZ", name: "Nursultan Nazarbayev International Airport", city: "Nur-Sultan", country: "Kazakhstan", lat: 51.0228, lng: 71.4669, tier: 2 },
  { iata: "TAS", name: "Tashkent International Airport", city: "Tashkent", country: "Uzbekistan", lat: 41.2579, lng: 69.2812, tier: 2 },
  { iata: "FRU", name: "Manas International Airport", city: "Bishkek", country: "Kyrgyzstan", lat: 43.0613, lng: 74.4776, tier: 2 },
  { iata: "GYD", name: "Heydar Aliyev International Airport", city: "Baku", country: "Azerbaijan", lat: 40.4675, lng: 50.0467, tier: 2 },
  { iata: "TBS", name: "Tbilisi International Airport", city: "Tbilisi", country: "Georgia", lat: 41.6692, lng: 44.9547, tier: 2 },
  { iata: "EVN", name: "Zvartnots International Airport", city: "Yerevan", country: "Armenia", lat: 40.1473, lng: 44.3959, tier: 2 },

  // ─── TIER 1: REGIONAL AIRPORTS ────────────────────────────────────────────

  // USA Regional
  { iata: "TUS", name: "Tucson International Airport", city: "Tucson", country: "USA", lat: 32.1161, lng: -110.9410, tier: 1 },
  { iata: "ELP", name: "El Paso International Airport", city: "El Paso", country: "USA", lat: 31.8072, lng: -106.3779, tier: 1 },
  { iata: "GRR", name: "Gerald R. Ford International Airport", city: "Grand Rapids", country: "USA", lat: 42.8808, lng: -85.5228, tier: 1 },
  { iata: "MKE", name: "General Mitchell International Airport", city: "Milwaukee", country: "USA", lat: 42.9472, lng: -87.8966, tier: 1 },
  { iata: "SDF", name: "Louisville Muhammad Ali International Airport", city: "Louisville", country: "USA", lat: 38.1744, lng: -85.7360, tier: 1 },
  { iata: "BDL", name: "Bradley International Airport", city: "Hartford", country: "USA", lat: 41.9388, lng: -72.6832, tier: 1 },
  { iata: "RNO", name: "Reno-Tahoe International Airport", city: "Reno", country: "USA", lat: 39.4991, lng: -119.7681, tier: 1 },
  { iata: "BOI", name: "Boise Airport", city: "Boise", country: "USA", lat: 43.5644, lng: -116.2228, tier: 1 },
  { iata: "FAT", name: "Fresno Yosemite International Airport", city: "Fresno", country: "USA", lat: 36.7762, lng: -119.7182, tier: 1 },
  { iata: "HSV", name: "Huntsville International Airport", city: "Huntsville", country: "USA", lat: 34.6372, lng: -86.7751, tier: 1 },
  { iata: "CHS", name: "Charleston International Airport", city: "Charleston", country: "USA", lat: 32.8987, lng: -80.0408, tier: 1 },
  { iata: "GSP", name: "Greenville-Spartanburg International Airport", city: "Greenville", country: "USA", lat: 34.8957, lng: -82.2189, tier: 1 },
  { iata: "SRQ", name: "Sarasota-Bradenton International Airport", city: "Sarasota", country: "USA", lat: 27.3954, lng: -82.5544, tier: 1 },
  { iata: "DAY", name: "Dayton International Airport", city: "Dayton", country: "USA", lat: 39.9024, lng: -84.2194, tier: 1 },
  { iata: "ROC", name: "Greater Rochester International Airport", city: "Rochester", country: "USA", lat: 43.1189, lng: -77.6724, tier: 1 },
  { iata: "SYR", name: "Syracuse Hancock International Airport", city: "Syracuse", country: "USA", lat: 43.1112, lng: -76.1063, tier: 1 },
  { iata: "ALB", name: "Albany International Airport", city: "Albany", country: "USA", lat: 42.7483, lng: -73.8017, tier: 1 },
  { iata: "PWM", name: "Portland International Jetport", city: "Portland", country: "USA", lat: 43.6462, lng: -70.3093, tier: 1 },
  { iata: "MHT", name: "Manchester-Boston Regional Airport", city: "Manchester", country: "USA", lat: 42.9326, lng: -71.4357, tier: 1 },
  { iata: "ORF", name: "Norfolk International Airport", city: "Norfolk", country: "USA", lat: 36.8977, lng: -76.0133, tier: 1 },

  // Canada Regional
  { iata: "YQR", name: "Regina International Airport", city: "Regina", country: "Canada", lat: 50.4319, lng: -104.6658, tier: 1 },
  { iata: "YXE", name: "Saskatoon John G. Diefenbaker International Airport", city: "Saskatoon", country: "Canada", lat: 52.1708, lng: -106.6997, tier: 1 },
  { iata: "YQB", name: "Québec City Jean Lesage International Airport", city: "Quebec City", country: "Canada", lat: 46.7911, lng: -71.3933, tier: 1 },
  { iata: "YYJ", name: "Victoria International Airport", city: "Victoria", country: "Canada", lat: 48.6469, lng: -123.4258, tier: 1 },

  // Europe Regional
  { iata: "SXB", name: "Strasbourg Airport", city: "Strasbourg", country: "France", lat: 48.5383, lng: 7.6280, tier: 1 },
  { iata: "BES", name: "Brest Bretagne Airport", city: "Brest", country: "France", lat: 48.4479, lng: -4.4185, tier: 1 },
  { iata: "NTE", name: "Nantes Atlantique Airport", city: "Nantes", country: "France", lat: 47.1532, lng: -1.6111, tier: 1 },
  { iata: "BRE", name: "Bremen Airport", city: "Bremen", country: "Germany", lat: 53.0475, lng: 8.7868, tier: 1 },
  { iata: "LEJ", name: "Leipzig/Halle Airport", city: "Leipzig", country: "Germany", lat: 51.4324, lng: 12.2416, tier: 1 },
  { iata: "HAJ", name: "Hannover Airport", city: "Hannover", country: "Germany", lat: 52.4611, lng: 9.6850, tier: 1 },
  { iata: "BLL", name: "Billund Airport", city: "Billund", country: "Denmark", lat: 55.7403, lng: 9.1518, tier: 1 },
  { iata: "TRF", name: "Sandefjord Airport, Torp", city: "Sandefjord", country: "Norway", lat: 59.1867, lng: 10.2586, tier: 1 },
  { iata: "TRD", name: "Trondheim Airport, Værnes", city: "Trondheim", country: "Norway", lat: 63.4578, lng: 10.9260, tier: 1 },
  { iata: "TKU", name: "Turku Airport", city: "Turku", country: "Finland", lat: 60.5141, lng: 22.2628, tier: 1 },
  { iata: "OUL", name: "Oulu Airport", city: "Oulu", country: "Finland", lat: 64.9301, lng: 25.3546, tier: 1 },
  { iata: "ABZ", name: "Aberdeen International Airport", city: "Aberdeen", country: "United Kingdom", lat: 57.2019, lng: -2.1978, tier: 1 },
  { iata: "NCL", name: "Newcastle Airport", city: "Newcastle", country: "United Kingdom", lat: 55.0375, lng: -1.6917, tier: 1 },
  { iata: "BRS", name: "Bristol Airport", city: "Bristol", country: "United Kingdom", lat: 51.3827, lng: -2.7191, tier: 1 },
  { iata: "EMA", name: "East Midlands Airport", city: "Nottingham", country: "United Kingdom", lat: 52.8311, lng: -1.3281, tier: 1 },
  { iata: "LPL", name: "Liverpool John Lennon Airport", city: "Liverpool", country: "United Kingdom", lat: 53.3336, lng: -2.8497, tier: 1 },
  { iata: "BOH", name: "Bournemouth Airport", city: "Bournemouth", country: "United Kingdom", lat: 50.7800, lng: -1.8425, tier: 1 },
  { iata: "CIA", name: "Ciampino–G. B. Pastine International Airport", city: "Rome", country: "Italy", lat: 41.7994, lng: 12.5949, tier: 1 },
  { iata: "BRI", name: "Bari Karol Wojtyła Airport", city: "Bari", country: "Italy", lat: 41.1389, lng: 16.7606, tier: 1 },
  { iata: "TRN", name: "Turin Airport", city: "Turin", country: "Italy", lat: 45.2008, lng: 7.6497, tier: 1 },

  // Asia Regional
  { iata: "OKJ", name: "Okayama Momotaro Airport", city: "Okayama", country: "Japan", lat: 34.7569, lng: 133.8553, tier: 1 },
  { iata: "HIJ", name: "Hiroshima Airport", city: "Hiroshima", country: "Japan", lat: 34.4361, lng: 132.9194, tier: 1 },
  { iata: "SDJ", name: "Sendai Airport", city: "Sendai", country: "Japan", lat: 38.1397, lng: 140.9170, tier: 1 },
  { iata: "PUS", name: "Gimhae International Airport", city: "Busan", country: "South Korea", lat: 35.1795, lng: 128.9384, tier: 1 },
  { iata: "CJU", name: "Jeju International Airport", city: "Jeju", country: "South Korea", lat: 33.5113, lng: 126.4930, tier: 1 },
  { iata: "LKO", name: "Chaudhary Charan Singh International Airport", city: "Lucknow", country: "India", lat: 26.7606, lng: 80.8893, tier: 1 },
  { iata: "JAI", name: "Jaipur International Airport", city: "Jaipur", country: "India", lat: 26.8242, lng: 75.8122, tier: 1 },
  { iata: "IXE", name: "Mangaluru International Airport", city: "Mangaluru", country: "India", lat: 12.9612, lng: 74.8900, tier: 1 },
  { iata: "TRV", name: "Trivandrum International Airport", city: "Thiruvananthapuram", country: "India", lat: 8.4782, lng: 76.9201, tier: 1 },
  { iata: "CEB", name: "Mactan-Cebu International Airport", city: "Cebu", country: "Philippines", lat: 10.3075, lng: 123.9795, tier: 1 },

  // Latin America Regional
  { iata: "CWB", name: "Afonso Pena International Airport", city: "Curitiba", country: "Brazil", lat: -25.5285, lng: -49.1758, tier: 1 },
  { iata: "BEL", name: "Val de Cans International Airport", city: "Belém", country: "Brazil", lat: -1.3793, lng: -48.4763, tier: 1 },
  { iata: "MAO", name: "Eduardo Gomes International Airport", city: "Manaus", country: "Brazil", lat: -3.0386, lng: -60.0497, tier: 1 },
  { iata: "GYN", name: "Santa Genoveva Airport", city: "Goiânia", country: "Brazil", lat: -16.6320, lng: -49.2208, tier: 1 },
  { iata: "BAQ", name: "Ernesto Cortissoz International Airport", city: "Barranquilla", country: "Colombia", lat: 10.8896, lng: -74.7808, tier: 1 },
  { iata: "CTG", name: "Rafael Núñez International Airport", city: "Cartagena", country: "Colombia", lat: 10.4424, lng: -75.5130, tier: 1 },
  { iata: "AQP", name: "Rodríguez Ballón International Airport", city: "Arequipa", country: "Peru", lat: -16.3411, lng: -71.5830, tier: 1 },
  { iata: "CUZ", name: "Alejandro Velasco Astete International Airport", city: "Cusco", country: "Peru", lat: -13.5357, lng: -71.9388, tier: 1 },
  { iata: "COR", name: "Ingeniero Ambrosio Taravella International Airport", city: "Córdoba", country: "Argentina", lat: -31.3236, lng: -64.2080, tier: 1 },
  { iata: "MDZ", name: "Governor Francisco Gabrielli International Airport", city: "Mendoza", country: "Argentina", lat: -32.8317, lng: -68.7929, tier: 1 },
];

// ─── RENDERING ─────────────────────────────────────────────────────────────

/**
 * Create the Leaflet layerGroup that will hold airport markers.
 * Call once after the map is initialised.
 * @param {L.Map} map
 * @returns {L.LayerGroup}
 */
function initAirportsLayer(map) {
  if (window._airportsLayer) {
    map.removeLayer(window._airportsLayer);
  }
  window._airportsLayer = L.layerGroup();
  window._airportsLayer.addTo(map);
  return window._airportsLayer;
}

/**
 * Build and add all airport markers to the layer group.
 * Does NOT add/remove the layer itself from the map – use initAirportsLayer for that.
 * @param {L.Map} map
 * @param {number} zoomLevel  current map zoom
 */
var _AIRPORT_DOT_THRESHOLD = 5;

function renderAirports(map, zoomLevel) {
  if (!window._airportsLayer) {
    initAirportsLayer(map);
  }
  window._airportsLayer.clearLayers();
  var useDot = zoomLevel < _AIRPORT_DOT_THRESHOLD;

  for (var i = 0; i < AIRPORTS.length; i++) {
    var a = AIRPORTS[i];

    // zoom-level visibility gate (lower thresholds so dots appear early)
    if (a.tier === 3 && zoomLevel < 2) continue;
    if (a.tier === 2 && zoomLevel < 4) continue;
    if (a.tier === 1 && zoomLevel < 7) continue;

    var icon = useDot ? _buildAirportDotIcon(a.tier) : _buildAirportIcon(a.tier);

    var marker = L.marker([a.lat, a.lng], {
      icon: icon,
      // allow clicks to propagate through to the map
      bubblingMouseEvents: true,
      interactive: true,
      keyboard: false
    });

    // tooltip content
    var tierLabel = a.tier === 3 ? "Major Hub" : a.tier === 2 ? "International" : "Regional";
    var tooltipHtml =
      "<div style='font-family:sans-serif;font-size:12px;line-height:1.5'>" +
      "<strong style='font-size:13px'>" + a.iata + "</strong> &mdash; " + a.name + "<br>" +
      a.city + ", " + a.country + "<br>" +
      "<em style='color:#aaa'>" + tierLabel + " (Tier " + a.tier + ")</em>" +
      "</div>";

    marker.bindTooltip(tooltipHtml, {
      direction: "top",
      offset: [0, -6],
      opacity: 0.95
    });

    // click: open tooltip / show info; does not stop map click propagation
    marker.on("click", function (e) {
      this.openTooltip();
      // explicitly do NOT call L.DomEvent.stopPropagation(e)
    });

    window._airportsLayer.addLayer(marker);
  }
}

/**
 * Re-draw airports whenever the zoom level changes.
 * @param {number} zoom
 */
function updateAirportMarkers(zoom) {
  if (!window._airportsLayer) return;
  // The layer is attached to a map; retrieve it to pass to renderAirports.
  // We expose the map reference through the layer's internal _map property (Leaflet internals).
  var map = window._airportsLayer._map;
  if (!map) return;
  renderAirports(map, zoom);
}

/**
 * @private
 * Small colored dot for low-zoom view.
 */
function _buildAirportDotIcon(tier) {
  var size  = tier === 3 ? 7 : tier === 2 ? 5 : 4;
  var color = tier === 3 ? '#ffffff' : tier === 2 ? '#cccccc' : '#888888';
  return L.divIcon({
    className: '',
    html: "<div style='width:" + size + "px;height:" + size + "px;border-radius:50%;background:" + color + ";box-shadow:0 0 3px rgba(0,0,0,0.7);'></div>",
    iconSize:   [size, size],
    iconAnchor: [Math.floor(size / 2), Math.floor(size / 2)]
  });
}

/**
 * @private
 * Build an L.DivIcon for the given tier.
 */
function _buildAirportIcon(tier) {
  if (tier === 3) {
    // gold diamond 10×10
    return L.divIcon({
      className: "",
      html: "<div style='" +
        "width:0;height:0;" +
        "border-left:5px solid transparent;" +
        "border-right:5px solid transparent;" +
        "border-bottom:8px solid #FFD700;" +
        "position:relative;top:-4px;" +
        "'></div>",
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
  } else if (tier === 2) {
    // white circle 7×7
    return L.divIcon({
      className: "",
      html: "<div style='" +
        "width:7px;height:7px;" +
        "border-radius:50%;" +
        "background:#ffffff;" +
        "border:1px solid #999;" +
        "box-sizing:border-box;" +
        "'></div>",
      iconSize: [7, 7],
      iconAnchor: [3, 3]
    });
  } else {
    // gray dot 5×5
    return L.divIcon({
      className: "",
      html: "<div style='" +
        "width:5px;height:5px;" +
        "border-radius:50%;" +
        "background:#888888;" +
        "border:1px solid #555;" +
        "box-sizing:border-box;" +
        "'></div>",
      iconSize: [5, 5],
      iconAnchor: [2, 2]
    });
  }
}
