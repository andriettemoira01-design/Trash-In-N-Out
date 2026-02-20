"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Geolocation } from "@capacitor/geolocation"
import { Capacitor } from "@capacitor/core"

// Use the provided Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyClNSGCnDzZvDvLdcGuS-28fSSAatlBCFI"

// SVG Icons
const IconLocate: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 96V56M256 456v-40M256 336a80 80 0 1180-80 80 80 0 01-80 80zM96 256H56M456 256h-40" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconExpand: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M432 320v112H320M421.8 421.77L304 304M80 192V80h112M90.2 90.23L208 208M320 80h112v112M421.77 90.2L304 208M192 432H80V320M90.23 421.8L208 304" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

interface IframeMapProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void
  selectedLocation?: { lat: number; lng: number } | null
  autoGetLocation?: boolean
  compact?: boolean
}

const IframeMap: React.FC<IframeMapProps> = ({ onLocationSelect, selectedLocation, autoGetLocation = false, compact = false }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapUrl, setMapUrl] = useState("")

  // Initialize map URL when component mounts or when selectedLocation changes
  useEffect(() => {
    // Default center (Philippines)
    const defaultLat = 14.5995
    const defaultLng = 120.9842
    
    // Use selected location or default
    const lat = selectedLocation?.lat || defaultLat
    const lng = selectedLocation?.lng || defaultLng
    
    // Create Google Maps embed URL with marker if location is selected
    let url = `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${lat},${lng}&zoom=15`
    
    if (selectedLocation) {
      url = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=15`
    }
    
    setMapUrl(url)
  }, [selectedLocation])

  // Auto-get location on mount if requested
  useEffect(() => {
    if (autoGetLocation && !selectedLocation) {
      getCurrentLocation()
    }
  }, [autoGetLocation])

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false)
    setError("Failed to load map. Please check your internet connection.")
  }

  // Get current location with platform detection
  const getCurrentLocation = async () => {
    setGettingLocation(true)
    setError(null)
    
    try {
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Geolocation for native
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        })
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        onLocationSelect(location)
        setGettingLocation(false)
      } else {
        // Use browser geolocation for web
        if (!navigator.geolocation) {
          setError("Geolocation is not supported by your browser")
          setGettingLocation(false)
          return
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            onLocationSelect(location)
            setGettingLocation(false)
          },
          (err) => {
            console.error("Browser geolocation error:", err)
            switch (err.code) {
              case err.PERMISSION_DENIED:
                setError("Location permission denied. Please enable location access.")
                break
              case err.POSITION_UNAVAILABLE:
                setError("Location unavailable. Please try again.")
                break
              case err.TIMEOUT:
                setError("Location request timed out. Please try again.")
                break
              default:
                setError("Could not get your location")
            }
            setGettingLocation(false)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        )
      }
    } catch (err) {
      console.error("Error getting current location:", err)
      setError("Could not get your current location. Please try again.")
      setGettingLocation(false)
    }
  }

  // Open larger map in new tab
  const openLargerMap = () => {
    const lat = selectedLocation?.lat || 14.5995
    const lng = selectedLocation?.lng || 120.9842
    window.open(`https://www.google.com/maps?q=${lat},${lng}&z=15`, "_blank")
  }

  const mapHeight = compact ? "200px" : "300px"

  return (
    <div className="iframe-map-container">
      <div
        className="iframe-map-wrapper relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
        style={{ height: mapHeight, width: "100%" }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 z-20">
            <IconSpinner className="w-8 h-8 text-emerald-500" />
            <p className="mt-2 text-sm text-gray-600">Loading map...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 p-4">
            <p className="text-red-500 text-sm text-center mb-3">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setIsLoading(true)
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />

        {/* Map Overlay Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <button
            onClick={openLargerMap}
            className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="View Larger Map"
          >
            <IconExpand className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Map Controls */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {gettingLocation ? (
            <>
              <IconSpinner className="w-4 h-4" />
              <span>Getting Location...</span>
            </>
          ) : (
            <>
              <IconLocate className="w-4 h-4" />
              <span>Use My Location</span>
            </>
          )}
        </button>
      </div>

      {selectedLocation && (
        <p className="text-xs text-emerald-600 mt-2 px-1">
          📍 Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
        </p>
      )}
    </div>
  )
}

export default IframeMap
