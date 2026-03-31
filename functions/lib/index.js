"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushOnChatMessage = exports.sendPushOnNotification = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
/**
 * Sends a push notification (FCM) whenever a new notification document is created in Firestore.
 * This works even when the app is closed/inactive on both Android and Web.
 */
exports.sendPushOnNotification = (0, firestore_1.onDocumentCreated)("notifications/{notificationId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
    if (!data)
        return;
    const { userId, title, message } = data;
    // Get the user's push token from Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists)
        return;
    const userData = userDoc.data();
    const pushToken = userData === null || userData === void 0 ? void 0 : userData.pushToken;
    if (!pushToken) {
        console.log(`No push token for user ${userId}`);
        return;
    }
    const payload = {
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
            tag: `notification-${event.params.notificationId}`,
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
    };
    try {
        await admin.messaging().send(payload);
        console.log(`Push sent to user ${userId} for notification ${event.params.notificationId}`);
    }
    catch (error) {
        console.error("Error sending push:", error);
        // If token is invalid, remove it
        if (error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered") {
            await db.collection("users").doc(userId).update({ pushToken: admin.firestore.FieldValue.delete() });
            console.log(`Removed stale push token for user ${userId}`);
        }
    }
});
/**
 * Sends a push notification when a new chat message is added.
 * Directly listens to the messages subcollection under chatRooms.
 */
exports.sendPushOnChatMessage = (0, firestore_1.onDocumentCreated)("chatRooms/{roomId}/messages/{messageId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
    if (!data)
        return;
    const { senderId, senderName, text } = data;
    const roomId = event.params.roomId;
    // Get the chat room to find the other participant
    const roomDoc = await db.collection("chatRooms").doc(roomId).get();
    if (!roomDoc.exists)
        return;
    const roomData = roomDoc.data();
    const participants = (roomData === null || roomData === void 0 ? void 0 : roomData.participants) || [];
    const recipientId = participants.find((id) => id !== senderId);
    if (!recipientId)
        return;
    // Get recipient's push token
    const recipientDoc = await db.collection("users").doc(recipientId).get();
    if (!recipientDoc.exists)
        return;
    const recipientData = recipientDoc.data();
    const pushToken = recipientData === null || recipientData === void 0 ? void 0 : recipientData.pushToken;
    if (!pushToken)
        return;
    const messagePreview = text && text.length > 100 ? text.slice(0, 100) + "..." : text || "Sent a message";
    const payload = {
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
    };
    try {
        await admin.messaging().send(payload);
        console.log(`Chat push sent to ${recipientId} from ${senderId}`);
    }
    catch (error) {
        console.error("Error sending chat push:", error);
        if (error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered") {
            await db.collection("users").doc(recipientId).update({ pushToken: admin.firestore.FieldValue.delete() });
        }
    }
});
//# sourceMappingURL=index.js.map