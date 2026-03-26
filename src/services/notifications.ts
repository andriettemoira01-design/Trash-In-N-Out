import { firestore } from "../firebase"
import { collection, addDoc, Timestamp, query, where, getDocs } from "firebase/firestore"

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: "request" | "status" | "reward" | "system"
  relatedId?: string
}

export const sendNotification = async (data: NotificationData) => {
  try {
    await addDoc(collection(firestore, "notifications"), {
      ...data,
      read: false,
      createdAt: Timestamp.now(),
      deleted: false, // Explicitly set deleted to false
    })
    return true
  } catch (error) {
    console.error("Error sending notification:", error)
    return false
  }
}

export const sendMaterialRequestNotification = async (
  userId: string,
  userName: string,
  materialType: string,
  junkShopOwners: string[],
) => {
  try {
    // Send notification to all junk shop owners
    for (const ownerId of junkShopOwners) {
      await sendNotification({
        userId: ownerId,
        title: "New Recyclable Material",
        message: `${userName} has reported ${materialType} for collection.`,
        type: "request",
      })
    }
    return true
  } catch (error) {
    console.error("Error sending material request notification:", error)
    return false
  }
}

export const sendStatusUpdateNotification = async (
  userId: string,
  status: string,
  junkShopName: string,
  materialType: string,
  requestId: string,
) => {
  try {
    await sendNotification({
      userId,
      title: `Request ${status}`,
      message: `Your ${materialType} request has been ${status} by ${junkShopName}.`,
      type: "status",
      relatedId: requestId,
    })
    return true
  } catch (error) {
    console.error("Error sending status update notification:", error)
    return false
  }
}

export const sendRewardNotification = async (userId: string, points: number, reason: string) => {
  try {
    await sendNotification({
      userId,
      title: "Points Earned",
      message: `You've earned ${points} points for ${reason}.`,
      type: "reward",
    })
    return true
  } catch (error) {
    console.error("Error sending reward notification:", error)
    return false
  }
}

// Get all junkshop owners for sending notifications
export const getAllJunkshopOwners = async () => {
  try {
    const usersRef = collection(firestore, "users")
    const q = query(usersRef, where("role", "==", "junkshop"))
    const querySnapshot = await getDocs(q)

    const junkshopOwners: string[] = []
    querySnapshot.forEach((doc) => {
      junkshopOwners.push(doc.id)
    })

    return junkshopOwners
  } catch (error) {
    console.error("Error getting junkshop owners:", error)
    return []
  }
}

// Get all admin and superadmin users
export const getAllAdmins = async () => {
  try {
    const usersRef = collection(firestore, "users")
    const adminQuery = query(usersRef, where("role", "in", ["admin", "superadmin"]))
    const querySnapshot = await getDocs(adminQuery)
    const admins: string[] = []
    querySnapshot.forEach((doc) => {
      admins.push(doc.id)
    })
    return admins
  } catch (error) {
    console.error("Error getting admins:", error)
    return []
  }
}

// Notify admins when a new material request is created
export const sendAdminNewRequestNotification = async (
  userName: string,
  materialType: string,
  requestId: string,
) => {
  try {
    const admins = await getAllAdmins()
    for (const adminId of admins) {
      await sendNotification({
        userId: adminId,
        title: "New Material Request",
        message: `${userName} submitted a new ${materialType} request.`,
        type: "request",
        relatedId: requestId,
      })
    }
    return true
  } catch (error) {
    console.error("Error sending admin notification:", error)
    return false
  }
}

// Notify admins when a request is accepted/completed by junkshop
export const sendAdminStatusNotification = async (
  junkshopName: string,
  action: string,
  materialType: string,
  requestId: string,
) => {
  try {
    const admins = await getAllAdmins()
    for (const adminId of admins) {
      await sendNotification({
        userId: adminId,
        title: `Request ${action}`,
        message: `${junkshopName} has ${action} a ${materialType} request.`,
        type: "status",
        relatedId: requestId,
      })
    }
    return true
  } catch (error) {
    console.error("Error sending admin status notification:", error)
    return false
  }
}

// Notify junkshop when their request action is acknowledged
export const sendJunkshopNotification = async (
  junkshopId: string,
  title: string,
  message: string,
  requestId?: string,
) => {
  try {
    await sendNotification({
      userId: junkshopId,
      title,
      message,
      type: "status",
      relatedId: requestId,
    })
    return true
  } catch (error) {
    console.error("Error sending junkshop notification:", error)
    return false
  }
}

// Notify all admins of a new user registration
export const sendNewUserNotification = async (userName: string, role: string) => {
  try {
    const admins = await getAllAdmins()
    for (const adminId of admins) {
      await sendNotification({
        userId: adminId,
        title: "New User Registered",
        message: `${userName} registered as a ${role}.`,
        type: "system",
      })
    }
    return true
  } catch (error) {
    console.error("Error sending new user notification:", error)
    return false
  }
}
