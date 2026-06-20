import { useRef } from 'react';
import toast from 'react-hot-toast';

const MessageInput = ({ 
  message, 
  handleTyping, 
  handleSendMessage, 
  selectedChat, 
  mediaPreview, 
  setMediaPreview, 
  setMedia 
}) => {
  const fileInputRef = useRef(null);

  // --- Media Handlers ---
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file");
      return;
    }

    setMedia(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
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
  );
};

export default MessageInput;