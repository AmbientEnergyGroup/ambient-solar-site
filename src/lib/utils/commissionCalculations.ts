// Shared utility functions for consistent commission calculations across the app

export interface Project {
  id: string;
  customerName: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  installDate: string;
  paymentAmount: number;
  paymentDate: string;
  siteSurveyDate?: string;
  permitDate?: string;
  inspectionDate?: string;
  ptoDate?: string;
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
  commissionRate?: number;
  dealNumber?: number;
  createdAt?: string;
  cancelledDate?: string;
  office?: string; // Add office field for team filtering
}

export interface CommissionBreakdown {
  systemSize: number;
  contractPrice: number;
  baseCost: number;
  adders: number;
  totalCost: number;
  commissionAmount: number;
  commissionPercentage: number;
  finalCommission: number;
  selectedPayType: string;
}

// Calculate commission for a single project using the same logic as projects page
export const calculateProjectCommission = (
  project: Project, 
  payType: 'Rookie' | 'Vet' | 'Pro' = 'Rookie'
): CommissionBreakdown => {
  // Get system size and contract price
  const systemSize = parseFloat(project.systemSize || '0');
  const ppw = parseFloat(project.grossPPW || '0');
  const contractPrice = systemSize * ppw * 1000; // kW * PPW * 1000 = total contract value
  
  // Calculate base cost: $3.50 per watt
  const baseCost = systemSize * 1000 * 3.5; // kW * 1000 * $3.50
  
  // Calculate adders
  let adders = 0;
  if (project.eaBattery) adders += 8000;
  if (project.backupBattery) adders += 13000;
  if (project.mpu) adders += 3500;
  if (project.hti) adders += 2500;
  if (project.reroof) adders += 15000;
  
  // Calculate total cost: Base cost + Adders
  const totalCost = baseCost + adders;
  
  // Calculate commission: Contract Price - Total Cost
  const commissionAmount = contractPrice - totalCost;
  
  // Apply user's commission percentage based on pay type
  let commissionPercentage = 0;
  switch (payType) {
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
  
  // Calculate final commission
  const finalCommission = Math.max(0, commissionAmount) * commissionPercentage;
  
  return {
    systemSize,
    contractPrice,
    baseCost,
    adders,
    totalCost,
    commissionAmount,
    commissionPercentage,
    finalCommission,
    selectedPayType: payType
  };
};

// Calculate total team earnings for a given year
export const calculateTeamEarnings = (
  projects: Project[], 
  year: number,
  payType: 'Rookie' | 'Vet' | 'Pro' = 'Rookie'
): number => {
  let totalEarnings = 0;
  
  for (const project of projects) {
    // Only include projects from the specified year and not cancelled
    if (project.installDate && 
        new Date(project.installDate).getFullYear() === year &&
        project.status !== 'cancelled') {
      const breakdown = calculateProjectCommission(project, payType);
      totalEarnings += breakdown.finalCommission;
    }
  }
  
  return totalEarnings;
};

// Calculate manager commission from team deals ($175/kW)
export const calculateManagerCommission = (
  projects: Project[], 
  year: number
): number => {
  let managerCommission = 0;
  
  for (const project of projects) {
    // Only include projects from the specified year and not cancelled
    if (project.installDate && 
        new Date(project.installDate).getFullYear() === year &&
        project.status !== 'cancelled' &&
        project.systemSize) {
      
      const systemSizeKW = parseFloat(project.systemSize);
      if (systemSizeKW > 0) {
        managerCommission += systemSizeKW * 175; // $175 per kW
      }
    }
  }
  
  return managerCommission;
};

// Calculate total team revenue for a given year (includes all team members including manager)
export const calculateTeamRevenue = (projects: Project[], year: number): number => {
  let totalRevenue = 0;
  
  for (const project of projects) {
    // Only include projects from the specified year and not cancelled
    if (project.installDate && 
        new Date(project.installDate).getFullYear() === year &&
        project.status !== 'cancelled') {
      
      // Use paymentAmount if available, otherwise calculate from system size and PPW
      if (project.paymentAmount) {
        totalRevenue += project.paymentAmount;
      } else if (project.systemSize && project.grossPPW) {
        const systemSize = parseFloat(project.systemSize);
        const ppw = parseFloat(project.grossPPW);
        totalRevenue += systemSize * ppw * 1000;
      }
    }
  }
  
  return totalRevenue;
};

// Calculate team earnings by office
export const calculateTeamEarningsByOffice = (
  projects: Project[], 
  office: string,
  year: number,
  payType: 'Rookie' | 'Vet' | 'Pro' = 'Rookie'
): number => {
  const officeProjects = projects.filter(project => 
    project.office === office &&
    project.installDate && 
    new Date(project.installDate).getFullYear() === year &&
    project.status !== 'cancelled'
  );
  
  return calculateTeamEarnings(officeProjects, year, payType);
};

// Calculate team revenue by office
export const calculateTeamRevenueByOffice = (
  projects: Project[], 
  office: string,
  year: number
): number => {
  const officeProjects = projects.filter(project => 
    project.office === office &&
    project.installDate && 
    new Date(project.installDate).getFullYear() === year &&
    project.status !== 'cancelled'
  );
  
  return calculateTeamRevenue(officeProjects, year);
};

// Get user's pay type based on their performance (this would typically come from user profile)
export const getUserPayType = (userId: string, projects: Project[]): 'Rookie' | 'Vet' | 'Pro' => {
  // This is a simplified logic - in a real app, this would be based on user's actual performance
  // For now, we'll use a simple rule based on number of completed projects
  const userProjects = projects.filter(p => p.userId === userId && p.status === 'paid');
  
  if (userProjects.length >= 20) return 'Pro';
  if (userProjects.length >= 10) return 'Vet';
  return 'Rookie';
};
