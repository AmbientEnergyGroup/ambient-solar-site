"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { BarChart3, Users, LogOut, Home, Search, ChevronDown, ChevronUp, X, Check, Upload } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";
// Only import UUID when needed on client side
import ClientOnly from "@/components/ClientOnly";
import MessagesButton from "@/components/MessagesButton";

// Helper function to generate safe IDs
const generateId = () => {
  if (typeof window === 'undefined') {
    return 'server-id-' + Math.random().toString(36).substr(2, 9);
  }
  // Import dynamically only on client side
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Mock data for sets (in a real app, this would come from a database)
interface Set {
  id: string;
  customerName: string;
  address: string;
  phoneNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  isSpanishSpeaker: boolean;
  notes: string;
  createdAt: string;
  status?: "active" | "inactive" | "not_closed"; // Add not_closed status
  utilityBill?: string; // Add utility bill field
  userId: string; // Add userId to track which user owns this set
}

const mockSets: Set[] = [
  {
    id: "1",
    customerName: "John Doe",
    address: "123 Main St, New York, NY",
    phoneNumber: "555-123-4567",
    appointmentDate: "2023-05-15",
    appointmentTime: "14:30",
    isSpanishSpeaker: false,
    notes: "Interested in solar panels for the roof",
    createdAt: "2023-05-10T14:30:00",
    status: "active",
    userId: "user1"
  },
  {
    id: "2",
    customerName: "Maria Garcia",
    address: "456 Broadway, New York, NY",
    phoneNumber: "555-765-4321",
    appointmentDate: "2023-05-16",
    appointmentTime: "10:00",
    isSpanishSpeaker: true,
    notes: "Has high electricity bills, looking for ways to save",
    createdAt: "2023-05-10T16:45:00",
    status: "active",
    userId: "user1"
  },
  {
    id: "3",
    customerName: "Bob Smith",
    address: "789 Park Ave, New York, NY",
    phoneNumber: "555-987-6543",
    appointmentDate: "2023-05-17",
    appointmentTime: "16:00",
    isSpanishSpeaker: false,
    notes: "Referral from John Doe, wants to reduce carbon footprint",
    createdAt: "2023-05-11T09:15:00",
    status: "inactive",
    userId: "user1"
  },
  {
    id: "4",
    customerName: "Carlos Rodriguez",
    address: "321 5th Ave, New York, NY",
    phoneNumber: "555-234-5678",
    appointmentDate: "2023-05-18",
    appointmentTime: "11:30",
    isSpanishSpeaker: true,
    notes: "New homeowner, interested in clean energy options",
    createdAt: "2023-05-11T13:20:00",
    status: "active",
    userId: "user1"
  },
  {
    id: "5",
    customerName: "Sarah Johnson",
    address: "654 Washington St, Boston, MA",
    phoneNumber: "555-345-6789",
    appointmentDate: "2023-05-19",
    appointmentTime: "15:00",
    isSpanishSpeaker: false,
    notes: "Looking to upgrade existing solar system",
    createdAt: "2023-05-12T10:30:00",
    status: "inactive",
    userId: "user1"
  }
];

export default function Sets() {
  const [sets, setSets] = useState<Set[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Set>("appointmentDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<"active" | "not_closed">("active");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [isClosedVerified, setIsClosedVerified] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { darkMode } = useTheme();
  const [closeFormData, setCloseFormData] = useState({
    customerName: "",
    systemSize: "",
    grossPPW: "",
    adders: [] as string[],
    lender: "",
    financeType: "",
    panelType: "",
    siteSurveyDate: "",
    siteSurveyTime: "",
    permitDate: "",
    installDate: "",
    inspectionDate: "",
    ptoDate: "",
    paymentDate: "",
    batteryType: "",
    batteryQuantity: "0"
  });
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedSetDocuments, setSelectedSetDocuments] = useState<Set | null>(null);
  
  // New Set Form State
  const [showNewSetModal, setShowNewSetModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [isSpanishSpeaker, setIsSpanishSpeaker] = useState(false);
  const [notes, setNotes] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [roofAge, setRoofAge] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [energyBill, setEnergyBill] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [appointmentDuration, setAppointmentDuration] = useState("30");
  const [leadSource, setLeadSource] = useState("");
  const [utilityBill, setUtilityBill] = useState<File | null>(null);
  
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Function to update user role based on number of sets
  const updateUserRole = (setsCount: number) => {
    if (typeof window === 'undefined') return;
    
    let newRole = "Intern Rep"; // Default role for 1-10 sets
    
    if (setsCount >= 11 && setsCount <= 20) {
      newRole = "Veteran Rep";
    } else if (setsCount >= 21) {
      newRole = "Pro Rep";
    }
    
    // Get current role from localStorage
    const currentRole = localStorage.getItem("userRole");
    
    // Only update if role has changed
    if (currentRole !== newRole) {
      localStorage.setItem("userRole", newRole);
      console.log(`Updated user role to ${newRole} based on ${setsCount} closed deals`);
    }
  };

  // Function to count user's closed deals from projects
  const countUserClosedDeals = () => {
    if (!user || typeof window === 'undefined') return 0;
    
    // Get projects from localStorage
    const savedProjects = localStorage.getItem('projects');
    if (!savedProjects) return 0;
    
    try {
      const projects = JSON.parse(savedProjects);
      // Count only this user's projects
      const userProjects = projects.filter((project: any) => project.userId === user.uid);
      return userProjects.length;
    } catch (e) {
      console.error("Error counting closed deals:", e);
      return 0;
    }
  };

  // Add a new useEffect for client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle URL parameters for pre-populating address from canvassing
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const addressParam = urlParams.get('address');
      if (addressParam) {
        setAddress(addressParam);
        // Open the new set modal automatically
        setShowNewSetModal(true);
        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isClient]);

  // Fetch sets on component mount
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    } else if (user && isClient) { // Only access localStorage if on client
      const savedSets = localStorage.getItem('customerSets');
      if (savedSets) {
        const allSets = JSON.parse(savedSets);
        // Show only the user's sets, or all sets for admin
        const isAdmin = true; // Temporarily make all users admins
        const filteredSets = isAdmin 
          ? allSets 
          : allSets.filter((set: Set) => set.userId === user.uid);
        
        setSets(filteredSets);
        
        // Update user role based on closed deals count
        if (!isAdmin) {
          const closedDealsCount = countUserClosedDeals();
          updateUserRole(closedDealsCount);
        }
      } else {
        setSets([]);
        // Even with 0 sets, check closed deals
        if (user.role !== 'admin') {
          const closedDealsCount = countUserClosedDeals();
          updateUserRole(closedDealsCount);
        }
      }
    }
  }, [user, loading, router, activeTab, isClient]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Handle sort toggle
  const toggleSort = (field: keyof Set) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle canceling a set - changes to move to not_closed status
  const handleCancel = (id: string) => {
    if (!isClient) return;
    
    const updatedSets = sets.map(set => 
      set.id === id ? { ...set, status: "not_closed" as const } : set
    );
    setSets(updatedSets as Set[]);
    localStorage.setItem('customerSets', JSON.stringify(updatedSets));
  };

  // New function to reactivate a set
  const handleReactivate = (id: string) => {
    if (!isClient) return;
    
    const updatedSets = sets.map(set => 
      set.id === id ? { ...set, status: "active" as const } : set
    );
    setSets(updatedSets as Set[]);
    localStorage.setItem('customerSets', JSON.stringify(updatedSets));
  };

  // Handle rescheduling
  const handleReschedule = (id: string) => {
    if (!isClient) return;
    
    // For a real app, this would open a modal with date/time picker
    const newDate = prompt("Enter new date (YYYY-MM-DD):");
    const newTime = prompt("Enter new time (HH:MM):");
    
    if (newDate && newTime) {
      const updatedSets = sets.map(set => 
        set.id === id ? { 
          ...set, 
          appointmentDate: newDate,
          appointmentTime: newTime 
        } : set
      );
      setSets(updatedSets as Set[]);
      localStorage.setItem('customerSets', JSON.stringify(updatedSets));
    }
  };

  // Prepare to move a set to Projects
  const prepareToMoveToProjects = (id: string) => {
    const setToMove = sets.find(set => set.id === id);
    if (!setToMove) return;
    
    // Pre-fill the form with the existing customer name
    setCloseFormData({
      ...closeFormData,
      customerName: setToMove.customerName
    });
    
    setCurrentSetId(id);
    setIsClosedVerified(false);
    setShowCloseModal(true);
  };

  // Function for moving a set to projects
  const handleMoveToProjects = () => {
    console.log("===== MOVING SET TO PROJECTS =====");
    // Make sure we have a current set ID and the verification is checked
    if (!currentSetId || !isClosedVerified) {
      console.log("Error: Missing currentSetId or not verified");
      return;
    }

    try {
      // Find the set to move
      const setToMove = sets.find(set => set.id === currentSetId);
      if (!setToMove) {
        console.log("Error: Could not find set with ID:", currentSetId);
        return;
      }
      
      console.log("Found set to move:", setToMove);
      
      // Calculate payment amount based on system size
      const systemSize = parseFloat(closeFormData.systemSize) || 0;
      const grossPPW = parseFloat(closeFormData.grossPPW) || 0;
      
      // Calculate gross cost
      const grossCost = grossPPW * systemSize * 1000;
      
      // Get existing projects to determine deal number and commission rate
      const savedProjects = localStorage.getItem('projects');
      console.log("Current projects in localStorage:", savedProjects);
      
      let existingProjects = savedProjects ? JSON.parse(savedProjects) : [];
      
      // Filter to get only this user's projects
      const userProjects = existingProjects.filter((p: any) => p.userId === user?.uid);
      console.log("User's existing projects:", userProjects.length);
      
      // Determine the deal number (count of this user's existing projects + 1)
      const dealNumber = userProjects.length + 1;
      console.log("This will be deal number:", dealNumber);
      
      // Set commission rate based on tier
      let commissionRate = 200; // Default $200/kW for first 10 deals
      
      if (dealNumber > 10 && dealNumber <= 20) {
        commissionRate = 250; // $250/kW for deals 11-20
      }
      
      console.log("Using commission rate:", commissionRate);
      
      // Calculate payment amount based on commission rate and system size
      const paymentAmount = commissionRate * systemSize;
      console.log("Calculated payment amount:", paymentAmount);

      // Add timestamp for sorting
      const createdAt = new Date().toISOString();

      // Calculate payment date for accounts 1-20 (automatically set to next week's Friday)
      let calculatedPaymentDate = closeFormData.paymentDate;
      if (dealNumber <= 20) {
        const today = new Date();
        // Find the next Friday (day 5, where Sunday is 0)
        const daysUntilFriday = (5 - today.getDay() + 7) % 7;
        // Add 7 more days to get to next week's Friday
        const nextWeekFriday = new Date(today);
        nextWeekFriday.setDate(today.getDate() + daysUntilFriday + 7);
        
        // Format the date as YYYY-MM-DD for the input field
        calculatedPaymentDate = nextWeekFriday.toISOString().split('T')[0];
        console.log("Automatically calculated payment date for setter:", calculatedPaymentDate);
      }

      // Create new project with all the required information
      const newProject = {
        id: setToMove.id, // Use the original set ID
        customerName: closeFormData.customerName,
        address: setToMove.address,
        installDate: closeFormData.installDate || undefined,
        paymentDate: calculatedPaymentDate || undefined,
        siteSurveyDate: closeFormData.siteSurveyDate,
        siteSurveyTime: closeFormData.siteSurveyTime,
        permitDate: closeFormData.permitDate || undefined,
        inspectionDate: closeFormData.inspectionDate || undefined,
        ptoDate: closeFormData.ptoDate || undefined,
        paymentAmount: paymentAmount,
        status: "site_survey",
        systemSize: closeFormData.systemSize,
        grossPPW: closeFormData.grossPPW,
        financeType: closeFormData.financeType,
        lender: closeFormData.lender,
        adders: closeFormData.adders,
        batteryType: closeFormData.batteryType,
        batteryQuantity: parseInt(closeFormData.batteryQuantity) || 0,
        panelType: closeFormData.panelType,
        utilityBill: setToMove.utilityBill,
        userId: user?.uid, // Ensure we use current user ID
        commissionRate: commissionRate, // Store the commission rate used
        dealNumber: dealNumber, // Store which deal number this is for the user
        createdAt: createdAt // Add timestamp for sorting
      };

      console.log("Created new project object:", newProject);

      // Add to projects in localStorage - ensure we append not replace
      existingProjects.push(newProject);
      
      console.log("Adding new project to localStorage, total projects:", existingProjects.length);
      localStorage.setItem('projects', JSON.stringify(existingProjects));

      // Update user data with new deal count and commission
      const userDataKey = `userData_${user?.uid}`;
      const storedUserData = localStorage.getItem(userDataKey);
      
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        // Update user data
        userData.dealCount = (userData.dealCount || 0) + 1;
        userData.totalCommission = (userData.totalCommission || 0) + paymentAmount;
        
        // Add to recent projects (keep last 5)
        userData.recentProjects = userData.recentProjects || [];
        userData.recentProjects.unshift(newProject.id);
        if (userData.recentProjects.length > 5) {
          userData.recentProjects = userData.recentProjects.slice(0, 5);
        }
        
        // Save updated user data
        localStorage.setItem(userDataKey, JSON.stringify(userData));
        console.log("Updated user data:", userData);
      }

      // Remove from sets
      const updatedSets = sets.filter(set => set.id !== currentSetId);
      setSets(updatedSets);
      
      // Update all sets in localStorage
      const allSetsJSON = localStorage.getItem('customerSets');
      if (allSetsJSON) {
        const allSets = JSON.parse(allSetsJSON);
        const updatedAllSets = allSets.filter((s: any) => s.id !== currentSetId);
        localStorage.setItem('customerSets', JSON.stringify(updatedAllSets));
      } else {
        localStorage.setItem('customerSets', JSON.stringify(updatedSets));
      }

      // Reset and close the modal
      setIsClosedVerified(false);
      setShowCloseModal(false);
      setCurrentSetId(null);
      setCloseFormData({
        customerName: "",
        systemSize: "",
        lender: "",
        financeType: "",
        batteryType: "",
        batteryQuantity: "0",
        panelType: "",
        grossPPW: "",
        siteSurveyDate: "",
        permitDate: "",
        installDate: "",
        inspectionDate: "",
        ptoDate: "",
        paymentDate: "",
        adders: [],
        siteSurveyTime: ""
      });
      
      // Show confirmation with commission details
      alert(`Set moved to projects successfully! This is deal #${dealNumber} with a commission of $${paymentAmount} (at $${commissionRate}/kW).`);
      
      // Important: Force a refresh of the projects page data when user is redirected 
      localStorage.setItem('forceProjectsRefresh', 'true');
      
      console.log("===== SET SUCCESSFULLY MOVED TO PROJECTS =====");
      
      // Update user role based on the new closed deal
      if (user?.role !== 'admin') {
        const closedDealsCount = countUserClosedDeals();
        updateUserRole(closedDealsCount);
      }
      
      router.push("/projects");
      
    } catch (error) {
      console.error('Error moving set to projects:', error);
      alert('There was an error moving this set to projects. Please try again.');
    }
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // All other form fields are handled here, adders are handled separately in their checkbox component
    setCloseFormData({
      ...closeFormData,
      [name]: value
    });
  };

  // Filter and sort sets
  const filteredAndSortedSets = sets
    .filter(set => 
      // First filter by active/not_closed status
      (set.status || "active") === activeTab &&
      // Then by search term
      (set.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.phoneNumber.includes(searchTerm))
    )
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

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // Handle viewing documents
  const handleViewDocuments = (set: Set) => {
    setSelectedSetDocuments(set);
    setShowDocumentsModal(true);
  };

  // Handle new set form submission
  const handleNewSetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store the utility bill file (in a real app, this would upload to a server)
    let utilityBillUrl = null;
    
    if (utilityBill) {
      // Create a FileReader to read the file contents
      const reader = new FileReader();
      
      reader.onload = (event) => {
        // Get the file content as a data URL
        utilityBillUrl = event.target?.result as string;
        
        // Create new set object
        const newSet = {
          id: Date.now().toString(), // Generate a unique ID
          customerName: `${firstName} ${lastName}`,
          address: address,
          phoneNumber,
          appointmentDate,
          appointmentTime,
          isSpanishSpeaker,
          notes,
          createdAt: new Date().toISOString(),
          appointmentType,
          appointmentDuration: "30",
          leadSource,
          utilityBill: utilityBillUrl,
          status: "active",
          userId: user?.uid || 'unknown' // Include the user ID when creating a new set
        };
        
        // Retrieve existing sets from localStorage
        const existingSetsJSON = localStorage.getItem('customerSets');
        const existingSets = existingSetsJSON ? JSON.parse(existingSetsJSON) : [];
        
        // Add new set to the array
        const updatedSets = [newSet, ...existingSets];
        
        // Save updated sets to localStorage
        localStorage.setItem('customerSets', JSON.stringify(updatedSets));
        
        // Update local state
        setSets(updatedSets);
        
        // Debug log
        console.log('New set saved:', newSet);
        console.log('All sets:', updatedSets);
        
        // Show success message
        setFormSubmitted(true);
        
        // Reset form and close modal after 3 seconds
        setTimeout(() => {
          setFormSubmitted(false);
          setShowNewSetModal(false);
          resetNewSetForm();
        }, 3000);
      };
      
      // Read the file as a data URL (base64 encoded)
      reader.readAsDataURL(utilityBill);
    } else {
      // If no utility bill, create the new set without waiting for file reading
      const newSet = {
        id: Date.now().toString(), // Generate a unique ID
        customerName: `${firstName} ${lastName}`,
        address: address,
        phoneNumber,
        appointmentDate,
        appointmentTime,
        isSpanishSpeaker,
        notes,
        createdAt: new Date().toISOString(),
        appointmentType,
        appointmentDuration: "30",
        leadSource,
        utilityBill: null,
        status: "active",
        userId: user?.uid || 'unknown' // Include the user ID when creating a new set
      };
      
      // Retrieve existing sets from localStorage
      const existingSetsJSON = localStorage.getItem('customerSets');
      const existingSets = existingSetsJSON ? JSON.parse(existingSetsJSON) : [];
      
      // Add new set to the array
      const updatedSets = [newSet, ...existingSets];
      
      // Save updated sets to localStorage
      localStorage.setItem('customerSets', JSON.stringify(updatedSets));
      
      // Update local state
      setSets(updatedSets);
      
      // Debug log
      console.log('New set saved:', newSet);
      console.log('All sets:', updatedSets);
      
      // Show success message
      setFormSubmitted(true);
      
      // Reset form and close modal after 3 seconds
      setTimeout(() => {
        setFormSubmitted(false);
        setShowNewSetModal(false);
        resetNewSetForm();
      }, 3000);
    }
  };

  // Reset new set form
  const resetNewSetForm = () => {
    setCurrentStep(0);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setAddress("");
    setCity("");
    setZipCode("");
    setAppointmentDate("");
    setAppointmentTime("");
    setIsSpanishSpeaker(false);
    setNotes("");
    setPropertyType("");
    setRoofAge("");
    setSquareFootage("");
    setEnergyBill("");
    setAppointmentType("");
    setLeadSource("");
    setUtilityBill(null);
  };

  // Update the return to use ClientOnly
  return (
    <ClientOnly>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen theme-bg-primary">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-amber-500' : 'border-blue-500'}`}></div>
        </div>
      ) : !user ? null : (
        <div className="flex h-screen theme-bg-primary">
          {/* Sidebar - Using the shared component */}
          <Sidebar 
            darkMode={darkMode}
            signOut={signOut}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* Main content */}
          <div className="flex-1 overflow-auto theme-bg-secondary">
            {/* Header */}
            <header className="theme-bg-secondary shadow-sm border-b theme-border-primary">
              <div className="px-6 py-4">
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

                  {/* Messages button */}
                  <div className="ml-2">
                    <MessagesButton />
                  </div>

                  {/* Centered logo when sidebar is closed */}
                  {!sidebarOpen && (
                    <div className="absolute left-1/2 top-4 transform -translate-x-1/2 flex items-center">
                      <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                    </div>
                  )}

                  <div className={`${sidebarOpen ? 'ml-4' : 'ml-auto'}`}>
                    {sidebarOpen && (
                      <>
                        <h1 className="text-2xl font-semibold theme-text-primary">Sets</h1>
                        <p className="theme-text-secondary">Manage your door-to-door sets and track progress</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex border-b theme-border-secondary">
                  <button 
                    className={`py-2 px-4 text-lg font-medium ${activeTab === "active" ? (darkMode ? "text-amber-500 border-b-2 border-amber-500" : "text-blue-500 border-b-2 border-blue-500") : "theme-text-secondary hover:theme-text-primary"}`}
                    onClick={() => setActiveTab("active")}
                  >
                    Sets Active
                  </button>
                  <button 
                    className={`py-2 px-4 text-lg font-medium ${activeTab === "not_closed" ? (darkMode ? "text-amber-500 border-b-2 border-amber-500" : "text-blue-500 border-b-2 border-blue-500") : "theme-text-secondary hover:theme-text-primary"}`}
                    onClick={() => setActiveTab("not_closed")}
                  >
                    Sets Not Closed
                  </button>
                </div>
              </div>
            </header>

            {/* Sets content */}
            <main className="p-6">
              {/* Search and filters */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search sets..."
                    className="p-2 pl-10 w-full md:w-64 theme-bg-tertiary border theme-border-primary rounded-lg theme-text-primary focus:outline-none focus:border-amber-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 theme-text-secondary" />
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowNewSetModal(true)}
                    className={`px-4 py-2 ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg font-medium transition-colors duration-200`}
                  >
                    + New Set
                  </button>
                </div>
              </div>
              
              {/* Sets table */}
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
                            Customer Name
                            {sortField === "customerName" && (
                              sortDirection === "asc" ? 
                                <ChevronUp className="ml-1 h-4 w-4" /> : 
                                <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                          <button 
                            className="flex items-center focus:outline-none"
                            onClick={() => toggleSort("address")}
                          >
                            Address
                            {sortField === "address" && (
                              sortDirection === "asc" ? 
                                <ChevronUp className="ml-1 h-4 w-4" /> : 
                                <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                          <button 
                            className="flex items-center focus:outline-none"
                            onClick={() => toggleSort("appointmentDate")}
                          >
                            Appointment
                            {sortField === "appointmentDate" && (
                              sortDirection === "asc" ? 
                                <ChevronUp className="ml-1 h-4 w-4" /> : 
                                <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                          <button 
                            className="flex items-center focus:outline-none"
                            onClick={() => toggleSort("isSpanishSpeaker")}
                          >
                            Spanish Speaker
                            {sortField === "isSpanishSpeaker" && (
                              sortDirection === "asc" ? 
                                <ChevronUp className="ml-1 h-4 w-4" /> : 
                                <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y theme-border-secondary">
                      {filteredAndSortedSets.length > 0 ? (
                        filteredAndSortedSets.map((set) => (
                          <tr key={set.id} className="hover:theme-bg-quaternary">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium theme-text-primary">
                                    {set.customerName}
                                  </div>
                                  <div className="text-xs theme-text-secondary">
                                    {set.isSpanishSpeaker && (
                                      <span className="inline-flex items-center">
                                        <span className="mr-1">🌐</span> Spanish
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm theme-text-primary">{set.address}</div>
                              <div className="text-xs theme-text-secondary">{set.phoneNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm theme-text-primary">
                                {formatDate(set.appointmentDate)}
                              </div>
                              <div className="text-xs theme-text-secondary">{set.appointmentTime}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm theme-text-primary">
                                {new Date(set.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs theme-text-secondary">
                                {new Date(set.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {set.status === "active" ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : set.status === "not_closed" ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Not Closed
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2 justify-end">
                                {activeTab === "active" && (
                                  <>
                                    <button
                                      onClick={() => handleViewDocuments(set)}
                                      className={`px-2.5 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                      Documents
                                    </button>
                                    <button
                                      onClick={() => handleReschedule(set.id)}
                                      className={`px-2.5 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                      Reschedule
                                    </button>
                                    <button
                                      onClick={() => handleCancel(set.id)}
                                      className="px-2.5 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                
                                {activeTab === "not_closed" && (
                                  <>
                                    <button
                                      onClick={() => handleViewDocuments(set)}
                                      className={`px-2.5 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                      Documents
                                    </button>
                                    <button
                                      onClick={() => handleReactivate(set.id)}
                                      className={`px-2.5 py-1 rounded text-xs ${darkMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                    >
                                      Reactivate
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center theme-text-secondary">
                            {searchTerm ? "No sets match your search" : "No sets found. Click '+ New Set' to create one."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </div>

          {/* Close Set Modal */}
          {showCloseModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 backdrop-blur-sm p-4">
              <div className="theme-bg-tertiary rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 theme-bg-tertiary p-4 border-b theme-border-primary flex justify-between items-center">
                  <h2 className="text-xl font-semibold theme-text-primary">Complete Set & Move to Projects</h2>
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="theme-text-secondary hover:theme-text-primary transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="mb-6">
                    <div className="flex items-center">
                      <input
                        id="close-verification"
                        type="checkbox"
                        className={`w-5 h-5 rounded border-gray-600 bg-gray-700 ${darkMode ? 'text-amber-500 focus:ring-amber-500' : 'text-blue-500 focus:ring-blue-500'} focus:ring-opacity-50`}
                        checked={isClosedVerified}
                        onChange={(e) => setIsClosedVerified(e.target.checked)}
                      />
                      <label htmlFor="close-verification" className="ml-2 block theme-text-primary text-sm font-medium">
                        I verify this set is complete and ready to be moved to projects
                      </label>
                    </div>
                    <p className="theme-text-secondary text-xs mt-1 ml-7">
                      You must verify the set is complete to continue
                    </p>
                  </div>
                  
                  <form id="closeSetForm" onSubmit={(e) => { e.preventDefault(); handleMoveToProjects(); }}>
                    <fieldset disabled={!isClosedVerified} className={!isClosedVerified ? "opacity-50" : ""}>
                      {/* Customer Name */}
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          name="customerName"
                          className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                          value={closeFormData.customerName}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      
                      {/* Two columns for System Size and Gross PPW */}
                      <div className="mb-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            System Size (kW)
                          </label>
                          <input
                            type="text"
                            name="systemSize"
                            className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                            value={closeFormData.systemSize}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Gross PPW
                          </label>
                          <input
                            type="text"
                            name="grossPPW"
                            className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-amber-500 theme-bg-quaternary theme-text-primary"
                            value={closeFormData.grossPPW}
                            onChange={handleFormChange}
                            required
                          />
                          <p className="text-xs theme-text-secondary mt-1">
                            <span className={darkMode ? "text-amber-400" : "text-blue-500"}>$</span> Price Per Watt determines total system cost and your commission
                          </p>
                        </div>
                      </div>
                      
                      {/* Adders Multi-select */}
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Adders
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Battery', 'MPU', 'Reroof', 'HTI', 'Sub Panel', 'Panel Removal'].map((adder) => (
                            <div key={adder} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`adder-${adder.toLowerCase().replace(' ', '-')}`}
                                checked={closeFormData.adders.includes(adder)}
                                onChange={(e) => {
                                  const newAdders = e.target.checked 
                                    ? [...closeFormData.adders, adder]
                                    : closeFormData.adders.filter(a => a !== adder);
                                  setCloseFormData({...closeFormData, adders: newAdders});
                                }}
                                className={`w-4 h-4 rounded border-gray-600 bg-gray-700 ${darkMode ? 'text-amber-500 focus:ring-amber-500' : 'text-blue-500 focus:ring-blue-500'} focus:ring-opacity-50`}
                              />
                              <label 
                                htmlFor={`adder-${adder.toLowerCase().replace(' ', '-')}`}
                                className="ml-2 block theme-text-primary text-sm"
                              >
                                {adder}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Two columns for Lender and Finance Type */}
                      <div className="mb-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Lender
                          </label>
                          <input
                            type="text"
                            name="lender"
                            className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                            value={closeFormData.lender}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Finance Type
                          </label>
                          <input
                            type="text"
                            name="financeType"
                            className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-amber-500 theme-bg-quaternary theme-text-primary"
                            value={closeFormData.financeType}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Panel Type */}
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Panel Type
                        </label>
                        <input
                          type="text"
                          name="panelType"
                          className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-amber-500 theme-bg-quaternary theme-text-primary"
                          value={closeFormData.panelType}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      
                      {/* Battery fields hidden if not selected in adders */}
                      {closeFormData.adders.includes('Battery') && (
                        <div className="mb-4 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block theme-text-tertiary text-sm font-medium mb-2">
                              Battery Type
                            </label>
                            <input
                              type="text"
                              name="batteryType"
                              className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-amber-500 theme-bg-quaternary theme-text-primary"
                              value={closeFormData.batteryType}
                              onChange={handleFormChange}
                            />
                          </div>
                          <div>
                            <label className="block theme-text-tertiary text-sm font-medium mb-2">
                              Battery Quantity
                            </label>
                            <input
                              type="number"
                              name="batteryQuantity"
                              className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-amber-500 theme-bg-quaternary theme-text-primary"
                              value={closeFormData.batteryQuantity}
                              onChange={handleFormChange}
                              min="0"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Date and time fields */}
                      <div className="mb-6 grid grid-cols-2 gap-4">
                        {/* Site Survey Date and Time */}
                        <div>
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Site Survey Date
                          </label>
                          <input
                            type="date"
                            name="siteSurveyDate"
                            className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-amber-500 theme-bg-quaternary theme-text-primary"
                            value={closeFormData.siteSurveyDate}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Site Survey Time
                          </label>
                          <input
                            type="time"
                            name="siteSurveyTime"
                            className="w-full p-2 border theme-border-primary rounded focus:outline-none focus:border-amber-500 theme-bg-quaternary theme-text-primary"
                            value={closeFormData.siteSurveyTime}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                       
                        {/* Hidden fields that can be set later manually */}
                        <div className="hidden">
                          <input
                            type="date"
                            name="permitDate"
                            value={closeFormData.permitDate}
                            onChange={handleFormChange}
                          />
                          <input
                            type="date"
                            name="installDate"
                            value={closeFormData.installDate}
                            onChange={handleFormChange}
                          />
                          <input
                            type="date"
                            name="inspectionDate"
                            value={closeFormData.inspectionDate}
                            onChange={handleFormChange}
                          />
                          <input
                            type="date"
                            name="ptoDate"
                            value={closeFormData.ptoDate}
                            onChange={handleFormChange}
                          />
                          <input
                            type="date"
                            name="paymentDate"
                            value={closeFormData.paymentDate}
                            onChange={handleFormChange}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <p className="text-sm theme-text-secondary p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            Other dates (permit, install, inspection, PTO, and payment) can be added later after the site survey is completed.
                            <br/>
                            <span className="mt-1 inline-block">
                              <span className={darkMode ? "text-amber-400" : "text-blue-500"}>Note:</span> For accounts 1-20, payment dates will be automatically set to the Friday of the next week's payroll.
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="sticky bottom-0 theme-bg-tertiary pt-4 pb-2 border-t theme-border-primary mt-5">
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowCloseModal(false)}
                            className="px-4 py-2 theme-bg-quaternary theme-text-primary theme-border-primary border rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!isClosedVerified}
                            className={`px-4 py-2 rounded text-white flex items-center ${
                              isClosedVerified 
                                ? (darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600') 
                                : 'bg-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Complete & Move to Projects
                          </button>
                        </div>
                      </div>
                    </fieldset>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* New Set Modal */}
          {showNewSetModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 backdrop-blur-sm p-4">
              <div className="theme-bg-tertiary rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 theme-bg-tertiary p-4 border-b theme-border-primary flex justify-between items-center">
                  <h2 className="text-xl font-semibold theme-text-primary">Create New Set</h2>
                  <button
                    onClick={() => {
                      setShowNewSetModal(false);
                      resetNewSetForm();
                    }}
                    className="theme-text-secondary hover:theme-text-primary"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6">
                  {formSubmitted ? (
                    <div className="text-center py-8">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${darkMode ? 'bg-amber-500' : 'bg-blue-500'} mb-4`}>
                        <Check className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold theme-text-primary mb-2">Set Created Successfully!</h3>
                      <p className="theme-text-secondary">Your new set has been added to the system.</p>
                    </div>
                  ) : (
                    <div className="theme-bg-quaternary shadow-sm theme-border-primary border rounded-lg overflow-hidden">
                      {/* Progress Tabs */}
                      <div className="border-b theme-border-primary theme-bg-tertiary">
                        <div className="flex">
                          {['Customer Info', 'Property Details', 'Schedule', 'Notes'].map((tab, index) => (
                            <button
                              key={tab}
                              onClick={() => setCurrentStep(index)}
                              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                                currentStep === index
                                  ? (darkMode ? 'border-amber-500 text-amber-500' : 'border-blue-500 text-blue-500') 
                                  : 'border-transparent theme-text-secondary hover:theme-text-primary'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs mr-2 ${
                                  currentStep > index
                                    ? (darkMode ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white')
                                    : currentStep === index
                                    ? (darkMode ? 'border border-amber-500 text-amber-500' : 'border border-blue-500 text-blue-500')
                                    : 'theme-bg-quaternary theme-text-secondary'
                                }`}>
                                  {currentStep > index ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    index + 1
                                  )}
                                </span>
                                {tab}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Form Content */}
                      <div className="p-6">
                        {/* Step 1: Customer Info */}
                        {currentStep === 0 && (
                          <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-semibold theme-text-primary mb-4">Customer Information</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  First Name*
                                </label>
                                <input
                                  type="text"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  placeholder="John"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Last Name*
                                </label>
                                <input
                                  type="text"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  placeholder="Doe"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="john.doe@example.com"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Phone Number*
                                </label>
                                <input
                                  type="tel"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={phoneNumber}
                                  onChange={(e) => setPhoneNumber(e.target.value)}
                                  placeholder="(555) 555-5555"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className={`h-4 w-4 ${darkMode ? 'text-amber-500' : 'text-blue-500'} border theme-border-primary rounded focus:ring-0`}
                                    checked={isSpanishSpeaker}
                                    onChange={(e) => setIsSpanishSpeaker(e.target.checked)}
                                  />
                                  <span className="ml-2 text-sm theme-text-primary">Spanish Speaker</span>
                                </label>
                              </div>
                            </div>
                            
                            <div className="flex justify-end pt-4">
                              <button
                                onClick={() => setCurrentStep(1)}
                                disabled={!firstName || !lastName || !phoneNumber}
                                className={`px-6 py-2.5 rounded-md font-medium transition-colors duration-200 ${
                                  !firstName || !lastName || !phoneNumber
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : darkMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                Next Step
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Step 2: Property Details */}
                        {currentStep === 1 && (
                          <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-semibold theme-text-primary mb-4">Property Details</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Address*
                                </label>
                                <input
                                  type="text"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  placeholder="123 Main St, Anytown, State 12345"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Property Type
                                </label>
                                <select
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={propertyType}
                                  onChange={(e) => setPropertyType(e.target.value)}
                                >
                                  <option value="residential">Residential</option>
                                  <option value="commercial">Commercial</option>
                                  <option value="multi-family">Multi-Family</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Roof Age (Years)
                                </label>
                                <input
                                  type="number"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={roofAge}
                                  onChange={(e) => setRoofAge(e.target.value)}
                                  min="0"
                                  max="100"
                                  placeholder="10"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Square Footage
                                </label>
                                <input
                                  type="number"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={squareFootage}
                                  onChange={(e) => setSquareFootage(e.target.value)}
                                  min="0"
                                  placeholder="2000"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Current Energy Bill ($)
                                </label>
                                <input
                                  type="number"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={energyBill}
                                  onChange={(e) => setEnergyBill(e.target.value)}
                                  min="0"
                                  placeholder="250"
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-between pt-4">
                              <button
                                onClick={() => setCurrentStep(0)}
                                className="px-6 py-2.5 border theme-border-primary theme-bg-quaternary theme-text-primary rounded-md font-medium transition-colors duration-200 hover:theme-bg-tertiary"
                              >
                                Back
                              </button>
                              <button
                                onClick={() => setCurrentStep(2)}
                                disabled={!address}
                                className={`px-6 py-2.5 rounded-md font-medium transition-colors duration-200 ${
                                  !address
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : darkMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                Next Step
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Schedule */}
                        {currentStep === 2 && (
                          <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-semibold theme-text-primary mb-4">Schedule Appointment</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Date*
                                </label>
                                <input
                                  type="date"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={appointmentDate}
                                  onChange={(e) => setAppointmentDate(e.target.value)}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Time*
                                </label>
                                <input
                                  type="time"
                                  className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                  value={appointmentTime}
                                  onChange={(e) => setAppointmentTime(e.target.value)}
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Appointment Type
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                  {['Initial Energy Assessment', 'Two Touch'].map(type => (
                                    <label 
                                      key={type} 
                                      className={`block p-3 border rounded-md cursor-pointer transition-colors duration-200 ${
                                        appointmentType === type
                                          ? (darkMode 
                                            ? 'border-amber-500 bg-amber-500 bg-opacity-10 text-amber-500' 
                                            : 'border-blue-500 bg-blue-500 bg-opacity-10 text-blue-500')
                                          : 'theme-border-primary theme-text-primary hover:theme-bg-quaternary'
                                      }`}
                                    >
                                      <input 
                                        type="radio" 
                                        name="appointmentType" 
                                        className="sr-only" 
                                        value={type}
                                        checked={appointmentType === type}
                                        onChange={() => setAppointmentType(type)}
                                      />
                                      <span className="flex items-center">
                                        <span className={`w-4 h-4 mr-2 rounded-full border flex items-center justify-center ${
                                          appointmentType === type
                                            ? (darkMode ? 'border-amber-500' : 'border-blue-500')
                                            : 'theme-border-primary'
                                        }`}>
                                          {appointmentType === type && (
                                            <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                          )}
                                        </span>
                                        {type}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                  Duration
                                </label>
                                <div className="flex items-center">
                                  <div className={`px-3 py-1.5 theme-bg-quaternary border theme-border-primary rounded-md theme-text-primary font-medium`}>
                                    30 mins
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between pt-4">
                              <button
                                onClick={() => setCurrentStep(1)}
                                className="px-6 py-2.5 border theme-border-primary theme-bg-quaternary theme-text-primary rounded-md font-medium transition-colors duration-200 hover:theme-bg-tertiary"
                              >
                                Back
                              </button>
                              <button
                                onClick={() => setCurrentStep(3)}
                                disabled={!appointmentDate || !appointmentTime}
                                className={`px-6 py-2.5 rounded-md font-medium transition-colors duration-200 ${
                                  !appointmentDate || !appointmentTime
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : darkMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                Next Step
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Step 4: Notes */}
                        {currentStep === 3 && (
                          <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-semibold theme-text-primary mb-4">Additional Notes</h2>
                            
                            <div>
                              <label className="block text-sm font-medium theme-text-tertiary mb-1">
                                Notes for Sales Rep
                              </label>
                              <textarea
                                rows={4}
                                className="w-full theme-bg-quaternary border theme-border-primary rounded-md p-2.5 theme-text-primary focus:ring-2 focus:ring-opacity-50 focus:outline-none"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any special instructions or information for the sales representative..."
                              ></textarea>
                            </div>
                            
                            {/* Utility Bill Upload */}
                            <div className="border theme-border-primary rounded-md p-4 theme-bg-quaternary">
                              <h3 className="font-medium theme-text-primary mb-3">Upload Utility Bill</h3>
                              <div className="space-y-2">
                                <label className="block w-full cursor-pointer">
                                  <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed theme-border-primary rounded-md hover:theme-bg-tertiary transition-colors duration-200 ${utilityBill ? 'bg-opacity-50' : ''}`}>
                                    <Upload className={`h-8 w-8 mb-2 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} />
                                    {!utilityBill ? (
                                      <>
                                        <p className="text-sm theme-text-primary font-medium">Click to upload utility bill</p>
                                        <p className="text-xs theme-text-secondary mt-1">PDF, JPG, or PNG accepted</p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-sm theme-text-primary font-medium">File uploaded</p>
                                        <p className="text-xs theme-text-secondary mt-1">{utilityBill.name}</p>
                                      </>
                                    )}
                                  </div>
                                  <input 
                                    type="file" 
                                    className="sr-only" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      setUtilityBill(file);
                                    }}
                                  />
                                </label>
                                {utilityBill && (
                                  <div className="flex justify-end">
                                    <button
                                      onClick={() => setUtilityBill(null)}
                                      className="text-xs theme-text-secondary hover:theme-text-primary"
                                    >
                                      Remove file
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="border theme-border-primary rounded-md p-4 theme-bg-quaternary">
                              <h3 className="font-medium theme-text-primary mb-3">Lead Source</h3>
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {['Canvassing', 'Referral', 'Website', 'Social Media', 'Event', 'Partner', 'Other'].map(source => (
                                    <label 
                                      key={source} 
                                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer ${
                                        leadSource === source
                                          ? (darkMode ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white')
                                          : 'theme-bg-tertiary theme-text-secondary hover:theme-text-primary'
                                      } transition-colors duration-150`}
                                    >
                                      <input 
                                        type="radio" 
                                        name="leadSource" 
                                        className="sr-only" 
                                        value={source}
                                        checked={leadSource === source}
                                        onChange={() => setLeadSource(source)}
                                      />
                                      {source}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between pt-4">
                              <button
                                onClick={() => setCurrentStep(2)}
                                className="px-6 py-2.5 border theme-border-primary theme-bg-quaternary theme-text-primary rounded-md font-medium transition-colors duration-200 hover:theme-bg-tertiary"
                              >
                                Back
                              </button>
                              <button
                                onClick={handleNewSetSubmit}
                                className={`px-6 py-2.5 rounded-md font-medium transition-colors duration-200 ${
                                  darkMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                Submit Set
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents Modal */}
          {showDocumentsModal && selectedSetDocuments && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
              <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-2xl w-full mx-4 theme-border-primary border">
                <div className="p-4 border-b theme-border-primary flex items-center justify-between">
                  <h3 className="text-lg font-semibold theme-text-primary">
                    Account Documents - {selectedSetDocuments.customerName}
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
                  {selectedSetDocuments.utilityBill ? (
                    <div className="border theme-border-primary rounded-lg overflow-hidden">
                      <div className="p-4 theme-bg-quaternary">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mr-2 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="theme-text-primary font-medium">Utility Bill</span>
                        </div>
                        
                        <div className="mt-4">
                          {/* Display the PDF in an iframe if it's a data URL */}
                          {selectedSetDocuments.utilityBill.startsWith('data:') ? (
                            <div className="flex flex-col items-center">
                              <div className="w-full h-96 border theme-border-primary rounded-md overflow-hidden mb-4">
                                <iframe 
                                  src={selectedSetDocuments.utilityBill} 
                                  className="w-full h-full"
                                  title="Utility Bill"
                                ></iframe>
                              </div>
                              <button 
                                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                                onClick={() => window.open(selectedSetDocuments.utilityBill, '_blank')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Open in New Tab
                              </button>
                            </div>
                          ) : (
                            <div className="p-5 border theme-border-primary rounded-md theme-text-primary text-center">
                              <p className="mb-2">File preview not available</p>
                              <button 
                                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                                onClick={() => window.open(selectedSetDocuments.utilityBill, '_blank')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download File
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 theme-text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      <p>No documents uploaded for this customer</p>
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
        </div>
      )}
    </ClientOnly>
  );
} 