"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  IonContent,
  IonPage,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react"
import { useAuth, getUserDataFromStorage } from "../contexts/AuthContext"
import { useHistory } from "react-router"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { firestore } from "../firebase"
import { motion } from "framer-motion"

// SVG Icon Components
const IconShield: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M336 176L225.2 304 176 255.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M463.1 112.37C373.68 96.33 336.71 84.45 256 48c-80.71 36.45-117.68 48.33-207.1 64.37C32.7 369.13 240.58 457.79 256 464c15.42-6.21 223.3-94.87 207.1-351.63z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconStats: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <rect x="64" y="320" width="80" height="128" rx="8" ry="8" opacity="0.4"/>
    <rect x="216" y="256" width="80" height="192" rx="8" ry="8" opacity="0.6"/>
    <rect x="368" y="192" width="80" height="256" rx="8" ry="8" opacity="0.9"/>
  </svg>
)

const IconBusiness: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M176 416v64M80 32h192a32 32 0 0132 32v412a4 4 0 01-4 4H48V64a32 32 0 0132-32zM320 192h112a32 32 0 0132 32v256H320V192z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M112 112h48v48h-48zM240 112h48v48h-48zM112 224h48v48h-48zM240 224h48v48h-48zM112 336h48v48h-48zM240 336h48v48h-48zM384 256h48v48h-48zM384 368h48v48h-48z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconPerson: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z" strokeMiterlimit="10"/>
  </svg>
)

const IconPeople: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M402 168c-2.93 40.67-33.1 72-66 72s-63.12-31.32-66-72c-3-42.31 26.37-72 66-72s69 30.46 66 72z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M336 304c-65.17 0-127.84 32.37-143.54 95.41-2.08 8.34 3.15 16.59 11.72 16.59h263.65c8.57 0 13.77-8.25 11.72-16.59C463.85 336.36 401.18 304 336 304z" strokeMiterlimit="10"/>
    <path d="M200 185.94c-2.34 32.48-26.72 58.06-53 58.06s-50.7-25.57-53-58.06C91.61 152.15 115.34 128 147 128s55.39 24.77 53 57.94z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M206 306c-18.05-8.27-37.93-11.45-59-11.45-52 0-102.1 25.85-114.65 76.2-1.65 6.66 2.53 13.25 9.37 13.25H154" strokeLinecap="round" strokeMiterlimit="10"/>
  </svg>
)

const IconLeaf: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M321.89 171.42C233 114 141 155.22 56 65.22c-19.8-21-8.3 235.5 98.1 332.7 77.79 71 197.9 63.08 238.4-5.92s18.28-163.17-70.61-220.58zM173 253c86 81 175 129 292 147" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconList: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M160 144h288M160 256h288M160 368h288" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="80" cy="144" r="16" fill="currentColor"/>
    <circle cx="80" cy="256" r="16" fill="currentColor"/>
    <circle cx="80" cy="368" r="16" fill="currentColor"/>
  </svg>
)

const IconNotification: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M440.08 341.31c-1.66-2-3.29-4-4.89-5.93-22-26.61-35.31-42.67-35.31-118 0-39-9.33-71-27.72-95-13.56-17.73-31.89-31.18-56.05-41.12a3 3 0 01-.82-.67C306.6 51.49 282.82 32 256 32s-50.59 19.49-59.28 48.56a3.13 3.13 0 01-.81.65c-56.38 23.21-83.78 67.74-83.78 136.14 0 75.36-13.29 91.42-35.31 118-1.6 1.93-3.23 3.89-4.89 5.93a35.16 35.16 0 00-4.65 37.62c6.17 13 19.32 21.07 34.33 21.07H410.5c14.94 0 28-8.06 34.19-21a35.17 35.17 0 00-4.61-37.66zM256 480a80.06 80.06 0 0070.44-42.13 4 4 0 00-3.54-5.87H189.12a4 4 0 00-3.55 5.87A80.06 80.06 0 00256 480z"/>
  </svg>
)

const IconAddCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" strokeMiterlimit="10"/>
    <path d="M256 176v160M336 256H176" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconMap: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M313.27 124.64L198.73 51.36a32 32 0 00-29.28.35L56.51 127.49A16 16 0 0048 141.63v295.8a16 16 0 0023.49 14.14l97.82-63.79a32 32 0 0129.5-.24l111.86 73a32 32 0 0029.27-.11l115.43-75.94a16 16 0 008.63-14.2V74.57a16 16 0 00-23.49-14.14l-98 63.86a32 32 0 01-29.24.35zM328 128v336M184 48v336" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTrophy: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M464 80H400V64a32 32 0 00-32-32H144a32 32 0 00-32 32v16H48a16 16 0 00-16 16v64c0 52.93 43.06 96 96 96h16c5.7 47.74 37.94 87.57 82 100.42V428h-64a8 8 0 00-8 8v32a8 8 0 008 8h240a8 8 0 008-8v-32a8 8 0 00-8-8h-64v-71.58c44.06-12.85 76.3-52.68 82-100.42h16c52.94 0 96-43.07 96-96V96a16 16 0 00-16-16zM96 224a64.07 64.07 0 01-64-64v-48h80v48a194.84 194.84 0 006.77 50.23A64.07 64.07 0 0196 224zm320 0a64.07 64.07 0 01-22.77-13.77A194.84 194.84 0 00400 160v-48h80v48a64.07 64.07 0 01-64 64z"/>
  </svg>
)

const IconCalculator: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="112" y="48" width="288" height="416" rx="32" ry="32" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M160 112h192v64H160z" fill="currentColor"/>
    <circle cx="168" cy="264" r="24" fill="currentColor"/>
    <circle cx="256" cy="264" r="24" fill="currentColor"/>
    <circle cx="344" cy="264" r="24" fill="currentColor"/>
    <circle cx="168" cy="352" r="24" fill="currentColor"/>
    <circle cx="256" cy="352" r="24" fill="currentColor"/>
    <circle cx="344" cy="352" r="24" fill="currentColor"/>
  </svg>
)

const IconArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M268 112l144 144-144 144M392 256H100" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRecycle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M174.7 45.1C192.2 17 223 0 256 0s63.8 17 81.3 45.1l38.6 61.7 27-15.6c8.4-4.9 18.9-4.2 26.6 1.7s11.1 15.9 8.6 25.3l-23.4 87.4c-3.4 12.8-16.6 20.4-29.4 17l-87.4-23.4c-9.4-2.5-16.3-10.4-17.6-20s3.4-19.1 11.8-23.9l28.4-16.4L283 96c-9.7-15.5-26.5-25-44.5-25h-2.5l-24.4 48.8c-5.3 10.6-18.1 14.8-28.6 9.4s-14.6-18.2-9.2-28.7L198.2 55l-7-11.2c-9.8-15.6-26.6-25.3-44.6-25.3H144l-12.2 24.4c-5.3 10.6-18.1 14.8-28.6 9.4S88.6 34.1 94 23.5L116.5-4.3C125-19 141.2-28 159-28c24.4 0 46.8 13.4 58.3 35.1l33.4 53.5 38.5-22.2c8.4-4.9 18.9-4.2 26.6 1.7zm108.3 199.2l30.4 48.6 36.2-24.2c8.4-5.6 19.4-5.3 27.5.8 8.1 6.1 11.2 16.8 7.8 26.8L352 412.4c-4.5 13.1-18.7 20.1-31.6 15.4l-86.8-31c-9.3-3.3-15.4-12-15.4-21.9s6.1-18.6 15.4-21.9l36.2-12.9-30.4-48.6c-10.4-16.6-2.9-38.4 15.1-44.9 18-6.5 38.1 3.9 47.5 19.6zm-198.1 0c9.4-15 29.5-25.4 47.5-19l30.7 11c12.8 4.6 19.1 19.1 14 31.5s-19.8 18.2-32.6 13.6l-25.7-9.2-18.8 30c-10 16-31.2 20.9-47.3 10.8s-21-32.1-10.9-48.1l42.1-67.3z"/>
  </svg>
)

const Home: React.FC = () => {
  const { userData } = useAuth()
  const storedUserData = getUserDataFromStorage()
  const userInfo = userData || storedUserData
  const history = useHistory()

  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quickStats, setQuickStats] = useState({
    totalUsers: 0,
    totalJunkshops: 0,
    totalRequests: 0,
  })

  const isResident = userInfo?.role === "resident"
  const isAdmin = userInfo?.role === "admin"
  const isSuperAdmin = userInfo?.role === "superadmin"
  const isJunkshop = userInfo?.role === "junkshop"

  useEffect(() => {
    if (!userInfo?.uid) return

    const fetchUnreadNotifications = async () => {
      try {
        const notificationsRef = collection(firestore, "notifications")
        const q = query(
          notificationsRef,
          where("userId", "==", userInfo.uid),
          where("read", "==", false),
          where("deleted", "==", false),
        )
        const snapshot = await getDocs(q)
        setUnreadNotifications(snapshot.size)
      } catch (error) {
        console.error("Error fetching notification count", error)
      }
    }

    const fetchRecentActivity = async () => {
      try {
        setLoading(true)
        const requestsRef = collection(firestore, "materialRequests")
        let requestsQuery

        if (isResident) {
          requestsQuery = query(
            requestsRef,
            where("userId", "==", userInfo.uid),
            orderBy("createdAt", "desc"),
            limit(3),
          )
        } else {
          requestsQuery = query(
            requestsRef,
            where("acceptedBy", "==", userInfo.uid),
            orderBy("createdAt", "desc"),
            limit(3),
          )
        }

        const requestsSnapshot = await getDocs(requestsQuery)
        const activities: any[] = []

        requestsSnapshot.forEach((doc) => {
          const data = doc.data()
          activities.push({
            id: doc.id,
            type: "material",
            title: isResident
              ? `${data.type} materials reported`
              : `Collected ${data.type} materials from ${data.userName}`,
            timestamp: data.createdAt?.toDate() || new Date(),
            status: data.status,
          })
        })

        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        setRecentActivity(activities)
      } catch (error) {
        console.error("Error fetching recent activity", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchQuickStats = async () => {
      if (!isAdmin && !isSuperAdmin) return
      
      try {
        const usersSnapshot = await getDocs(collection(firestore, "users"))
        const junkshopsQuery = query(collection(firestore, "users"), where("role", "==", "junkshop"))
        const junkshopsSnapshot = await getDocs(junkshopsQuery)
        const requestsSnapshot = await getDocs(collection(firestore, "materialRequests"))
        
        setQuickStats({
          totalUsers: usersSnapshot.size,
          totalJunkshops: junkshopsSnapshot.size,
          totalRequests: requestsSnapshot.size,
        })
      } catch (error) {
        console.error("Error fetching quick stats", error)
      }
    }

    fetchUnreadNotifications()
    fetchRecentActivity()
    fetchQuickStats()
  }, [userInfo?.uid, isResident, isAdmin, isSuperAdmin])

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      return days[date.getDay()]
    }
    return date.toLocaleDateString()
  }

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin"
    if (isAdmin) return "Admin"
    if (isJunkshop) return "Junkshop Owner"
    return "Resident"
  }

  const getWelcomeMessage = () => {
    if (isSuperAdmin) return "Manage and oversee all system operations"
    if (isAdmin) return "Monitor and manage the system"
    if (isJunkshop) return "Find recyclable materials and manage your business"
    return "Help reduce waste by recycling your materials"
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const RoleIcon = () => {
    const iconClass = "w-4 h-4"
    if (isSuperAdmin) return <IconShield className={iconClass} />
    if (isAdmin) return <IconStats className={iconClass} />
    if (isJunkshop) return <IconBusiness className={iconClass} />
    return <IconPerson className={iconClass} />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'accepted': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleRefresh = async (event: CustomEvent) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      event.detail.complete()
    }
  }

  const quickActions = isResident ? [
    { icon: IconAddCircle, label: "Report Materials", desc: "Submit recyclables", path: "/app/map", gradient: "from-emerald-400 to-green-500" },
    { icon: IconList, label: "My Requests", desc: "Track recyclables", path: "/app/my-requests", gradient: "from-violet-400 to-purple-500" },
    { icon: IconTrophy, label: "Rewards", desc: "Redeem points", path: "/app/rewards", gradient: "from-amber-400 to-orange-500" },
    { icon: IconCalculator, label: "Calculator", desc: "Estimate earnings", path: "/app/calculator", gradient: "from-cyan-400 to-blue-500" },
  ] : isJunkshop ? [
    { icon: IconBusiness, label: "Dashboard", desc: "Manage business", path: "/app/junkshop-dashboard", gradient: "from-emerald-400 to-green-500" },
    { icon: IconMap, label: "Find Materials", desc: "Browse items", path: "/app/find-materials", gradient: "from-blue-400 to-indigo-500" },
    { icon: IconTrophy, label: "Rewards", desc: "Redeem points", path: "/app/rewards", gradient: "from-amber-400 to-orange-500" },
    { icon: IconCalculator, label: "Calculator", desc: "Estimate earnings", path: "/app/calculator", gradient: "from-cyan-400 to-blue-500" },
  ] : [
    { icon: IconStats, label: "Dashboard", desc: "View analytics", path: "/app/admin-dashboard", gradient: "from-orange-400 to-red-500" },
    { icon: IconNotification, label: "Alerts", desc: "View notifications", path: "/app/notifications", gradient: "from-blue-400 to-indigo-500" },
    { icon: IconPeople, label: "Users", desc: "Manage users", path: "/app/admin-dashboard", gradient: "from-violet-400 to-purple-500" },
    { icon: IconTrophy, label: "Rewards", desc: "View rewards", path: "/app/rewards", gradient: "from-amber-400 to-orange-500" },
  ]

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Modern Header with Gradient Background */}
        <div className="relative px-4 pt-12 pb-8 mb-4 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl"></div>
            </div>
          </div>

          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between mb-4"
            >
              <div>
                <p className="text-green-100 text-sm font-medium">{getGreeting()}</p>
                <h1 className="text-2xl font-bold text-white">{userInfo?.name?.split(' ')[0] || 'User'}!</h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => history.push("/app/notifications")}
                className="relative p-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
              >
                <IconNotification className="w-6 h-6 text-white" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/30">
                <RoleIcon />
                {getRoleLabel()}
              </span>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-green-100 text-sm mt-2"
            >
              {getWelcomeMessage()}
            </motion.p>

            {isJunkshop && userInfo?.businessName && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mt-3 text-white/90"
              >
                <IconBusiness className="w-4 h-4" />
                <span className="text-sm font-medium">{userInfo.businessName}</span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="px-4">
          {/* Points Card - Glassmorphism Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-5 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Your Recycling Points</p>
                    <div className="flex items-center gap-2">
                      <IconLeaf className="w-8 h-8 text-white" />
                      <span className="text-4xl font-bold text-white">{userInfo?.points || 0}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => history.push("/app/rewards")}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white text-sm font-semibold border border-white/30 flex items-center gap-2"
                  >
                    Rewards
                    <IconArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
                <p className="text-green-100 text-xs mt-3">
                  {(isAdmin || isSuperAdmin)
                    ? "Track system impact and user participation"
                    : isResident
                    ? "Earn points by recycling and redeem rewards!"
                    : "Earn points by collecting recyclable materials!"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats for Admin/SuperAdmin */}
          {(isAdmin || isSuperAdmin) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-6"
            >
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-200/50 shadow-sm">
                  <IconPeople className="w-7 h-7 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{quickStats.totalUsers}</p>
                  <p className="text-xs text-blue-600 font-medium">Total Users</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center border border-green-200/50 shadow-sm">
                  <IconBusiness className="w-7 h-7 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">{quickStats.totalJunkshops}</p>
                  <p className="text-xs text-green-600 font-medium">Junkshops</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center border border-purple-200/50 shadow-sm">
                  <IconList className="w-7 h-7 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">{quickStats.totalRequests}</p>
                  <p className="text-xs text-purple-600 font-medium">Requests</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-6"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.path + index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => history.push(action.path)}
                  className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-left"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">{action.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
              {recentActivity.length > 0 && (
                <button 
                  onClick={() => history.push(isResident ? "/app/my-requests" : "/app/junkshop-dashboard")}
                  className="text-sm text-green-600 font-medium"
                >
                  View All
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <IonSkeletonText animated style={{ width: "48px", height: "48px", borderRadius: "12px" }} />
                      <div className="flex-1">
                        <IonSkeletonText animated style={{ width: "70%", height: "16px" }} />
                        <IonSkeletonText animated style={{ width: "40%", height: "12px" }} className="mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentActivity.map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                        <IconRecycle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{activity.title}</p>
                        <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconList className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Your activities will appear here</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Eco Tip Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-20"
          >
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200/50">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <IconLeaf className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">Eco Tip of the Day</h3>
                  <p className="text-sm text-green-700">
                    Rinse containers before recycling to prevent contamination. Clean recyclables are more likely to be processed successfully!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Home
