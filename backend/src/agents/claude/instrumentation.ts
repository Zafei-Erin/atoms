import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor, isDefaultExportSpan } from "@langfuse/otel";
import { ClaudeAgentSDKInstrumentation } from "@arizeai/openinference-instrumentation-claude-agent-sdk";
import * as ClaudeAgentSDKModule from "@anthropic-ai/claude-agent-sdk";

const ClaudeAgentSDK = { ...ClaudeAgentSDKModule };

const instrumentation = new ClaudeAgentSDKInstrumentation();
instrumentation.manuallyInstrument(ClaudeAgentSDK as any);

const enabled =
  process.env.LANGFUSE_ENABLED !== "false" &&
  !!process.env.LANGFUSE_PUBLIC_KEY &&
  !!process.env.LANGFUSE_SECRET_KEY;

const sdk = enabled
  ? new NodeSDK({
      spanProcessors: [
        new LangfuseSpanProcessor({
          shouldExportSpan: ({ otelSpan }) =>
            isDefaultExportSpan(otelSpan) ||
            otelSpan.instrumentationScope.name ===
              "@arizeai/openinference-instrumentation-claude-agent-sdk",
        }),
      ],
      instrumentations: [instrumentation],
    })
  : null;

if (sdk) {
  sdk.start();

  const shutdown = async () => {
    try {
      await sdk.shutdown();
    } catch (e) {
      console.error("[langfuse] shutdown error:", (e as Error).message);
    }
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  process.once("beforeExit", shutdown);
}

export const query = ClaudeAgentSDK.query;
