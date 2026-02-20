"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { IonContent, IonPage } from "@ionic/react"
import { firestore } from "../firebase"
import { collection, getDocs, doc, setDoc, addDoc, query, where, GeoPoint, serverTimestamp } from "firebase/firestore"
import { useAuth } from "../contexts/AuthContext"
import { Geolocation } from "@capacitor/geolocation"
import { sendNotification } from "../services/notifications"
import { motion, AnimatePresence } from "framer-motion"

// SVG Icon Components
const IconCalculator: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="112" y="48" width="288" height="416" rx="32" ry="32" strokeLinejoin="round"/>
    <path d="M160 112h192M160 240h192M160 336h32M160 400h32M240 336h32M240 400h32M320 336h32M320 400h32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconLeaf: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M161.35 242a16 16 0 0122.62-.68c73.63 69.36 147.51 111.56 234.45 133.07 11.73-32 12.77-67.22 2.64-101.58-13.44-45.59-44.74-85.31-90.49-114.86-40.84-26.38-81.66-33.25-121.15-39.89-49.82-8.38-96.88-16.3-141.79-63.85-5-5.26-11.81-7.37-18.32-5.66-7.44 2-12.43 7.88-14.82 17.6-5.6 22.75-2 86.51 13.75 153.82 25.29 108.14 65.65 162.86 95.06 189.73 38 34.69 87.62 53.9 136.93 53.9a186 186 0 0027.77-2.04c41.71-6.32 76.43-27.27 96-57.75-89.49-23.28-165.94-67.55-242-139.16a16 16 0 01-.65-22.65z"/>
  </svg>
)

const IconStore: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 448V240M64 240v208M382.47 48H129.53a32 32 0 00-27.43 15.58L48 160h416l-54.1-96.42A32 32 0 00382.47 48z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M464 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32H144v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconScale: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="48" y="48" width="416" height="416" rx="96" strokeLinejoin="round"/>
    <path d="M388.94 151.56L349.19 284.8a8 8 0 01-7.76 6H170.57a8 8 0 01-7.76-6l-39.75-133.24M256 320V176M176 380h160" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCash: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="32" y="80" width="448" height="256" rx="16" ry="16" strokeLinejoin="round"/>
    <path d="M48 368h416M96 432h320M256 208a64 64 0 11-64-64 64 64 0 0164 64z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconAdd: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 112v288M400 256H112" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRemove: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="256" cy="256" r="208" strokeMiterlimit="10"/>
    <path d="M336 256H176" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRefresh: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M320 146s24.36-12-64-12a160 160 0 10160 160" strokeLinecap="round" strokeMiterlimit="10"/>
    <path d="M256 58l80 80-80 80" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconInfo: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="256" cy="256" r="208" strokeMiterlimit="10"/>
    <path d="M256 176v160M256 336h0" strokeLinecap="round"/>
    <circle cx="256" cy="144" r="16" fill="currentColor"/>
  </svg>
)

const IconEdit: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M364.13 125.25L87 403l-23 45 44.99-23 277.76-277.13-22.62-22.62zM420.69 68.69l-22.62 22.62 22.62 22.62 22.62-22.62a16 16 0 000-22.62h0a16 16 0 00-22.62 0z"/>
  </svg>
)

const IconSave: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M380.93 57.37A32 32 0 00358.3 48H94.22A46.21 46.21 0 0048 94.22v323.56A46.21 46.21 0 0094.22 464h323.56A46.36 46.36 0 00464 417.78V153.7a32 32 0 00-9.37-22.63zM256 416a64 64 0 1164-64 63.92 63.92 0 01-64 64zm48-224H112a16 16 0 01-16-16v-64a16 16 0 0116-16h192a16 16 0 0116 16v64a16 16 0 01-16 16z"/>
  </svg>
)

const IconClose: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M368 368L144 144M368 144L144 368" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconSend: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0027.14 52 24.65 24.65 0 0016 72.59v113.29a24 24 0 0019.52 23.57l232.93 43.07a4 4 0 010 7.86L35.53 303.45A24 24 0 0016 327v113.31A23.57 23.57 0 0026.59 460a23.94 23.94 0 0013.22 4 24.55 24.55 0 009.52-1.93L476.4 285.94l.19-.09a32 32 0 000-58.8z"/>
  </svg>
)

const IconLocation: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1164-64 64.07 64.07 0 01-64 64z"/>
  </svg>
)

const IconLocate: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 96V56M256 456v-40M256 336a80 80 0 1180-80 80 80 0 01-80 80zM96 256H56M456 256h-40" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconPricetag: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M467 45.2A44.45 44.45 0 00435.29 32H312.36a30.63 30.63 0 00-21.52 8.89L45.09 286.59a44.82 44.82 0 000 63.32l117 117a44.83 44.83 0 0063.34 0l245.65-245.6A30.6 30.6 0 00480 199.8v-123a44.24 44.24 0 00-13-31.6zM384 160a32 32 0 1132-32 32 32 0 01-32 32z"/>
  </svg>
)

const IconChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="48">
    <path d="M112 184l144 144 144-144" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRecycle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 48l-112 160h224L256 48zM48 304l112 160V304H48zM464 304H352v160l112-160z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const GOOGLE_MAPS_API_KEY = "AIzaSyClNSGCnDzZvDvLdcGuS-28fSSAatlBCFI"

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

interface MaterialPrice {
  id: string
  name: string
  price: number
  unit: string
  description?: string
  junkshopId: string
}

interface CalculationItem {
  materialId: string
  weight: number
  subtotal: number
}

interface Junkshop {
  id: string
  name: string
  email: string
}

const RecycleCalculator: React.FC = () => {
  const { currentUser } = useAuth()
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([])
  const [allMaterialPrices, setAllMaterialPrices] = useState<MaterialPrice[]>([])
  const [junkshops, setJunkshops] = useState<Junkshop[]>([])
  const [selectedJunkshop, setSelectedJunkshop] = useState<string>("")
  const [calculationItems, setCalculationItems] = useState<CalculationItem[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  const [weight, setWeight] = useState<string>("")
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false)
  const [showToast, setShowToast] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string>("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isCreatingRequest, setIsCreatingRequest] = useState<boolean>(false)
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null)
  const [mapLoading, setMapLoading] = useState<boolean>(true)
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null)
  const currentMarkerRef = useRef<google.maps.Marker | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<MaterialPrice | null>(null)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    unit: "kg",
    description: "",
  })
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false)
  const [showJunkshopDropdown, setShowJunkshopDropdown] = useState(false)
  const mapElementRef = useRef<HTMLDivElement | null>(null)

  const isJunkshop = currentUser?.role === "junkshop"
  const isResident = currentUser?.role === "resident"

  const showToastMessage = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // Fetch material prices from Firestore
  useEffect(() => {
    const fetchMaterialPrices = async () => {
      try {
        setIsLoading(true)
        
        if (isJunkshop && currentUser) {
          const materialsRef = collection(firestore, "materialPrices")
          const q = query(materialsRef, where("junkshopId", "==", currentUser.uid))
          const snapshot = await getDocs(q)

          const materials: MaterialPrice[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            price: doc.data().price,
            unit: doc.data().unit || "kg",
            description: doc.data().description,
            junkshopId: doc.data().junkshopId,
          }))

          setMaterialPrices(materials)

          if (materials.length === 0) {
            await initializeDefaultPrices()
          }
        } else {
          const materialsRef = collection(firestore, "materialPrices")
          const snapshot = await getDocs(materialsRef)

          const materials: MaterialPrice[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            price: doc.data().price,
            unit: doc.data().unit || "kg",
            description: doc.data().description,
            junkshopId: doc.data().junkshopId,
          }))

          setAllMaterialPrices(materials)
          setMaterialPrices([])

          const usersRef = collection(firestore, "users")
          const junkshopQuery = query(usersRef, where("role", "==", "junkshop"))
          const junkshopSnapshot = await getDocs(junkshopQuery)
          
          const junkshopList: Junkshop[] = []
          junkshopSnapshot.forEach((doc) => {
            junkshopList.push({
              id: doc.id,
              name: doc.data().name || doc.data().businessName || "Unknown Junkshop",
              email: doc.data().email,
            })
          })
          
          setJunkshops(junkshopList)
        }
      } catch (error) {
        console.error("Error fetching material prices:", error)
        showToastMessage("Error loading material prices", "error")
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUser) {
      fetchMaterialPrices()
    }
  }, [currentUser])

  // Filter material prices when junkshop is selected
  useEffect(() => {
    if (isResident) {
      if (selectedJunkshop) {
        const filteredPrices = allMaterialPrices.filter(price => price.junkshopId === selectedJunkshop)
        setMaterialPrices(filteredPrices)
      } else {
        setMaterialPrices([])
      }
      setCalculationItems([])
      setSelectedMaterial("")
      setWeight("")
    }
  }, [selectedJunkshop, allMaterialPrices, isResident])

  // Clean up map when component unmounts
  useEffect(() => {
    return () => {
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null)
      }
    }
  }, [googleMap])

  const initializeDefaultPrices = async () => {
    if (!currentUser || currentUser.role !== "junkshop") return

    const defaultMaterials = [
      { name: "Cardboard", price: 3.5, unit: "kg", description: "Clean, dry cardboard boxes" },
      { name: "Newspaper", price: 5.0, unit: "kg", description: "Clean newspapers and magazines" },
      { name: "White Paper", price: 8.0, unit: "kg", description: "Clean white office paper" },
      { name: "PET Bottles", price: 15.0, unit: "kg", description: "Clean plastic bottles (soda, water)" },
      { name: "HDPE Plastic", price: 12.0, unit: "kg", description: "Milk jugs, detergent bottles" },
      { name: "Aluminum Cans", price: 60.0, unit: "kg", description: "Clean aluminum beverage cans" },
      { name: "Steel/Tin Cans", price: 10.0, unit: "kg", description: "Food cans, cleaned" },
      { name: "Glass Bottles", price: 1.5, unit: "kg", description: "Clean glass bottles and jars" },
      { name: "Copper", price: 350.0, unit: "kg", description: "Copper wire, pipes, etc." },
      { name: "Brass", price: 200.0, unit: "kg", description: "Brass fixtures, parts" },
    ]

    const newMaterials: MaterialPrice[] = []

    for (const material of defaultMaterials) {
      const docRef = await addDoc(collection(firestore, "materialPrices"), {
        ...material,
        junkshopId: currentUser.uid,
      })

      newMaterials.push({
        id: docRef.id,
        ...material,
        junkshopId: currentUser.uid,
      })
    }

    setMaterialPrices(newMaterials)
  }

  const openEditModal = (material: MaterialPrice) => {
    setEditingMaterial(material)
    setEditForm({
      name: material.name,
      price: material.price.toString(),
      unit: material.unit,
      description: material.description || "",
    })
    setShowEditModal(true)
  }

  const saveEditedMaterial = async () => {
    if (!editingMaterial || !currentUser) return

    try {
      const materialRef = doc(firestore, "materialPrices", editingMaterial.id)
      await setDoc(materialRef, {
        name: editForm.name,
        price: parseFloat(editForm.price) || 0,
        unit: editForm.unit,
        description: editForm.description,
        junkshopId: currentUser.uid,
      })

      setMaterialPrices((prev) =>
        prev.map((material) =>
          material.id === editingMaterial.id
            ? { ...material, ...editForm, price: parseFloat(editForm.price) || 0 }
            : material
        )
      )

      setShowEditModal(false)
      setEditingMaterial(null)
      showToastMessage("Material price updated successfully", "success")
    } catch (error) {
      console.error("Error updating material price:", error)
      showToastMessage("Error updating material price", "error")
    }
  }

  const addCalculationItem = () => {
    const weightNum = parseFloat(weight)
    if (!selectedMaterial || !weightNum || weightNum <= 0) {
      showToastMessage("Please select a material and enter a valid weight", "error")
      return
    }

    const material = materialPrices.find((m) => m.id === selectedMaterial)
    if (!material) return

    const subtotal = material.price * weightNum

    setCalculationItems([
      ...calculationItems,
      {
        materialId: selectedMaterial,
        weight: weightNum,
        subtotal,
      },
    ])

    setSelectedMaterial("")
    setWeight("")
    showToastMessage("Item added to calculation", "success")
  }

  const removeCalculationItem = (index: number) => {
    const newItems = [...calculationItems]
    newItems.splice(index, 1)
    setCalculationItems(newItems)
  }

  const clearCalculation = () => {
    setCalculationItems([])
    showToastMessage("Calculation cleared", "success")
  }

  const getMaterialName = (id: string): string => {
    const material = materialPrices.find((m) => m.id === id)
    return material ? material.name : "Unknown Material"
  }

  const getMaterialUnit = (id: string): string => {
    const material = materialPrices.find((m) => m.id === id)
    return material ? material.unit : "kg"
  }

  const getMaterialPrice = (id: string): number => {
    const material = materialPrices.find((m) => m.id === id)
    return material ? material.price : 0
  }

  const calculateTotal = (): number => {
    return calculationItems.reduce((total, item) => total + item.subtotal, 0)
  }

  const getCurrentLocation = async () => {
    try {
      const permission = await Geolocation.checkPermissions()
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions()
        if (requested.location !== 'granted') {
          return { lat: 14.4624, lng: 120.9642 }
        }
      }
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
    } catch (error) {
      console.error("Error getting location", error)
      return { lat: 14.4624, lng: 120.9642 }
    }
  }

  const initializeMap = async () => {
    const mapEl = mapElementRef.current
    if (!mapEl) return

    try {
      setMapLoading(true)

      if (!document.body.contains(mapEl)) {
        setMapLoading(false)
        return
      }

      const userCurrentLocation = await getCurrentLocation()
      setCurrentLocation(userCurrentLocation)
      setSelectedLocation(userCurrentLocation)

      await loadGoogleMapsScript()

      const newMap = new google.maps.Map(mapEl, {
        center: userCurrentLocation,
        zoom: 15,
      })

      setGoogleMap(newMap)

      const marker = new google.maps.Marker({
        position: userCurrentLocation,
        map: newMap,
        title: "Selected pickup location",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
          scaledSize: new google.maps.Size(32, 32),
        },
      })
      setCurrentMarker(marker)
      currentMarkerRef.current = marker

      newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
        const newLocation = { lat: event.latLng!.lat(), lng: event.latLng!.lng() }
        setSelectedLocation(newLocation)
        
        if (currentMarkerRef.current) {
          currentMarkerRef.current.setMap(null)
        }
        
        const newMarker = new google.maps.Marker({
          position: newLocation,
          map: newMap,
          title: "Selected pickup location",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(32, 32),
          },
        })
        setCurrentMarker(newMarker)
        currentMarkerRef.current = newMarker
      })

    } catch (error) {
      console.error("Error creating map", error)
      showToastMessage("Error loading map", "error")
    } finally {
      setMapLoading(false)
    }
  }

  const resetToCurrentLocation = async () => {
    if (!currentLocation || !googleMap) return

    setSelectedLocation(currentLocation)
    
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null)
    }
    
    const newMarker = new google.maps.Marker({
      position: currentLocation,
      map: googleMap,
      title: "Selected pickup location",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        scaledSize: new google.maps.Size(32, 32),
      },
    })
    setCurrentMarker(newMarker)
    currentMarkerRef.current = newMarker

    googleMap.panTo(currentLocation)
    googleMap.setZoom(15)
  }

  const openLocationModal = () => {
    setShowLocationModal(true)
    setMapLoading(true)
    setTimeout(() => initializeMap(), 300)
  }

  const closeLocationModal = () => {
    setShowLocationModal(false)
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null)
    }
    setGoogleMap(null)
    setSelectedLocation(null)
    setCurrentMarker(null)
    currentMarkerRef.current = null
    setMapLoading(true)
  }

  const createMaterialRequest = async () => {
    if (calculationItems.length === 0) {
      showToastMessage("Please add items to your calculation first", "error")
      return
    }

    if (!isResident) {
      showToastMessage("Only residents can create material requests", "error")
      return
    }

    if (!selectedJunkshop) {
      showToastMessage("Please select a junkshop", "error")
      return
    }

    openLocationModal()
  }

  const confirmCreateRequest = async () => {
    if (!selectedLocation) {
      showToastMessage("Please select a location", "error")
      return
    }

    if (!currentUser) {
      showToastMessage("User not authenticated", "error")
      return
    }

    try {
      setIsCreatingRequest(true)

      const description = calculationItems.map(item => {
        const material = materialPrices.find(m => m.id === item.materialId)
        return `${material?.name}: ${item.weight}${material?.unit} (₱${item.subtotal.toFixed(2)})`
      }).join(', ')

      const totalValue = calculateTotal()
      const detailedDescription = `${description}. Total estimated value: ₱${totalValue.toFixed(2)}`

      const newRequest = {
        userId: currentUser.uid,
        userName: currentUser.name,
        type: "mixed",
        description: detailedDescription,
        quantity: `${calculationItems.length} item(s)`,
        location: new GeoPoint(selectedLocation.lat, selectedLocation.lng),
        address: "Selected location from map",
        status: "pending",
        createdAt: serverTimestamp(),
        calculationData: {
          items: calculationItems,
          totalValue,
          calculatedAt: new Date().toISOString()
        },
        targetJunkshopId: selectedJunkshop,
        targetJunkshopName: junkshops.find(j => j.id === selectedJunkshop)?.name
      }

      const docRef = await addDoc(collection(firestore, "materialRequests"), newRequest)

      await sendNotification({
        userId: selectedJunkshop,
        title: "New Calculated Material Request",
        message: `${currentUser.name} has a calculated material request worth ₱${totalValue.toFixed(2)}`,
        type: "request",
        relatedId: docRef.id,
      })

      await sendNotification({
        userId: currentUser.uid,
        title: "Material Request Created",
        message: `Your calculated material request worth ₱${totalValue.toFixed(2)} has been submitted successfully.`,
        type: "request",
        relatedId: docRef.id,
      })

      showToastMessage("Material request created successfully!", "success")
      setCalculationItems([])
      closeLocationModal()

    } catch (error) {
      console.error("Error creating material request:", error)
      showToastMessage("Error creating material request", "error")
    } finally {
      setIsCreatingRequest(false)
    }
  }

  const getHeaderGradient = () => {
    if (isJunkshop) return "from-orange-500 via-amber-500 to-yellow-500"
    return "from-emerald-500 via-green-500 to-teal-500"
  }

  const selectedMaterialData = materialPrices.find(m => m.id === selectedMaterial)
  const selectedJunkshopData = junkshops.find(j => j.id === selectedJunkshop)

  return (
    <IonPage>
      <IonContent className="ion-padding-bottom" scrollY={true}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className={`bg-gradient-to-br ${getHeaderGradient()} pt-12 pb-24 px-4 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Recycle Calculator</h1>
                  <p className="text-white/80 text-sm">
                    {isJunkshop ? "Manage pricing & calculate values" : "Estimate your recyclables value"}
                  </p>
                </div>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                >
                  <IconInfo className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconLeaf className="w-4 h-4 text-white/80" />
                    <span className="text-white/80 text-xs">Materials</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{materialPrices.length}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconStore className="w-4 h-4 text-white/80" />
                    <span className="text-white/80 text-xs">{isJunkshop ? "Your Items" : "Junkshops"}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {isJunkshop ? calculationItems.length : junkshops.length}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-4 -mt-16 pb-24 relative z-20">
            {isLoading ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Loading material prices...</p>
              </div>
            ) : (
              <>
                {/* Calculator Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4"
                >
                  <div className={`bg-gradient-to-r ${isJunkshop ? 'from-orange-50 to-amber-50' : 'from-emerald-50 to-green-50'} px-4 py-3 border-b border-gray-100`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${isJunkshop ? 'bg-orange-100' : 'bg-emerald-100'} flex items-center justify-center`}>
                        <IconCalculator className={`w-5 h-5 ${isJunkshop ? 'text-orange-600' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-800">Calculate Value</h2>
                        <p className="text-xs text-gray-500">
                          {isJunkshop ? "Using your custom pricing" : "Select materials and enter weights"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Junkshop Selection (Residents only) */}
                    {isResident && (
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <IconStore className="w-4 h-4 inline mr-1" />
                          Select Junkshop *
                        </label>
                        <button
                          onClick={() => setShowJunkshopDropdown(!showJunkshopDropdown)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <span className={selectedJunkshopData ? "text-gray-800" : "text-gray-400"}>
                            {selectedJunkshopData?.name || "Choose a junkshop to see their prices"}
                          </span>
                          <IconChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showJunkshopDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {showJunkshopDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
                            >
                              <div className="py-1">
                                {junkshops.map((junkshop, index) => (
                                  <button
                                    key={junkshop.id}
                                    onClick={() => {
                                      setSelectedJunkshop(junkshop.id)
                                      setShowJunkshopDropdown(false)
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center gap-3 ${
                                      selectedJunkshop === junkshop.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                                    } ${index === junkshops.length - 1 ? 'mb-1' : ''}`}
                                  >
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                      <IconStore className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <span className="font-medium">{junkshop.name}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Material Selection */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <IconLeaf className="w-4 h-4 inline mr-1 text-green-600" />
                        Select Material
                      </label>
                      <button
                        onClick={() => {
                          if (isResident && !selectedJunkshop) {
                            showToastMessage("Please select a junkshop first", "error")
                            return
                          }
                          setShowMaterialDropdown(!showMaterialDropdown)
                        }}
                        disabled={isResident && !selectedJunkshop}
                        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between ${
                          isResident && !selectedJunkshop ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                        }`}
                      >
                        <span className={selectedMaterialData ? "text-gray-800" : "text-gray-400"}>
                          {selectedMaterialData 
                            ? `${selectedMaterialData.name} - ₱${selectedMaterialData.price.toFixed(2)}/${selectedMaterialData.unit}`
                            : "Choose material type"
                          }
                        </span>
                        <IconChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showMaterialDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {showMaterialDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto overscroll-contain"
                            style={{ scrollbarWidth: 'thin' }}
                          >
                            {materialPrices.map((material, index) => (
                              <button
                                key={material.id}
                                onClick={() => {
                                  setSelectedMaterial(material.id)
                                  setShowMaterialDropdown(false)
                                }}
                                className={`w-full px-4 py-3.5 text-left hover:bg-emerald-50 flex items-center justify-between ${
                                  selectedMaterial === material.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                                } ${index === 0 ? 'rounded-t-xl' : ''} ${index === materialPrices.length - 1 ? 'rounded-b-xl' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <IconLeaf className="w-4 h-4 text-green-600" />
                                  </div>
                                  <span className="font-medium">{material.name}</span>
                                </div>
                                <span className="text-emerald-600 font-semibold flex-shrink-0">₱{material.price.toFixed(2)}/{material.unit}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Weight Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <IconScale className="w-4 h-4 inline mr-1 text-blue-600" />
                        Weight ({selectedMaterialData?.unit || "kg"})
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Enter weight"
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={addCalculationItem}
                      disabled={!selectedMaterial || !weight || parseFloat(weight) <= 0}
                      className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                        !selectedMaterial || !weight || parseFloat(weight) <= 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : isJunkshop
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                            : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                      }`}
                    >
                      <IconAdd className="w-5 h-5" />
                      Add to Calculation
                    </button>
                  </div>
                </motion.div>

                {/* Calculation Results */}
                <AnimatePresence>
                  {calculationItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden mb-4 border-2 ${isJunkshop ? 'border-orange-200' : 'border-emerald-200'}`}
                    >
                      <div className={`bg-gradient-to-r ${isJunkshop ? 'from-orange-50 to-amber-50' : 'from-emerald-50 to-green-50'} px-4 py-3 border-b border-gray-100`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${isJunkshop ? 'bg-orange-100' : 'bg-emerald-100'} flex items-center justify-center`}>
                              <IconCash className={`w-5 h-5 ${isJunkshop ? 'text-orange-600' : 'text-emerald-600'}`} />
                            </div>
                            <h2 className="font-semibold text-gray-800">Your Calculation</h2>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isJunkshop ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {calculationItems.length} item{calculationItems.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {calculationItems.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                          >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconLeaf className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-800 truncate">{getMaterialName(item.materialId)}</h3>
                              <p className="text-xs text-gray-500">
                                {item.weight} {getMaterialUnit(item.materialId)} × ₱{getMaterialPrice(item.materialId).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isJunkshop ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                ₱{item.subtotal.toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => removeCalculationItem(index)}
                              className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 flex-shrink-0"
                            >
                              <IconRemove className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}

                        {/* Total */}
                        <div className={`bg-gradient-to-r ${isJunkshop ? 'from-orange-500 to-amber-500' : 'from-emerald-500 to-green-500'} rounded-xl p-4 text-white`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white/80 text-sm">Total Estimated Value</p>
                              <p className="text-3xl font-bold">₱{calculateTotal().toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                              <IconCash className="w-6 h-6" />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2">
                          {isResident && (
                            <button
                              onClick={createMaterialRequest}
                              disabled={isCreatingRequest}
                              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-green-600 disabled:opacity-50"
                            >
                              <IconSend className="w-5 h-5" />
                              {isCreatingRequest ? "Creating Request..." : "Submit Pickup Request"}
                            </button>
                          )}
                          <button
                            onClick={clearCalculation}
                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
                          >
                            <IconRefresh className="w-5 h-5" />
                            Clear All Items
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Price List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <IconPricetag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">
                            {isJunkshop ? "Your Price List" : "Material Prices"}
                          </h2>
                          <p className="text-xs text-gray-500">
                            {isJunkshop 
                              ? "Tap edit icon to update prices"
                              : selectedJunkshop
                                ? `Prices from ${selectedJunkshopData?.name}`
                                : "Select a junkshop to view prices"
                            }
                          </p>
                        </div>
                      </div>
                      {materialPrices.length > 0 && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                          {materialPrices.length} items
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {materialPrices.length > 0 ? (
                      <div className="space-y-3">
                        {materialPrices.map((material, index) => (
                          <motion.div
                            key={material.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-green-200 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <IconLeaf className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-800">{material.name}</h3>
                                  {material.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{material.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`px-3 py-1.5 rounded-lg ${isJunkshop ? 'bg-orange-500' : 'bg-emerald-500'} text-white`}>
                                  <span className="text-lg font-bold">₱{material.price.toFixed(2)}</span>
                                  <span className="text-xs opacity-80">/{material.unit}</span>
                                </div>
                                {isJunkshop && (
                                  <button
                                    onClick={() => openEditModal(material)}
                                    className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100"
                                  >
                                    <IconEdit className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IconStore className="w-8 h-8 text-gray-400" />
                        </div>
                        {isResident && !selectedJunkshop ? (
                          <>
                            <h3 className="font-semibold text-gray-700 mb-2">No Junkshop Selected</h3>
                            <p className="text-sm text-gray-500">Please select a junkshop above to view their material prices.</p>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-700 mb-2">No Prices Available</h3>
                            <p className="text-sm text-gray-500">No material prices found.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Info Modal */}
        <AnimatePresence>
          {showInfoModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowInfoModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <IconRecycle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">About the Calculator</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  This calculator provides estimates based on junkshop prices. Actual prices may vary based on material quality and market conditions. Use this as a guide to estimate the value of your recyclables.
                </p>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold"
                >
                  Got it!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {showEditModal && editingMaterial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Edit Material Price</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                  >
                    <IconClose className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Material Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price per Unit (₱)</label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                    <div className="flex gap-2">
                      {["kg", "pc", "bundle"].map((unit) => (
                        <button
                          key={unit}
                          onClick={() => setEditForm({ ...editForm, unit })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            editForm.unit === unit
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Enter material description"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={saveEditedMaterial}
                    className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
                  >
                    <IconSave className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location Modal */}
        <AnimatePresence>
          {showLocationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
              onClick={closeLocationModal}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">Select Pickup Location</h3>
                  <button
                    onClick={closeLocationModal}
                    className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                  >
                    <IconClose className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Tap on the map to select your pickup location
                  </p>
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={resetToCurrentLocation}
                      disabled={!currentLocation || mapLoading}
                      className="flex-1 py-2 px-3 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <IconLocate className="w-4 h-4" />
                      Current Location
                    </button>
                    {mapLoading && (
                      <button
                        onClick={async () => {
                          const location = await getCurrentLocation()
                          setSelectedLocation(location)
                          setCurrentLocation(location)
                          setMapLoading(false)
                        }}
                        className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <IconLocation className="w-4 h-4" />
                        Use GPS Location
                      </button>
                    )}
                  </div>

                  <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 mb-4 relative bg-gray-100">
                    <div
                      ref={mapElementRef}
                      className="h-full w-full"
                      style={{ touchAction: "none" }}
                    />
                    {mapLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-gray-600">Loading map...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedLocation && (
                    <div className="bg-emerald-50 p-3 rounded-xl mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <IconLocation className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Selected Location</p>
                        <p className="text-xs text-emerald-600">
                          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={closeLocationModal}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmCreateRequest}
                      disabled={!selectedLocation || isCreatingRequest}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <IconSend className="w-5 h-5" />
                      {isCreatingRequest ? "Creating..." : "Confirm"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 text-center mt-3">
                    {mapLoading ? "If map doesn't load, use GPS Location button" : "Tap anywhere on map to change location"}
                  </p>
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
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  )
}

export default RecycleCalculator
