"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  IonContent,
  IonPage,
  IonRouterLink,
  IonIcon,
} from "@ionic/react"
import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  arrowBackOutline,
  storefrontOutline,
  locationOutline,
  callOutline,
  leafOutline,
  homeOutline,
  businessOutline,
  checkmarkCircleOutline,
  arrowForwardOutline,
  sparklesOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons"
import { useAuth } from "../contexts/AuthContext"
import { sendNewUserNotification } from "../services/notifications"
import { useHistory } from "react-router"
import { motion, AnimatePresence } from "framer-motion"

const Register: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [role, setRole] = useState<"resident" | "junkshop">("resident")
  const [businessName, setBusinessName] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [step, setStep] = useState(1) // Multi-step form
  const [touched, setTouched] = useState<{[key: string]: boolean}>({})
  const { register } = useAuth()
  const history = useHistory()
  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(prev => ({ ...prev, password: true, confirmPassword: true }))

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setShowToast(true)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setShowToast(true)
      return
    }

    // Validate junkshop fields
    if (role === "junkshop") {
      if (!businessName.trim()) {
        setError("Business name is required for junkshop owners")
        setShowToast(true)
        return
      }
      if (!businessAddress.trim()) {
        setError("Business address is required for junkshop owners")
        setShowToast(true)
        return
      }
    }

    try {
      setError("")
      setLoading(true)
      
      // Prepare additional data for junkshop
      const additionalData = {
        phone: phone.trim(),
        address: address.trim(),
        ...(role === "junkshop" ? {
          businessName: businessName.trim(),
          businessAddress: businessAddress.trim(),
          businessPhone: businessPhone.trim(),
          isActive: true,
        } : {}),
      }
      
      await register(email, password, name, role, additionalData)
      await sendNewUserNotification(name, role)
      history.push("/app/home")
    } catch (error: any) {
      setError(error.message || "Failed to create an account")
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep2 = name.trim() && email.trim() && phone.trim() && address.trim()
  const canProceedToStep3 = role === "resident" || (businessName.trim() && businessAddress.trim())

  const nextStep = () => {
    if (step === 1 && canProceedToStep2) {
      setStep(2)
    } else if (step === 2 && canProceedToStep3) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl"
            >
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">Creating your account...</span>
            </motion.div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-4 left-4 right-4 z-[99999] flex justify-center"
          >
            <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
              <button onClick={() => setShowToast(false)} className="ml-2 hover:bg-white/20 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        <div className="min-h-screen flex">
          {/* Left Side - Branding (Hidden on mobile) */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>
            
            {/* Floating Icons */}
            <motion.div 
              className="absolute top-1/4 right-1/4"
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <IonIcon icon={leafOutline} className="text-3xl text-white" />
              </div>
            </motion.div>
            <motion.div 
              className="absolute top-1/2 left-1/4"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <IonIcon icon={sparklesOutline} className="text-2xl text-white" />
              </div>
            </motion.div>
            <motion.div 
              className="absolute bottom-1/4 right-1/3"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3.5, repeat: Infinity }}
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <IonIcon icon={shieldCheckmarkOutline} className="text-xl text-white" />
              </div>
            </motion.div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                    <IonIcon icon={leafOutline} className="text-3xl text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Trash-In-N-Out</h1>
                    <p className="text-green-100">Barangay Recycling Platform</p>
                  </div>
                </div>

                <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                  Start Your<br />Green Journey
                </h2>
                <p className="text-xl text-green-100 mb-8 max-w-md">
                  Join thousands of eco-warriors making a difference. Every recyclable counts towards a cleaner community.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                    </div>
                    <span>Free to join and use</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                    </div>
                    <span>Instant rewards for recycling</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                    </div>
                    <span>Support local junkshop businesses</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-b from-gray-50 to-white px-4 py-6 lg:px-12 lg:py-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md mx-auto"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => step > 1 ? prevStep() : history.push('/login')} 
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <IonIcon icon={arrowBackOutline} className="text-xl text-gray-600" />
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
                  <p className="text-gray-500 text-sm">Step {step} of 3</p>
                </div>
                {/* Mobile Logo */}
                <div className="lg:hidden w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <IonIcon icon={leafOutline} className="text-2xl text-white" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      s <= step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {/* Step 1: Personal Info */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IonIcon icon={personOutline} className="text-3xl text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                        <p className="text-gray-500 text-sm">Tell us about yourself</p>
                      </div>

                      {/* Name Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <IonIcon icon={personOutline} className="text-gray-400 text-xl" />
                          </div>
                          <input
                            type="text"
                            value={name}
                            placeholder="Juan Dela Cruz"
                            onChange={(e) => setName(e.target.value)}
                            onBlur={() => markTouched('name')}
                            className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none ${touched.name && !name.trim() ? 'border-red-500' : 'border-gray-200'}`}
                            required
                          />
                        </div>
                        {touched.name && !name.trim() && <p className="text-red-500 text-xs mt-1">This field is required</p>}
                      </div>

                      {/* Email Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <IonIcon icon={mailOutline} className="text-gray-400 text-xl" />
                          </div>
                          <input
                            type="email"
                            value={email}
                            placeholder="you@example.com"
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => markTouched('email')}
                            className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none ${touched.email && !email.trim() ? 'border-red-500' : 'border-gray-200'}`}
                            required
                          />
                        </div>
                        {touched.email && !email.trim() && <p className="text-red-500 text-xs mt-1">This field is required</p>}
                      </div>

                      {/* Phone Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          onBlur={() => markTouched('phone')}
                          placeholder="Enter your phone number"
                          className={`w-full px-4 py-3 bg-gray-50 border ${touched.phone && !phone ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 text-gray-800`}
                        />
                        {touched.phone && !phone && <p className="text-red-500 text-xs mt-1">Phone number is required</p>}
                      </div>

                      {/* Address Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Address <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          onBlur={() => markTouched('address')}
                          placeholder="Enter your address"
                          className={`w-full px-4 py-3 bg-gray-50 border ${touched.address && !address ? 'border-red-500' : 'border-gray-200'} rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 text-gray-800`}
                        />
                        {touched.address && !address && <p className="text-red-500 text-xs mt-1">Address is required</p>}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={() => { setTouched(prev => ({ ...prev, name: true, email: true, phone: true, address: true })); nextStep(); }}
                        disabled={!canProceedToStep2}
                        className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                          canProceedToStep2
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-emerald-700'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Continue
                        <IonIcon icon={arrowForwardOutline} className="text-lg" />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Step 2: Role Selection */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IonIcon icon={businessOutline} className="text-3xl text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Choose Your Role</h2>
                        <p className="text-gray-500 text-sm">How will you use Trash-In-N-Out?</p>
                      </div>

                      {/* Role Selection Cards */}
                      <div className="grid grid-cols-1 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setRole("resident")}
                          className={`p-6 rounded-2xl border-2 text-left transition-all ${
                            role === "resident" 
                              ? "border-green-500 bg-green-50 shadow-lg shadow-green-500/20" 
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                              role === "resident" ? "bg-green-500" : "bg-gray-100"
                            }`}>
                              <IonIcon 
                                icon={homeOutline} 
                                className={`text-2xl ${role === "resident" ? "text-white" : "text-gray-500"}`} 
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className={`text-lg font-semibold ${role === "resident" ? "text-green-700" : "text-gray-800"}`}>
                                Resident
                              </h3>
                              <p className="text-gray-500 text-sm mt-1">
                                Sell your recyclables to local junkshops and earn rewards for helping the environment
                              </p>
                            </div>
                            {role === "resident" && (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <IonIcon icon={checkmarkCircleOutline} className="text-white" />
                              </div>
                            )}
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setRole("junkshop")}
                          className={`p-6 rounded-2xl border-2 text-left transition-all ${
                            role === "junkshop" 
                              ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20" 
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                              role === "junkshop" ? "bg-blue-500" : "bg-gray-100"
                            }`}>
                              <IonIcon 
                                icon={storefrontOutline} 
                                className={`text-2xl ${role === "junkshop" ? "text-white" : "text-gray-500"}`} 
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className={`text-lg font-semibold ${role === "junkshop" ? "text-blue-700" : "text-gray-800"}`}>
                                Junkshop Owner
                              </h3>
                              <p className="text-gray-500 text-sm mt-1">
                                Connect with residents, manage your business, and grow your recycling network
                              </p>
                            </div>
                            {role === "junkshop" && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <IonIcon icon={checkmarkCircleOutline} className="text-white" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      </div>

                      {/* Junkshop Additional Fields */}
                      <AnimatePresence>
                        {role === "junkshop" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                          >
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                              <p className="text-sm font-medium text-blue-700 mb-4 flex items-center gap-2">
                                <IonIcon icon={businessOutline} />
                                Business Information
                              </p>
                              
                              {/* Business Name */}
                              <div className="mb-3">
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <IonIcon icon={storefrontOutline} className="text-blue-400 text-lg" />
                                  </div>
                                  <input
                                    type="text"
                                    value={businessName}
                                    placeholder="Business/Shop Name"
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-lg text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                  />
                                </div>
                              </div>

                              {/* Business Address */}
                              <div className="mb-3">
                                <div className="relative">
                                  <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                                    <IonIcon icon={locationOutline} className="text-blue-400 text-lg" />
                                  </div>
                                  <textarea
                                    value={businessAddress}
                                    placeholder="Complete Business Address"
                                    onChange={(e) => setBusinessAddress(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-lg text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                                    rows={2}
                                  />
                                </div>
                              </div>

                              {/* Business Phone */}
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <IonIcon icon={callOutline} className="text-blue-400 text-lg" />
                                </div>
                                <input
                                  type="tel"
                                  value={businessPhone}
                                  placeholder="Contact Number (Optional)"
                                  onChange={(e) => setBusinessPhone(e.target.value)}
                                  className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-lg text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceedToStep3}
                        className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                          canProceedToStep3
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-emerald-700'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Continue
                        <IonIcon icon={arrowForwardOutline} className="text-lg" />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Step 3: Password */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IonIcon icon={lockClosedOutline} className="text-3xl text-purple-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Secure Your Account</h2>
                        <p className="text-gray-500 text-sm">Create a strong password</p>
                      </div>

                      {/* Password Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <IonIcon icon={lockClosedOutline} className="text-gray-400 text-xl" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            placeholder="Min. 6 characters"
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => markTouched('password')}
                            className={`w-full pl-12 pr-12 py-4 bg-white border-2 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none ${touched.password && !password ? 'border-red-500' : 'border-gray-200'}`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {touched.password && !password && <p className="text-red-500 text-xs mt-1">This field is required</p>}
                        {/* Password Strength Indicator */}
                        {password && (
                          <div className="mt-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div 
                                  key={level}
                                  className={`h-1 flex-1 rounded-full ${
                                    password.length >= level * 3 
                                      ? level <= 2 ? 'bg-red-400' : level === 3 ? 'bg-yellow-400' : 'bg-green-500'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className={`text-xs mt-1 ${
                              password.length < 6 ? 'text-red-500' : password.length < 9 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {password.length < 6 ? 'Too weak' : password.length < 9 ? 'Fair' : 'Strong'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <IonIcon icon={lockClosedOutline} className="text-gray-400 text-xl" />
                          </div>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            placeholder="Confirm your password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onBlur={() => markTouched('confirmPassword')}
                            className={`w-full pl-12 pr-12 py-4 bg-white border-2 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-4 transition-all outline-none ${
                              touched.confirmPassword && !confirmPassword
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                : confirmPassword && confirmPassword !== password 
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                                  : confirmPassword && confirmPassword === password
                                    ? 'border-green-300 focus:border-green-500 focus:ring-green-100'
                                    : 'border-gray-200 focus:border-green-500 focus:ring-green-100'
                            }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {confirmPassword && confirmPassword !== password && (
                          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                        {touched.confirmPassword && !confirmPassword && (
                          <p className="text-red-500 text-xs mt-1">This field is required</p>
                        )}
                      </div>

                      {/* Terms */}
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          required
                          className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500 mt-0.5" 
                        />
                        <span className="text-sm text-gray-600">
                          I agree to help reduce waste and promote recycling in our community. By creating an account, I accept the Terms of Service and Privacy Policy.
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading || password !== confirmPassword || password.length < 6}
                        className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                          !loading && password === confirmPassword && password.length >= 6
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-emerald-700'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <IonIcon icon={arrowForwardOutline} className="text-lg" />
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Link */}
                <div className="text-center mt-8">
                  <span className="text-gray-500">Already have an account? </span>
                  <IonRouterLink routerLink="/login" className="text-green-600 font-semibold hover:text-green-700">
                    Sign In
                  </IonRouterLink>
                </div>
              </form>
            </motion.div>
          </div>
        </div>

        <div className="text-center py-4 mt-6 mb-4">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Trash-In-N-Out. All rights reserved.</p>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Register
