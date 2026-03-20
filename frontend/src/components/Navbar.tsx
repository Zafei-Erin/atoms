import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Navbar() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="flex items-end px-5 h-12 shrink-0">
      <div className="ml-auto flex items-center gap-1">
        {!isPending && (
          <>
            {user ? (
              <img
                src={user.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                alt={user.name}
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                }}
                className="w-8 h-8 rounded-full object-cover cursor-pointer"
              />
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-1.5 text-[13.5px] font-medium text-white bg-indigo-600 border-none rounded-full cursor-pointer transition-colors duration-150 hover:bg-indigo-700"
              >
                Log in / Sign up
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
