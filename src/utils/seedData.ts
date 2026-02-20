import { collection, doc, setDoc, getDocs, query, where, addDoc } from "firebase/firestore"
import { firestore } from "../firebase"
import { hashPassword } from "./auth"

// Sample data for the Trash-In-N-Out app
export interface SeedUser {
  email: string
  password: string
  name: string
  role: "resident" | "junkshop" | "admin" | "superadmin"
  points?: number
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  address?: string
  phone?: string
}

// Default material prices per kilo (in Philippine Pesos)
export const DEFAULT_MATERIAL_PRICES = [
  { name: "Cardboard", price: 5.0, unit: "kg", description: "Clean, dry cardboard boxes and packaging" },
  { name: "Newspaper", price: 7.0, unit: "kg", description: "Clean newspapers and magazines" },
  { name: "White Paper", price: 12.0, unit: "kg", description: "Clean white office paper, bond paper" },
  { name: "Mixed Paper", price: 4.0, unit: "kg", description: "Mixed paper products, colored paper" },
  { name: "PET Bottles", price: 18.0, unit: "kg", description: "Clear plastic bottles (soda, water, juice)" },
  { name: "HDPE Plastic", price: 15.0, unit: "kg", description: "Milk jugs, detergent bottles, shampoo containers" },
  { name: "PP Plastic", price: 12.0, unit: "kg", description: "Food containers, yogurt cups, bottle caps" },
  { name: "LDPE Plastic", price: 8.0, unit: "kg", description: "Plastic bags, squeeze bottles, bread bags" },
  { name: "Aluminum Cans", price: 65.0, unit: "kg", description: "Clean aluminum beverage cans" },
  { name: "Steel/Tin Cans", price: 12.0, unit: "kg", description: "Food cans, cleaned and flattened" },
  { name: "Glass Bottles (Clear)", price: 2.0, unit: "kg", description: "Clear glass bottles and jars" },
  { name: "Glass Bottles (Colored)", price: 1.5, unit: "kg", description: "Brown, green, or blue glass bottles" },
  { name: "Copper Wire", price: 400.0, unit: "kg", description: "Clean copper wire, stripped preferred" },
  { name: "Copper Pipes", price: 380.0, unit: "kg", description: "Copper pipes and fittings" },
  { name: "Brass", price: 250.0, unit: "kg", description: "Brass fixtures, faucets, valves" },
  { name: "Stainless Steel", price: 45.0, unit: "kg", description: "Stainless steel items, cookware" },
  { name: "Lead", price: 80.0, unit: "kg", description: "Lead batteries, lead items" },
  { name: "E-Waste (Phones)", price: 50.0, unit: "pc", description: "Old mobile phones, smartphones" },
  { name: "E-Waste (Computers)", price: 100.0, unit: "pc", description: "Old computers, laptops, tablets" },
  { name: "Car Batteries", price: 500.0, unit: "pc", description: "Used car batteries (lead-acid)" },
]

// Sample users to create
export const SEED_USERS: SeedUser[] = [
  // Super Admin
  {
    email: "superadmin@trashinnout.com",
    password: "SuperAdmin123!",
    name: "System Administrator",
    role: "superadmin",
    points: 0,
    phone: "09171234567",
    address: "Trash-In-N-Out HQ, Bacoor City, Cavite",
  },
  // Junkshop Owners (with their own admin panels)
  {
    email: "greencycle@junkshop.com",
    password: "GreenCycle123!",
    name: "Maria Santos",
    role: "junkshop",
    points: 1500,
    businessName: "Green Cycle Junkshop",
    businessAddress: "123 Molino Blvd, Bacoor City, Cavite",
    businessPhone: "09181234567",
    phone: "09181234567",
  },
  {
    email: "ecorecycle@junkshop.com",
    password: "EcoRecycle123!",
    name: "Juan Dela Cruz",
    role: "junkshop",
    points: 2200,
    businessName: "Eco Recycle Center",
    businessAddress: "456 Aguinaldo Highway, Imus City, Cavite",
    businessPhone: "09191234567",
    phone: "09191234567",
  },
  {
    email: "basurahero@junkshop.com",
    password: "BasuraHero123!",
    name: "Pedro Reyes",
    role: "junkshop",
    points: 890,
    businessName: "Basura Hero Trading",
    businessAddress: "789 Zapote Road, Las Piñas City",
    businessPhone: "09201234567",
    phone: "09201234567",
  },
  {
    email: "recycleph@junkshop.com",
    password: "RecyclePH123!",
    name: "Anna Garcia",
    role: "junkshop",
    points: 3100,
    businessName: "RecyclePH Trading",
    businessAddress: "321 Congressional Ave, Muntinlupa City",
    businessPhone: "09211234567",
    phone: "09211234567",
  },
  // Individual Junkshop Admins (for managing specific junkshops)
  {
    email: "admin.greencycle@junkshop.com",
    password: "Admin123!",
    name: "Carlo Santos",
    role: "admin",
    points: 0,
    phone: "09221234567",
  },
  {
    email: "admin.ecorecycle@junkshop.com",
    password: "Admin123!",
    name: "Rosa Dela Cruz",
    role: "admin",
    points: 0,
    phone: "09231234567",
  },
  // Residents
  {
    email: "juan.resident@gmail.com",
    password: "Resident123!",
    name: "Juan Bautista",
    role: "resident",
    points: 450,
    phone: "09241234567",
    address: "Block 5 Lot 12, Camella Homes, Bacoor City, Cavite",
  },
  {
    email: "maria.resident@gmail.com",
    password: "Resident123!",
    name: "Maria Clara",
    role: "resident",
    points: 780,
    phone: "09251234567",
    address: "Unit 203, Lancaster New City, General Trias, Cavite",
  },
  {
    email: "pedro.resident@gmail.com",
    password: "Resident123!",
    name: "Pedro Penduko",
    role: "resident",
    points: 120,
    phone: "09261234567",
    address: "Phase 2, Meadowood Executive Village, Bacoor City, Cavite",
  },
  {
    email: "ana.resident@gmail.com",
    password: "Resident123!",
    name: "Ana Gonzales",
    role: "resident",
    points: 950,
    phone: "09271234567",
    address: "Blk 8 Lot 5, Tierra Nevada, General Trias, Cavite",
  },
  {
    email: "jose.resident@gmail.com",
    password: "Resident123!",
    name: "Jose Rizal Jr.",
    role: "resident",
    points: 2100,
    phone: "09281234567",
    address: "123 Brgy. Salitran, Dasmariñas City, Cavite",
  },
]

// Sample rewards
export const SEED_REWARDS = [
  {
    title: "Eco-Friendly Tote Bag",
    description: "Reusable shopping bag made from recycled materials. Perfect for your daily errands!",
    pointsCost: 200,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400",
    available: true,
  },
  {
    title: "Bamboo Utensil Set",
    description: "Portable bamboo cutlery set with fork, spoon, knife, and chopsticks in a carrying case.",
    pointsCost: 350,
    image: "https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?w=400",
    available: true,
  },
  {
    title: "₱50 GCash Credit",
    description: "Get ₱50 GCash credit directly to your account. Minimum 500 points required.",
    pointsCost: 500,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
    available: true,
  },
  {
    title: "Reusable Water Bottle",
    description: "BPA-free stainless steel water bottle, 500ml capacity. Stay hydrated sustainably!",
    pointsCost: 400,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
    available: true,
  },
  {
    title: "₱100 Load Credits",
    description: "Get ₱100 prepaid load for any network. Valid for all Philippine mobile networks.",
    pointsCost: 800,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    available: true,
  },
  {
    title: "Plant a Tree Certificate",
    description: "We'll plant a tree in your name! Includes digital certificate and GPS coordinates.",
    pointsCost: 600,
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400",
    available: true,
  },
  {
    title: "Eco Starter Kit",
    description: "Complete kit with tote bag, metal straw set, and bamboo toothbrush.",
    pointsCost: 1000,
    image: "https://images.unsplash.com/photo-1610141160685-a2e91c8a1e2b?w=400",
    available: true,
  },
  {
    title: "₱500 SM Gift Card",
    description: "SM Gift Card worth ₱500. Use at any SM Department Store or Supermarket.",
    pointsCost: 3500,
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400",
    available: true,
  },
]

// Function to check if data already exists
export const checkExistingData = async (): Promise<{ usersExist: boolean; rewardsExist: boolean; pricesExist: boolean }> => {
  const usersRef = collection(firestore, "users")
  const rewardsRef = collection(firestore, "rewards")
  const pricesRef = collection(firestore, "materialPrices")

  const [usersSnap, rewardsSnap, pricesSnap] = await Promise.all([
    getDocs(query(usersRef, where("role", "==", "superadmin"))),
    getDocs(rewardsRef),
    getDocs(pricesRef),
  ])

  return {
    usersExist: !usersSnap.empty,
    rewardsExist: !rewardsSnap.empty,
    pricesExist: !pricesSnap.empty,
  }
}

// Function to seed users
export const seedUsers = async (): Promise<{ success: boolean; message: string; createdUsers: string[] }> => {
  const createdUsers: string[] = []
  
  try {
    for (const user of SEED_USERS) {
      // Check if user already exists
      const usersRef = collection(firestore, "users")
      const q = query(usersRef, where("email", "==", user.email))
      const existing = await getDocs(q)

      if (!existing.empty) {
        // User already exists, skip silently
        continue
      }

      // Hash password
      const hashedPassword = await hashPassword(user.password)

      // Create user document
      const newUserRef = doc(collection(firestore, "users"))
      await setDoc(newUserRef, {
        uid: newUserRef.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: user.points || 0,
        password: hashedPassword,
        businessName: user.businessName || null,
        businessAddress: user.businessAddress || null,
        businessPhone: user.businessPhone || null,
        address: user.address || null,
        phone: user.phone || null,
        isActive: true,
        createdAt: new Date(),
      })

      createdUsers.push(user.email)

      // If junkshop, create default material prices
      if (user.role === "junkshop") {
        await seedMaterialPricesForJunkshop(newUserRef.id, user.businessName || user.name)
      }
    }

    return {
      success: true,
      message: `Successfully created ${createdUsers.length} users`,
      createdUsers,
    }
  } catch (error: any) {
    console.error("Error seeding users:", error)
    return {
      success: false,
      message: error.message || "Failed to seed users",
      createdUsers,
    }
  }
}

// Function to seed material prices for a specific junkshop
export const seedMaterialPricesForJunkshop = async (junkshopId: string, junkshopName: string): Promise<void> => {
  try {
    // Add some price variation per junkshop
    const priceVariation = () => 1 + (Math.random() * 0.2 - 0.1) // ±10% variation

    for (const material of DEFAULT_MATERIAL_PRICES) {
      const adjustedPrice = Math.round(material.price * priceVariation() * 100) / 100
      
      await addDoc(collection(firestore, "materialPrices"), {
        name: material.name,
        price: adjustedPrice,
        unit: material.unit,
        description: material.description,
        junkshopId: junkshopId,
        junkshopName: junkshopName,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  } catch (error) {
    console.error("Error seeding material prices for junkshop:", error)
  }
}

// Function to seed rewards
export const seedRewards = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if rewards already exist
    const rewardsRef = collection(firestore, "rewards")
    const existing = await getDocs(rewardsRef)

    if (!existing.empty) {
      return { success: true, message: "Rewards already exist" }
    }

    for (const reward of SEED_REWARDS) {
      await addDoc(collection(firestore, "rewards"), {
        ...reward,
        createdAt: new Date(),
      })
    }

    return { success: true, message: `Created ${SEED_REWARDS.length} rewards` }
  } catch (error: any) {
    console.error("Error seeding rewards:", error)
    return { success: false, message: error.message || "Failed to seed rewards" }
  }
}

// Main seed function
export const seedAllData = async (): Promise<{
  success: boolean
  results: {
    users: { success: boolean; message: string; createdUsers?: string[] }
    rewards: { success: boolean; message: string }
  }
}> => {
  const usersResult = await seedUsers()
  const rewardsResult = await seedRewards()

  return {
    success: usersResult.success && rewardsResult.success,
    results: {
      users: usersResult,
      rewards: rewardsResult,
    },
  }
}

// Get credentials for display
export const getSeedCredentials = (): { role: string; email: string; password: string; name: string }[] => {
  return SEED_USERS.map((user) => ({
    role: user.role,
    email: user.email,
    password: user.password,
    name: user.name,
  }))
}
