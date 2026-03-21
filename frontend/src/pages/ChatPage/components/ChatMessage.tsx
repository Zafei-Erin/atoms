import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import {
  Reasoning,
  ReasoningGroup,
} from "@/components/assistant-ui/reasoning";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { MessagePrimitive, useAuiState } from "@assistant-ui/react";
import { RefreshCw, MoreHorizontal } from "lucide-react";
import type { FC } from "react";

export const ChatMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  if (role === "user") return <UserBubble />;
  return <AgentBubble />;
};

const UserBubble: FC = () => (
  <MessagePrimitive.Root className="flex justify-end mb-3" data-role="user">
    <div className="bg-white text-gray-800 text-sm rounded-2xl px-4 py-2.5 max-w-[85%] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
);

const AgentBubble: FC = () => (
  <MessagePrimitive.Root className="mb-5" data-role="assistant">
    <div className="flex items-center gap-2.5 mb-2">
      <AgentAvatar />
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-semibold text-gray-900">Alex</span>
        <span className="text-gray-300 text-xs">·</span>
        <span className="text-[11px] text-gray-400 font-medium tracking-wide">
          Engineer
        </span>
      </div>
    </div>

    <div className="pl-[42px] text-[13px] text-gray-700 leading-relaxed">
      <MessagePrimitive.Parts
        components={{
          Text: MarkdownText,
          Reasoning: Reasoning,
          ReasoningGroup: ReasoningGroup,
          tools: {
            Fallback: ToolFallback,
          },
        }}
      />
    </div>

    <div className="pl-[42px] mt-2 flex items-center gap-0.5">
      <button className="p-1 text-gray-300 hover:text-gray-500 rounded-md hover:bg-gray-200/80 transition-colors">
        <RefreshCw className="size-3.5" />
      </button>
      <button className="p-1 text-gray-300 hover:text-gray-500 rounded-md hover:bg-gray-200/80 transition-colors">
        <MoreHorizontal className="size-3.5" />
      </button>
    </div>
  </MessagePrimitive.Root>
);

const AgentAvatar: FC = () => (
  <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
    <span className="text-white text-[10px] font-bold tracking-wider">AL</span>
  </div>
);
