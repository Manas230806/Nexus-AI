import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { articleText, actionType } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured.' }, { status: 500 });
    }
    
    if (!articleText || !actionType) {
      return NextResponse.json({ error: 'Missing articleText or actionType.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
        prompt = `Translate the core summary of this article into Spanish, and provide a brief English explanation of the translation.\n\nArticle: ${articleText}`;
        break;
      default:
        prompt = `Summarize the following article.\n\nArticle: ${articleText}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error in AI route:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate AI response' }, { status: 500 });
  }
}
