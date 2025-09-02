"use client";

import React, { useState, useEffect } from 'react';
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from 'next/navigation';
import { useTheme } from "@/lib/hooks/useTheme";
import Sidebar from "@/components/Sidebar";
import AmbientLogo from "@/components/AmbientLogo";
import { useAuth } from "@/lib/contexts/AuthContext";
import jsPDF from 'jspdf';
import { 
  BarChart, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  CreditCard, 
  Download, 
  Filter, 
  Home, 
  Menu, 
  Printer,
  DollarSign,
  TrendingUp,
  Banknote,
  Clock,
  Target
} from 'lucide-react';

interface CommissionPayment {
  amount: number;
  date: string;
  projectId: string;
  description: string;
  status: 'pending' | 'paid';
  customerName: string;
  dealNumber: number;
  systemSize: number;
  commissionRate: number;
  type: 'upfront' | 'milestone';
}

interface Deposit {
  id: string;
  amount: number;
  date: string;
  type: 'commission' | 'bonus' | 'advance' | 'adjustment';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

export default function HRPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode, toggleTheme } = useTheme();
  const auth = useAuth();
  const { user, userData, loading, signOut } = auth || {};

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);
  const [nextPayment, setNextPayment] = useState<CommissionPayment | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<CommissionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [ytdEarnings, setYtdEarnings] = useState(0);
  const [ytdDeals, setYtdDeals] = useState(0);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [userPayType, setUserPayType] = useState<'Rookie' | 'Vet' | 'Pro'>('Rookie');
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, { upfront: 'pending' | 'paid', milestone: 'pending' | 'paid' }>>({});
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '90days' | '1year'>('all');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Load payment statuses from localStorage
  const loadPaymentStatuses = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('paymentStatuses');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing payment statuses:', e);
          return {};
        }
      }
    }
    return {};
  };

  // Save payment statuses to localStorage
  const savePaymentStatuses = (statuses: Record<string, { upfront: 'pending' | 'paid', milestone: 'pending' | 'paid' }>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentStatuses', JSON.stringify(statuses));
    }
  };

  // Filter payments by date range
  const filterPaymentsByDate = (payments: CommissionPayment[]) => {
    if (dateFilter === 'all') return payments;
    
    const today = new Date();
    const filterDate = new Date();
    
    switch (dateFilter) {
      case '30days':
        filterDate.setDate(today.getDate() + 30);
        break;
      case '90days':
        filterDate.setDate(today.getDate() + 90);
        break;
      case '1year':
        filterDate.setFullYear(today.getFullYear() + 1);
        break;
    }
    
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate <= filterDate;
    });
  };

  // Generate PDF earnings statement
  const generateEarningsStatement = async () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Set up colors (matching site theme)
    const primaryColor: [number, number, number] = [6, 182, 212]; // cyan-500
    const darkColor: [number, number, number] = [15, 23, 42]; // slate-900
    const lightGray: [number, number, number] = [148, 163, 184]; // slate-400
    const backgroundColor: [number, number, number] = [248, 250, 252]; // slate-50
    const paperGray: [number, number, number] = [107, 114, 128]; // gray-500

    // Set the entire page background to gray
    doc.setFillColor(...paperGray);
    doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');

    // Header with logo area and company branding (transparent to show gray background)
    // No background fill - let the gray page background show through
    
    // Add the Ambient logo text (matching site design)
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    
    // Center the logo text in the header
    const logoText = 'ambient';
    const textWidth = doc.getTextWidth(logoText);
    const pageWidth = doc.internal.pageSize.width;
    const centerX = (pageWidth - textWidth) / 2;
    
    doc.text(logoText, centerX, 30);
    
    // Earnings Statement subtitle
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    
    // Center the subtitle
    const subtitleText = 'Earnings Statement';
    const subtitleWidth = doc.getTextWidth(subtitleText);
    const subtitleCenterX = (pageWidth - subtitleWidth) / 2;
    
    doc.text(subtitleText, subtitleCenterX, 50);
    
    // Document info section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    doc.text(`Generated: ${currentDate}`, 20, 60);
    doc.text(`Employee: ${user?.displayName || user?.email || 'N/A'}`, 20, 70);
    doc.text(`Pay Type: ${userPayType}`, 20, 80);

    // YTD Summary section with styled box
    doc.setFillColor(255, 255, 255); // White background
    doc.roundedRect(15, 90, 180, 60, 3, 3, 'F');
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 90, 180, 60, 3, 3, 'S');
    
    // Center the YTD Summary title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    const ytdTitleText = 'Year-to-Date Summary';
    const ytdTitleWidth = doc.getTextWidth(ytdTitleText);
    const ytdTitleCenterX = 15 + (180 - ytdTitleWidth) / 2;
    doc.text(ytdTitleText, ytdTitleCenterX, 110);
    
    // Center the YTD Summary content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    
    const earningsText = `Total Earnings: ${formatCurrency(ytdEarnings)}`;
    const earningsWidth = doc.getTextWidth(earningsText);
    const earningsCenterX = 15 + (180 - earningsWidth) / 2;
    doc.text(earningsText, earningsCenterX, 125);
    
    const dealsText = `Deals Closed: ${ytdDeals}`;
    const dealsWidth = doc.getTextWidth(dealsText);
    const dealsCenterX = 15 + (180 - dealsWidth) / 2;
    doc.text(dealsText, dealsCenterX, 135);
    
    const avgText = `Average per Deal: ${ytdDeals > 0 ? formatCurrency(ytdEarnings / ytdDeals) : '$0.00'}`;
    const avgWidth = doc.getTextWidth(avgText);
    const avgCenterX = 15 + (180 - avgWidth) / 2;
    doc.text(avgText, avgCenterX, 145);

    // Commission Structure section
    doc.setFillColor(255, 255, 255); // White background
    doc.roundedRect(15, 160, 180, 60, 3, 3, 'F');
    doc.setDrawColor(...primaryColor);
    doc.roundedRect(15, 160, 180, 60, 3, 3, 'S');
    
    // Center the Commission Structure title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    const commTitleText = 'Commission Structure';
    const commTitleWidth = doc.getTextWidth(commTitleText);
    const commTitleCenterX = 15 + (180 - commTitleWidth) / 2;
    doc.text(commTitleText, commTitleCenterX, 180);
    
    // Center the Commission Structure content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    const upfrontRate = userPayType === 'Rookie' ? 300 : userPayType === 'Vet' ? 600 : 800;
    
    const upfrontText = `Upfront Rate: ${formatCurrency(upfrontRate)} per deal`;
    const upfrontWidth = doc.getTextWidth(upfrontText);
    const upfrontCenterX = 15 + (180 - upfrontWidth) / 2;
    doc.text(upfrontText, upfrontCenterX, 195);
    
    const milestoneText = `Milestone Rate: ${userPayType === 'Rookie' ? '24%' : userPayType === 'Vet' ? '39%' : '50%'} of profit`;
    const milestoneWidth = doc.getTextWidth(milestoneText);
    const milestoneCenterX = 15 + (180 - milestoneWidth) / 2;
    doc.text(milestoneText, milestoneCenterX, 205);
    
    const paymentText = `Upfront Payment: Friday after close`;
    const paymentWidth = doc.getTextWidth(paymentText);
    const paymentCenterX = 15 + (180 - paymentWidth) / 2;
    doc.text(paymentText, paymentCenterX, 215);

    // Deposits History section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    
    // Center the Deposits History title
    const depositsTitleText = 'Deposits History';
    const depositsTitleWidth = doc.getTextWidth(depositsTitleText);
    const depositsTitleCenterX = (pageWidth - depositsTitleWidth) / 2;
    doc.text(depositsTitleText, depositsTitleCenterX, 240);
    
    if (deposits.length > 0) {
      // Table header
      doc.setFillColor(...primaryColor);
      doc.rect(20, 250, 170, 12, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      
      // Center table header text
      const dateText = 'Date';
      const amountText = 'Amount';
      const descText = 'Description';
      
      // Calculate column centers
      const col1Center = 20 + (50 - doc.getTextWidth(dateText)) / 2;
      const col2Center = 70 + (50 - doc.getTextWidth(amountText)) / 2;
      const col3Center = 120 + (70 - doc.getTextWidth(descText)) / 2;
      
      doc.text(dateText, col1Center, 258);
      doc.text(amountText, col2Center, 258);
      doc.text(descText, col3Center, 258);
      
      // Table rows
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkColor);
      
      let yPosition = 270;
      deposits.forEach((deposit, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        // White background for all rows
        doc.setFillColor(255, 255, 255);
        doc.rect(20, yPosition - 5, 170, 10, 'F');
        
        // Center table row content
        const dateStr = formatDate(deposit.date);
        const amountStr = formatCurrency(deposit.amount);
        const descStr = deposit.description;
        
        const rowCol1Center = 20 + (50 - doc.getTextWidth(dateStr)) / 2;
        const rowCol2Center = 70 + (50 - doc.getTextWidth(amountStr)) / 2;
        const rowCol3Center = 120 + (70 - doc.getTextWidth(descStr)) / 2;
        
        doc.text(dateStr, rowCol1Center, yPosition);
        doc.text(amountStr, rowCol2Center, yPosition);
        doc.text(descStr, rowCol3Center, yPosition);
        yPosition += 10;
      });
      
      // Total Deposits
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      
      const totalText = `Total Deposited: ${formatCurrency(totalDeposits)}`;
      const totalWidth = doc.getTextWidth(totalText);
      const totalCenterX = (pageWidth - totalWidth) / 2;
      doc.text(totalText, totalCenterX, yPosition + 15);
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkColor);
      
      const noDepositsText = 'No deposits recorded';
      const noDepositsWidth = doc.getTextWidth(noDepositsText);
      const noDepositsCenterX = (pageWidth - noDepositsWidth) / 2;
      doc.text(noDepositsText, noDepositsCenterX, 250);
    }

    // Professional footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer background
      doc.setFillColor(255, 255, 255); // White background
      doc.rect(0, doc.internal.pageSize.height - 20, doc.internal.pageSize.width, 20, 'F');
      
      // Footer content
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightGray);
      doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      
      // Company branding in footer
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Ambient Energy', doc.internal.pageSize.width - 50, doc.internal.pageSize.height - 10);
    }

    // Download the PDF
    const fileName = `earnings-statement-${user?.displayName?.replace(/\s+/g, '-').toLowerCase() || 'employee'}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Force process all payments to correct their statuses
  const forceProcessAllPayments = () => {
    try {
      const today = new Date();
      // Set time to end of day to ensure payments are processed at midnight
      today.setHours(23, 59, 59, 999);
      
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const userProjects = projects.filter((project: any) => project.userId === user?.uid);
      const storedPaymentStatuses = loadPaymentStatuses();
      let hasUpdates = false;

      userProjects.forEach((project: any) => {
        if (!project || !project.id) return;
        
        const projectId = project.id;
        
        // Process upfront payment
        const upfrontDate = calculateUpfrontCommissionDate(project);
        if (upfrontDate) {
          const upfrontPaymentDate = new Date(upfrontDate);
          // Set payment date to start of day for accurate comparison
          upfrontPaymentDate.setHours(0, 0, 0, 0);
          
          if (upfrontPaymentDate <= today) {
            if (!storedPaymentStatuses[projectId]) {
              storedPaymentStatuses[projectId] = { upfront: 'pending', milestone: 'pending' };
            }
            if (storedPaymentStatuses[projectId].upfront === 'pending') {
              storedPaymentStatuses[projectId].upfront = 'paid';
              hasUpdates = true;
            }
          }
        }

        // Process milestone payment
        const milestoneDate = calculateMilestoneCommissionDate(project);
        if (milestoneDate) {
          const milestonePaymentDate = new Date(milestoneDate);
          // Set payment date to start of day for accurate comparison
          milestonePaymentDate.setHours(0, 0, 0, 0);
          
          if (milestonePaymentDate <= today) {
            if (!storedPaymentStatuses[projectId]) {
              storedPaymentStatuses[projectId] = { upfront: 'pending', milestone: 'pending' };
            }
            if (storedPaymentStatuses[projectId].milestone === 'pending') {
              storedPaymentStatuses[projectId].milestone = 'paid';
              hasUpdates = true;
            }
          }
        }
      });

      if (hasUpdates) {
        savePaymentStatuses(storedPaymentStatuses);
        setPaymentStatuses(storedPaymentStatuses);
      }

      return hasUpdates;
    } catch (error) {
      console.error('Error processing payments:', error);
      return false;
    }
  };

  // Calculate milestone commission for a project
  const calculateProjectMilestoneCommission = (project: any) => {
    if (!project.systemSize || !project.grossPPW) {
      return 0;
    }
    
    // Convert systemSize to number
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
    
    // Apply user's commission percentage
    let commissionPercentage = 0;
    switch (userPayType) {
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

  // Calculate upfront commission for a project
  const calculateUpfrontCommission = (project: any) => {
    const upfrontRate = userPayType === 'Rookie' ? 300 : userPayType === 'Vet' ? 600 : 800;
    return upfrontRate;
  };

  // Calculate upfront commission date (Friday after job is marked as closed)
  const calculateUpfrontCommissionDate = (project: any) => {
    try {
      if (!project || !project.closedDate) {
        return null; // No closed date means no upfront commission date yet
      }
      
      const closedDate = new Date(project.closedDate);
      
      // Validate the date
      if (isNaN(closedDate.getTime())) {
        return null;
      }
      
      // Find the first Friday after closed date
      const daysUntilFriday = (5 - closedDate.getDay() + 7) % 7;
      const firstFriday = new Date(closedDate);
      firstFriday.setDate(closedDate.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
      
      return firstFriday.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating upfront commission date:', error);
      return null;
    }
  };

  // Ensure date is a Friday (helper function)
  const ensureFriday = (dateString: string) => {
    try {
      if (!dateString) {
        return new Date().toISOString().split('T')[0];
      }
      
      const date = new Date(dateString);
      
      // Validate the date
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      
      const dayOfWeek = date.getDay();
      
      // If it's not Friday (5), adjust to the next Friday
      if (dayOfWeek !== 5) {
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        date.setDate(date.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error ensuring Friday date:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // Calculate milestone commission date (two Fridays after install date)
  const calculateMilestoneCommissionDate = (project: any) => {
    try {
      if (!project || !project.installDate) {
        return null; // No install date means no milestone commission date yet
      }
      
      const installDate = new Date(project.installDate);
      
      // Validate the date
      if (isNaN(installDate.getTime())) {
        return null;
      }
      
      // Find the first Friday after install date
      const daysUntilFriday = (5 - installDate.getDay() + 7) % 7;
      const firstFriday = new Date(installDate);
      firstFriday.setDate(installDate.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
      
      // Add 14 days (2 weeks) to get the second Friday
      const milestoneDate = new Date(firstFriday);
      milestoneDate.setDate(firstFriday.getDate() + 14);
      
      return milestoneDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating milestone commission date:', error);
      return null;
    }
  };

  // Load projects data and convert to commission payments
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 2000);

    // HR page loading

    if (user && user.uid) {
      // Load user's pay type from localStorage
      const userDataKey = `userData_${user.uid}`;
      const storedUserData = localStorage.getItem(userDataKey);
      if (storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          if (parsedUserData.payType) {
            setUserPayType(parsedUserData.payType);
          }
        } catch (e) {
          console.error('Error parsing userData from localStorage:', e);
        }
      }

      // Load payment statuses from localStorage
      const storedPaymentStatuses = loadPaymentStatuses();
      setPaymentStatuses(storedPaymentStatuses);

      // Force process all existing payments to correct their statuses
      forceProcessAllPayments();

      // Load projects from localStorage
      const storedProjects = localStorage.getItem('projects');
      let projectsData: any[] = [];
      
      if (storedProjects) {
        try {
          projectsData = JSON.parse(storedProjects);
          // Projects loaded from localStorage
        } catch (e) {
          console.error("Error parsing projects from localStorage:", e);
          projectsData = [];
        }
      }
      
      // Filter projects for current user
      const userProjects = projectsData.filter(project => project.userId === user.uid);
      // User projects filtered
      
      // Convert projects to commission payments (both upfront and milestone)
      const commissionPayments: CommissionPayment[] = [];
      
      userProjects.forEach(project => {
        const systemSize = parseFloat(project.systemSize || '0');
        
        // Calculate upfront commission (paid Friday after job is closed)
        const upfrontAmount = calculateUpfrontCommission(project);
        const upfrontDate = calculateUpfrontCommissionDate(project);
        
        // Determine upfront payment status
        let upfrontStatus: 'pending' | 'paid' = 'pending';
        if (upfrontDate) {
          const today = new Date();
          // Set time to end of day to ensure payments are processed at midnight
          today.setHours(23, 59, 59, 999);
          const upfrontPaymentDate = new Date(upfrontDate);
          // Set payment date to start of day for accurate comparison
          upfrontPaymentDate.setHours(0, 0, 0, 0);
          
          // Check if we have a stored status for this project
          const projectStatus = storedPaymentStatuses[project.id];
          if (projectStatus && projectStatus.upfront) {
            // Use stored status, but update if date has passed
            if (upfrontPaymentDate <= today && projectStatus.upfront === 'pending') {
              upfrontStatus = 'paid';
              // Update the stored status
              storedPaymentStatuses[project.id] = {
                ...projectStatus,
                upfront: 'paid'
              };
            } else {
              upfrontStatus = projectStatus.upfront;
            }
          } else {
            // No stored status, calculate based on date
            upfrontStatus = upfrontPaymentDate <= today ? 'paid' : 'pending';
            // Store the new status
            if (!storedPaymentStatuses[project.id]) {
              storedPaymentStatuses[project.id] = { upfront: 'pending', milestone: 'pending' };
            }
            storedPaymentStatuses[project.id].upfront = upfrontStatus;
          }
        }
        
        const upfrontPayment: CommissionPayment = {
          amount: upfrontAmount,
          date: upfrontDate ? ensureFriday(upfrontDate) : ensureFriday(project.createdAt || project.installDate),
          projectId: project.id,
          description: `Upfront commission for ${project.customerName} - ${systemSize}kW system`,
          status: upfrontStatus,
          customerName: project.customerName,
          dealNumber: project.dealNumber || 1,
          systemSize: systemSize,
          commissionRate: upfrontAmount,
          type: 'upfront'
        };
        commissionPayments.push(upfrontPayment);
        
        // Calculate milestone commission (paid two Fridays after PTO status)
        const milestoneAmount = calculateProjectMilestoneCommission(project);
        if (milestoneAmount > 0) {
          const milestoneDate = calculateMilestoneCommissionDate(project);
          
          // Determine milestone payment status
          let milestoneStatus: 'pending' | 'paid' = 'pending';
          if (milestoneDate) {
            const today = new Date();
            // Set time to end of day to ensure payments are processed at midnight
            today.setHours(23, 59, 59, 999);
            const milestonePaymentDate = new Date(milestoneDate);
            // Set payment date to start of day for accurate comparison
            milestonePaymentDate.setHours(0, 0, 0, 0);
            
            // Check if we have a stored status for this project
            const projectStatus = storedPaymentStatuses[project.id];
            if (projectStatus && projectStatus.milestone) {
              // Use stored status, but update if date has passed
              if (milestonePaymentDate <= today && projectStatus.milestone === 'pending') {
                milestoneStatus = 'paid';
                // Update the stored status
                storedPaymentStatuses[project.id] = {
                  ...projectStatus,
                  milestone: 'paid'
                };
              } else {
                milestoneStatus = projectStatus.milestone;
              }
            } else {
              // No stored status, calculate based on date
              milestoneStatus = milestonePaymentDate <= today ? 'paid' : 'pending';
              // Store the new status
              if (!storedPaymentStatuses[project.id]) {
                storedPaymentStatuses[project.id] = { upfront: 'pending', milestone: 'pending' };
              }
              storedPaymentStatuses[project.id].milestone = milestoneStatus;
            }
          }
          
          const milestonePayment: CommissionPayment = {
            amount: milestoneAmount,
            date: milestoneDate ? ensureFriday(milestoneDate) : ensureFriday(project.paymentDate || project.installDate),
            projectId: project.id,
            description: `Milestone commission for ${project.customerName} - ${systemSize}kW system`,
            status: milestoneStatus,
            customerName: project.customerName,
            dealNumber: project.dealNumber || 1,
            systemSize: systemSize,
            commissionRate: milestoneAmount,
            type: 'milestone'
          };
          commissionPayments.push(milestonePayment);
        }
      });
      
      // Commission payments converted
      
      // Save updated payment statuses to localStorage
      savePaymentStatuses(storedPaymentStatuses);
      setPaymentStatuses(storedPaymentStatuses);
      
      // Sort payments by date
      const sortedPayments = [...commissionPayments].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      setCommissionPayments(sortedPayments);
      
      // Set next payment (first pending payment)
      const pendingPayments = sortedPayments.filter(p => p.status === 'pending');
      setNextPayment(pendingPayments.length > 0 ? pendingPayments[0] : null);
      
      // Set payment history (paid payments)
      const paidPayments = sortedPayments.filter(p => p.status === 'paid');
      setPaymentHistory(paidPayments);
      
      // Calculate total pending amount
      const total = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalPending(total);
      
      // Calculate YTD earnings (current year)
      const currentYear = new Date().getFullYear();
      const ytdPaidPayments = paidPayments.filter(p => {
        const paymentYear = new Date(p.date).getFullYear();
        return paymentYear === currentYear;
      });
      
      const ytdTotal = ytdPaidPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setYtdEarnings(ytdTotal);
      setYtdDeals(ytdPaidPayments.length);
      
      // Generate deposits from ALL paid payments (grouped by date)
      const depositsMap = new Map<string, { deposit: Deposit; paymentCount: number; types: Set<string> }>();
      
      paidPayments.forEach((payment) => {
        const dateKey = payment.date;
        
        if (depositsMap.has(dateKey)) {
          // Add to existing deposit for this date
          const existing = depositsMap.get(dateKey)!;
          existing.deposit.amount += payment.amount;
          existing.paymentCount += 1;
          existing.types.add(payment.type);
          
          // Update description based on types
          if (existing.types.has('upfront') && existing.types.has('milestone')) {
            existing.deposit.description = `${existing.paymentCount} commissions (Upfront & Milestone)`;
          } else if (existing.types.has('upfront')) {
            existing.deposit.description = `${existing.paymentCount} upfront commissions`;
          } else if (existing.types.has('milestone')) {
            existing.deposit.description = `${existing.paymentCount} milestone commissions`;
          }
        } else {
          // Create new deposit for this date
          const types = new Set([payment.type]);
          depositsMap.set(dateKey, {
            deposit: {
              id: `deposit-${dateKey}`,
              amount: payment.amount,
              date: payment.date,
              type: 'commission' as const,
              description: payment.description,
              status: 'completed' as const,
              reference: `DEP-${dateKey.replace(/-/g, '')}`
            },
            paymentCount: 1,
            types: types
          });
        }
      });
      
      const deposits: Deposit[] = Array.from(depositsMap.values())
        .map(item => item.deposit)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setDeposits(deposits);
      
      // Calculate total deposits from ALL paid payments (not just YTD)
      const totalDepositsAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalDeposits(totalDepositsAmount);
      
      setIsLoading(false);
    } else if (!loading) {
      // If user is undefined but auth loading is complete, exit loading state
      setIsLoading(false);
    }

    return () => clearTimeout(timer);
  }, [user, loading, isLoading, userPayType]);

  if (isLoading) {
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
    <div className="flex h-screen theme-bg-primary overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode}
        signOut={signOut}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col theme-bg-secondary overflow-hidden">
        <header className="theme-bg-secondary shadow-sm border-b theme-border-primary">
          <div className="px-6 py-4 flex items-center">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="text-cyan-500 hover:text-cyan-600 transition-colors p-1"
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
              <div className="absolute left-1/2 top-4 transform -translate-x-1/2 flex items-center">
                <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
              </div>
            )}

            <div className={`${sidebarOpen ? 'ml-4' : 'ml-auto'} flex-1`}>
              <div className="flex justify-between items-center">
                {sidebarOpen && (
                  <>
                    <h1 className="text-2xl font-bold theme-text-primary">HR</h1>
                    <button 
                      onClick={() => {
                        // Create sample projects for testing
                        if (user) {
                          const storedProjects = localStorage.getItem('projects');
                          let projectsData: any[] = [];
                          
                          if (storedProjects) {
                            try {
                              projectsData = JSON.parse(storedProjects);
                            } catch (e) {
                              console.error("Error parsing projects:", e);
                              projectsData = [];
                            }
                          }
                          
                          // Add test projects (mix of paid and pending)
                            const today = new Date();
                          const currentYear = today.getFullYear();
                          
                          const testProjects = [
                            {
                              id: `test-project-${Date.now()}-1`,
                              customerName: "Smith Family",
                              address: "123 Test St, City, CA",
                              phoneNumber: "(555) 123-4567",
                              email: "smith@email.com",
                              installDate: new Date(currentYear, 0, 15).toISOString().split('T')[0], // January
                              paymentDate: new Date(currentYear, 0, 15).toISOString().split('T')[0],
                              paymentAmount: 25000,
                              status: "paid",
                              userId: user.uid,
                              systemSize: "8.0",
                              dealNumber: 1,
                              grossPPW: "3.13",
                              eaBattery: true,
                              mpu: true,
                              createdAt: new Date(currentYear, 0, 1).toISOString().split('T')[0], // Project created in January
                              closedDate: new Date(currentYear, 0, 5).toISOString().split('T')[0] // Closed on January 5th
                            },
                            {
                              id: `test-project-${Date.now()}-2`,
                              customerName: "Johnson Family",
                              address: "456 Test Ave, City, CA",
                              phoneNumber: "(555) 234-5678",
                              email: "johnson@email.com",
                              installDate: new Date(currentYear, 1, 20).toISOString().split('T')[0], // February
                              paymentDate: new Date(currentYear, 1, 20).toISOString().split('T')[0],
                              paymentAmount: 30000,
                              status: "paid",
                              userId: user.uid,
                              systemSize: "12.0",
                              dealNumber: 2,
                              grossPPW: "2.50",
                              backupBattery: true,
                              createdAt: new Date(currentYear, 1, 1).toISOString().split('T')[0], // Project created in February
                              closedDate: new Date(currentYear, 1, 10).toISOString().split('T')[0] // Closed on February 10th
                            },
                            {
                              id: `test-project-${Date.now()}-3`,
                              customerName: "Williams Family",
                              address: "789 Test Rd, City, CA",
                              phoneNumber: "(555) 345-6789",
                              email: "williams@email.com",
                              installDate: new Date(currentYear, 2, 10).toISOString().split('T')[0], // March
                              paymentDate: new Date(currentYear, 2, 10).toISOString().split('T')[0],
                              paymentAmount: 22000,
                              status: "paid",
                              userId: user.uid,
                              systemSize: "10.0",
                              dealNumber: 3,
                              grossPPW: "2.20",
                              hti: true,
                              createdAt: new Date(currentYear, 2, 1).toISOString().split('T')[0], // Project created in March
                              closedDate: new Date(currentYear, 2, 3).toISOString().split('T')[0] // Closed on March 3rd
                            },
                            {
                              id: `test-project-${Date.now()}-4`,
                              customerName: "Jones Family",
                              address: "321 Test Blvd, City, CA",
                              phoneNumber: "(555) 456-7890",
                              email: "jones@email.com",
                              installDate: new Date().toISOString().split('T')[0], // Today
                              paymentDate: new Date().toISOString().split('T')[0],
                              paymentAmount: 18000,
                              status: "install", // This will be pending milestone commission
                              userId: user.uid,
                              systemSize: "6.0",
                              dealNumber: 4,
                              grossPPW: "3.00",
                              reroof: true,
                              createdAt: new Date().toISOString().split('T')[0], // Project created today
                              closedDate: null // Not closed yet - upfront will be pending
                            }
                          ];
                          
                          // Add test projects to existing projects
                          projectsData.push(...testProjects);
                          
                          // Store updated projects
                          localStorage.setItem('projects', JSON.stringify(projectsData));
                          
                          alert("Added test projects (3 paid + 1 pending). Refresh the page to see YTD earnings and deposits.");
                          console.log("Added test projects:", testProjects);
                        }
                      }}
                      className="px-3 py-1 text-xs theme-bg-quaternary rounded-md theme-text-primary"
                    >
                      Add Test Projects
                    </button>
                  </>
                )}
              </div>
              {sidebarOpen && (
                <p className="theme-text-tertiary text-sm">Review your earnings from projects</p>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto theme-bg-secondary">
          <div className="p-6">
            {/* Pay Type Display */}
            <div className="mb-6">
              <div className="theme-bg-tertiary rounded-lg p-4 border theme-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold theme-text-primary">Commission Structure</h3>
                    <p className="text-sm theme-text-secondary">Current pay type: <span className="font-medium theme-text-primary">{userPayType}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm theme-text-secondary">Upfront Rate</p>
                    <p className="text-lg font-bold theme-text-primary">
                      ${userPayType === 'Rookie' ? '300' : userPayType === 'Vet' ? '600' : '800'}/deal
                    </p>
                    <p className="text-xs theme-text-tertiary mt-1">Paid Friday after close</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm theme-text-secondary">Milestone Rate</p>
                    <p className="text-lg font-bold theme-text-primary">
                      {userPayType === 'Rookie' ? '24%' : userPayType === 'Vet' ? '39%' : '50%'} of Commission
                    </p>
                    <p className="text-xs theme-text-tertiary mt-1">Paid 2 Fridays after install</p>
                  </div>
                </div>
              </div>
            </div>

            {/* YTD Earnings Summary */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold theme-text-primary mb-6 flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-cyan-500" />
                Year-to-Date Earnings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total YTD Earnings */}
                <div className="theme-bg-tertiary rounded-lg p-6 border theme-border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm theme-text-secondary mb-1">Total Earnings</p>
                      <p className="text-3xl font-bold theme-text-primary">{formatCurrency(ytdEarnings)}</p>
                    </div>
                    <div className="p-3 bg-cyan-500 bg-opacity-10 rounded-full">
                      <DollarSign className="h-6 w-6 text-cyan-500" />
                    </div>
                  </div>
                </div>

                {/* Deals Closed */}
                <div className="theme-bg-tertiary rounded-lg p-6 border theme-border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm theme-text-secondary mb-1">Deals Closed</p>
                      <p className="text-3xl font-bold theme-text-primary">{ytdDeals}</p>
                    </div>
                    <div className="p-3 bg-green-500 bg-opacity-10 rounded-full">
                      <Target className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Average per Deal */}
                <div className="theme-bg-tertiary rounded-lg p-6 border theme-border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm theme-text-secondary mb-1">Avg per Deal</p>
                      <p className="text-3xl font-bold theme-text-primary">
                        {ytdDeals > 0 ? formatCurrency(ytdEarnings / ytdDeals) : '$0.00'}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500 bg-opacity-10 rounded-full">
                      <BarChart className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Pending Amount */}
                <div className="theme-bg-tertiary rounded-lg p-6 border theme-border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm theme-text-secondary mb-1">Pending</p>
                      <p className="text-3xl font-bold theme-text-primary">{formatCurrency(totalPending)}</p>
                    </div>
                    <div className="p-3 bg-yellow-500 bg-opacity-10 rounded-full">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment controls */}
            <div className="mb-6 flex items-center justify-end space-x-3">
              <button 
                onClick={generateEarningsStatement}
                className={`${darkMode ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-cyan-500 hover:bg-cyan-600'} px-4 py-2 rounded-md text-white font-medium flex items-center`}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>

            {/* Next Payment Card */}
            <div className="mb-8 theme-bg-tertiary rounded-lg shadow-sm theme-border-primary border overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold theme-text-primary">Next Payment</h2>
                </div>
                
                {nextPayment ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <span className="block text-sm theme-text-secondary mb-1">Amount</span>
                        <span className="text-3xl font-bold theme-text-primary">{formatCurrency(totalPending)}</span>
                      </div>
                      <div>
                        <span className="block text-sm theme-text-secondary mb-1">Payment Date</span>
                        <span className="text-lg font-medium theme-text-primary flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(nextPayment.date)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-sm theme-text-secondary mb-1">Payment Method</span>
                        <span className="text-lg font-medium theme-text-primary flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Direct Deposit
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t theme-border-primary">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium theme-text-primary">Payment Breakdown</h3>
                        <select 
                          value={dateFilter} 
                          onChange={(e) => setDateFilter(e.target.value as 'all' | '30days' | '90days' | '1year')}
                          className={`px-3 py-1 rounded-md text-sm border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="all">All Payments</option>
                          <option value="30days">Next 30 Days</option>
                          <option value="90days">Next 90 Days</option>
                          <option value="1year">Next Year</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        {filterPaymentsByDate(commissionPayments.filter(payment => payment.status === 'pending')).map((payment, index) => (
                            <div key={index} className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="theme-text-primary">{payment.description}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm theme-text-secondary">{formatDate(payment.date)}</p>
                              <span className="font-medium theme-text-primary">{formatCurrency(payment.amount)}</span>
                            </div>
                            </div>
                          ))
                        }
                        
                        <div className="flex justify-between items-center pt-2 border-t theme-border-primary">
                          <span className="font-medium theme-text-primary">Total Amount</span>
                          <span className="font-bold text-lg theme-text-primary">{formatCurrency(totalPending)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center theme-text-secondary">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>You don't have any pending payments.</p>
                    <p className="mt-2 text-sm">Completed sets will appear here when ready for payment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="mb-8 theme-bg-tertiary rounded-lg shadow-sm theme-border-primary border overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold theme-text-primary">Payment History</h2>
                  <div className="flex items-center text-sm theme-text-secondary">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Payments automatically move here when due date passes</span>
                  </div>
                </div>
                
                {paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b theme-border-primary">
                          <th className="text-left py-3 px-4 theme-text-secondary">Date</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Amount</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Type</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Customer</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Deal</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment, index) => (
                          <tr key={index} className="border-b theme-border-primary hover:theme-bg-quaternary">
                            <td className="py-4 px-4 theme-text-primary">{formatDate(payment.date)}</td>
                            <td className="py-4 px-4 theme-text-primary font-medium">{formatCurrency(payment.amount)}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                payment.type === 'upfront' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {payment.type === 'upfront' ? 'Upfront' : 'Milestone'}
                              </span>
                            </td>
                            <td className="py-4 px-4 theme-text-primary">{payment.customerName}</td>
                            <td className="py-4 px-4 theme-text-primary">#{payment.dealNumber}</td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 theme-text-secondary">
                    <BarChart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>You don't have any payment history yet.</p>
                    <p className="mt-2 text-sm">Completed payments will appear here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Deposits List */}
            <div className="theme-bg-tertiary rounded-lg shadow-sm theme-border-primary border overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold theme-text-primary flex items-center">
                      <Banknote className="h-5 w-5 mr-2 text-cyan-500" />
                      Deposits
                    </h2>
                    <p className="text-sm theme-text-secondary mt-1">
                      All paid commissions grouped by date
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm theme-text-secondary">Total Deposited</p>
                    <p className="text-2xl font-bold theme-text-primary">{formatCurrency(totalDeposits)}</p>
                  </div>
                </div>
                
                {deposits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b theme-border-primary">
                          <th className="text-left py-3 px-4 theme-text-secondary">Date</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Amount</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Type</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Description</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Reference</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((deposit) => (
                          <tr key={deposit.id} className="border-b theme-border-primary hover:theme-bg-quaternary">
                            <td className="py-4 px-4 theme-text-primary">{formatDate(deposit.date)}</td>
                            <td className="py-4 px-4 theme-text-primary font-medium">{formatCurrency(deposit.amount)}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                deposit.type === 'commission' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : deposit.type === 'bonus'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {deposit.type.charAt(0).toUpperCase() + deposit.type.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4 theme-text-primary">{deposit.description}</td>
                            <td className="py-4 px-4 theme-text-primary font-mono text-sm">{deposit.reference}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                deposit.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : deposit.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {deposit.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {deposit.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 theme-text-secondary">
                    <Banknote className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No deposits found.</p>
                    <p className="mt-2 text-sm">Completed payments will appear here as deposits.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 