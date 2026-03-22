import { useArtifactStore } from "@/store/artifact";
import type { ArtifactChoice } from "@/store/artifact-parser";
import { useAui, useAuiState } from "@assistant-ui/react";
import { useEffect, useRef } from "react";
import { CapabilitiesPanel } from "./CapabilitiesPanel";
import { ArrowRight } from "lucide-react";

export function ArtifactPanel() {
  const mode = useArtifactStore((s) => s.mode);
  const code = useArtifactStore((s) => s.code);
  const choices = useArtifactStore((s) => s.choices);
  const isStreaming = useArtifactStore((s) => s.isStreaming);
  const hasArtifact = mode !== "empty";

  return (
    <div className="w-full h-full relative bg-[#f7f5ef]">
      {mode === "choices" && choices.length >= 2 && (
        <div className="grid h-full grid-cols-2 gap-4 p-4">
          {(["1", "2"] as const).map((choiceId) => {
            const choice = choices.find((item) => item.id === choiceId);

            if (!choice) {
              return <ChoicePlaceholder key={choiceId} choiceId={choiceId} />;
            }

            return (
              <ChoiceCard
                key={choice.id}
                choice={choice}
                isSelected={false}
              />
            );
          })}
        </div>
      )}

      {mode === "choices" && choices.length === 1 && (
        <ArtifactFrame
          code={choices[0].code}
          isStreaming={isStreaming}
          title={`Proposal ${choices[0].id}`}
        />
      )}

      {mode === "final" && code && (
        <ArtifactFrame code={code} isStreaming={isStreaming} title="Preview" />
      )}

      {isStreaming && hasArtifact && (
        <div className="absolute inset-0 pointer-events-none aui-artifact-sweep" />
      )}

      {!hasArtifact && !isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CapabilitiesPanel />
        </div>
      )}
    </div>
  );
}

function ChoiceCard({
  choice,
  isSelected,
}: {
  choice: ArtifactChoice;
  isSelected: boolean;
}) {
  const { thread } = useAui();
  const isRunning = useAuiState((s) => s.thread.isRunning);

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-[28px] border transition-all ${
        isSelected
          ? "border-black bg-[#fffaf0] shadow-[0_22px_70px_rgba(0,0,0,0.14)]"
          : "border-black/10 bg-white shadow-[0_14px_45px_rgba(0,0,0,0.08)]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-black/8 bg-[#f3efe4] px-5 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-black/40">
            Direction {choice.id}
          </div>
          <div className="mt-1 text-sm font-medium text-black/70">
            Preview proposal
          </div>
        </div>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => thread().append(choice.id)}
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] text-black/55 transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          Choose {choice.id}
          <ArrowRight className="size-3" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <ArtifactFrame
          code={choice.code}
          isStreaming={false}
          title={`Proposal ${choice.id}`}
        />
        {isSelected && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#fffaf0]/65 backdrop-blur-[1px]">
            <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em] text-black/55">
              Selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChoicePlaceholder({ choiceId }: { choiceId: "1" | "2" }) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-dashed border-black/10 bg-[rgba(255,255,255,0.55)]">
      <div className="flex items-center justify-between border-b border-black/8 bg-[#f3efe4]/80 px-5 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-black/35">
            Direction {choiceId}
          </div>
          <div className="mt-1 text-sm font-medium text-black/45">
            Waiting for preview
          </div>
        </div>
        <div className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] text-black/35">
          Pending
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-[linear-gradient(135deg,rgba(0,0,0,0.03),rgba(0,0,0,0.01))]">
        <div className="rounded-full border border-black/8 bg-white/85 px-4 py-2 text-xs uppercase tracking-[0.22em] text-black/35">
          Streaming
        </div>
      </div>
    </div>
  );
}

function ArtifactFrame({
  code,
  isStreaming,
  title,
}: {
  code: string;
  isStreaming: boolean;
  title: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const writeCode = (nextCode: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write(nextCode);
      doc.close();
    };

    if (code) writeCode(code);

    if (isStreaming) {
      timer = setTimeout(() => writeCode(code), 300);
    } else {
      writeCode(code);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [code, isStreaming]);

  return (
    <iframe
      ref={iframeRef}
      className="h-full w-full border-none"
      sandbox="allow-scripts allow-same-origin"
      title={title}
    />
  );
}
