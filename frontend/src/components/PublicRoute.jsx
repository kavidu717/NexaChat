import {Navigate,Outlet} from "react-router-dom";
import {useAuthStore} from "../store/useAuthStore.js";

const PublicRoute=()=>{

    const authUser=useAuthStore((state)=>state.authUser);

    return !authUser ? <Outlet /> : <Navigate to="/" />;
    
}

export default PublicRoute