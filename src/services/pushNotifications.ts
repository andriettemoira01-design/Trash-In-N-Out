import { Capacitor } from "@capacitor/core"
import { firestore, getFirebaseMessaging } from "../firebase"
import { doc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore"
import { getToken, onMessage } from "firebase/messaging"

// VAPID key for FCM web push - from Firebase Console > Cloud Messaging > Web Push certificates
const VAPID_KEY = "BBnWTjRJh1s56nbDRt_mRpfGIOZpz3fKToCL8_OPbBZbyeUVuJOE5il9KGUHE6iwV-98WERKfQ_MtxcNTWbISPs"

// Request notification permission and register for push (both web + native)
export const initPushNotifications = async (userId: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await initNativePush(userId)
    } else {
      await initWebPush(userId)
    }
  } catch (error) {
    console.error("Error initializing push notifications:", error)
  }
}

// Native (Android/iOS) push using Capacitor
const initNativePush = async (userId: string) => {
  try {
    // @ts-ignore - optional dependency, only available on native platforms
    const module = await import("@capacitor/push-notifications")
    const PushNotifications = module.PushNotifications

    const permResult = await PushNotifications.requestPermissions()
    if (permResult.receive === "granted") {
      await PushNotifications.register()
    }

    // Listen for registration token
    PushNotifications.addListener("registration", async (token: any) => {
      console.log("Push registration token:", token.value)
      try {
        const userRef = doc(firestore, "users", userId)
        await updateDoc(userRef, { pushToken: token.value, pushPlatform: "android" })
      } catch (error) {
        console.error("Error storing push token:", error)
      }
    })

    // Listen for push notifications received while app is open
    PushNotifications.addListener("pushNotificationReceived", (notification: any) => {
      console.log("Push notification received:", notification)
      if (notification.title) {
        showLocalNotification(notification.title, notification.body || "")
      }
    })

    // Listen for action on push notification
    PushNotifications.addListener("pushNotificationActionPerformed", (notification: any) => {
      console.log("Push action performed:", notification)
    })
  } catch (error) {
    console.log("Push notifications not available on this platform:", error)
  }
}

// Web push using FCM
const initWebPush = async (userId: string) => {
  try {
    // Request browser notification permission
    if (!("Notification" in window)) return
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return

    // Register the FCM service worker
    const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    console.log("FCM Service Worker registered:", swRegistration)

    // Get FCM messaging instance
    const messaging = await getFirebaseMessaging()
    if (!messaging) return

    // Get FCM token (requires VAPID key)
    if (VAPID_KEY) {
      try {
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        })
        if (token) {
          console.log("FCM web token:", token)
          const userRef = doc(firestore, "users", userId)
          await updateDoc(userRef, { pushToken: token, pushPlatform: "web" })
        }
      } catch (err) {
        console.warn("FCM token registration failed (VAPID key may be invalid):", err)
      }
    } else {
      console.warn("VAPID_KEY not set — FCM web push disabled. Set it from Firebase Console > Cloud Messaging > Web Push certificates.")
    }

    // Listen for foreground messages via FCM
    onMessage(messaging, (payload) => {
      console.log("FCM foreground message:", payload)
      const title = payload.notification?.title || payload.data?.title || "Trash-In-N-Out"
      const body = payload.notification?.body || payload.data?.message || "You have a new notification"
      showLocalNotification(title, body)
    })
  } catch (error) {
    console.error("Error initializing web push:", error)
  }
}

// Show a browser/local notification popup
export const showLocalNotification = (title: string, body: string) => {
  try {
    if (!Capacitor.isNativePlatform() && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: `notification-${Date.now()}`,
      } as NotificationOptions)
    }
  } catch (error) {
    console.error("Error showing local notification:", error)
  }
}

// Listen for new Firestore notifications and show pop-ups (works as fallback when FCM isn't available)
export const listenForNewNotifications = (userId: string) => {
  const notificationsRef = collection(firestore, "notifications")
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    where("read", "==", false),
    where("deleted", "==", false)
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data()
        showLocalNotification(data.title || "New Notification", data.message || "")
      }
    })
  })

  return unsubscribe
}

// Listen for new chat messages and show pop-ups when not viewing that chat
export const listenForNewChatMessages = (userId: string, activeRoomId?: string) => {
  const roomsRef = collection(firestore, "chatRooms")
  const q = query(
    roomsRef,
    where("participants", "array-contains", userId)
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "modified") {
        const data = change.doc.data()
        // Only notify if the last message is from someone else and we're not viewing that chat
        if (
          data.lastMessageSenderId !== userId &&
          change.doc.id !== activeRoomId
        ) {
          const unread = data.unreadCount?.[userId] || 0
          if (unread > 0) {
            const senderName = Object.entries(data.participantNames || {})
              .find(([id]) => id !== userId)?.[1] as string || "Someone"
            showLocalNotification(
              `New message from ${senderName}`,
              data.lastMessage || "Sent you a message"
            )
          }
        }
      }
    })
  })

  return unsubscribe
}
