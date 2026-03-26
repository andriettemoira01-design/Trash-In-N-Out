"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
} from "@ionic/react"
import { Geolocation } from "@capacitor/geolocation"
import { useAuth, getUserDataFromStorage } from "../contexts/AuthContext"
import { collection, addDoc, GeoPoint, query, getDocs, where, orderBy } from "firebase/firestore"
import { firestore } from "../firebase"
import { sendNotification } from "../services/notifications"
import { motion, AnimatePresence } from "framer-motion"
import "./Map.css"

const GOOGLE_MAPS_API_KEY = "AIzaSyClNSGCnDzZvDvLdcGuS-28fSSAatlBCFI"

// Load Google Maps JS API
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve()
      return
    }
    const existing = document.getElementById('google-maps-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

// SVG Icon Components
const IconMap: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M48.17 113.34A32 32 0 0032 141.24V438a32 32 0 0047 28.37c.43-.23.85-.47 1.26-.74l84.14-55.05a8 8 0 013.63-.93h.06a8 8 0 013.83 1.04l113.7 69.42a32.23 32.23 0 0031.38.58l136.75-67.39a32 32 0 0018.25-29V74.52a32 32 0 00-46.95-28.29l-115.1 62.93a8 8 0 01-7.65.07l-109.44-58.14a32 32 0 00-26-1.2l-122.69 47a32.05 32.05 0 00-5.93 3.45z"/>
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

const IconRefresh: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M320 146s24.36-12-64-12a160 160 0 10160 160" strokeLinecap="round" strokeMiterlimit="10"/>
    <path d="M256 58l80 80-80 80" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconAdd: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 112v288M400 256H112" strokeLinecap="round" strokeLinejoin="round"/>
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

const IconStore: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 448V240M64 240v208M382.47 48H129.53a32 32 0 00-27.43 15.58L48 160h416l-54.1-96.42A32 32 0 00382.47 48z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M464 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32H144v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCheckmark: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>
  </svg>
)

const IconSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="221" cy="221" r="144" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M338.29 338.29L448 448" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="48">
    <path d="M112 184l144 144 144-144" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconNavigate: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M480 32L32 240l185.5 44.5L262 480z"/>
  </svg>
)

const IconPricetag: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M467 45.2A44.45 44.45 0 00435.29 32H312.36a30.63 30.63 0 00-21.52 8.89L45.09 286.59a44.82 44.82 0 000 63.32l117 117a44.83 44.83 0 0063.34 0l245.65-245.6A30.6 30.6 0 00480 199.8v-123a44.24 44.24 0 00-13-31.6zM384 160a32 32 0 1132-32 32 32 0 01-32 32z"/>
  </svg>
)

interface MaterialRequest {
  id: string
  userId: string
  userName: string
  type: string
  description: string
  quantity?: string
  location: {
    lat: number
    lng: number
  }
  address: string
  status: "pending" | "accepted" | "completed"
  createdAt: Date
  targetJunkshopId?: string
  targetJunkshopName?: string
  fulfillmentMethod?: string
}

interface Junkshop {
  id: string
  name: string
  email: string
}

interface MaterialPrice {
  id: string
  name: string
  price: number
  unit: string
  junkshopId: string
}

const Map: React.FC = () => {
  const { currentUser } = useAuth()
  const storedUserData = getUserDataFromStorage()
  const userInfo = currentUser || storedUserData

  const [showModal, setShowModal] = useState(false)
  const [materialType, setMaterialType] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("")
  const [selectedJunkshop, setSelectedJunkshop] = useState("")
  const [junkshops, setJunkshops] = useState<Junkshop[]>([])
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapElement, setMapElement] = useState<HTMLElement | null>(null)
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null)
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([])
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([])
  const [mapInitialized, setMapInitialized] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [pickupAddress, setPickupAddress] = useState<string>("")
  const [addressLoading, setAddressLoading] = useState(false)

  // Ref to track if component is mounted
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const isResident = userInfo?.role === "resident"

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      // Try Google Maps Geocoding API first
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyClNSGCnDzZvDvLdcGuS-28fSSAatlBCFI`
      )
      const googleData = await googleResponse.json()
      
      if (googleData.status === 'OK' && googleData.results && googleData.results.length > 0) {
        return googleData.results[0].formatted_address
      }
      
      // Fallback to OpenStreetMap Nominatim (free, no API key needed)
      const osmResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      )
      const osmData = await osmResponse.json()
      
      if (osmData && osmData.display_name) {
        return osmData.display_name
      }
      
      return `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      console.error('Error getting address from coordinates:', error)
      return `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  useEffect(() => {
    getCurrentLocation()
    fetchMaterialRequests()
    if (isResident) {
      fetchJunkshops()
    }
  }, [])

  // Fetch address when currentLocation changes
  useEffect(() => {
    const fetchAddress = async () => {
      if (currentLocation) {
        setAddressLoading(true)
        const address = await getAddressFromCoordinates(currentLocation.lat, currentLocation.lng)
        setPickupAddress(address)
        setAddressLoading(false)
      }
    }
    fetchAddress()
  }, [currentLocation])

  useEffect(() => {
    if (selectedJunkshop && isResident) {
      fetchMaterialPrices()
    } else {
      setMaterialPrices([])
    }
  }, [selectedJunkshop])

  useEffect(() => {
    if (mapElement && currentLocation && viewMode === "map" && !mapInitialized) {
      const initMap = async () => {
        try {
          setMapLoading(true)
          await loadGoogleMapsScript()

          if (!isMountedRef.current || !document.body.contains(mapElement)) return

          const map = new google.maps.Map(mapElement, {
            center: currentLocation,
            zoom: 14,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          })

          // Add blue marker for current location
          const currentMarker = new google.maps.Marker({
            position: currentLocation,
            map: map,
            title: "Your location",
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new google.maps.Size(32, 32),
            },
          })

          setGoogleMap(map)
          setMapMarkers([currentMarker])
          setMapInitialized(true)

          if (!isResident) {
            updateMapMarkers(map)
          }
        } catch (error) {
          console.error("Error creating map", error)
          showToastMessage("Error loading map. Please try again.", "error")
        } finally {
          if (isMountedRef.current) setMapLoading(false)
        }
      }

      const timer = setTimeout(() => {
        initMap()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [mapElement, currentLocation, viewMode, mapInitialized, isResident, materialRequests])

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      mapMarkers.forEach(m => m.setMap(null))
    }
  }, [mapMarkers])

  const getCurrentLocation = async () => {
    try {
      // Check if we're on a native platform or web
      const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform()
      
      if (isNative) {
        // Use Capacitor Geolocation for native platforms
        const permission = await Geolocation.checkPermissions()
        if (permission.location !== 'granted') {
          const requestedPermission = await Geolocation.requestPermissions()
          if (requestedPermission.location !== 'granted') {
            console.warn("Location permission denied, using default location")
            setCurrentLocation({
              lat: 14.4624,
              lng: 120.9642,
            })
            return
          }
        }
        
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        })
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      } else {
        // Use browser's native geolocation for web
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              })
            },
            (error) => {
              console.warn("Browser geolocation error:", error.message)
              // Set default location (Bacoor, Cavite)
              setCurrentLocation({
                lat: 14.4624,
                lng: 120.9642,
              })
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          )
        } else {
          console.warn("Geolocation not supported, using default location")
          setCurrentLocation({
            lat: 14.4624,
            lng: 120.9642,
          })
        }
      }
    } catch (error) {
      console.error("Error getting location", error)
      // Set default location (Bacoor, Cavite)
      setCurrentLocation({
        lat: 14.4624,
        lng: 120.9642,
      })
    }
  }

  const updateMapMarkers = (mapInstance: google.maps.Map | null = googleMap) => {
    if (!mapInstance || !materialRequests.length) return

    try {
      // Remove old request markers (keep the first one = current location)
      mapMarkers.slice(1).forEach(m => m.setMap(null))

      const newMarkers = mapMarkers.length > 0 ? [mapMarkers[0]] : []

      for (const request of materialRequests) {
        if (request.location) {
          const marker = new google.maps.Marker({
            position: { lat: request.location.lat, lng: request.location.lng },
            map: mapInstance,
            title: request.type,
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
              scaledSize: new google.maps.Size(32, 32),
            },
          })

          // Add click listener for junkshop owners
          if (!isResident) {
            marker.addListener('click', () => {
              setSelectedRequest(request)
              setShowDetailModal(true)
            })
          }

          newMarkers.push(marker)
        }
      }

      setMapMarkers(newMarkers)
    } catch (error) {
      console.error("Error updating map markers", error)
    }
  }

  const fetchMaterialRequests = async () => {
    try {
      setLoading(true)
      const requestsRef = collection(firestore, "materialRequests")
      let q

      if (isResident) {
        q = query(requestsRef, where("userId", "==", userInfo?.uid), orderBy("createdAt", "desc"))
      } else {
        q = query(requestsRef, where("status", "==", "pending"), orderBy("createdAt", "desc"))
      }

      const querySnapshot = await getDocs(q)
      const requests: MaterialRequest[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.location) {
          if (!isResident) {
            if (data.targetJunkshopId && data.targetJunkshopId !== userInfo?.uid) {
              return
            }
          }
          
          requests.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            type: data.type,
            description: data.description,
            quantity: data.quantity,
            location: {
              lat: data.location.latitude,
              lng: data.location.longitude,
            },
            address: data.address || "No address provided",
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            targetJunkshopId: data.targetJunkshopId,
            targetJunkshopName: data.targetJunkshopName,
          })
        }
      })

      setMaterialRequests(requests)

      if (googleMap && !isResident) {
        updateMapMarkers()
      }
    } catch (error) {
      console.error("Error fetching material requests", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJunkshops = async () => {
    try {
      const usersRef = collection(firestore, "users")
      const q = query(usersRef, where("role", "==", "junkshop"))
      const querySnapshot = await getDocs(q)
      
      const junkshopList: Junkshop[] = []
      querySnapshot.forEach((doc) => {
        junkshopList.push({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
        })
      })
      
      setJunkshops(junkshopList)
    } catch (error) {
      console.error("Error fetching junkshops:", error)
    }
  }

  const fetchMaterialPrices = async () => {
    if (!selectedJunkshop) return
    
    try {
      const pricesRef = collection(firestore, "materialPrices")
      const q = query(pricesRef, where("junkshopId", "==", selectedJunkshop))
      const querySnapshot = await getDocs(q)
      
      const prices: MaterialPrice[] = []
      querySnapshot.forEach((doc) => {
        prices.push({
          id: doc.id,
          name: doc.data().name,
          price: doc.data().price,
          unit: doc.data().unit,
          junkshopId: doc.data().junkshopId,
        })
      })
      
      setMaterialPrices(prices)
    } catch (error) {
      console.error("Error fetching material prices:", error)
    }
  }

  const handleSubmitRequest = async () => {
    if (!materialType || !description || !currentLocation) {
      showToastMessage("Please fill in all required fields", "error")
      return
    }

    try {
      setLoading(true)

      // Use the fetched pickup address or get it now if not available
      let address = pickupAddress
      if (!address || address === "") {
        address = await getAddressFromCoordinates(currentLocation.lat, currentLocation.lng)
      }

      const selectedJunkshopData = junkshops.find(j => j.id === selectedJunkshop)

      const newRequest = {
        userId: userInfo?.uid,
        userName: userInfo?.name,
        type: materialType,
        description,
        quantity,
        location: new GeoPoint(currentLocation.lat, currentLocation.lng),
        address,
        status: "pending",
        createdAt: new Date(),
        ...(selectedJunkshop && {
          targetJunkshopId: selectedJunkshop,
          targetJunkshopName: selectedJunkshopData?.name
        })
      }

      const docRef = await addDoc(collection(firestore, "materialRequests"), newRequest)

      if (selectedJunkshop) {
        await sendNotification({
          userId: selectedJunkshop,
          title: "New Recyclable Material Request",
          message: `${userInfo?.name} has reported ${materialType} specifically for your junkshop.`,
          type: "request",
          relatedId: docRef.id,
        })
      } else {
        const usersRef = collection(firestore, "users")
        const junkshopQuery = query(usersRef, where("role", "==", "junkshop"))
        const junkshopSnapshot = await getDocs(junkshopQuery)

        junkshopSnapshot.forEach(async (doc) => {
          await sendNotification({
            userId: doc.id,
            title: "New Recyclable Material",
            message: `${userInfo?.name} has reported ${materialType} for collection.`,
            type: "request",
            relatedId: docRef.id,
          })
        })
      }

      await sendNotification({
        userId: userInfo?.uid || "",
        title: "Material Request Submitted",
        message: `Your ${materialType} request has been submitted successfully.`,
        type: "request",
        relatedId: docRef.id,
      })

      setShowModal(false)
      setMaterialType("")
      setDescription("")
      setQuantity("")
      setSelectedJunkshop("")
      setMaterialPrices([])

      showToastMessage("Material request submitted successfully!")

      fetchMaterialRequests()
    } catch (error) {
      console.error("Error submitting material request", error)
      showToastMessage("Error submitting request. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const refreshMap = async () => {
    // Remove old markers
    mapMarkers.forEach(m => m.setMap(null))
    setMapMarkers([])
    
    // Reset map-related states
    setGoogleMap(null)
    setMapInitialized(false)
    setMapLoading(true)

    // Fetch fresh data - map will reinitialize due to mapInitialized being false
    await getCurrentLocation()
    await fetchMaterialRequests()
  }

  const handleRefresh = async (event: CustomEvent) => {
    await fetchMaterialRequests()
    if (viewMode === "map") {
      refreshMap()
    }
    event.detail.complete()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700"
      case "pending": return "bg-amber-100 text-amber-700"
      case "accepted": return "bg-blue-100 text-blue-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getMaterialTypeIcon = (type: string) => {
    const iconClass = "w-6 h-6"
    switch (type.toLowerCase()) {
      case "paper": return "📄"
      case "plastic": return "🥤"
      case "metal": return "🔩"
      case "glass": return "🫙"
      case "electronics": return "📱"
      default: return "♻️"
    }
  }

  const materialTypes = [
    { value: "paper", label: "Paper", icon: "📄" },
    { value: "plastic", label: "Plastic", icon: "🥤" },
    { value: "metal", label: "Metal", icon: "🔩" },
    { value: "glass", label: "Glass", icon: "🫙" },
    { value: "electronics", label: "Electronics", icon: "📱" },
    { value: "other", label: "Other", icon: "♻️" },
  ]

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Header */}
        <div className="relative px-4 pt-12 pb-6 overflow-hidden">
          <div className={`absolute inset-0 ${isResident ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500" : "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500"}`}>
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
                  {isResident ? <IconRecycle className="w-6 h-6 text-white" /> : <IconSearch className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{isResident ? "Report Recyclables" : "Find Recyclables"}</h1>
                  <p className="text-white/80 text-sm">{isResident ? "Submit materials for collection" : "Discover materials nearby"}</p>
                </div>
              </div>
            </motion.div>

            {/* View Toggle & Refresh */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-1 flex">
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === "map" ? "bg-white text-gray-800 shadow-md" : "text-white"
                  }`}
                >
                  <IconMap className="w-4 h-4" />
                  Map
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === "list" ? "bg-white text-gray-800 shadow-md" : "text-white"
                  }`}
                >
                  <IconList className="w-4 h-4" />
                  List
                </button>
              </div>
              {viewMode === "map" && (
                <button
                  onClick={refreshMap}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 text-white"
                >
                  <IconRefresh className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-amber-600">{materialRequests.filter(r => r.status === "pending").length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-blue-600">{materialRequests.filter(r => r.status === "accepted").length}</p>
              <p className="text-xs text-gray-500">Accepted</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">{materialRequests.filter(r => r.status === "completed").length}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </motion.div>
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="px-4 mt-4 mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative bg-white rounded-2xl shadow-sm overflow-hidden map-container"
              style={{ height: "50vh", position: "relative" }}
            >
              <div
                ref={(el) => {
                  if (el) {
                    setMapElement(el)
                  }
                }}
                style={{ width: "100%", height: "100%" }}
              ></div>
              {mapLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                  <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-gray-600 text-sm">Loading map...</p>
                </div>
              )}
              
              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg z-10">
                <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Your Location</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Recyclables</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="px-4 mt-4 mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  {isResident ? "My Requests" : "Available Materials"}
                </h3>
                <span className="text-sm text-gray-500">{materialRequests.length} items</span>
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
              ) : materialRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconRecycle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-700 mb-1">No requests found</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    {isResident ? "Start by reporting recyclable materials" : "No materials available in your area"}
                  </p>
                  {isResident && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium"
                    >
                      Add Request
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {materialRequests.map((request, index) => (
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
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                            {getMaterialTypeIcon(request.type)}
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
                                <IconLocation className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[120px]">{request.address}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <IconTime className="w-3.5 h-3.5" />
                                <span>{formatDate(request.createdAt)}</span>
                              </div>
                            </div>
                            {!isResident && (
                              <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                                <IconPerson className="w-3.5 h-3.5" />
                                <span>{request.userName}</span>
                              </div>
                            )}
                            {request.targetJunkshopName && (
                              <div className="mt-1.5">
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                  For: {request.targetJunkshopName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* FAB for residents */}
        {isResident && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            onClick={() => setShowModal(true)}
            className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg flex items-center justify-center text-white z-40"
          >
            <IconAdd className="w-7 h-7" />
          </motion.button>
        )}

        {/* Add Request Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[70vh] flex flex-col overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <IconRecycle className="w-4 h-4 text-green-600" />
                    </div>
                    <h2 className="text-base font-bold text-gray-800">Report Materials</h2>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <IconClose className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-3">
                  {/* Material Type Selection */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Material Type *</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {materialTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setMaterialType(type.value)}
                          className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-0.5 ${
                            materialType === type.value
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-base">{type.icon}</span>
                          <span className="text-[10px] font-medium text-gray-700">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Junkshop Selection */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Junkshop (Optional)</label>
                    <div className="relative">
                      <select
                        value={selectedJunkshop}
                        onChange={(e) => setSelectedJunkshop(e.target.value)}
                        className="w-full p-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none outline-none focus:ring-2 focus:ring-green-500/50"
                      >
                        <option value="">All Junkshops</option>
                        {junkshops.map((junkshop) => (
                          <option key={junkshop.id} value={junkshop.id}>
                            {junkshop.name}
                          </option>
                        ))}
                      </select>
                      <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Quantity (approx.)</label>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g., 2 bags, 5 kg, etc."
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the materials (condition, etc.)"
                      rows={2}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                    />
                  </div>

                  {/* Location Info */}
                  <div className="p-2.5 bg-blue-50 rounded-lg flex items-start gap-2 border border-blue-100">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                      <IconNavigate className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-blue-600 mb-0.5">Pickup Location</p>
                      {addressLoading ? (
                        <p className="text-xs font-medium text-gray-500">Getting your address...</p>
                      ) : pickupAddress ? (
                        <p className="text-xs font-medium text-gray-700 leading-snug">{pickupAddress}</p>
                      ) : currentLocation ? (
                        <p className="text-xs font-medium text-gray-700">
                          {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-gray-500">Getting location...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky Submit Button */}
                <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white">
                  <button
                    onClick={handleSubmitRequest}
                    disabled={loading || !materialType || !description}
                    className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all active:scale-[0.98] text-sm"
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl max-h-[75vh] overflow-y-auto"
              >
                {/* Close button */}
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <IconClose className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {getMaterialTypeIcon(selectedRequest.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-lg font-bold text-gray-800 capitalize">{selectedRequest.type}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{selectedRequest.description}</p>
                    {selectedRequest.fulfillmentMethod && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 capitalize">
                        {selectedRequest.fulfillmentMethod}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {!isResident && (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                        <IconPerson className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Reported by</p>
                        <p className="text-sm font-medium text-gray-700">{selectedRequest.userName}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                      <IconLocation className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-500">Pickup Address</p>
                      <p className="text-sm font-medium text-gray-700">{selectedRequest.address}</p>
                    </div>
                  </div>

                  {selectedRequest.quantity && (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0">
                        <IconRecycle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Quantity</p>
                        <p className="text-sm font-medium text-gray-700">{selectedRequest.quantity}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
                      <IconTime className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Submitted</p>
                      <p className="text-sm font-medium text-gray-700">{selectedRequest.createdAt.toLocaleDateString()} at {selectedRequest.createdAt.toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {selectedRequest.targetJunkshopName && (
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                        <IconStore className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Targeted Junkshop</p>
                        <p className="text-sm font-medium text-blue-700">{selectedRequest.targetJunkshopName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {selectedRequest.location && (
                    <button
                      onClick={() => {
                        const { lat, lng } = selectedRequest.location
                        window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <IconNavigate className="w-4 h-4" />
                      View on Google Maps
                    </button>
                  )}

                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors text-sm"
                  >
                    Close
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
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-700 font-medium">Please wait...</p>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}

export default Map
