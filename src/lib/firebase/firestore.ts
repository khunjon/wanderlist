import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { List, Place, ListPlace } from '@/types';

// Convert Firestore data to our app types
const convertFirestoreDataToList = (
  doc: QueryDocumentSnapshot<DocumentData>
): List => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    description: data.description,
    isPublic: data.isPublic,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

const convertFirestoreDataToPlace = (
  doc: QueryDocumentSnapshot<DocumentData>
): Place => {
  const data = doc.data();
  return {
    id: doc.id,
    googlePlaceId: data.googlePlaceId,
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    rating: data.rating,
    photoUrl: data.photoUrl,
    placeTypes: data.placeTypes || [],
  };
};

const convertFirestoreDataToListPlace = (
  doc: QueryDocumentSnapshot<DocumentData>
): ListPlace => {
  const data = doc.data();
  return {
    id: doc.id,
    listId: data.listId,
    placeId: data.placeId,
    addedAt: data.addedAt?.toDate() || new Date(),
    notes: data.notes,
  };
};

// Lists CRUD operations
export const createList = async (list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'lists'), {
      ...list,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating list:', error);
    throw error;
  }
};

export const getList = async (listId: string): Promise<List | null> => {
  try {
    const docRef = doc(db, 'lists', listId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting list:', error);
    throw error;
  }
};

export const getUserLists = async (userId: string): Promise<List[]> => {
  try {
    const q = query(collection(db, 'lists'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const lists: List[] = [];
    querySnapshot.forEach((doc) => {
      lists.push(convertFirestoreDataToList(doc));
    });
    
    return lists;
  } catch (error) {
    console.error('Error getting user lists:', error);
    throw error;
  }
};

export const updateList = async (listId: string, data: Partial<List>): Promise<void> => {
  try {
    const docRef = doc(db, 'lists', listId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating list:', error);
    throw error;
  }
};

export const deleteList = async (listId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'lists', listId));
    
    // Delete all associated list places
    const listPlacesQuery = query(
      collection(db, 'listPlaces'),
      where('listId', '==', listId)
    );
    const listPlacesSnapshot = await getDocs(listPlacesQuery);
    
    const deletePromises = listPlacesSnapshot.docs.map((doc) => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting list:', error);
    throw error;
  }
};

// Places CRUD operations
export const createPlace = async (place: Omit<Place, 'id'>): Promise<string> => {
  try {
    // Check if place already exists by googlePlaceId
    const q = query(
      collection(db, 'places'),
      where('googlePlaceId', '==', place.googlePlaceId)
    );
    const querySnapshot = await getDocs(q);
    
    // If place exists, return its ID
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    
    // Otherwise create a new place
    const docRef = await addDoc(collection(db, 'places'), place);
    return docRef.id;
  } catch (error) {
    console.error('Error creating place:', error);
    throw error;
  }
};

export const getPlace = async (placeId: string): Promise<Place | null> => {
  try {
    const docRef = doc(db, 'places', placeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        googlePlaceId: data.googlePlaceId,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        rating: data.rating,
        photoUrl: data.photoUrl,
        placeTypes: data.placeTypes || [],
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting place:', error);
    throw error;
  }
};

// ListPlace junction operations
export const addPlaceToList = async (
  listId: string,
  placeId: string,
  notes?: string
): Promise<string> => {
  try {
    // Check if place is already in the list
    const q = query(
      collection(db, 'listPlaces'),
      where('listId', '==', listId),
      where('placeId', '==', placeId)
    );
    const querySnapshot = await getDocs(q);
    
    // If place is already in list, return its ID
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    
    // Otherwise add place to list
    const docRef = await addDoc(collection(db, 'listPlaces'), {
      listId,
      placeId,
      addedAt: serverTimestamp(),
      notes,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding place to list:', error);
    throw error;
  }
};

export const removePlaceFromList = async (
  listId: string,
  placeId: string
): Promise<void> => {
  try {
    const q = query(
      collection(db, 'listPlaces'),
      where('listId', '==', listId),
      where('placeId', '==', placeId)
    );
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map((doc) => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error removing place from list:', error);
    throw error;
  }
};

export const getPlacesInList = async (listId: string): Promise<Place[]> => {
  try {
    // Get all list-place relationships for this list
    const q = query(
      collection(db, 'listPlaces'),
      where('listId', '==', listId)
    );
    const querySnapshot = await getDocs(q);
    
    // Extract place IDs
    const placeIds = querySnapshot.docs.map((doc) => 
      doc.data().placeId
    );
    
    // If no places in list, return empty array
    if (placeIds.length === 0) {
      return [];
    }
    
    // Get all places
    const places: Place[] = [];
    
    // Fetch each place (we can't use 'in' operator with large arrays)
    const placePromises = placeIds.map(async (placeId) => {
      const placeDoc = await getDoc(doc(db, 'places', placeId));
      if (placeDoc.exists()) {
        const data = placeDoc.data();
        places.push({
          id: placeDoc.id,
          googlePlaceId: data.googlePlaceId,
          name: data.name,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          rating: data.rating,
          photoUrl: data.photoUrl,
          placeTypes: data.placeTypes || [],
        });
      }
    });
    
    await Promise.all(placePromises);
    
    return places;
  } catch (error) {
    console.error('Error getting places in list:', error);
    throw error;
  }
}; 