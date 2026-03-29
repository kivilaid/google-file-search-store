import type { Interactions } from '@google/genai';
import { getAI } from '../../../lib/client';

export async function POST(request: Request) {
  try {
    const { input, model, previousInteractionId, storeNames, systemInstruction, builtinTools, thinkingLevel } = await request.json();

    if (!input || typeof input !== 'string') {
      return Response.json({ error: 'input is required' }, { status: 400 });
    }

    const ai = getAI();

    const params: Interactions.CreateModelInteractionParamsStreaming = {
      model: model || 'gemini-3-flash-preview',
      input,
      stream: true,
      previous_interaction_id: previousInteractionId || undefined,
    };

    if (systemInstruction) {
      params.system_instruction = systemInstruction;
    }

    if (thinkingLevel) {
      (params as Record<string, unknown>).generation_config = {
        thinking_level: thinkingLevel.toLowerCase(),
        thinking_summaries: 'auto',
      };
    }

    const tools: Interactions.Tool[] = [];

    if (storeNames?.length) {
      tools.push({
        type: 'file_search',
        file_search_store_names: storeNames,
      });
    }

    if (builtinTools?.length) {
      for (const tool of builtinTools) {
        if (['google_search', 'code_execution', 'url_context'].includes(tool)) {
          tools.push({ type: tool } as Interactions.Tool);
        }
      }
    }

    if (tools.length > 0) {
      params.tools = tools;
    }

    // Build a sanitized copy of params for the debug view (omit stream since it's internal)
    const { stream: _stream, ...debugParams } = params;

    const stream = await ai.interactions.create(params);

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Emit the request params first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'request_params', params: debugParams })}\n\n`)
          );

          for await (const chunk of stream) {
            if (chunk.event_type === 'content.delta') {
              if (chunk.delta?.type === 'text' && 'text' in chunk.delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk.delta.text })}\n\n`)
                );
              } else if (chunk.delta?.type === 'file_search_result' && 'result' in chunk.delta) {
                const results = (chunk.delta as { result?: { title?: string; text?: string; file_search_store?: string }[] }).result;
                if (results?.length) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations: results })}\n\n`)
                  );
                }
              }
            } else if (chunk.event_type === 'interaction.complete') {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'complete',
                    interactionId: chunk.interaction?.id,
                    totalTokens: chunk.interaction?.usage?.total_tokens,
                    interaction: chunk.interaction,
                  })}\n\n`
                )
              );
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
