import { useArtifactStore } from "@/store/artifact";
import { useEffect, useRef } from "react";
import { CapabilitiesPanel } from "./CapabilitiesPanel";

export function ArtifactPanel() {
  const code = useArtifactStore((s) => s.code);
  const isStreaming = useArtifactStore((s) => s.isStreaming);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !code) return;

    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(code);
    doc.close();
  }, [code]);

  return (
    <div className="w-full h-full relative">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
        style={{ display: code ? "block" : "none" }}
      />
      {isStreaming && code && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "sweep 1.2s linear infinite",
          }}
        />
      )}
      {!code && !isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CapabilitiesPanel />
        </div>
      )}
      <style>{`
        @keyframes sweep {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
