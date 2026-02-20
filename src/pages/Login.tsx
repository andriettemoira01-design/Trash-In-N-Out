"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  IonContent,
  IonPage,
  IonRouterLink,
  IonIcon,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
} from "@ionic/react"
import { 
  mailOutline, 
  lockClosedOutline, 
  leafOutline,
  settingsOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  personOutline,
  businessOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  arrowForwardOutline,
  refreshOutline,
  trashBinOutline,
} from "ionicons/icons"
import { useAuth } from "../contexts/AuthContext"
import { useHistory } from "react-router"
import { motion } from "framer-motion"
import { seedAllData, getSeedCredentials } from "../utils/seedData"

const Login: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastColor, setToastColor] = useState<"danger" | "success" | "warning">("danger")
  const { login } = useAuth()
  const history = useHistory()

  // Setup modal states
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [setupResults, setSetupResults] = useState<any>(null)
  const [credentials, setCredentials] = useState<any[]>([])
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const openSetupModal = () => {
    setShowSetupModal(true)
  }

  const closeSetupModal = () => {
    setShowSetupModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setError("")
      setLoading(true)
      await login(email, password)
      history.push("/app/home")
    } catch (error: any) {
      setError(error.message || "Failed to sign in. Please check your credentials.")
      setToastMessage(error.message || "Failed to sign in. Please check your credentials.")
      setToastColor("danger")
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupData = async () => {
    setSetupLoading(true)
    try {
      const results = await seedAllData()
      setSetupResults(results)
      setCredentials(getSeedCredentials())
      setSetupComplete(true)
      
      if (results.success) {
        setToastMessage("Sample data created successfully!")
        setToastColor("success")
      } else {
        setToastMessage("Some data may not have been created. Check results.")
        setToastColor("warning")
      }
      setShowToast(true)
    } catch (error: any) {
      setToastMessage(error.message || "Failed to create sample data")
      setToastColor("danger")
      setShowToast(true)
    } finally {
      setSetupLoading(false)
    }
  }

  const fillCredentials = (emailVal: string, passwordVal: string) => {
    setEmail(emailVal)
    setPassword(passwordVal)
    closeSetupModal()
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        <div className="min-h-screen flex">
          {/* Left Side - Branding (Hidden on mobile) */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>
            
            {/* Floating Icons */}
            <motion.div 
              className="absolute top-1/4 left-1/4"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <IonIcon icon={trashBinOutline} className="text-3xl text-white" />
              </div>
            </motion.div>
            <motion.div 
              className="absolute top-1/2 right-1/4"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <IonIcon icon={refreshOutline} className="text-2xl text-white" />
              </div>
            </motion.div>
            <motion.div 
              className="absolute bottom-1/3 left-1/3"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3.5, repeat: Infinity }}
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <IonIcon icon={sparklesOutline} className="text-xl text-white" />
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
                  Transform Trash<br />Into Treasure
                </h2>
                <p className="text-xl text-green-100 mb-8 max-w-md">
                  Join our community in making recycling rewarding. Sell your recyclables, earn points, and help save the environment.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                    </div>
                    <span>Earn rewards for recycling</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                    </div>
                    <span>Connect with local junkshops</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                    </div>
                    <span>Track your environmental impact</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              {/* Mobile Logo */}
              <motion.div 
                className="flex flex-col items-center mb-8 lg:hidden"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <IonIcon icon={leafOutline} className="text-4xl text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Trash-In-N-Out</h1>
                <p className="text-gray-500 text-sm">Barangay Recycling Platform</p>
              </motion.div>

              {/* Welcome Text */}
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Welcome back!</h2>
                <p className="text-gray-500">Sign in to continue your recycling journey</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
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
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                      required
                    />
                  </div>
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
                      placeholder="Enter your password"
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
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
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-500 focus:ring-green-500" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-green-600 hover:text-green-700 font-medium">Forgot password?</a>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 transition-all ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  }`}
                >
                  {loading ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      Sign In
                      <IonIcon icon={arrowForwardOutline} className="text-lg" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 lg:bg-white text-gray-500">New to Trash-In-N-Out?</span>
                </div>
              </div>

              {/* Register Link */}
              <IonRouterLink routerLink="/register" className="block">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  className="w-full py-4 rounded-xl font-semibold text-green-600 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                >
                  Create an Account
                </motion.button>
              </IonRouterLink>

              {/* Setup Sample Data Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={openSetupModal}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <IonIcon icon={settingsOutline} className="text-lg" />
                  First time? Setup sample data
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Setup Modal */}
        {showSetupModal && (
          <IonModal 
            isOpen={true} 
            onDidDismiss={closeSetupModal}
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>Setup Sample Data</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={closeSetupModal}>Close</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              {!setupComplete ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <IonIcon icon={settingsOutline} className="text-4xl text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">Initialize Demo Data</h2>
                  <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                    Create sample accounts to explore all features of Trash-In-N-Out
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                      <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <IonIcon icon={shieldCheckmarkOutline} className="text-2xl text-white" />
                      </div>
                      <h3 className="font-bold text-red-700">1 Super Admin</h3>
                      <p className="text-xs text-red-600 mt-1">Full system control</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <IonIcon icon={settingsOutline} className="text-2xl text-white" />
                      </div>
                      <h3 className="font-bold text-orange-700">2 Admins</h3>
                      <p className="text-xs text-orange-600 mt-1">Junkshop managers</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <IonIcon icon={businessOutline} className="text-2xl text-white" />
                      </div>
                      <h3 className="font-bold text-green-700">4 Junkshops</h3>
                      <p className="text-xs text-green-600 mt-1">With unique prices</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <IonIcon icon={personOutline} className="text-2xl text-white" />
                      </div>
                      <h3 className="font-bold text-blue-700">5 Residents</h3>
                      <p className="text-xs text-blue-600 mt-1">Sample users</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSetupData}
                    disabled={setupLoading}
                    className={`w-full max-w-md mx-auto py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg ${
                      setupLoading 
                        ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30 hover:from-green-600 hover:to-emerald-700'
                    }`}
                  >
                    {setupLoading ? (
                      <>
                        <IonSpinner name="crescent" />
                        Creating Data...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={sparklesOutline} className="text-xl" />
                        Create Sample Data
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="py-4">
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 ${setupResults?.success ? 'bg-green-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IonIcon 
                        icon={setupResults?.success ? checkmarkCircleOutline : closeCircleOutline} 
                        className="text-3xl text-white" 
                      />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {setupResults?.success ? "Setup Complete!" : "Setup Partially Complete"}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">Click any account to auto-fill login</p>
                  </div>

                  {/* Credentials Accordion */}
                  <div className="space-y-3">
                    {/* Super Admin */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'superadmin' ? null : 'superadmin')}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <IonIcon icon={shieldCheckmarkOutline} className="text-xl text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">Super Admin</span>
                        </div>
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">1</span>
                      </button>
                      {expandedSection === 'superadmin' && (
                        <div className="p-3 bg-white border-t">
                          {credentials.filter(c => c.role === "superadmin").map((cred, index) => (
                            <motion.div 
                              key={index}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => fillCredentials(cred.email, cred.password)}
                            >
                              <p className="font-semibold text-gray-900">{cred.name}</p>
                              <p className="text-sm text-gray-600">{cred.email}</p>
                              <p className="text-xs text-gray-500 mt-1">Password: {cred.password}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Admins */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'admins' ? null : 'admins')}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <IonIcon icon={settingsOutline} className="text-xl text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">Admins</span>
                        </div>
                        <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">{credentials.filter(c => c.role === "admin").length}</span>
                      </button>
                      {expandedSection === 'admins' && (
                        <div className="p-3 bg-white border-t space-y-2">
                          {credentials.filter(c => c.role === "admin").map((cred, index) => (
                            <motion.div 
                              key={index}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => fillCredentials(cred.email, cred.password)}
                            >
                              <p className="font-semibold text-gray-900">{cred.name}</p>
                              <p className="text-sm text-gray-600">{cred.email}</p>
                              <p className="text-xs text-gray-500 mt-1">Password: {cred.password}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Junkshops */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'junkshops' ? null : 'junkshops')}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <IonIcon icon={businessOutline} className="text-xl text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">Junkshops</span>
                        </div>
                        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">{credentials.filter(c => c.role === "junkshop").length}</span>
                      </button>
                      {expandedSection === 'junkshops' && (
                        <div className="p-3 bg-white border-t space-y-2">
                          {credentials.filter(c => c.role === "junkshop").map((cred, index) => (
                            <motion.div 
                              key={index}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => fillCredentials(cred.email, cred.password)}
                            >
                              <p className="font-semibold text-gray-900">{cred.name}</p>
                              <p className="text-sm text-gray-600">{cred.email}</p>
                              <p className="text-xs text-gray-500 mt-1">Password: {cred.password}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Residents */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'residents' ? null : 'residents')}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <IonIcon icon={personOutline} className="text-xl text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">Residents</span>
                        </div>
                        <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">{credentials.filter(c => c.role === "resident").length}</span>
                      </button>
                      {expandedSection === 'residents' && (
                        <div className="p-3 bg-white border-t space-y-2">
                          {credentials.filter(c => c.role === "resident").map((cred, index) => (
                            <motion.div 
                              key={index}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => fillCredentials(cred.email, cred.password)}
                            >
                              <p className="font-semibold text-gray-900">{cred.name}</p>
                              <p className="text-sm text-gray-600">{cred.email}</p>
                              <p className="text-xs text-gray-500 mt-1">Password: {cred.password}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </IonContent>
          </IonModal>
        )}

        {/* Custom Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl"
            >
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">Signing you in...</span>
            </motion.div>
          </div>
        )}

        {/* Custom Toast */}
        {showToast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`fixed top-4 left-4 right-4 z-[99999] flex justify-center`}
          >
            <div className={`px-6 py-4 rounded-xl shadow-lg text-white font-medium flex items-center gap-3 ${
              toastColor === 'success' ? 'bg-green-500' : 
              toastColor === 'danger' ? 'bg-red-500' : 
              'bg-yellow-500'
            }`}>
              <IonIcon 
                icon={toastColor === 'success' ? checkmarkCircleOutline : closeCircleOutline} 
                className="text-xl" 
              />
              {toastMessage}
            </div>
          </motion.div>
        )}
      </IonContent>
    </IonPage>
  )
}

export default Login
