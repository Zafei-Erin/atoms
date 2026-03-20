export function Navbar() {
  return (
    <nav className="flex items-end px-5 h-12 shrink-0">
      {/* Right - pushed to end */}
      <div className="ml-auto flex items-center gap-1">
        <button className="flex items-center gap-1 px-2.5 py-1.5 text-[13.5px] text-[#555] bg-transparent border-none rounded-[7px] cursor-pointer transition-colors duration-150 hover:bg-black/5">
          Log in
        </button>

        <button className="px-4 py-1.5 text-[13.5px] font-medium text-white bg-indigo-600 border-none rounded-full cursor-pointer transition-colors duration-150 hover:bg-indigo-700">
          Sign up
        </button>
      </div>
    </nav>
  );
}
