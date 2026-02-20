"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  addDoc,
  updateDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  Timestamp,
} from "firebase/firestore"
import { firestore } from "../firebase"
import { motion, AnimatePresence } from "framer-motion"
import "./Chat.css"

// SVG Icon Components
const IconArrowBack: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="48">
    <path d="M244 400L100 256l144-144M120 256h292" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconSend: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0027.14 52 24.65 24.65 0 0016 72.59v113.29a24 24 0 0019.52 23.57l232.93 43.07a4 4 0 010 7.86L35.53 303.45A24 24 0 0016 327v113.28A23.53 23.53 0 0026.32 460a24.78 24.78 0 0011.35 2.79 23.22 23.22 0 0011.75-3.2l.12-.07 427-177.2a32 32 0 000-55.27z"/>
  </svg>
)

const IconChatbubbles: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M60.44 389.17c0 .07 0 .2-.08.38c-1.56 3.7-3.07 7.3-4.53 10.79c-6.26 14.91-11.77 28-14.66 38.32l-.42 1.53c-.54 2.2-1 4.31-1.45 6.32c-2.25 10.41-3.55 18.81-3.87 24.38c-.08 1.39-.12 2.82-.13 4.5c-.06 17.78 15.26 34.64 32.5 34.61a34.2 34.2 0 0014.48-3.37c22.61-10.63 44.8-21.3 62.78-32.52c10.18-6.36 18.56-12.85 25-19.3a162.43 162.43 0 0027.1 2.29c72.21 0 126.94-38.17 126.94-94.5c0-56.83-54.73-95-126.94-95S70 304.67 70 362c0 11.18 3.48 21.86 9.47 31.63c-5.73 3.51-11.23 7.06-15.51 10.07c-2.53 1.77-4.65 3.33-6.43 4.63a43.36 43.36 0 00-1.06.84c-.57.46-.91.74-1 .79zm4.34-17.76z"/>
    <path d="M340.81 84c-89.09 0-162.33 52.33-169.53 122.5c80.89 4.52 142.72 57.89 142.72 119.5a106 106 0 01-3.31 25c74.31-7.63 129.31-52.4 129.31-107.5c0-22.85-10.79-43.53-29.49-59.93c4.44-4.37 12.08-10.06 18.91-14.67c7.31-4.93 12.83-8.95 15.28-11.32c2.78-2.68 4.25-4.65 4.85-5.76a9.06 9.06 0 00.64-5.25c-.29-2.79-.69-5.83-1.14-8.72c-.65-4.1-1.51-8.74-2.57-13.72c-5.08-23.89-14.56-44.65-30.88-55c-13.07-8.31-35.18-12.77-59-13.39c-12.27-.32-24.59.58-36.74 2.67A168.24 168.24 0 00340.81 84z"/>
  </svg>
)

const IconPerson: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M332.64 64.58C313.18 43.57 286 32 256 32c-30.16 0-57.43 11.5-76.8 32.38c-19.58 21.11-29.12 49.8-26.88 80.78C156.76 206.28 203.27 256 256 256s99.16-49.71 103.67-110.82c2.27-30.7-7.33-59.33-27.03-80.6zM432 480H80a31 31 0 01-24.2-11.13c-6.5-7.77-9.12-18.38-7.18-29.11C57.06 392.94 83.4 353.61 124.8 326c36.78-24.51 83.37-38 131.2-38s94.42 13.5 131.2 38c41.4 27.6 67.74 66.93 76.18 113.75c1.94 10.73-.68 21.34-7.18 29.11A31 31 0 01432 480z"/>
  </svg>
)

const IconEllipsisVertical: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor">
    <circle cx="256" cy="256" r="48"/>
    <circle cx="256" cy="416" r="48"/>
    <circle cx="256" cy="96" r="48"/>
  </svg>
)

const IconCheckmarkDone: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M464 128L240 384l-96-96M144 384l-96-96M368 128L232 284" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconStore: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <path d="M448 448V240M64 240v208M382.47 48H129.53a32 32 0 00-27.43 15.58L48 160h416l-54.1-96.42A32 32 0 00382.47 48z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M464 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32H144v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M256 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32M368 160v32a48 48 0 01-48 48h0a48 48 0 01-48-48v-32" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="none" stroke="currentColor" strokeWidth="32">
    <circle cx="221" cy="221" r="144" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M338.29 338.29L448 448" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface ChatRoom {
  id: string
  participants: string[]
  participantNames: { [key: string]: string }
  participantRoles: { [key: string]: string }
  lastMessage?: string
  lastMessageTime?: Date
  lastMessageSenderId?: string
  unreadCount: { [key: string]: number }
}

interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  createdAt: Date
  read: boolean
}

interface JunkshopUser {
  uid: string
  name: string
  businessName: string
  role: string
  avatarColor?: string
}

const Chat: React.FC = () => {
  const { userData } = useAuth()
  const storedUserData = getUserDataFromStorage()
  const userInfo = userData || storedUserData

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [junkshops, setJunkshops] = useState<JunkshopUser[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch chat rooms
  useEffect(() => {
    if (!userInfo?.uid) return

    const roomsRef = collection(firestore, "chatRooms")
    const q = query(
      roomsRef,
      where("participants", "array-contains", userInfo.uid),
      orderBy("lastMessageTime", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms: ChatRoom[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        rooms.push({
          id: doc.id,
          participants: data.participants,
          participantNames: data.participantNames || {},
          participantRoles: data.participantRoles || {},
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime?.toDate(),
          lastMessageSenderId: data.lastMessageSenderId,
          unreadCount: data.unreadCount || {},
        })
      })
      setChatRooms(rooms)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userInfo?.uid])

  // Fetch junkshops for new chat
  useEffect(() => {
    const fetchJunkshops = async () => {
      if (userInfo?.role !== "resident") return

      const usersRef = collection(firestore, "users")
      const q = query(usersRef, where("role", "==", "junkshop"))
      const snapshot = await getDocs(q)

      const junkshopList: JunkshopUser[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        junkshopList.push({
          uid: doc.id,
          name: data.name || "Unknown",
          businessName: data.businessName || "Junkshop",
          role: data.role,
          avatarColor: getAvatarColor(doc.id),
        })
      })
      setJunkshops(junkshopList)
    }

    fetchJunkshops()
  }, [userInfo?.role])

  // Fetch messages for selected room
  useEffect(() => {
    if (!selectedRoom) return

    const messagesRef = collection(firestore, "chatRooms", selectedRoom.id, "messages")
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: Message[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        messagesList.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          read: data.read || false,
        })
      })
      setMessages(messagesList)

      // Mark messages as read
      if (userInfo?.uid) {
        markMessagesAsRead(selectedRoom.id)
      }
    })

    return () => unsubscribe()
  }, [selectedRoom?.id, userInfo?.uid])

  const markMessagesAsRead = async (roomId: string) => {
    if (!userInfo?.uid) return
    
    try {
      const roomRef = doc(firestore, "chatRooms", roomId)
      await updateDoc(roomRef, {
        [`unreadCount.${userInfo.uid}`]: 0
      })
    } catch (error) {
      console.error("Error marking messages as read", error)
    }
  }

  const getAvatarColor = (id: string) => {
    const colors = [
      "from-emerald-400 to-green-500",
      "from-blue-400 to-indigo-500",
      "from-purple-400 to-pink-500",
      "from-orange-400 to-red-500",
      "from-teal-400 to-cyan-500",
    ]
    const index = id.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getOtherParticipantName = (room: ChatRoom) => {
    if (!userInfo?.uid) return "Unknown"
    const otherId = room.participants.find((p) => p !== userInfo.uid)
    return otherId ? room.participantNames[otherId] || "Unknown" : "Unknown"
  }

  const getOtherParticipantRole = (room: ChatRoom) => {
    if (!userInfo?.uid) return ""
    const otherId = room.participants.find((p) => p !== userInfo.uid)
    return otherId ? room.participantRoles[otherId] || "" : ""
  }

  const formatMessageTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    const formattedHours = hours % 12 || 12

    if (diff < 86400000 && now.getDate() === date.getDate()) {
      return `${formattedHours}:${minutes} ${ampm}`
    } else if (diff < 604800000) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const startNewChat = async (junkshop: JunkshopUser) => {
    if (!userInfo?.uid) return

    // Check if chat room already exists
    const existingRoom = chatRooms.find(
      (room) => room.participants.includes(junkshop.uid)
    )

    if (existingRoom) {
      setSelectedRoom(existingRoom)
      setShowNewChatModal(false)
      return
    }

    // Create new chat room
    try {
      const roomsRef = collection(firestore, "chatRooms")
      const newRoom = await addDoc(roomsRef, {
        participants: [userInfo.uid, junkshop.uid],
        participantNames: {
          [userInfo.uid]: userInfo.name || "User",
          [junkshop.uid]: junkshop.businessName,
        },
        participantRoles: {
          [userInfo.uid]: userInfo.role,
          [junkshop.uid]: junkshop.role,
        },
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [userInfo.uid]: 0,
          [junkshop.uid]: 0,
        },
      })

      setSelectedRoom({
        id: newRoom.id,
        participants: [userInfo.uid, junkshop.uid],
        participantNames: {
          [userInfo.uid]: userInfo.name || "User",
          [junkshop.uid]: junkshop.businessName,
        },
        participantRoles: {
          [userInfo.uid]: userInfo.role,
          [junkshop.uid]: junkshop.role,
        },
        unreadCount: {},
      })
      setShowNewChatModal(false)
    } catch (error) {
      console.error("Error creating chat room", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !userInfo?.uid || sendingMessage) return

    setSendingMessage(true)
    const messageText = newMessage.trim()
    setNewMessage("")

    try {
      const messagesRef = collection(firestore, "chatRooms", selectedRoom.id, "messages")
      await addDoc(messagesRef, {
        senderId: userInfo.uid,
        senderName: userInfo.name || "User",
        text: messageText,
        createdAt: serverTimestamp(),
        read: false,
      })

      // Update room with last message
      const otherParticipant = selectedRoom.participants.find((p) => p !== userInfo.uid)
      const roomRef = doc(firestore, "chatRooms", selectedRoom.id)
      await updateDoc(roomRef, {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: userInfo.uid,
        [`unreadCount.${otherParticipant}`]: (selectedRoom.unreadCount[otherParticipant || ""] || 0) + 1,
      })
    } catch (error) {
      console.error("Error sending message", error)
      setNewMessage(messageText)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleRefresh = async (event: CustomEvent) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    event.detail.complete()
  }

  const filteredChatRooms = chatRooms.filter((room) => {
    const otherName = getOtherParticipantName(room).toLowerCase()
    return otherName.includes(searchTerm.toLowerCase())
  })

  const totalUnread = chatRooms.reduce((acc, room) => {
    return acc + (room.unreadCount[userInfo?.uid || ""] || 0)
  }, 0)

  // Message view (when a room is selected)
  if (selectedRoom) {
    const otherName = getOtherParticipantName(selectedRoom)
    const otherRole = getOtherParticipantRole(selectedRoom)
    const otherId = selectedRoom.participants.find((p) => p !== userInfo?.uid) || ""

    return (
      <IonPage>
        {/* Fixed Header */}
        <div className="bg-white shadow-sm z-20 fixed top-0 left-0 right-0">
          <div className="flex items-center gap-3 p-4 safe-area-top">
            <button
              onClick={() => setSelectedRoom(null)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <IconArrowBack className="w-6 h-6" />
            </button>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(otherId)} flex items-center justify-center text-white font-bold shadow-md`}>
              {otherName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{otherName}</h3>
              <p className="text-xs text-gray-500 capitalize">{otherRole?.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Fixed Input at Bottom - positioned above tab bar */}
        <div 
          className="bg-white border-t border-gray-200 p-3 fixed left-0 right-0 z-50"
          style={{ bottom: '85px' }}
        >
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 rounded-full px-5 py-3.5 text-base outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all border border-gray-300"
              style={{ fontSize: '16px' }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                newMessage.trim()
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              <IconSend className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <IonContent scrollY={true} className="bg-gray-50" style={{ '--offset-top': '72px', '--offset-bottom': '0px' } as React.CSSProperties}>
          <div className="px-4" style={{ paddingTop: '80px', paddingBottom: '180px', minHeight: '100%' }}>
            {/* Messages */}
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconChatbubbles className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Start the conversation</p>
                  <p className="text-sm text-gray-400">Send a message to begin</p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === userInfo?.uid
                    const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        {!isOwn && showAvatar && (
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(message.senderId)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {message.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {!isOwn && !showAvatar && <div className="w-8" />}
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                        }`}>
                          <p className="text-sm leading-relaxed break-words">{message.text}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                            <span className="text-[10px]">{formatMessageTime(message.createdAt)}</span>
                            {isOwn && (
                              <IconCheckmarkDone className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  // Chat list view
  return (
    <IonPage>
      <IonContent scrollY={true}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Header */}
        <div className="relative px-4 pt-12 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600">
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
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              {totalUnread > 0 && (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium border border-white/30">
                  {totalUnread} unread
                </span>
              )}
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/80 text-sm"
            >
              Connect with junkshops and residents
            </motion.p>
          </div>
        </div>

        <div className="px-4 -mt-2">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative mb-4"
          >
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white rounded-xl pl-12 pr-4 py-3 text-sm shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </motion.div>

          {/* New Chat Button (for residents) */}
          {userInfo?.role === "resident" && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => setShowNewChatModal(true)}
              className="w-full mb-4 p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              <IconChatbubbles className="w-5 h-5" />
              Start New Conversation
            </motion.button>
          )}

          {/* Chat Rooms List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <IonSkeletonText animated style={{ width: "48px", height: "48px", borderRadius: "50%" }} />
                    <div className="flex-1">
                      <IonSkeletonText animated style={{ width: "50%", height: "16px" }} />
                      <IonSkeletonText animated style={{ width: "70%", height: "14px", marginTop: "8px" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChatRooms.length > 0 ? (
            <div className="space-y-3 mb-20">
              <AnimatePresence>
                {filteredChatRooms.map((room, index) => {
                  const otherName = getOtherParticipantName(room)
                  const otherRole = getOtherParticipantRole(room)
                  const otherId = room.participants.find((p) => p !== userInfo?.uid) || ""
                  const unreadCount = room.unreadCount[userInfo?.uid || ""] || 0
                  const isOwnLastMessage = room.lastMessageSenderId === userInfo?.uid

                  return (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedRoom(room)}
                      className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                        unreadCount > 0 ? "border-emerald-200 bg-emerald-50/30" : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(otherId)} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
                          {otherName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-gray-800 truncate">{otherName}</h3>
                            {room.lastMessageTime && (
                              <span className={`text-xs flex-shrink-0 ${unreadCount > 0 ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
                                {formatMessageTime(room.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 capitalize mb-1">{otherRole?.replace("_", " ")}</p>
                          {room.lastMessage && (
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                                {isOwnLastMessage && <span className="text-gray-400">You: </span>}
                                {room.lastMessage}
                              </p>
                              {unreadCount > 0 && (
                                <span className="bg-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconChatbubbles className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No conversations yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {userInfo?.role === "resident"
                  ? "Start chatting with a junkshop"
                  : "Waiting for messages from residents"}
              </p>
            </motion.div>
          )}
        </div>

        {/* New Chat Modal */}
        <AnimatePresence>
          {showNewChatModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50"
              onClick={() => setShowNewChatModal(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto"
              >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
                
                <h2 className="text-xl font-bold text-gray-800 mb-4">Select a Junkshop</h2>
                
                {junkshops.length > 0 ? (
                  <div className="space-y-3">
                    {junkshops.map((junkshop) => (
                      <motion.button
                        key={junkshop.uid}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startNewChat(junkshop)}
                        className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center gap-4 transition-colors"
                      >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${junkshop.avatarColor} flex items-center justify-center text-white shadow-md`}>
                          <IconStore className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-800">{junkshop.businessName}</h3>
                          <p className="text-sm text-gray-500">{junkshop.name}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <IconStore className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No junkshops available</p>
                  </div>
                )}

                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  )
}

export default Chat
