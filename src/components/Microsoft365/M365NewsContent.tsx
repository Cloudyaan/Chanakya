
import React, { useMemo } from 'react';
import { M365News } from '@/utils/types';
import UpdatesLoading from './UpdatesLoading';
import { 
  RefreshCw, 
  Newspaper, 
  Calendar, 
  ExternalLink,
  Tag
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
import { formatDistanceToNow } from 'date-fns';

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
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'N/A';
    }
  };

  // Sort news items by published_date in descending order (newest first)
  const sortedNewsItems = useMemo(() => {
    if (!Array.isArray(newsItems)) return [];
    
    return [...newsItems].sort((a, b) => {
      const dateA = a.published_date ? new Date(a.published_date).getTime() : 0;
      const dateB = b.published_date ? new Date(b.published_date).getTime() : 0;
      return dateB - dateA; // Descending order - newest first
    });
  }, [newsItems]);
  
  if (isLoading) {
    return <UpdatesLoading />;
  }

  if (!Array.isArray(newsItems) || newsItems.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Microsoft 365 News</CardTitle>
            <CardDescription>Latest news and updates from Microsoft 365</CardDescription>
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
          <Newspaper className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">No News Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            There are no Microsoft 365 news items available in the database. Click the button below to fetch news from Microsoft RSS feed.
          </p>
          <Button 
            onClick={onFetch} 
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? 'Fetching News...' : 'Fetch M365 News'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="sticky top-[200px] z-10 bg-white flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Microsoft 365 News</CardTitle>
          <CardDescription>Latest news and updates from Microsoft 365</CardDescription>
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
        {sortedNewsItems.map((newsItem, index) => (
          <div 
            key={newsItem.id || `news-${index}`} 
            className="border p-4 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-blue-700 flex items-center gap-2">
                  {newsItem.title || "Untitled News"}
                  {newsItem.link && (
                    <a 
                      href={newsItem.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </h3>
                
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>{formatDate(newsItem.published_date)}</span>
                </div>
                
                {newsItem.categories && Array.isArray(newsItem.categories) && newsItem.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newsItem.categories.map((category, catIndex) => (
                      <Badge 
                        key={catIndex} 
                        variant="outline" 
                        className="flex gap-1 items-center bg-green-50 text-green-700 border-green-200"
                      >
                        <Tag size={10} />
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="mt-3 text-gray-700 line-clamp-3">
                  {newsItem.summary || "No summary available."}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default M365NewsContent;
