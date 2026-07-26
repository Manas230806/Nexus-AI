import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'For You';
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    console.error('GNEWS_API_KEY is not set in environment variables');
    return NextResponse.json({ error: 'News API key not configured.' }, { status: 500 });
  }

  let url = '';
  
  // GNews specific category mappings
  const gnewsCategories = ['world', 'business', 'technology', 'entertainment', 'sports', 'science', 'health', 'nation'];
  
  // Helper to construct GNews URL
  const buildUrl = (path: 'top-headlines' | 'search', params: Record<string, string>) => {
    const query = new URLSearchParams({ ...params, lang: 'en', apikey: apiKey });
    return `https://gnews.io/api/v4/${path}?${query.toString()}`;
  };

  // Map UI categories to GNews endpoints
  const lowerCategory = category.toLowerCase();
  
  if (category === 'For You') {
    url = buildUrl('top-headlines', {});
  } else if (category === 'India') {
    url = buildUrl('top-headlines', { country: 'in' });
  } else if (gnewsCategories.includes(lowerCategory)) {
    url = buildUrl('top-headlines', { category: lowerCategory });
  } else {
    // For 'Artificial Intelligence', 'Markets', 'Gaming' etc. use search
    url = buildUrl('search', { q: category, max: '10' });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 mins
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.errors?.[0] || 'Failed to fetch news');
    }

    const data = await res.json();
    
    // Transform GNews articles to match our NewsCard format
    const articles = (data.articles || []).map((article: any, index: number) => {
      // Calculate a rough read time based on description length or just randomize it for demo
      const wordCount = (article.content || article.description || '').split(' ').length;
      const readTimeMins = Math.max(1, Math.ceil(wordCount / 200));

      // Parse relative time
      const pubDate = new Date(article.publishedAt);
      const diffMins = Math.floor((Date.now() - pubDate.getTime()) / 60000);
      let publishedTime = '';
      if (diffMins < 60) {
        publishedTime = `${diffMins} mins ago`;
      } else if (diffMins < 1440) {
        publishedTime = `${Math.floor(diffMins / 60)} hours ago`;
      } else {
        publishedTime = `${Math.floor(diffMins / 1440)} days ago`;
      }

      return {
        id: `news-${index}-${Date.now()}`,
        category: category !== 'For You' ? category : article.source.name,
        headline: article.title,
        summary: article.description,
        publisher: article.source.name,
        publishedTime: publishedTime,
        readTime: `${readTimeMins} min read`,
        imageUrl: article.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200&auto=format&fit=crop',
        publisherLogo: article.source.name.substring(0, 1).toUpperCase(),
        url: article.url
      };
    });

    return NextResponse.json({ articles });
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch news' }, { status: 500 });
  }
}
