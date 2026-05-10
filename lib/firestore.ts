import { collection, doc } from 'firebase/firestore'
import { db } from './firebase'

export const userDoc    = (uid: string) =>
  doc(db, 'users', uid)

export const tripsCol   = (uid: string) =>
  collection(db, 'users', uid, 'trips')

export const tripDoc    = (uid: string, tripId: string) =>
  doc(db, 'users', uid, 'trips', tripId)

export const daysCol    = (uid: string, tripId: string) =>
  collection(db, 'users', uid, 'trips', tripId, 'days')

export const dayDoc     = (uid: string, tripId: string, dayId: string) =>
  doc(db, 'users', uid, 'trips', tripId, 'days', dayId)

export const itemsCol   = (uid: string, tripId: string, dayId: string) =>
  collection(db, 'users', uid, 'trips', tripId, 'days', dayId, 'items')

export const itemDoc    = (uid: string, tripId: string, dayId: string, itemId: string) =>
  doc(db, 'users', uid, 'trips', tripId, 'days', dayId, 'items', itemId)
