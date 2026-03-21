import { useArtifactStore } from "@/store/artifact";
import { useEffect, useRef } from "react";
import { CapabilitiesPanel } from "./CapabilitiesPanel";

export function ArtifactPanel() {
  const code = useArtifactStore((s) => s.code);
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
      {/* Always mounted so the ref and contentDocument are ready */}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
        style={{ display: code ? "block" : "none" }}
      />
      {!code && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CapabilitiesPanel />
        </div>
      )}
    </div>
  );
}
