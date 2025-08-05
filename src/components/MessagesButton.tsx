import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MessagesButton() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Check for unread messages
  useEffect(() => {
    const checkUnreadMessages = () => {
      try {
        const storedMessages = localStorage.getItem('messages');
        if (storedMessages) {
          const messages = JSON.parse(storedMessages);
          const unread = messages.filter((msg: any) => !msg.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Error checking unread messages:", error);
      }
    };
    
    // Check on initial load
    checkUnreadMessages();
    
    // Set up interval to check periodically
    const interval = setInterval(checkUnreadMessages, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <button 
      onClick={() => router.push('/messages')}
      className="relative flex items-center justify-center p-2 rounded-full hover:bg-cyan-100 transition-colors"
      aria-label="Messages"
    >
      <MessageCircle className="h-8 w-8 text-cyan-500" strokeWidth={2.5} />
      
      {/* Badge for unread messages */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </button>
  );
} 