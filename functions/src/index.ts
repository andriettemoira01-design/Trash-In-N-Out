import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

admin.initializeApp()
const db = admin.firestore()

/**
 * Sends a push notification (FCM) whenever a new notification document is created in Firestore.
 * This works even when the app is closed/inactive on both Android and Web.
 */
export const sendPushOnNotification = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snap) => {
    const data = snap.data()
    if (!data) return

    const { userId, title, message } = data

    // Get the user's push token from Firestore
    const userDoc = await db.collection("users").doc(userId).get()
    if (!userDoc.exists) return

    const userData = userDoc.data()
    const pushToken = userData?.pushToken
    if (!pushToken) {
      console.log(`No push token for user ${userId}`)
      return
    }

    const payload: admin.messaging.Message = {
      token: pushToken,
      notification: {
        title: title || "Trash-In-N-Out",
        body: message || "You have a new notification",
      },
      data: {
        title: title || "Trash-In-N-Out",
        message: message || "You have a new notification",
        type: data.type || "system",
        relatedId: data.relatedId || "",
        tag: `notification-${snap.id}`,
      },
      // Android-specific: high priority so it wakes the device
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      // Web-specific: uses the service worker
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          icon: "/favicon.png",
          badge: "/favicon.png",
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: "/",
        },
      },
    }

    try {
      await admin.messaging().send(payload)
      console.log(`Push sent to user ${userId} for notification ${snap.id}`)
    } catch (error: any) {
      console.error("Error sending push:", error)
      // If token is invalid, remove it
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        await db.collection("users").doc(userId).update({ pushToken: admin.firestore.FieldValue.delete() })
        console.log(`Removed stale push token for user ${userId}`)
      }
    }
  })

/**
 * Sends a push notification when a new chat message is added.
 * Directly listens to the messages subcollection under chatRooms.
 */
export const sendPushOnChatMessage = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const data = snap.data()
    if (!data) return

    const { senderId, senderName, text } = data
    const roomId = context.params.roomId

    // Get the chat room to find the other participant
    const roomDoc = await db.collection("chatRooms").doc(roomId).get()
    if (!roomDoc.exists) return

    const roomData = roomDoc.data()
    const participants: string[] = roomData?.participants || []
    const recipientId = participants.find((id: string) => id !== senderId)
    if (!recipientId) return

    // Get recipient's push token
    const recipientDoc = await db.collection("users").doc(recipientId).get()
    if (!recipientDoc.exists) return

    const recipientData = recipientDoc.data()
    const pushToken = recipientData?.pushToken
    if (!pushToken) return

    const messagePreview = text && text.length > 100 ? text.slice(0, 100) + "..." : text || "Sent a message"

    const payload: admin.messaging.Message = {
      token: pushToken,
      notification: {
        title: `${senderName || "Someone"}`,
        body: messagePreview,
      },
      data: {
        title: senderName || "New Message",
        message: messagePreview,
        type: "chat",
        relatedId: roomId,
        tag: `chat-${roomId}`,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "chat",
          sound: "default",
        },
      },
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          icon: "/favicon.png",
          badge: "/favicon.png",
          vibrate: [200, 100, 200],
          tag: `chat-${roomId}`,
        },
      },
    }

    try {
      await admin.messaging().send(payload)
      console.log(`Chat push sent to ${recipientId} from ${senderId}`)
    } catch (error: any) {
      console.error("Error sending chat push:", error)
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        await db.collection("users").doc(recipientId).update({ pushToken: admin.firestore.FieldValue.delete() })
      }
    }
  })
