import { Toaster } from "react-hot-toast";
import { Signin } from "./pages/Signin";
import { Signup } from "./pages/Signup";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { ProtectedRoutes } from "./utils/ProtectedRoutes";
import { VerifyOTP } from "./pages/VerifyOTP";
import { ThemeProvider } from "./context/ThemeContext";
import { SpeedInsights } from '@vercel/speed-insights/react'

import DashboardV2 from "./pages/DashboardV2";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  // const dispatch=useDispatch<AppDispatch>();
  // useEffect(()=>{
  //   dispatch(fetchCurrentUser());

  // },[dispatch])
  return <ThemeProvider><BrowserRouter>
    <Routes>
      <Route path="/signup" element={<Signup/>} />
      <Route path="/signin" element={<Signin/>} />
      <Route path="/verify-otp" element={<VerifyOTP/>} />
      
      <Route element={<ProtectedRoutes/>}>
        <Route path="/" element={<Navigate to="/dashboard" replace/>} /> 
        <Route path="/admin/dashboard" element={<AdminDashboard/>} /> 
        <Route path="/dashboard" element={<DashboardV2/>} /> 
        {/* <Route path="/dashboardV2" element={<DashboardV2/>} />  */}
        
     </Route>
     {/*FALLBACK*/}
     <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
    <Toaster position="top-right"/>
  </BrowserRouter>
  <SpeedInsights/>
  </ThemeProvider>
}

export default App
