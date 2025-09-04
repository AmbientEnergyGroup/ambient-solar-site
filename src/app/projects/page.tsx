"use client";

import { useState, useEffect, useCallback } from "react";
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
// import { updateUserData } from "@/lib/firebase/firebaseUtils";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Download,
  FileText,
  Pencil,
  Filter,
  ArrowUpDown,
  BarChart3, 
  Users, 
  LogOut, 
  Home, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Zap, 
  Calendar, 
  Edit2
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";
import AmbientLogo from "@/components/AmbientLogo";
import { 
  calculateTeamEarnings, 
  calculateTeamRevenue, 
  calculateProjectCommission,
  Project as SharedProject 
} from "@/lib/utils/commissionCalculations";

// Helper function to clear old project data from localStorage
const clearOldProjectData = (userId: string) => {
  try {
    // Clear all project-related localStorage items for this user
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes(`projectState_${userId}`) || 
                  key.includes(`projects_${userId}`) || 
                  key.includes(`userProjects_${userId}`) ||
                  key.includes(`projectCache_${userId}`))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} old project data items for user ${userId}`);
  } catch (error) {
    console.error('Error clearing old project data:', error);
  }
};

// Interface for project data
interface Project {
  id: string;
  customerName: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  installDate: string;
  paymentAmount: number;
  paymentDate: string;
  siteSurveyDate?: string;
  permitDate?: string; // New field for permit date
  inspectionDate?: string; // New field for inspection date
  ptoDate?: string; // New field for PTO date
  status: "site_survey" | "install" | "pto" | "paid" | "cancelled" | "on_hold";
  // Adder fields for accurate commission calculation
  eaBattery?: boolean; // E/A Battery $8,000
  backupBattery?: boolean; // Backup Battery $13,000
  mpu?: boolean; // MPU $3,500
  hti?: boolean; // HTI $2,500
  reroof?: boolean; // Reroof $15,000
  // Legacy fields (keeping for compatibility)
  batteryType?: string;
  batteryQuantity?: number;
  panelType?: string;
  grossPPW?: string;
  systemSize?: string;
  financeType?: string;
  lender?: string;
  documents?: {
    utilityBill?: string;
    contract?: string;
    permitPlans?: string;
  };
  userId: string;
  commissionRate?: number; // Commission rate per kW based on tier
  dealNumber?: number; // Which deal number this is for the user (1st, 5th, etc.)
  createdAt?: string;
  cancelledDate?: string; // New field for cancelled date
}

// Mock project data
const mockProjects: Project[] = [
  {
    id: "1",
    customerName: "Salvador Pineda",
    address: "1234 Main St, City, CA",
    phoneNumber: "(555) 123-4567",
    email: "salvador.pineda@email.com",
    installDate: "2023-04-09",
    paymentAmount: 25000, // Increased from 13415 to realistic value
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.5",
    grossPPW: "7.14", // $7.14/W = $25,000 ÷ (3.5 × 1000)
    eaBattery: true, // $8,000 adder
    mpu: true // $3,500 adder
  },
  {
    id: "2",
    customerName: "Jacky",
    address: "2345 Oak Ave, City, CA",
    phoneNumber: "(555) 234-5678",
    email: "jacky@email.com",
    installDate: "2023-04-09",
    paymentAmount: 28000, // Increased from 12417 to realistic value
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "8.75", // $8.75/W = $28,000 ÷ (3.2 × 1000)
    backupBattery: true // $13,000 adder
  },
  {
    id: "3",
    customerName: "Eric Rivera",
    address: "3456 Pine Rd, City, CA",
    phoneNumber: "(555) 345-6789",
    email: "eric.rivera@email.com",
    installDate: "2023-04-09",
    paymentAmount: 22000, // Increased from 12417 to realistic value
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "6.88" // $6.88/W = $22,000 ÷ (3.2 × 1000)
  },
  {
    id: "4",
    customerName: "Cynthia Ayala",
    address: "4567 Cedar Blvd, City, CA",
    phoneNumber: "(555) 456-7890",
    email: "cynthia.ayala@email.com",
    installDate: "2023-04-09",
    paymentAmount: 24000, // Increased from 12417 to realistic value
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "7.50" // $7.50/W = $24,000 ÷ (3.2 × 1000)
  },
  {
    id: "5",
    customerName: "Carlos Ayala",
    address: "5678 Spruce St, City, CA",
    phoneNumber: "(555) 567-8901",
    email: "carlos.ayala@email.com",
    installDate: "2023-04-09",
    paymentAmount: 26000, // Increased from 12417 to realistic value
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "8.13" // $8.13/W = $26,000 ÷ (3.2 × 1000)
  },
  {
    id: "6",
    customerName: "Alexander Sanchez",
    address: "6789 Maple Dr, City, CA",
    phoneNumber: "(555) 678-9012",
    email: "alexander.sanchez@email.com",
    installDate: "2023-04-09",
    paymentAmount: 23000, // Increased from 12417 to realistic value
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "7.19" // $7.19/W = $23,000 ÷ (3.2 × 1000)
  },
  {
    id: "7",
    customerName: "Jose Martinez",
    address: "7890 Birch Ln, City, CA",
    phoneNumber: "(555) 789-0123",
    email: "jose.martinez@email.com",
    installDate: "2023-04-09",
    paymentAmount: 25000, // Increased from 12417 to realistic value
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "7.81" // $7.81/W = $25,000 ÷ (3.2 × 1000)
  },
  {
    id: "8",
    customerName: "Hugo Gutierrez",
    address: "8901 Willow Way, City, CA",
    phoneNumber: "(555) 890-1234",
    email: "hugo.gutierrez@email.com",
    installDate: "2023-04-09",
    paymentAmount: 12417.00,
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "3.88" // $3.88/W = $12,417 ÷ (3.2 × 1000)
  },
  {
    id: "9",
    customerName: "Rogelio Gutierrez",
    address: "9012 Redwood Ct, City, CA",
    phoneNumber: "(555) 901-2345",
    email: "rogelio.gutierrez@email.com",
    installDate: "2023-04-09",
    paymentAmount: 12417.00,
    paymentDate: "2023-09-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "3.88" // $3.88/W = $12,417 ÷ (3.2 × 1000)
  },
  {
    id: "10",
    customerName: "Luis Ayala",
    address: "10123 Aspen Pl, City, CA",
    phoneNumber: "(555) 012-3456",
    email: "luis.ayala@email.com",
    installDate: "2023-04-09",
    paymentAmount: 12417.00,
    paymentDate: "2023-04-09",
    status: "paid",
    userId: "user1",
    systemSize: "3.2",
    grossPPW: "3.88" // $3.88/W = $12,417 ÷ (3.2 × 1000)
  }
];

/**
 * Projects Page Component
 * 
 * Data Persistence Strategy:
 * - Pay Type: Stored in localStorage with user-specific keys (userPayType_${userId})
 * - User Data: Stored in localStorage with user-specific keys (userData_${userId})
 * - Projects: Stored in localStorage with global key but filtered by userId
 * - All data survives: browser refresh, logout/login, site updates
 * - Data is user-specific and isolated between different users
 */
export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [cancelledProjects, setCancelledProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Project>("paymentDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterStatus, setFilterStatus] = useState<"all" | "cancelled" | "site_survey" | "install" | "pto" | "paid" | "on_hold">("all");
  const [activeTab, setActiveTab] = useState<"active" | "cancelled">("active");
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode, toggleTheme } = useTheme();
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    installDate: "",
    paymentDate: "",
    siteSurveyDate: "",
    permitDate: "",
    inspectionDate: "",
    ptoDate: ""
  });
  
  // Customer info modal state
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Project | null>(null);
  
  // Commission formula modal state
  const [showCommissionFormulaModal, setShowCommissionFormulaModal] = useState(false);
  
  // Project-specific commission breakdown modal state
  const [showProjectCommissionModal, setShowProjectCommissionModal] = useState(false);
  const [selectedProjectForBreakdown, setSelectedProjectForBreakdown] = useState<{
    project: Project;
    systemSize: number;
    grossPPW: number;
    contractPrice: number;
    baseCost: number;
    adders: number;
    totalCost: number;
    commissionAmount: number;
    commissionPercentage: number;
    finalCommission: number;
    selectedPayType: string;
  } | null>(null);
  const [userStats, setUserStats] = useState({
    dealCount: 0,
    totalCommission: 0,
    tier1Deals: 0,
    tier2Deals: 0
  });
  const [companyStats, setCompanyStats] = useState({
    totalRevenue: 0,
    avgSystemSize: 0,
    avgContractValue: 0
  });
  
  const auth = useAuth();
  const { user, userData, loading, signOut, isAdmin } = auth || {};
  const router = useRouter();
  
  // Pay type from user data (read-only)
  const selectedPayType = (userData?.payType as 'Rookie' | 'Vet' | 'Pro') || 'Rookie';


  // Calculate upfront pay based on pay type and deal count
  const calculateUpfrontPay = () => {
    const upfrontRate = selectedPayType === 'Rookie' ? 300 : selectedPayType === 'Vet' ? 600 : 800;
    return userStats.dealCount * upfrontRate;
  };

  // Get user-specific projects data
  const getUserProjects = () => {
    if (!user?.uid) return [];
    
    const storedProjects = localStorage.getItem('projects');
    let projectsData: Project[] = [];
    
    if (storedProjects) {
      try {
        projectsData = JSON.parse(storedProjects);
      } catch (e) {
        console.error('Error parsing projects from localStorage:', e);
        return [];
      }
    }
    
    // Filter projects for current user (unless admin)
    if (!isAdmin) {
      const filteredProjects = projectsData.filter(project => project.userId === user.uid);
      
      // If no projects found for current user, temporarily return all projects for debugging
      if (filteredProjects.length === 0) {
        projectsData = projectsData;
      } else {
        projectsData = filteredProjects;
      }
    }
    
    return projectsData;
  };



  // Calculate milestone commission for a single project
  const calculateProjectMilestoneCommission = (project: Project) => {
    if (!project.systemSize || !project.grossPPW) {
      return 0;
    }
    
    // Convert systemSize to number (remove 'kW' if present)
    const systemSize = typeof project.systemSize === 'string' 
      ? parseFloat(project.systemSize.replace('kW', '').trim()) 
      : parseFloat(project.systemSize);
    
    // Convert grossPPW to number
    const grossPPW = parseFloat(project.grossPPW);
    
    if (isNaN(systemSize) || isNaN(grossPPW)) {
      return 0;
    }
    
    // Calculate contract price: PPW × System Size × 1000
    const contractPrice = grossPPW * systemSize * 1000;
    
    // Calculate base cost: kW × $3,500
    const baseCost = systemSize * 3500;
    
    // Calculate adders using the specific values
    let adders = 0;
    
    // E/A Battery: $8,000
    if (project.eaBattery) {
      adders += 8000;
    }
    
    // Backup Battery: $13,000
    if (project.backupBattery) {
      adders += 13000;
    }
    
    // MPU: $3,500
    if (project.mpu) {
      adders += 3500;
    }
    
    // HTI: $2,500
    if (project.hti) {
      adders += 2500;
    }
    
    // Reroof: $15,000
    if (project.reroof) {
      adders += 15000;
    }
    
    // Calculate total cost: Base cost + Adders
    const totalCost = baseCost + adders;
    
    // Calculate commission: Contract Price - Total Cost
    const commissionAmount = contractPrice - totalCost;
    
    // Apply user's commission percentage
    let commissionPercentage = 0;
    switch (selectedPayType) {
      case 'Rookie':
        commissionPercentage = 0.24; // 24%
        break;
      case 'Vet':
        commissionPercentage = 0.39; // 39%
        break;
      case 'Pro':
        commissionPercentage = 0.50; // 50%
        break;
      default:
        commissionPercentage = 0.24; // Default to Rookie
    }
    
    // Calculate final milestone commission
    const milestoneCommission = Math.max(0, commissionAmount) * commissionPercentage;
    
    return milestoneCommission;
  };

  // Debug function to test commission calculation
  const testCommissionCalculation = () => {
    console.log("===== TESTING COMMISSION CALCULATION =====");
    
    // Test case 1: 3.5 kW system, $25,000 contract, E/A Battery + MPU
    const testProject1: Project = {
      id: "test1",
      customerName: "Test Customer 1",
      address: "Test Address",
      installDate: "2024-01-01",
      paymentAmount: 25000,
      paymentDate: "2024-01-01",
      status: "paid",
      userId: "test",
      systemSize: "3.5",
      eaBattery: true,
      mpu: true
    };
    
    console.log("Test Project 1:", testProject1);
    console.log("Expected calculation:");
    console.log("Base cost: 3.5 kW × $3,500 = $12,250");
    console.log("Adders: E/A Battery $8,000 + MPU $3,500 = $11,500");
    console.log("Total cost: $12,250 + $11,500 = $23,750");
    console.log("Commission amount: $25,000 - $23,750 = $1,250");
    console.log("Rookie commission (24%): $1,250 × 0.24 = $300");
    
    const result1 = calculateProjectMilestoneCommission(testProject1);
    console.log("Actual result:", result1);
    
    // Test case 2: 4.0 kW system, $30,000 contract, no adders
    const testProject2: Project = {
      id: "test2",
      customerName: "Test Customer 2",
      address: "Test Address",
      installDate: "2024-01-01",
      paymentAmount: 30000,
      paymentDate: "2024-01-01",
      status: "paid",
      userId: "test",
      systemSize: "4.0"
    };
    
    console.log("\nTest Project 2:", testProject2);
    console.log("Expected calculation:");
    console.log("Base cost: 4.0 kW × $3,500 = $14,000");
    console.log("Adders: $0");
    console.log("Total cost: $14,000");
    console.log("Commission amount: $30,000 - $14,000 = $16,000");
    console.log("Rookie commission (24%): $16,000 × 0.24 = $3,840");
    
    const result2 = calculateProjectMilestoneCommission(testProject2);
    console.log("Actual result:", result2);
    
    console.log("===== END TEST =====");
  };

  // Calculate milestone pay based on pay type and commission percentages using shared logic
  const calculateMilestonePay = () => {
    // Get user-specific projects
    const projectsData = getUserProjects();
    const currentYear = new Date().getFullYear();
    
    // Filter projects for current year and not cancelled
    const currentYearProjects = projectsData.filter(project => 
      project.installDate && 
      new Date(project.installDate).getFullYear() === currentYear &&
      project.status !== 'cancelled'
    );
    
    // Calculate total milestone pay using shared calculation logic
    const totalMilestonePay = calculateTeamEarnings(currentYearProjects, currentYear, selectedPayType as 'Rookie' | 'Vet' | 'Pro');
    
    return totalMilestonePay;
  };

  // Function to refresh projects data
  const refreshProjects = useCallback(() => {
    // Add debugging for localStorage 
    console.log("===== DEBUGGING PROJECTS =====");
    
    const storedProjects = localStorage.getItem('projects');
    const storedCancelledProjects = localStorage.getItem('cancelledProjects');
    console.log("Raw localStorage 'projects':", storedProjects);
    console.log("Raw localStorage 'cancelledProjects':", storedCancelledProjects);
    
    let projectsData: Project[] = [];
    let cancelledProjectsData: Project[] = [];
    
    // First check if we have any projects saved
    if (storedProjects) {
      try {
        projectsData = JSON.parse(storedProjects);
        console.log("Parsed projects from localStorage:", projectsData);
        console.log("Total projects count:", projectsData.length);
        
        // Log each project's data to diagnose issues
        projectsData.forEach((project, index) => {
          console.log(`Project ${index + 1}:`, {
            id: project.id,
            name: project.customerName,
            userId: project.userId,
            currentUserId: user?.uid || 'no-user'
          });
        });
      } catch (e) {
        console.error("Error parsing projects from localStorage:", e);
        projectsData = [];
      }
    } else {
      // Use mock data only if we don't have any saved projects
      console.log("No projects in localStorage, using mock data");
      
      // Update mock projects to use current user's ID
      const mockProjectsWithCurrentUser = mockProjects.map(project => ({
        ...project,
        userId: user?.uid || 'default-user'
      }));
      
      projectsData = mockProjectsWithCurrentUser;
      
      // Save mock data to localStorage to initialize
      localStorage.setItem('projects', JSON.stringify(mockProjectsWithCurrentUser));
    }
    
    // Check for cancelled projects
    if (storedCancelledProjects) {
      try {
        cancelledProjectsData = JSON.parse(storedCancelledProjects);
        console.log("Parsed cancelled projects from localStorage:", cancelledProjectsData);
        console.log("Total cancelled projects count:", cancelledProjectsData.length);
      } catch (e) {
        console.error("Error parsing cancelled projects from localStorage:", e);
        cancelledProjectsData = [];
      }
    } else {
      // Initialize empty array for cancelled projects
      localStorage.setItem('cancelledProjects', JSON.stringify([]));
    }
    
    // Only show projects for the current user (unless they're an admin)
    if (user) {
      // Safeguard against projects with missing userId
      projectsData = projectsData.map(project => {
        if (!project.userId && user) {
          // If project is missing userId, assign current user's ID
          return { ...project, userId: user.uid };
        }
        return project;
      });
      
      cancelledProjectsData = cancelledProjectsData.map(project => {
        if (!project.userId && user) {
          return { ...project, userId: user.uid };
        }
        return project;
      });
      
      // Use the isAdmin from auth context, fallback to true for development
      const userIsAdmin = isAdmin || true;
      
      // More lenient filtering to ensure all projects show up
      // Modified to handle case-insensitive or partial user ID matches when using restored sessions
      const filteredProjects = userIsAdmin 
        ? projectsData 
        : projectsData.filter(project => {
            // Check for exact match
            let match = project.userId === user.uid;
            
            // Add fallback matching - if the project has the same email base as the current user
            // This handles cases where user IDs might change due to session restoration
            if (!match && user.email) {
              const currentUserBase = user.email.split('@')[0].toLowerCase();
              const savedEmail = localStorage.getItem('userEmail');
              if (savedEmail) {
                const savedEmailBase = savedEmail.split('@')[0].toLowerCase();
                // If project belongs to a user with the same email base, consider it a match
                if (currentUserBase === savedEmailBase) {
                  console.log(`Project ${project.id} matched by email base`);
                  match = true;
                }
              }
            }
            
            if (!match) {
              console.log(`Project ${project.id} (${project.customerName}) filtered out - userId mismatch:`, project.userId, user.uid);
            }
            return match;
          });
      
      // Handle cancelled projects with same fallback mechanism
      const filteredCancelledProjects = isAdmin
        ? cancelledProjectsData
        : cancelledProjectsData.filter(project => {
            let match = project.userId === user.uid;
            if (!match && user.email) {
              const currentUserBase = user.email.split('@')[0].toLowerCase();
              const savedEmail = localStorage.getItem('userEmail');
              if (savedEmail) {
                const savedEmailBase = savedEmail.split('@')[0].toLowerCase();
                if (currentUserBase === savedEmailBase) {
                  match = true;
                }
              }
            }
            return match;
          });
      
      console.log("Current user ID:", user.uid);
      console.log("User role:", user.role || "unknown");
      console.log("Filtered projects count:", filteredProjects.length);
      console.log("Filtered cancelled projects count:", filteredCancelledProjects.length);
      
      // Calculate user statistics - exclude cancelled projects from all metrics
      const activeProjects = filteredProjects.filter(p => p.status !== "cancelled");
      const dealCount = activeProjects.length;
      const tier1Deals = activeProjects.filter(p => (p.dealNumber || 0) <= 10).length;
      const tier2Deals = activeProjects.filter(p => (p.dealNumber || 0) > 10 && (p.dealNumber || 0) <= 20).length;
      const totalCommission = activeProjects.reduce((sum, project) => sum + (project.paymentAmount || 0), 0);

      // Calculate company statistics - exclude cancelled projects
      const projectsWithSystemSize = activeProjects.filter(p => p.systemSize && parseFloat(p.systemSize) > 0);
      const projectsWithPPW = activeProjects.filter(p => p.grossPPW && p.systemSize && parseFloat(p.grossPPW) > 0);
      
      // Calculate average system size (in kW)
      const avgSystemSize = projectsWithSystemSize.length > 0
        ? projectsWithSystemSize.reduce((sum, p) => sum + parseFloat(p.systemSize || '0'), 0) / projectsWithSystemSize.length
        : 0;
      
      // Calculate total revenue (gross contract value sum)
      const totalRevenue = projectsWithPPW.reduce((sum, p) => {
        const systemSize = parseFloat(p.systemSize || '0');
        const ppw = parseFloat(p.grossPPW || '0');
        return sum + (systemSize * ppw * 1000); // kW * PPW * 1000 = total contract value
      }, 0);
      
      // Calculate average contract value
      const avgContractValue = projectsWithPPW.length > 0
        ? totalRevenue / projectsWithPPW.length
        : 0;
      
      // Update stats states
      setUserStats({
        dealCount,
        tier1Deals,
        tier2Deals,
        totalCommission
      });
      
      setCompanyStats({
        totalRevenue,
        avgSystemSize,
        avgContractValue
      });

      // Sort projects by deal number
      filteredProjects.sort((a, b) => {
        const aDealNum = a.dealNumber || 0;
        const bDealNum = b.dealNumber || 0;
        return aDealNum - bDealNum;
      });

      // Ensure we're actually setting the projects state with the filtered projects
      console.log("Setting projects state with:", filteredProjects);
      setProjects(filteredProjects);
      setCancelledProjects(filteredCancelledProjects);
      
      // Save to project state for quicker loading next time (with data optimization)
      const projectState = {
        projects: filteredProjects.slice(0, 50), // Limit to last 50 projects
        cancelledProjects: filteredCancelledProjects.slice(0, 20), // Limit to last 20 cancelled
        stats: {
          dealCount,
          tier1Deals,
          tier2Deals,
          totalCommission
        },
        companyStats: {
          totalRevenue,
          avgSystemSize,
          avgContractValue
        },
        lastUpdated: new Date().toISOString()
      };
      
      try {
        localStorage.setItem(`projectState_${user.uid}`, JSON.stringify(projectState));
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old data and retrying...');
          // Clear old project data and retry
          clearOldProjectData(user.uid);
          try {
            localStorage.setItem(`projectState_${user.uid}`, JSON.stringify(projectState));
          } catch (retryError) {
            console.error('Failed to save project state after cleanup:', retryError);
          }
        } else {
          console.error('Error saving project state:', error);
        }
      }
    }
    
    console.log("===== END DEBUGGING PROJECTS =====");
  }, [user]);

  // Fetch projects on component mount or refresh
  useEffect(() => {
    console.log("Projects effect running - user:", user?.uid);
    if (user) {
      // Proactively clear old data to prevent quota exceeded errors
      try {
        clearOldProjectData(user.uid);
      } catch (error) {
        console.warn('Error during proactive cleanup:', error);
      }
      
      // Check for force refresh flag
      const forceRefresh = localStorage.getItem('forceProjectsRefresh');
      if (forceRefresh === 'true') {
        console.log("Force refresh detected, clearing cache and refreshing data");
        localStorage.removeItem('forceProjectsRefresh');
        localStorage.removeItem(`projectState_${user.uid}`);
      }
      
      // First try to load from the cached state
      const cachedState = localStorage.getItem(`projectState_${user.uid}`);
      
      if (cachedState && forceRefresh !== 'true') {
        try {
          const parsed = JSON.parse(cachedState);
          console.log("Loaded projects from cached state:", parsed.projects.length);
          setProjects(parsed.projects);
          setCancelledProjects(parsed.cancelledProjects || []);
          setUserStats(parsed.stats);
          
          // Restore company stats if available
          if (parsed.companyStats) {
            console.log("Restoring company stats from cache:", parsed.companyStats);
            setCompanyStats(parsed.companyStats);
          } else {
            // Calculate company stats from the loaded projects if not in cache
            console.log("Calculating company stats from cached projects");
            const projectsWithSystemSize = parsed.projects.filter((p: Project) => p.systemSize && parseFloat(p.systemSize) > 0);
            const projectsWithPPW = parsed.projects.filter((p: Project) => p.grossPPW && p.systemSize && parseFloat(p.grossPPW) > 0);
            
            // Calculate average system size (in kW)
            const avgSystemSize = projectsWithSystemSize.length > 0
              ? projectsWithSystemSize.reduce((sum: number, p: Project) => sum + parseFloat(p.systemSize || '0'), 0) / projectsWithSystemSize.length
              : 0;
            
            // Calculate total revenue (gross contract value sum)
            const totalRevenue = projectsWithPPW.reduce((sum: number, p: Project) => {
              const systemSize = parseFloat(p.systemSize || '0');
              const ppw = parseFloat(p.grossPPW || '0');
              return sum + (systemSize * ppw * 1000); // kW * PPW * 1000 = total contract value
            }, 0);
            
            // Calculate average contract value
            const avgContractValue = projectsWithPPW.length > 0
              ? totalRevenue / projectsWithPPW.length
              : 0;
            
            setCompanyStats({
              totalRevenue,
              avgSystemSize,
              avgContractValue
            });
          }
        } catch (e) {
          console.error("Error parsing cached project state:", e);
          refreshProjects();
        }
      } else {
        refreshProjects();
      }
    }
  }, [refreshKey, user, refreshProjects]);

  // Ensure company stats are recalculated when projects change
  useEffect(() => {
    if (projects.length > 0) {
      console.log("Recalculating company stats due to projects change");
      
      // Only use active projects (not cancelled) for metrics
      const activeProjects = projects.filter(p => p.status !== "cancelled");
      const projectsWithSystemSize = activeProjects.filter(p => p.systemSize && parseFloat(p.systemSize) > 0);
      const projectsWithPPW = activeProjects.filter(p => p.grossPPW && p.systemSize && parseFloat(p.grossPPW) > 0);
      
      // Calculate average system size (in kW)
      const avgSystemSize = projectsWithSystemSize.length > 0
        ? projectsWithSystemSize.reduce((sum, p) => sum + parseFloat(p.systemSize || '0'), 0) / projectsWithSystemSize.length
        : 0;
      
      // Calculate total revenue (gross contract value sum)
      const totalRevenue = projectsWithPPW.reduce((sum, p) => {
        const systemSize = parseFloat(p.systemSize || '0');
        const ppw = parseFloat(p.grossPPW || '0');
        return sum + (systemSize * ppw * 1000); // kW * PPW * 1000 = total contract value
      }, 0);
      
      // Calculate average contract value
      const avgContractValue = projectsWithPPW.length > 0
        ? totalRevenue / projectsWithPPW.length
        : 0;
      
      setCompanyStats({
        totalRevenue,
        avgSystemSize,
        avgContractValue
      });
      
      // Also update the cached state with the new stats
      if (user) {
        const cachedState = localStorage.getItem(`projectState_${user.uid}`);
        if (cachedState) {
          try {
            const parsed = JSON.parse(cachedState);
            parsed.companyStats = {
              totalRevenue,
              avgSystemSize,
              avgContractValue
            };
            localStorage.setItem(`projectState_${user.uid}`, JSON.stringify(parsed));
          } catch (e) {
            console.error("Error updating cached company stats:", e);
          }
        }
      }
    }
  }, [projects, user]);

  // Load user data from localStorage
  useEffect(() => {
    if (user && userData) {
      const dealCount = userData.dealCount || 0;
      const totalCommission = userData.totalCommission || 0;
      
      // Update stats with user data if available
      setUserStats(prevStats => ({
        ...prevStats,
        dealCount,
        totalCommission
      }));
    }
  }, [user, userData]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Handle sort toggle
  const toggleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // Filter and sort projects based on active tab
  const getFilteredAndSortedProjects = () => {
    let projectsToShow = projects;
    
    if (activeTab === "cancelled") {
      // Show only cancelled projects
      projectsToShow = projects.filter(p => p.status === "cancelled");
    } else {
      // Show active, on_hold, and other non-cancelled projects
      projectsToShow = projects.filter(p => p.status !== "cancelled");
    }
    
    return projectsToShow
      .filter(project => {
        // Apply regular filters for projects
        const statusMatch = filterStatus === "all" || project.status === filterStatus;
        const searchMatch = !searchTerm || 
          (project.customerName && project.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (project.address && project.address.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (!statusMatch) {
          console.log(`Project ${project.id} filtered out by status - wanted: ${filterStatus}, got: ${project.status}`);
        }
        if (!searchMatch && searchTerm) {
          console.log(`Project ${project.id} filtered out by search - term: ${searchTerm}, name: ${project.customerName}`);
        }
        
        return statusMatch && searchMatch;
      })
      .sort((a, b) => {
        // Safe access with fallbacks for sorting
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
  };
  
  const filteredAndSortedProjects = getFilteredAndSortedProjects();

  // Handle viewing documents
  const handleViewDocuments = (project: Project) => {
    setSelectedProject(project);
    setShowDocumentsModal(true);
  };

  // Handle opening the edit modal for a project
  const handleOpenEditModal = (project: Project) => {
    setSelectedProject(project);
    setEditFormData({
      installDate: project.installDate,
      paymentDate: project.paymentDate,
      siteSurveyDate: project.siteSurveyDate || "",
      permitDate: project.permitDate || "",
      inspectionDate: project.inspectionDate || "",
      ptoDate: project.ptoDate || ""
    });
    setShowEditModal(true);
  };

  // Handle viewing customer info
  const handleViewCustomerInfo = (project: Project) => {
    setSelectedCustomer(project);
    setShowCustomerInfoModal(true);
  };


  
  // Handle form input changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };
  
  // Handle saving edited project
  const handleSaveProject = () => {
    if (!selectedProject) return;
    
    // Get all projects
    const savedProjectsJSON = localStorage.getItem('projects');
    if (savedProjectsJSON) {
      const allProjects = JSON.parse(savedProjectsJSON);
      
      // Update the project in the full list
      const updatedAllProjects = allProjects.map((project: Project) =>
        project.id === selectedProject.id
          ? { 
              ...project, 
              installDate: editFormData.installDate,
              paymentDate: editFormData.paymentDate,
              siteSurveyDate: editFormData.siteSurveyDate || undefined,
              permitDate: editFormData.permitDate || undefined,
              inspectionDate: editFormData.inspectionDate || undefined,
              ptoDate: editFormData.ptoDate || undefined
            }
          : project
      );
      
      // Save all projects back to storage
      localStorage.setItem('projects', JSON.stringify(updatedAllProjects));
      
      // Update the filtered view for this user
      const userIsAdmin = isAdmin || true;
      const filteredProjects = userIsAdmin 
        ? updatedAllProjects 
        : updatedAllProjects.filter((project: Project) => project.userId === user?.uid);
        
      setProjects(filteredProjects);
      
      // Force refresh to recalculate stats
      setRefreshKey(prev => prev + 1);
    }
    
    // Close the modal
    setShowEditModal(false);
    setSelectedProject(null);
    
    // Show confirmation
    alert("Project dates updated successfully!");
  };

  // Handle opening the status modal for a project
  const handleOpenStatusModal = (project: Project) => {
    setSelectedProject(project);
    setShowStatusModal(true);
  };
  
  // Handle changing project status
  const handleChangeStatus = (newStatus: Project["status"]) => {
    if (!selectedProject) return;
    
    if (newStatus === "cancelled") {
      // Move to cancelled projects
      moveProjectToCancelled(selectedProject);
    } else {
      // Just update the status, but respect multi-tenancy
      const savedProjectsJSON = localStorage.getItem('projects');
      if (savedProjectsJSON) {
        const allProjects = JSON.parse(savedProjectsJSON);
        
        // Update the status in the full project list
        const updatedAllProjects = allProjects.map((project: Project) =>
          project.id === selectedProject.id
            ? { ...project, status: newStatus }
            : project
        );
        
        // Save all projects back to storage
        localStorage.setItem('projects', JSON.stringify(updatedAllProjects));
        
        // Update the filtered view for this user
        const userIsAdmin = isAdmin || true;
        const filteredProjects = userIsAdmin 
          ? updatedAllProjects 
          : updatedAllProjects.filter((project: Project) => project.userId === user?.uid);
          
        setProjects(filteredProjects);
        
        // Also update the projectState cache to persist across refreshes and tab changes
        if (user) {
          const projectStateKey = `projectState_${user.uid}`;
          const cachedState = localStorage.getItem(projectStateKey);
          
          if (cachedState) {
            try {
              const parsed = JSON.parse(cachedState);
              parsed.projects = filteredProjects.slice(0, 50); // Limit to last 50 projects
              parsed.lastUpdated = new Date().toISOString();
              localStorage.setItem(projectStateKey, JSON.stringify(parsed));
            } catch (e) {
              if (e.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded, clearing old data...');
                clearOldProjectData(user.uid);
              } else {
                console.error("Error updating cached project state:", e);
              }
            }
          }
        }

        // Force refresh to recalculate stats
        setRefreshKey(prev => prev + 1);
      }
    }
    
    // Close the modal
    setShowStatusModal(false);
    setSelectedProject(null);
  };
  
  // Move a project to cancelled projects
  const moveProjectToCancelled = (project: Project) => {
    console.log("Moving project to cancelled:", project.id, project.customerName);
    
    // Create a copy with cancelled status
    const cancelledProject = {
      ...project,
      status: "cancelled" as const,
      cancelledDate: new Date().toISOString() // Add cancellation date
    };
    
    // Remove from active projects
    const updatedProjects = projects.filter(p => p.id !== project.id);
    
    // Get all projects from storage to update
    const storedProjectsJSON = localStorage.getItem('projects');
    if (storedProjectsJSON) {
      try {
        const allProjects = JSON.parse(storedProjectsJSON);
        const updatedAllProjects = allProjects.filter((p: Project) => p.id !== project.id);
        localStorage.setItem('projects', JSON.stringify(updatedAllProjects));
        console.log(`Removed project ${project.id} from active projects. New count:`, updatedAllProjects.length);
      } catch (e) {
        console.error("Error updating projects in localStorage:", e);
      }
    }
    
    // Add to cancelled projects
    const updatedCancelledProjects = [...cancelledProjects, cancelledProject];
    
    // Get all cancelled projects from storage to update
    const storedCancelledProjectsJSON = localStorage.getItem('cancelledProjects');
    if (storedCancelledProjectsJSON) {
      try {
        const allCancelledProjects = JSON.parse(storedCancelledProjectsJSON);
        const updatedAllCancelledProjects = [...allCancelledProjects, cancelledProject];
        localStorage.setItem('cancelledProjects', JSON.stringify(updatedAllCancelledProjects));
        console.log(`Added project ${project.id} to cancelled projects. New count:`, updatedAllCancelledProjects.length);
      } catch (e) {
        console.error("Error parsing cancelledProjects:", e);
        localStorage.setItem('cancelledProjects', JSON.stringify([cancelledProject]));
      }
    } else {
      localStorage.setItem('cancelledProjects', JSON.stringify([cancelledProject]));
      console.log(`Created new cancelled projects array with 1 project: ${project.id}`);
    }
    
    // Update state
    setProjects(updatedProjects);
    setCancelledProjects(updatedCancelledProjects);
    
    // Update the projectState cache to persist across refreshes and tab changes
    if (user) {
      const projectStateKey = `projectState_${user.uid}`;
      const cachedState = localStorage.getItem(projectStateKey);
      
      if (cachedState) {
        try {
          const parsed = JSON.parse(cachedState);
          parsed.projects = updatedProjects;
          parsed.cancelledProjects = updatedCancelledProjects;
          localStorage.setItem(projectStateKey, JSON.stringify(parsed));
        } catch (e) {
          console.error("Error updating cached project state:", e);
        }
      }
    }
    
    // Log localStorage state after updates
    console.log("Projects in localStorage after update:", localStorage.getItem('projects'));
    console.log("Cancelled projects in localStorage after update:", localStorage.getItem('cancelledProjects'));
    
    // Force refresh to recalculate stats
    setRefreshKey(prev => prev + 1);
    
    // Show confirmation
    alert("Project has been cancelled");
  };
  


  // Reactivate a cancelled project
  const reactivateProject = (project: Project) => {
    if (confirm("Are you sure you want to reactivate this project?")) {
      // Create a copy with active status
      const reactivatedProject = {
        ...project,
        status: "site_survey" as const, // Default back to site survey
      };
      
      // Remove from cancelled projects
      const updatedCancelledProjects = cancelledProjects.filter(p => p.id !== project.id);
      
      // Get all cancelled projects from storage to update
      const storedCancelledProjectsJSON = localStorage.getItem('cancelledProjects');
      if (storedCancelledProjectsJSON) {
        const allCancelledProjects = JSON.parse(storedCancelledProjectsJSON);
        const updatedAllCancelledProjects = allCancelledProjects.filter((p: Project) => p.id !== project.id);
        localStorage.setItem('cancelledProjects', JSON.stringify(updatedAllCancelledProjects));
      }
      
      // Add to active projects
      const updatedProjects = [...projects, reactivatedProject];
      
      // Get all projects from storage to update
      const storedProjectsJSON = localStorage.getItem('projects');
      if (storedProjectsJSON) {
        const allProjects = JSON.parse(storedProjectsJSON);
        const updatedAllProjects = [...allProjects, reactivatedProject];
        localStorage.setItem('projects', JSON.stringify(updatedAllProjects));
      } else {
        localStorage.setItem('projects', JSON.stringify([reactivatedProject]));
      }
      
      // Update state
      setProjects(updatedProjects);
      setCancelledProjects(updatedCancelledProjects);
      
      // Update the projectState cache to persist across refreshes and tab changes
      if (user) {
        const projectStateKey = `projectState_${user.uid}`;
        const cachedState = localStorage.getItem(projectStateKey);
        
        if (cachedState) {
          try {
            const parsed = JSON.parse(cachedState);
            parsed.projects = updatedProjects;
            parsed.cancelledProjects = updatedCancelledProjects;
            localStorage.setItem(projectStateKey, JSON.stringify(parsed));
          } catch (e) {
            console.error("Error updating cached project state:", e);
          }
        }
      }
      
      // Force refresh to recalculate stats
      setRefreshKey(prev => prev + 1);
      
      // Set active tab to active to show the user their reactivated project immediately
      setActiveTab("active");
      
      // Show confirmation
      alert("Project has been reactivated and moved back to active projects");
    }
  };

  // Function to force refresh projects data from localStorage
  const forceRefreshProjects = useCallback(() => {
    console.log("===== FORCE REFRESHING PROJECTS =====");
    
    // Check all localStorage keys that might contain projects
    const allKeys = Object.keys(localStorage);
    console.log("All localStorage keys:", allKeys);
    
    // Look for any keys that might contain project data
    allKeys.forEach(key => {
      if (key.includes('project') || key.includes('set') || key.includes('deal')) {
        const value = localStorage.getItem(key);
        try {
          const parsed = value ? JSON.parse(value) : 'null';
          console.log(`Key: ${key}`, parsed);
        } catch (e) {
          console.log(`Key: ${key}`, `[INVALID JSON: ${value}]`);
        }
      }
    });
    
    // Force refresh
    setRefreshKey(prev => prev + 1);
    
    // Also check if there's a force refresh flag from sets page
    const forceRefresh = localStorage.getItem('forceProjectsRefresh');
    if (forceRefresh === 'true') {
      console.log("Force refresh flag detected from sets page");
      localStorage.removeItem('forceProjectsRefresh');
    }
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
                        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'}`}></div>
      </div>
    );
  }

  // If user is not authenticated and not loading, this will render briefly before redirect
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen theme-bg-primary">
      {/* Sidebar component */}
      <Sidebar 
        darkMode={darkMode}
        signOut={signOut}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className={`flex-1 overflow-auto theme-bg-secondary transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="standard-header">
          <div className="standard-header-content">
            <div className="flex items-center mb-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="theme-text-primary hover:opacity-70 transition-opacity p-1"
              >
                {sidebarOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* Centered logo when sidebar is closed */}
              {!sidebarOpen && (
                <div className="header-logo-center">
                  <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                </div>
              )}

              <div className={`${sidebarOpen ? 'ml-4' : 'ml-auto'}`}>
                {sidebarOpen && (
                  <>
                    <h1 className="text-2xl font-semibold theme-text-primary">My Projects</h1>
                    <p className="theme-text-secondary">Track your projects and commissions</p>
                  </>
                )}
              </div>
              
              <div className="ml-auto flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="p-2 pl-10 w-64 theme-bg-tertiary border theme-border-primary rounded-lg theme-text-primary focus:outline-none focus:border-cyan-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 theme-text-secondary" />
                </div>

              </div>
            </div>
          </div>
        </header>

        {/* Pay Type Box */}
        <div className="p-6">
          <div className="theme-bg-tertiary rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium theme-text-primary">Pay Type</h2>
              <div className="text-sm theme-text-secondary">
                Set in Account Settings
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg border-2 ${
                selectedPayType === 'Rookie' 
                  ? `${darkMode ? 'border-cyan-500 bg-cyan-500/20' : 'border-cyan-500 bg-cyan-500/20'}` 
                  : 'theme-border-primary'
              }`}>
                <span className={`font-medium ${
                  selectedPayType === 'Rookie' 
                    ? `${darkMode ? 'text-cyan-500' : 'text-cyan-500'}` 
                    : 'theme-text-secondary'
                }`}>
                  Rookie
                </span>
              </div>
              <div className={`px-4 py-2 rounded-lg border-2 ${
                selectedPayType === 'Vet' 
                  ? `${darkMode ? 'border-cyan-500 bg-cyan-500/20' : 'border-cyan-500 bg-cyan-500/20'}` 
                  : 'theme-border-primary'
              }`}>
                <span className={`font-medium ${
                  selectedPayType === 'Vet' 
                    ? `${darkMode ? 'text-cyan-500' : 'text-cyan-500'}` 
                    : 'theme-text-secondary'
                }`}>
                  Vet
                </span>
              </div>
              <div className={`px-4 py-2 rounded-lg border-2 ${
                selectedPayType === 'Pro' 
                  ? `${darkMode ? 'border-cyan-500 bg-cyan-500/20' : 'border-cyan-500 bg-cyan-500/20'}` 
                  : 'theme-border-primary'
              }`}>
                <span className={`font-medium ${
                  selectedPayType === 'Pro' 
                    ? `${darkMode ? 'text-cyan-500' : 'text-cyan-500'}` 
                    : 'theme-text-secondary'
                }`}>
                  Pro
                </span>
              </div>
            </div>
            {!isAdmin && (
              <p className="text-xs theme-text-secondary mt-2">
                Only admins can change pay type. Contact your administrator to update.
              </p>
            )}
          </div>
        </div>

        {/* Payment Structure Summary */}
        <div className="p-6">
          <div className="theme-bg-tertiary rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-medium theme-text-primary mb-3">Commission Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className={`rounded-lg ${darkMode ? 'bg-black' : 'bg-gray-100'} p-4 border-l-4 border-cyan-500`}>
                <p className="theme-text-secondary text-sm mb-2">Upfront Pay</p>
                <p className="theme-text-primary text-lg font-bold">
                  ${selectedPayType === 'Rookie' ? '300' : selectedPayType === 'Vet' ? '600' : '800'}/deal
                </p>
                <p className="theme-text-primary text-lg font-bold mt-1">
                  YTD: {formatCurrency(calculateUpfrontPay())}
                </p>
              </div>
              <div className={`rounded-lg ${darkMode ? 'bg-black' : 'bg-gray-100'} p-4 border-l-4 border-cyan-500`}>
                <p className="theme-text-secondary text-sm mb-2">Milestone Pay</p>
                <p className="theme-text-primary text-lg font-bold">
                  {selectedPayType === 'Rookie' ? '24%' : selectedPayType === 'Vet' ? '39%' : '50%'} of Commission
                </p>
                <p className="theme-text-primary text-lg font-bold mt-1">
                  YTD: {formatCurrency(calculateMilestonePay())}
                </p>
              </div>
              <div className={`rounded-lg ${darkMode ? 'bg-black' : 'bg-gray-100'} p-4 border-l-4 border-cyan-500`}>
                <p className="theme-text-secondary text-sm mb-2">Total Earnings</p>
                <p className="theme-text-primary text-lg font-bold">
                  YTD: {formatCurrency(calculateUpfrontPay() + calculateMilestonePay())}
                </p>
              </div>
            </div>
          </div>
          
          {/* Company Stats Section - Add after the Commission Structure */}
          <div className="theme-bg-tertiary rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-medium theme-text-primary mb-3">Company Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-lg ${darkMode ? 'bg-black' : 'bg-gray-100'} p-4`}>
                <p className="theme-text-secondary text-sm mb-2">Total Revenue Generated</p>
                <p className="theme-text-primary text-lg font-bold">
                  {formatCurrency(companyStats.totalRevenue)}
                </p>
                <p className="text-xs theme-text-secondary mt-1">
                  Based on {projects.filter(p => p.grossPPW && p.systemSize && p.status !== "cancelled").length} active contracts
                </p>
              </div>
              <div className={`rounded-lg ${darkMode ? 'bg-black' : 'bg-gray-100'} p-4`}>
                <p className="theme-text-secondary text-sm mb-2">Average System Size</p>
                <p className="theme-text-primary text-lg font-bold">
                  {companyStats.avgSystemSize.toFixed(1)} kW
                </p>
                <p className="text-xs theme-text-secondary mt-1">
                  Average across all projects
                </p>
              </div>
              <div className={`rounded-lg ${darkMode ? 'bg-black' : 'bg-gray-100'} p-4`}>
                <p className="theme-text-secondary text-sm mb-2">Average Contract Value</p>
                <p className="theme-text-primary text-lg font-bold">
                  {formatCurrency(companyStats.avgContractValue)}
                </p>
                <p className="text-xs theme-text-secondary mt-1">
                  Per solar installation
                </p>
              </div>
            </div>
          </div>
          

          
          {/* Projects tabs and table */}
          <div className="mb-6">
            {/* Tabs for switching between active and cancelled projects */}
            <div className="mb-4 flex items-center border-b theme-border-primary">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "active" 
                    ? `border-b-2 ${darkMode ? 'border-cyan-500 text-cyan-500' : 'border-cyan-500 text-cyan-500'}` 
                    : 'theme-text-secondary'
                }`}
              >
                Active Projects
              </button>
              <button
                onClick={() => setActiveTab("cancelled")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === "cancelled" 
                    ? `border-b-2 ${darkMode ? 'border-cyan-500 text-cyan-500' : 'border-cyan-500 text-cyan-500'}` 
                    : 'theme-text-secondary'
                }`}
              >
                Cancelled Projects
              </button>


              
              {activeTab === "active" && (
                <div className="ml-auto">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="p-2 theme-bg-tertiary border theme-border-primary rounded-lg theme-text-primary focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="site_survey">Site Survey</option>
                    <option value="install">Install</option>
                    <option value="pto">PTO</option>
                    <option value="paid">Paid</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              )}
            </div>
          
            <div className="theme-bg-tertiary rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b theme-border-primary text-left theme-bg-tertiary">
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none"
                          onClick={() => toggleSort("customerName")}
                        >
                          Customer Info
                          {sortField === "customerName" && (
                            sortDirection === "asc" ? 
                              <ChevronUp className="ml-1 h-4 w-4" /> : 
                              <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        <button 
                          className="flex items-center focus:outline-none"
                          onClick={() => toggleSort("status")}
                        >
                          Status
                          {sortField === "status" && (
                            sortDirection === "asc" ? 
                              <ChevronUp className="ml-1 h-4 w-4" /> : 
                              <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="flex items-center focus:outline-none"
                            onClick={() => toggleSort("paymentAmount")}
                          >
                            Milestone Commission
                            {sortField === "paymentAmount" && (
                              sortDirection === "asc" ? 
                                <ChevronUp className="ml-1 h-4 w-4" /> : 
                                <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                          </button>
                          <button
                            className="text-cyan-500 hover:text-cyan-600 transition-colors"
                            title="Commission Formula: (PPW × System Size × 1000) - (System Size × $3,500 + Adders) × Your Rate%"
                            onClick={() => setShowCommissionFormulaModal(true)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border-secondary">
                    {filteredAndSortedProjects.length > 0 ? (
                      filteredAndSortedProjects.map((project) => (
                        <tr key={project.id} className="hover:theme-bg-quaternary">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium theme-text-primary">
                                {project.customerName}
                              </div>
                              <button
                                onClick={() => handleViewCustomerInfo(project)}
                                className="text-cyan-500 hover:text-cyan-600 transition-colors"
                                title="View Customer Info"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {project.status === "cancelled" ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Cancelled
                                </span>
                              ) : project.status === "on_hold" ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  On Hold
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              {project.status === "cancelled" ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Cancelled
                                </span>
                              ) : project.status === "site_survey" ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Site Survey
                                </span>
                              ) : project.status === "install" ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Install
                                </span>
                              ) : project.status === "pto" ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                  PTO
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Paid
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs theme-text-secondary">
                              {project.installDate && <div>Install: {formatDate(project.installDate)}</div>}
                              {project.paymentDate && <div className="mt-1">Payment: {formatDate(project.paymentDate)}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm theme-text-primary">
                              {formatCurrency(calculateProjectMilestoneCommission(project))}
                            </div>
                            {project.systemSize && (
                              <div className="text-xs theme-text-secondary mt-1">
                                System: {project.systemSize} kW
                                <button
                                  onClick={() => {
                                    if (!project.systemSize || !project.grossPPW) {
                                      alert("Missing system size or gross PPW for this project.");
                                      return;
                                    }
                                    
                                    const systemSize = parseFloat(project.systemSize.replace('kW', '').trim());
                                    const grossPPW = parseFloat(project.grossPPW);
                                    
                                    if (isNaN(systemSize) || isNaN(grossPPW)) {
                                      alert("Invalid system size or gross PPW for this project.");
                                      return;
                                    }
                                    
                                    // Calculate contract price: PPW × System Size × 1000
                                    const contractPrice = grossPPW * systemSize * 1000;
                                    
                                    const baseCost = systemSize * 3500;
                                    let adders = 0;
                                    if (project.eaBattery) adders += 8000;
                                    if (project.backupBattery) adders += 13000;
                                    if (project.mpu) adders += 3500;
                                    if (project.hti) adders += 2500;
                                    if (project.reroof) adders += 15000;
                                    const totalCost = baseCost + adders;
                                    const commissionAmount = contractPrice - totalCost;
                                    const commissionPercentage = selectedPayType === 'Rookie' ? 0.24 : selectedPayType === 'Vet' ? 0.39 : 0.50;
                                    const finalCommission = Math.max(0, commissionAmount) * commissionPercentage;
                                    
                                    // Set the project-specific commission breakdown data
                                    setSelectedProjectForBreakdown({
                                      project,
                                      systemSize,
                                      grossPPW,
                                      contractPrice,
                                      baseCost,
                                      adders,
                                      totalCost,
                                      commissionAmount,
                                      commissionPercentage,
                                      finalCommission,
                                      selectedPayType
                                    });
                                    setShowProjectCommissionModal(true);
                                  }}
                                  className="ml-2 text-cyan-500 hover:text-cyan-600 transition-colors"
                                  title="View Commission Breakdown"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleViewDocuments(project)}
                                className="theme-text-secondary hover:theme-text-primary"
                                title="View Documents"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={() => handleOpenEditModal(project)}
                                className="theme-text-secondary hover:theme-text-primary"
                                title="Edit Project"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={() => handleOpenStatusModal(project)}
                                className="theme-text-secondary hover:theme-text-primary"
                                title="Change Status"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center theme-text-secondary">
                                                      {activeTab === "active" ? (
                              <>No active projects found. Create a new set and move it to projects.</>
                            ) : (
                              <>No cancelled projects found.</>
                            )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Modal */}
      {showDocumentsModal && selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-2xl w-full mx-4 theme-border-primary border">
            <div className="p-4 border-b theme-border-primary flex items-center justify-between">
              <h3 className="text-lg font-semibold theme-text-primary">
                Project Documents - {selectedProject.customerName}
              </h3>
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="theme-text-secondary hover:theme-text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {selectedProject.documents?.utilityBill ? (
                <div className="border theme-border-primary rounded-lg overflow-hidden">
                  <div className="p-4 theme-bg-quaternary">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mr-2 ${darkMode ? 'text-cyan-500' : 'text-cyan-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="theme-text-primary font-medium">Utility Bill</span>
                    </div>
                    
                    <div className="mt-4 p-5 border theme-border-primary rounded-md theme-text-primary text-center">
                      <p className="mb-2">File preview not available</p>
                      <button 
                        className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white`}
                        onClick={() => window.open(selectedProject.documents?.utilityBill, '_blank')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download File
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 theme-text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <p>No documents uploaded for this project</p>
                </div>
              )}
            </div>
            
            <div className="border-t theme-border-primary p-4 flex justify-end">
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="px-4 py-2 theme-bg-quaternary theme-text-primary theme-border-primary border rounded-md hover:theme-bg-tertiary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Info Modal */}
      {showCustomerInfoModal && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-md w-full mx-4 theme-border-primary border">
            <div className="p-4 border-b theme-border-primary flex items-center justify-between">
              <h3 className="text-lg font-semibold theme-text-primary">
                Customer Information
              </h3>
              <button
                onClick={() => setShowCustomerInfoModal(false)}
                className="theme-text-secondary hover:theme-text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Customer Name */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm theme-text-secondary">Name</p>
                    <p className="font-medium theme-text-primary">{selectedCustomer.customerName}</p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm theme-text-secondary">Phone</p>
                    <p className="font-medium theme-text-primary">{selectedCustomer.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm theme-text-secondary">Email</p>
                    <p className="font-medium theme-text-primary">{selectedCustomer.email || 'Not provided'}</p>
                  </div>
                </div>

                {/* Home Address */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm theme-text-secondary">Address</p>
                    <p className="font-medium theme-text-primary">{selectedCustomer.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t theme-border-primary p-4 flex justify-end">
              <button
                onClick={() => setShowCustomerInfoModal(false)}
                className="px-4 py-2 theme-bg-quaternary theme-text-primary theme-border-primary border rounded-md hover:theme-bg-tertiary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add the Edit Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 theme-bg-primary bg-opacity-75">
          <div className="theme-bg-tertiary rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold theme-text-primary mb-4">Edit Project Dates</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProject(); }}>
                {/* Site Survey Date */}
                <div className="mb-4">
                  <label className="block theme-text-tertiary text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" /> Site Survey Date
                  </label>
                  <input
                    type="date"
                    name="siteSurveyDate"
                    className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-cyan-500 theme-bg-quaternary theme-text-primary"
                    value={editFormData.siteSurveyDate}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                {/* Permit Date */}
                <div className="mb-4">
                  <label className="block theme-text-tertiary text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" /> Permit Date
                  </label>
                  <input
                    type="date"
                    name="permitDate"
                    className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-cyan-500 theme-bg-quaternary theme-text-primary"
                    value={editFormData.permitDate}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                {/* Install Date */}
                <div className="mb-4">
                  <label className="block theme-text-tertiary text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" /> Install Date
                  </label>
                  <input
                    type="date"
                    name="installDate"
                    className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-cyan-500 theme-bg-quaternary theme-text-primary"
                    value={editFormData.installDate}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                
                {/* Inspection Date */}
                <div className="mb-4">
                  <label className="block theme-text-tertiary text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" /> Inspection Date
                  </label>
                  <input
                    type="date"
                    name="inspectionDate"
                    className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-cyan-500 theme-bg-quaternary theme-text-primary"
                    value={editFormData.inspectionDate}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                {/* PTO Date */}
                <div className="mb-4">
                  <label className="block theme-text-tertiary text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" /> PTO Date
                  </label>
                  <input
                    type="date"
                    name="ptoDate"
                    className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-cyan-500 theme-bg-quaternary theme-text-primary"
                    value={editFormData.ptoDate}
                    onChange={handleEditFormChange}
                  />
                </div>
                
                {/* Payment Date */}
                <div className="mb-6">
                  <label className="block theme-text-tertiary text-sm font-medium mb-2">
                    <DollarSign className="h-4 w-4 inline-block mr-1" /> Payment Date
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-cyan-500 theme-bg-quaternary theme-text-primary"
                    value={editFormData.paymentDate}
                    onChange={handleEditFormChange}
                    required
                  />
                  <p className="text-xs theme-text-secondary mt-1">
                    <span className={darkMode ? "text-cyan-400" : "text-cyan-500"}>$</span> When commission will be paid out
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 theme-bg-quaternary theme-text-primary rounded hover:opacity-80 transition-colors duration-200"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 ${darkMode ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-cyan-500 text-white hover:bg-cyan-600'} rounded transition-colors duration-200`}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="theme-bg-tertiary p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold theme-text-primary mb-4">Change Project Status</h2>
            <p className="theme-text-secondary mb-4">
              Current Status: <span className={`font-semibold ${
                selectedProject.status === 'site_survey' ? 'text-yellow-500' :
                selectedProject.status === 'install' ? 'text-blue-500' :
                selectedProject.status === 'pto' ? 'text-purple-500' :
                selectedProject.status === 'paid' ? 'text-green-500' : 'text-red-500'
              }`}>
                {selectedProject.status === 'site_survey' ? 'Site Survey' :
                selectedProject.status === 'install' ? 'Install' :
                selectedProject.status === 'pto' ? 'PTO' :
                selectedProject.status === 'paid' ? 'Paid' : 'Cancelled'}
              </span>
            </p>
            
            <div className="space-y-2 mb-6">
              <h3 className="theme-text-primary font-medium mb-2">Select New Status:</h3>
              <div className="grid grid-cols-1 gap-2">
                {selectedProject.status !== 'site_survey' && (
                  <button 
                    onClick={() => handleChangeStatus('site_survey')}
                    className="px-4 py-2 text-sm rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                  >
                    Site Survey
                  </button>
                )}
                
                {selectedProject.status !== 'install' && (
                  <button 
                    onClick={() => handleChangeStatus('install')}
                    className="px-4 py-2 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    Install
                  </button>
                )}
                
                {selectedProject.status !== 'pto' && (
                  <button 
                    onClick={() => handleChangeStatus('pto')}
                    className="px-4 py-2 text-sm rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                  >
                    PTO
                  </button>
                )}
                
                {selectedProject.status !== 'paid' && (
                  <button 
                    onClick={() => handleChangeStatus('paid')}
                    className="px-4 py-2 text-sm rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                  >
                    Paid
                  </button>
                )}
                
                {selectedProject.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleChangeStatus('cancelled')}
                    className="px-4 py-2 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                  >
                    Cancelled
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border theme-border-primary theme-text-secondary hover:theme-text-primary rounded mr-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      )}

      {/* Commission Formula Modal */}
      {showCommissionFormulaModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-4xl w-full mx-4 theme-border-primary border">
            <div className="p-6 border-b theme-border-primary">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold theme-text-primary">Milestone Commission Formula</h2>
                <button
                  onClick={() => setShowCommissionFormulaModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Formula Steps */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold theme-text-primary border-b theme-border-primary pb-2">
                    Step-by-Step Calculation
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium theme-text-primary">Contract Price</h4>
                        <p className="text-sm theme-text-secondary">PPW × System Size × 1000</p>
                        <p className="text-xs theme-text-secondary mt-1">Example: $7.14 × 3.5 kW × 1000 = $25,000</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium theme-text-primary">Base Cost</h4>
                        <p className="text-sm theme-text-secondary">System Size × $3,500</p>
                        <p className="text-xs theme-text-secondary mt-1">Example: 3.5 kW × $3,500 = $12,250</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium theme-text-primary">Adders</h4>
                        <p className="text-sm theme-text-secondary">Sum of selected options</p>
                        <p className="text-xs theme-text-secondary mt-1">Example: E/A Battery + MPU = $8,000 + $3,500 = $11,500</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium theme-text-primary">Total Cost</h4>
                        <p className="text-sm theme-text-secondary">Base Cost + Adders</p>
                        <p className="text-xs theme-text-secondary mt-1">Example: $12,250 + $11,500 = $23,750</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        5
                      </div>
                      <div>
                        <h4 className="font-medium theme-text-primary">Commission Amount</h4>
                        <p className="text-sm theme-text-secondary">Contract Price - Total Cost</p>
                        <p className="text-xs theme-text-secondary mt-1">Example: $25,000 - $23,750 = $1,250</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        6
                      </div>
                      <div>
                        <h4 className="font-medium theme-text-primary">Final Commission</h4>
                        <p className="text-sm theme-text-secondary">Commission Amount × Your Rate</p>
                        <p className="text-xs theme-text-secondary mt-1">Example: $1,250 × 24% = $300</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Adder Values and Example */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold theme-text-primary border-b theme-border-primary pb-2">
                    Adder Values
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="font-medium theme-text-primary">E/A Battery</span>
                      <span className="text-lg font-bold text-green-600">$8,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="font-medium theme-text-primary">Backup Battery</span>
                      <span className="text-lg font-bold text-green-600">$13,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="font-medium theme-text-primary">MPU</span>
                      <span className="text-lg font-bold text-green-600">$3,500</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="font-medium theme-text-primary">HTI</span>
                      <span className="text-lg font-bold text-green-600">$2,500</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="font-medium theme-text-primary">Reroof</span>
                      <span className="text-lg font-bold text-green-600">$15,000</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold theme-text-primary mb-2">Complete Example</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>System:</strong> 3.5 kW at $7.14/W</p>
                      <p><strong>Contract Price:</strong> $7.14 × 3.5 × 1000 = <span className="font-bold text-green-600">$25,000</span></p>
                      <p><strong>Base Cost:</strong> 3.5 × $3,500 = <span className="font-bold text-red-600">$12,250</span></p>
                      <p><strong>Adders:</strong> E/A Battery + MPU = <span className="font-bold text-red-600">$11,500</span></p>
                      <p><strong>Total Cost:</strong> $12,250 + $11,500 = <span className="font-bold text-red-600">$23,750</span></p>
                      <p><strong>Commission Amount:</strong> $25,000 - $23,750 = <span className="font-bold text-blue-600">$1,250</span></p>
                      <p><strong>Rookie Commission (24%):</strong> $1,250 × 0.24 = <span className="font-bold text-green-600">$300</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t theme-border-primary p-6 flex justify-end">
              <button
                onClick={() => setShowCommissionFormulaModal(false)}
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project-Specific Commission Breakdown Modal */}
      {showProjectCommissionModal && selectedProjectForBreakdown && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-2xl w-full mx-4 theme-border-primary border">
            <div className="p-6 border-b theme-border-primary">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold theme-text-primary">
                  Commission Breakdown - {selectedProjectForBreakdown.project.customerName}
                </h2>
                <button
                  onClick={() => setShowProjectCommissionModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Project Details */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <h4 className="font-medium theme-text-primary">System Size</h4>
                    <p className="text-lg font-bold text-blue-600">{selectedProjectForBreakdown.project.systemSize} kW</p>
                  </div>
                  <div>
                    <h4 className="font-medium theme-text-primary">Gross PPW</h4>
                    <p className="text-lg font-bold text-blue-600">${selectedProjectForBreakdown.grossPPW}/W</p>
                  </div>
                </div>

                {/* Contract Price */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold theme-text-primary mb-2">Contract Price</h4>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      ${selectedProjectForBreakdown.contractPrice.toLocaleString()}
                    </p>
                    <p className="text-sm theme-text-secondary mt-1">
                      ${selectedProjectForBreakdown.grossPPW} × {selectedProjectForBreakdown.systemSize} kW × 1000
                    </p>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold theme-text-primary border-b theme-border-primary pb-2">Cost Breakdown</h4>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="font-medium theme-text-primary">Base Cost</span>
                    <span className="text-lg font-bold text-red-600">
                      ${selectedProjectForBreakdown.baseCost.toLocaleString()}
                    </span>
                  </div>
                  
                  {selectedProjectForBreakdown.adders > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="font-medium theme-text-primary">Adders</span>
                      <span className="text-lg font-bold text-red-600">
                        ${selectedProjectForBreakdown.adders.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <span className="font-semibold theme-text-primary">Total Cost</span>
                    <span className="text-2xl font-bold text-red-600">
                      ${selectedProjectForBreakdown.totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Commission Calculation */}
                <div className="space-y-4">
                  <h4 className="font-semibold theme-text-primary border-b theme-border-primary pb-2">Commission Calculation</h4>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="font-medium theme-text-primary">Commission Amount</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${selectedProjectForBreakdown.commissionAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="font-medium theme-text-primary">Your Rate ({selectedProjectForBreakdown.selectedPayType})</span>
                    <span className="text-lg font-bold text-purple-600">
                      {(selectedProjectForBreakdown.commissionPercentage * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="font-semibold theme-text-primary">Final Commission</span>
                    <span className="text-3xl font-bold text-blue-600">
                      ${selectedProjectForBreakdown.finalCommission.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Adder Details */}
                {selectedProjectForBreakdown.adders > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold theme-text-primary border-b theme-border-primary pb-2">Selected Adders</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedProjectForBreakdown.project.eaBattery && (
                        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <span className="theme-text-primary">E/A Battery</span>
                          <span className="font-bold text-green-600">$8,000</span>
                        </div>
                      )}
                      {selectedProjectForBreakdown.project.backupBattery && (
                        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <span className="theme-text-primary">Backup Battery</span>
                          <span className="font-bold text-green-600">$13,000</span>
                        </div>
                      )}
                      {selectedProjectForBreakdown.project.mpu && (
                        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <span className="theme-text-primary">MPU</span>
                          <span className="font-bold text-green-600">$3,500</span>
                        </div>
                      )}
                      {selectedProjectForBreakdown.project.hti && (
                        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <span className="theme-text-primary">HTI</span>
                          <span className="font-bold text-green-600">$2,500</span>
                        </div>
                      )}
                      {selectedProjectForBreakdown.project.reroof && (
                        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <span className="theme-text-primary">Reroof</span>
                          <span className="font-bold text-green-600">$15,000</span>
                        </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t theme-border-primary p-6 flex justify-end">
              <button
                onClick={() => setShowProjectCommissionModal(false)}
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}