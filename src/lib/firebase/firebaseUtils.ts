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

// ===== ADDITIONAL FUNCTIONS FOR AUTHCONTEXT =====

// Get all users
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const database = getFirebaseDB();
    const snapshot = await get(ref(database, 'users'));
    
    if (snapshot.exists()) {
      const users: UserData[] = [];
      snapshot.forEach((childSnapshot) => {
        users.push({ id: childSnapshot.key!, ...childSnapshot.val() });
      });
      return users;
    }
    return [];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId: string, role: UserData['role']): Promise<void> => {
  try {
    const database = getFirebaseDB();
    await update(ref(database, `users/${userId}`), {
      role,
      updatedAt: new Date().toISOString(),
    });
    console.log(`User ${userId} role updated to ${role}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Update user active status
export const updateUserActive = async (userId: string, active: boolean): Promise<void> => {
  try {
    const database = getFirebaseDB();
    await update(ref(database, `users/${userId}`), {
      active,
      updatedAt: new Date().toISOString(),
    });
    console.log(`User ${userId} active status updated to ${active}`);
  } catch (error) {
    console.error('Error updating user active status:', error);
    throw error;
  }
};

// Update user data with backup
export const updateUserDataWithBackup = async (userId: string, updates: Partial<UserData>): Promise<void> => {
  try {
    // First create a backup
    await backupUserData(userId);
    
    // Then update the user data
    await updateUserData(userId, updates);
    
    console.log(`User ${userId} data updated with backup created`);
  } catch (error) {
    console.error('Error updating user data with backup:', error);
    throw error;
  }
};

// Backup user data
export const backupUserData = async (userId: string): Promise<void> => {
  try {
    const userData = await getUserData(userId);
    if (userData) {
      const database = getFirebaseDB();
      await set(ref(database, `userBackups/${userId}_${Date.now()}`), {
        ...userData,
        backupCreatedAt: new Date().toISOString(),
      });
      console.log(`User data backed up for ${userId}`);
    }
  } catch (error) {
    console.error('Error backing up user data:', error);
    throw error;
  }
};

// Backup all data
export const backupAllData = async (): Promise<void> => {
  try {
    const users = await getAllUsers();
    const database = getFirebaseDB();
    
    const backupData = {
      users,
      backupCreatedAt: new Date().toISOString(),
      backupType: 'full_system_backup'
    };
    
    await set(ref(database, `systemBackups/backup_${Date.now()}`), backupData);
    console.log('System backup created successfully');
  } catch (error) {
    console.error('Error creating system backup:', error);
    throw error;
  }
};

// Migrate user data
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
        active: userData.active ?? true,
        dealCount: userData.dealCount ?? 0,
        totalCommission: userData.totalCommission ?? 0,
        recentProjects: userData.recentProjects || [],
        commissionPayments: userData.commissionPayments || [],
        updatedAt: new Date().toISOString()
      };
      
      await updateUserData(userId, migratedData);
      console.log(`User data migrated for ${userId}`);
    }
  } catch (error) {
    console.error('Error migrating user data:', error);
    throw error;
  }
};

// Migrate all users
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

// Get data integrity check
export const getDataIntegrityCheck = async (): Promise<{
  totalUsers: number;
  usersWithMissingFields: string[];
  orphanedSets: string[];
  orphanedProjects: string[];
}> => {
  try {
    const users = await getAllUsers();
    const allSets = await get(ref(getFirebaseDB(), 'sets'));
    const allProjects = await get(ref(getFirebaseDB(), 'projects'));
    
    const usersWithMissingFields: string[] = [];
    const orphanedSets: string[] = [];
    const orphanedProjects: string[] = [];
    
    // Check users for missing required fields
    users.forEach(user => {
      if (!user.team || !user.region || !user.settings) {
        usersWithMissingFields.push(user.id);
      }
    });
    
    // Check for orphaned sets (sets without valid users)
    if (allSets.exists()) {
      allSets.forEach((setSnapshot) => {
        const set = setSnapshot.val();
        if (!users.find(u => u.id === set.userId)) {
          orphanedSets.push(set.id);
        }
      });
    }
    
    // Check for orphaned projects (projects without valid users)
    if (allProjects.exists()) {
      allProjects.forEach((projectSnapshot) => {
        const project = projectSnapshot.val();
        if (!users.find(u => u.id === project.userId)) {
          orphanedProjects.push(project.id);
        }
      });
    }
    
    return {
      totalUsers: users.length,
      usersWithMissingFields,
      orphanedSets,
      orphanedProjects
    };
  } catch (error) {
    console.error('Error performing data integrity check:', error);
    throw error;
  }
};

// Region and Team-based query functions
export const getClosersByRegion = async (region: string): Promise<UserData[]> => {
  try {
    const database = getFirebaseDB();
    const usersRef = ref(database, 'users');
    const regionQuery = query(usersRef, orderByChild('region'), equalTo(region));
    const snapshot = await get(regionQuery);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      return Object.values(users).filter((user: any) => 
        user.role === 'closer' && user.active !== false
      ) as UserData[];
    }
    return [];
  } catch (error) {
    console.error('Error getting closers by region:', error);
    return [];
  }
};

export const getUsersByRegion = async (region: string): Promise<UserData[]> => {
  try {
    const database = getFirebaseDB();
    const usersRef = ref(database, 'users');
    const regionQuery = query(usersRef, orderByChild('region'), equalTo(region));
    const snapshot = await get(regionQuery);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      return Object.values(users).filter((user: any) => 
        user.active !== false
      ) as UserData[];
    }
    return [];
  } catch (error) {
    console.error('Error getting users by region:', error);
    return [];
  }
};

export const getProjectsByRegion = async (region: string): Promise<Project[]> => {
  try {
    const database = getFirebaseDB();
    const projectsRef = ref(database, 'projects');
    const snapshot = await get(projectsRef);
    
    if (snapshot.exists()) {
      const projects = snapshot.val();
      return Object.values(projects).filter((project: any) => 
        project.region === region
      ) as Project[];
    }
    return [];
  } catch (error) {
    console.error('Error getting projects by region:', error);
    return [];
  }
};

export const getCustomerSetsByRegion = async (region: string): Promise<CustomerSet[]> => {
  try {
    const database = getFirebaseDB();
    const setsRef = ref(database, 'customerSets');
    const snapshot = await get(setsRef);
    
    if (snapshot.exists()) {
      const sets = snapshot.val();
      return Object.values(sets).filter((set: any) => 
        set.region === region
      ) as CustomerSet[];
    }
    return [];
  } catch (error) {
    console.error('Error getting customer sets by region:', error);
    return [];
  }
};

export const getUsersByTeam = async (team: string): Promise<UserData[]> => {
  try {
    const database = getFirebaseDB();
    const usersRef = ref(database, 'users');
    const teamQuery = query(usersRef, orderByChild('team'), equalTo(team));
    const snapshot = await get(teamQuery);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      return Object.values(users).filter((user: any) => 
        user.active !== false
      ) as UserData[];
    }
    return [];
  } catch (error) {
    console.error('Error getting users by team:', error);
    return [];
  }
};

export const getProjectsByTeam = async (team: string): Promise<Project[]> => {
  try {
    const database = getFirebaseDB();
    const projectsRef = ref(database, 'projects');
    const snapshot = await get(projectsRef);
    
    if (snapshot.exists()) {
      const projects = snapshot.val();
      return Object.values(projects).filter((project: any) => 
        project.team === team
      ) as Project[];
    }
    return [];
  } catch (error) {
    console.error('Error getting projects by team:', error);
    return [];
  }
};

export const getCustomerSetsByTeam = async (team: string): Promise<CustomerSet[]> => {
  try {
    const database = getFirebaseDB();
    const setsRef = ref(database, 'customerSets');
    const snapshot = await get(setsRef);
    
    if (snapshot.exists()) {
      const sets = snapshot.val();
      return Object.values(sets).filter((set: any) => 
        set.team === team
      ) as CustomerSet[];
    }
    return [];
  } catch (error) {
    console.error('Error getting customer sets by team:', error);
    return [];
  }
};
