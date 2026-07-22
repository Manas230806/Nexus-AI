import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const files = formData.getAll('files') as File[];

    if (!prompt && files.length === 0) {
      return NextResponse.json({ error: 'Prompt or files are required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API Key is not configured.' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    let extractedText = '';
    const imageContents: any[] = [];
    let hasImages = false;

    // Process all uploaded files
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type;

      if (mimeType === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        extractedText += `\n\n--- Content from PDF: ${file.name} ---\n${data.text}`;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        mimeType === 'application/msword'
      ) {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        extractedText += `\n\n--- Content from Document: ${file.name} ---\n${result.value}`;
      } else if (mimeType.startsWith('image/')) {
        hasImages = true;
        const base64Image = buffer.toString('base64');
        imageContents.push({
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        });
      } else {
        // Fallback for simple text files (.txt, .md, .csv)
        extractedText += `\n\n--- Content from Text File: ${file.name} ---\n${buffer.toString('utf-8')}`;
      }
    }

    const systemPrompt = "You are Nexus AI, an intelligent workspace assistant built into a chat and collaboration app. Your goal is to help users manage their work, analyze documents, brainstorm, and answer questions. Keep your answers concise, professional, and friendly. Format your responses with markdown where appropriate.";
    
    // Construct final user prompt
    let finalPrompt = prompt || "Please analyze the attached files.";
    if (extractedText) {
      finalPrompt += `\n\nHere is the extracted text from the attached documents for context:\n${extractedText}`;
    }

    const userMessageContent: any[] = [{ type: "text", text: finalPrompt }, ...imageContents];

    // If there are images, we MUST use Groq's Vision Model
    const modelToUse = hasImages ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';

    const chatCompletionStream = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent as any }
      ],
      model: modelToUse,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletionStream) {
            const chunkText = chunk.choices[0]?.delta?.content || '';
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
