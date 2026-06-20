// components/Sidebar.jsx


const Sidebar = ({
  selectedChat,
  authUser,
  setIsProfileOpen,
  searchQuery,
  handleSearch,
  searchResults,
  handleAddContact,
  contacts,
  handleSelectChat,
  unreadCounts,
  handleLogout
}) => {
  return (
    <div className={`h-full border-r border-gray-800 flex-col z-10 bg-gray-950/80 backdrop-blur-xl w-full md:w-1/3 lg:w-1/4 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
      
      {/* Header: App Name and Greeting */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-2xl font-extrabold text-orange-500">NexaChat</h2>
        <p className="text-sm text-gray-400 mt-1">
          Hello, <span className="font-semibold text-gray-200">{authUser?.firstName || "User"}</span>!
        </p> 
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="mt-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg transition-all"
        >
          View My Profile
        </button>

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
  );
};

export default Sidebar;