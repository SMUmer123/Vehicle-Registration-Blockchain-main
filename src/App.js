import "./App.css";
import UserRegistration from "./Components/UserRegistration/UserRegistration";
import Home from "./Components/Home";
import UserLogin from "./Components/UserLogin/UserLogin";
import Presentation from "./Components/Presentation";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import GovtView from "./Components/Govt/GovtView";
import VehicleRegistration from "./Components/VehicleRegistration";
import Transfer from "./Components/Transfer";
import LandingPage from "./Components/LandingPage";
import VehicleVerificationPage from "./Components/VehicleVerificationPage";
import GovtSignIn from "./Components/Govt/GovtSignIn";

const isUserLoggedIn = () => {
  return !!window.localStorage.getItem("email");
};

const routerDefinition = createRoutesFromElements(
  <Route>
     <Route path="/" element={<LandingPage />} />
    <Route path="/home" element={isUserLoggedIn() ? <Home /> : <UserLogin />} />
    <Route path="/new" element={<VehicleRegistration />} />
     <Route path="/onlineVerification" element={<VehicleVerificationPage/>} />
    <Route path="/login" element={<UserLogin />} />
    <Route path="/register" element={<UserRegistration />} />
    <Route path="/govtLogin" element={<GovtSignIn/>}/>
    <Route path="/govtDashboard" element={<GovtView />} />
    <Route path="/transfer" element={<Transfer />} />
    <Route path="/presentation" element={<Presentation />} />
    
  </Route>
);

const router = createBrowserRouter(routerDefinition);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
