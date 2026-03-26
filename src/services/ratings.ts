import { firestore } from "../firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore"

export interface Rating {
  id?: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  requestId: string
  rating: number
  comment: string
  createdAt: any
}

export const submitRating = async (rating: Omit<Rating, "id" | "createdAt">) => {
  try {
    // Check if user already rated this request
    const ratingsRef = collection(firestore, "ratings")
    const existingQuery = query(
      ratingsRef,
      where("fromUserId", "==", rating.fromUserId),
      where("requestId", "==", rating.requestId)
    )
    const existing = await getDocs(existingQuery)
    if (!existing.empty) {
      throw new Error("You have already rated this transaction")
    }

    await addDoc(collection(firestore, "ratings"), {
      ...rating,
      createdAt: Timestamp.now(),
    })

    // Update the target user's average rating
    await updateUserAverageRating(rating.toUserId)
    return true
  } catch (error) {
    console.error("Error submitting rating:", error)
    throw error
  }
}

export const getUserRatings = async (userId: string): Promise<Rating[]> => {
  try {
    const ratingsRef = collection(firestore, "ratings")
    const q = query(ratingsRef, where("toUserId", "==", userId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Rating))
  } catch (error) {
    console.error("Error fetching ratings:", error)
    return []
  }
}

export const getUserAverageRating = async (userId: string): Promise<{ average: number; count: number }> => {
  try {
    const ratings = await getUserRatings(userId)
    if (ratings.length === 0) return { average: 0, count: 0 }
    const total = ratings.reduce((sum, r) => sum + r.rating, 0)
    return { average: total / ratings.length, count: ratings.length }
  } catch (error) {
    console.error("Error calculating average rating:", error)
    return { average: 0, count: 0 }
  }
}

const updateUserAverageRating = async (userId: string) => {
  try {
    const { average, count } = await getUserAverageRating(userId)
    const userRef = doc(firestore, "users", userId)
    await updateDoc(userRef, { averageRating: average, totalRatings: count })
  } catch (error) {
    console.error("Error updating user average rating:", error)
  }
}

export const hasUserRatedRequest = async (userId: string, requestId: string): Promise<boolean> => {
  try {
    const ratingsRef = collection(firestore, "ratings")
    const q = query(
      ratingsRef,
      where("fromUserId", "==", userId),
      where("requestId", "==", requestId)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("Error checking rating:", error)
    return false
  }
}
