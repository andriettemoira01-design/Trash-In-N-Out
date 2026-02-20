"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSearchbar,
  IonModal,
} from "@ionic/react"
import { closeOutline, locateOutline, checkmarkOutline } from "ionicons/icons"
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

interface LocationSelectorProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: { lat: number; lng: number }, address: string) => void
  initialLocation: { lat: number; lng: number } | null
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  const mapRef = useRef<HTMLElement | null>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(initialLocation)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(initialLocation)
  const [address, setAddress] = useState<string>("Selected Location")
  const [searchQuery, setSearchQuery] = useState("")
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)

  useEffect(() => {
    if (isOpen && mapRef.current) {
      if (initialLocation) {
        setCurrentLocation(initialLocation)
        setSelectedLocation(initialLocation)
      } else {
        getCurrentLocation()
      }
    }
  }, [isOpen, mapRef.current])

  useEffect(() => {
    if (mapRef.current && currentLocation && isOpen) {
      createMap()
    }
  }, [mapRef.current, currentLocation, isOpen])

  const getCurrentLocation = async () => {
    try {
      setLoading(true)
      const position = await Geolocation.getCurrentPosition()
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      setCurrentLocation(location)
      setSelectedLocation(location)
      getAddressFromCoordinates(location)
    } catch (error) {
      console.error("Error getting location", error)
      // Set default location (Bacoor, Cavite)
      const defaultLocation = {
        lat: 14.4624,
        lng: 120.9642,
      }
      setCurrentLocation(defaultLocation)
      setSelectedLocation(defaultLocation)
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
        zoom: 15,
      })

      googleMapRef.current = newMap

      // Add marker for selected location
      if (selectedLocation) {
        const newMarker = new google.maps.Marker({
          position: selectedLocation,
          map: newMap,
          draggable: true,
        })
        setMarker(newMarker)

        // Set up marker drag listener
        newMarker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          const draggedLocation = { lat: event.latLng!.lat(), lng: event.latLng!.lng() }
          setSelectedLocation(draggedLocation)
          getAddressFromCoordinates(draggedLocation)
        })
      }

      // Set up click listener
      newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
        const newLocation = { lat: event.latLng!.lat(), lng: event.latLng!.lng() }
        setSelectedLocation(newLocation)
        getAddressFromCoordinates(newLocation)
        
        // Update marker
        if (marker) {
          marker.setMap(null)
        }
        
        const newMarker = new google.maps.Marker({
          position: newLocation,
          map: newMap,
          draggable: true,
        })
        setMarker(newMarker)

        // Set up marker drag listener on new marker
        newMarker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          const draggedLocation = { lat: event.latLng!.lat(), lng: event.latLng!.lng() }
          setSelectedLocation(draggedLocation)
          getAddressFromCoordinates(draggedLocation)
        })
      })
    } catch (error) {
      console.error("Error creating map", error)
    } finally {
      setLoading(false)
    }
  }

  const getAddressFromCoordinates = async (location: { lat: number; lng: number }) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }`
      )
      
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address)
      } else {
        setAddress("Selected Location")
      }
    } catch (error) {
      console.error("Error getting address", error)
      setAddress("Selected Location")
    }
  }

  const searchLocation = async () => {
    if (!searchQuery || !googleMapRef.current) return
    
    try {
      setLoading(true)
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      )
      
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const location = {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
        }
        
        setSelectedLocation(location)
        setAddress(data.results[0].formatted_address)
        
        // Update marker
        if (marker) {
          marker.setMap(null)
        }
        
        const newMarker = new google.maps.Marker({
          position: location,
          map: googleMapRef.current!,
          draggable: true,
        })
        setMarker(newMarker)

        // Set up marker drag listener on new marker
        newMarker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          const draggedLocation = { lat: event.latLng!.lat(), lng: event.latLng!.lng() }
          setSelectedLocation(draggedLocation)
          getAddressFromCoordinates(draggedLocation)
        })
        
        // Center map
        googleMapRef.current!.panTo(location)
        googleMapRef.current!.setZoom(15)
      } else {
        throw new Error("Location not found")
      }
    } catch (error) {
      console.error("Error searching location", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation, address)
    }
  }

  const centerOnCurrentLocation = async () => {
    try {
      setLoading(true)
      await getCurrentLocation()
      
      if (googleMapRef.current && currentLocation) {
        // Update camera
        googleMapRef.current.panTo(currentLocation)
        googleMapRef.current.setZoom(15)
        
        // Update marker
        if (marker) {
          marker.setMap(null)
        }
        
        const newMarker = new google.maps.Marker({
          position: currentLocation,
          map: googleMapRef.current,
          draggable: true,
        })
        setMarker(newMarker)

        // Set up marker drag listener on new marker
        newMarker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          const draggedLocation = { lat: event.latLng!.lat(), lng: event.latLng!.lng() }
          setSelectedLocation(draggedLocation)
          getAddressFromCoordinates(draggedLocation)
        })
        
        setSelectedLocation(currentLocation)
        getAddressFromCoordinates(currentLocation)
      }
    } catch (error) {
      console.error("Error centering on current location", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Select Location</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={handleConfirm} disabled={!selectedLocation}>
              <IonIcon icon={checkmarkOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="p-2">
          <div className="flex items-center">
            <IonSearchbar
              value={searchQuery}
              placeholder="Search for a location"
              className="flex-1"
              debounce={1000}
              onIonInput={(e) => {
                const value = e.detail.value || ""
                setSearchQuery(value)
                if (value) {
                  searchLocation()
                }
              }}
            />
            <IonButton onClick={centerOnCurrentLocation} fill="clear">
              <IonIcon icon={locateOutline} />
            </IonButton>
          </div>
          
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
            <p className="font-medium">Selected Address:</p>
            <p>{address}</p>
          </div>
        </div>
        
        <div className="h-full relative">
          <div ref={(ref) => (mapRef.current = ref)} className="h-full w-full" />
          
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
      </IonContent>
    </IonModal>
  )
}

