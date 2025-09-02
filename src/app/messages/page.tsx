"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Home, Paperclip, X, File, Image, FileText, Download, MessageCircle } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";
import { storage } from "@/lib/firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

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

export default function MessagesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const auth = useAuth();
  const { user, loading, signOut } = auth || {};
  const router = useRouter();
  const { darkMode } = useTheme();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark all messages as read
  useEffect(() => {
    if (messages.some(m => !m.read)) {
      const updatedMessages = messages.map(message => ({
        ...message,
        read: true
      }));
      setMessages(updatedMessages);
      localStorage.setItem('messages', JSON.stringify(updatedMessages));
    }
  }, [messages]);

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
        read: true, // We're already in the messages view, so mark as read
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
                        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'}`}></div>
      </div>
    );
  }

  // If user is not authenticated and not loading, redirect will happen
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen theme-bg-primary">
      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode}
        signOut={signOut}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto theme-bg-secondary">
        {/* Header */}
        <header className="standard-header">
          <div className="standard-header-content">
            <div className="flex items-center mb-4">
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
                <div className="header-logo-center">
                  <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages Content */}
        <div className="p-6">
          <div className="flex flex-col h-[calc(100vh-220px)]">
            <div className="theme-bg-tertiary rounded-xl shadow-lg border theme-border-primary overflow-hidden flex-1 flex flex-col">
              <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-gray-750 to-gray-800 border-b theme-border-primary">
                <div className="flex items-center gap-2">
                  <MessageCircle className={`h-5 w-5 ${darkMode ? 'text-cyan-500' : 'text-cyan-500'}`} />
                  <h3 className="text-lg font-medium theme-text-primary">Team Messages</h3>
                </div>
                <div className="text-sm theme-text-secondary">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </div>
              </div>
              
              {/* Messages container */}
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`p-4 rounded-lg theme-bg-secondary border theme-border-primary ${
                          message.senderId === user.uid 
                            ? 'ml-auto max-w-[80%]' 
                            : 'mr-auto max-w-[80%]'
                        }`}
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
                                  <div className={`p-2 rounded-md theme-bg-quaternary ${darkMode ? 'text-cyan-500' : 'text-cyan-500'}`}>
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
                                    className={`p-2 rounded-md theme-bg-quaternary ${darkMode ? 'text-cyan-500' : 'text-cyan-500'} hover:opacity-80`}
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
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <MessageCircle className="h-12 w-12 theme-text-secondary mb-4" />
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
                    className="flex-1 theme-bg-quaternary theme-text-primary theme-border-primary border rounded-lg px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-cyan-500 text-gray-900' : 'bg-cyan-500 text-white'} font-medium`}
                    disabled={(!newMessage.trim() && attachments.length === 0) || isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 