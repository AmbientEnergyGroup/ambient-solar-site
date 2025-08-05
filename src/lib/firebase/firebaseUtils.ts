import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// User data interface
export interface UserData {
  id: string;
  role: 'admin' | 'setter' | 'closer' | 'manager';
  displayName: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
  managerId?: string;
  active: boolean;
  dealCount: number;
  totalCommission: number;
  recentProjects: string[];
  commissionPayments: Array<{
    amount: number;
    date: string;
    projectId: string;
    description: string;
    status: 'pending' | 'paid';
    customerName: string;
    dealNumber: number;
    systemSize: number;
    commissionRate: number;
  }>;
  settings?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}

// Project interface
export interface Project {
  id: string;
  userId: string; // Owner of the project
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  systemSize: number;
  contractValue: number;
  commissionRate: number;
  status: 'pending' | 'approved' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  attachments?: string[];
  dealNumber?: number;
  commissionAmount?: number;
}

// Customer Set interface
export interface CustomerSet {
  id: string;
  userId: string; // Owner of the set
  name: string;
  description?: string;
  customers: Array<{
    name: string;
    email: string;
    phone: string;
    address: string;
    notes?: string;
    status: 'new' | 'contacted' | 'interested' | 'not-interested';
  }>;
  createdAt: string;
  updatedAt: string;
}

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// User data management
export const createUserData = async (user: User, role: 'admin' | 'setter' | 'closer' | 'manager' = 'setter') => {
  const userData: UserData = {
    id: user.uid,
    role,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    phoneNumber: user.phoneNumber || undefined,
    createdAt: new Date().toISOString(),
    active: true,
    dealCount: 0,
    totalCommission: 0,
    recentProjects: [],
    commissionPayments: [],
    settings: {
      notifications: true,
      theme: 'auto',
      language: 'en'
    }
  };

  await setDoc(doc(db, 'users', user.uid), userData);
  return userData;
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const updateUserData = async (userId: string, updates: Partial<UserData>) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

// Project management
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  const project: Omit<Project, 'id'> = {
    ...projectData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'projects'), project);
  
  // Update user's recent projects
  await updateUserData(projectData.userId, {
    recentProjects: [docRef.id, ...(await getUserData(projectData.userId))?.recentProjects || []].slice(0, 10)
  });

  return { id: docRef.id, ...project };
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  } catch (error) {
    console.error("Error getting user projects:", error);
    return [];
  }
};

export const updateProject = async (projectId: string, updates: Partial<Project>) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// Customer Set management
export const createCustomerSet = async (setData: Omit<CustomerSet, 'id' | 'createdAt' | 'updatedAt'>) => {
  const customerSet: Omit<CustomerSet, 'id'> = {
    ...setData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, 'customerSets'), customerSet);
  return { id: docRef.id, ...customerSet };
};

export const getUserCustomerSets = async (userId: string): Promise<CustomerSet[]> => {
  try {
    const q = query(
      collection(db, 'customerSets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CustomerSet[];
  } catch (error) {
    console.error("Error getting user customer sets:", error);
    return [];
  }
};

export const updateCustomerSet = async (setId: string, updates: Partial<CustomerSet>) => {
  try {
    const docRef = doc(db, 'customerSets', setId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating customer set:", error);
    throw error;
  }
};

export const deleteCustomerSet = async (setId: string) => {
  try {
    await deleteDoc(doc(db, 'customerSets', setId));
  } catch (error) {
    console.error("Error deleting customer set:", error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToUserData = (userId: string, callback: (data: UserData | null) => void) => {
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserData);
    } else {
      callback(null);
    }
  });
};

export const subscribeToUserProjects = (userId: string, callback: (projects: Project[]) => void) => {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
    callback(projects);
  });
};

// Admin functions
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserData[];
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
};

export const updateUserRole = async (userId: string, role: 'admin' | 'setter' | 'closer' | 'manager') => {
  await updateUserData(userId, { role });
};

export const updateUserActive = async (userId: string, active: boolean) => {
  await updateUserData(userId, { active });
};

// Legacy functions for backward compatibility
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
