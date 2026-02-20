"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react"
import { useAuth, getUserDataFromStorage } from "../contexts/AuthContext"
import { firestore } from "../firebase"
import { collection, query, where, getDocs, doc, deleteDoc, orderBy, addDoc, updateDoc, GeoPoint } from "firebase/firestore"
import IframeMap from "../components/IframeMap"
import { sendNotification } from "../services/notifications"
import { motion, AnimatePresence } from "framer-motion"
import { Capacitor } from "@capacitor/core"
import { Geolocation } from "@capacitor/geolocation"

// Google Maps API Key for reverse geocoding
const GOOGLE_MAPS_API_KEY = "AIzaSyClNSGCnDzZvDvLdcGuS-28fSSAatlBCFI"

// SVG Icon Components
const IconRecycle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 48l-112 160h224L256 48zM48 304l112 160V304H48zM464 304H352v160l112-160z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconAdd: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 112v288M400 256H112" strokeLinecap="round" strokeLinejoin="round"/>
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

const IconLocation: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1164-64 64.07 64.07 0 01-64 64z"/>
  </svg>
)

const IconTime: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="256" cy="256" r="208" strokeMiterlimit="10"/>
    <path d="M256 128v144h96" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>
  </svg>
)

const IconPending: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm0 368a160 160 0 11160-160 160.18 160.18 0 01-160 160z"/>
    <path d="M256 128a128 128 0 00-128 128h128V128z"/>
  </svg>
)

const IconAccepted: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm-36 288l-100-100 28.28-28.28L220 279.44l139.72-139.72L388 168z"/>
  </svg>
)

const IconStore: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 448V240M64 240v208M382.47 48H129.53a32 32 0 00-27.43 15.58L48 160h416l-54.1-96.42A32 32 0 00382.47 48z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M464 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32H144v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconEdit: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/>
  </svg>
)

const IconSend: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0027.14 52 24.65 24.65 0 0016 72.59v113.29a24 24 0 0019.52 23.57l232.93 43.07a4 4 0 010 7.86L35.53 303.45A24 24 0 0016 327v113.31A23.57 23.57 0 0026.59 460a23.94 23.94 0 0013.22 4 24.55 24.55 0 009.52-1.93L476.4 285.94l.19-.09a32 32 0 000-58.8z"/>
  </svg>
)

const IconEmpty: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="64" y="64" width="384" height="384" rx="48" strokeLinejoin="round"/>
    <path d="M139.82 171.61l232.36 168.78M372.18 171.61L139.82 340.39" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconEye: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="256" cy="256" r="64" strokeMiterlimit="10"/>
    <path d="M256 128C144.24 128 57.65 197.53 32 256c25.65 58.47 112.24 128 224 128s198.35-69.53 224-128c-25.65-58.47-112.24-128-224-128z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface MaterialRequest {
  id: string
  userId: string
  userName: string
  type: string
  description: string
  quantity?: string
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

interface MaterialPrice {
  id: string
  name: string
  price: number
  unit: string
}

const materialTypes = [
  { value: "paper", label: "Paper", icon: "📄" },
  { value: "plastic", label: "Plastic", icon: "🥤" },
  { value: "metal", label: "Metal", icon: "🔩" },
  { value: "glass", label: "Glass", icon: "🫙" },
  { value: "electronics", label: "Electronics", icon: "📱" },
  { value: "other", label: "Other", icon: "♻️" },
]

// Reverse geocoding function
const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    // Try Google Maps Geocoding API first
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    )
    const data = await response.json()
    
    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].formatted_address
    }
    
    // Fallback to OpenStreetMap Nominatim (free, no API key needed)
    const osmResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const osmData = await osmResponse.json()
    
    if (osmData && osmData.display_name) {
      return osmData.display_name
    }
    
    return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    // Return a more user-friendly message with coordinates
    return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

const UserMaterialRequests: React.FC = () => {
  const { currentUser } = useAuth()
  const storedUserData = getUserDataFromStorage()
  const userInfo = currentUser || storedUserData

  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [materialType, setMaterialType] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [addressText, setAddressText] = useState("")
  const [gettingInitialLocation, setGettingInitialLocation] = useState(false)

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const fetchMaterialPrices = useCallback(async () => {
    try {
      const pricesRef = collection(firestore, "materialPrices")
      const q = query(pricesRef, orderBy("name"))
      const querySnapshot = await getDocs(q)

      const prices: MaterialPrice[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        prices.push({
          id: doc.id,
          name: data.name,
          price: data.price,
          unit: data.unit,
        })
      })

      setMaterialPrices(prices)
    } catch (error) {
      console.error("Error fetching material prices:", error)
    }
  }, [])

  useEffect(() => {
    if (userInfo?.uid) {
      fetchMaterialRequests()
      fetchMaterialPrices()
    }
  }, [userInfo?.uid, fetchMaterialPrices])

  const fetchMaterialRequests = useCallback(async () => {
    if (!userInfo?.uid) return

    try {
      setLoading(true)
      const requestsRef = collection(firestore, "materialRequests")
      const q = query(requestsRef, where("userId", "==", userInfo.uid), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const requests: MaterialRequest[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        requests.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          type: data.type,
          description: data.description,
          quantity: data.quantity,
          address: data.address,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          targetJunkshopId: data.targetJunkshopId,
          targetJunkshopName: data.targetJunkshopName,
          location: data.location
            ? {
                lat: data.location.latitude,
                lng: data.location.longitude,
              }
            : undefined,
        })
      })

      setMaterialRequests(requests)
    } catch (error) {
      console.error("Error fetching material requests", error)
      showToastMessage("Error loading your requests", "error")
    } finally {
      setLoading(false)
    }
  }, [userInfo?.uid])

  const handleRefresh = useCallback(
    async (event: CustomEvent) => {
      await fetchMaterialRequests()
      event.detail.complete()
    },
    [fetchMaterialRequests]
  )

  // Auto-get user location when opening create modal
  const openCreateModal = async () => {
    setShowCreateModal(true)
    setGettingInitialLocation(true)
    
    try {
      let location: { lat: number; lng: number } | null = null
      
      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        })
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
      } else if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          })
        })
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
      }
      
      if (location) {
        setSelectedLocation(location)
        const address = await getAddressFromCoordinates(location.lat, location.lng)
        setAddressText(address)
      }
    } catch (error) {
      console.error("Error getting initial location:", error)
      // Don't show error, just let user select manually
    } finally {
      setGettingInitialLocation(false)
    }
  }

  const confirmDeleteRequest = (requestId: string) => {
    setRequestToDelete(requestId)
    setShowDeleteModal(true)
  }

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return

    try {
      setLoading(true)
      const requestRef = doc(firestore, "materialRequests", requestToDelete)
      await deleteDoc(requestRef)
      showToastMessage("Request deleted successfully", "success")
      fetchMaterialRequests()
    } catch (error) {
      console.error("Error deleting request", error)
      showToastMessage("Error deleting request", "error")
    } finally {
      setLoading(false)
      setRequestToDelete(null)
      setShowDeleteModal(false)
    }
  }

  const handleLocationSelect = async (location: { lat: number; lng: number }) => {
    setSelectedLocation(location)
    const address = await getAddressFromCoordinates(location.lat, location.lng)
    setAddressText(address)
  }

  const handleSubmitRequest = async () => {
    if (!materialType || !description || !selectedLocation || !userInfo) {
      showToastMessage("Please fill in all required fields", "error")
      return
    }

    try {
      setLoading(true)
      
      // Get address from coordinates if not already set
      let address = addressText
      if (!address || address === `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`) {
        address = await getAddressFromCoordinates(selectedLocation.lat, selectedLocation.lng)
      }

      const newRequest = {
        userId: userInfo.uid,
        userName: userInfo.name,
        type: materialType,
        description,
        quantity,
        location: new GeoPoint(selectedLocation.lat, selectedLocation.lng),
        address,
        status: "pending",
        createdAt: new Date(),
      }

      const docRef = await addDoc(collection(firestore, "materialRequests"), newRequest)

      await sendNotification({
        userId: userInfo.uid,
        title: "Material Request Submitted",
        message: `Your ${materialType} request has been submitted successfully.`,
        type: "request",
        relatedId: docRef.id,
      })

      setShowCreateModal(false)
      resetForm()
      showToastMessage("Request submitted successfully!", "success")
      fetchMaterialRequests()
    } catch (error) {
      console.error("Error submitting material request", error)
      showToastMessage("Error submitting request", "error")
    } finally {
      setLoading(false)
    }
  }

  // Edit request
  const openEditModal = (request: MaterialRequest) => {
    setSelectedRequest(request)
    setMaterialType(request.type)
    setDescription(request.description)
    setQuantity(request.quantity || "")
    setSelectedLocation(request.location || null)
    setAddressText(request.address)
    setShowEditModal(true)
  }

  const handleUpdateRequest = async () => {
    if (!selectedRequest || !materialType || !description || !selectedLocation) {
      showToastMessage("Please fill in all required fields", "error")
      return
    }

    try {
      setLoading(true)
      
      let address = addressText
      if (!address) {
        address = await getAddressFromCoordinates(selectedLocation.lat, selectedLocation.lng)
      }

      const requestRef = doc(firestore, "materialRequests", selectedRequest.id)
      await updateDoc(requestRef, {
        type: materialType,
        description,
        quantity,
        location: new GeoPoint(selectedLocation.lat, selectedLocation.lng),
        address,
      })

      setShowEditModal(false)
      resetForm()
      showToastMessage("Request updated successfully!", "success")
      fetchMaterialRequests()
    } catch (error) {
      console.error("Error updating material request", error)
      showToastMessage("Error updating request", "error")
    } finally {
      setLoading(false)
    }
  }

  // View request details
  const openViewModal = (request: MaterialRequest) => {
    setSelectedRequest(request)
    setShowViewModal(true)
  }

  const resetForm = () => {
    setMaterialType("")
    setDescription("")
    setQuantity("")
    setSelectedLocation(null)
    setAddressText("")
    setSelectedRequest(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "accepted":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <IconPending className="w-4 h-4" />
      case "accepted":
        return <IconAccepted className="w-4 h-4" />
      case "completed":
        return <IconCheck className="w-4 h-4" />
      default:
        return null
    }
  }

  const getMaterialIcon = (type: string) => {
    const material = materialTypes.find((m) => m.value === type.toLowerCase())
    return material?.icon || "♻️"
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return minutes <= 1 ? "Just now" : `${minutes}m ago`
      }
      return `${hours}h ago`
    }
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const filteredRequests =
    statusFilter === "all" ? materialRequests : materialRequests.filter((r) => r.status === statusFilter)

  const filterTabs = [
    { value: "all", label: "All", count: materialRequests.length },
    { value: "pending", label: "Pending", count: materialRequests.filter((r) => r.status === "pending").length },
    { value: "accepted", label: "Accepted", count: materialRequests.filter((r) => r.status === "accepted").length },
    { value: "completed", label: "Completed", count: materialRequests.filter((r) => r.status === "completed").length },
  ]

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 pt-12 pb-24 px-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">My Recyclables</h1>
                  <p className="text-white/80 text-sm">Track your material requests</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30"
                >
                  <IconAdd className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center"
                >
                  <p className="text-2xl font-bold text-white">{materialRequests.filter((r) => r.status === "pending").length}</p>
                  <p className="text-white/80 text-xs">Pending</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center"
                >
                  <p className="text-2xl font-bold text-white">{materialRequests.filter((r) => r.status === "accepted").length}</p>
                  <p className="text-white/80 text-xs">Accepted</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center"
                >
                  <p className="text-2xl font-bold text-white">{materialRequests.filter((r) => r.status === "completed").length}</p>
                  <p className="text-white/80 text-xs">Completed</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-4 -mt-16 pb-24 relative z-20">
            {/* Filter Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-2 mb-4"
            >
              <div className="flex gap-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${
                      statusFilter === tab.value
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                          statusFilter === tab.value ? "bg-white/20" : "bg-gray-200"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Request List */}
            {loading && filteredRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconEmpty className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2">No Requests Found</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {statusFilter === "all"
                      ? "You haven't created any material requests yet."
                      : `No ${statusFilter} requests found.`}
                  </p>
                  <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold shadow-lg"
                  >
                    Create New Request
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          {getMaterialIcon(request.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-800 capitalize">{request.type}</h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                          {request.quantity && (
                            <p className="text-xs text-gray-500 mt-1">Qty: {request.quantity}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <IconTime className="w-3.5 h-3.5" />
                            <span>{formatDate(request.createdAt)}</span>
                          </div>
                          {request.targetJunkshopName && (
                            <div className="flex items-center gap-1">
                              <IconStore className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[100px]">{request.targetJunkshopName}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openViewModal(request)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <IconEye className="w-4 h-4" />
                          </button>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() => openEditModal(request)}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Edit Request"
                              >
                                <IconEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => confirmDeleteRequest(request.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Request"
                              >
                                <IconTrash className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Floating Action Button */}
          <button
            onClick={openCreateModal}
            className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-lg flex items-center justify-center z-30"
          >
            <IconAdd className="w-7 h-7" />
          </button>
        </div>

        {/* Create Request Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => { setShowCreateModal(false); resetForm(); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <IconRecycle className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">New Request</h2>
                  </div>
                  <button
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                  >
                    <IconClose className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Material Type */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Material Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {materialTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setMaterialType(type.value)}
                          className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            materialType === type.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-lg">{type.icon}</span>
                          <span className="text-xs font-medium text-gray-700">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Quantity (approx.)</label>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g., 2 bags, 5 kg, etc."
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the materials..."
                      rows={2}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    />
                  </div>

                  {/* Location */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      <IconLocation className="w-4 h-4 inline mr-1" />
                      Pickup Location *
                    </label>
                    {gettingInitialLocation ? (
                      <div className="h-48 rounded-xl border border-gray-200 flex flex-col items-center justify-center bg-gray-50">
                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-sm text-gray-500">Getting your location...</p>
                      </div>
                    ) : (
                      <IframeMap 
                        onLocationSelect={handleLocationSelect} 
                        selectedLocation={selectedLocation}
                        autoGetLocation={false}
                        compact={true}
                      />
                    )}
                    {addressText && (
                      <p className="text-xs text-emerald-600 mt-2 p-2 bg-emerald-50 rounded-lg">
                        📍 {addressText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Button */}
                <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
                  <button
                    onClick={handleSubmitRequest}
                    disabled={loading || !materialType || !description || !selectedLocation}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <IconSend className="w-5 h-5" />
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Request Modal */}
        <AnimatePresence>
          {showEditModal && selectedRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => { setShowEditModal(false); resetForm(); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <IconEdit className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Edit Request</h2>
                  </div>
                  <button
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                  >
                    <IconClose className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Material Type */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Material Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {materialTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setMaterialType(type.value)}
                          className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            materialType === type.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-lg">{type.icon}</span>
                          <span className="text-xs font-medium text-gray-700">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Quantity (approx.)</label>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g., 2 bags, 5 kg, etc."
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the materials..."
                      rows={2}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                    />
                  </div>

                  {/* Location */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      <IconLocation className="w-4 h-4 inline mr-1" />
                      Pickup Location *
                    </label>
                    <IframeMap 
                      onLocationSelect={handleLocationSelect} 
                      selectedLocation={selectedLocation}
                      compact={true}
                    />
                    {addressText && (
                      <p className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded-lg">
                        📍 {addressText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Button */}
                <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
                  <button
                    onClick={handleUpdateRequest}
                    disabled={loading || !materialType || !description || !selectedLocation}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <IconCheck className="w-5 h-5" />
                    {loading ? "Updating..." : "Update Request"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Request Details Modal */}
        <AnimatePresence>
          {showViewModal && selectedRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => { setShowViewModal(false); setSelectedRequest(null); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className={`flex-shrink-0 px-4 py-4 flex items-center justify-between ${
                  selectedRequest.status === 'pending' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : selectedRequest.status === 'accepted'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : 'bg-gradient-to-r from-emerald-500 to-green-500'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                      {getMaterialIcon(selectedRequest.type)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white capitalize">{selectedRequest.type}</h2>
                      <span className="text-white/80 text-xs capitalize">{selectedRequest.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowViewModal(false); setSelectedRequest(null); }}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                  >
                    <IconClose className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Status */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </div>

                  {/* Quantity */}
                  {selectedRequest.quantity && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                      <p className="text-gray-800 font-medium">{selectedRequest.quantity}</p>
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <p className="text-gray-800">{selectedRequest.description}</p>
                  </div>

                  {/* Pickup Address */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Pickup Address</label>
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                      <IconLocation className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-800 text-sm">{selectedRequest.address}</p>
                    </div>
                  </div>

                  {/* Map */}
                  {selectedRequest.location && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Location on Map</label>
                      <div className="h-40 rounded-xl overflow-hidden border border-gray-200">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${selectedRequest.location.lat},${selectedRequest.location.lng}&zoom=15`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}

                  {/* Target Junkshop */}
                  {selectedRequest.targetJunkshopName && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Junkshop</label>
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
                        <IconStore className="w-5 h-5 text-orange-500" />
                        <p className="text-gray-800 font-medium">{selectedRequest.targetJunkshopName}</p>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Submitted</label>
                    <div className="flex items-center gap-2">
                      <IconTime className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-600 text-sm">
                        {selectedRequest.createdAt.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
                  {selectedRequest.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowViewModal(false); openEditModal(selectedRequest); }}
                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <IconEdit className="w-5 h-5" />
                        Edit
                      </button>
                      <button
                        onClick={() => { setShowViewModal(false); confirmDeleteRequest(selectedRequest.id); }}
                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <IconTrash className="w-5 h-5" />
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setShowViewModal(false); setSelectedRequest(null); }}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconTrash className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Request?</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Are you sure you want to delete this request? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteRequest}
                      disabled={loading}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {loading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
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
              className={`fixed bottom-24 left-4 right-4 mx-auto max-w-sm px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 ${
                toastType === "success" ? "bg-emerald-500" : "bg-red-500"
              } text-white`}
            >
              {toastType === "success" ? (
                <IconCheck className="w-5 h-5 flex-shrink-0" />
              ) : (
                <IconClose className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (showCreateModal || showEditModal) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
            >
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-700 font-medium">{showEditModal ? "Updating..." : "Submitting..."}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  )
}

export default UserMaterialRequests
