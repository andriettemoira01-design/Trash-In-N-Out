"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
} from "@ionic/react"
import { useAuth } from "../contexts/AuthContext"
import { collection, query, getDocs, doc, updateDoc, addDoc, Timestamp, where, orderBy } from "firebase/firestore"
import { firestore } from "../firebase"
import { motion, AnimatePresence } from "framer-motion"

// SVG Icon Components
const IconTrophy: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M464 80H400V64a32 32 0 00-32-32H144a32 32 0 00-32 32v16H48a16 16 0 00-16 16v64c0 52.93 43.06 96 96 96h16c5.7 47.74 37.94 87.57 82 100.42V428h-64a8 8 0 00-8 8v32a8 8 0 008 8h240a8 8 0 008-8v-32a8 8 0 00-8-8h-64v-71.58c44.06-12.85 76.3-52.68 82-100.42h16c52.94 0 96-43.07 96-96V96a16 16 0 00-16-16zM96 224a64.07 64.07 0 01-64-64v-48h80v48a194.84 194.84 0 006.77 50.23A64.07 64.07 0 0196 224zm320 0a64.07 64.07 0 01-22.77-13.77A194.84 194.84 0 00400 160v-48h80v48a64.07 64.07 0 01-64 64z"/>
  </svg>
)

const IconGift: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M346 110a34 34 0 00-68 0v34h34a34 34 0 0034-34zM234 110a34 34 0 10-34 34h34z"/>
    <path d="M234 144h44v112H120v-92a20 20 0 0120-20h94zM278 256h114v-92a20 20 0 00-20-20h-94z"/>
    <path d="M480 320v112a64 64 0 01-64 64H278V320zM234 320v176H96a64 64 0 01-64-64V320z"/>
  </svg>
)

const IconTime: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64z" strokeMiterlimit="10"/>
    <path d="M256 128v144h96" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconStar: React.FC<{ className?: string; filled?: boolean }> = ({ className, filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="32">
    <path d="M480 208H308L256 48l-52 160H32l140 96-54 160 138-100 138 100-54-160z" strokeLinejoin="round"/>
  </svg>
)

const IconCheckmark: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M416 128L192 384l-96-96" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconClose: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M368 368L144 144M368 144L144 368" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconLeaf: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M321.89 171.42C233 114 141 155.22 56 65.22c-19.8-21-8.3 235.5 98.1 332.7 77.79 71 197.9 63.08 238.4-5.92s18.28-163.17-70.61-220.58zM173 253c86 81 175 129 292 147" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconHistory: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192" strokeMiterlimit="10" strokeLinecap="round"/>
    <path d="M256 128v144l96 64M64 256H32M256 448v32M448 256h32M256 64V32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface Reward {
  id: string
  title: string
  description: string
  pointsCost: number
  image: string
  available: boolean
  category?: string
}

interface RedemptionHistory {
  id: string
  userId: string
  userName: string
  rewardId: string
  rewardTitle: string
  pointsCost: number
  redeemedAt: Date
  status: "pending" | "completed"
}

const Rewards: React.FC = () => {
  const { userData } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertType, setAlertType] = useState<"success" | "error">("success")
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"rewards" | "history">("rewards")
  const [isRedeeming, setIsRedeeming] = useState(false)

  useEffect(() => {
    fetchRewards()
    fetchRedemptionHistory()
  }, [userData])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const rewardsRef = collection(firestore, "rewards")
      const q = query(rewardsRef, where("available", "==", true))
      const querySnapshot = await getDocs(q)
      const rewardsList: Reward[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        rewardsList.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          pointsCost: data.pointsCost,
          image: data.image,
          available: data.available,
          category: data.category || "general",
        })
      })

      // Sort by points cost
      rewardsList.sort((a, b) => a.pointsCost - b.pointsCost)
      setRewards(rewardsList)
    } catch (error) {
      console.error("Error fetching rewards", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRedemptionHistory = async () => {
    if (!userData) return

    try {
      const redemptionsRef = collection(firestore, "redemptions")
      const q = query(redemptionsRef, where("userId", "==", userData.uid), orderBy("redeemedAt", "desc"))
      const querySnapshot = await getDocs(q)
      const redemptionsList: RedemptionHistory[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        redemptionsList.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          rewardId: data.rewardId,
          rewardTitle: data.rewardTitle,
          pointsCost: data.pointsCost,
          redeemedAt: data.redeemedAt.toDate(),
          status: data.status,
        })
      })

      setRedemptionHistory(redemptionsList)
    } catch (error) {
      console.error("Error fetching redemption history", error)
    }
  }

  const handleRedeemReward = (reward: Reward) => {
    if (!userData) return

    if (userData.points < reward.pointsCost) {
      setAlertMessage("You don't have enough points to redeem this reward.")
      setAlertType("error")
      setShowAlert(true)
      return
    }

    setSelectedReward(reward)
    setShowConfirmModal(true)
  }

  const confirmRedemption = async () => {
    if (!userData || !selectedReward) return

    try {
      setIsRedeeming(true)

      // Create redemption record
      await addDoc(collection(firestore, "redemptions"), {
        userId: userData.uid,
        userName: userData.name,
        rewardId: selectedReward.id,
        rewardTitle: selectedReward.title,
        pointsCost: selectedReward.pointsCost,
        redeemedAt: Timestamp.now(),
        status: "pending",
      })

      // Update user points
      const userRef = doc(firestore, "users", userData.uid)
      await updateDoc(userRef, {
        points: userData.points - selectedReward.pointsCost,
      })

      // Create notification
      await addDoc(collection(firestore, "notifications"), {
        userId: userData.uid,
        title: "Reward Redeemed",
        message: `You have successfully redeemed ${selectedReward.title} for ${selectedReward.pointsCost} points.`,
        read: false,
        deleted: false,
        createdAt: Timestamp.now(),
        type: "reward",
      })

      setAlertMessage("Reward redeemed successfully! 🎉")
      setAlertType("success")
      setShowAlert(true)
      setShowConfirmModal(false)
      setSelectedReward(null)

      // Refresh data
      fetchRedemptionHistory()
    } catch (error) {
      console.error("Error redeeming reward", error)
      setAlertMessage("Error redeeming reward. Please try again.")
      setAlertType("error")
      setShowAlert(true)
    } finally {
      setIsRedeeming(false)
    }
  }

  const getNextTierPoints = () => {
    const points = userData?.points || 0
    if (points < 100) return 100
    if (points < 500) return 500
    if (points < 1000) return 1000
    if (points < 5000) return 5000
    return points + 1000
  }

  const getCurrentTier = () => {
    const points = userData?.points || 0
    if (points < 100) return { name: "Bronze", color: "from-amber-600 to-amber-700", icon: "🥉" }
    if (points < 500) return { name: "Silver", color: "from-gray-400 to-gray-500", icon: "🥈" }
    if (points < 1000) return { name: "Gold", color: "from-yellow-400 to-amber-500", icon: "🥇" }
    if (points < 5000) return { name: "Platinum", color: "from-cyan-400 to-blue-500", icon: "💎" }
    return { name: "Diamond", color: "from-purple-400 to-pink-500", icon: "👑" }
  }

  const getTierProgress = () => {
    const points = userData?.points || 0
    const nextTier = getNextTierPoints()
    const prevTier = nextTier === 100 ? 0 : nextTier === 500 ? 100 : nextTier === 1000 ? 500 : nextTier === 5000 ? 1000 : nextTier - 1000
    return ((points - prevTier) / (nextTier - prevTier)) * 100
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleRefresh = async (event: CustomEvent) => {
    try {
      await Promise.all([fetchRewards(), fetchRedemptionHistory()])
    } finally {
      event.detail.complete()
    }
  }

  const tier = getCurrentTier()

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Header with Points */}
        <div className="relative px-4 pt-12 pb-6 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${tier.color}`}>
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
              <div>
                <p className="text-white/80 text-sm font-medium">Your Balance</p>
                <div className="flex items-center gap-2">
                  <IconLeaf className="w-8 h-8 text-white" />
                  <span className="text-4xl font-bold text-white">{userData?.points || 0}</span>
                  <span className="text-white/80 text-lg">pts</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-4xl">{tier.icon}</span>
                <p className="text-white font-semibold text-sm">{tier.name} Tier</p>
              </div>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30"
            >
              <div className="flex justify-between text-white text-sm mb-2">
                <span>{userData?.points || 0} pts</span>
                <span>{getNextTierPoints()} pts</span>
              </div>
              <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${getTierProgress()}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
              <p className="text-white/80 text-xs mt-2 text-center">
                {getNextTierPoints() - (userData?.points || 0)} points until next tier
              </p>
            </motion.div>
          </div>
        </div>

        <div className="px-4 -mt-2">
          {/* Tab Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-100 rounded-2xl p-1.5 flex mb-6"
          >
            <button
              onClick={() => setActiveTab("rewards")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === "rewards"
                  ? "bg-white text-gray-800 shadow-md"
                  : "text-gray-500"
              }`}
            >
              <IconGift className="w-5 h-5" />
              Rewards
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === "history"
                  ? "bg-white text-gray-800 shadow-md"
                  : "text-gray-500"
              }`}
            >
              <IconHistory className="w-5 h-5" />
              History
            </button>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === "rewards" ? (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <IconGift className="w-6 h-6 text-green-500" />
                  Available Rewards
                </h2>

                {loading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 shadow-md">
                        <IonSkeletonText animated style={{ width: "100%", height: "120px", borderRadius: "12px" }} />
                        <IonSkeletonText animated style={{ width: "60%", height: "20px", marginTop: "12px" }} />
                        <IonSkeletonText animated style={{ width: "40%", height: "16px", marginTop: "8px" }} />
                      </div>
                    ))}
                  </div>
                ) : rewards.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 mb-20">
                    {rewards.map((reward, index) => {
                      const canAfford = (userData?.points || 0) >= reward.pointsCost
                      return (
                        <motion.div
                          key={reward.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                        >
                          <div className="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center relative overflow-hidden">
                            {reward.image ? (
                              <img
                                src={reward.image}
                                alt={reward.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-green-600">
                                <IconGift className="w-12 h-12 mb-2" />
                              </div>
                            )}
                            {!canAfford && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="bg-white/90 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700">
                                  Need {reward.pointsCost - (userData?.points || 0)} more pts
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-gray-800">{reward.title}</h3>
                              <div className="flex items-center gap-1 bg-green-100 px-2.5 py-1 rounded-full">
                                <IconLeaf className="w-4 h-4 text-green-600" />
                                <span className="text-green-700 font-bold text-sm">{reward.pointsCost}</span>
                              </div>
                            </div>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{reward.description}</p>
                            <motion.button
                              whileHover={{ scale: canAfford ? 1.02 : 1 }}
                              whileTap={{ scale: canAfford ? 0.98 : 1 }}
                              onClick={() => canAfford && handleRedeemReward(reward)}
                              disabled={!canAfford}
                              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                                canAfford
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {canAfford ? "Redeem Now" : "Not Enough Points"}
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconGift className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No rewards available</p>
                    <p className="text-sm text-gray-400 mt-1">Check back later for new rewards!</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <IconHistory className="w-6 h-6 text-blue-500" />
                  Redemption History
                </h2>

                {redemptionHistory.length > 0 ? (
                  <div className="space-y-3 mb-20">
                    {redemptionHistory.map((redemption, index) => (
                      <motion.div
                        key={redemption.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-2xl p-4 shadow-md border border-gray-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            redemption.status === "completed" 
                              ? "bg-green-100" 
                              : "bg-yellow-100"
                          }`}>
                            {redemption.status === "completed" ? (
                              <IconCheckmark className="w-6 h-6 text-green-600" />
                            ) : (
                              <IconTime className="w-6 h-6 text-yellow-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{redemption.rewardTitle}</h4>
                            <p className="text-sm text-gray-500">{formatDate(redemption.redeemedAt)}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-red-500 font-bold">
                              <span>-{redemption.pointsCost}</span>
                              <IconLeaf className="w-4 h-4" />
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              redemption.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {redemption.status}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconHistory className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No redemption history</p>
                    <p className="text-sm text-gray-400 mt-1">Your redeemed rewards will appear here</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Confirm Modal */}
        <AnimatePresence>
          {showConfirmModal && selectedReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => !isRedeeming && setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <IconGift className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Confirm Redemption</h3>
                  <p className="text-gray-500 mt-2">
                    Redeem <span className="font-semibold text-gray-800">{selectedReward.title}</span> for{" "}
                    <span className="font-semibold text-green-600">{selectedReward.pointsCost} points</span>?
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current Balance</span>
                    <span className="font-semibold">{userData?.points || 0} pts</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Cost</span>
                    <span className="font-semibold text-red-500">-{selectedReward.pointsCost} pts</span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">New Balance</span>
                    <span className="font-bold text-green-600">
                      {(userData?.points || 0) - selectedReward.pointsCost} pts
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isRedeeming}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRedemption}
                    disabled={isRedeeming}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRedeeming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Redeeming...</span>
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert Toast */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-24 left-4 right-4 p-4 rounded-2xl shadow-xl z-50 ${
                alertType === "success" 
                  ? "bg-green-500 text-white" 
                  : "bg-red-500 text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {alertType === "success" ? (
                  <IconCheckmark className="w-6 h-6" />
                ) : (
                  <IconClose className="w-6 h-6" />
                )}
                <span className="font-medium flex-1">{alertMessage}</span>
                <button onClick={() => setShowAlert(false)}>
                  <IconClose className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  )
}

export default Rewards
