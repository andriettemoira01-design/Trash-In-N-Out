import React, { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { doc, updateDoc } from "firebase/firestore"
import { firestore } from "../firebase"
import { motion, AnimatePresence } from "framer-motion"

const ProfileCompletionCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useAuth()
  const [name, setName] = useState(userData?.name || "")
  const [phone, setPhone] = useState(userData?.phone || "")
  const [address, setAddress] = useState(userData?.address || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Check if profile is complete
  const isProfileComplete = userData?.name && userData?.phone && userData?.address

  if (!userData || isProfileComplete) {
    return <>{children}</>
  }

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("All fields are required")
      return
    }
    try {
      setSaving(true)
      setError("")
      const userRef = doc(firestore, "users", userData.uid)
      await updateDoc(userRef, { name: name.trim(), phone: phone.trim(), address: address.trim() })
      // Reload the page to refresh user data
      window.location.reload()
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="32">
              <path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z" strokeMiterlimit="10"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Complete Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Please fill in your personal details to continue</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save & Continue"}
        </button>
      </motion.div>
    </div>
  )
}

export default ProfileCompletionCheck
