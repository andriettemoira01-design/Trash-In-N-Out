"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
} from "@ionic/react"
import { useAuth, getUserDataFromStorage } from "../contexts/AuthContext"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore"
import { firestore, storage } from "../firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { motion, AnimatePresence } from "framer-motion"
import { getUserRatings, Rating } from "../services/ratings"

// SVG Icon Components
const IconPerson: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M332.64 64.58C313.18 43.57 286 32 256 32c-30.16 0-57.43 11.5-76.8 32.38c-19.58 21.11-29.12 49.8-26.88 80.78C156.76 206.28 203.27 256 256 256s99.16-49.71 103.67-110.82c2.27-30.7-7.33-59.33-27.03-80.6zM432 480H80a31 31 0 01-24.2-11.13c-6.5-7.77-9.12-18.38-7.18-29.11C57.06 392.94 83.4 353.61 124.8 326c36.78-24.51 83.37-38 131.2-38s94.42 13.5 131.2 38c41.4 27.6 67.74 66.93 76.18 113.75c1.94 10.73-.68 21.34-7.18 29.11A31 31 0 01432 480z"/>
  </svg>
)

const IconMail: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="48" y="96" width="416" height="320" rx="40" ry="40" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M112 160l144 112 144-112" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCall: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M391 480c-19.52 0-46.94-7.06-88-30c-49.93-28-88.55-53.85-138.21-103.38C116.91 298.77 93.61 267.79 61 208.45c-36.84-67-30.56-102.12-23.54-117.13C45.82 73.38 58.16 62.65 74.11 52a176.3 176.3 0 0128.64-15.2c1-.43 1.93-.84 2.76-1.21c4.95-2.23 12.45-5.6 21.95-2c6.34 2.38 12 7.25 20.86 16c18.17 17.92 43 57.83 52.84 77.43c6.37 12.71 10.58 21.13 10.6 30.22c0 11.45-6.23 20-14.66 29.52c-2.38 2.69-4.82 5.28-7.18 7.79c-5.42 5.76-11 11.72-13.33 16.39c-4 8-1.58 16.53 10 36.48c21.44 36.87 50.53 66.86 86.53 89.14c19.12 11.84 28.14 14.81 36.38 10.82c4.77-2.32 10.88-8.15 16.82-14.1c2.44-2.44 4.94-4.96 7.53-7.41c10-9.46 19-16 31.18-16c9.28.06 17.84 4.38 30.94 11.12c21.23 10.93 57.56 33.66 76.89 50.78c8.85 7.84 14.87 13.79 17.56 19.94c3.6 9.59-.15 17.18-2.48 22.25c-.37.83-.78 1.74-1.2 2.75a176.49 176.49 0 01-15.19 28.58c-10.63 15.9-21.4 28.21-39.38 36.58A67.42 67.42 0 01391 480z"/>
  </svg>
)

const IconLocation: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1164-64a64.07 64.07 0 01-64 64z"/>
  </svg>
)

const IconEdit: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z"/>
  </svg>
)

const IconShield: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M479.07 111.36a16 16 0 00-13.15-14.74c-86.5-15.52-122.61-26.74-203.33-63.2a16 16 0 00-13.18 0C168.69 69.88 132.58 81.1 46.08 96.62a16 16 0 00-13.15 14.74c-3.85 61.11 4.36 118.05 24.43 169.24A349.47 349.47 0 00129 393.11c53.47 56.73 110.24 81.37 121.07 85.73a16 16 0 0012.18-.04c10.73-4.29 67.13-28.66 120.76-85.42a349.89 349.89 0 0071.5-112.83c20.04-51.21 28.25-108.18 24.56-169.19z"/>
  </svg>
)

const IconStore: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 448V240M64 240v208M382.47 48H129.53a32 32 0 00-27.43 15.58L48 160h416l-54.1-96.42A32 32 0 00382.47 48z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M464 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32H144v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTrophy: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M464 80H400V64a32 32 0 00-32-32H144a32 32 0 00-32 32v16H48a16 16 0 00-16 16v64c0 52.93 43.06 96 96 96h16c5.7 47.74 37.94 87.57 82 100.42V428h-64a8 8 0 00-8 8v32a8 8 0 008 8h240a8 8 0 008-8v-32a8 8 0 00-8-8h-64v-71.58c44.06-12.85 76.3-52.68 82-100.42h16c52.94 0 96-43.07 96-96V96a16 16 0 00-16-16z"/>
  </svg>
)

const IconRecycle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 48l-112 160h224L256 48zM48 304l112 160V304H48zM464 304H352v160l112-160z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconLogOut: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M304 336v40a40 40 0 01-40 40H104a40 40 0 01-40-40V136a40 40 0 0140-40h152c22.09 0 48 17.91 48 40v40M368 336l80-80-80-80M176 256h256" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconChevronForward: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="48">
    <path d="M184 112l144 144-144 144" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconClose: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M368 368L144 144M368 144L144 368" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconSettings: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="256" cy="256" r="48" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M470.39 300l-.47-.38-31.56-24.75a16.11 16.11 0 01-6.1-13.33v-11.56a16 16 0 016.11-13.22L469.92 212l.47-.38a26.68 26.68 0 005.9-34.06l-42.71-73.9a1.59 1.59 0 01-.13-.22A26.86 26.86 0 00401 92.14l-.35.13-37.1 14.93a15.94 15.94 0 01-14.47-1.29q-4.92-3.1-10-5.86a15.94 15.94 0 01-8.19-11.82l-5.59-39.59-.12-.72A26.92 26.92 0 00298.76 26h-85.52a26.92 26.92 0 00-26.45 21.91l-.13.72-5.6 39.63a16 16 0 01-8.2 11.8c-3.45 1.88-6.81 3.91-10 5.89a15.89 15.89 0 01-14.45 1.27L111.38 92.3l-.34-.13a26.86 26.86 0 00-32.48 11.34l-.13.22-42.77 73.95a26.71 26.71 0 005.9 34.1l.47.38 31.56 24.75a16.11 16.11 0 016.1 13.33v11.56a16 16 0 01-6.11 13.22L42.08 300l-.47.38a26.68 26.68 0 00-5.9 34.06l42.71 73.9a1.59 1.59 0 01.13.22 26.86 26.86 0 0032.45 11.3l.35-.13 37.1-14.93a15.94 15.94 0 0114.47 1.29q4.92 3.1 10 5.86a15.94 15.94 0 018.19 11.82l5.59 39.59.12.72A26.92 26.92 0 00213.24 486h85.52a26.92 26.92 0 0026.45-21.91l.13-.72 5.6-39.63a16 16 0 018.2-11.8c3.45-1.88 6.81-3.91 10-5.89a15.89 15.89 0 0114.45-1.27l37.06 14.93.34.13a26.86 26.86 0 0032.48-11.34l.13-.22 42.77-73.95a26.71 26.71 0 00-5.9-34.1z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconHelp: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="40">
    <circle cx="256" cy="256" r="208" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M200 202.29s.84-17.5 19.57-32.57C230.68 160.77 244 158.18 256 158c10.93-.14 20.69 1.67 26.53 4.45 10 4.76 29.47 16.38 29.47 41.09 0 26-17 37.81-36.37 50.8S251 281.43 251 296" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="250" cy="348" r="20" fill="currentColor"/>
  </svg>
)

const Profile: React.FC = () => {
  const { userData, logout } = useAuth()
  const storedUserData = getUserDataFromStorage()
  const userInfo = userData || storedUserData

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    totalPoints: 0,
    rewardsRedeemed: 0,
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    businessName: "",
    businessAddress: "",
    businessPhone: "",
  })
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [userRatings, setUserRatings] = useState<Rating[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [profileImage, setProfileImage] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  useEffect(() => {
    const fetchStats = async () => {
      if (!userInfo?.uid) {
        setLoading(false)
        return
      }

      try {
        // Fetch material requests
        const requestsRef = collection(firestore, "materialRequests")
        const requestsQuery = query(requestsRef, where("userId", "==", userInfo.uid))
        const requestsSnapshot = await getDocs(requestsQuery)

        let totalRequests = 0
        let completedRequests = 0

        requestsSnapshot.forEach((doc) => {
          totalRequests++
          if (doc.data().status === "completed") {
            completedRequests++
          }
        })

        // Fetch rewards history
        const rewardsRef = collection(firestore, "rewardHistory")
        const rewardsQuery = query(rewardsRef, where("userId", "==", userInfo.uid))
        const rewardsSnapshot = await getDocs(rewardsQuery)

        setStats({
          totalRequests,
          completedRequests,
          totalPoints: userInfo.points || 0,
          rewardsRedeemed: rewardsSnapshot.size,
        })
      } catch (error) {
        console.error("Error fetching stats", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userInfo?.uid, userInfo?.points])

  useEffect(() => {
    if (userInfo) {
      setEditForm({
        name: userInfo.name || "",
        phone: userInfo.phone || "",
        address: userInfo.address || "",
        businessName: userInfo.businessName || "",
        businessAddress: userInfo.businessAddress || "",
        businessPhone: userInfo.businessPhone || "",
      })
      if (userInfo.profileImage) {
        setProfileImage(userInfo.profileImage)
      }
    }
  }, [userInfo])

  useEffect(() => {
    if (userInfo?.uid) {
      getUserRatings(userInfo.uid).then((ratings) => {
        setUserRatings(ratings)
        if (ratings.length > 0) {
          const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          setAverageRating(avg)
        }
      })
    }
  }, [userInfo?.uid])

  const handleRefresh = async (event: CustomEvent) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    event.detail.complete()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userInfo?.uid) return

    if (!file.type.startsWith("image/")) {
      setToastMessage("Please select an image file")
      setShowToast(true)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage("Image must be less than 5MB")
      setShowToast(true)
      return
    }

    try {
      setUploadingImage(true)
      const imageRef = ref(storage, `profileImages/${userInfo.uid}`)
      await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(imageRef)

      const userRef = doc(firestore, "users", userInfo.uid)
      await updateDoc(userRef, { profileImage: downloadURL })

      setProfileImage(downloadURL)
      setToastMessage("Profile image updated")
      setShowToast(true)
    } catch (error) {
      console.error("Error uploading profile image:", error)
      setToastMessage("Error uploading image")
      setShowToast(true)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userInfo?.uid) return

    setSaving(true)

    try {
      const userRef = doc(firestore, "users", userInfo.uid)
      
      // Base update data
      const updateData: Record<string, string> = {
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
      }

      // Add business fields for junkshop owners
      if (userInfo.role === "junkshop") {
        updateData.businessName = editForm.businessName
        updateData.businessAddress = editForm.businessAddress
        updateData.businessPhone = editForm.businessPhone
      }

      await updateDoc(userRef, updateData)

      setToastMessage("Profile updated successfully")
      setShowToast(true)
      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating profile", error)
      setToastMessage("Error updating profile")
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out", error)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return { text: "Super Admin", color: "from-red-500 to-rose-600", icon: <IconShield className="w-4 h-4" /> }
      case "admin":
        return { text: "Administrator", color: "from-purple-500 to-indigo-500", icon: <IconShield className="w-4 h-4" /> }
      case "junkshop_owner":
      case "junkshop":
        return { text: "Junkshop Owner", color: "from-orange-500 to-amber-500", icon: <IconStore className="w-4 h-4" /> }
      default:
        return { text: "Resident", color: "from-emerald-500 to-green-500", icon: <IconRecycle className="w-4 h-4" /> }
    }
  }

  const getAvatarGradient = () => {
    const gradients = [
      "from-emerald-400 to-teal-500",
      "from-blue-400 to-indigo-500",
      "from-purple-400 to-pink-500",
      "from-orange-400 to-red-500",
    ]
    const userName = userInfo?.name || ""
    const index = (userName.charCodeAt(0) || 0) % gradients.length
    return gradients[index]
  }

  const roleBadge = getRoleBadge(userInfo?.role || "resident")

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Header */}
        <div className="relative px-4 pt-12 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -right-10 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute bottom-0 -left-10 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full opacity-10"></div>
            </div>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white"
              >
                <IconEdit className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="px-4 -mt-16 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            <div className="flex flex-col items-center -mt-16">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white overflow-hidden`}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (userInfo?.name || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer border-2 border-gray-100">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="32">
                      <path d="M350.54 148.68l-26.62-42.06C318.31 97.08 310.62 92 302 92h-92c-8.62 0-16.31 5.08-21.92 14.62l-26.62 42.06C155.85 155.23 148.62 160 140 160H80a32 32 0 00-32 32v208a32 32 0 0032 32h352a32 32 0 0032-32V192a32 32 0 00-32-32h-60c-8.65 0-15.85-4.77-21.46-11.32z" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="256" cy="272" r="80" strokeMiterlimit="10"/>
                    </svg>
                  )}
                </label>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mt-3">{userInfo?.name || "User"}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-gradient-to-r ${roleBadge.color} text-white text-xs font-medium shadow-md`}>
                {roleBadge.icon}
                {roleBadge.text}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <IconMail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-700">{userInfo?.email || "Not set"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <IconCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-700">{userInfo?.phone || "Not set"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <IconLocation className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-700">{userInfo?.address || "Not set"}</p>
                </div>
              </div>

              {/* Business Information for Junkshop Owners */}
              {userInfo?.role === "junkshop" && (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <IconStore className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Business Info</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <IconStore className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-orange-500">Business Name</p>
                      <p className="text-sm font-medium text-gray-700">{userInfo?.businessName || "Not set"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <IconCall className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-orange-500">Business Phone</p>
                      <p className="text-sm font-medium text-gray-700">{userInfo?.businessPhone || "Not set"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <IconLocation className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-orange-500">Business Address</p>
                      <p className="text-sm font-medium text-gray-700">{userInfo?.businessAddress || "Not set"}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <div className="px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">My Statistics</h3>
            
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4">
                    <IonSkeletonText animated style={{ width: "60%", height: "32px" }} />
                    <IonSkeletonText animated style={{ width: "80%", height: "14px", marginTop: "8px" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IconTrophy className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
                  <p className="text-xs text-white/80">Total Points</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IconRecycle className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                  <p className="text-xs text-white/80">Total Requests</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill="currentColor">
                      <path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z"/>
                    </svg>
                  </div>
                  <p className="text-2xl font-bold">{stats.completedRequests}</p>
                  <p className="text-xs text-white/80">Completed</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-6 h-6" fill="currentColor">
                      <path d="M346 110a34 34 0 00-68 0v34h68zm-102 0a34 34 0 10-68 0v34h68z"/>
                      <path d="M234 144h44v112h-44z"/>
                      <path d="M432 144H80a16 16 0 00-16 16v56a16 16 0 0016 16h352a16 16 0 0016-16v-56a16 16 0 00-16-16z"/>
                      <path d="M96 256v192a32 32 0 0032 32h120V256zm168 224h120a32 32 0 0032-32V256H264z"/>
                    </svg>
                  </div>
                  <p className="text-2xl font-bold">{stats.rewardsRedeemed}</p>
                  <p className="text-xs text-white/80">Rewards Redeemed</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Ratings Section */}
        <div className="px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5 text-yellow-500" fill="currentColor">
                  <path d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2A16 16 0 0132 192h127.78l48.72-148.24a16 16 0 0130.5 0L288.22 192H416a16 16 0 019.05 28.8L295 310.35 345.16 459a16 16 0 01-15.16 21z"/>
                </svg>
                Ratings & Reviews
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl font-bold text-gray-800">{averageRating.toFixed(1)}</div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={`w-5 h-5 ${star <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor">
                        <path d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2A16 16 0 0132 192h127.78l48.72-148.24a16 16 0 0130.5 0L288.22 192H416a16 16 0 019.05 28.8L295 310.35 345.16 459a16 16 0 01-15.16 21z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">{userRatings.length} review{userRatings.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {userRatings.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {userRatings.slice(0, 5).map((rating, index) => (
                    <div key={rating.id || index} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-700">{rating.fromUserName}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={`w-3 h-3 ${star <= rating.rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor">
                              <path d="M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2A16 16 0 0132 192h127.78l48.72-148.24a16 16 0 0130.5 0L288.22 192H416a16 16 0 019.05 28.8L295 310.35 345.16 459a16 16 0 01-15.16 21z"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      {rating.comment && <p className="text-sm text-gray-600">{rating.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No reviews yet</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Menu Section */}
        <div className="px-4 mt-6 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Settings</h3>
            
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <IconSettings className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-700">Account Settings</span>
                </div>
                <IconChevronForward className="w-5 h-5 text-gray-400" />
              </button>

              <button 
                onClick={() => setShowHelpModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <IconHelp className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-700">Help & Support</span>
                </div>
                <IconChevronForward className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <IconLogOut className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-red-600">Log Out</span>
                </div>
                <IconChevronForward className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </motion.div>
        </div>

        {createPortal(<>
        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[65vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-800">Edit Profile</h2>
                  <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <IconClose className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        placeholder="Your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        placeholder="Your address"
                      />
                    </div>

                    {/* Business Fields for Junkshop Owners */}
                    {userInfo?.role === "junkshop" && (
                      <>
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex items-center gap-2 mb-3">
                            <IconStore className="w-4 h-4 text-orange-500" />
                            <h3 className="text-sm font-semibold text-gray-800">Business Information</h3>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
                          <input
                            type="text"
                            value={editForm.businessName}
                            onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                            className="w-full px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                            placeholder="Your business name"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Business Phone</label>
                          <input
                            type="tel"
                            value={editForm.businessPhone}
                            onChange={(e) => setEditForm({ ...editForm, businessPhone: e.target.value })}
                            className="w-full px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                            placeholder="Business phone number"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Business Address</label>
                          <input
                            type="text"
                            value={editForm.businessAddress}
                            onChange={(e) => setEditForm({ ...editForm, businessAddress: e.target.value })}
                            className="w-full px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                            placeholder="Business address"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Sticky Footer Buttons */}
                <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconLogOut className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Log Out?</h2>
                  <p className="text-gray-500 mb-6">Are you sure you want to log out of your account?</p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowSettingsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl max-h-[65vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Account Settings</h2>
                  <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <IconClose className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => { setShowSettingsModal(false); setShowEditModal(true); }}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <IconEdit className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-700">Edit Profile</p>
                      <p className="text-xs text-gray-500">Update your personal information</p>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help & Support Modal */}
        <AnimatePresence>
          {showHelpModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowHelpModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl max-h-[65vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Help & Support</h2>
                  <button onClick={() => setShowHelpModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <IconClose className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowFaqModal(true)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <IconHelp className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-700">FAQs</p>
                      <p className="text-xs text-gray-500">Frequently asked questions</p>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <IconMail className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-700">Contact Us</p>
                      <p className="text-xs text-gray-500">support@recyclemate.app</p>
                    </div>
                  </button>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-center text-sm text-gray-500">RecycleMate v1.0.0</p>
                    <p className="text-center text-xs text-gray-400 mt-1">© 2026 RecycleMate. All rights reserved.</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ Modal */}
        <AnimatePresence>
          {showFaqModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={() => setShowFaqModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl max-h-[65vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-800">Frequently Asked Questions</h2>
                  <button onClick={() => setShowFaqModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <IconClose className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { q: "What is RecycleMate?", a: "RecycleMate is a community-driven recycling app that connects residents with junkshop owners to make recycling easier and more rewarding. You can submit material requests, track pickups, and earn rewards for recycling." },
                    { q: "How do I submit a material request?", a: "Go to the Map page, tap 'Submit Request', fill in the material details and pickup location, then submit. A nearby junkshop owner will be notified and can accept your request." },
                    { q: "How does the rewards system work?", a: "You earn points for every successful recycling transaction. Points can be redeemed for rewards in the Rewards page. The more you recycle, the more points you earn!" },
                    { q: "How are material prices determined?", a: "Material prices are set by the admin based on current market rates. You can check the latest prices in the Recycle Calculator to estimate the value of your materials." },
                    { q: "Is my personal information safe?", a: "Yes! We take data privacy seriously. Your personal information is securely stored and only shared with junkshop owners when you submit a pickup request." },
                    { q: "How do I contact support?", a: "You can reach our support team at support@recyclemate.app. We typically respond within 24 hours." },
                    { q: "Can I cancel a material request?", a: "Yes, you can cancel a pending request from the My Requests page. Once a request has been accepted by a junkshop, please contact the junkshop directly." },
                    { q: "How do I become a junkshop partner?", a: "Register an account and select 'Junkshop Owner' as your role during registration. You'll need to provide your business details for verification." },
                  ].map((faq, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <span className="font-medium text-gray-700 pr-4">{faq.q}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="48"
                        >
                          <path d="M112 184l144 144 144-144" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <AnimatePresence>
                        {expandedFaq === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowFaqModal(false)}
                  className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
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
              className="fixed bottom-24 left-4 right-4 bg-gray-800 text-white p-4 rounded-2xl shadow-xl z-50"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="32">
                  <path d="M464 128L240 384l-96-96M144 384l-96-96M368 128L232 284" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-medium flex-1">{toastMessage}</span>
                <button onClick={() => setShowToast(false)}>
                  <IconClose className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </>, document.body)}

        <div className="text-center py-4 mt-6 mb-4">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Trash-In-N-Out. All rights reserved.</p>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Profile
