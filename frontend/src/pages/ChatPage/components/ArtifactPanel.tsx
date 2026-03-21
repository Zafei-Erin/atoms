import { useArtifactStore } from "@/store/artifact";
import { useEffect, useRef } from "react";
import { CapabilitiesPanel } from "./CapabilitiesPanel";

export function ArtifactPanel() {
  // Only re-render when these booleans flip, not on every code chunk
  const hasCode = useArtifactStore((s) => !!s.code);
  const isStreaming = useArtifactStore((s) => s.isStreaming);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    // Write initial code if already present
    const { code } = useArtifactStore.getState();
    if (code && iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(code);
      doc.close();
    }

    // Subscribe to store — debounce iframe writes, no React re-renders
    const unsub = useArtifactStore.subscribe((state, prev) => {
      if (state.code === prev.code) return;

      const iframe = iframeRef.current;
      if (!iframe || !state.code) return;

      clearTimeout(timer);

      const write = () => {
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.open();
        doc.write(state.code);
        doc.close();
      };

      if (state.isStreaming) {
        timer = setTimeout(write, 300);
      } else {
        write();
      }
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
        style={{ display: hasCode ? "block" : "none" }}
      />
      {isStreaming && hasCode && (
        <div className="absolute inset-0 pointer-events-none aui-artifact-sweep" />
      )}
      {!hasCode && !isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CapabilitiesPanel />
        </div>
      )}
    </div>
  );
}
