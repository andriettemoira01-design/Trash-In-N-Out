"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { IonFab, IonFabButton, IonIcon } from "@ionic/react"
import { locateOutline } from "ionicons/icons"
import { Geolocation } from "@capacitor/geolocation"

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

interface MaterialRequest {
  id: string
  userId: string
  userName: string
  type: string
  description: string
  location: {
    lat: number
    lng: number
  }
  address: string
  status: string
  createdAt: Date
}

interface MaterialRequestMapProps {
  requests: MaterialRequest[]
  onRequestSelect?: (request: MaterialRequest) => void
}

export const MaterialRequestMap: React.FC<MaterialRequestMapProps> = ({ requests, onRequestSelect }) => {
  const mapRef = useRef<HTMLElement | null>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null)

  useEffect(() => {
    getCurrentLocation()
  }, [])

  useEffect(() => {
    if (mapRef.current && currentLocation) {
      createMap()
    }
  }, [mapRef.current, currentLocation])

  useEffect(() => {
    if (googleMapRef.current) {
      updateMarkers()
    }
  }, [requests, googleMapRef.current])

  const getCurrentLocation = async () => {
    try {
      setLoading(true)
      const position = await Geolocation.getCurrentPosition()
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    } catch (error) {
      console.error("Error getting location", error)
      // Set default location (Bacoor, Cavite)
      setCurrentLocation({
        lat: 14.4624,
        lng: 120.9642,
      })
    } finally {
      setLoading(false)
    }
  }

  const createMap = async () => {
    if (!mapRef.current || !currentLocation) return

    try {
      setLoading(true)

      await loadGoogleMapsScript()

      const newMap = new google.maps.Map(mapRef.current, {
        center: currentLocation,
        zoom: 14,
      })

      googleMapRef.current = newMap

      // Add marker for current location
      const currentMarker = new google.maps.Marker({
        position: currentLocation,
        map: newMap,
        title: "Your location",
      })
      currentLocationMarkerRef.current = currentMarker

      await updateMarkers()
    } catch (error) {
      console.error("Error creating map", error)
    } finally {
      setLoading(false)
    }
  }

  const updateMarkers = async () => {
    if (!googleMapRef.current) return

    try {
      // Remove existing request markers
      for (const marker of markers) {
        marker.setMap(null)
      }

      const newMarkers: google.maps.Marker[] = []

      // Add markers for material requests
      for (const request of requests) {
        const iconUrl = getMarkerIconByStatus(request.status)
        
        const marker = new google.maps.Marker({
          position: request.location,
          map: googleMapRef.current,
          title: request.type,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(32, 32),
          },
        })

        // Set up click listener for this marker
        const requestData = request
        marker.addListener('click', () => {
          if (onRequestSelect) {
            onRequestSelect(requestData)
          }
        })

        newMarkers.push(marker)
      }

      setMarkers(newMarkers)
    } catch (error) {
      console.error("Error updating markers", error)
    }
  }

  const getMarkerIconByStatus = (status: string): string => {
    switch (status) {
      case "pending":
        return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
      case "claimed":
        return "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      case "in_progress":
        return "https://maps.google.com/mapfiles/ms/icons/purple-dot.png"
      case "completed":
        return "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
      case "cancelled":
        return "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
      default:
        return "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
    }
  }

  const centerOnCurrentLocation = async () => {
    if (!googleMapRef.current || !currentLocation) return

    try {
      googleMapRef.current.panTo(currentLocation)
      googleMapRef.current.setZoom(15)
    } catch (error) {
      console.error("Error centering map", error)
    }
  }

  return (
    <div className="relative h-full w-full">
      <div ref={(ref) => (mapRef.current = ref)} className="h-full w-full" />
      
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={centerOnCurrentLocation} color="light" size="small">
          <IonIcon icon={locateOutline} />
        </IonFabButton>
      </IonFab>
      
      {/* Native Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

