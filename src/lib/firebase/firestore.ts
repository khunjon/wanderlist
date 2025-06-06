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
  increment,
} from 'firebase/firestore';
import { db } from './config';
import { List, Place, ListPlace, PlaceWithNotes } from '@/types';
import { auth } from './config';

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
    city: data.city,
    tags: data.tags || [],
    isPublic: data.isPublic,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    viewCount: data.viewCount || 0,
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
        city: data.city,
        tags: data.tags || [],
        isPublic: data.isPublic,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        viewCount: data.viewCount || 0,
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
    if (!listId || !placeId) {
      throw new Error('Invalid listId or placeId');
    }

    // Check authentication
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to add places to lists');
    }
    
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
    
    // Verify the list exists and user has permission
    const listDoc = await getDoc(doc(db, 'lists', listId));
    if (!listDoc.exists()) {
      throw new Error('List does not exist');
    }
    
    const listData = listDoc.data();
    if (listData.userId !== auth.currentUser.uid) {
      throw new Error('You do not have permission to add places to this list');
    }
    
    // Add place to list
    const docData: any = {
      listId,
      placeId,
      addedAt: serverTimestamp(),
    };
    
    // Only add notes if it's not undefined
    if (notes !== undefined && notes !== null) {
      docData.notes = notes;
    }
    
    const docRef = await addDoc(collection(db, 'listPlaces'), docData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding place to list:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        throw new Error('Permission denied. Please check your Firestore security rules.');
      } else if (error.message.includes('unauthenticated')) {
        throw new Error('You must be logged in to add places to lists.');
      } else if (error.message.includes('not-found')) {
        throw new Error('The list or place was not found.');
      }
    }
    
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

export const getPlacesInList = async (listId: string): Promise<PlaceWithNotes[]> => {
  try {
    // Get all list-place relationships for this list
    const q = query(
      collection(db, 'listPlaces'),
      where('listId', '==', listId)
    );
    const querySnapshot = await getDocs(q);
    
    // If no places in list, return empty array
    if (querySnapshot.empty) {
      return [];
    }
    
    // Get all places with their notes
    const places: PlaceWithNotes[] = [];
    
    // Fetch each place with its notes
    const placePromises = querySnapshot.docs.map(async (listPlaceDoc) => {
      const listPlaceData = listPlaceDoc.data();
      const placeDoc = await getDoc(doc(db, 'places', listPlaceData.placeId));
      
      if (placeDoc.exists()) {
        const placeData = placeDoc.data();
        places.push({
          id: placeDoc.id,
          googlePlaceId: placeData.googlePlaceId,
          name: placeData.name,
          address: placeData.address,
          latitude: placeData.latitude,
          longitude: placeData.longitude,
          rating: placeData.rating,
          photoUrl: placeData.photoUrl,
          placeTypes: placeData.placeTypes || [],
          notes: listPlaceData.notes,
          listPlaceId: listPlaceDoc.id,
          addedAt: listPlaceData.addedAt?.toDate() || new Date(),
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

// Update notes for a place in a list
export const updatePlaceNotes = async (
  listPlaceId: string,
  notes: string
): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to update place notes');
    }

    await updateDoc(doc(db, 'listPlaces', listPlaceId), {
      notes: notes.trim() || null, // Store null if empty string
    });
  } catch (error) {
    console.error('Error updating place notes:', error);
    throw error;
  }
};

// Remove a specific place from a list using the listPlace ID
export const removePlaceFromListById = async (
  listPlaceId: string
): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to remove places from lists');
    }

    await deleteDoc(doc(db, 'listPlaces', listPlaceId));
  } catch (error) {
    console.error('Error removing place from list:', error);
    throw error;
  }
};

// Search for lists by name
export const searchLists = async (searchTerm: string, userId: string): Promise<List[]> => {
  try {
    // Search for user's lists and public lists
    const searchTermLower = searchTerm.toLowerCase();
    const searchTermUpper = searchTermLower + '\uf8ff';
    
    const userListsQuery = query(
      collection(db, 'lists'),
      where('userId', '==', userId),
      where('name', '>=', searchTermLower),
      where('name', '<=', searchTermUpper)
    );
    
    const publicListsQuery = query(
      collection(db, 'lists'),
      where('isPublic', '==', true),
      where('name', '>=', searchTermLower),
      where('name', '<=', searchTermUpper)
    );
    
    const [userListsSnapshot, publicListsSnapshot] = await Promise.all([
      getDocs(userListsQuery),
      getDocs(publicListsQuery)
    ]);
    
    // Combine user lists and public lists, removing duplicates
    const allLists: List[] = [];
    const listIds = new Set<string>();
    
    // First add user lists
    userListsSnapshot.forEach((doc) => {
      const list = convertFirestoreDataToList(doc);
      allLists.push(list);
      listIds.add(doc.id);
    });
    
    // Then add public lists that aren't already in the list
    publicListsSnapshot.forEach((doc) => {
      if (!listIds.has(doc.id)) {
        const list = convertFirestoreDataToList(doc);
        allLists.push(list);
      }
    });
    
    return allLists;
  } catch (error) {
    console.error('Error searching lists:', error);
    throw error;
  }
};

// Increment list view count
export const incrementListViewCount = async (listId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'lists', listId);
    await updateDoc(docRef, {
      viewCount: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing list view count:', error);
    // Don't throw error as this is not critical functionality
  }
};

// Get all public lists for discovery
export const getPublicLists = async (): Promise<List[]> => {
  try {
    const q = query(
      collection(db, 'lists'),
      where('isPublic', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const lists: List[] = [];
    querySnapshot.forEach((doc) => {
      lists.push(convertFirestoreDataToList(doc));
    });
    
    return lists;
  } catch (error) {
    console.error('Error getting public lists:', error);
    throw error;
  }
}; 