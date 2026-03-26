"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
} from "@ionic/react"
import { useAuth } from "../contexts/AuthContext"
import { useHistory } from "react-router"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { firestore } from "../firebase"
import { motion } from "framer-motion"
import { canResidentCreateRequest } from "../services/limits"

// SVG Icon Components (avoiding Stencil watcher issues)
const IconNewspaper: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M368 415.86V72a24.07 24.07 0 00-24-24H72a24.07 24.07 0 00-24 24v352a40.12 40.12 0 0040 40h328" strokeLinejoin="round"/>
    <path d="M416 464h0a48 48 0 01-48-48V128h72a24 24 0 0124 24v264a48 48 0 01-48 48z" strokeLinejoin="round"/>
    <path d="M240 128h64M240 192h64M112 256h192M112 320h192M112 384h192" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M112 128h64v64h-64z"/>
  </svg>
)

const IconCube: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 341.37V170.61A32 32 0 00432.11 143l-152-88.46a47.94 47.94 0 00-48.24 0L79.89 143A32 32 0 0064 170.61v170.76A32 32 0 0079.89 369l152 88.46a48 48 0 0048.24 0l152-88.46A32 32 0 00448 341.37z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M69 153.99l187 110 187-110M256 463.99v-200" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconConstruct: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M436.67 184.11a27.17 27.17 0 01-38.3 0l-22.48-22.49a27.15 27.15 0 010-38.29l50.89-50.89a.85.85 0 00-.26-1.38C393.68 57.57 355.4 68.47 332 91.87l-60.5 60.5a4 4 0 000 5.66l141.5 141.49a4 4 0 005.66 0l60.5-60.5c23.4-23.39 34.3-61.67 20.81-94.52a.84.84 0 00-1.38-.26zM75.33 327.89a27.17 27.17 0 0138.3 0l22.48 22.49a27.15 27.15 0 010 38.29l-50.89 50.89a.85.85 0 00.26 1.38c32.84 13.49 71.12 2.59 94.52-20.81l60.5-60.5a4 4 0 000-5.66L98.1 212.52a4 4 0 00-5.66 0l-60.5 60.5c-23.4 23.39-34.3 61.67-20.81 94.52a.84.84 0 001.38.26z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M218.67 218.67l-37.62 37.62a32 32 0 000 45.25l29.66 29.66a32 32 0 0045.25 0l37.62-37.62M293.33 293.33l37.62-37.62a32 32 0 000-45.25l-29.66-29.66a32 32 0 00-45.25 0l-37.62 37.62" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconWine: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M398.57 80H113.43a16 16 0 00-16 17.74l28.57 274.64c.64 6.39 5.77 11.62 12.12 11.62h235.76c6.35 0 11.48-5.23 12.12-11.62l28.57-274.64a16 16 0 00-16-17.74z" strokeLinejoin="round"/>
    <path d="M256 336v128M176 464h160M256 96V32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconChip: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="80" y="80" width="352" height="352" rx="48" ry="48" strokeLinejoin="round"/>
    <rect x="144" y="144" width="224" height="224" rx="16" ry="16" strokeLinejoin="round"/>
    <path d="M256 80V48M336 80V48M176 80V48M256 464v-32M336 464v-32M176 464v-32M432 256h32M432 336h32M432 176h32M48 256h32M48 336h32M48 176h32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconHelp: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 80a176 176 0 10176 176A176 176 0 00256 80z" strokeMiterlimit="10"/>
    <path d="M200 202.29s.84-17.5 19.57-32.57C230.68 160.77 244 158.18 256 158c10.93-.14 20.69 1.67 26.53 4.45 10 4.76 29.47 16.38 29.47 41.09 0 26-17 37.81-36.37 50.8S251 281.43 251 296" strokeLinecap="round" strokeMiterlimit="10"/>
    <circle cx="250" cy="348" r="20" fill="currentColor"/>
  </svg>
)

const IconSend: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M470.3 271.15L45.47 464.04a8 8 0 01-11.47-7.04V288l256-32-256-32V55a8 8 0 0111.47-7.04l424.83 192.89a16.07 16.07 0 010 30.3z" strokeMiterlimit="10" strokeLinecap="round"/>
  </svg>
)

const IconLeaf: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M321.89 171.42C233 114 141 155.22 56 65.22c-19.8-21-8.3 235.5 98.1 332.7 77.79 71 197.9 63.08 238.4-5.92s18.28-163.17-70.61-220.58zM173 253c86 81 175 129 292 147" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconDocument: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.75a32 32 0 0122.62 9.37l141.26 141.26a32 32 0 019.37 22.62z" strokeLinejoin="round"/>
    <path d="M256 56v120a32 32 0 0032 32h120M176 288h160M176 368h160" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Material type icon rendering
const MaterialIcon: React.FC<{ type: string; className?: string }> = ({ type, className }) => {
  switch (type) {
    case "paper": return <IconNewspaper className={className} />
    case "plastic": return <IconCube className={className} />
    case "metal": return <IconConstruct className={className} />
    case "glass": return <IconWine className={className} />
    case "electronics": return <IconChip className={className} />
    case "other": return <IconHelp className={className} />
    default: return <IconHelp className={className} />
  }
}

const MaterialRequest: React.FC = () => {
  const { userData } = useAuth()
  const history = useHistory()
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [fulfillmentMethod, setFulfillmentMethod] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertHeader, setAlertHeader] = useState("Alert")
  const [touched, setTouched] = useState<{[key: string]: boolean}>({})
  const [dailyLimitInfo, setDailyLimitInfo] = useState<{ remaining: number; limit: number }>({ remaining: 5, limit: 5 })

  // Refs for direct DOM access
  const typeSelectRef = useRef<HTMLIonSelectElement>(null)
  const descriptionTextareaRef = useRef<HTMLIonTextareaElement>(null)

  useEffect(() => {
    const checkLimit = async () => {
      if (userData?.uid) {
        const info = await canResidentCreateRequest(userData.uid)
        setDailyLimitInfo({ remaining: info.remaining, limit: info.limit })
      }
    }
    checkLimit()
  }, [userData?.uid])

  const materialTypes = [
    { value: "paper", label: "Paper & Cardboard", color: "bg-amber-100 text-amber-600" },
    { value: "plastic", label: "Plastic", color: "bg-blue-100 text-blue-600" },
    { value: "metal", label: "Metal & Aluminum", color: "bg-gray-100 text-gray-600" },
    { value: "glass", label: "Glass", color: "bg-green-100 text-green-600" },
    { value: "electronics", label: "Electronics", color: "bg-purple-100 text-purple-600" },
    { value: "other", label: "Other Materials", color: "bg-pink-100 text-pink-600" },
  ]

  const handleSubmit = async () => {
    // Get values directly from the DOM to avoid delay
    const typeValue = (typeSelectRef.current?.value as string) || type
    const descriptionValue = (descriptionTextareaRef.current?.value as string) || description

    if (!typeValue || !descriptionValue || !fulfillmentMethod) {
      setTouched({ type: true, fulfillmentMethod: true, description: true })
      setAlertHeader("Missing Information")
      setAlertMessage("Please select a material type, fulfillment method, and add a description.")
      setShowAlert(true)
      return
    }

    if (userData?.uid) {
      const limitInfo = await canResidentCreateRequest(userData.uid)
      if (!limitInfo.allowed) {
        setAlertHeader("Daily Limit Reached")
        setAlertMessage(`You can only submit ${limitInfo.limit} requests per day. Please try again tomorrow.`)
        setShowAlert(true)
        return
      }
    }

    try {
      setLoading(true)
      await addDoc(collection(firestore, "materialRequests"), {
        userId: userData?.uid,
        userName: userData?.name,
        type: typeValue,
        description: descriptionValue,
        fulfillmentMethod,
        status: "pending",
        createdAt: serverTimestamp(),
      })
      setAlertHeader("Success!")
      setAlertMessage("Your recycling request has been submitted. A junkshop will contact you soon.")
      setShowAlert(true)
      setType("")
      setDescription("")
      setFulfillmentMethod("")
      if (userData?.uid) {
        const info = await canResidentCreateRequest(userData.uid)
        setDailyLimitInfo({ remaining: info.remaining, limit: info.limit })
      }
      // Navigate after alert is dismissed
    } catch (error: any) {
      console.error("Error submitting request:", error)
      setAlertHeader("Error")
      setAlertMessage(error.message || "Failed to submit request. Please try again.")
      setShowAlert(true)
    } finally {
      setLoading(false)
    }
  }

  // Handle input changes directly without delay
  const handleTypeChange = (e: CustomEvent) => {
    const value = e.detail.value || ""
    setType(value)
  }

  const handleDescriptionChange = (e: CustomEvent) => {
    const value = e.detail.value || ""
    setDescription(value)
  }

  const selectedMaterial = materialTypes.find(m => m.value === type)

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <div className="flex items-center gap-2">
              <IconLeaf className="w-5 h-5 text-green-500" />
              <span>Request Recycling</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-6 mb-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-full">
              <IconLeaf className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Quick Request</h2>
          </div>
          <p className="text-white/80 text-sm">
            Submit a quick pickup request for your recyclable materials
          </p>
        </motion.div>

        {/* Daily Limit Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-700">Daily Requests</span>
          <span className="text-sm font-bold text-blue-700">{dailyLimitInfo.remaining}/{dailyLimitInfo.limit} remaining</span>
        </div>

        {/* Material Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Material Type</h3>
          <div className={`grid grid-cols-3 gap-3 mb-6 ${touched.type && !type ? 'ring-2 ring-red-300 rounded-xl p-1' : ''}`}>
            {materialTypes.map((material, index) => (
              <motion.button
                key={material.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                type="button"
                onClick={() => setType(material.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === material.value 
                    ? "border-green-500 bg-green-50 shadow-md" 
                    : touched.type && !type
                      ? "border-red-300 bg-white hover:border-red-400"
                      : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${material.color}`}>
                  <MaterialIcon type={material.value} className="w-5 h-5" />
                </div>
                <p className={`text-xs font-medium ${type === material.value ? "text-green-700" : "text-gray-600"}`}>
                  {material.label}
                </p>
              </motion.button>
            ))}
          </div>
          {touched.type && !type && <p className="text-red-500 text-xs mt-1 mb-2">Please select a material type</p>}
        </motion.div>

        {/* Fulfillment Method Selection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Fulfillment Method</h3>
          <div className={`grid grid-cols-3 gap-3 mb-6 ${touched.fulfillmentMethod && !fulfillmentMethod ? 'ring-2 ring-red-300 rounded-xl p-1' : ''}`}>
            {[
              { value: "pickup", label: "Pickup", icon: "🚛" },
              { value: "delivery", label: "Delivery", icon: "📦" },
              { value: "other", label: "Other", icon: "📋" },
            ].map((method, index) => (
              <motion.button
                key={method.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                type="button"
                onClick={() => setFulfillmentMethod(method.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  fulfillmentMethod === method.value
                    ? "border-green-500 bg-green-50 shadow-md"
                    : touched.fulfillmentMethod && !fulfillmentMethod
                      ? "border-red-300 bg-white hover:border-red-400"
                      : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-2xl text-center mb-2">{method.icon}</div>
                <p className={`text-xs font-medium text-center ${fulfillmentMethod === method.value ? "text-green-700" : "text-gray-600"}`}>
                  {method.label}
                </p>
              </motion.button>
            ))}
          </div>
          {touched.fulfillmentMethod && !fulfillmentMethod && <p className="text-red-500 text-xs mt-1 mb-2">Please select a fulfillment method</p>}
        </motion.div>

        {/* Hidden Select for form value */}
        <IonSelect 
          value={type} 
          onIonChange={handleTypeChange} 
          ref={typeSelectRef} 
          interface="popover"
          className="hidden"
        >
          {materialTypes.map(m => (
            <IonSelectOption key={m.value} value={m.value}>{m.label}</IonSelectOption>
          ))}
        </IonSelect>

        {/* Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <IonCard className="rounded-xl overflow-hidden shadow-md m-0 mb-6">
            <IonCardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <IconDocument className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-700">Description</h3>
              </div>
              <IonTextarea
                value={description}
                onIonInput={handleDescriptionChange}
                ref={descriptionTextareaRef}
                debounce={0}
                placeholder="Describe your materials (e.g., 5kg of old newspapers, 10 plastic bottles, etc.)"
                rows={4}
                className={`bg-gray-50 rounded-lg p-2 ${touched.description && !description ? 'border-2 border-red-400' : ''}`}
              />
              {touched.description && !description && <p className="text-red-500 text-xs mt-1">Description is required</p>}
            </IonCardContent>
          </IonCard>
        </motion.div>

        {/* Selected Summary */}
        {type && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200"
          >
            <p className="text-sm text-gray-500 mb-2">Selected Material</p>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selectedMaterial?.color}`}>
                <MaterialIcon type={type} className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-800">{selectedMaterial?.label}</span>
            </div>
            {fulfillmentMethod && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Fulfillment Method</p>
                <span className="font-medium text-gray-800 capitalize">{fulfillmentMethod}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <IonButton 
            expand="block" 
            onClick={handleSubmit} 
            disabled={loading}
            className="font-semibold rounded-xl h-12"
            color="success"
          >
            <IconSend className="w-5 h-5 mr-2" />
            Submit Request
          </IonButton>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            For calculated estimates and specific junkshop selection, use the <span className="text-green-600 font-medium">Recycle Calculator</span>
          </p>
        </motion.div>

        {/* Native Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-xl">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-700">Submitting your request...</p>
            </div>
          </div>
        )}

        {/* Native Alert Modal */}
        {showAlert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-bold mb-2">{alertHeader}</h3>
              <p className="text-gray-600 mb-4">{alertMessage}</p>
              <button
                onClick={() => {
                  setShowAlert(false)
                  if (alertHeader === "Success!") {
                    history.push("/app/my-requests")
                  }
                }}
                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  )
}

export default MaterialRequest
