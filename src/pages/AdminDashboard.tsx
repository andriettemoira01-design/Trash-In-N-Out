"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
} from "@ionic/react"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { firestore } from "../firebase"
import { hashPassword } from "../utils/auth"
import { useAuth } from "../contexts/AuthContext"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import jsPDF from "jspdf"
import { motion, AnimatePresence } from "framer-motion"
import "./AdminDashboard.css"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// SVG Icon Components
const IconUsers: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M336 256c-20.56 0-40.44-9.18-56-25.84-15.13-16.25-24.37-37.92-26-61-1.74-24.62 5.77-47.26 21.14-63.76S312 80 336 80c23.83 0 45.38 9.06 60.7 25.52 15.47 16.62 23 39.22 21.26 63.63-1.67 23.11-10.9 44.77-26 61C376.44 246.82 356.57 256 336 256zm131.83 176H204.18a27.71 27.71 0 01-22-10.67 30.22 30.22 0 01-5.26-25.79c8.42-33.81 29.28-61.85 60.32-81.08C264.79 297.4 299.86 288 336 288c36.85 0 71 9 98.71 26.05 31.11 19.13 52 47.33 60.38 81.55a30.27 30.27 0 01-5.32 25.78A27.68 27.68 0 01467.83 432zM147.92 415.61a47.78 47.78 0 01-2.59-22.24c7.28-34.52 29.33-64.25 63.54-85.86 28.38-17.93 63.59-28.28 100.22-29.35a172.77 172.77 0 00-25.51-1.16c-31.42 0-60.85 8.22-85.08 23.77a140.17 140.17 0 00-53.9 69.76c-1.62 4.91-3 10.19-3.88 15.4a35.62 35.62 0 00-.79 7.35c0 4.34.65 8.6 1.93 12.66a30.35 30.35 0 001.25 3.47h-20.26c-13.31 0-26.23-6-34.55-15.89a43.62 43.62 0 01-7.71-37.19c7.58-36.55 31.61-67.66 67.67-87.59A200 200 0 01176 256c40.93 0 79.79 10.73 112.66 31.11 29.75 18.42 51.27 43.44 62.27 72.56a78.1 78.1 0 00-11-1.17c-5.45 0-10.86.45-16.17 1.33-8.39-20.12-24.37-37.5-46.63-50.55C251.47 294.64 214.75 288 176 288s-75.47 6.64-101.13 19.28c-28.14 13.87-48.27 35.4-56.35 60.3a26.28 26.28 0 004.09 22.55A27 27 0 0044.47 400h105.89c-.61 5.19-.89 10.52-.68 15.94z"/>
  </svg>
)

const IconStore: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 448V240M64 240v208M382.47 48H129.53a32 32 0 00-27.43 15.58L48 160h416l-54.1-96.42A32 32 0 00382.47 48z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M464 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32H144v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRecycle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 48l-112 160h224L256 48zM48 304l112 160V304H48zM464 304H352v160l112-160z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCash: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="32" y="80" width="448" height="256" rx="16" ry="16" transform="rotate(180 256 208)" strokeLinejoin="round"/>
    <path d="M64 384h384M96 432h320" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="256" cy="208" r="80" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M480 160a80 80 0 01-80-80M32 160a80 80 0 0080-80M480 256a80 80 0 00-80 80M32 256a80 80 0 0180 80" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconDocument: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.75a32 32 0 0122.62 9.37l141.26 141.26a32 32 0 019.37 22.62z" strokeLinejoin="round"/>
    <path d="M256 56v120a32 32 0 0032 32h120M176 288h160M176 368h160" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconLogOut: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M304 336v40a40 40 0 01-40 40H104a40 40 0 01-40-40V136a40 40 0 0140-40h152c22.09 0 48 17.91 48 40v40M368 336l80-80-80-80M176 256h256" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="221" cy="221" r="144" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M338.29 338.29L448 448" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconAdd: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 112v288M400 256H112" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconEdit: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/>
  </svg>
)

const IconTrash: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M80 112h352M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconClose: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M368 368L144 144M368 144L144 368" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCalendar: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="48" y="80" width="416" height="384" rx="48" strokeLinejoin="round"/>
    <circle cx="296" cy="232" r="24"/>
    <circle cx="376" cy="232" r="24"/>
    <circle cx="296" cy="312" r="24"/>
    <circle cx="376" cy="312" r="24"/>
    <circle cx="136" cy="312" r="24"/>
    <circle cx="216" cy="312" r="24"/>
    <circle cx="136" cy="392" r="24"/>
    <circle cx="216" cy="392" r="24"/>
    <circle cx="296" cy="392" r="24"/>
    <path d="M128 48v32M384 48v32" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M464 160H48" strokeLinejoin="round"/>
  </svg>
)

const IconRefresh: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M320 146s24.36-12-64-12a160 160 0 10160 160" strokeLinecap="round" strokeMiterlimit="10"/>
    <path d="M256 58l80 80-80 80" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTrendingUp: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M352 144h112v112" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M48 368l144-144 96 96 160-160" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCheckmarkCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>
  </svg>
)

const IconTime: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="256" cy="256" r="208" strokeMiterlimit="10"/>
    <path d="M256 128v144h96" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconGift: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M346 110a34 34 0 00-68 0v34h34a34 34 0 0034-34zM234 110a34 34 0 10-34 34h34z"/>
    <path d="M234 144h44v112H120v-92a20 20 0 0120-20h94zM278 256h114v-92a20 20 0 00-20-20h-94z"/>
    <path d="M480 320v112a64 64 0 01-64 64H278V320zM234 320v176H96a64 64 0 01-64-64V320z"/>
  </svg>
)

// Interface definitions
interface DashboardStats {
  totalUsers: number
  totalJunkshops: number
  totalRequests: number
  totalMaterialsCollected: number
  activeUsers: number
  pendingRequests: number
  completedRequests: number
  totalTransactions: number
  totalRevenue: number
}

interface MaterialPrice {
  id: string
  name: string
  price: number
  unit: string
  description?: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: any
  lastLogin: any
  status: string
  phone?: string
  address?: string
  businessName?: string
  businessAddress?: string
  businessPhone?: string
}

interface MaterialRequest {
  id: string
  userId: string
  userName: string
  materialType: string
  quantity: number
  status: string
  createdAt: any
  updatedAt: any
  fulfillmentMethod?: string
  location: {
    latitude: number
    longitude: string
    address: string
  }
}

interface Transaction {
  id: string
  requestId: string
  userId: string
  junkshopId: string
  materialType: string
  quantity: number
  price: number
  total: number
  status: string
  createdAt: any
}

interface Reward {
  id: string
  title: string
  description: string
  pointsCost: number
  image: string
  available: boolean
  category: string
}

interface Redemption {
  id: string
  userId: string
  userName: string
  rewardId: string
  rewardTitle: string
  pointsCost: number
  redeemedAt: Date
  status: "pending" | "completed" | "rejected"
}

const AdminDashboard: React.FC = () => {
  const { userData, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJunkshops: 0,
    totalRequests: 0,
    totalMaterialsCollected: 0,
    activeUsers: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalTransactions: 0,
    totalRevenue: 0,
  })
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [showToast, setShowToast] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string>("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [showPriceModal, setShowPriceModal] = useState<boolean>(false)
  const [currentPrice, setCurrentPrice] = useState<MaterialPrice | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    end: new Date().toISOString(),
  })
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false)
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)
  const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false)

  // User management states
  const [showUserModal, setShowUserModal] = useState<boolean>(false)
  const [currentUser, setCurrentUser] = useState<{
    id: string; name: string; email: string; role: string; status: string;
    phone: string; address: string;
    businessName: string; businessAddress: string; businessPhone: string;
  } | null>(null)
  const [userFormPassword, setUserFormPassword] = useState<string>("")
  const [priceSearchTerm, setPriceSearchTerm] = useState<string>("")
  const [rewards, setRewards] = useState<Reward[]>([])
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false)
  const [currentReward, setCurrentReward] = useState<Reward | null>(null)
  const [rewardSearchTerm, setRewardSearchTerm] = useState<string>("")
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [redemptionFilter, setRedemptionFilter] = useState<string>("all")

  const isSuperAdmin = userData?.role === "superadmin"

  const dashboardRef = useRef<HTMLDivElement>(null)

  // Auto-dismiss toast after 2 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  // Function to get user data from local storage
  const getUserDataFromStorage = () => {
    try {
      const storedUserData = localStorage.getItem("userData")
      return storedUserData ? JSON.parse(storedUserData) : null
    } catch (error) {
      console.error("Error getting user data from local storage:", error)
      return null
    }
  }

  // Check permissions and fetch data on component mount
  useEffect(() => {
    const checkPermissionAndFetchData = async () => {
      const currentUserData = userData || getUserDataFromStorage()
      if (!currentUserData || (currentUserData.role !== "admin" && currentUserData.role !== "superadmin")) {
        showToastMessage("You do not have permission to access this page", "error")
        return
      }
      fetchDashboardData()
    }
    checkPermissionAndFetchData()
  }, [userData])

  // Fetch data based on role and status filters (not date range - that's applied manually)
  useEffect(() => {
    if (userData?.role === "admin" || userData?.role === "superadmin") {
      fetchFilteredData(false)
    }
  }, [filterRole, filterStatus])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      await fetchUsers()
      await fetchStats()
      await fetchMaterialPrices()
      await fetchRequests()
      await fetchTransactions()
      await fetchRewards()
      await fetchRedemptions()
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      showToastMessage("Error loading dashboard data", "error")
      setIsLoading(false)
    }
  }

  const fetchFilteredData = async (applyDateFilter: boolean = false) => {
    setIsLoading(true)
    try {
      await fetchUsers()
      await fetchRequests(applyDateFilter)
      await fetchTransactions(applyDateFilter)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching filtered data:", error)
      showToastMessage("Error applying filters", "error")
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const usersQuery = query(collection(firestore, "users"))
      const usersSnapshot = await getDocs(usersQuery)
      const totalUsers = usersSnapshot.size

      const junkshopsQuery = query(collection(firestore, "users"), where("role", "==", "junkshop"))
      const junkshopsSnapshot = await getDocs(junkshopsQuery)
      const totalJunkshops = junkshopsSnapshot.size

      const requestsQuery = query(collection(firestore, "materialRequests"))
      const requestsSnapshot = await getDocs(requestsQuery)
      const totalRequests = requestsSnapshot.size

      const pendingQuery = query(collection(firestore, "materialRequests"), where("status", "==", "pending"))
      const pendingSnapshot = await getDocs(pendingQuery)
      const pendingRequests = pendingSnapshot.size

      const completedQuery = query(collection(firestore, "materialRequests"), where("status", "==", "completed"))
      const completedSnapshot = await getDocs(completedQuery)
      const completedRequests = completedSnapshot.size

      const transactionsQuery = query(collection(firestore, "transactions"))
      const transactionsSnapshot = await getDocs(transactionsQuery)
      const totalTransactions = transactionsSnapshot.size

      let totalMaterialsCollected = 0
      let totalRevenue = 0

      transactionsSnapshot.forEach((doc) => {
        const transaction = doc.data()
        totalMaterialsCollected += transaction.quantity || 0
        totalRevenue += transaction.total || 0
      })

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const activeUsersQuery = query(
        collection(firestore, "users"),
        where("lastLogin", ">=", Timestamp.fromDate(thirtyDaysAgo))
      )
      const activeUsersSnapshot = await getDocs(activeUsersQuery)
      const activeUsers = activeUsersSnapshot.size

      setStats({
        totalUsers,
        totalJunkshops,
        totalRequests,
        totalMaterialsCollected,
        activeUsers,
        pendingRequests,
        completedRequests,
        totalTransactions,
        totalRevenue,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      throw error
    }
  }

  const fetchMaterialPrices = async () => {
    try {
      const materialsRef = collection(firestore, "materialPrices")
      const snapshot = await getDocs(materialsRef)

      if (snapshot.empty) {
        await createDefaultMaterialPrices()
        const newSnapshot = await getDocs(materialsRef)
        const materials = newSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as MaterialPrice)
        setMaterialPrices(materials)
      } else {
        const materials = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as MaterialPrice)
        setMaterialPrices(materials)
      }
    } catch (error) {
      console.error("Error fetching material prices:", error)
      throw error
    }
  }

  const createDefaultMaterialPrices = async () => {
    const defaultPrices = [
      { name: "Cardboard", price: 3.5, unit: "kg", description: "Clean, dry cardboard boxes" },
      { name: "Newspaper", price: 5.0, unit: "kg", description: "Clean newspapers and magazines" },
      { name: "White Paper", price: 8.0, unit: "kg", description: "Clean white office paper" },
      { name: "PET Bottles", price: 15.0, unit: "kg", description: "Clean plastic bottles" },
      { name: "HDPE Plastic", price: 12.0, unit: "kg", description: "Milk jugs, detergent bottles" },
      { name: "Aluminum Cans", price: 60.0, unit: "kg", description: "Clean aluminum beverage cans" },
      { name: "Steel/Tin Cans", price: 10.0, unit: "kg", description: "Food cans, cleaned" },
      { name: "Glass Bottles", price: 1.5, unit: "kg", description: "Clean glass bottles and jars" },
      { name: "Copper", price: 350.0, unit: "kg", description: "Copper wire, pipes, etc." },
      { name: "Brass", price: 200.0, unit: "kg", description: "Brass fixtures, parts" },
    ]

    try {
      const batch = []
      for (const price of defaultPrices) {
        batch.push(addDoc(collection(firestore, "materialPrices"), price))
      }
      await Promise.all(batch)
    } catch (error) {
      console.error("Error creating default material prices:", error)
      throw error
    }
  }

  const fetchUsers = async () => {
    try {
      const usersRef = collection(firestore, "users")
      const basicSnapshot = await getDocs(usersRef)

      let fetchedUsers: User[] = []
      if (basicSnapshot.size > 0) {
        let usersQuery = query(collection(firestore, "users"))
        if (filterRole !== "all") {
          usersQuery = query(usersQuery, where("role", "==", filterRole))
        }

        const snapshot = await getDocs(usersQuery)
        fetchedUsers = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            email: data.email || "",
            name: data.name || data.displayName || "",
            role: data.role || "resident",
            createdAt: data.createdAt || Timestamp.now(),
            lastLogin: data.lastLogin || Timestamp.now(),
            status: data.status || (data.isActive ? "active" : "inactive"),
            phone: data.phone || "",
            address: data.address || "",
            businessName: data.businessName || "",
            businessAddress: data.businessAddress || "",
            businessPhone: data.businessPhone || "",
          } as User
        })
      }

      if (searchTerm) {
        const filtered = fetchedUsers.filter(
          (user) =>
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setUsers(filtered)
      } else {
        setUsers(fetchedUsers)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      throw error
    }
  }

  const fetchRequests = async (applyDateFilter: boolean = false) => {
    try {
      let requestsQuery = query(collection(firestore, "materialRequests"), orderBy("createdAt", "desc"))

      if (filterStatus !== "all") {
        requestsQuery = query(requestsQuery, where("status", "==", filterStatus))
      }

      // Only apply date filter when explicitly requested
      if (applyDateFilter && dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        requestsQuery = query(
          requestsQuery,
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          where("createdAt", "<=", Timestamp.fromDate(endDate))
        )
      }

      const snapshot = await getDocs(requestsQuery)
      const fetchedRequests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as MaterialRequest)

      if (searchTerm) {
        const filtered = fetchedRequests.filter(
          (request) =>
            request.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.materialType?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setRequests(filtered)
      } else {
        setRequests(fetchedRequests)
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      throw error
    }
  }

  const fetchTransactions = async (applyDateFilter: boolean = false) => {
    try {
      let transactionsQuery = query(collection(firestore, "transactions"), orderBy("createdAt", "desc"))

      // Only apply date filter when explicitly requested
      if (applyDateFilter && dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        transactionsQuery = query(
          transactionsQuery,
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          where("createdAt", "<=", Timestamp.fromDate(endDate))
        )
      }

      const snapshot = await getDocs(transactionsQuery)
      const fetchedTransactions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Transaction)

      if (searchTerm) {
        const filtered = fetchedTransactions.filter((transaction) =>
          transaction.materialType?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setTransactions(filtered)
      } else {
        setTransactions(fetchedTransactions)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      throw error
    }
  }

  const fetchRewards = async () => {
    try {
      const rewardsRef = collection(firestore, "rewards")
      const snapshot = await getDocs(rewardsRef)
      const rewardsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Reward)
      setRewards(rewardsList)
    } catch (error) {
      console.error("Error fetching rewards:", error)
    }
  }

  const fetchRedemptions = async () => {
    try {
      const redemptionsRef = collection(firestore, "redemptions")
      const q = query(redemptionsRef, orderBy("redeemedAt", "desc"))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          rewardId: data.rewardId,
          rewardTitle: data.rewardTitle,
          pointsCost: data.pointsCost,
          redeemedAt: data.redeemedAt?.toDate() || new Date(),
          status: data.status || "pending",
        } as Redemption
      })
      setRedemptions(list)
    } catch (error) {
      console.error("Error fetching redemptions:", error)
    }
  }

  const handleApproveRedemption = async (redemption: Redemption) => {
    try {
      await updateDoc(doc(firestore, "redemptions", redemption.id), { status: "completed" })
      await addDoc(collection(firestore, "notifications"), {
        userId: redemption.userId,
        title: "Reward Approved",
        message: `Your redemption of "${redemption.rewardTitle}" has been approved!`,
        read: false,
        deleted: false,
        createdAt: Timestamp.now(),
        type: "reward",
      })
      showToastMessage("Redemption approved")
      fetchRedemptions()
    } catch (error) {
      console.error("Error approving redemption:", error)
      showToastMessage("Error approving redemption", "error")
    }
  }

  const handleRejectRedemption = async (redemption: Redemption) => {
    try {
      await updateDoc(doc(firestore, "redemptions", redemption.id), { status: "rejected" })
      // Refund points
      const userRef = doc(firestore, "users", redemption.userId)
      const userSnap = await getDocs(query(collection(firestore, "users"), where("__name__", "==", redemption.userId)))
      if (!userSnap.empty) {
        const currentPoints = userSnap.docs[0].data().points || 0
        await updateDoc(userRef, { points: currentPoints + redemption.pointsCost })
      }
      await addDoc(collection(firestore, "notifications"), {
        userId: redemption.userId,
        title: "Reward Rejected",
        message: `Your redemption of "${redemption.rewardTitle}" was rejected. ${redemption.pointsCost} points have been refunded.`,
        read: false,
        deleted: false,
        createdAt: Timestamp.now(),
        type: "reward",
      })
      showToastMessage("Redemption rejected & points refunded")
      fetchRedemptions()
    } catch (error) {
      console.error("Error rejecting redemption:", error)
      showToastMessage("Error rejecting redemption", "error")
    }
  }

  const handleRefresh = async (event: CustomEvent) => {
    try {
      await fetchDashboardData()
      event.detail.complete()
      showToastMessage("Dashboard refreshed")
    } catch (error) {
      console.error("Error refreshing data:", error)
      showToastMessage("Error refreshing data", "error")
      event.detail.complete()
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (activeTab === "users") {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(value.toLowerCase()) ||
          user.email?.toLowerCase().includes(value.toLowerCase())
      )
      setUsers(filtered)
    } else if (activeTab === "requests") {
      const filtered = requests.filter(
        (request) =>
          request.userName?.toLowerCase().includes(value.toLowerCase()) ||
          request.materialType?.toLowerCase().includes(value.toLowerCase())
      )
      setRequests(filtered)
    } else if (activeTab === "transactions") {
      const filtered = transactions.filter((transaction) =>
        transaction.materialType?.toLowerCase().includes(value.toLowerCase())
      )
      setTransactions(filtered)
    }
  }

  // User management handlers
  const handleAddUser = () => {
    setCurrentUser({ id: "", name: "", email: "", role: "resident", status: "active", phone: "", address: "", businessName: "", businessAddress: "", businessPhone: "" })
    setUserFormPassword("")
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setCurrentUser({
      id: user.id, name: user.name, email: user.email, role: user.role, status: user.status || "active",
      phone: user.phone || "", address: user.address || "",
      businessName: user.businessName || "", businessAddress: user.businessAddress || "", businessPhone: user.businessPhone || "",
    })
    setUserFormPassword("")
    setShowUserModal(true)
  }

  const handleDeleteUser = (id: string) => {
    setItemToDelete({ id, type: "user" })
    setShowDeleteAlert(true)
  }

  const saveUser = async () => {
    if (!currentUser) return
    try {
      const businessFields = currentUser.role === "junkshop" ? {
        businessName: currentUser.businessName,
        businessAddress: currentUser.businessAddress,
        businessPhone: currentUser.businessPhone,
      } : {}

      if (currentUser.id) {
        // Edit existing user
        const updateData: any = {
          name: currentUser.name,
          role: currentUser.role,
          status: currentUser.status,
          phone: currentUser.phone,
          address: currentUser.address,
          ...businessFields,
        }
        // Only update password if a new one was entered
        if (userFormPassword.trim()) {
          updateData.password = await hashPassword(userFormPassword)
        }
        await updateDoc(doc(firestore, "users", currentUser.id), updateData)
        setUsers(users.map((u) => u.id === currentUser.id ? { ...u, name: currentUser.name, role: currentUser.role, status: currentUser.status } : u))
        showToastMessage("User updated successfully")
      } else {
        // Add new user - require password
        if (!userFormPassword.trim()) {
          showToastMessage("Password is required for new users", "error")
          return
        }
        // Check if email already exists
        const usersRef = collection(firestore, "users")
        const emailQuery = query(usersRef, where("email", "==", currentUser.email))
        const emailSnapshot = await getDocs(emailQuery)
        if (!emailSnapshot.empty) {
          showToastMessage("Email already in use", "error")
          return
        }
        const hashedPassword = await hashPassword(userFormPassword)
        const newUserRef = doc(collection(firestore, "users"))
        const newUserData: any = {
          uid: newUserRef.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          status: currentUser.status,
          phone: currentUser.phone,
          address: currentUser.address,
          password: hashedPassword,
          points: 0,
          isActive: currentUser.status === "active",
          createdAt: Timestamp.now(),
          lastLogin: Timestamp.now(),
          ...businessFields,
        }
        await setDoc(newUserRef, newUserData)
        setUsers([...users, { id: newUserRef.id, name: currentUser.name, email: currentUser.email, role: currentUser.role, status: currentUser.status, createdAt: Timestamp.now(), lastLogin: Timestamp.now() }])
        showToastMessage("User added successfully")
      }
      setShowUserModal(false)
    } catch (error) {
      console.error("Error saving user:", error)
      showToastMessage("Error saving user", "error")
    }
  }

  const handleAddMaterialPrice = () => {
    setCurrentPrice({ id: "", name: "", price: 0, unit: "kg", description: "" })
    setShowPriceModal(true)
  }

  const handleEditMaterialPrice = (price: MaterialPrice) => {
    setCurrentPrice(price)
    setShowPriceModal(true)
  }

  const handleDeleteMaterialPrice = (id: string) => {
    setItemToDelete({ id, type: "materialPrice" })
    setShowDeleteAlert(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      if (itemToDelete.type === "materialPrice") {
        await deleteDoc(doc(firestore, "materialPrices", itemToDelete.id))
        setMaterialPrices(materialPrices.filter((price) => price.id !== itemToDelete.id))
        showToastMessage("Material price deleted successfully")
      } else if (itemToDelete.type === "user") {
        await deleteDoc(doc(firestore, "users", itemToDelete.id))
        setUsers(users.filter((user) => user.id !== itemToDelete.id))
        showToastMessage("User deleted successfully")
      } else if (itemToDelete.type === "reward") {
        await deleteDoc(doc(firestore, "rewards", itemToDelete.id))
        setRewards(rewards.filter((r) => r.id !== itemToDelete.id))
        showToastMessage("Reward deleted successfully")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      showToastMessage("Error deleting item", "error")
    } finally {
      setShowDeleteAlert(false)
      setItemToDelete(null)
    }
  }

  const saveMaterialPrice = async () => {
    if (!currentPrice) return

    try {
      if (currentPrice.id) {
        await updateDoc(doc(firestore, "materialPrices", currentPrice.id), {
          name: currentPrice.name,
          price: currentPrice.price,
          unit: currentPrice.unit,
          description: currentPrice.description,
        })
        setMaterialPrices(materialPrices.map((price) => (price.id === currentPrice.id ? currentPrice : price)))
        showToastMessage("Material price updated successfully")
      } else {
        const docRef = await addDoc(collection(firestore, "materialPrices"), {
          name: currentPrice.name,
          price: currentPrice.price,
          unit: currentPrice.unit,
          description: currentPrice.description,
        })
        setMaterialPrices([...materialPrices, { ...currentPrice, id: docRef.id }])
        showToastMessage("Material price added successfully")
      }
      setShowPriceModal(false)
    } catch (error) {
      console.error("Error saving material price:", error)
      showToastMessage("Error saving material price", "error")
    }
  }

  const handleAddReward = () => {
    setCurrentReward({ id: "", title: "", description: "", pointsCost: 0, image: "", available: true, category: "voucher" })
    setShowRewardModal(true)
  }

  const handleEditReward = (reward: Reward) => {
    setCurrentReward({ ...reward, category: reward.category || "", image: reward.image || "" })
    setShowRewardModal(true)
  }

  const handleDeleteReward = (id: string) => {
    setItemToDelete({ id, type: "reward" })
    setShowDeleteAlert(true)
  }

  const saveReward = async () => {
    if (!currentReward) return
    try {
      if (currentReward.id) {
        await updateDoc(doc(firestore, "rewards", currentReward.id), {
          title: currentReward.title,
          description: currentReward.description,
          pointsCost: currentReward.pointsCost,
          image: currentReward.image || "",
          available: currentReward.available,
          category: currentReward.category || "",
        })
        setRewards(rewards.map((r) => (r.id === currentReward.id ? currentReward : r)))
        showToastMessage("Reward updated successfully")
      } else {
        const docRef = await addDoc(collection(firestore, "rewards"), {
          title: currentReward.title,
          description: currentReward.description,
          pointsCost: currentReward.pointsCost,
          image: currentReward.image || "",
          available: currentReward.available,
          category: currentReward.category || "",
        })
        setRewards([...rewards, { ...currentReward, id: docRef.id }])
        showToastMessage("Reward added successfully")
      }
      setShowRewardModal(false)
    } catch (error) {
      console.error("Error saving reward:", error)
      showToastMessage("Error saving reward", "error")
    }
  }

  // Chart data preparation
  const prepareUserGrowthData = () => {
    const usersByMonth: { [key: string]: number } = {}
    users.forEach((user) => {
      if (user.createdAt) {
        const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
        if (!usersByMonth[monthYear]) usersByMonth[monthYear] = 0
        usersByMonth[monthYear]++
      }
    })

    const sortedMonths = Object.keys(usersByMonth).sort((a, b) => {
      const [monthA, yearA] = a.split("/").map(Number)
      const [monthB, yearB] = b.split("/").map(Number)
      return yearA !== yearB ? yearA - yearB : monthA - monthB
    })

    return {
      labels: sortedMonths,
      datasets: [{
        label: "New Users",
        data: sortedMonths.map((month) => usersByMonth[month]),
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "rgba(16, 185, 129, 1)",
        tension: 0.4,
      }],
    }
  }

  const prepareMaterialDistributionData = () => {
    const materialCounts: { [key: string]: number } = {}
    requests.forEach((request) => {
      if (request.materialType) {
        if (!materialCounts[request.materialType]) materialCounts[request.materialType] = 0
        materialCounts[request.materialType] += request.quantity || 1
      }
    })

    return {
      labels: Object.keys(materialCounts),
      datasets: [{
        label: "Material Quantity (kg)",
        data: Object.values(materialCounts),
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(20, 184, 166, 0.8)",
        ],
        borderRadius: 8,
      }],
    }
  }

  const prepareRequestStatusData = () => {
    const statusCounts = { pending: 0, inProgress: 0, completed: 0, cancelled: 0 }
    requests.forEach((request) => {
      if (request.status === "pending") statusCounts.pending++
      else if (request.status === "inProgress") statusCounts.inProgress++
      else if (request.status === "completed") statusCounts.completed++
      else if (request.status === "cancelled") statusCounts.cancelled++
    })

    return {
      labels: ["Pending", "In Progress", "Completed", "Cancelled"],
      datasets: [{
        data: [statusCounts.pending, statusCounts.inProgress, statusCounts.completed, statusCounts.cancelled],
        backgroundColor: [
          "rgba(245, 158, 11, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderWidth: 0,
      }],
    }
  }

  const prepareRevenueData = () => {
    const revenueByMonth: { [key: string]: number } = {}
    transactions.forEach((transaction) => {
      if (transaction.createdAt) {
        const date = transaction.createdAt.toDate ? transaction.createdAt.toDate() : new Date(transaction.createdAt)
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
        if (!revenueByMonth[monthYear]) revenueByMonth[monthYear] = 0
        revenueByMonth[monthYear] += transaction.total || 0
      }
    })

    const sortedMonths = Object.keys(revenueByMonth).sort((a, b) => {
      const [monthA, yearA] = a.split("/").map(Number)
      const [monthB, yearB] = b.split("/").map(Number)
      return yearA !== yearB ? yearA - yearB : monthA - monthB
    })

    return {
      labels: sortedMonths,
      datasets: [{
        label: "Revenue (₱)",
        data: sortedMonths.map((month) => revenueByMonth[month]),
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgba(59, 130, 246, 1)",
        tension: 0.4,
      }],
    }
  }

  // PDF Generation
  const generatePDF = async () => {
    setIsPdfGenerating(true)
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15

      // Cover page
      pdf.setFontSize(28)
      pdf.setTextColor(16, 185, 129)
      pdf.text("RecycleMate", pageWidth / 2, 50, { align: "center" })

      pdf.setFontSize(20)
      pdf.setTextColor(60, 60, 60)
      pdf.text("Admin Dashboard Report", pageWidth / 2, 65, { align: "center" })

      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 80, { align: "center" })

      // Stats page
      pdf.addPage()
      pdf.setFontSize(18)
      pdf.setTextColor(60, 60, 60)
      pdf.text("Dashboard Statistics", margin, 30)

      const statsData = [
        ["Total Users", stats.totalUsers.toString()],
        ["Total Junkshops", stats.totalJunkshops.toString()],
        ["Total Requests", stats.totalRequests.toString()],
        ["Pending Requests", stats.pendingRequests.toString()],
        ["Completed Requests", stats.completedRequests.toString()],
        ["Total Revenue", `₱${stats.totalRevenue.toFixed(2)}`],
      ]

      let yPos = 50
      pdf.setFontSize(12)
      statsData.forEach(([label, value]) => {
        pdf.setTextColor(100, 100, 100)
        pdf.text(label, margin, yPos)
        pdf.setTextColor(60, 60, 60)
        pdf.text(value, pageWidth - margin, yPos, { align: "right" })
        yPos += 12
      })

      // Generate PDF as blob and trigger download
      const pdfBlob = pdf.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'RecycleMate_Dashboard_Report.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showToastMessage("PDF downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      showToastMessage("Error generating PDF", "error")
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      showToastMessage("Logout successful")
    } catch (error) {
      console.error("Logout error:", error)
      showToastMessage("Error during logout", "error")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const tabs = [
    { value: "overview", label: "Overview", icon: <IconTrendingUp className="w-4 h-4" /> },
    { value: "users", label: "Users", icon: <IconUsers className="w-4 h-4" /> },
    { value: "requests", label: "Requests", icon: <IconRecycle className="w-4 h-4" /> },
    { value: "transactions", label: "Transactions", icon: <IconCash className="w-4 h-4" /> },
    { value: "prices", label: "Prices", icon: <IconDocument className="w-4 h-4" /> },
    { value: "rewards", label: "Rewards", icon: <IconGift className="w-4 h-4" /> },
    { value: "redemptions", label: "Redemptions", icon: <IconCash className="w-4 h-4" /> },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700"
      case "pending": return "bg-amber-100 text-amber-700"
      case "inProgress": return "bg-blue-100 text-blue-700"
      case "cancelled": return "bg-red-100 text-red-700"
      case "active": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700"
      case "superadmin": return "bg-red-100 text-red-700"
      case "junkshop": case "junkshop_owner": return "bg-orange-100 text-orange-700"
      default: return "bg-emerald-100 text-emerald-700"
    }
  }

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Header */}
        <div className="relative px-4 pt-12 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -right-10 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute bottom-0 -left-10 w-32 h-32 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-2"
            >
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/80 text-sm mt-1">RecycleMate Management</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generatePDF}
                  disabled={isPdfGenerating}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white disabled:opacity-50"
                >
                  <IconDocument className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowLogoutAlert(true)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white"
                >
                  <IconLogOut className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 -mt-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-1.5 flex gap-1 overflow-x-auto"
          >
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </motion.div>
        </div>

        <div className="px-4 mt-4 mb-20" ref={dashboardRef}>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                  <IonSkeletonText animated style={{ width: "40%", height: "20px" }} />
                  <IonSkeletonText animated style={{ width: "60%", height: "32px", marginTop: "8px" }} />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconUsers className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      <p className="text-xs text-white/80">Total Users</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconStore className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-bold">{stats.totalJunkshops}</p>
                      <p className="text-xs text-white/80">Junkshops</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconRecycle className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-bold">{stats.totalRequests}</p>
                      <p className="text-xs text-white/80">Total Requests</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconCash className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-bold">₱{stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-white/80">Total Revenue</p>
                    </div>
                  </div>

                  {/* Secondary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <IconCheckmarkCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-800">{stats.completedRequests}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <IconTime className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-800">{stats.pendingRequests}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <IconUsers className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-800">{stats.activeUsers}</p>
                      <p className="text-xs text-gray-500">Active</p>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">User Growth</h3>
                    <div className="h-64">
                      <Line
                        data={prepareUserGrowthData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { display: false } },
                            x: { grid: { display: false } },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">Material Distribution</h3>
                    <div className="h-64">
                      <Bar
                        data={prepareMaterialDistributionData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { display: false } },
                            x: { grid: { display: false } },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-4">Request Status</h3>
                      <div className="h-48">
                        <Doughnut
                          data={prepareRequestStatusData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: "bottom" } },
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend</h3>
                      <div className="h-48">
                        <Line
                          data={prepareRevenueData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: { beginAtZero: true, grid: { display: false } },
                              x: { grid: { display: false } },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleAddUser}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <IconAdd className="w-5 h-5" />
                    Add User
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="all">All Roles</option>
                      <option value="resident">Residents</option>
                      <option value="junkshop">Junkshops</option>
                      <option value="admin">Admins</option>
                    </select>
                    <button
                      onClick={() => fetchUsers()}
                      className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                    >
                      <IconRefresh className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {users.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {users.map((user) => (
                          <div key={user.id} className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {(user.name || user.email || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{user.name || "N/A"}</p>
                              <p className="text-sm text-gray-500 truncate">{user.email || "N/A"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                  {user.role}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                  {user.status || "inactive"}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <IconEdit className="w-4 h-4" />
                              </button>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <IconTrash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <IconUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No users found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Requests Tab */}
              {activeTab === "requests" && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search requests..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="inProgress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => setShowDateFilter(true)}
                      className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                    >
                      <IconCalendar className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {requests.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {requests.map((request) => (
                          <div key={request.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-800">{request.userName || "Unknown"}</p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                    {request.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{request.materialType} - {request.quantity || 0} kg</p>
                                {request.fulfillmentMethod && (
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 capitalize">
                                    {request.fulfillmentMethod}
                                  </span>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <IconRecycle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No requests found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Transactions Tab */}
              {activeTab === "transactions" && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <button
                      onClick={() => setShowDateFilter(true)}
                      className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                    >
                      <IconCalendar className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {transactions.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800">{transaction.materialType}</p>
                                <p className="text-sm text-gray-500">{transaction.quantity} kg @ ₱{transaction.price?.toFixed(2)}/kg</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {transaction.createdAt?.toDate ? transaction.createdAt.toDate().toLocaleDateString() : "N/A"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-600">₱{transaction.total?.toFixed(2) || "0.00"}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                  {transaction.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <IconCash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No transactions found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Prices Tab */}
              {activeTab === "prices" && (
                <motion.div
                  key="prices"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleAddMaterialPrice}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <IconAdd className="w-5 h-5" />
                    Add Material Price
                  </button>

                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={priceSearchTerm}
                      onChange={(e) => setPriceSearchTerm(e.target.value)}
                      placeholder="Search materials..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {materialPrices.filter((p) => p.name.toLowerCase().includes(priceSearchTerm.toLowerCase()) || (p.description || "").toLowerCase().includes(priceSearchTerm.toLowerCase())).length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {materialPrices.filter((p) => p.name.toLowerCase().includes(priceSearchTerm.toLowerCase()) || (p.description || "").toLowerCase().includes(priceSearchTerm.toLowerCase())).map((price) => (
                          <div key={price.id} className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                              <IconRecycle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800">{price.name}</p>
                              <p className="text-sm text-gray-500">{price.description || "No description"}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-600">₱{price.price.toFixed(2)}</p>
                              <p className="text-xs text-gray-400">per {price.unit}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditMaterialPrice(price)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <IconEdit className="w-4 h-4" />
                              </button>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteMaterialPrice(price.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <IconTrash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <IconDocument className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No material prices found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Rewards Tab */}
              {activeTab === "rewards" && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleAddReward}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                  >
                    <IconAdd className="w-5 h-5" />
                    Add Reward
                  </button>

                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={rewardSearchTerm}
                      onChange={(e) => setRewardSearchTerm(e.target.value)}
                      placeholder="Search rewards..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {rewards.filter((r) => r.title.toLowerCase().includes(rewardSearchTerm.toLowerCase()) || (r.description || "").toLowerCase().includes(rewardSearchTerm.toLowerCase())).length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {rewards.filter((r) => r.title.toLowerCase().includes(rewardSearchTerm.toLowerCase()) || (r.description || "").toLowerCase().includes(rewardSearchTerm.toLowerCase())).map((reward) => (
                          <div key={reward.id} className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {reward.image ? (
                                <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" />
                              ) : (
                                <IconGift className="w-6 h-6 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800">{reward.title}</p>
                              <p className="text-sm text-gray-500 truncate">{reward.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{reward.pointsCost} pts</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reward.available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                  {reward.available ? "Available" : "Unavailable"}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{reward.category}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => handleEditReward(reward)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <IconEdit className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <IconGift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No rewards found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Redemptions Tab */}
              {activeTab === "redemptions" && (
                <motion.div
                  key="redemptions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Filter */}
                  <div className="flex gap-2">
                    {["all", "pending", "completed", "rejected"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setRedemptionFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                          redemptionFilter === f
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {f} {f !== "all" && `(${redemptions.filter((r) => r.status === f).length})`}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {redemptions.filter((r) => redemptionFilter === "all" || r.status === redemptionFilter).length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {redemptions
                          .filter((r) => redemptionFilter === "all" || r.status === redemptionFilter)
                          .map((redemption) => (
                            <div key={redemption.id} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-gray-800">{redemption.rewardTitle}</p>
                                  <p className="text-sm text-gray-500">by {redemption.userName}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-red-500">-{redemption.pointsCost} pts</p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    redemption.status === "completed" ? "bg-green-100 text-green-700" :
                                    redemption.status === "rejected" ? "bg-red-100 text-red-700" :
                                    "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {redemption.status}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">
                                {redemption.redeemedAt.toLocaleDateString()} at {redemption.redeemedAt.toLocaleTimeString()}
                              </p>
                              {redemption.status === "pending" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRejectRedemption(redemption)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                                  >
                                    Reject & Refund
                                  </button>
                                  <button
                                    onClick={() => handleApproveRedemption(redemption)}
                                    className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                                  >
                                    Approve
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <IconCash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No redemptions found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Modals */}
        {createPortal(
        <AnimatePresence>
          {/* Price Modal */}
          {showPriceModal && currentPrice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowPriceModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">{currentPrice.id ? "Edit" : "Add"} Material Price</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                    <input
                      type="text"
                      value={currentPrice.name}
                      onChange={(e) => setCurrentPrice({ ...currentPrice, name: e.target.value })}
                      placeholder="Enter material name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                      <input
                        type="number"
                        value={currentPrice.price}
                        onChange={(e) => setCurrentPrice({ ...currentPrice, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        type="text"
                        value={currentPrice.unit}
                        onChange={(e) => setCurrentPrice({ ...currentPrice, unit: e.target.value || "kg" })}
                        placeholder="kg"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={currentPrice.description || ""}
                      onChange={(e) => setCurrentPrice({ ...currentPrice, description: e.target.value })}
                      placeholder="Enter description"
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPriceModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveMaterialPrice}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Reward Modal */}
          {showRewardModal && currentReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowRewardModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">{currentReward.id ? "Edit" : "Add"} Reward</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={currentReward.title}
                      onChange={(e) => setCurrentReward({ ...currentReward, title: e.target.value })}
                      placeholder="Enter reward title"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={currentReward.description}
                      onChange={(e) => setCurrentReward({ ...currentReward, description: e.target.value })}
                      placeholder="Enter description"
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points Cost</label>
                      <input
                        type="number"
                        value={currentReward.pointsCost}
                        onChange={(e) => setCurrentReward({ ...currentReward, pointsCost: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={currentReward.category}
                        onChange={(e) => setCurrentReward({ ...currentReward, category: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        <option value="voucher">Voucher</option>
                        <option value="discount">Discount</option>
                        <option value="freebie">Freebie</option>
                        <option value="cashback">Cashback</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="text"
                      value={currentReward.image}
                      onChange={(e) => setCurrentReward({ ...currentReward, image: e.target.value })}
                      placeholder="Enter image URL"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Available</label>
                    <button
                      type="button"
                      onClick={() => setCurrentReward({ ...currentReward, available: !currentReward.available })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentReward.available ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${currentReward.available ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRewardModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveReward}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* User Modal */}
          {showUserModal && currentUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
              onClick={() => setShowUserModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-3">{currentUser.id ? "Edit" : "Add"} User</h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={currentUser.name}
                      onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={currentUser.email}
                      onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                      placeholder="Enter email address"
                      disabled={!!currentUser.id}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentUser.id ? "New Password (leave blank to keep current)" : "Password"}
                    </label>
                    <input
                      type="password"
                      value={userFormPassword}
                      onChange={(e) => setUserFormPassword(e.target.value)}
                      placeholder={currentUser.id ? "Enter new password (optional)" : "Enter password"}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={currentUser.phone}
                      onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={currentUser.address}
                      onChange={(e) => setCurrentUser({ ...currentUser, address: e.target.value })}
                      placeholder="Enter address"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={currentUser.role}
                        onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        <option value="resident">Resident</option>
                        <option value="junkshop">Junkshop</option>
                        <option value="admin">Admin</option>
                        {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={currentUser.status}
                        onChange={(e) => setCurrentUser({ ...currentUser, status: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  {/* Business Info Fields - shown when role is junkshop */}
                  {currentUser.role === "junkshop" && (
                    <div className="space-y-4 pt-2 border-t border-gray-200">
                      <p className="text-sm font-semibold text-purple-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="32">
                          <path d="M384 224v184a40 40 0 01-40 40H168a40 40 0 01-40-40V224" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M460 112H52L80 48h352z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M80 112v48a80 80 0 0080 80 80 80 0 0080-80 80 80 0 0080 80 80 80 0 0080-80v-48" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Business Information
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                        <input
                          type="text"
                          value={currentUser.businessName}
                          onChange={(e) => setCurrentUser({ ...currentUser, businessName: e.target.value })}
                          placeholder="Enter business name"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                        <input
                          type="text"
                          value={currentUser.businessAddress}
                          onChange={(e) => setCurrentUser({ ...currentUser, businessAddress: e.target.value })}
                          placeholder="Enter business address"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                        <input
                          type="tel"
                          value={currentUser.businessPhone}
                          onChange={(e) => setCurrentUser({ ...currentUser, businessPhone: e.target.value })}
                          placeholder="Enter business phone number"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveUser}
                    disabled={!currentUser.name || !currentUser.email || (!currentUser.id && !userFormPassword.trim())}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50"
                  >
                    {currentUser.id ? "Update" : "Add"} User
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Date Filter Modal */}
          {showDateFilter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDateFilter(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">Filter by Date</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start ? dateRange.start.split("T")[0] : ""}
                      onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value).toISOString() })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end ? dateRange.end.split("T")[0] : ""}
                      onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value).toISOString() })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => { fetchFilteredData(true); setShowDateFilter(false); }}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold"
                >
                  Apply Filter
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Delete Confirmation */}
          {showDeleteAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteAlert(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconTrash className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Delete</h3>
                <p className="text-gray-500 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteAlert(false); setItemToDelete(null); }}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Logout Confirmation */}
          {showLogoutAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowLogoutAlert(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconLogOut className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Log Out?</h3>
                <p className="text-gray-500 mb-6">Are you sure you want to log out?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutAlert(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold disabled:opacity-50"
                  >
                    {isLoggingOut ? "Logging out..." : "Log Out"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
        )}

        {/* Toast */}
        {createPortal(
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-24 left-4 right-4 p-4 rounded-2xl shadow-xl z-50 ${
                toastType === "success" ? "bg-emerald-600" : "bg-red-600"
              } text-white`}
            >
              <div className="flex items-center gap-3">
                {toastType === "success" ? (
                  <IconCheckmarkCircle className="w-5 h-5" />
                ) : (
                  <IconClose className="w-5 h-5" />
                )}
                <span className="font-medium flex-1">{toastMessage}</span>
                <button onClick={() => setShowToast(false)}>
                  <IconClose className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
        )}

        <div className="text-center py-4 mt-6 mb-4">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Trash-In-N-Out. All rights reserved.</p>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default AdminDashboard
