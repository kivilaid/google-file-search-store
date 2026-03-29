import type { Interactions } from '@google/genai';
import { getAI } from '../../../lib/client';

export async function POST(request: Request) {
  try {
    const { input, model, previousInteractionId } = await request.json();

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

    const stream = await ai.interactions.create(params);

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.event_type === 'content.delta') {
              if (chunk.delta?.type === 'text' && 'text' in chunk.delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk.delta.text })}\n\n`)
                );
              }
            } else if (chunk.event_type === 'interaction.complete') {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'complete',
                    interactionId: chunk.interaction?.id,
                    totalTokens: chunk.interaction?.usage?.total_tokens,
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
