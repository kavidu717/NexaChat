import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import API from "../utils/axios.js";
import CryptoJS from "crypto-js";
import io from "socket.io-client";

// Components
import Profile from "../components/Profile";
import Sidebar from "../components/Sidebar";

const SECRET_KEY = "nexachat_super_secret_key";

const ChatDashboard = () => {
  const navigate = useNavigate();

  // Get user details and logout function from store
  const authUser = useAuthStore((state) => state.authUser);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResult] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  // Refs
  const chatContainerRef = useRef(null);
  const selectedChatRef = useRef(selectedChat);
  const fileInputRef = useRef(null);

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Keep ref updated with latest selected chat
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      const response = await API.get("/users/contacts", config);
      setContacts(response.data.contacts);
    } catch (error) {
      console.error("Failed to load contacts", error);
    }
  };

  useEffect(() => {
    if (token) fetchContacts();
    
  }, [token]);

  // Fetch unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const response = await API.get("/messages/unread", config);
        setUnreadCounts(response.data);
      } catch (error) {
        console.error("Failed to load unread counts", error);
      }
    };
    if (token) fetchUnreadCounts();
   
  }, [token]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        const response = await API.get(`/messages/${selectedChat._id}`, config);
        
        const decryptedMessages = response.data.messages.map((msg) => {
          try {
            const bytes = CryptoJS.AES.decrypt(msg.encryptedText, SECRET_KEY);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            return { ...msg, text: originalText };
          } catch (err) {
            console.log(err);
            return { ...msg, text: "This message is securely encrypted." };
          }
        });

        setMessages(decryptedMessages);
      } catch (error) {
        console.error("Failed to load messages", error);
      }
    };

    fetchMessages();
   
  }, [selectedChat]);

  // Connect to Socket
  useEffect(() => {
    if (authUser) {
      const newSocket = io("http://localhost:5000", {
        query: { userId: authUser._id },
      });
      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [authUser]);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (selectedChat && newMessage.senderId === selectedChat._id) {
        try {
          const bytes = CryptoJS.AES.decrypt(newMessage.encryptedText, SECRET_KEY);
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

    const handleUserTyping = (data) => {
      const currentChatId = selectedChatRef.current?._id;
      if (currentChatId && data.senderId === currentChatId) setIsTyping(true);
    };

    const handleUserStopTyping = (data) => {
      if (selectedChat && data.senderId === selectedChat._id) setIsTyping(false);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleUserTyping);
    socket.on("stopTyping", handleUserStopTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleUserTyping);
      socket.off("stopTyping", handleUserStopTyping);
    };
  }, [socket, selectedChat]);

  // Search Users
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResult([]);
      return;
    }
    try {
      const response = await API.get(`/users/search?search=${query}`, config);
      setSearchResult(response.data.users);
    } catch (error) {
      console.error("Failed to search users", error);
    }
  };

  // Add Contact
  const handleAddContact = async (userId) => {
    try {
      const response = await API.post(`/users/add-contact`, { contactId: userId }, config);
      if (response.data.success) {
        toast.success(response.data.message);
        setSearchQuery("");
        setSearchResult([]);
        fetchContacts();
      }
    } catch (error) {
      console.error("Failed to add contact", error);
    }
  };

  // Select Chat
  const handleSelectChat = async (contact) => {
    setSelectedChat(contact);
    setUnreadCounts((prev) => ({ ...prev, [contact._id]: 0 }));
    try {
      await API.put(`/messages/mark-read/${contact._id}`, {}, config);
    } catch (error) {
      console.error("Failed to mark messages as read", error);
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  // --- Media Handlers ---
const handleMediaChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type (only images and videos are allowed)
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    toast.error("Please select an image or video file");
    return;
  }

  // Save selected file to state
  setMedia(file);

  // Generate preview for the selected media
  const reader = new FileReader();
  reader.onloadend = () => {
    setMediaPreview(reader.result);
  };
  reader.readAsDataURL(file);
};

const removeMedia = () => {
  // Clear media and preview from state
  setMedia(null);
  setMediaPreview(null);

  // Reset file input value
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

  // Handle Typing Input and Socket Emission
  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!selectedChat || !socket) return;

    socket.emit("typing", {
      senderId: authUser._id,
      receiverId: selectedChat._id,
    });

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedChat._id,
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Send Message
  // Send message with optional media attachment
const handleSendMessage = async (e) => {
  e.preventDefault();

  // Prevent sending empty messages
  if (!message.trim() && !media) return;

  try {
    const formData = new FormData();

    // Encrypt and append text message if available
    if (message.trim()) {
      const encryptedText = CryptoJS.AES.encrypt(
        message,
        SECRET_KEY
      ).toString();

      formData.append("encryptedText", encryptedText);
    }

    // Append media file if selected
    if (media) {
      formData.append("media", media);
    }

    // Configure request headers for file upload
    const uploadConfig = {
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    };

    // Send message to the backend
    const response = await API.post(
      `/messages/send/${selectedChat._id}`,
      formData,
      uploadConfig
    );

    if (response.data.success) {
      const newMsg = response.data.message;

      // Display original message immediately in the UI
      newMsg.text = message;

      // Update message list
      setMessages([...messages, newMsg]);

      // Clear input fields after successful send
      setMessage("");
      setMedia(null);
      setMediaPreview(null);
    }
  } catch (error) {
    console.error("Failed to send message", error);
    toast.error("Failed to send message");
  }
};

  return (
   <div className="flex h-screen w-full bg-gray-950 relative overflow-hidden">
      
      {/* Sidebar Component */}
      <Sidebar
        selectedChat={selectedChat}
        authUser={authUser}
        setIsProfileOpen={setIsProfileOpen}
        searchQuery={searchQuery}
        handleSearch={handleSearch}
        searchResults={searchResults}
        handleAddContact={handleAddContact}
        contacts={contacts}
        handleSelectChat={handleSelectChat}
        unreadCounts={unreadCounts}
        handleLogout={handleLogout}
      />

      {/* Profile Modal */}
      {isProfileOpen && (
        <Profile authUser={authUser} onClose={() => setIsProfileOpen(false)} />
      )}

      {/* Chat Interface */}
      <div className={`h-full flex-col relative z-10 bg-gray-900/60 backdrop-blur-lg flex-1 ${!selectedChat ? "hidden md:flex" : "flex"}`}>
        
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-4 h-[97px] bg-gray-950/40">
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
          {!selectedChat ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-orange-400/80 bg-orange-950/30 border border-orange-500/20 px-6 py-2.5 rounded-full text-sm font-medium text-center max-w-[80%]">
                Welcome to NexaChat! Select a user to start chatting.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col gap-3 h-full justify-center">
              <p className="text-center text-sm text-gray-500">No messages yet. Say hi to {selectedChat.firstName}!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === authUser?._id;
              return (
                <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`px-4 py-2.5 max-w-[85%] md:max-w-[70%] rounded-2xl shadow-sm text-sm break-words flex flex-col gap-2 ${
                      isMe
                        ? "bg-orange-600 text-gray-50 rounded-br-none"
                        : "bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700"
                    }`}
                  >
                    {/* Media Display in Chat */}
                    {msg.mediaUrl && (
                      msg.messageType === 'video' ? (
                        <video src={msg.mediaUrl} controls className="max-w-full rounded-lg" style={{ maxHeight: '250px' }} />
                      ) : (
                        <img src={msg.mediaUrl} alt="attachment" className="max-w-full rounded-lg object-cover" style={{ maxHeight: '250px' }} />
                      )
                    )}
                    
                    {/* Text Message */}
                    {msg.text && <span>{msg.text}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat Footer: Message Input Area */}
        <div className="p-3 md:p-4 border-t border-gray-800 bg-gray-950/60 flex flex-col">
          
          {/* Media Preview Section */}
          {mediaPreview && (
            <div className="mb-4 relative inline-block p-2 bg-gray-900 rounded-xl border border-gray-800 self-start ml-auto mr-auto">
              {mediaPreview.startsWith("data:video") ? (
                <video src={mediaPreview} className="h-24 w-24 object-cover rounded-lg border border-gray-700" controls />
              ) : (
                <img src={mediaPreview} alt="Preview" className="h-24 w-24 object-cover rounded-lg border border-gray-700" />
              )}
              {/* Close Button */}
              <button
                onClick={removeMedia}
                className="absolute -top-2 -right-2 bg-gray-700 hover:bg-red-600 text-gray-200 rounded-full p-1 transition-colors"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 relative max-w-5xl mx-auto w-full items-center">
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              accept="image/*,video/*"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleMediaChange}
            />

            {/* Attachment Button */}
            <button
              type="button"
              disabled={!selectedChat}
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-50 p-2 bg-gray-900 rounded-xl border border-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
            </button>

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
              disabled={!selectedChat || (!message.trim() && !mediaPreview)} 
              className="bg-orange-600 text-gray-50 px-4 md:px-8 py-3 md:py-3.5 rounded-xl font-bold hover:bg-orange-500 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2" 
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