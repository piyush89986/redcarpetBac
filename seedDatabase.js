const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Shop = require("./models/Shop");
const User = require("./models/data");
const QrConfig = require("./models/QrConfig");

const mongoUri =
  process.env.MONGO_URI ||
  process.argv[2] ||
  "mongodb://localhost:27017/redcarpet";

const frontendBaseUrl =
  process.env.FRONTEND_URL ||
  "https://redcarpet-fr-git-main-piyush-singh-tanwar-s-projects.vercel.app";

const mallsData = [
  {
    title: "Phoenix Marketcity (Mumbai)",
    description: "Premier luxury destination in Kurla, Mumbai offering premier retail, gourmet dining & VIP concierge services.",
    image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800&auto=format&fit=crop&q=80",
    email: "manager@phoenixmall.com",
    rawPassword: "Phoenix@123",
    role: "admin",
    stores: [
      {
        name: "Zara",
        email: "zara@phoenixmall.com",
        rawPassword: "Zara@123",
        role: "shop admin",
        description: "Contemporary Spanish fashion & express checkout counter for men, women & kids.",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Apple Store",
        email: "apple@phoenixmall.com",
        rawPassword: "Apple@123",
        role: "shop admin",
        description: "Official Apple retail experience with Genius Bar appointments & VIP token pickup.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "H&M",
        email: "hnm@phoenixmall.com",
        rawPassword: "Hnm@123",
        role: "shop admin",
        description: "Affordable global fashion & lifestyle apparel with designated express billing line.",
        image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Nike",
        email: "nike@phoenixmall.com",
        rawPassword: "Nike@123",
        role: "shop admin",
        description: "Performance sportswear, sneakers & footwear concierge fitting counter.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Sephora",
        email: "sephora@phoenixmall.com",
        rawPassword: "Sephora@123",
        role: "shop admin",
        description: "Luxury beauty, skincare & makeup consultations with VIP concierge queue pass.",
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "Select CITYWALK (New Delhi)",
    description: "South Delhi's most vibrant high-street luxury complex in Saket with flagship international boutiques.",
    image: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800&auto=format&fit=crop&q=80",
    email: "manager@selectcitywalk.com",
    rawPassword: "Citywalk@123",
    role: "admin",
    stores: [
      {
        name: "Zara",
        email: "zara@selectcitywalk.com",
        rawPassword: "Zara@123",
        role: "shop admin",
        description: "Flagship dual-floor Zara store with dedicated VIP billing assistance.",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Starbucks Reserve",
        email: "starbucks@selectcitywalk.com",
        rawPassword: "Starbucks@123",
        role: "shop admin",
        description: "Artisanal coffee brewing and express digital order pickup counter.",
        image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Hamleys",
        email: "hamleys@selectcitywalk.com",
        rawPassword: "Hamleys@123",
        role: "shop admin",
        description: "The finest toy store experience in India with VIP child concierge priority.",
        image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Dyson Demo Zone",
        email: "dyson@selectcitywalk.com",
        rawPassword: "Dyson@123",
        role: "shop admin",
        description: "Hair styling appointments & smart home demo sessions via live digital queue.",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "DLF Mall of India (Noida)",
    description: "India's largest shopping mall spanning 2 million sq. ft. with over 400 global retail brands.",
    image: "https://images.unsplash.com/photo-1567449303078-57ad995bd302?w=800&auto=format&fit=crop&q=80",
    email: "manager@dlfmall.com",
    rawPassword: "Dlf@123",
    role: "admin",
    stores: [
      {
        name: "Uniqlo",
        email: "uniqlo@dlfmall.com",
        rawPassword: "Uniqlo@123",
        role: "shop admin",
        description: "Japanese Lifewear apparel with fast-track trial room queue tokens.",
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Adidas Originals",
        email: "adidas@dlfmall.com",
        rawPassword: "Adidas@123",
        role: "shop admin",
        description: "Exclusive sneaker drops and premium streetwear collection fitting counter.",
        image: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Marks & Spencer",
        email: "mns@dlfmall.com",
        rawPassword: "Mns@123",
        role: "shop admin",
        description: "British formal wear, beauty, and food hall with concierge checkout.",
        image: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Tommy Hilfiger",
        email: "tommy@dlfmall.com",
        rawPassword: "Tommy@123",
        role: "shop admin",
        description: "Classic American cool apparel with dedicated priority counter service.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "Palladium Mall (Ahmedabad)",
    description: "Gujarat's premier luxury epicenter located in Thaltej featuring haute couture and fine jewelry.",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    email: "manager@palladium.com",
    rawPassword: "Palladium@123",
    role: "admin",
    stores: [
      {
        name: "Gucci",
        email: "gucci@palladium.com",
        rawPassword: "Gucci@123",
        role: "shop admin",
        description: "Exclusive Italian luxury fashion, leather goods & VIP private salon.",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Michael Kors",
        email: "mk@palladium.com",
        rawPassword: "Mk@123",
        role: "shop admin",
        description: "Designer handbags, watches & accessories with appointment pass.",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Tumi",
        email: "tumi@palladium.com",
        rawPassword: "Tumi@123",
        role: "shop admin",
        description: "High-end luxury travel luggage, backpacks & business accessories.",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "Forum South Bangalore (Bengaluru)",
    description: "South Bengaluru's iconic experiential retail destination on Kanakapura Road.",
    image: "https://images.unsplash.com/photo-1581417478175-a9ef18f210c2?w=800&auto=format&fit=crop&q=80",
    email: "manager@forumbangalore.com",
    rawPassword: "Forum@123",
    role: "admin",
    stores: [
      {
        name: "Under Armour",
        email: "underarmour@forumbangalore.com",
        rawPassword: "Ua@123",
        role: "shop admin",
        description: "High-tech athletic gear and footwear with priority fit check.",
        image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Superdry",
        email: "superdry@forumbangalore.com",
        rawPassword: "Superdry@123",
        role: "shop admin",
        description: "Japanese-inspired British casualwear with express checkout line.",
        image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Swarovski",
        email: "swarovski@forumbangalore.com",
        rawPassword: "Swarovski@123",
        role: "shop admin",
        description: "Precision-cut crystals, luxury jewelry and bespoke gift wrapping counter.",
        image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "Lulu International Mall (Kochi)",
    description: "One of Asia's largest malls in Edappally, Kochi with 225+ retail stores and hypermarket.",
    image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800&auto=format&fit=crop&q=80",
    email: "manager@lulumall.com",
    rawPassword: "Lulu@123",
    role: "admin",
    stores: [
      {
        name: "Puma",
        email: "puma@lulumall.com",
        rawPassword: "Puma@123",
        role: "shop admin",
        description: "Speed & sport footwear with instant VIP trial slot verification.",
        image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Levi's Store",
        email: "levis@lulumall.com",
        rawPassword: "Levis@123",
        role: "shop admin",
        description: "Authentic denim tailoring and VIP fit service counter.",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Bath & Body Works",
        email: "bbw@lulumall.com",
        rawPassword: "Bbw@123",
        role: "shop admin",
        description: "Signature fragrances, candles and body care with fast billing.",
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "Ambience Mall (Gurugram)",
    description: "Prestigious NH-8 Gurugram landmark destination with an Olympic ice rink and global luxury.",
    image: "https://images.unsplash.com/photo-1567449303078-57ad995bd302?w=800&auto=format&fit=crop&q=80",
    email: "manager@ambiencemall.com",
    rawPassword: "Ambience@123",
    role: "admin",
    stores: [
      {
        name: "Calvin Klein",
        email: "ck@ambiencemall.com",
        rawPassword: "Ck@123",
        role: "shop admin",
        description: "Modern minimalist fashion, denim and underwear line with express cashier.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Bose Experience Store",
        email: "bose@ambiencemall.com",
        rawPassword: "Bose@123",
        role: "shop admin",
        description: "Noise cancelling headphone testing & soundbar demo lounge.",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Sunglass Hut",
        email: "sunglass@ambiencemall.com",
        rawPassword: "Sh@123",
        role: "shop admin",
        description: "Designer eyewear from Ray-Ban, Oakley, Prada with concierge fitting.",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "Inorbit Mall (Hyderabad)",
    description: "Cyberabad's waterfront retail gem overlooking Durgam Cheruvu lake in Madhapur.",
    image: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800&auto=format&fit=crop&q=80",
    email: "manager@inorbitmall.com",
    rawPassword: "Inorbit@123",
    role: "admin",
    stores: [
      {
        name: "Fossil",
        email: "fossil@inorbitmall.com",
        rawPassword: "Fossil@123",
        role: "shop admin",
        description: "Vintage smartwatches, leather goods and jewelry with quick repair pass.",
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Crocs",
        email: "crocs@inorbitmall.com",
        rawPassword: "Crocs@123",
        role: "shop admin",
        description: "Classic clogs, Jibbitz charms and footwear with express checkout line.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "L'Occitane en Provence",
        email: "loccitane@inorbitmall.com",
        rawPassword: "Loccitane@123",
        role: "shop admin",
        description: "French natural beauty and pampering skincare counter appointments.",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "VR Chennai (Chennai)",
    description: "Anna Nagar's award-winning cultural and lifestyle shopping hub inspired by Dravidian heritage.",
    image: "https://images.unsplash.com/photo-1581417478175-a9ef18f210c2?w=800&auto=format&fit=crop&q=80",
    email: "manager@vrchennai.com",
    rawPassword: "Vr@123",
    role: "admin",
    stores: [
      {
        name: "Skechers",
        email: "skechers@vrchennai.com",
        rawPassword: "Skechers@123",
        role: "shop admin",
        description: "Comfort technology sneakers and walking shoes with instant queue token.",
        image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Jack & Jones",
        email: "jj@vrchennai.com",
        rawPassword: "Jj@123",
        role: "shop admin",
        description: "Contemporary urban menswear and denim with dedicated stylist counter.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Aldo",
        email: "aldo@vrchennai.com",
        rawPassword: "Aldo@123",
        role: "shop admin",
        description: "Trendy Canadian footwear, bags and accessories with priority queue.",
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    title: "South City Mall (Kolkata)",
    description: "Eastern India's iconic shopping center on Prince Anwar Shah Road, Kolkata.",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    email: "manager@southcitymall.com",
    rawPassword: "Southcity@123",
    role: "admin",
    stores: [
      {
        name: "Mango",
        email: "mango@southcitymall.com",
        rawPassword: "Mango@123",
        role: "shop admin",
        description: "Mediterranean fashion design for women and men with VIP express fitting.",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "The Body Shop",
        email: "bodyshop@southcitymall.com",
        rawPassword: "Tbs@123",
        role: "shop admin",
        description: "Cruelty-free body butters, skincare & tea tree haircare with fast dispatch.",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
      },
      {
        name: "Ray-Ban",
        email: "rayban@southcitymall.com",
        rawPassword: "Rayban@123",
        role: "shop admin",
        description: "Original Aviators, Wayfarers and prescription optics concierge service.",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
];

const sampleCustomers = [
  { name: "Rahul Sharma", mobile: "9876543210", email: "rahul.sharma@gmail.com" },
  { name: "Priya Patel", mobile: "9812345678", email: "priya.patel@yahoo.com" },
  { name: "Amit Verma", mobile: "9823456789", email: "amit.verma@outlook.com" },
  { name: "Sneha Reddy", mobile: "9834567890", email: "sneha.reddy@gmail.com" },
  { name: "Vikram Singh", mobile: "9845678901", email: "vikram.singh@hotmail.com" },
];

async function seed() {
  console.log("=================================================");
  console.log("🌱 RedCarpet Database Seeder");
  console.log("Connecting to:", mongoUri.replace(/\/\/.*@/, "//***:***@"));
  console.log("=================================================");

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Successfully connected to MongoDB Database!");

    // Clean existing records if any
    console.log("Clearing existing records in collections...");
    await Shop.deleteMany({});
    await User.deleteMany({});
    await QrConfig.deleteMany({});
    console.log("Cleaned collections successfully.");

    // 1. Create Platform SuperAdmin
    console.log("\n[1/4] Creating Platform SuperAdmin...");
    const superAdminPassword = await bcrypt.hash("Admin@123", 10);
    const superAdmin = new Shop({
      title: "RedCarpet Headquarters",
      description: "Platform SuperAdmin System Control Center",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
      email: "admin@redcarpet.com",
      password: superAdminPassword,
      role: "superadmin",
      mallconpassword: "Admin@123",
      subscriptionStatus: "active",
      planType: "enterprise",
      menuItems: [],
    });
    await superAdmin.save();
    console.log("✅ SuperAdmin created: admin@redcarpet.com / Admin@123");

    // 2. Create 10 Malls with stores
    console.log("\n[2/4] Creating 10 Premier Malls with Staff Accounts...");
    const createdMalls = [];

    for (let i = 0; i < mallsData.length; i++) {
      const m = mallsData[i];
      const mallHashedPassword = await bcrypt.hash(m.rawPassword, 10);

      // Process stores in this mall
      const menuItems = [];
      for (const st of m.stores) {
        const storeHashedPassword = await bcrypt.hash(st.rawPassword, 10);
        menuItems.push({
          name: st.name,
          email: st.email,
          password: storeHashedPassword,
          role: st.role,
          shopconpassword: st.rawPassword,
          description: st.description,
          image: st.image,
          link: "a",
        });
      }

      const mallDoc = new Shop({
        title: m.title,
        description: m.description,
        image: m.image,
        email: m.email,
        password: mallHashedPassword,
        role: m.role,
        mallconpassword: m.rawPassword,
        subscriptionStatus: "active",
        planType: "monthly_premium",
        menuItems,
      });

      const savedMall = await mallDoc.save();
      createdMalls.push(savedMall);
      console.log(
        `  🏬 [${i + 1}/10] ${savedMall.title} created (${savedMall.menuItems.length} stores) -> Login: ${m.email} / ${m.rawPassword}`
      );
    }

    // 3. Create Sample Live Queue Tokens for Store Counters
    console.log("\n[3/4] Creating Live Queue Demo Tokens in stores...");
    let totalTokensCreated = 0;

    for (const mall of createdMalls) {
      for (const store of mall.menuItems) {
        // Create 3-5 queue tokens for this store
        const numTokens = Math.floor(Math.random() * 3) + 3; // 3 to 5
        for (let t = 0; t < numTokens; t++) {
          const cust = sampleCustomers[t % sampleCustomers.length];
          const tokenNum = String(t + 1);

          const queueEntry = new User({
            name: `${cust.name}`,
            mobile: cust.mobile,
            email: cust.email,
            token: tokenNum,
            shopid: String(store._id),
            clicked: t === 0, // First one is marked served/called
            createdAt: new Date(Date.now() - (numTokens - t) * 7 * 60 * 1000), // staggered times
          });

          await queueEntry.save();
          totalTokensCreated++;
        }
      }
    }
    console.log(`✅ Created ${totalTokensCreated} active queue tokens across all stores.`);

    // 4. Create QrConfig records
    console.log("\n[4/4] Generating QR Configurations...");
    let totalQrCreated = 0;
    for (const mall of createdMalls) {
      const mallQr = `${frontendBaseUrl.replace(/\/+$/, "")}/${mall._id}`;
      // Mall QR
      await QrConfig.create({
        shopId: String(mall._id),
        qrUrl: mallQr,
        size: 240,
      });
      mall.qrCodeUrl = mallQr;
      totalQrCreated++;

      // Store QRs
      for (const store of mall.menuItems) {
        const storeQr = `${frontendBaseUrl.replace(/\/+$/, "")}/${store._id}`;
        await QrConfig.create({
          shopId: String(store._id),
          qrUrl: storeQr,
          size: 240,
        });
        store.qrCodeUrl = storeQr;
        totalQrCreated++;
      }
      await mall.save();
    }
    console.log(`✅ Generated ${totalQrCreated} direct QR code configurations.`);

    console.log("\n=================================================");
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=================================================");
    console.log("Summary of Credentials Created:");
    console.log("👑 SUPERADMIN:");
    console.log("   Email:    admin@redcarpet.com");
    console.log("   Password: Admin@123");
    console.log("\n🏬 10 MALL MANAGERS:");
    for (const m of mallsData) {
      console.log(`   - ${m.title}: ${m.email} / ${m.rawPassword}`);
    }
    console.log("\n🎟️ STORE COUNTER ADMINS (Samples):");
    console.log("   - Zara (Phoenix Mumbai):  zara@phoenixmall.com / Zara@123");
    console.log("   - Apple (Phoenix Mumbai): apple@phoenixmall.com / Apple@123");
    console.log("   - Zara (Select Citywalk): zara@selectcitywalk.com / Zara@123");
    console.log("   - Uniqlo (DLF Mall):      uniqlo@dlfmall.com / Uniqlo@123");
    console.log("=================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
}

seed();
