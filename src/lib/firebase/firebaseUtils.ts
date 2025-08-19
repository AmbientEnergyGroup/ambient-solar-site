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
  role: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin';
  displayName: string;
  email: string;
  phoneNumber?: string;
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
export const createUserData = async (user: User, role: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin' = 'setter') => {
  const userData: UserData = {
    id: user.uid,
    role,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    phoneNumber: user.phoneNumber || undefined,
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
    
    // Recursively filter out undefined values before sending to Firestore
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => {
        if (value === undefined) return false;
        if (typeof value === 'object' && value !== null) {
          // Check if any nested values are undefined
          return !Object.values(value).some(v => v === undefined);
        }
        return true;
      })
    );
    
    console.log('Clean updates being sent to Firestore:', cleanUpdates);
    
    await updateDoc(docRef, {
      ...cleanUpdates,
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

export const updateUserRole = async (userId: string, role: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin') => {
  await updateUserData(userId, { role });
};

export const updateUserActive = async (userId: string, active: boolean) => {
  await updateUserData(userId, { active });
};

// Region and Team-based data access functions
export const getUsersByRegion = async (region: string): Promise<UserData[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('region', '==', region),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserData[];
  } catch (error) {
    console.error("Error getting users by region:", error);
    return [];
  }
};

export const getClosersByRegion = async (region: string): Promise<UserData[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('region', '==', region),
      where('role', '==', 'closer'),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserData[];
  } catch (error) {
    console.error("Error getting closers by region:", error);
    return [];
  }
};

export const getUsersByTeam = async (team: string): Promise<UserData[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('team', '==', team),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserData[];
  } catch (error) {
    console.error("Error getting users by team:", error);
    return [];
  }
};

export const getProjectsByRegion = async (region: string): Promise<Project[]> => {
  try {
    // First get all users in the region
    const regionUsers = await getUsersByRegion(region);
    const userIds = regionUsers.map(user => user.id);
    
    if (userIds.length === 0) return [];
    
    // Get all projects for users in this region
    const q = query(
      collection(db, 'projects'),
      where('userId', 'in', userIds)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  } catch (error) {
    console.error("Error getting projects by region:", error);
    return [];
  }
};

export const getCustomerSetsByRegion = async (region: string): Promise<CustomerSet[]> => {
  try {
    // First get all users in the region
    const regionUsers = await getUsersByRegion(region);
    const userIds = regionUsers.map(user => user.id);
    
    if (userIds.length === 0) return [];
    
    // Get all customer sets for users in this region
    const q = query(
      collection(db, 'customerSets'),
      where('userId', 'in', userIds)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CustomerSet[];
  } catch (error) {
    console.error("Error getting customer sets by region:", error);
    return [];
  }
};

export const getProjectsByTeam = async (team: string): Promise<Project[]> => {
  try {
    // First get all users in the team
    const teamUsers = await getUsersByTeam(team);
    const userIds = teamUsers.map(user => user.id);
    
    if (userIds.length === 0) return [];
    
    // Get all projects for users in this team
    const q = query(
      collection(db, 'projects'),
      where('userId', 'in', userIds)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
  } catch (error) {
    console.error("Error getting projects by team:", error);
    return [];
  }
};

export const getCustomerSetsByTeam = async (team: string): Promise<CustomerSet[]> => {
  try {
    // First get all users in the team
    const teamUsers = await getUsersByTeam(team);
    const userIds = teamUsers.map(user => user.id);
    
    if (userIds.length === 0) return [];
    
    // Get all customer sets for users in this team
    const q = query(
      collection(db, 'customerSets'),
      where('userId', 'in', userIds)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CustomerSet[];
  } catch (error) {
    console.error("Error getting customer sets by team:", error);
    return [];
  }
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

// Data Protection and Backup Functions
export const backupUserData = async (userId: string): Promise<void> => {
  try {
    const userData = await getUserData(userId);
    if (userData) {
      // Create backup in a separate collection
      await setDoc(doc(db, 'userBackups', `${userId}_${Date.now()}`), {
        ...userData,
        backupCreatedAt: new Date().toISOString(),
        originalUserId: userId
      });
      console.log(`Backup created for user ${userId}`);
    }
  } catch (error) {
    console.error('Error creating user backup:', error);
  }
};

export const backupAllData = async (): Promise<void> => {
  try {
    const users = await getAllUsers();
    const projects = await getDocs(collection(db, 'projects'));
    const customerSets = await getDocs(collection(db, 'customerSets'));
    
    const backupData = {
      users: users,
      projects: projects.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      customerSets: customerSets.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      backupCreatedAt: new Date().toISOString(),
      backupVersion: '1.0'
    };
    
    await setDoc(doc(db, 'systemBackups', `backup_${Date.now()}`), backupData);
    console.log('System backup created successfully');
  } catch (error) {
    console.error('Error creating system backup:', error);
  }
};

export const restoreUserData = async (userId: string, backupId: string): Promise<void> => {
  try {
    const backupDoc = await getDoc(doc(db, 'userBackups', backupId));
    if (backupDoc.exists()) {
      const backupData = backupDoc.data();
      await setDoc(doc(db, 'users', userId), backupData);
      console.log(`User data restored for ${userId}`);
    }
  } catch (error) {
    console.error('Error restoring user data:', error);
  }
};

export const getDataIntegrityCheck = async (): Promise<{
  users: number;
  projects: number;
  customerSets: number;
  lastBackup: string | null;
  integrityScore: number;
}> => {
  try {
    const users = await getAllUsers();
    const projects = await getDocs(collection(db, 'projects'));
    const customerSets = await getDocs(collection(db, 'customerSets'));
    
    // Get latest backup
    const backups = await getDocs(collection(db, 'systemBackups'));
    const latestBackup = backups.docs.length > 0 
      ? backups.docs[backups.docs.length - 1].data().backupCreatedAt 
      : null;
    
    const integrityScore = Math.min(100, (users.length + projects.docs.length + customerSets.docs.length) / 10);
    
    return {
      users: users.length,
      projects: projects.docs.length,
      customerSets: customerSets.docs.length,
      lastBackup: latestBackup,
      integrityScore
    };
  } catch (error) {
    console.error('Error checking data integrity:', error);
    return {
      users: 0,
      projects: 0,
      customerSets: 0,
      lastBackup: null,
      integrityScore: 0
    };
  }
};

// Enhanced update functions with automatic backups
export const updateUserDataWithBackup = async (userId: string, updates: Partial<UserData>): Promise<void> => {
  try {
    // Create backup before update
    await backupUserData(userId);
    
    // Perform the update
    await updateUserData(userId, updates);
    
    console.log(`User data updated with backup for ${userId}`);
  } catch (error) {
    console.error('Error updating user data with backup:', error);
    throw error;
  }
};

export const createProjectWithBackup = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  try {
    // Create backup before adding project
    await backupUserData(projectData.userId);
    
    // Create the project
    const project = await createProject(projectData);
    
    console.log(`Project created with backup for user ${projectData.userId}`);
    return project;
  } catch (error) {
    console.error('Error creating project with backup:', error);
    throw error;
  }
};

export const updateProjectWithBackup = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  try {
    // Get project to find userId
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (projectDoc.exists()) {
      const projectData = projectDoc.data() as Project;
      await backupUserData(projectData.userId);
    }
    
    // Perform the update
    await updateProject(projectId, updates);
    
    console.log(`Project updated with backup for project ${projectId}`);
  } catch (error) {
    console.error('Error updating project with backup:', error);
    throw error;
  }
};

// Data migration and version control
export const migrateUserData = async (userId: string): Promise<void> => {
  try {
    const userData = await getUserData(userId);
    if (userData) {
      // Ensure all required fields exist
      const migratedData: UserData = {
        ...userData,
        team: userData.team || 'Team A',
        region: userData.region || 'Region A',
        settings: {
          notifications: userData.settings?.notifications ?? true,
          theme: userData.settings?.theme || 'auto',
          language: userData.settings?.language || 'en'
        },
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', userId), migratedData);
      console.log(`User data migrated for ${userId}`);
    }
  } catch (error) {
    console.error('Error migrating user data:', error);
  }
};

export const migrateAllUsers = async (): Promise<void> => {
  try {
    const users = await getAllUsers();
    for (const user of users) {
      await migrateUserData(user.id);
    }
    console.log(`Migrated ${users.length} users`);
  } catch (error) {
    console.error('Error migrating all users:', error);
  }
};
