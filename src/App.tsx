"use client"

import type React from "react"
import { Redirect, Route, Switch, useLocation, useHistory } from "react-router-dom"
import {
  IonApp,
  setupIonicReact,
} from "@ionic/react"
import { IonReactRouter } from "@ionic/react-router"

/* Core CSS required for Ionic components */
import "@ionic/react/css/core.css"
import "@ionic/react/css/normalize.css"
import "@ionic/react/css/structure.css"
import "@ionic/react/css/typography.css"
import "@ionic/react/css/padding.css"
import "@ionic/react/css/float-elements.css"
import "@ionic/react/css/text-alignment.css"
import "@ionic/react/css/text-transformation.css"
import "@ionic/react/css/flex-utils.css"
import "@ionic/react/css/display.css"

/* Theme variables */
import "./theme/variables.css"
import "./theme/tailwind.css"

/* Pages */
import Home from "./pages/Home"
import Map from "./pages/Map"
import Notifications from "./pages/Notifications"
import Rewards from "./pages/Rewards"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Register from "./pages/Register"
import JunkshopDashboard from "./pages/JunkshopDashboard"
import MaterialRequest from "./pages/MaterialRequest"
import UserMaterialRequests from "./pages/UserMaterialRequests"
import RecycleCalculator from "./pages/RecycleCalculator"
import Chat from "./pages/Chat"
import AdminDashboard from "./pages/AdminDashboard"
import { AuthProvider, useAuth, getUserDataFromStorage } from "./contexts/AuthContext"
import PrivateRoute from "./components/PrivateRoute"
import ProfileCompletionCheck from "./components/ProfileCompletionCheck"
import RoleRoute from "./components/RoleRoute"
import { initPushNotifications, listenForNewNotifications, listenForNewChatMessages } from "./services/pushNotifications"
import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { firestore } from "./firebase"

setupIonicReact({
  mode: "md",
  backButtonText: "",
})

// SVG Icon Components (to avoid Stencil watcher errors with IonIcon)
const IconHome: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <path d="M261.56 101.28a8 8 0 00-11.06 0L66.4 277.15a8 8 0 00-2.47 5.79L63.9 448a32 32 0 0032 32H192a16 16 0 0016-16V328a8 8 0 018-8h80a8 8 0 018 8v136a16 16 0 0016 16h96.06a32 32 0 0032-32V282.94a8 8 0 00-2.47-5.79z"/>
    ) : (
      <>
        <path d="M80 212v236a16 16 0 0016 16h96V328a24 24 0 0124-24h80a24 24 0 0124 24v136h96a16 16 0 0016-16V212" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M480 256L266.89 52c-5-5.28-16.69-5.34-21.78 0L32 256M400 179V64h-48v69" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    )}
  </svg>
)

const IconMap: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <path d="M48.17 113.34A32 32 0 0032 141.24V438a32 32 0 0047 28.37c.43-.23.85-.47 1.26-.74l84.14-55.05a8 8 0 013.63-.89h.06a8 8 0 013.83 1L340 496a32 32 0 0027.44-.32c.24-.12.47-.24.7-.37l83.86-54.84A32 32 0 00480 413V116a32 32 0 00-47.37-28.06l-87.08 51.9a8 8 0 01-6.61.63l-166-56a8 8 0 00-7.64 1.53z"/>
    ) : (
      <path d="M313.27 124.64L198.73 51.36a32 32 0 00-29.28.35L56.51 127.49A16 16 0 0048 141.63v295.8a16 16 0 0023.49 14.14l97.82-63.79a32 32 0 0129.5-.24l111.86 73a32 32 0 0029.27-.11l115.43-75.94a16 16 0 008.63-14.2V74.57a16 16 0 00-23.49-14.14l-98 63.86a32 32 0 01-29.24.35zM328 128v336M184 48v336" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
)

const IconNotifications: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <path d="M440.08 341.31c-1.66-2-3.29-4-4.89-5.93-22-26.61-35.31-42.67-35.31-118 0-39-9.33-71-27.72-95-13.56-17.73-31.89-31.18-56.05-41.12a3 3 0 01-.82-.67C306.6 51.49 282.82 32 256 32s-50.59 19.49-59.28 48.56a3.13 3.13 0 01-.81.65c-56.38 23.21-83.78 67.74-83.78 136.14 0 75.36-13.29 91.42-35.31 118-1.6 1.93-3.23 3.89-4.89 5.93a35.16 35.16 0 00-4.65 37.62c6.17 13 19.32 21.07 34.33 21.07H410.5c14.94 0 28-8.06 34.19-21a35.17 35.17 0 00-4.61-37.66zM256 480a80.06 80.06 0 0070.44-42.13 4 4 0 00-3.54-5.87H189.12a4 4 0 00-3.55 5.87A80.06 80.06 0 00256 480z"/>
    ) : (
      <>
        <path d="M427.68 351.43C402 320 383.87 304 383.87 217.35 383.87 138 343.35 109.73 310 96c-4.43-1.82-8.6-6-9.95-10.55C294.2 65.54 277.8 48 256 48s-38.21 17.55-44 37.47c-1.35 4.6-5.52 8.71-9.95 10.53-33.39 13.75-73.87 41.92-73.87 121.35C128.13 304 110 320 84.32 351.43 73.68 364.45 83 384 101.61 384h308.88c18.51 0 27.77-19.61 17.19-32.57zM320 384v16a64 64 0 01-128 0v-16" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    )}
  </svg>
)

const IconPerson: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <path d="M256 256a112 112 0 10-112-112 112 112 0 00112 112zm0 32c-69.42 0-208 42.88-208 128v64h416v-64c0-85.12-138.58-128-208-128z"/>
    ) : (
      <>
        <path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z" strokeMiterlimit="10"/>
      </>
    )}
  </svg>
)

const IconBusiness: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <path d="M432 176H320V64a32 32 0 00-32-32H224a32 32 0 00-32 32v112H80a32 32 0 00-32 32v224a32 32 0 0032 32h352a32 32 0 0032-32V208a32 32 0 00-32-32zM144 448H96V304h48zm96 0h-48V304h48zm0-192h-48V112h48v144zm96 192h-48V304h48zm96 0h-48V304h48z"/>
    ) : (
      <>
        <path d="M176 416v64M80 32h192a32 32 0 0132 32v412a4 4 0 01-4 4H48a0 0 0 010 0V64a32 32 0 0132-32zM320 192h112a32 32 0 0132 32v256a0 0 0 010 0H320V192z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M112 112h48v48h-48zM240 112h48v48h-48zM112 224h48v48h-48zM240 224h48v48h-48zM112 336h48v48h-48zM240 336h48v48h-48zM384 256h48v48h-48zM384 368h48v48h-48z" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    )}
  </svg>
)

const IconList: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <>
        <path d="M64 144a48 48 0 1048-48 48 48 0 00-48 48zm0 112a48 48 0 1048-48 48 48 0 00-48 48zm0 112a48 48 0 1048-48 48 48 0 00-48 48z"/>
        <path d="M192 112h288v64H192zM192 224h288v64H192zM192 336h288v64H192z"/>
      </>
    ) : (
      <>
        <path d="M160 144h288M160 256h288M160 368h288" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="80" cy="144" r="16" fill="currentColor"/>
        <circle cx="80" cy="256" r="16" fill="currentColor"/>
        <circle cx="80" cy="368" r="16" fill="currentColor"/>
      </>
    )}
  </svg>
)

const IconCalculator: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <path d="M416 80a48.05 48.05 0 00-48-48H144a48.05 48.05 0 00-48 48v352a48.05 48.05 0 0048 48h224a48.05 48.05 0 0048-48zM168 432a24 24 0 1124-24 24 24 0 01-24 24zm0-80a24 24 0 1124-24 24 24 0 01-24 24zm0-80a24 24 0 1124-24 24 24 0 01-24 24zm88 160a24 24 0 1124-24 24 24 0 01-24 24zm0-80a24 24 0 1124-24 24 24 0 01-24 24zm0-80a24 24 0 1124-24 24 24 0 01-24 24zm112 136a24 24 0 01-24 24h-16a8 8 0 01-8-8v-16a8 8 0 018-8h16a24 24 0 0124 24zm0-80a24 24 0 01-24 24h-16a8 8 0 01-8-8v-16a8 8 0 018-8h16a24 24 0 0124 24zm0-80a24 24 0 01-24 24h-16a8 8 0 01-8-8v-16a8 8 0 018-8h16a24 24 0 0124 24zm0-80v24a8 8 0 01-8 8H152a8 8 0 01-8-8V96a8 8 0 018-8h200a8 8 0 018 8z"/>
    ) : (
      <>
        <rect x="112" y="48" width="288" height="416" rx="32" ry="32" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M160 112h192v64H160z" fill="currentColor"/>
        <circle cx="168" cy="264" r="24" fill="currentColor"/>
        <circle cx="256" cy="264" r="24" fill="currentColor"/>
        <circle cx="344" cy="264" r="24" fill="currentColor"/>
        <circle cx="168" cy="352" r="24" fill="currentColor"/>
        <circle cx="256" cy="352" r="24" fill="currentColor"/>
        <circle cx="344" cy="352" r="24" fill="currentColor"/>
      </>
    )}
  </svg>
)

const IconChat: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <>
        <path d="M60.44 389.17c0 .07 0 .2-.08.38C51.05 417.61 48 426.33 48 439.73c0 11.42 7.95 24.27 24.07 24.27 5.25 0 11.45-1.12 18.79-3.66a235.6 235.6 0 0027.17-11.46c16.58-8.12 25.62-12.83 34.78-12.83a26.85 26.85 0 017 .93c47.67 12.67 98.76 10 145.77-8.83a210.21 210.21 0 0076.57-50.09c57.93-57.52 74.48-121.64 70.24-172.29-4.28-51.17-30.31-99.15-77-126.47a209.5 209.5 0 00-85.36-28.06c-103.55-12.74-197.67 39.95-237.77 123.39-22.78 47.39-22.14 95.83-9.23 139.82 11.91 40.63 40.45 77.14 66.67 101.59a26.56 26.56 0 018.73 14.08c1.69 8.57-1.98 20.07-6.18 37.4z"/>
        <path d="M87.48 380c0 .07 0 .2-.08.38-4.22 17.11-7.35 26.13-7.35 39.33 0 11.42 7.95 24.27 24.07 24.27 5.25 0 11.45-1.12 18.79-3.66a235.6 235.6 0 0027.17-11.46c16.58-8.12 25.62-12.83 34.78-12.83a26.85 26.85 0 017 .93c47.67 12.67 98.76 10 145.77-8.83a210.21 210.21 0 0076.57-50.09c57.93-57.52 74.48-121.64 70.24-172.29-4.28-51.17-30.31-99.15-77-126.47a209.5 209.5 0 00-85.36-28.06c-103.55-12.74-197.67 39.95-237.77 123.39-22.78 47.39-22.14 95.83-9.23 139.82 11.91 40.63 40.45 77.14 66.67 101.59A26.56 26.56 0 0187.48 380z"/>
      </>
    ) : (
      <>
        <path d="M431 320.6c-1-3.6 1.2-8.6 3.3-12.2a33.68 33.68 0 012.1-3.1A162 162 0 00464 215c.3-92.2-77.5-167-173.7-167-83.9 0-153.9 57.1-170.3 132.9a160.7 160.7 0 00-3.7 34.2c0 92.3 74.8 169.1 171 169.1 15.3 0 35.9-4.6 47.2-7.7s22.5-7.2 25.4-8.3a26.44 26.44 0 019.3-1.7 26 26 0 0110.1 2l56.7 20.1a13.52 13.52 0 003.9 1 8 8 0 008-8 12.85 12.85 0 00-.5-2.7z" strokeLinecap="round" strokeMiterlimit="10"/>
        <path d="M66.46 232a146.23 146.23 0 006.39 152.67c2.31 3.49 3.61 6.19 3.21 8s-11.93 61.87-11.93 61.87a8 8 0 002.71 7.68A8.17 8.17 0 0072 464a7.26 7.26 0 002.91-.6l56.21-22a15.7 15.7 0 0112 .2c18.94 7.38 39.88 12 60.83 12A159.21 159.21 0 00284 432.11" strokeLinecap="round" strokeMiterlimit="10"/>
      </>
    )}
  </svg>
)

const IconStats: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 32}>
    {filled ? (
      <>
        <path d="M104 496H72a24 24 0 01-24-24V328a24 24 0 0124-24h32a24 24 0 0124 24v144a24 24 0 01-24 24zM328 496h-32a24 24 0 01-24-24V232a24 24 0 0124-24h32a24 24 0 0124 24v240a24 24 0 01-24 24zM216 496h-32a24 24 0 01-24-24V40a24 24 0 0124-24h32a24 24 0 0124 24v432a24 24 0 01-24 24zM440 496h-32a24 24 0 01-24-24V120a24 24 0 0124-24h32a24 24 0 0124 24v352a24 24 0 01-24 24z"/>
      </>
    ) : (
      <path d="M344 280l88-88M232 216l64 64M80 320l104-104" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
)

// Icon type mapping
type IconType = "home" | "map" | "notifications" | "person" | "business" | "list" | "calculator" | "chat" | "stats"

const IconComponent: React.FC<{ type: IconType; filled?: boolean }> = ({ type, filled }) => {
  switch (type) {
    case "home": return <IconHome filled={filled} />
    case "map": return <IconMap filled={filled} />
    case "notifications": return <IconNotifications filled={filled} />
    case "person": return <IconPerson filled={filled} />
    case "business": return <IconBusiness filled={filled} />
    case "list": return <IconList filled={filled} />
    case "calculator": return <IconCalculator filled={filled} />
    case "chat": return <IconChat filled={filled} />
    case "stats": return <IconStats filled={filled} />
    default: return <IconHome filled={filled} />
  }
}

// Custom Tab Button Component
interface TabButtonProps {
  iconType: IconType
  label: string
  href: string
  isActive: boolean
  badge?: number
  onClick: () => void
}

const TabButton: React.FC<TabButtonProps> = ({ iconType, label, isActive, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-2.5 px-1 transition-all duration-300 relative group ${
        isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-b-full"></div>
      )}
      
      {/* Icon container with subtle glow when active */}
      <div className={`relative transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
        <IconComponent type={iconType} filled={isActive} />
        {isActive && (
          <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full -z-10"></div>
        )}
      </div>
      
      <span className={`text-[10px] font-semibold mt-1 transition-colors ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
        {label}
      </span>
      
      {/* Badge */}
      {badge && badge > 0 && (
        <span className="absolute top-1.5 right-1/4 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg shadow-red-500/30 animate-pulse">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  )
}

// Custom Bottom Tab Bar Component
interface CustomTabBarProps {
  tabs: {
    iconType: IconType
    label: string
    href: string
    badge?: number
  }[]
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ tabs }) => {
  const location = useLocation()
  const history = useHistory()

  const isTabActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/")
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_30px_rgba(0,0,0,0.05)]"></div>
      
      {/* Tab items */}
      <div className="relative flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => (
          <TabButton
            key={tab.href}
            iconType={tab.iconType}
            label={tab.label}
            href={tab.href}
            isActive={isTabActive(tab.href)}
            badge={tab.badge}
            onClick={() => history.push(tab.href)}
          />
        ))}
      </div>
    </div>
  )
}

const AppContent: React.FC = () => {
  const { userData } = useAuth()
  const storedUserData = getUserDataFromStorage()
  const userInfo = userData || storedUserData
  const isResident = userInfo?.role === "resident"
  const isJunkshop = userInfo?.role === "junkshop"
  const isAdmin = userInfo?.role === "admin"
  const isSuperAdmin = userInfo?.role === "superadmin"

  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    showToast: false,
  })

  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus({ isOnline: true, showToast: true })
    }

    const handleOffline = () => {
      setNetworkStatus({ isOnline: false, showToast: true })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (networkStatus.showToast) {
      const timer = setTimeout(() => {
        setNetworkStatus((prev) => ({ ...prev, showToast: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [networkStatus.showToast])

  // Initialize push notifications and listen for new ones
  useEffect(() => {
    if (userInfo?.uid) {
      initPushNotifications(userInfo.uid)

      const unsubNotifications = listenForNewNotifications(userInfo.uid)
      const unsubChat = listenForNewChatMessages(userInfo.uid)
      return () => {
        unsubNotifications()
        unsubChat()
      }
    }
  }, [userInfo?.uid])

  // Monitor unread notifications
  useEffect(() => {
    if (!userInfo?.uid) return

    const notificationsRef = collection(firestore, "notifications")
    const q = query(
      notificationsRef,
      where("userId", "==", userInfo.uid),
      where("read", "==", false),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadNotifications(snapshot.size)
      },
      (error) => {
        console.error("Error fetching notification count", error)
      },
    )

    return () => unsubscribe()
  }, [userInfo?.uid])

  // Monitor unread chat messages from chatRooms
  useEffect(() => {
    if (!userInfo?.uid) return

    const roomsRef = collection(firestore, "chatRooms")
    const q = query(roomsRef, where("participants", "array-contains", userInfo.uid))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let total = 0
        snapshot.forEach((doc) => {
          const data = doc.data()
          total += (data.unreadCount?.[userInfo.uid!] || 0)
        })
        setUnreadMessages(total)
      },
      (error) => {
        console.error("Error fetching unread messages count", error)
      },
    )

    return () => unsubscribe()
  }, [userInfo?.uid])

  // Define tabs based on user role
  const getTabsForRole = () => {
    if (isAdmin || isSuperAdmin) {
      return [
        { iconType: "home" as IconType, label: "Home", href: "/app/home" },
        { iconType: "stats" as IconType, label: "Dashboard", href: "/app/admin-dashboard" },
        { iconType: "chat" as IconType, label: "Chat", href: "/app/chat", badge: unreadMessages },
        { iconType: "notifications" as IconType, label: "Alerts", href: "/app/notifications", badge: unreadNotifications },
        { iconType: "person" as IconType, label: "Profile", href: "/app/profile" },
      ]
    } else if (isResident) {
      return [
        { iconType: "home" as IconType, label: "Home", href: "/app/home" },
        { iconType: "map" as IconType, label: "Report", href: "/app/map" },
        { iconType: "list" as IconType, label: "Requests", href: "/app/my-requests" },
        { iconType: "chat" as IconType, label: "Chat", href: "/app/chat", badge: unreadMessages },
        { iconType: "person" as IconType, label: "Profile", href: "/app/profile" },
      ]
    } else {
      // Junkshop
      return [
        { iconType: "home" as IconType, label: "Home", href: "/app/home" },
        { iconType: "business" as IconType, label: "Dashboard", href: "/app/junkshop-dashboard" },
        { iconType: "map" as IconType, label: "Find", href: "/app/find-materials" },
        { iconType: "calculator" as IconType, label: "Calculator", href: "/app/calculator" },
        { iconType: "chat" as IconType, label: "Chat", href: "/app/chat", badge: unreadMessages },
        { iconType: "person" as IconType, label: "Profile", href: "/app/profile" },
      ]
    }
  }

  return (
    <ProfileCompletionCheck>
    <>
      <div className="pb-16">
        <Switch>
          <Route exact path="/app/home">
            <Home />
          </Route>

          {/* Resident-only routes */}
          <RoleRoute exact path="/app/map" role="resident">
            <Map />
          </RoleRoute>
          <RoleRoute path="/app/material-request" role="resident">
            <MaterialRequest />
          </RoleRoute>
          <RoleRoute path="/app/my-requests" role="resident">
            <UserMaterialRequests />
          </RoleRoute>
          {/* Calculator shared between resident and junkshop */}
          <RoleRoute path="/app/calculator" role={["resident", "junkshop"]}>
            <RecycleCalculator />
          </RoleRoute>

          {/* Junkshop-only routes */}
          <RoleRoute path="/app/junkshop-dashboard" role="junkshop">
            <JunkshopDashboard />
          </RoleRoute>
          <RoleRoute path="/app/find-materials" role="junkshop">
            <Map />
          </RoleRoute>

          {/* Admin-only routes (includes superadmin) */}
          <RoleRoute path="/app/admin-dashboard" role={["admin", "superadmin"]}>
            <AdminDashboard />
          </RoleRoute>

          {/* Common routes */}
          <Route exact path="/app/notifications">
            <Notifications />
          </Route>
          <Route exact path="/app/rewards">
            <Rewards />
          </Route>
          <Route path="/app/profile">
            <Profile />
          </Route>
          <Route path="/app/chat">
            <Chat />
          </Route>
          <Route exact path="/app">
            <Redirect to="/app/home" />
          </Route>
        </Switch>
      </div>

      {/* Custom Tab Bar */}
      <CustomTabBar tabs={getTabsForRole()} />

      {/* Native Network Status Toast */}
      {networkStatus.showToast && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl z-50 transition-all duration-300 backdrop-blur-sm flex items-center gap-3 ${
            networkStatus.isOnline
              ? "bg-emerald-500/90 text-white shadow-emerald-500/30"
              : "bg-amber-500/90 text-white shadow-amber-500/30"
          }`}
          onClick={() => setNetworkStatus((prev) => ({ ...prev, showToast: false }))}
        >
          {networkStatus.isOnline ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 flex-shrink-0" fill="currentColor">
              <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 flex-shrink-0" fill="currentColor">
              <path d="M416 160a16 16 0 00-16 16v32a16 16 0 0032 0v-32a16 16 0 00-16-16zM256 256a16 16 0 00-16 16v32a16 16 0 0032 0v-32a16 16 0 00-16-16zM96 352a16 16 0 00-16 16v32a16 16 0 0032 0v-32a16 16 0 00-16-16zM336 256a16 16 0 00-16 16v32a16 16 0 0032 0v-32a16 16 0 00-16-16zM176 352a16 16 0 00-16 16v32a16 16 0 0032 0v-32a16 16 0 00-16-16zM336 352a16 16 0 00-16 16v32a16 16 0 0032 0v-32a16 16 0 00-16-16z"/>
            </svg>
          )}
          <span className="font-medium text-sm">
            {networkStatus.isOnline
              ? "You are back online"
              : "You are offline. Some features may be limited."}
          </span>
        </div>
      )}
    </>
    </ProfileCompletionCheck>
  )
}

const App: React.FC = () => (
  <AuthProvider>
    <IonApp>
      <IonReactRouter>
        <Route path="/login" component={Login} exact />
        <Route path="/register" component={Register} exact />

        <PrivateRoute path="/app">
          <AppContent />
        </PrivateRoute>

        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
      </IonReactRouter>
    </IonApp>
  </AuthProvider>
)

export default App
