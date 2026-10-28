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

  // Clear existing collections in redcarpet2_0
  console.log("Cleaning old records in this database...");
  await User.deleteMany({});
  await Mall.deleteMany({});
  await Store.deleteMany({});
  await QueueToken.deleteMany({});
  await TvDisplay.deleteMany({});

  console.log("All collections cleared. Seeding 20 demo users (Malls + Shops) with high-res images and live queues...");

  const salt = 10;
  const hashPass = async (pass) => await bcrypt.hash(pass, salt);

  // ==========================================
  // ObjectIds for Malls and Stores
  // ==========================================
  const mumbaiMallId = new mongoose.Types.ObjectId();
  const delhiMallId = new mongoose.Types.ObjectId();
  const noidaMallId = new mongoose.Types.ObjectId();
  const palladiumMallId = new mongoose.Types.ObjectId();
  const bangaloreMallId = new mongoose.Types.ObjectId();
  const gurgaonMallId = new mongoose.Types.ObjectId();

  const zaraStoreId = new mongoose.Types.ObjectId();
  const appleStoreId = new mongoose.Types.ObjectId();
  const sephoraStoreId = new mongoose.Types.ObjectId();
  const hmStoreId = new mongoose.Types.ObjectId();
  const pvrStoreId = new mongoose.Types.ObjectId();
  const nikeStoreId = new mongoose.Types.ObjectId();
  const starbucksStoreId = new mongoose.Types.ObjectId();
  const gucciStoreId = new mongoose.Types.ObjectId();
  const lvStoreId = new mongoose.Types.ObjectId();
  const uniqloStoreId = new mongoose.Types.ObjectId();
  const hamleysStoreId = new mongoose.Types.ObjectId();
  const underArmourStoreId = new mongoose.Types.ObjectId();
  const rolexStoreId = new mongoose.Types.ObjectId();

  // Curated High-Res Unsplash Images
  const mallImages = {
    mumbai: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=1000&auto=format&fit=crop&q=80",
    delhi: "https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=1000&auto=format&fit=crop&q=80",
    noida: "https://images.unsplash.com/photo-1581417478175-a9ef18f210c2?w=1000&auto=format&fit=crop&q=80",
    palladium: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80",
    bangalore: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=1000&auto=format&fit=crop&q=80",
    gurgaon: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=1000&auto=format&fit=crop&q=80",
  };

  const storeImages = {
    zara: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
    apple: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
    sephora: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
    hm: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80",
    pvr: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    nike: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    starbucks: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
    gucci: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
    lv: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80",
    uniqlo: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&auto=format&fit=crop&q=80",
    hamleys: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80",
    underArmour: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    rolex: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
  };

  // ==========================================
  // 1. Create Malls (with embedded menuItems)
  // ==========================================
  const mallsData = [
    // Mall 1: Phoenix Marketcity (Mumbai)
    new Mall({
      _id: mumbaiMallId,
      title: "Phoenix Marketcity (Mumbai)",
      description: "Premier shopping and entertainment destination in Kurla West, Mumbai.",
      image: mallImages.mumbai,
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
          image: storeImages.zara,
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
          image: storeImages.apple,
          email: "apple.mumbai@phoenixmall.com",
          password: await hashPass("Apple@123"),
          shopconpassword: "Apple@123",
          role: "shop admin",
          conciergeFee: 150,
          description: "Official Apple retail experience and Genius priority queue.",
          subscriptionStatus: "active",
        },
      ],
    }),

    // Mall 2: Select CITYWALK (New Delhi)
    new Mall({
      _id: delhiMallId,
      title: "Select CITYWALK (New Delhi)",
      description: "Vibrant upscale shopping mall situated in Saket district centre, South Delhi.",
      image: mallImages.delhi,
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
          image: storeImages.sephora,
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
          image: storeImages.hm,
          email: "hm.delhi@citywalkmall.com",
          password: await hashPass("Hm@123"),
          shopconpassword: "Hm@123",
          role: "shop admin",
          conciergeFee: 90,
          description: "Modern clothing and sustainable fashion lines.",
          subscriptionStatus: "active",
        },
        {
          _id: pvrStoreId,
          name: "PVR ICON VIP Cinema",
          category: "Entertainment & Cinema",
          image: storeImages.pvr,
          email: "pvricon.delhi@citywalkmall.com",
          password: await hashPass("Pvr@123"),
          shopconpassword: "Pvr@123",
          role: "shop admin",
          conciergeFee: 150,
          description: "Gold class lounge dining and priority seat dispatch.",
          subscriptionStatus: "active",
        },
      ],
    }),

    // Mall 3: DLF Mall of India (Noida)
    new Mall({
      _id: noidaMallId,
      title: "DLF Mall of India (Noida)",
      description: "India's largest shopping mall spanning 2 million sq.ft across 7 zones.",
      image: mallImages.noida,
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
          image: storeImages.nike,
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
          image: storeImages.starbucks,
          email: "starbucks.noida@dlfmall.com",
          password: await hashPass("Starbucks@123"),
          shopconpassword: "Starbucks@123",
          role: "shop admin",
          conciergeFee: 80,
          description: "Rare single-origin coffees and express mobile pickup.",
          subscriptionStatus: "active",
        },
      ],
    }),

    // Mall 4: Palladium Luxury Mall (Mumbai)
    new Mall({
      _id: palladiumMallId,
      title: "Palladium Luxury Mall (Mumbai)",
      description: "The pinnacle of ultra-luxury retail and haute couture in High Street Phoenix, Lower Parel.",
      image: mallImages.palladium,
      email: "manager.palladium@phoenixmall.com",
      password: await hashPass("Palladium@123"),
      mallconpassword: "Palladium@123",
      role: "admin",
      city: "Mumbai",
      address: "462, Senapati Bapat Marg, Lower Parel, Mumbai, MH 400013",
      contactPhone: "+91 22 4333 9994",
      subscriptionStatus: "active",
      menuItems: [
        {
          _id: gucciStoreId,
          name: "Gucci Luxury Boutique",
          category: "High Fashion & Leather Goods",
          image: storeImages.gucci,
          email: "gucci.mumbai@phoenixmall.com",
          password: await hashPass("Gucci@123"),
          shopconpassword: "Gucci@123",
          role: "shop admin",
          conciergeFee: 250,
          description: "Italian luxury fashion, handbags, and VIP fitting salon.",
          subscriptionStatus: "active",
        },
        {
          _id: lvStoreId,
          name: "Louis Vuitton Maison",
          category: "Luxury Trunks & Haute Couture",
          image: storeImages.lv,
          email: "lv.mumbai@phoenixmall.com",
          password: await hashPass("Louis@123"),
          shopconpassword: "Louis@123",
          role: "shop admin",
          conciergeFee: 300,
          description: "Iconic monogram leathercraft and private client styling.",
          subscriptionStatus: "active",
        },
      ],
    }),

    // Mall 5: Phoenix Mall of Asia (Bengaluru)
    new Mall({
      _id: bangaloreMallId,
      title: "Phoenix Mall of Asia (Bengaluru)",
      description: "Iconic destination on Bellary Road hosting premier global flagships and fine dining.",
      image: mallImages.bangalore,
      email: "manager.bengaluru@phoenixmall.com",
      password: await hashPass("Bangalore@123"),
      mallconpassword: "Bangalore@123",
      role: "admin",
      city: "Bengaluru",
      address: "Bellary Road, Byatarayanapura, Yelahanka, Bengaluru, KA 560092",
      contactPhone: "+91 80 6900 8800",
      subscriptionStatus: "active",
      menuItems: [
        {
          _id: uniqloStoreId,
          name: "Uniqlo Mall of Asia",
          category: "Casual Wear & LifeWear",
          image: storeImages.uniqlo,
          email: "uniqlo.bengaluru@phoenixmall.com",
          password: await hashPass("Uniqlo@123"),
          shopconpassword: "Uniqlo@123",
          role: "shop admin",
          conciergeFee: 100,
          description: "Japanese precision LifeWear and seasonal collections.",
          subscriptionStatus: "active",
        },
        {
          _id: hamleysStoreId,
          name: "Hamleys World of Toys",
          category: "Toys & Interactive Play",
          image: storeImages.hamleys,
          email: "hamleys.bengaluru@phoenixmall.com",
          password: await hashPass("Hamleys@123"),
          shopconpassword: "Hamleys@123",
          role: "shop admin",
          conciergeFee: 80,
          description: "World's finest toy wonderland with VIP checkout lanes.",
          subscriptionStatus: "active",
        },
      ],
    }),

    // Mall 6: Ambience Mall (Gurugram)
    new Mall({
      _id: gurgaonMallId,
      title: "Ambience Mall (Gurugram)",
      description: "Sprawling luxury shopping hub situated on NH-8, Delhi-Gurgaon Expressway.",
      image: mallImages.gurgaon,
      email: "manager.gurgaon@ambiencemall.com",
      password: await hashPass("Ambience@123"),
      mallconpassword: "Ambience@123",
      role: "admin",
      city: "Gurugram",
      address: "NH-8, Ambience Island, DLF Phase 3, Gurugram, HR 122002",
      contactPhone: "+91 124 466 5555",
      subscriptionStatus: "active",
      menuItems: [
        {
          _id: underArmourStoreId,
          name: "Under Armour Athletic",
          category: "Performance Apparel & Training",
          image: storeImages.underArmour,
          email: "underarmour.gurgaon@ambiencemall.com",
          password: await hashPass("Armour@123"),
          shopconpassword: "Armour@123",
          role: "shop admin",
          conciergeFee: 110,
          description: "High-intensity athletic gear and biometric fit advisory.",
          subscriptionStatus: "active",
        },
        {
          _id: rolexStoreId,
          name: "Rolex Haute Horlogerie",
          category: "Luxury Timepieces",
          image: storeImages.rolex,
          email: "rolex.gurgaon@ambiencemall.com",
          password: await hashPass("Rolex@123"),
          shopconpassword: "Rolex@123",
          role: "shop admin",
          conciergeFee: 350,
          description: "Swiss chronometers, certified pre-owned, and private viewing suite.",
          subscriptionStatus: "active",
        },
      ],
    }),
  ];

  for (const mall of mallsData) {
    await mall.save();
  }
  console.log(`Saved ${mallsData.length} complexes in 'malls' collection.`);

  // ==========================================
  // 2. Populate Dedicated 'stores' Collection
  // ==========================================
  const storeDocs = [
    {
      _id: zaraStoreId,
      mallId: mumbaiMallId,
      mallTitle: "Phoenix Marketcity (Mumbai)",
      name: "Zara Flagship",
      category: "Fast Fashion & Luxury",
      image: storeImages.zara,
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
      image: storeImages.apple,
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
      image: storeImages.sephora,
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
      image: storeImages.hm,
      email: "hm.delhi@citywalkmall.com",
      password: await hashPass("Hm@123"),
      shopconpassword: "Hm@123",
      role: "shop admin",
      conciergeFee: 90,
    },
    {
      _id: pvrStoreId,
      mallId: delhiMallId,
      mallTitle: "Select CITYWALK (New Delhi)",
      name: "PVR ICON VIP Cinema",
      category: "Entertainment & Cinema",
      image: storeImages.pvr,
      email: "pvricon.delhi@citywalkmall.com",
      password: await hashPass("Pvr@123"),
      shopconpassword: "Pvr@123",
      role: "shop admin",
      conciergeFee: 150,
    },
    {
      _id: nikeStoreId,
      mallId: noidaMallId,
      mallTitle: "DLF Mall of India (Noida)",
      name: "Nike Rise Flagship",
      category: "Sportswear & Performance",
      image: storeImages.nike,
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
      image: storeImages.starbucks,
      email: "starbucks.noida@dlfmall.com",
      password: await hashPass("Starbucks@123"),
      shopconpassword: "Starbucks@123",
      role: "shop admin",
      conciergeFee: 80,
    },
    {
      _id: gucciStoreId,
      mallId: palladiumMallId,
      mallTitle: "Palladium Luxury Mall (Mumbai)",
      name: "Gucci Luxury Boutique",
      category: "High Fashion & Leather Goods",
      image: storeImages.gucci,
      email: "gucci.mumbai@phoenixmall.com",
      password: await hashPass("Gucci@123"),
      shopconpassword: "Gucci@123",
      role: "shop admin",
      conciergeFee: 250,
    },
    {
      _id: lvStoreId,
      mallId: palladiumMallId,
      mallTitle: "Palladium Luxury Mall (Mumbai)",
      name: "Louis Vuitton Maison",
      category: "Luxury Trunks & Haute Couture",
      image: storeImages.lv,
      email: "lv.mumbai@phoenixmall.com",
      password: await hashPass("Louis@123"),
      shopconpassword: "Louis@123",
      role: "shop admin",
      conciergeFee: 300,
    },
    {
      _id: uniqloStoreId,
      mallId: bangaloreMallId,
      mallTitle: "Phoenix Mall of Asia (Bengaluru)",
      name: "Uniqlo Mall of Asia",
      category: "Casual Wear & LifeWear",
      image: storeImages.uniqlo,
      email: "uniqlo.bengaluru@phoenixmall.com",
      password: await hashPass("Uniqlo@123"),
      shopconpassword: "Uniqlo@123",
      role: "shop admin",
      conciergeFee: 100,
    },
    {
      _id: hamleysStoreId,
      mallId: bangaloreMallId,
      mallTitle: "Phoenix Mall of Asia (Bengaluru)",
      name: "Hamleys World of Toys",
      category: "Toys & Interactive Play",
      image: storeImages.hamleys,
      email: "hamleys.bengaluru@phoenixmall.com",
      password: await hashPass("Hamleys@123"),
      shopconpassword: "Hamleys@123",
      role: "shop admin",
      conciergeFee: 80,
    },
    {
      _id: underArmourStoreId,
      mallId: gurgaonMallId,
      mallTitle: "Ambience Mall (Gurugram)",
      name: "Under Armour Athletic",
      category: "Performance Apparel & Training",
      image: storeImages.underArmour,
      email: "underarmour.gurgaon@ambiencemall.com",
      password: await hashPass("Armour@123"),
      shopconpassword: "Armour@123",
      role: "shop admin",
      conciergeFee: 110,
    },
    {
      _id: rolexStoreId,
      mallId: gurgaonMallId,
      mallTitle: "Ambience Mall (Gurugram)",
      name: "Rolex Haute Horlogerie",
      category: "Luxury Timepieces",
      image: storeImages.rolex,
      email: "rolex.gurgaon@ambiencemall.com",
      password: await hashPass("Rolex@123"),
      shopconpassword: "Rolex@123",
      role: "shop admin",
      conciergeFee: 350,
    },
  ];
  await Store.insertMany(storeDocs);
  console.log(`Saved ${storeDocs.length} stores in 'stores' collection.`);

  // ==========================================
  // 3. Create All 20 Platform Users (users collection)
  // ==========================================
  const allUsers = [
    // ----------------------------------------
    // Group A: Platform Owner (1 User)
    // ----------------------------------------
    {
      name: "Kabir Oberoi (SuperAdmin)",
      email: "superadmin@redcarpet.com",
      password: await hashPass("Admin@123"),
      role: "superadmin",
      phone: "+91 99999 88888",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      shopId: null,
      mallId: null,
    },

    // ----------------------------------------
    // Group B: Mall Managers (6 Users)
    // ----------------------------------------
    {
      name: "Rohit Singhania (Phoenix Mumbai)",
      email: "manager.mumbai@phoenixmall.com",
      password: await hashPass("Phoenix@123"),
      role: "admin",
      phone: "+91 98200 11223",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      shopId: String(mumbaiMallId),
      mallId: String(mumbaiMallId),
    },
    {
      name: "Priya Sharma (Select CITYWALK)",
      email: "manager.delhi@citywalkmall.com",
      password: await hashPass("Citywalk@123"),
      role: "admin",
      phone: "+91 98110 33445",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      shopId: String(delhiMallId),
      mallId: String(delhiMallId),
    },
    {
      name: "Vikram Malhotra (DLF Mall)",
      email: "manager.noida@dlfmall.com",
      password: await hashPass("Dlf@123"),
      role: "admin",
      phone: "+91 98100 55667",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      shopId: String(noidaMallId),
      mallId: String(noidaMallId),
    },
    {
      name: "Devika Singhal (Palladium Luxury)",
      email: "manager.palladium@phoenixmall.com",
      password: await hashPass("Palladium@123"),
      role: "admin",
      phone: "+91 98202 77889",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
      shopId: String(palladiumMallId),
      mallId: String(palladiumMallId),
    },
    {
      name: "Rajesh Narayanan (Mall of Asia)",
      email: "manager.bengaluru@phoenixmall.com",
      password: await hashPass("Bangalore@123"),
      role: "admin",
      phone: "+91 98450 12345",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
      shopId: String(bangaloreMallId),
      mallId: String(bangaloreMallId),
    },
    {
      name: "Harpreet Singh (Ambience Mall)",
      email: "manager.gurgaon@ambiencemall.com",
      password: await hashPass("Ambience@123"),
      role: "admin",
      phone: "+91 98120 67890",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
      shopId: String(gurgaonMallId),
      mallId: String(gurgaonMallId),
    },

    // ----------------------------------------
    // Group C: Store Counter Operators (13 Users)
    // ----------------------------------------
    {
      name: "Ananya Sen (Zara Counter)",
      email: "zara.mumbai@phoenixmall.com",
      password: await hashPass("Zara@123"),
      role: "shop admin",
      phone: "+91 98211 44556",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      shopId: String(zaraStoreId),
      mallId: String(mumbaiMallId),
    },
    {
      name: "Aditya Verma (Apple Counter)",
      email: "apple.mumbai@phoenixmall.com",
      password: await hashPass("Apple@123"),
      role: "shop admin",
      phone: "+91 98222 66778",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
      shopId: String(appleStoreId),
      mallId: String(mumbaiMallId),
    },
    {
      name: "Ritu Kapoor (Sephora Counter)",
      email: "sephora.delhi@citywalkmall.com",
      password: await hashPass("Sephora@123"),
      role: "shop admin",
      phone: "+91 98118 77889",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
      shopId: String(sephoraStoreId),
      mallId: String(delhiMallId),
    },
    {
      name: "Kunal Mehra (H&M Counter)",
      email: "hm.delhi@citywalkmall.com",
      password: await hashPass("Hm@123"),
      role: "shop admin",
      phone: "+91 98119 88990",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
      shopId: String(hmStoreId),
      mallId: String(delhiMallId),
    },
    {
      name: "Aman Gill (PVR VIP Lounge)",
      email: "pvricon.delhi@citywalkmall.com",
      password: await hashPass("Pvr@123"),
      role: "shop admin",
      phone: "+91 98111 22334",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80",
      shopId: String(pvrStoreId),
      mallId: String(delhiMallId),
    },
    {
      name: "Sameer Khan (Nike Counter)",
      email: "nike.noida@dlfmall.com",
      password: await hashPass("Nike@123"),
      role: "shop admin",
      phone: "+91 98188 99001",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      shopId: String(nikeStoreId),
      mallId: String(noidaMallId),
    },
    {
      name: "Tanvi Joshi (Starbucks Counter)",
      email: "starbucks.noida@dlfmall.com",
      password: await hashPass("Starbucks@123"),
      role: "shop admin",
      phone: "+91 98189 00112",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      shopId: String(starbucksStoreId),
      mallId: String(noidaMallId),
    },
    {
      name: "Natasha Kapoor (Gucci Counter)",
      email: "gucci.mumbai@phoenixmall.com",
      password: await hashPass("Gucci@123"),
      role: "shop admin",
      phone: "+91 98205 11224",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      shopId: String(gucciStoreId),
      mallId: String(palladiumMallId),
    },
    {
      name: "Rohan D'Souza (LV Maison Counter)",
      email: "lv.mumbai@phoenixmall.com",
      password: await hashPass("Louis@123"),
      role: "shop admin",
      phone: "+91 98206 33445",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      shopId: String(lvStoreId),
      mallId: String(palladiumMallId),
    },
    {
      name: "Karthik Reddy (Uniqlo Counter)",
      email: "uniqlo.bengaluru@phoenixmall.com",
      password: await hashPass("Uniqlo@123"),
      role: "shop admin",
      phone: "+91 98451 55667",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
      shopId: String(uniqloStoreId),
      mallId: String(bangaloreMallId),
    },
    {
      name: "Pooja Hegde (Hamleys Counter)",
      email: "hamleys.bengaluru@phoenixmall.com",
      password: await hashPass("Hamleys@123"),
      role: "shop admin",
      phone: "+91 98452 77889",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
      shopId: String(hamleysStoreId),
      mallId: String(bangaloreMallId),
    },
    {
      name: "Gaurav Sharma (Under Armour Counter)",
      email: "underarmour.gurgaon@ambiencemall.com",
      password: await hashPass("Armour@123"),
      role: "shop admin",
      phone: "+91 98121 99002",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
      shopId: String(underArmourStoreId),
      mallId: String(gurgaonMallId),
    },
    {
      name: "Simran Bhasin (Rolex Counter)",
      email: "rolex.gurgaon@ambiencemall.com",
      password: await hashPass("Rolex@123"),
      role: "shop admin",
      phone: "+91 98122 00113",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
      shopId: String(rolexStoreId),
      mallId: String(gurgaonMallId),
    },
  ];

  await User.insertMany(allUsers);
  console.log(`Saved ${allUsers.length} total platform users in 'users' collection.`);

  // ==========================================
  // 4. Create TV Displays for Counters
  // ==========================================
  const displays = [
    {
      displayid: String(zaraStoreId),
      storeId: String(zaraStoreId),
      mallId: String(mumbaiMallId),
      headline: "ZARA VIP BILLING COUNTER",
      subText: "Now serving digital queue pass holders",
      royalPassText: "Express Lane 1",
      backgroundImage: storeImages.zara,
    },
    {
      displayid: String(appleStoreId),
      storeId: String(appleStoreId),
      mallId: String(mumbaiMallId),
      headline: "APPLE GENIUS & EXPRESS CHECKOUT",
      subText: "Please approach the pick-up counter when your token is called",
      royalPassText: "VIP Priority Access",
      backgroundImage: storeImages.apple,
    },
    {
      displayid: String(sephoraStoreId),
      storeId: String(sephoraStoreId),
      mallId: String(delhiMallId),
      headline: "SEPHORA BEAUTY PASS",
      subText: "Direct concierge service for scheduled guests",
      royalPassText: "Beauty Lounge Counter 2",
      backgroundImage: storeImages.sephora,
    },
    {
      displayid: String(nikeStoreId),
      storeId: String(nikeStoreId),
      mallId: String(noidaMallId),
      headline: "NIKE RISE PERFORMANCE PASS",
      subText: "Priority fitting room & checkout call",
      royalPassText: "Red Carpet Athletic Lane",
      backgroundImage: storeImages.nike,
    },
    {
      displayid: String(gucciStoreId),
      storeId: String(gucciStoreId),
      mallId: String(palladiumMallId),
      headline: "GUCCI PRIVATE CLIENT SALON",
      subText: "Dedicated personal concierge ready for entry",
      royalPassText: "VIP Haute Couture Lane",
      backgroundImage: storeImages.gucci,
    },
    {
      displayid: String(uniqloStoreId),
      storeId: String(uniqloStoreId),
      mallId: String(bangaloreMallId),
      headline: "UNIQLO EXPRESS DIGITAL QUEUE",
      subText: "Self-checkout & billing pass priority lane",
      royalPassText: "LifeWear Pass",
      backgroundImage: storeImages.uniqlo,
    },
    {
      displayid: String(rolexStoreId),
      storeId: String(rolexStoreId),
      mallId: String(gurgaonMallId),
      headline: "ROLEX PRIVATE VIEWING APPOINTMENTS",
      subText: "VIP Suite consultation in progress",
      royalPassText: "Master Chronometer Lounge",
      backgroundImage: storeImages.rolex,
    },
  ];
  await TvDisplay.insertMany(displays);
  console.log(`Saved ${displays.length} TV displays in 'tvdisplays' collection.`);

  // ==========================================
  // 5. Create Rich Live Queues Across Stores
  // ==========================================
  const queueTokens = [
    // Zara Mumbai Queue
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
      token: "103",
      name: "Rhea Singhania",
      mobile: "9820344556",
      email: "rhea@example.com",
      shopid: String(zaraStoreId),
      mallId: String(mumbaiMallId),
      status: "called",
      calledAt: new Date(),
      clicked: true,
    },
    {
      token: "104",
      name: "Dev Patel",
      mobile: "9820455667",
      email: "dev@example.com",
      shopid: String(zaraStoreId),
      mallId: String(mumbaiMallId),
      status: "served",
      servedAt: new Date(),
      clicked: true,
    },

    // Apple Store Mumbai Queue
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
      token: "102",
      name: "Pooja Roy",
      mobile: "9810255667",
      email: "pooja.r@example.com",
      shopid: String(appleStoreId),
      mallId: String(mumbaiMallId),
      status: "waiting",
      clicked: false,
    },

    // Sephora Delhi Queue
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
    {
      token: "102",
      name: "Kavya Batra",
      mobile: "9811399001",
      email: "kavya@example.com",
      shopid: String(sephoraStoreId),
      mallId: String(delhiMallId),
      status: "called",
      calledAt: new Date(),
      clicked: true,
    },

    // Nike Noida Queue
    {
      token: "101",
      name: "Aman Chopra",
      mobile: "9818811223",
      email: "aman.c@example.com",
      shopid: String(nikeStoreId),
      mallId: String(noidaMallId),
      status: "waiting",
      clicked: false,
    },
    {
      token: "102",
      name: "Varun Dhawan",
      mobile: "9818822334",
      email: "varun.d@example.com",
      shopid: String(nikeStoreId),
      mallId: String(noidaMallId),
      status: "waiting",
      clicked: false,
    },

    // Starbucks Noida Queue
    {
      token: "101",
      name: "Isha Ambani",
      mobile: "9818933445",
      email: "isha@example.com",
      shopid: String(starbucksStoreId),
      mallId: String(noidaMallId),
      status: "waiting",
      clicked: false,
    },

    // Gucci Palladium Mumbai Queue
    {
      token: "101",
      name: "Ananya Panday",
      mobile: "9820544556",
      email: "ananya.p@example.com",
      shopid: String(gucciStoreId),
      mallId: String(palladiumMallId),
      status: "called",
      calledAt: new Date(),
      clicked: true,
    },
    {
      token: "102",
      name: "Karan Johar",
      mobile: "9820555667",
      email: "karan@example.com",
      shopid: String(gucciStoreId),
      mallId: String(palladiumMallId),
      status: "waiting",
      clicked: false,
    },

    // Louis Vuitton Palladium Mumbai Queue
    {
      token: "101",
      name: "Deepika Padukone",
      mobile: "9820666778",
      email: "deepika@example.com",
      shopid: String(lvStoreId),
      mallId: String(palladiumMallId),
      status: "waiting",
      clicked: false,
    },

    // Uniqlo Bengaluru Queue
    {
      token: "101",
      name: "Naveen Kumar",
      mobile: "9845177889",
      email: "naveen@example.com",
      shopid: String(uniqloStoreId),
      mallId: String(bangaloreMallId),
      status: "waiting",
      clicked: false,
    },
    {
      token: "102",
      name: "Divya Spandana",
      mobile: "9845188990",
      email: "divya@example.com",
      shopid: String(uniqloStoreId),
      mallId: String(bangaloreMallId),
      status: "waiting",
      clicked: false,
    },

    // Hamleys Bengaluru Queue
    {
      token: "101",
      name: "Aarav Gupta",
      mobile: "9845299001",
      email: "aarav@example.com",
      shopid: String(hamleysStoreId),
      mallId: String(bangaloreMallId),
      status: "waiting",
      clicked: false,
    },

    // Under Armour Gurugram Queue
    {
      token: "101",
      name: "Virat Kohli",
      mobile: "9812111223",
      email: "virat@example.com",
      shopid: String(underArmourStoreId),
      mallId: String(gurgaonMallId),
      status: "waiting",
      clicked: false,
    },

    // Rolex Gurugram Queue
    {
      token: "101",
      name: "Ratan Tata",
      mobile: "9812233445",
      email: "ratan@example.com",
      shopid: String(rolexStoreId),
      mallId: String(gurgaonMallId),
      status: "called",
      calledAt: new Date(),
      clicked: true,
    },
  ];

  await QueueToken.insertMany(queueTokens);
  console.log(`Saved ${queueTokens.length} live queue tokens in 'queuetokens' collection.`);

  console.log("\n==========================================");
  console.log("DATABASE SEEDING COMPLETED WITH IMAGES!");
  console.log("Total Complexes (malls):", mallsData.length);
  console.log("Total Stores (stores):", storeDocs.length);
  console.log("Total Platform Users (users):", allUsers.length);
  console.log("Total TV Displays (tvdisplays):", displays.length);
  console.log("Total Active Queue Tokens (queuetokens):", queueTokens.length);
  console.log("Collections in DB:", Object.keys(mongoose.connection.collections));
  console.log("==========================================\n");

  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
