import { Zap, X } from "lucide-react";
import type { FC } from "react";

interface CreditsBarProps {
  onDismiss: () => void;
}

export const CreditsBar: FC<CreditsBarProps> = ({ onDismiss }) => (
  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
    <Zap className="size-3.5 text-blue-500 flex-shrink-0" />
    {/* TODO: fetch real credit balance from API */}
    <span className="text-[11px] text-gray-500 flex-1">
      14.77 credits remaining
    </span>
    <button className="text-[11px] text-blue-500 font-medium hover:text-blue-600 transition-colors">
      Add credits
    </button>
    <button
      onClick={onDismiss}
      className="text-gray-400 hover:text-gray-600 ml-0.5 transition-colors"
    >
      <X className="size-3.5" />
    </button>
  </div>
);
