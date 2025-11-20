import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.svg";

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
      <div className="container mx-auto flex items-center">
        {/* Left: Brand */}
        <img
          className="rounded-full h-8 w-auto mr-4"
          src={logo}
          alt="Bluepeak bank logo"
        />
        <div className="flex-none">
          <Link to="/" className="text-white font-bold text-lg">
            BluePeak Bank
          </Link>
        </div>

        {/* Center: navigation links */}
        <div className="flex-1 flex justify-center">
          {auth?.accessToken ? (
            <div className="flex items-center gap-4">
              <Link to="/accounts" className="hover:text-gray-200 flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7h16v10H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Accounts
              </Link>
              <Link to="/transactions" className="hover:text-gray-200 flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Transactions
              </Link>
              <Link to="/transfer" className="hover:text-gray-200 flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 17H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 3l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 21l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Transfer
              </Link>
              <Link to="/profile" className="hover:text-gray-200 flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Profile
              </Link>
            </div>
          ) : null}
        </div>

        {/* Right: auth actions*/}
        <div className="flex-none">
          {auth?.accessToken ? (
            <div className="flex items-center gap-4">
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
      </div>
    </nav>
  );
};

export default NavBar;