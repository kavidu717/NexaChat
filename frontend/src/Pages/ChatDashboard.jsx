import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import API from "../utils/axios.js";
import CryptoJS from "crypto-js";
import io from "socket.io-client";

import Profile from "../components/Profile";
import Sidebar from "../components/Sidebar";
import MessageInput from "../components/MessageInput";

const SECRET_KEY = "nexachat_super_secret_key";

const ChatDashboard = () => {
  const navigate = useNavigate();

  const authUser = useAuthStore((state) => state.authUser);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

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

  const chatContainerRef = useRef(null);
  const selectedChatRef = useRef(selectedChat);

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  useEffect(() => {
    if (authUser) {
      const newSocket = io("http://localhost:5000", {
        query: { userId: authUser._id },
      });
      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [authUser]);

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

  const handleSelectChat = async (contact) => {
    setSelectedChat(contact);
    setUnreadCounts((prev) => ({ ...prev, [contact._id]: 0 }));
    try {
      await API.put(`/messages/mark-read/${contact._id}`, {}, config);
    } catch (error) {
      console.error("Failed to mark messages as read", error);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !media) return; 

    try {
      const formData = new FormData();
      
      if (message.trim()) {
        const encryptedText = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
        formData.append("encryptedText", encryptedText);
      }
      
      if (media) {
        formData.append("media", media); 
      }

      const uploadConfig = {
        headers: {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        }
      };

      const response = await API.post(
        `/messages/send/${selectedChat._id}`,
        formData,
        uploadConfig
      );

      if (response.data.success) {
        const newMsg = response.data.message;
        newMsg.text = message; 

        setMessages([...messages, newMsg]);
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

      {isProfileOpen && (
        <Profile authUser={authUser} onClose={() => setIsProfileOpen(false)} />
      )}

      <div className={`h-full flex-col relative z-10 bg-gray-900/60 backdrop-blur-lg flex-1 ${!selectedChat ? "hidden md:flex" : "flex"}`}>
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
                    {msg.mediaUrl && (
                      msg.messageType === 'video' ? (
                        <video src={msg.mediaUrl} controls className="max-w-full rounded-lg" style={{ maxHeight: '250px' }} />
                      ) : (
                        <img src={msg.mediaUrl} alt="attachment" className="max-w-full rounded-lg object-cover" style={{ maxHeight: '250px' }} />
                      )
                    )}
                    
                    {msg.text && <span>{msg.text}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <MessageInput
          message={message}
          handleTyping={handleTyping}
          handleSendMessage={handleSendMessage}
          selectedChat={selectedChat}
          mediaPreview={mediaPreview}
          setMediaPreview={setMediaPreview}
          setMedia={setMedia}
        />
      </div>
    </div>
  );
};

export default ChatDashboard;