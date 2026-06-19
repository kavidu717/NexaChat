const Profile = ({authUser,onClose}) => {
   if(!authUser) return null;
     return(
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 p-8  w-full max-w-sm text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-orange-500 mb-6">My Profile</h2>
        
        <div className="w-24 h-24 bg-orange-600/20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-orange-500 mb-4 border-2 border-orange-500/30">
          {authUser?.firstName?.charAt(0).toUpperCase()}
        </div>
        
        <div className="space-y-4 text-left">
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">First Name</label>
            <p className="text-gray-200 font-medium">{authUser.firstName}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Last Name</label>
            <p className="text-gray-200 font-medium">{authUser.lastName}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Username</label>
            <p className="text-gray-200 font-medium">@{authUser.username}</p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="mt-8 w-full bg-orange-600 text-white py-3  font-bold hover:bg-orange-500 transition-all"
        >
          Close
        </button>
      </div>
    </div>
     )
        
};


export default Profile