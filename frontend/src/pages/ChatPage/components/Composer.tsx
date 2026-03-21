import { ComposerPrimitive, AuiIf } from "@assistant-ui/react";
import { Plus, Users, AudioWaveform, ArrowUp, Square } from "lucide-react";
import type { FC } from "react";

export const Composer: FC = () => (
  <ComposerPrimitive.Root className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
    <ComposerPrimitive.Input
      placeholder="Ask the team to bring your idea to life"
      className="w-full px-4 pt-3 pb-2 text-[13px] bg-transparent outline-none resize-none min-h-[42px] max-h-32 placeholder:text-gray-400 text-gray-800"
      rows={1}
    />
    <div className="flex items-center justify-between px-3 pb-2.5">
      <div className="flex items-center gap-0.5">
        <IconBtn label="Attach">
          <Plus className="size-4" />
        </IconBtn>
        <IconBtn label="Agents">
          <Users className="size-4" />
        </IconBtn>
      </div>
      <div className="flex items-center gap-0.5">
        <IconBtn label="Voice">
          <AudioWaveform className="size-4" />
        </IconBtn>
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send className="p-1.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowUp className="size-4" />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel className="p-1.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors">
            <Square className="size-3.5 fill-current" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </div>
  </ComposerPrimitive.Root>
);

const IconBtn: FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <button
    aria-label={label}
    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
  >
    {children}
  </button>
);
