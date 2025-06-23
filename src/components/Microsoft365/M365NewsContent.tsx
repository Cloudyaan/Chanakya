
import React from 'react';
import { M365News } from '@/utils/types';
import UpdatesLoading from './UpdatesLoading';
import { 
  RefreshCw, 
  Newspaper, 
  Calendar, 
  Tag,
  ExternalLink 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface M365NewsContentProps {
  isLoading: boolean;
  newsItems: M365News[];
  isFetching: boolean;
  onFetch: () => void;
}

const M365NewsContent = ({
  isLoading,
  newsItems,
  isFetching,
  onFetch
}: M365NewsContentProps) => {
  // Enhanced logging for debugging
  console.log('M365NewsContent RENDER - props:', {
    isLoading,
    isFetching,
    newsItemsLength: newsItems?.length,
    newsItemsType: typeof newsItems,
    newsItemsIsArray: Array.isArray(newsItems),
    newsItemsSample: newsItems?.slice(0, 2)
  });
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if date is invalid
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'N/A';
    }
  };

  const openExternalLink = (url: string | null | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  if (isLoading) {
    console.log('M365NewsContent: Showing loading state');
    return <UpdatesLoading />;
  }

  if (!Array.isArray(newsItems) || newsItems.length === 0) {
    console.log('M365NewsContent: Showing empty state - no news items found');
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-yellow-500" />
              Microsoft 365 News
            </CardTitle>
            <CardDescription>Recent Microsoft 365 news and updates</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onFetch}
            disabled={isFetching}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? 'Fetching...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Newspaper className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Microsoft 365 News Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            There are no Microsoft 365 news items available in the database. Click the button below to fetch news from Microsoft.
          </p>
          <Button 
            onClick={onFetch} 
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? 'Fetching News...' : 'Fetch Microsoft 365 News'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sort news by published date (latest first - descending order)
  const sortedNews = [...newsItems].sort((a, b) => {
    const dateA = a.published_date ? new Date(a.published_date).getTime() : 0;
    const dateB = b.published_date ? new Date(b.published_date).getTime() : 0;
    return dateB - dateA; // Changed to descending order (latest first)
  });

  console.log('M365NewsContent: Rendering news items:', {
    originalCount: newsItems.length,
    sortedCount: sortedNews.length
  });

  return (
    <Card>
      <CardHeader className="sticky top-[200px] z-10 bg-white flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-yellow-500" />
            Microsoft 365 News
          </CardTitle>
          <CardDescription>Recent Microsoft 365 news and updates ({newsItems.length} items)</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onFetch}
          disabled={isFetching}
          className="flex items-center gap-1"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          {isFetching ? 'Fetching...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedNews.map((item, index) => (
          <div 
            key={item.id || `news-item-${index}`} 
            className="border p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openExternalLink(item.link)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-blue-700 flex items-center gap-1 hover:underline">
                  {item.title || "Untitled News Item"}
                  <ExternalLink size={14} />
                </h3>
                
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>{formatDate(item.published_date)}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.isArray(item.categories) && item.categories.length > 0 ? (
                    item.categories.map((category, i) => (
                      <Badge key={i} variant="outline" className="flex gap-1 items-center bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Tag size={10} />
                        {category}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="flex gap-1 items-center bg-gray-50 text-gray-700 border-gray-200">
                      <Tag size={10} />
                      News
                    </Badge>
                  )}
                </div>
                
                <p className="mt-3 text-gray-700 line-clamp-3">{item.summary || "No description available."}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default M365NewsContent;
