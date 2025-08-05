"use client";

import { useState, useEffect, useRef } from "react";
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { BarChart3, Users, LogOut, Home, Map, CheckCircle2, ClipboardList, UserPlus, Clock, AlertCircle, XCircle, Paperclip, X, File, Image, FileText, Download } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import { storage } from "@/lib/firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// Define types for the referrals and todo items
interface Referral {
  referralName: string;
  referralEmail: string;
  referralPhone: string;
  relationship: string;
  experience: string;
  reason: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  referredBy: string;
}

interface TodoItem {
  id: number;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
}

// Define type for messages
interface Message {
  id: number;
  sender: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

export default function ManagerRoles() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first if available (client-side only)
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode === null ? true : savedMode !== 'false';
    }
    return true; // Default to dark mode if localStorage not available
  });
  const [activeTab, setActiveTab] = useState<'referrals' | 'todo' | 'messages'>('referrals');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newMessage, setNewMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Apply theme when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  // Load referrals from localStorage
  useEffect(() => {
    try {
      // Ensure we only load items on the client
      if (typeof window !== 'undefined') {
        const storedReferrals = localStorage.getItem('referrals');
        if (storedReferrals) {
          setReferrals(JSON.parse(storedReferrals));
        } else {
          // Add sample referrals if none exist
          const sampleReferrals: Referral[] = [
            {
              referralName: "John Smith",
              referralEmail: "john.smith@example.com",
              referralPhone: "(555) 123-4567",
              relationship: "Friend",
              experience: "Some Experience (Less than 1 year)",
              reason: "John has excellent communication skills and is looking for a new career opportunity in sales. He's highly motivated and a quick learner.",
              date: new Date().toISOString(),
              status: 'Pending',
              referredBy: "Demo User"
            },
            {
              referralName: "Sarah Johnson",
              referralEmail: "sarah.j@example.com",
              referralPhone: "(555) 987-6543",
              relationship: "Former Colleague",
              experience: "Moderate Experience (1-3 years)",
              reason: "Sarah worked with me at ABC Company and has a strong background in customer relations. She's looking for a new challenge and would be an asset to our team.",
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
              status: 'Approved',
              referredBy: "Demo User"
            }
          ];
          setReferrals(sampleReferrals);
          localStorage.setItem('referrals', JSON.stringify(sampleReferrals));
        }
      }
    } catch (error) {
      console.error("Error loading referrals:", error);
    }

    // Mock TODO items (in a real app, this would be loaded from an API)
    setTodoItems([
      {
        id: 1,
        title: "Review sales performance reports",
        description: "Analyze weekly sales reports and prepare summary for leadership meeting",
        priority: "High",
        status: "Pending",
        dueDate: "2023-10-05"
      },
      {
        id: 2,
        title: "Conduct team training session",
        description: "Prepare and deliver training on new sales approach for residential customers",
        priority: "Medium",
        status: "In Progress",
        dueDate: "2023-10-10"
      },
      {
        id: 3,
        title: "Update territory assignments",
        description: "Reassign sales territories for Q4 based on performance metrics",
        priority: "High",
        status: "Pending",
        dueDate: "2023-10-07"
      },
      {
        id: 4,
        title: "Prepare quarterly performance reviews",
        description: "Complete performance evaluations for direct reports",
        priority: "Medium",
        status: "Completed",
        dueDate: "2023-09-30"
      },
      {
        id: 5,
        title: "Follow up with major customer accounts",
        description: "Contact top 5 clients to discuss renewal options",
        priority: "High",
        status: "In Progress",
        dueDate: "2023-10-12"
      }
    ]);
  }, []);

  // Load messages from localStorage
  useEffect(() => {
    try {
      // Ensure we only load items on the client
      if (typeof window !== 'undefined') {
        const storedMessages = localStorage.getItem('messages');
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        } else {
          // Add sample messages if none exist
          const sampleMessages: Message[] = [
            {
              id: 1,
              sender: "Team Lead",
              senderId: "team_lead_1",
              content: "Good morning team! Don't forget the training session at 2 PM today.",
              timestamp: new Date().toISOString(),
              read: false
            },
            {
              id: 2,
              sender: "Sarah Johnson",
              senderId: "sarah_j",
              content: "I just closed my first deal! Thanks everyone for your support!",
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              read: true,
              attachments: [
                {
                  name: "customer_agreement.pdf",
                  url: "https://example.com/fake-file.pdf",
                  type: "application/pdf",
                  size: 1024000
                }
              ]
            },
            {
              id: 3,
              sender: "John Smith",
              senderId: "john_smith",
              content: "Can someone help me with the new appointment setting process?",
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              read: true
            }
          ];
          setMessages(sampleMessages);
          localStorage.setItem('messages', JSON.stringify(sampleMessages));
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, []);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
    // In a real app, we would also check if the user has manager permissions
    // if (!loading && user && !user.isManager) {
    //   router.push("/dashboard");
    // }
  }, [user, loading, router]);

  const updateReferralStatus = (index: number, newStatus: 'Approved' | 'Rejected') => {
    const updatedReferrals = [...referrals];
    updatedReferrals[index].status = newStatus;
    setReferrals(updatedReferrals);
    
    // Ensure we save the updated referrals back to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('referrals', JSON.stringify(updatedReferrals));
    }
  };

  const updateTodoStatus = (id: number, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    const updatedTodos = todoItems.map(todo => 
      todo.id === id ? { ...todo, status: newStatus } : todo
    );
    setTodoItems(updatedTodos);
    
    // In a real app, this would call an API to update the status
    console.log(`Todo #${id} status updated to ${newStatus}`);
  };

  // Filter referrals based on status
  const filteredReferrals = filterStatus === 'all' 
    ? referrals 
    : referrals.filter(referral => referral.status.toLowerCase() === filterStatus);

  // Filter todo items based on status
  const filteredTodos = filterStatus === 'all'
    ? todoItems
    : todoItems.filter(todo => todo.status.toLowerCase().replace(' ', '') === filterStatus);

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  // Function to remove an attachment
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Function to get file type icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to upload a file to Firebase Storage
  const uploadFile = async (file: File): Promise<{name: string; url: string; type: string; size: number}> => {
    try {
      // Create a unique path for the file
      const fileName = `${uuidv4()}-${file.name}`;
      const filePath = `message-attachments/${fileName}`;
      
      // Create a reference to the storage location
      const storageRef = ref(storage, filePath);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      return {
        name: file.name,
        url: downloadUrl,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !user) return;
    
    try {
      setIsUploading(attachments.length > 0);
      
      // Upload attachments if any
      let messageAttachments: {name: string; url: string; type: string; size: number}[] = [];
      
      if (attachments.length > 0) {
        // Upload each file and get their download URLs
        messageAttachments = await Promise.all(
          attachments.map(file => uploadFile(file))
        );
      }
      
      const newMessageObj: Message = {
        id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
        sender: user.displayName || 'Anonymous User',
        senderId: user.uid,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        ...(messageAttachments.length > 0 && { attachments: messageAttachments })
      };
      
      const updatedMessages = [...messages, newMessageObj];
      setMessages(updatedMessages);
      localStorage.setItem('messages', JSON.stringify(updatedMessages));
      setNewMessage('');
      setAttachments([]);
      setIsUploading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsUploading(false);
      alert("Failed to upload attachment. Please try again.");
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-amber-500' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  // If user is not authenticated and not loading, this will render briefly before redirect
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen theme-bg-primary">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} theme-bg-tertiary shadow-md transition-all duration-300 overflow-hidden`}>
        <div className="p-4 border-b theme-border-secondary">
          <div className="flex items-center">
            <AmbientLogo theme={darkMode ? 'dark' : 'light'} />
            <span className={`ml-2 text-xl font-bold ${darkMode ? 'text-amber-500' : 'text-blue-500'}`}>Pro</span>
          </div>
        </div>
        
        <div className="py-4">
          <nav>
            <a href="/dashboard" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <Home className="h-5 w-5 mr-3" />
              Dashboard
            </a>

            <a href="/sets" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <Users className="h-5 w-5 mr-3" />
              Sets
            </a>
            <a href="/canvassing" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <Map className="h-5 w-5 mr-3" />
              Canvassing
            </a>
            <a href="/projects" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Projects
            </a>

            <a href="/leaderboard" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <BarChart3 className="h-5 w-5 mr-3" />
              Leaderboard
            </a>
                            <a href="/hr" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
                              HR
            </a>
            <a href="/incentives" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Incentives
            </a>
            <a href="/account" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Settings
            </a>
            <a href="/recruiting-form" className="flex items-center px-4 py-3 theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200">
              <UserPlus className="h-5 w-5 mr-3" />
              Recruiting Form
            </a>
            <a href="/manager-roles" className="flex items-center px-4 py-3 theme-text-primary theme-bg-active">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Manager Roles
            </a>
          </nav>
        </div>
        
        <div className="border-t theme-border-secondary p-4 mt-auto">
          <button 
            onClick={signOut}
            className="flex items-center px-4 py-2 theme-text-secondary hover:theme-text-primary w-full transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto theme-bg-secondary">
        {/* Header */}
        <header className="theme-bg-secondary shadow-sm border-b theme-border-primary">
          <div className="px-6 py-4 flex items-center">
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

            {!sidebarOpen && (
              <div className="flex items-center ml-4">
                <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
              </div>
            )}

            <div className={`${sidebarOpen ? 'ml-4' : 'ml-auto'}`}>
              <h1 className="text-2xl font-semibold theme-text-primary">Manager Dashboard</h1>
              <p className="theme-text-secondary">Monitor recruiting submissions and manage your to-do list</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 theme-bg-tertiary p-1 rounded-xl mb-6 overflow-x-auto">
            <button 
              className={`flex items-center px-4 py-2 rounded-lg ${
                activeTab === "referrals" 
                  ? "theme-accent-primary font-medium"
                  : "theme-text-tertiary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500"
              }`}
              onClick={() => setActiveTab("referrals")}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Recruiting Submissions
            </button>
            <button 
              className={`flex items-center px-4 py-2 rounded-lg ${
                activeTab === "todo" 
                  ? "theme-accent-primary font-medium"
                  : "theme-text-tertiary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500"
              }`}
              onClick={() => setActiveTab("todo")}
            >
              <ClipboardList className="h-5 w-5 mr-2" />
              To-Do List
            </button>
            <button 
              className={`flex items-center px-4 py-2 rounded-lg ${
                activeTab === "messages" 
                  ? "theme-accent-primary font-medium"
                  : "theme-text-tertiary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500"
              }`}
              onClick={() => setActiveTab("messages")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
            </button>
          </div>

          {/* Filter Controls */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  filterStatus === 'all' 
                    ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white')
                    : 'theme-bg-quaternary theme-text-secondary'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  filterStatus === 'pending' 
                    ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white')
                    : 'theme-bg-quaternary theme-text-secondary'
                }`}
              >
                Pending
              </button>
              {activeTab === 'todo' && (
                <button 
                  onClick={() => setFilterStatus('inprogress')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    filterStatus === 'inprogress' 
                      ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white')
                      : 'theme-bg-quaternary theme-text-secondary'
                  }`}
                >
                  In Progress
                </button>
              )}
              {activeTab === 'referrals' ? (
                <>
                  <button 
                    onClick={() => setFilterStatus('approved')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      filterStatus === 'approved' 
                        ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white')
                        : 'theme-bg-quaternary theme-text-secondary'
                    }`}
                  >
                    Approved
                  </button>
                  <button 
                    onClick={() => setFilterStatus('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      filterStatus === 'rejected' 
                        ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white')
                        : 'theme-bg-quaternary theme-text-secondary'
                    }`}
                  >
                    Rejected
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    filterStatus === 'completed' 
                      ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white')
                      : 'theme-bg-quaternary theme-text-secondary'
                  }`}
                >
                  Completed
                </button>
              )}
            </div>
          </div>

          {/* Recruiting Submissions Tab */}
          {activeTab === 'referrals' && (
            <div className="grid grid-cols-1 gap-6">
              {filteredReferrals.length > 0 ? (
                filteredReferrals.map((referral, index) => (
                  <div key={index} className="theme-bg-tertiary rounded-xl shadow-lg border theme-border-primary overflow-hidden">
                    <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-gray-750 to-gray-800 border-b theme-border-primary">
                      <div className="flex items-center gap-2">
                        <UserPlus className={`h-5 w-5 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} />
                        <h3 className="text-lg font-medium theme-text-primary">{referral.referralName}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'Pending' 
                              ? 'bg-yellow-900 bg-opacity-30 text-yellow-500' 
                              : referral.status === 'Approved' 
                                ? 'bg-green-900 bg-opacity-30 text-green-500'
                                : 'bg-red-900 bg-opacity-30 text-red-500'
                          }`}
                        >
                          {referral.status}
                        </span>
                        <span className="text-xs theme-text-secondary">
                          {new Date(referral.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium theme-text-secondary mb-1">Contact Information:</h4>
                          <p className="theme-text-primary">
                            {referral.referralEmail} | {referral.referralPhone}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium theme-text-secondary mb-1">Relationship & Experience:</h4>
                          <p className="theme-text-primary">
                            {referral.relationship} | {referral.experience}
                          </p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium theme-text-secondary mb-1">Why they'd be a good fit:</h4>
                        <p className="theme-text-primary">
                          {referral.reason}
                        </p>
                      </div>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium theme-text-secondary mb-1">Referred by:</h4>
                        <p className="theme-text-primary">
                          {referral.referredBy}
                        </p>
                      </div>
                      {referral.status === 'Pending' && (
                        <div className="flex justify-end gap-3 mt-4">
                          <button 
                            onClick={() => updateReferralStatus(index, 'Rejected')}
                            className="px-4 py-2 rounded-lg border border-red-600 text-red-500 hover:bg-red-900 hover:bg-opacity-20 transition-colors"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => updateReferralStatus(index, 'Approved')}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="theme-bg-tertiary rounded-xl shadow p-8 text-center">
                  <UserPlus className={`h-10 w-10 mx-auto mb-3 ${darkMode ? 'text-amber-500/70' : 'text-blue-500/70'}`} />
                  <h3 className="text-xl font-bold theme-text-primary mb-2">No Referrals Found</h3>
                  <p className="theme-text-secondary">
                    {filterStatus === 'all' 
                      ? "There are no recruiting submissions yet."
                      : `There are no ${filterStatus} referrals at the moment.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* To-Do List Tab */}
          {activeTab === 'todo' && (
            <div className="grid grid-cols-1 gap-4">
              {filteredTodos.length > 0 ? (
                filteredTodos.map((todo) => (
                  <div key={todo.id} className="theme-bg-tertiary rounded-xl shadow overflow-hidden border theme-border-primary">
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {todo.status === 'Completed' ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : todo.status === 'In Progress' ? (
                          <Clock className="h-6 w-6 text-yellow-500" />
                        ) : (
                          todo.priority === 'High' ? (
                            <AlertCircle className="h-6 w-6 text-red-500" />
                          ) : (
                            <ClipboardList className={`h-6 w-6 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} />
                          )
                        )}
                        <div>
                          <h3 className="font-medium theme-text-primary">{todo.title}</h3>
                          <p className="text-sm theme-text-secondary line-clamp-2">{todo.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex gap-2 items-center mb-2">
                          <span 
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              todo.priority === 'High' 
                                ? 'bg-red-900 bg-opacity-30 text-red-500' 
                                : todo.priority === 'Medium' 
                                  ? 'bg-yellow-900 bg-opacity-30 text-yellow-500'
                                  : 'bg-blue-900 bg-opacity-30 text-blue-500'
                            }`}
                          >
                            {todo.priority}
                          </span>
                          <span 
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              todo.status === 'Completed' 
                                ? 'bg-green-900 bg-opacity-30 text-green-500' 
                                : todo.status === 'In Progress' 
                                  ? 'bg-yellow-900 bg-opacity-30 text-yellow-500'
                                  : 'bg-gray-900 bg-opacity-30 text-gray-400'
                            }`}
                          >
                            {todo.status}
                          </span>
                        </div>
                        <span className="text-xs theme-text-secondary">
                          Due: {new Date(todo.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="px-6 py-3 bg-gray-800 bg-opacity-50 border-t theme-border-primary flex justify-end gap-2">
                      {todo.status !== 'Completed' && (
                        <>
                          {todo.status === 'Pending' && (
                            <button
                              onClick={() => updateTodoStatus(todo.id, 'In Progress')}
                              className="px-3 py-1.5 text-sm rounded-lg theme-bg-quaternary theme-text-primary hover:opacity-80 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => updateTodoStatus(todo.id, 'Completed')}
                            className={`px-3 py-1.5 text-sm rounded-lg text-white ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} transition-colors`}
                          >
                            Complete
                          </button>
                        </>
                      )}
                      {todo.status === 'Completed' && (
                        <button
                          onClick={() => updateTodoStatus(todo.id, 'Pending')}
                          className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 theme-text-secondary hover:theme-text-primary transition-colors"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="theme-bg-tertiary rounded-xl shadow p-8 text-center">
                  <ClipboardList className={`h-10 w-10 mx-auto mb-3 ${darkMode ? 'text-amber-500/70' : 'text-blue-500/70'}`} />
                  <h3 className="text-xl font-bold theme-text-primary mb-2">No Tasks Found</h3>
                  <p className="theme-text-secondary">
                    {filterStatus === 'all' 
                      ? "You have no tasks in your to-do list yet."
                      : `You have no ${filterStatus.replace('inprogress', 'in progress')} tasks at the moment.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="flex flex-col h-[calc(100vh-320px)]">
              <div className="theme-bg-tertiary rounded-xl shadow-lg border theme-border-primary overflow-hidden flex-1 flex flex-col">
                <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-gray-750 to-gray-800 border-b theme-border-primary">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="text-lg font-medium theme-text-primary">Team Messages</h3>
                  </div>
                </div>
                
                {/* Messages container */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`p-4 rounded-lg theme-bg-secondary border theme-border-primary ${!message.read ? 'ring-2 ring-amber-500 ring-opacity-50' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium theme-text-primary">{message.sender}</div>
                            <div className="text-xs theme-text-secondary">
                              {new Date(message.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <p className="theme-text-secondary">{message.content}</p>
                          
                          {/* Display attachments if any */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="font-medium text-sm theme-text-secondary">Attachments:</div>
                              <div className="space-y-2">
                                {message.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center p-2 rounded-lg theme-bg-tertiary">
                                    <div className={`p-2 rounded-md theme-bg-quaternary ${darkMode ? 'text-amber-500' : 'text-blue-500'}`}>
                                      {attachment.type.startsWith('image/') 
                                        ? <Image className="h-5 w-5" />
                                        : attachment.type.includes('pdf')
                                          ? <FileText className="h-5 w-5" />
                                          : <File className="h-5 w-5" />
                                      }
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                      <div className="truncate theme-text-primary text-sm font-medium">{attachment.name}</div>
                                      <div className="text-xs theme-text-secondary">{formatFileSize(attachment.size)}</div>
                                    </div>
                                    <a 
                                      href={attachment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`p-2 rounded-md theme-bg-quaternary ${darkMode ? 'text-amber-500' : 'text-blue-500'} hover:opacity-80`}
                                      download={attachment.name}
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 theme-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="theme-text-secondary text-center">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                </div>
                
                {/* Selected attachments preview */}
                {attachments.length > 0 && (
                  <div className="p-3 border-t theme-border-primary bg-gray-800 bg-opacity-40">
                    <div className="text-xs theme-text-secondary mb-2">Attachments:</div>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center p-1.5 rounded-lg bg-gray-700 text-sm">
                          {getFileIcon(file.type)}
                          <span className="mx-2 max-w-[150px] truncate">{file.name}</span>
                          <button 
                            onClick={() => removeAttachment(index)}
                            className="p-1 hover:bg-gray-600 rounded-full"
                          >
                            <X className="h-3 w-3 text-gray-300" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Message input */}
                <div className="p-4 border-t theme-border-primary">
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 theme-bg-quaternary theme-text-primary theme-border-primary border rounded-lg px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    
                    {/* File attachment button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 theme-bg-quaternary theme-text-primary rounded-lg mr-2 hover:opacity-80"
                      disabled={isUploading}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    
                    {/* Hidden file input */}
                    <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                      multiple
                    />
                    
                    <button
                      onClick={sendMessage}
                      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white'} font-medium`}
                      disabled={(!newMessage.trim() && attachments.length === 0) || isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 