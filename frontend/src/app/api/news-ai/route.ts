import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const { articleText, actionType } = await request.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured.' }, { status: 500 });
    }
    
    if (!articleText || !actionType) {
      return NextResponse.json({ error: 'Missing articleText or actionType.' }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    let prompt = '';

    switch (actionType) {
      case 'takeaways':
        prompt = `Extract the 3 most important key takeaways from the following news article. Keep them concise and punchy.\n\nArticle: ${articleText}`;
        break;
      case 'eli5':
        prompt = `Explain this news article like I am 5 years old. Keep it simple, fun, and easy to understand.\n\nArticle: ${articleText}`;
        break;
      case 'bias':
        prompt = `Analyze this news article for potential bias or sensationalism. Identify any loaded language and state what a purely objective fact-check might look like.\n\nArticle: ${articleText}`;
        break;
      case 'translate':
        prompt = `Translate the core summary of this article into English (if it is in another language), and provide a clear, concise English summary.\n\nArticle: ${articleText}`;
        break;
      default:
        prompt = `Summarize the following article.\n\nArticle: ${articleText}`;
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
    });

    const text = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error in AI route:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate AI response' }, { status: 500 });
  }
}
