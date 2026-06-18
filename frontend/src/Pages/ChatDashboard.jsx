import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import API from "../utils/axios.js";


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



  // Function to logout
  const handleLogout = () => {
    logout(); // Clear saved user data
    toast.success("Logged out successfully!"); // Show popup message
    navigate("/login"); // Go to login page
  };

  // Function to send a message (backend connection coming later)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return; // Stop if message is empty

    // TODO: Send message to backend here
    console.log("Sending message:", message);
    
    setMessage(""); // Clear typing area
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
              {contacts.map((contact) => (
                <div 
                  key={contact._id} 
                  onClick={() => setSelectedChat(contact)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedChat?._id === contact._id 
                      ? "bg-slate-800/80 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                      : "bg-slate-900/30 border-transparent hover:bg-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <p className="font-semibold text-slate-200">{contact.firstName} {contact.lastName}</p>
                  <p className="text-xs text-slate-400">@{contact.username}</p>
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

        {/* Middle part: Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedChat ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-emerald-400/80 bg-emerald-950/30 border border-emerald-500/20 px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.05)] text-sm font-medium">
                Welcome to NexaChat! Select a user from the left to start chatting.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-center text-xs text-slate-500 my-2">Start sending messages to {selectedChat.firstName}</p>
            </div>
          )}
        </div>

        {/* Bottom part: Type message here */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <form onSubmit={handleSendMessage} className="flex gap-3 relative max-w-5xl mx-auto w-full">
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!selectedChat} 
              className="flex-1 px-5 py-3.5 bg-slate-900/80 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
            />
            <button 
              type="submit"
              disabled={!selectedChat || !message.trim()} 
              className="bg-emerald-600 text-slate-50 px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed" 
            >
              Send
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default ChatDashboard;