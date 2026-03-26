import { firestore } from "../firebase"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"

const DAILY_REQUEST_LIMIT_RESIDENT = 5
const DAILY_COMPLETE_LIMIT_JUNKSHOP = 10

const getStartOfDay = (): Date => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

export const getResidentDailyRequestCount = async (userId: string): Promise<number> => {
  try {
    const startOfDay = getStartOfDay()
    const requestsRef = collection(firestore, "materialRequests")
    const q = query(
      requestsRef,
      where("userId", "==", userId),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay))
    )
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error("Error getting daily request count:", error)
    return 0
  }
}

export const getJunkshopDailyCompletionCount = async (junkshopId: string): Promise<number> => {
  try {
    const startOfDay = getStartOfDay()
    const requestsRef = collection(firestore, "materialRequests")
    const q = query(
      requestsRef,
      where("acceptedBy", "==", junkshopId),
      where("status", "==", "completed"),
      where("completedAt", ">=", Timestamp.fromDate(startOfDay))
    )
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error("Error getting daily completion count:", error)
    return 0
  }
}

export const canResidentCreateRequest = async (userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> => {
  const count = await getResidentDailyRequestCount(userId)
  return {
    allowed: count < DAILY_REQUEST_LIMIT_RESIDENT,
    remaining: Math.max(0, DAILY_REQUEST_LIMIT_RESIDENT - count),
    limit: DAILY_REQUEST_LIMIT_RESIDENT,
  }
}

export const canJunkshopCompleteRequest = async (junkshopId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> => {
  const count = await getJunkshopDailyCompletionCount(junkshopId)
  return {
    allowed: count < DAILY_COMPLETE_LIMIT_JUNKSHOP,
    remaining: Math.max(0, DAILY_COMPLETE_LIMIT_JUNKSHOP - count),
    limit: DAILY_COMPLETE_LIMIT_JUNKSHOP,
  }
}

export { DAILY_REQUEST_LIMIT_RESIDENT, DAILY_COMPLETE_LIMIT_JUNKSHOP }
