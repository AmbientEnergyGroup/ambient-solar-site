import { auth, getFirebaseDB, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  child,
} from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// User data interface
export interface UserData {
  id: string;
  role: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin';
  managerRole?: 'rep' | 'manager' | 'admin';
  displayName: string;
  email: string;
  phoneNumber?: string;
  office?: 'Fresno' | 'Lancaster' | 'Bakersfield';
  team?: 'Team A' | 'Team B' | 'Team C' | 'Team D';
  region?: 'Region A' | 'Region B' | 'Region C' | 'Region D';
  payType?: 'Rookie' | 'Vet' | 'Pro';
  createdAt: string;
  updatedAt?: string;
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
  }>;
  settings?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  attachments?: string[];
  dealNumber?: number;
  commissionAmount?: number;
}

// Customer Set interface (for door-to-door sets)
export interface CustomerSet {
  id: string;
  userId: string; // Setter who created this set
  customerName: string;
  address: string;
  phoneNumber: string;
  email?: string;
  appointmentDate: string;
  appointmentTime: string;
  isSpanishSpeaker: boolean;
  notes: string;
  createdAt: string;
  status: "active" | "not_closed" | "closed" | "assigned";
  utilityBill?: string;
  closerId?: string; // ID of the closer who accepted this set
  closerName?: string; // Name of the closer who accepted this set
  assignedAt?: string; // When the set was assigned
  office?: string; // Office location
}

// Project interface (for completed sets that become projects)
export interface Project {
  id: string;
  userId: string; // Setter who created this project
  customerName: string;
  address: string;
  systemSize: number;
  grossPPW: string;
  financeType: string;
  lender: string;
  adders: string[];
  installDate?: string;
  paymentDate?: string;
  siteSurveyDate?: string;
  siteSurveyTime?: string;
  permitDate?: string;
  inspectionDate?: string;
  ptoDate?: string;
  paymentAmount: number;
  status: "pending" | "approved" | "cancelled" | "completed" | "site_survey" | "permit" | "install" | "inspection" | "pto";
  batteryType?: string;
  batteryQuantity?: number;
  panelType?: string;
  commissionRate: number;
  dealNumber?: number;
  createdAt: string;
  updatedAt?: string;
  utilityBill?: string;
  closerId?: string; // ID of the closer who worked on this
  closerName?: string; // Name of the closer who worked on this
}

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// User management functions
export const createUserData = async (user: User, additionalData: Partial<UserData> = {}): Promise<UserData> => {
  const userData: UserData = {
    id: user.uid,
    role: 'setter',
    displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    office: 'Fresno',
    team: 'Team A',
    region: 'Region A',
    payType: 'Rookie',
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
    },
    ...additionalData
  };

  const database = getFirebaseDB();
  await set(ref(database, `users/${user.uid}`), userData);
  return userData;
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const database = getFirebaseDB();
    const snapshot = await get(ref(database, `users/${userId}`));
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const updateUserData = async (userId: string, updates: Partial<UserData>) => {
  try {
    const database = getFirebaseDB();
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await update(ref(database, `users/${userId}`), updatesWithTimestamp);
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

// ===== SETS FUNCTIONS =====

// Create a new set
export const createSet = async (setData: Omit<CustomerSet, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const database = getFirebaseDB();
    const newSetRef = push(ref(database, 'sets'));
    const setId = newSetRef.key!;
    
    const setWithId = {
      ...setData,
      id: setId,
      createdAt: new Date().toISOString(),
    };
    
    await set(newSetRef, setWithId);
    console.log('Set created with ID:', setId);
    return setId;
  } catch (error) {
    console.error('Error creating set:', error);
    throw error;
  }
};

// Get all sets for a specific user (setter)
export const getUserSets = async (userId: string): Promise<CustomerSet[]> => {
  try {
    const database = getFirebaseDB();
    const snapshot = await get(query(ref(database, 'sets'), orderByChild('userId'), equalTo(userId)));
    
    if (snapshot.exists()) {
      const sets: CustomerSet[] = [];
      snapshot.forEach((childSnapshot) => {
        sets.push(childSnapshot.val());
      });
      return sets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error('Error getting user sets:', error);
    throw error;
  }
};

// Get all available sets (for closers to see)
export const getAvailableSets = async (): Promise<CustomerSet[]> => {
  try {
    const database = getFirebaseDB();
    const snapshot = await get(query(ref(database, 'sets'), orderByChild('status'), equalTo('active')));
    
    if (snapshot.exists()) {
      const sets: CustomerSet[] = [];
      snapshot.forEach((childSnapshot) => {
        sets.push(childSnapshot.val());
      });
      return sets.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    }
    return [];
  } catch (error) {
    console.error('Error getting available sets:', error);
    throw error;
  }
};

// Get sets assigned to a specific closer
export const getCloserSets = async (closerId: string): Promise<CustomerSet[]> => {
  try {
    const database = getFirebaseDB();
    const snapshot = await get(query(ref(database, 'sets'), orderByChild('closerId'), equalTo(closerId)));
    
    if (snapshot.exists()) {
      const sets: CustomerSet[] = [];
      snapshot.forEach((childSnapshot) => {
        sets.push(childSnapshot.val());
      });
      return sets.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    }
    return [];
  } catch (error) {
    console.error('Error getting closer sets:', error);
    throw error;
  }
};

// Assign a set to a closer
export const assignSetToCloser = async (
  setId: string, 
  closerId: string, 
  closerName: string
): Promise<void> => {
  try {
    const database = getFirebaseDB();
    const updates = {
      [`sets/${setId}/closerId`]: closerId,
      [`sets/${setId}/closerName`]: closerName,
      [`sets/${setId}/status`]: 'assigned',
      [`sets/${setId}/assignedAt`]: new Date().toISOString(),
    };
    
    await update(ref(database), updates);
    console.log(`Set ${setId} assigned to closer ${closerName}`);
  } catch (error) {
    console.error('Error assigning set to closer:', error);
    throw error;
  }
};

// Update set status
export const updateSetStatus = async (setId: string, status: CustomerSet['status']): Promise<void> => {
  try {
    const database = getFirebaseDB();
    const updates = {
      [`sets/${setId}/status`]: status,
      [`sets/${setId}/updatedAt`]: new Date().toISOString(),
    };
    
    await update(ref(database), updates);
    console.log(`Set ${setId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating set status:', error);
    throw error;
  }
};

// Delete a set
export const deleteSet = async (setId: string): Promise<void> => {
  try {
    const database = getFirebaseDB();
    await remove(ref(database, `sets/${setId}`));
    console.log(`Set ${setId} deleted`);
  } catch (error) {
    console.error('Error deleting set:', error);
    throw error;
  }
};

// Real-time subscription to user sets
export const subscribeToUserSets = (
  userId: string, 
  callback: (sets: CustomerSet[]) => void
): (() => void) => {
  const database = getFirebaseDB();
  const setsRef = query(ref(database, 'sets'), orderByChild('userId'), equalTo(userId));
  
  const handleSnapshot = (snapshot: any) => {
    if (snapshot.exists()) {
      const sets: CustomerSet[] = [];
      snapshot.forEach((childSnapshot: any) => {
        sets.push(childSnapshot.val());
      });
      callback(sets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      callback([]);
    }
  };
  
  onValue(setsRef, handleSnapshot);
  
  return () => off(setsRef, 'value', handleSnapshot);
};

// Real-time subscription to available sets (for closers)
export const subscribeToAvailableSets = (
  callback: (sets: CustomerSet[]) => void
): (() => void) => {
  const database = getFirebaseDB();
  const setsRef = query(ref(database, 'sets'), orderByChild('status'), equalTo('active'));
  
  const handleSnapshot = (snapshot: any) => {
    if (snapshot.exists()) {
      const sets: CustomerSet[] = [];
      snapshot.forEach((childSnapshot: any) => {
        sets.push(childSnapshot.val());
      });
      callback(sets.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()));
    } else {
      callback([]);
    }
  };
  
  onValue(setsRef, handleSnapshot);
  
  return () => off(setsRef, 'value', handleSnapshot);
};

// Real-time subscription to closer's assigned sets
export const subscribeToCloserSets = (
  closerId: string,
  callback: (sets: CustomerSet[]) => void
): (() => void) => {
  const database = getFirebaseDB();
  const setsRef = query(ref(database, 'sets'), orderByChild('closerId'), equalTo(closerId));
  
  const handleSnapshot = (snapshot: any) => {
    if (snapshot.exists()) {
      const sets: CustomerSet[] = [];
      snapshot.forEach((childSnapshot: any) => {
        sets.push(childSnapshot.val());
      });
      callback(sets.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()));
    } else {
      callback([]);
    }
  };
  
  onValue(setsRef, handleSnapshot);
  
  return () => off(setsRef, 'value', handleSnapshot);
};

// ===== PROJECTS FUNCTIONS =====

// Create a new project
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const database = getFirebaseDB();
    const newProjectRef = push(ref(database, 'projects'));
    const projectId = newProjectRef.key!;
    
    const projectWithId = {
      ...projectData,
      id: projectId,
      createdAt: new Date().toISOString(),
    };
    
    await set(newProjectRef, projectWithId);
    console.log('Project created with ID:', projectId);
    return projectId;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Get all projects for a specific user
export const getUserProjects = async (userId: string): Promise<Project[]> => {
  try {
    const database = getFirebaseDB();
    const snapshot = await get(query(ref(database, 'projects'), orderByChild('userId'), equalTo(userId)));
    
    if (snapshot.exists()) {
      const projects: Project[] = [];
      snapshot.forEach((childSnapshot) => {
        projects.push(childSnapshot.val());
      });
      return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
};

// Update project status
export const updateProjectStatus = async (projectId: string, status: Project['status']): Promise<void> => {
  try {
    const database = getFirebaseDB();
    const updates = {
      [`projects/${projectId}/status`]: status,
      [`projects/${projectId}/updatedAt`]: new Date().toISOString(),
    };
    
    await update(ref(database), updates);
    console.log(`Project ${projectId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating project status:', error);
    throw error;
  }
};

// Real-time subscription to user projects
export const subscribeToUserProjects = (
  userId: string, 
  callback: (projects: Project[]) => void
): (() => void) => {
  const database = getFirebaseDB();
  const projectsRef = query(ref(database, 'projects'), orderByChild('userId'), equalTo(userId));
  
  const handleSnapshot = (snapshot: any) => {
    if (snapshot.exists()) {
      const projects: Project[] = [];
      snapshot.forEach((childSnapshot: any) => {
        projects.push(childSnapshot.val());
      });
      callback(projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      callback([]);
    }
  };
  
  onValue(projectsRef, handleSnapshot);
  
  return () => off(projectsRef, 'value', handleSnapshot);
};
