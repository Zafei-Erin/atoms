import { GoogleIcon } from "../../icons";
import { authClient } from "../../lib/auth-client";

export function LoginPage() {
  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: import.meta.env.VITE_APP_URL,
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-950 text-center mb-6">
            Welcome Back
          </h1>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl text-[14.5px] font-medium text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
