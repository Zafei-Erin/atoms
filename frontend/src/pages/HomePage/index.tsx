import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../../components";
import { AvatarRow, PromptInput, HomeCta } from "./components";
import { useAuth } from "../../hooks/useAuth";

export function HomePage() {
  const [input, setInput] = useState("");
  const { user, isPending } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (isPending) return;
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/chat", { state: { initialMessage: input } });
  };

  return (
    <div className="h-screen bg-[#f4f4f4] flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center gap-6 overflow-hidden px-4 pb-60">
        {/* 标题区域 */}
        <div className="flex flex-col items-center flex-shrink-0">
          <AvatarRow />
          <h1
            className="font-bold text-gray-950 text-center max-w-[800px] mb-2"
            style={{
              fontSize: "clamp(32px, 13.7143px + 2.38095vw, 48px)",
              lineHeight: "clamp(40px, 21.7143px + 2.38095vw, 56px)",
            }}
          >
            Turn ideas into{" "}
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 bg-clip-text text-transparent">
              products
            </span>{" "}
            that sell
          </h1>
          <p className="text-xl text-center leading-relaxed max-w-[700px]">
            AI employees to validate ideas, build products, and acquire
            customers. In minutes. Without coding.
          </p>
        </div>

        {/* 输入框 + CTA */}
        <div className="w-full max-w-[740px] flex flex-col flex-shrink-0 gap-6">
          <PromptInput value={input} onChange={setInput} onStart={handleStart} />
          <HomeCta onIdeaClick={setInput} />
        </div>
      </main>
    </div>
  );
}
