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
import { useAuth, getUserDataFromStorage } from "../contexts/AuthContext"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  onSnapshot,
} from "firebase/firestore"
import { firestore } from "../firebase"
import { motion, AnimatePresence } from "framer-motion"

// SVG Icon Components
const IconNotification: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M440.08 341.31c-1.66-2-3.29-4-4.89-5.93-22-26.61-35.31-42.67-35.31-118 0-39-9.33-71-27.72-95-13.56-17.73-31.89-31.18-56.05-41.12a3 3 0 01-.82-.67C306.6 51.49 282.82 32 256 32s-50.59 19.49-59.28 48.56a3.13 3.13 0 01-.81.65c-56.38 23.21-83.78 67.74-83.78 136.14 0 75.36-13.29 91.42-35.31 118-1.6 1.93-3.23 3.89-4.89 5.93a35.16 35.16 0 00-4.65 37.62c6.17 13 19.32 21.07 34.33 21.07H410.5c14.94 0 28-8.06 34.19-21a35.17 35.17 0 00-4.61-37.66zM256 480a80.06 80.06 0 0070.44-42.13 4 4 0 00-3.54-5.87H189.12a4 4 0 00-3.55 5.87A80.06 80.06 0 00256 480z"/>
  </svg>
)

const IconCheckmarkDone: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M464 128L240 384l-96-96M144 384l-96-96M368 128L232 284" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTrash: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M80 112h352M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconClose: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M368 368L144 144M368 144L144 368" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRecycle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M256 48l-112 160h224L256 48zM48 304l112 160V304H48zM464 304H352v160l112-160z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTrophy: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M464 80H400V64a32 32 0 00-32-32H144a32 32 0 00-32 32v16H48a16 16 0 00-16 16v64c0 52.93 43.06 96 96 96h16c5.7 47.74 37.94 87.57 82 100.42V428h-64a8 8 0 00-8 8v32a8 8 0 008 8h240a8 8 0 008-8v-32a8 8 0 00-8-8h-64v-71.58c44.06-12.85 76.3-52.68 82-100.42h16c52.94 0 96-43.07 96-96V96a16 16 0 00-16-16z"/>
  </svg>
)

const IconSystem: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="256" cy="256" r="48" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M470.39 300l-.47-.38-31.56-24.75a16.11 16.11 0 01-6.1-13.33v-11.56a16 16 0 016.11-13.22L469.92 212l.47-.38a26.68 26.68 0 005.9-34.06l-42.71-73.9a1.59 1.59 0 01-.13-.22A26.86 26.86 0 00401 92.14l-.35.13-37.1 14.93a15.94 15.94 0 01-14.47-1.29q-4.92-3.1-10-5.86a15.94 15.94 0 01-8.19-11.82l-5.59-39.59-.12-.72A26.92 26.92 0 00298.76 26h-85.52a26.92 26.92 0 00-26.45 21.91l-.13.72-5.6 39.63a16 16 0 01-8.2 11.8c-3.45 1.88-6.81 3.91-10 5.89a15.89 15.89 0 01-14.45 1.27L111.38 92.3l-.34-.13a26.86 26.86 0 00-32.48 11.34l-.13.22-42.77 73.95a26.71 26.71 0 005.9 34.1l.47.38 31.56 24.75a16.11 16.11 0 016.1 13.33v11.56a16 16 0 01-6.11 13.22L42.08 300l-.47.38a26.68 26.68 0 00-5.9 34.06l42.71 73.9a1.59 1.59 0 01.13.22 26.86 26.86 0 0032.45 11.3l.35-.13 37.1-14.93a15.94 15.94 0 0114.47 1.29q4.92 3.1 10 5.86a15.94 15.94 0 018.19 11.82l5.59 39.59.12.72A26.92 26.92 0 00213.24 486h85.52a26.92 26.92 0 0026.45-21.91l.13-.72 5.6-39.63a16 16 0 018.2-11.8c3.45-1.88 6.81-3.91 10-5.89a15.89 15.89 0 0114.45-1.27l37.06 14.93.34.13a26.86 26.86 0 0032.48-11.34l.13-.22 42.77-73.95a26.71 26.71 0 00-5.9-34.1z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconMail: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <rect x="48" y="96" width="416" height="320" rx="40" ry="40" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M112 160l144 112 144-112" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: Date
  type: "request" | "status" | "reward" | "system"
  relatedId?: string
  deleted?: boolean
}

const Notifications: React.FC = () => {
  const { userData } = useAuth()
  const storedUserData = getUserDataFromStorage()
  const userInfo = userData || storedUserData

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  useEffect(() => {
    if (!userInfo?.uid) return

    setLoading(true)

    const notificationsRef = collection(firestore, "notifications")
    const q = query(notificationsRef, where("userId", "==", userInfo.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsList: Notification[] = []
        let unread = 0

        snapshot.forEach((doc) => {
          const data = doc.data()
          if (data.deleted === true) return

          const notification = {
            id: doc.id,
            userId: data.userId,
            title: data.title || "Notification",
            message: data.message || "",
            read: data.read === true,
            createdAt: data.createdAt?.toDate() || new Date(),
            type: data.type || "system",
            relatedId: data.relatedId,
            deleted: data.deleted,
          }

          notificationsList.push(notification)
          if (!notification.read) unread++
        })

        setNotifications(notificationsList)
        setUnreadCount(unread)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [userInfo?.uid])

  const handleRefresh = async (event: CustomEvent) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    event.detail.complete()
  }

  const markAsRead = async (notification: Notification) => {
    if (!notification.read) {
      try {
        const notificationRef = doc(firestore, "notifications", notification.id)
        await updateDoc(notificationRef, { read: true })
      } catch (error) {
        console.error("Error marking notification as read", error)
      }
    }
    
    setSelectedNotification(notification)
    setShowDetailModal(true)
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0) return

    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      const updatePromises = unreadNotifications.map((notification) => {
        const notificationRef = doc(firestore, "notifications", notification.id)
        return updateDoc(notificationRef, { read: true })
      })

      await Promise.all(updatePromises)
      setToastMessage("All notifications marked as read")
      setShowToast(true)
    } catch (error) {
      console.error("Error marking all notifications as read", error)
      setToastMessage("Error marking notifications as read")
      setShowToast(true)
    }
  }

  const deleteNotification = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const notificationRef = doc(firestore, "notifications", notification.id)
      await updateDoc(notificationRef, { deleted: true })
      setToastMessage("Notification deleted")
      setShowToast(true)
    } catch (error) {
      console.error("Error deleting notification", error)
      setToastMessage("Error deleting notification")
      setShowToast(true)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request":
        return <IconRecycle className="w-6 h-6" />
      case "reward":
        return <IconTrophy className="w-6 h-6" />
      case "status":
        return <IconMail className="w-6 h-6" />
      default:
        return <IconSystem className="w-6 h-6" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "request":
        return "from-green-400 to-emerald-500"
      case "reward":
        return "from-amber-400 to-orange-500"
      case "status":
        return "from-blue-400 to-indigo-500"
      default:
        return "from-gray-400 to-gray-500"
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read) 
    : notifications

  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Header */}
        <div className="relative px-4 pt-12 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -right-10 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute bottom-0 -left-10 w-32 h-32 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-2"
            >
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium border border-white/30">
                  {unreadCount} new
                </span>
              )}
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/80 text-sm"
            >
              Stay updated with your recycling activities
            </motion.p>
          </div>
        </div>

        <div className="px-4 -mt-2">
          {/* Filter & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-4"
          >
            <div className="bg-gray-100 rounded-xl p-1 flex">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  filter === "unread"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 text-blue-600 text-sm font-medium"
              >
                <IconCheckmarkDone className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </motion.div>

          {/* Notifications List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <IonSkeletonText animated style={{ width: "48px", height: "48px", borderRadius: "12px" }} />
                    <div className="flex-1">
                      <IonSkeletonText animated style={{ width: "60%", height: "16px" }} />
                      <IonSkeletonText animated style={{ width: "80%", height: "14px", marginTop: "8px" }} />
                      <IonSkeletonText animated style={{ width: "30%", height: "12px", marginTop: "8px" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-3 mb-20">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => markAsRead(notification)}
                    className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                      notification.read ? "border-gray-100" : "border-blue-200 bg-blue-50/30"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold truncate ${notification.read ? "text-gray-700" : "text-gray-900"}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 line-clamp-2 ${notification.read ? "text-gray-500" : "text-gray-600"}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">{formatDate(notification.createdAt)}</span>
                          <button
                            onClick={(e) => deleteNotification(notification, e)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconNotification className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {filter === "unread" 
                  ? "You're all caught up!" 
                  : "Your notifications will appear here"
                }
              </p>
            </motion.div>
          )}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedNotification && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[70vh] overflow-y-auto"
              >
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getNotificationColor(selectedNotification.type)} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-800">{selectedNotification.title}</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedNotification.createdAt.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedNotification.message}</p>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors text-sm"
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
                <IconCheckmarkDone className="w-5 h-5" />
                <span className="font-medium flex-1">{toastMessage}</span>
                <button onClick={() => setShowToast(false)}>
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

export default Notifications
