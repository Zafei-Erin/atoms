import { ThreadPrimitive, useAui } from "@assistant-ui/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { Composer } from "./Composer";
import { CreditsBar } from "./CreditsBar";
import { CapabilitiesPanel } from "./CapabilitiesPanel";

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
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    if (initialMessage && !sent.current) {
      sent.current = true;
      // Small delay to ensure the runtime is fully mounted before appending
      setTimeout(() => {
        thread().append(initialMessage);
      }, 80);
    }
  }, [initialMessage, thread]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div
      className="flex h-screen bg-white"
    >
      {/* Left panel */}
      <div
        className="flex-shrink-0 flex flex-col bg-[#f3f3f3]"
        style={{ width: leftWidth }}
      >
        <ThreadPrimitive.Root
          className="aui-root flex flex-col h-full"
          style={{ "--thread-max-width": "100%" } as React.CSSProperties}
        >
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 pt-5 pb-2">
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
        onMouseDown={onMouseDown}
        className="w-1 flex-shrink-0 cursor-col-resize group relative hover:bg-blue-400/30 transition-colors"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <CapabilitiesPanel />
      </div>
    </div>
  );
}
