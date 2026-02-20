"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
} from "@ionic/react"
import { useAuth, getUserDataFromStorage } from "../contexts/AuthContext"
import { firestore } from "../firebase"
import { collection, query, where, getDocs, doc, updateDoc, orderBy, Timestamp } from "firebase/firestore"
import { sendNotification } from "../services/notifications"
import { awardPoints } from "../services/rewards"
import { motion, AnimatePresence } from "framer-motion"

// SVG Icon Components
const IconStore: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 448V240M64 240v208M382.47 48H129.53a32 32 0 00-27.43 15.58L48 160h416l-54.1-96.42A32 32 0 00382.47 48z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M464 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32H144v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTime: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="256" cy="256" r="208" strokeMiterlimit="10"/>
    <path d="M256 128v144h96" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCheckmark: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>
  </svg>
)

const IconCheckmarkDone: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M464 128L240 384l-96-96M144 384l-96-96M368 128L232 284" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconScale: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="48" y="48" width="416" height="416" rx="96" strokeLinejoin="round"/>
    <path d="M388 128l-212 212M388 128h-80M388 128v80M128 388l212-212M128 388h80M128 388v-80" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTrophy: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M464 80H400V64a32 32 0 00-32-32H144a32 32 0 00-32 32v16H48a16 16 0 00-16 16v64c0 52.93 43.06 96 96 96h16c5.7 47.74 37.94 87.57 82 100.42V428h-64a8 8 0 00-8 8v32a8 8 0 008 8h240a8 8 0 008-8v-32a8 8 0 00-8-8h-64v-71.58c44.06-12.85 76.3-52.68 82-100.42h16c52.94 0 96-43.07 96-96V96a16 16 0 00-16-16z"/>
  </svg>
)

const IconLocation: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1164-64 64.07 64.07 0 01-64 64z"/>
  </svg>
)

const IconSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="221" cy="221" r="144" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M338.29 338.29L448 448" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRefresh: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M320 146s24.36-12-64-12a160 160 0 10160 160" strokeLinecap="round" strokeMiterlimit="10"/>
    <path d="M256 58l80 80-80 80" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconClose: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M368 368L144 144M368 144L144 368" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRecycle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 48l-112 160h224L256 48zM48 304l112 160V304H48zM464 304H352v160l112-160z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconPerson: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M332.64 64.58C313.18 43.57 286 32 256 32c-30.16 0-57.43 11.5-76.8 32.38-19.58 21.11-29.12 49.8-26.88 80.78C156.76 206.28 203.27 256 256 256s99.16-49.71 103.67-110.82c2.27-30.7-7.33-59.33-27.03-80.6zM432 480H80a31 31 0 01-24.2-11.13c-6.5-7.77-9.12-18.38-7.18-29.11C57.06 392.94 83.4 353.61 124.8 326c36.78-24.51 83.37-38 131.2-38s94.42 13.5 131.2 38c41.4 27.6 67.74 66.93 76.18 113.75 1.94 10.73-.68 21.34-7.18 29.11A31 31 0 01432 480z"/>
  </svg>
)

const IconCalendar: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="48" y="80" width="416" height="384" rx="48" strokeLinejoin="round"/>
    <path d="M128 48v32M384 48v32M464 160H48" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconChevronForward: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="48">
    <path d="M184 112l144 144-144 144" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface MaterialRequest {
  id: string
  userId: string
  userName: string
  type: string
  description: string
  address: string
  status: "pending" | "accepted" | "completed"
  createdAt: Date
  targetJunkshopId?: string
  targetJunkshopName?: string
  location?: {
    lat: number
    lng: number
  }
}

const JunkshopDashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const storedUserData = getUserDataFromStorage()
  const userInfo = currentUser || storedUserData

  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchText, setSearchText] = useState("")
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    completed: 0,
    totalWeight: 0,
    totalPoints: 0,
  })
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchMaterialRequests()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [materialRequests, activeTab, searchText])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const fetchMaterialRequests = useCallback(async () => {
    if (!userInfo) return

    try {
      setLoading(true)
      const requestsRef = collection(firestore, "materialRequests")

      const pendingQuery = query(requestsRef, where("status", "==", "pending"), orderBy("createdAt", "desc"))
      const acceptedQuery = query(
        requestsRef,
        where("status", "==", "accepted"),
        where("acceptedBy", "==", userInfo.uid),
        orderBy("createdAt", "desc"),
      )
      const completedQuery = query(
        requestsRef,
        where("status", "==", "completed"),
        where("acceptedBy", "==", userInfo.uid),
        orderBy("createdAt", "desc"),
      )

      const [pendingSnapshot, acceptedSnapshot, completedSnapshot] = await Promise.all([
        getDocs(pendingQuery),
        getDocs(acceptedQuery),
        getDocs(completedQuery),
      ])

      const requests: MaterialRequest[] = []

      pendingSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.targetJunkshopId && data.targetJunkshopId !== userInfo.uid) return
        
        requests.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          type: data.type,
          description: data.description,
          address: data.address,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          targetJunkshopId: data.targetJunkshopId,
          targetJunkshopName: data.targetJunkshopName,
          location: data.location ? { lat: data.location.latitude, lng: data.location.longitude } : undefined,
        })
      })

      acceptedSnapshot.forEach((doc) => {
        const data = doc.data()
        requests.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          type: data.type,
          description: data.description,
          address: data.address,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          targetJunkshopId: data.targetJunkshopId,
          targetJunkshopName: data.targetJunkshopName,
          location: data.location ? { lat: data.location.latitude, lng: data.location.longitude } : undefined,
        })
      })

      completedSnapshot.forEach((doc) => {
        const data = doc.data()
        requests.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          type: data.type,
          description: data.description,
          address: data.address,
          status: data.status,
          createdAt: data.createdAt.toDate(),
          targetJunkshopId: data.targetJunkshopId,
          targetJunkshopName: data.targetJunkshopName,
          location: data.location ? { lat: data.location.latitude, lng: data.location.longitude } : undefined,
        })
      })

      setMaterialRequests(requests)
      calculateStats(requests)
    } catch (error) {
      console.error("Error fetching material requests", error)
      showToastMessage("Error loading requests", "error")
    } finally {
      setLoading(false)
    }
  }, [userInfo])

  const calculateStats = (requests: MaterialRequest[]) => {
    const newStats = { pending: 0, accepted: 0, completed: 0, totalWeight: 0, totalPoints: 0 }

    requests.forEach((request) => {
      if (request.status === "pending") newStats.pending++
      if (request.status === "accepted") newStats.accepted++
      if (request.status === "completed") newStats.completed++

      const weightEstimate = getWeightEstimate(request.type)
      newStats.totalWeight += weightEstimate
      newStats.totalPoints += weightEstimate * 10
    })

    setStats(newStats)
  }

  const getWeightEstimate = (type: string): number => {
    switch (type.toLowerCase()) {
      case "paper": return 0.5
      case "plastic": return 0.3
      case "metal": return 1.0
      case "glass": return 0.8
      case "electronics": return 2.0
      default: return 0.5
    }
  }

  const applyFilters = () => {
    let filtered = [...materialRequests]

    if (activeTab !== "all") {
      filtered = filtered.filter((request) => request.status === activeTab)
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(
        (request) =>
          request.type.toLowerCase().includes(searchLower) ||
          request.description.toLowerCase().includes(searchLower) ||
          request.userName.toLowerCase().includes(searchLower) ||
          request.address.toLowerCase().includes(searchLower),
      )
    }

    setFilteredRequests(filtered)
  }

  const handleRefresh = async (event: CustomEvent) => {
    await fetchMaterialRequests()
    event.detail.complete()
  }

  const handleAcceptRequest = async (requestId: string) => {
    if (!userInfo) return

    try {
      setActionLoading(true)

      const requestRef = doc(firestore, "materialRequests", requestId)
      await updateDoc(requestRef, {
        status: "accepted",
        acceptedBy: userInfo.uid,
        acceptedByName: userInfo.name,
        acceptedAt: Timestamp.now(),
      })

      const foundRequest = materialRequests.find((r) => r.id === requestId)
      if (foundRequest) {
        await sendNotification({
          userId: foundRequest.userId,
          title: "Material Request Accepted",
          message: `Your ${foundRequest.type} request has been accepted by ${userInfo.name}. They will collect it soon.`,
          type: "status",
          relatedId: requestId,
        })
      }

      showToastMessage("Request accepted successfully!")
      setShowDetailModal(false)
      fetchMaterialRequests()
    } catch (error) {
      console.error("Error accepting request", error)
      showToastMessage("Error accepting request", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteRequest = async (requestId: string) => {
    if (!userInfo) return

    try {
      setActionLoading(true)

      const requestRef = doc(firestore, "materialRequests", requestId)
      await updateDoc(requestRef, {
        status: "completed",
        completedAt: Timestamp.now(),
      })

      const foundRequest = materialRequests.find((r) => r.id === requestId)
      if (foundRequest) {
        const pointsAwarded = getPointsForMaterial(foundRequest.type)
        await awardPoints(foundRequest.userId, pointsAwarded, `Recycling ${foundRequest.type}`)
        await awardPoints(userInfo.uid, Math.floor(pointsAwarded / 2), `Collecting ${foundRequest.type}`)

        await sendNotification({
          userId: foundRequest.userId,
          title: "Material Request Completed",
          message: `Your ${foundRequest.type} has been collected. You've earned ${pointsAwarded} points!`,
          type: "status",
          relatedId: requestId,
        })
      }

      showToastMessage("Request completed successfully!")
      setShowDetailModal(false)
      fetchMaterialRequests()
    } catch (error) {
      console.error("Error completing request", error)
      showToastMessage("Error completing request", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const getPointsForMaterial = (materialType: string): number => {
    switch (materialType.toLowerCase()) {
      case "paper": return 20
      case "plastic": return 30
      case "metal": return 50
      case "glass": return 25
      case "electronics": return 100
      default: return 15
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700"
      case "pending": return "bg-amber-100 text-amber-700"
      case "accepted": return "bg-blue-100 text-blue-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getMaterialIcon = (type: string) => {
    return <IconRecycle className="w-5 h-5" />
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const tabs = [
    { value: "all", label: "All", count: materialRequests.length },
    { value: "pending", label: "Pending", count: stats.pending },
    { value: "accepted", label: "Accepted", count: stats.accepted },
    { value: "completed", label: "Completed", count: stats.completed },
  ]

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Header */}
        <div className="relative px-4 pt-12 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -right-10 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute bottom-0 -left-10 w-32 h-32 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <IconStore className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{userInfo?.businessName || userInfo?.name || "Junkshop"}</h1>
                  <p className="text-white/80 text-sm">Welcome, {userInfo?.name || "Owner"}!</p>
                </div>
              </div>
              <button
                onClick={() => fetchMaterialRequests()}
                className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white"
              >
                <IconRefresh className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <IconTime className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-white/80">Pending Requests</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <IconCheckmark className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stats.accepted}</p>
              <p className="text-xs text-white/80">Accepted</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <IconCheckmarkDone className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-white/80">Completed</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <IconTrophy className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stats.totalPoints}</p>
              <p className="text-xs text-white/80">Points Earned</p>
            </div>
          </motion.div>

          {/* Weight Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                  <IconScale className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Estimated Weight</p>
                  <p className="text-xl font-bold text-gray-800">{stats.totalWeight.toFixed(1)} kg</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">collected</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search & Filter */}
        <div className="px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative mb-4">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search materials, users, locations..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/50 shadow-sm"
              />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm p-1.5 flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.value
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.value ? "bg-white/30" : "bg-gray-200"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Requests List */}
        <div className="px-4 mt-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Material Requests</h3>
              <span className="text-sm text-gray-500">{filteredRequests.length} requests</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                    <IonSkeletonText animated style={{ width: "60%", height: "20px" }} />
                    <IonSkeletonText animated style={{ width: "80%", height: "14px", marginTop: "8px" }} />
                    <IonSkeletonText animated style={{ width: "40%", height: "14px", marginTop: "4px" }} />
                  </div>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconRecycle className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-700 mb-1">No requests found</h4>
                <p className="text-sm text-gray-500">
                  {activeTab === "all" 
                    ? "When residents submit material requests, they will appear here." 
                    : `No ${activeTab} requests at the moment.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }}
                      className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0">
                          {getMaterialIcon(request.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800 capitalize truncate">{request.type}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{request.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <IconPerson className="w-3.5 h-3.5" />
                              <span>{request.userName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <IconCalendar className="w-3.5 h-3.5" />
                              <span>{formatDate(request.createdAt)}</span>
                            </div>
                          </div>
                          {request.targetJunkshopName && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                Requested from you
                              </span>
                            </div>
                          )}
                        </div>
                        <IconChevronForward className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>

        {/* Request Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Close button */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <IconClose className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center text-orange-600">
                    <IconRecycle className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-800 capitalize">{selectedRequest.type}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                    <p className="text-gray-600">{selectedRequest.description}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <IconPerson className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Requested by</p>
                      <p className="font-medium text-gray-700">{selectedRequest.userName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <IconLocation className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Pickup Address</p>
                      <p className="font-medium text-gray-700">{selectedRequest.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                      <IconCalendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="font-medium text-gray-700">{selectedRequest.createdAt.toLocaleDateString()} at {selectedRequest.createdAt.toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-orange-100">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <IconTrophy className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Points you'll earn</p>
                      <p className="font-bold text-orange-600">+{Math.floor(getPointsForMaterial(selectedRequest.type) / 2)} points</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Section */}
                <div className="space-y-3">
                  {/* View Location Button - always shown if location exists */}
                  {selectedRequest.location && (
                    <button
                      onClick={() => {
                        const { lat, lng } = selectedRequest.location!
                        window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")
                      }}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <IconLocation className="w-5 h-5" />
                      View on Map
                    </button>
                  )}

                  {/* Status-based action button */}
                  {selectedRequest.status === "pending" && (
                    <button
                      onClick={() => handleAcceptRequest(selectedRequest.id)}
                      disabled={actionLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all"
                    >
                      {actionLoading ? "Processing..." : "Accept Request"}
                    </button>
                  )}

                  {selectedRequest.status === "accepted" && (
                    <button
                      onClick={() => handleCompleteRequest(selectedRequest.id)}
                      disabled={actionLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all"
                    >
                      {actionLoading ? "Processing..." : "Mark as Completed"}
                    </button>
                  )}

                  {selectedRequest.status === "completed" && (
                    <div className="text-center py-4 bg-green-50 rounded-xl">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <IconCheckmarkDone className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="font-semibold text-green-600">Request Completed</p>
                      <p className="text-xs text-gray-500 mt-1">This request has been successfully completed</p>
                    </div>
                  )}

                  {/* Cancel/Close button */}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    {selectedRequest.status === "completed" ? "Close" : "Cancel"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-24 left-4 right-4 p-4 rounded-2xl shadow-xl z-50 ${
                toastType === "success" ? "bg-green-600" : "bg-red-600"
              } text-white`}
            >
              <div className="flex items-center gap-3">
                {toastType === "success" ? (
                  <IconCheckmark className="w-5 h-5" />
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
        </AnimatePresence>

        {/* Loading Overlay */}
        {actionLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-700 font-medium">Processing...</p>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}

export default JunkshopDashboard
