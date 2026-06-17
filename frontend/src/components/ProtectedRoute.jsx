import {Outlet} from "react-router-dom";
import useAuthStore from "../store/useAuthStore.js";
import { Navigate } from "react-router-dom";


const ProtectedRoute =()=>{

    const authUser=useAuthStore((state)=>state.authUser);
    return authUser ? <Outlet /> : <Navigate to="/login" />;
}

export default ProtectedRoute