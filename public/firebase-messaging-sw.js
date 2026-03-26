/* eslint-disable no-undef */
// Firebase Messaging Service Worker - handles background push notifications on web
importScripts("https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyAqbGG2JFquCPcRkyM_QeS9jZrAm_fG8j0",
  authDomain: "trashinnout-1e035.firebaseapp.com",
  projectId: "trashinnout-1e035",
  storageBucket: "trashinnout-1e035.firebasestorage.app",
  messagingSenderId: "1086811142141",
  appId: "1:1086811142141:web:8ed416fae68521f49e8b94",
})

const messaging = firebase.messaging()

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload)

  const title = payload.notification?.title || payload.data?.title || "Trash-In-N-Out"
  const body = payload.notification?.body || payload.data?.message || "You have a new notification"
  const icon = payload.data?.icon || "/favicon.png"

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/favicon.png",
    tag: payload.data?.tag || `notification-${Date.now()}`,
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: [{ action: "open", title: "Open" }],
  })
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus()
        }
      }
      return clients.openWindow("/")
    })
  )
})
