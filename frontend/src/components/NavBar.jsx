import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const NavBar = () => {
  const { auth, setAuth, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogOut = async () => {
    try {
      const res = await api.post("/auth/logout");
      if (res.data.success) {
        setAuth(null);
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <nav className="bg-sky-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white font-bold text-lg">
          BluePeak Bank
        </Link>

        {auth?.accessToken ? (
          <div className="flex items-center gap-4">
            {/* Menu links visible only when logged in */}
            <Link to="/accounts" className="hover:text-gray-200">Accounts</Link>
            <Link to="/transactions" className="hover:text-gray-200">Transactions</Link>
            <Link to="/transfer" className="hover:text-gray-200">Transfer</Link>
            <Link to="/profile" className="hover:text-gray-200">Profile</Link>

            <span>Hi, {auth.name}</span>
            <button
              onClick={handleLogOut}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-gray-200">Login</Link>
            <Link to="/signup" className="hover:text-gray-200">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;