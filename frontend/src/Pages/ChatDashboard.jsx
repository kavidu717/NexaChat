import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import API from "../utils/axios.js";
import CryptoJS from "crypto-js";
import  io  from "socket.io-client";
import Profile from "../components/Profile.jsx";


 const SECRET_KEY = "nexachat_super_secret_key";

const ChatDashboard = () => {
  const navigate = useNavigate();

  // Get user details and logout function from store
  const authUser = useAuthStore((state) => state.authUser);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // States for screen updates
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null); // null means no friend is selected

   const [contacts, setContacts]= useState([]);
   const [searchResults, setSearchResult]= useState([]);

   const [messages,setMessages]= useState([]);
   const [socket, setSocket]= useState(null)
   const [unreadCounts, setUnreadCounts] = useState({});

   const [isTyping, setIsTyping]= useState(false);
   const [typingTimeout, setTypingTimeout]= useState(null);

   const [isProfileOpen, setIsProfileOpen] = useState(false);
    
   const chatContainerRef = useRef(null);
   
   const selectedChatRef = useRef(selectedChat);

     useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

   useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }

  }, [messages]);
    
   const config={
    headers: {
      Authorization: `Bearer ${token}
      `
    }
  }

    const fetchContacts=async()=>{
      try{

        const response= await API.get("/users/contacts",config)
        setContacts(response.data.contacts)

      }catch(error){
         console.error("Failed to load contacts", error);
      }
    }

     useEffect(() => {
        if(token){
          fetchContacts();
        }
     }, [token])

     useEffect(()=>{
        
      const fetchUnreadCounts = async () => {
      try {
        const response = await API.get("/messages/unread", config);
        setUnreadCounts(response.data);
      } catch (error) {
        console.error("Failed to load unread counts", error);
      }
    };

    if (token) {
      fetchUnreadCounts();
    }

     },[token])


      useEffect(() => {
  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const response = await API.get(
        `/messages/${selectedChat._id}`,
        config
      );

      console.log("Messages from Database:", response.data);

      // Decrypt messages received from the database
      const decryptedMessages = response.data.messages.map((msg) => {
        try {
          const bytes = CryptoJS.AES.decrypt(
            msg.encryptedText,
            SECRET_KEY
          );

          const originalText = bytes.toString(CryptoJS.enc.Utf8);

          return { ...msg, text: originalText };
        } catch (err) {
          console.log(err)
          // Display a fallback message if decryption fails
          return {
            ...msg,
            text: " This message is securely encrypted.",
          };
        }
      });

      setMessages(decryptedMessages);
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  fetchMessages();

  // Run when the selected chat changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedChat]);

  
    // --- 1. Connect to the Socket Server ---
useEffect(() => {
  if (authUser) {
    // Connect to the backend server and send the user ID
    const newSocket = io("http://localhost:5000", {
      query: {
        userId: authUser._id,
      },
    });

    setSocket(newSocket);

    // Close the socket connection when the component unmounts
    return () => newSocket.close();
  }
}, [authUser]);

// --- 2. Listen for Real-Time Messages ---


  useEffect(() => {
    if (!socket) return;

    // Handle receiving a new message
    const handleNewMessage = (newMessage) => {
      if (selectedChat && newMessage.senderId === selectedChat._id) {
        try {
          const bytes = CryptoJS.AES.decrypt(
            newMessage.encryptedText,
            SECRET_KEY
          );
          newMessage.text = bytes.toString(CryptoJS.enc.Utf8);
        } catch (err) {
          console.log(err);
          newMessage.text = "This message is securely encrypted.";
        }

        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    };

    // Handle when the user starts typing
    const handleUserTyping = (data) => {
       const currentChatId = selectedChatRef.current?._id; 
      
      console.log("Checking IDs:", data.senderId, "vs", currentChatId); 
      
      if (currentChatId && data.senderId === currentChatId) {
        setIsTyping(true);
      }
    };

    // Handle when the user stops typing
    const handleUserStopTyping = (data) => {
      if (selectedChat && data.senderId === selectedChat._id) {
        setIsTyping(false);
      }
    };

    // Attach all socket listeners
    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleUserTyping);
    socket.on("stopTyping", handleUserStopTyping);

    // Clean up listeners when component unmounts or dependencies change
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleUserTyping);
      socket.off("stopTyping", handleUserStopTyping);
    };

  }, [socket, selectedChat]);


    
     const handleSearch = async (e) => {
       const query = e.target.value;
       setSearchQuery(query);
       if(!query.trim()){
         setSearchResult([])
         return
       }

       try {
         const response = await API.get(`/users/search?search=${query}`,config);
         setSearchResult(response.data.users);
       } catch (error) {
         console.error("Failed to search users", error);
       }

     }

     const handleAddContact=async(userId)=>{

       try {
         const response = await API.post(`/users/add-contact`,{contactId:userId},config);
         if(response.data.success){
          toast.success(response.data.message)
          setSearchQuery("")
          setSearchResult([])
          fetchContacts()
         }
         
       
     }catch (error) {
         console.error("Failed to add contact", error);
       }
     }
    
     const handleSelectChat=async(contact)=>{
         setSelectedChat(contact)
         setUnreadCounts((prev) => ({ ...prev, [contact._id]: 0 }));

         try{
            await API.put(`/messages/mark-read/${contact._id}`, {}, config);
         }catch(error){
           console.error("Failed to mark messages as read", error);
         }
     }


  // Function to logout
  const handleLogout = () => {
    logout(); // Clear saved user data
    toast.success("Logged out successfully!"); // Show popup message
    navigate("/login"); // Go to login page
  };

  const handleTyping = (e) => {

    setMessage(e.target.value)
       if (!selectedChat || !socket) return;
       
       socket.emit("typing", {
         senderId: authUser._id,
         receiverId: selectedChat._id,
       });

       if(typingTimeout) clearTimeout(typingTimeout)

        const timeout = setTimeout(() => {
             socket.emit("stopTyping", {
              senderId: authUser._id,
              receiverId: selectedChat._id,
             });
        },2000)

        setTypingTimeout(timeout)
    
  }

  // Function to send a message (backend connection coming later)
  const handleSendMessage =async (e) => {
    e.preventDefault();
    if (!message.trim()) return; 
    try{
       // encrypt the message
      const encryptedText = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();

      const response = await API.post(
        `/messages/send/${selectedChat._id}`,
        { encryptedText },
        config
      );

      if (response.data.success) {
        const newMsg=response.data.message
         newMsg.text=message

         setMessages([...messages, newMsg]);

            setMessage(""); // Clear typing area
      }
          
    
    }catch(error){
        console.error("Failed to send message", error);
      toast.error("Failed to send message");
    }
    
   
  };

  return (
     <div className="flex h-screen w-full bg-gray-950 relative overflow-hidden">
      
  {/* LEFT SIDE: Profile and Contacts */}
  {/* Hidden on mobile if a chat is selected, always visible on desktop */}
  <div className={`h-full border-r border-gray-800 flex-col z-10 bg-gray-950/80 backdrop-blur-xl w-full md:w-1/3 lg:w-1/4 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
    
    {/* Header: App Name and Greeting */}
    <div className="p-4 border-b border-gray-800">
      <h2 className="text-2xl font-extrabold text-orange-500">
        NexaChat
      </h2>

          
      
      <p className="text-sm text-gray-400 mt-1">
        Hello, <span className="font-semibold text-gray-200">{authUser?.firstName || "User"}</span>!
      </p> 
      <button 
        onClick={() => setIsProfileOpen(true)}
        className="mt-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg transition-all"
      >
        View My Profile
      </button>

      {isProfileOpen && (
    <Profile 
      authUser={authUser} 
      onClose={() => setIsProfileOpen(false)} 
    />
  )}
      
      {/* User Search Input */}
      <input 
        type="text" 
        placeholder="Search users..." 
        value={searchQuery}
        onChange={handleSearch}
        className="w-full mt-4 px-4 py-2.5 bg-gray-950/50 border border-gray-800 text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-500"
      />
    </div>

    {/* Middle Section: Contacts and Search Results */}
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      
      {/* Search Results List */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold text-orange-500/70 uppercase mb-3 tracking-wider">Search Results</h4>
          <div className="flex flex-col gap-2">
            {searchResults.map((user) => (
              <div key={user._id} className="flex justify-between items-center p-3 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-orange-500/30 transition-all">
                <div>
                  <p className="text-sm font-semibold text-gray-200">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
                {/* Add Contact Button */}
                <button 
                  onClick={() => handleAddContact(user._id)}
                  className="text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-all font-medium"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Contacts List */}
      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">My Contacts</h4>
      
      {contacts.length === 0 ? (
        <p className="text-gray-500 text-center mt-5 text-sm font-medium">
          No contacts yet. Search above to add friends!
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((contact, index) => (
            <div
              key={`${contact._id}-${index}`}
              onClick={() => handleSelectChat(contact)}
              className={`p-3 rounded-xl cursor-pointer transition-all border flex justify-between items-center ${
                selectedChat?._id === contact._id
                  ? "bg-gray-800/80 border-orange-500/50"
                  : "bg-gray-900/30 border-transparent hover:bg-gray-800/50 hover:border-gray-700"
              }`}
            >
              <div>
                <p className="font-semibold text-gray-200">
                  {contact.firstName} {contact.lastName}
                </p>
                <p className="text-xs text-gray-400">@{contact.username}</p>
              </div>

              {/* Unread Messages Badge */}
              {unreadCounts[contact._id] > 0 && (
                <div className="bg-orange-500 text-gray-50 text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full">
                  {unreadCounts[contact._id]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Footer: Logout Button */}
    <div className="p-4 border-t border-gray-800">
      <button 
        onClick={handleLogout}
        className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-2.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
      >
        Logout
      </button>
    </div>
  </div>

  {/* RIGHT SIDE: Chat Interface */}
  {/* Hidden on mobile if no chat is selected, always visible on desktop */}
  <div className={`h-full flex-col relative z-10 bg-gray-900/60 backdrop-blur-lg flex-1 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
    
    {/* Chat Header: Contact Name and Mobile Back Button */}
    <div className="p-4 border-b border-gray-800 flex items-center gap-4 h-[97px] bg-gray-950/40">
      
      {/* Mobile Back Button (Visible only on small screens) */}
      {selectedChat && (
        <button 
          onClick={() => setSelectedChat(null)}
          className="md:hidden p-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl hover:bg-gray-700 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      <h3 className="text-lg font-bold text-gray-200">
        {selectedChat ? `${selectedChat.firstName} ${selectedChat.lastName}` : "Select a chat"}
      </h3>
        
        {isTyping && (
          <span className="text-xs text-orange-400 font-medium animate-pulse mt-0.5">
            typing...
          </span>
        )}


    </div>

    {/* Messages Container */}
    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
      
      {/* Placeholder when no chat is selected */}
      {!selectedChat ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-orange-400/80 bg-orange-950/30 border border-orange-500/20 px-6 py-2.5 rounded-full text-sm font-medium text-center max-w-[80%]">
            Welcome to NexaChat! Select a user to start chatting.
          </p>
        </div>
      ) : messages.length === 0 ? (
        
        /* Placeholder for an empty chat */
        <div className="flex flex-col gap-3 h-full justify-center">
          <p className="text-center text-sm text-gray-500">No messages yet. Say hi to {selectedChat.firstName}!</p>
        </div>
      ) : (
        
        /* Render Chat Messages */
        messages.map((msg, index) => {
          const isMe = msg.senderId === authUser?._id;
          return (
            <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div 
                className={`px-4 py-2.5 max-w-[85%] md:max-w-[70%] rounded-2xl shadow-sm text-sm break-words ${
                  isMe 
                    ? "bg-orange-600 text-gray-50 rounded-br-none" 
                    : "bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })
      )}
    </div>

    {/* Chat Footer: Message Input Area */}
    <div className="p-3 md:p-4 border-t border-gray-800 bg-gray-950/60">
      <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 relative max-w-5xl mx-auto w-full">
        
        {/* Input Field */}
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={message}
          onChange={handleTyping}
          disabled={!selectedChat} 
          className="flex-1 px-4 py-3 md:px-5 md:py-3.5 bg-gray-900/80 border border-gray-800 text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
        />
        
        {/* Send Button */}
        <button 
          type="submit"
          disabled={!selectedChat || !message.trim()} 
          className="bg-orange-600 text-gray-50 px-4 md:px-8 py-3 md:py-3.5 rounded-xl font-bold hover:bg-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
        >
          <span className="hidden md:inline">Send</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </button>
        
      </form>
    </div>
  </div>

</div>
  );
};

export default ChatDashboard;