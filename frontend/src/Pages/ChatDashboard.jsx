import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import API from "../utils/axios.js";
import CryptoJS from "crypto-js";
import  io  from "socket.io-client";

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
        newMessage.text = " This message is securely encrypted.";
      }

      setMessages((prevMessages) => [...prevMessages, newMessage]);
    } else {
      setUnreadCounts((prev) => ({
        ...prev,
        [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
      }));
    }
  };

  socket.on("newMessage", handleNewMessage);

  return () => socket.off("newMessage", handleNewMessage);

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
   <div className="flex h-screen w-full bg-slate-950 relative overflow-hidden">
      
      {/* Ambient Glows for the background */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* LEFT SIDE: Profile and Contacts */}
      <div className="w-1/3 md:w-1/4 h-full border-r border-slate-800 flex flex-col z-10 bg-slate-950/80 backdrop-blur-xl">
        
        {/* Top part: Name and Search */}
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-2xl font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
            NexaChat
          </h2>
          
          <p className="text-sm text-slate-400 mt-1">
            Hello, <span className="font-semibold text-slate-200">{authUser?.firstName || "User"}</span>!
          </p> 
          
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={handleSearch}
            className="w-full mt-4 px-4 py-2.5 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-500 shadow-inner"
          />
        </div>

        {/* Middle part: Contacts & Search Results */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {/* --- Search Results Area --- */}
          {searchResults.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-emerald-500/70 uppercase mb-3 tracking-wider">Search Results</h4>
              <div className="flex flex-col gap-2">
                {searchResults.map((user) => (
                  <div key={user._id} className="flex justify-between items-center p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-all">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500">@{user.username}</p>
                    </div>
                    <button 
                      onClick={() => handleAddContact(user._id)}
                      className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all font-medium"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- Contacts Area --- */}
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">My Contacts</h4>
          
          {contacts.length === 0 ? (
            <p className="text-slate-500 text-center mt-5 text-sm font-medium">
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
          ? "bg-slate-800/80 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
          : "bg-slate-900/30 border-transparent hover:bg-slate-800/50 hover:border-slate-700"
      }`}
    >
      <div>
        <p className="font-semibold text-slate-200">
          {contact.firstName} {contact.lastName}
        </p>
        <p className="text-xs text-slate-400">@{contact.username}</p>
      </div>

      {unreadCounts[contact._id] > 0 && (
        <div className="bg-emerald-500 text-slate-50 text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]">
          {unreadCounts[contact._id]}
        </div>
      )}
    </div>
  ))}
</div>
          )}
        </div>

        {/* Bottom part: Logout */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-2.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Chat box */}
      <div className="flex-1 h-full flex flex-col relative z-10 bg-slate-900/60 backdrop-blur-lg">
        
        {/* Top part: Friend's name */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between h-[97px] bg-slate-950/40">
          <h3 className="text-lg font-bold text-slate-200">
            {selectedChat ? `${selectedChat.firstName} ${selectedChat.lastName}` : "Select a chat"}
          </h3>
        </div>

       
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
          {!selectedChat ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-emerald-400/80 bg-emerald-950/30 border border-emerald-500/20 px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.05)] text-sm font-medium">
                Welcome to NexaChat! Select a user from the left to start chatting.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col gap-3 h-full justify-center">
              <p className="text-center text-sm text-slate-500">No messages yet. Say hi to {selectedChat.firstName}!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
            
              const isMe = msg.senderId === authUser?._id;
              
              return (
                <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div 
                    className={`px-4 py-2.5 max-w-[70%] rounded-2xl shadow-sm text-sm ${
                      isMe 
                        ? "bg-emerald-600 text-slate-50 rounded-br-none" 
                        : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom part: Type message here */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <form onSubmit={handleSendMessage} className="flex gap-3 relative max-w-5xl mx-auto w-full">
            <input 
              type="text" 
              placeholder="Type an encrypted message..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!selectedChat} 
              className="flex-1 px-5 py-3.5 bg-slate-900/80 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
            />
            <button 
              type="submit"
              disabled={!selectedChat || !message.trim()} 
              className="bg-emerald-600 text-slate-50 px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2" 
            >
              <span>Send</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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