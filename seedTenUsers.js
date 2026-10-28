const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { Mall, Store, User, QueueToken, TvDisplay } = require("./models");

async function seedDatabase() {
  const uri = process.env.MONGO_URI;
  console.log("Connecting to MongoDB URI:", uri);

  if (!uri) {
    throw new Error("MONGO_URI not found in backend/.env!");
  }

  await mongoose.connect(uri);
  console.log("Connected successfully to database:", mongoose.connection.name);

  // Clear existing collections in redcarpet2.0
  console.log("Cleaning old records in this database...");
  await User.deleteMany({});
  await Mall.deleteMany({});
  await Store.deleteMany({});
  await QueueToken.deleteMany({});
  await TvDisplay.deleteMany({});

  console.log("All collections cleared. Seeding 10 demo users and associated complexes...");

  // Default shared password hash
  const salt = 10;
  const hashPass = async (pass) => await bcrypt.hash(pass, salt);

  // ==========================================
  // 1. Create Malls / Complexes
  // ==========================================
  const mumbaiMallId = new mongoose.Types.ObjectId();
  const delhiMallId = new mongoose.Types.ObjectId();
  const noidaMallId = new mongoose.Types.ObjectId();

  const zaraStoreId = new mongoose.Types.ObjectId();
  const appleStoreId = new mongoose.Types.ObjectId();
  const sephoraStoreId = new mongoose.Types.ObjectId();
  const hmStoreId = new mongoose.Types.ObjectId();
  const nikeStoreId = new mongoose.Types.ObjectId();
  const starbucksStoreId = new mongoose.Types.ObjectId();

  // Mall 1: Phoenix Marketcity (Mumbai)
  const phoenixMumbai = new Mall({
    _id: mumbaiMallId,
    title: "Phoenix Marketcity (Mumbai)",
    description: "Premier shopping and entertainment destination in Kurla West, Mumbai.",
    email: "manager.mumbai@phoenixmall.com",
    password: await hashPass("Phoenix@123"),
    mallconpassword: "Phoenix@123",
    role: "admin",
    city: "Mumbai",
    address: "LBS Marg, Kurla West, Mumbai, MH 400070",
    contactPhone: "+91 22 6180 1100",
    subscriptionStatus: "active",
    menuItems: [
      {
        _id: zaraStoreId,
        name: "Zara Flagship",
        category: "Fast Fashion & Luxury",
        email: "zara.mumbai@phoenixmall.com",
        password: await hashPass("Zara@123"),
        shopconpassword: "Zara@123",
        role: "shop admin",
        conciergeFee: 120,
        description: "Global trendsetter apparel and seasonal runway drops.",
        subscriptionStatus: "active",
      },
      {
        _id: appleStoreId,
        name: "Apple Store Kurla",
        category: "Consumer Electronics & Tech",
        email: "apple.mumbai@phoenixmall.com",
        password: await hashPass("Apple@123"),
        shopconpassword: "Apple@123",
        role: "shop admin",
        conciergeFee: 150,
        description: "Official Apple retail experience and Genius priority queue.",
        subscriptionStatus: "active",
      },
    ],
  });
  await phoenixMumbai.save();

  // Mall 2: Select CITYWALK (New Delhi)
  const citywalkDelhi = new Mall({
    _id: delhiMallId,
    title: "Select CITYWALK (New Delhi)",
    description: "Vibrant upscale shopping mall situated in Saket district centre, South Delhi.",
    email: "manager.delhi@citywalkmall.com",
    password: await hashPass("Citywalk@123"),
    mallconpassword: "Citywalk@123",
    role: "admin",
    city: "New Delhi",
    address: "A-3, District Centre, Saket, New Delhi, DL 110017",
    contactPhone: "+91 11 4211 4200",
    subscriptionStatus: "active",
    menuItems: [
      {
        _id: sephoraStoreId,
        name: "Sephora Beauty Lounge",
        category: "Cosmetics & Fragrances",
        email: "sephora.delhi@citywalkmall.com",
        password: await hashPass("Sephora@123"),
        shopconpassword: "Sephora@123",
        role: "shop admin",
        conciergeFee: 100,
        description: "Luxury makeup, skincare, and fragrance consultation.",
        subscriptionStatus: "active",
      },
      {
        _id: hmStoreId,
        name: "H&M Citywalk",
        category: "Fashion & Lifestyle",
        email: "hm.delhi@citywalkmall.com",
        password: await hashPass("Hm@123"),
        shopconpassword: "Hm@123",
        role: "shop admin",
        conciergeFee: 90,
        description: "Modern clothing and sustainable fashion lines.",
        subscriptionStatus: "active",
      },
    ],
  });
  await citywalkDelhi.save();

  // Mall 3: DLF Mall of India (Noida)
  const dlfNoida = new Mall({
    _id: noidaMallId,
    title: "DLF Mall of India (Noida)",
    description: "India's largest shopping mall spanning 2 million sq.ft across 7 zones.",
    email: "manager.noida@dlfmall.com",
    password: await hashPass("Dlf@123"),
    mallconpassword: "Dlf@123",
    role: "admin",
    city: "Noida",
    address: "Sector 18, Noida, Uttar Pradesh 201301",
    contactPhone: "+91 120 620 9977",
    subscriptionStatus: "active",
    menuItems: [
      {
        _id: nikeStoreId,
        name: "Nike Rise Flagship",
        category: "Sportswear & Performance",
        email: "nike.noida@dlfmall.com",
        password: await hashPass("Nike@123"),
        shopconpassword: "Nike@123",
        role: "shop admin",
        conciergeFee: 110,
        description: "Athletic apparel, limited footwear releases, and digital fitting.",
        subscriptionStatus: "active",
      },
      {
        _id: starbucksStoreId,
        name: "Starbucks Reserve Cafe",
        category: "Artisanal Coffee & Beverages",
        email: "starbucks.noida@dlfmall.com",
        password: await hashPass("Starbucks@123"),
        shopconpassword: "Starbucks@123",
        role: "shop admin",
        conciergeFee: 80,
        description: "Rare single-origin coffees and express mobile pickup.",
        subscriptionStatus: "active",
      },
    ],
  });
  await dlfNoida.save();

  // ==========================================
  // 2. Populate Dedicated Store Collection
  // ==========================================
  const storeDocs = [
    {
      _id: zaraStoreId,
      mallId: mumbaiMallId,
      mallTitle: "Phoenix Marketcity (Mumbai)",
      name: "Zara Flagship",
      category: "Fast Fashion & Luxury",
      email: "zara.mumbai@phoenixmall.com",
      password: await hashPass("Zara@123"),
      shopconpassword: "Zara@123",
      role: "shop admin",
      conciergeFee: 120,
    },
    {
      _id: appleStoreId,
      mallId: mumbaiMallId,
      mallTitle: "Phoenix Marketcity (Mumbai)",
      name: "Apple Store Kurla",
      category: "Consumer Electronics & Tech",
      email: "apple.mumbai@phoenixmall.com",
      password: await hashPass("Apple@123"),
      shopconpassword: "Apple@123",
      role: "shop admin",
      conciergeFee: 150,
    },
    {
      _id: sephoraStoreId,
      mallId: delhiMallId,
      mallTitle: "Select CITYWALK (New Delhi)",
      name: "Sephora Beauty Lounge",
      category: "Cosmetics & Fragrances",
      email: "sephora.delhi@citywalkmall.com",
      password: await hashPass("Sephora@123"),
      shopconpassword: "Sephora@123",
      role: "shop admin",
      conciergeFee: 100,
    },
    {
      _id: hmStoreId,
      mallId: delhiMallId,
      mallTitle: "Select CITYWALK (New Delhi)",
      name: "H&M Citywalk",
      category: "Fashion & Lifestyle",
      email: "hm.delhi@citywalkmall.com",
      password: await hashPass("Hm@123"),
      shopconpassword: "Hm@123",
      role: "shop admin",
      conciergeFee: 90,
    },
    {
      _id: nikeStoreId,
      mallId: noidaMallId,
      mallTitle: "DLF Mall of India (Noida)",
      name: "Nike Rise Flagship",
      category: "Sportswear & Performance",
      email: "nike.noida@dlfmall.com",
      password: await hashPass("Nike@123"),
      shopconpassword: "Nike@123",
      role: "shop admin",
      conciergeFee: 110,
    },
    {
      _id: starbucksStoreId,
      mallId: noidaMallId,
      mallTitle: "DLF Mall of India (Noida)",
      name: "Starbucks Reserve Cafe",
      category: "Artisanal Coffee & Beverages",
      email: "starbucks.noida@dlfmall.com",
      password: await hashPass("Starbucks@123"),
      shopconpassword: "Starbucks@123",
      role: "shop admin",
      conciergeFee: 80,
    },
  ];
  await Store.insertMany(storeDocs);

  // ==========================================
  // 3. Create 10 Platform Users (users collection)
  // ==========================================
  const demoUsers = [
    // User 1: SuperAdmin (Platform Owner)
    {
      name: "Kabir Oberoi (SuperAdmin)",
      email: "superadmin@redcarpet.com",
      password: await hashPass("Admin@123"),
      role: "superadmin",
      phone: "+91 99999 88888",
      shopId: null,
      mallId: null,
    },

    // User 2: Mall Manager 1 (Mumbai)
    {
      name: "Rohit Singhania (Phoenix Mumbai)",
      email: "manager.mumbai@phoenixmall.com",
      password: await hashPass("Phoenix@123"),
      role: "admin",
      phone: "+91 98200 11223",
      shopId: String(mumbaiMallId),
      mallId: String(mumbaiMallId),
    },

    // User 3: Mall Manager 2 (Delhi)
    {
      name: "Priya Sharma (Select CITYWALK)",
      email: "manager.delhi@citywalkmall.com",
      password: await hashPass("Citywalk@123"),
      role: "admin",
      phone: "+91 98110 33445",
      shopId: String(delhiMallId),
      mallId: String(delhiMallId),
    },

    // User 4: Mall Manager 3 (Noida)
    {
      name: "Vikram Malhotra (DLF Mall)",
      email: "manager.noida@dlfmall.com",
      password: await hashPass("Dlf@123"),
      role: "admin",
      phone: "+91 98100 55667",
      shopId: String(noidaMallId),
      mallId: String(noidaMallId),
    },

    // User 5: Store Counter 1 (Zara - Mumbai)
    {
      name: "Ananya Sen (Zara Counter)",
      email: "zara.mumbai@phoenixmall.com",
      password: await hashPass("Zara@123"),
      role: "shop admin",
      phone: "+91 98211 44556",
      shopId: String(zaraStoreId),
      mallId: String(mumbaiMallId),
    },

    // User 6: Store Counter 2 (Apple - Mumbai)
    {
      name: "Aditya Verma (Apple Counter)",
      email: "apple.mumbai@phoenixmall.com",
      password: await hashPass("Apple@123"),
      role: "shop admin",
      phone: "+91 98222 66778",
      shopId: String(appleStoreId),
      mallId: String(mumbaiMallId),
    },

    // User 7: Store Counter 3 (Sephora - Delhi)
    {
      name: "Ritu Kapoor (Sephora Counter)",
      email: "sephora.delhi@citywalkmall.com",
      password: await hashPass("Sephora@123"),
      role: "shop admin",
      phone: "+91 98118 77889",
      shopId: String(sephoraStoreId),
      mallId: String(delhiMallId),
    },

    // User 8: Store Counter 4 (H&M - Delhi)
    {
      name: "Kunal Mehra (H&M Counter)",
      email: "hm.delhi@citywalkmall.com",
      password: await hashPass("Hm@123"),
      role: "shop admin",
      phone: "+91 98119 88990",
      shopId: String(hmStoreId),
      mallId: String(delhiMallId),
    },

    // User 9: Store Counter 5 (Nike - Noida)
    {
      name: "Sameer Khan (Nike Counter)",
      email: "nike.noida@dlfmall.com",
      password: await hashPass("Nike@123"),
      role: "shop admin",
      phone: "+91 98188 99001",
      shopId: String(nikeStoreId),
      mallId: String(noidaMallId),
    },

    // User 10: Store Counter 6 (Starbucks - Noida)
    {
      name: "Tanvi Joshi (Starbucks Counter)",
      email: "starbucks.noida@dlfmall.com",
      password: await hashPass("Starbucks@123"),
      role: "shop admin",
      phone: "+91 98189 00112",
      shopId: String(starbucksStoreId),
      mallId: String(noidaMallId),
    },
  ];

  await User.insertMany(demoUsers);
  console.log(`Successfully created ${demoUsers.length} platform users in 'users' collection!`);

  // ==========================================
  // 4. Create TV Display Configurations
  // ==========================================
  const displays = [
    {
      displayid: String(zaraStoreId),
      storeId: String(zaraStoreId),
      mallId: String(mumbaiMallId),
      headline: "ZARA VIP BILLING COUNTER",
      subText: "Now serving digital queue pass holders",
      royalPassText: "Express Checkout Lane 1",
    },
    {
      displayid: String(appleStoreId),
      storeId: String(appleStoreId),
      mallId: String(mumbaiMallId),
      headline: "APPLE GENIUS & EXPRESS CHECKOUT",
      subText: "Please approach the pick-up counter when your token is called",
      royalPassText: "VIP Priority Access",
    },
    {
      displayid: String(sephoraStoreId),
      storeId: String(sephoraStoreId),
      mallId: String(delhiMallId),
      headline: "SEPHORA BEAUTY PASS",
      subText: "Direct concierge service for scheduled guests",
      royalPassText: "Beauty Lounge Counter 2",
    },
    {
      displayid: String(nikeStoreId),
      storeId: String(nikeStoreId),
      mallId: String(noidaMallId),
      headline: "NIKE RISE PERFORMANCE PASS",
      subText: "Priority fitting room & checkout call",
      royalPassText: "Red Carpet Athletic Lane",
    },
  ];
  await TvDisplay.insertMany(displays);

  // ==========================================
  // 5. Create Sample Live Queue Tokens
  // ==========================================
  const queueTokens = [
    {
      token: "101",
      name: "Arjun Kapoor",
      mobile: "9820199182",
      email: "arjun@example.com",
      shopid: String(zaraStoreId),
      mallId: String(mumbaiMallId),
      status: "waiting",
      clicked: false,
    },
    {
      token: "102",
      name: "Meera Nair",
      mobile: "9820233445",
      email: "meera@example.com",
      shopid: String(zaraStoreId),
      mallId: String(mumbaiMallId),
      status: "waiting",
      clicked: false,
    },
    {
      token: "101",
      name: "Siddharth Jain",
      mobile: "9810144556",
      email: "sid@example.com",
      shopid: String(appleStoreId),
      mallId: String(mumbaiMallId),
      status: "waiting",
      clicked: false,
    },
    {
      token: "101",
      name: "Sneha Reddy",
      mobile: "9811288990",
      email: "sneha@example.com",
      shopid: String(sephoraStoreId),
      mallId: String(delhiMallId),
      status: "waiting",
      clicked: false,
    },
  ];
  await QueueToken.insertMany(queueTokens);

  console.log("Database seed completed successfully!");
  console.log("Collections in DB:", Object.keys(mongoose.connection.collections));

  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
