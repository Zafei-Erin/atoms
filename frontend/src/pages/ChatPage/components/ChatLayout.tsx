import { ThreadPrimitive, useAui } from "@assistant-ui/react";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { Composer } from "./Composer";
import { CreditsBar } from "./CreditsBar";
import { ArtifactPanel } from "./ArtifactPanel";
import { Sidebar } from "./Sidebar";

const MIN_WIDTH = 240;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 330;

interface ChatLayoutProps {
  initialMessage?: string;
}

export function ChatLayout({ initialMessage }: ChatLayoutProps) {
  const { thread } = useAui();
  const sent = useRef(false);
  const [creditsVisible, setCreditsVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(DEFAULT_WIDTH);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    if (initialMessage && !sent.current) {
      sent.current = true;
      setTimeout(() => {
        thread().append(initialMessage);
      }, 80);
    }
  }, [initialMessage, thread]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startWidth.current = leftWidth;
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const delta = e.clientX - startX.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
    setLeftWidth(newWidth);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.userSelect = "";
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.userSelect = "";
  };

  return (
    <div className="flex h-screen bg-white relative">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

      {/* Left panel */}
      <div
        className="flex-shrink-0 flex flex-col bg-[#f3f3f3]"
        style={{ width: leftWidth }}
      >
        <ThreadPrimitive.Root
          className="aui-root flex flex-col h-full"
          style={{ "--thread-max-width": "100%" } as React.CSSProperties}
        >
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 pt-12 pb-2">
            <div className="text-center text-[11px] text-gray-400 mb-4">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <ThreadPrimitive.Messages>
              {() => <ChatMessage />}
            </ThreadPrimitive.Messages>
          </ThreadPrimitive.Viewport>

          <div className="flex-shrink-0 px-3 pb-4 flex flex-col gap-2">
            {creditsVisible && (
              <CreditsBar onDismiss={() => setCreditsVisible(false)} />
            )}
            <Composer />
          </div>
        </ThreadPrimitive.Root>
      </div>

      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="w-1 flex-shrink-0 cursor-col-resize relative hover:bg-blue-400/30 transition-colors"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white overflow-hidden">
        <ArtifactPanel />
      </div>
    </div>
  );
}
