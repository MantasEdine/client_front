import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard.jsx"
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoutes from "./auth/ProtectedRoutes";
import Navbar from "./components/NavBar.jsx";
import Products from "./pages/Products.jsx";
import Laboratoires from "./pages/Laboratoire.jsx";
import Fournisseurs from "./pages/Fournisseurs.jsx";
import Remises from "./pages/BestOffers.jsx";
import Profile from "./pages/Profile.jsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page de connexion */}
        <Route path="/" element={<Login />} />

        {/* Zone protégée avec la barre de navigation */}
        <Route
          element={
            <>
              <Navbar />
              <ProtectedRoutes />
            </>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/produits" element={<Products />} />
          <Route path="/laboratoire" element={<Laboratoires />} />
          <Route path="/fournisseur" element={<Fournisseurs />} />
          <Route path="/remises" element={<Remises />} />
          <Route path="/profile" element={<Profile />} />




        

          
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
