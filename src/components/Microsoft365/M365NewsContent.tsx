
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
    
    console.log('Original date string:', dateString);
    
    try {
      // Handle various date formats
      let date: Date;
      
      // Since dateString is guaranteed to be a string here (after null check)
      // we can safely convert it to string and parse
      const cleanDateString = dateString.toString().trim();
      
      // Handle RFC 2822 format like "Wed, 28 May 2025 23:00:19 Z"
      if (cleanDateString.includes(',') && cleanDateString.includes('Z')) {
        // Remove the Z and parse
        const withoutZ = cleanDateString.replace(' Z', ' GMT');
        date = new Date(withoutZ);
      } else {
        // Try parsing as-is
        date = new Date(cleanDateString);
      }
      
      console.log('Parsed date:', date);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date after parsing:', dateString);
        return 'Invalid Date';
      }
      
      // Format date as dd/mm/yyyy
      const formatted = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      console.log('Formatted date:', formatted);
      return formatted;
    } catch (e) {
      console.error('Error formatting date:', e, 'Original:', dateString);
      return 'Error formatting date';
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

  // Enhanced sorting function with better date parsing
  const sortedNews = [...newsItems].sort((a, b) => {
    console.log('Sorting comparison:', {
      itemA: { title: a.title, date: a.published_date },
      itemB: { title: b.title, date: b.published_date }
    });
    
    // Handle missing dates
    if (!a.published_date && !b.published_date) return 0;
    if (!a.published_date) return 1; // Put items without dates at the end
    if (!b.published_date) return -1;
    
    try {
      // Parse dates with enhanced handling
      let dateA: Date, dateB: Date;
      
      // Clean and parse date A
      const cleanDateA = a.published_date.toString().trim();
      if (cleanDateA.includes(',') && cleanDateA.includes('Z')) {
        dateA = new Date(cleanDateA.replace(' Z', ' GMT'));
      } else {
        dateA = new Date(cleanDateA);
      }
      
      // Clean and parse date B
      const cleanDateB = b.published_date.toString().trim();
      if (cleanDateB.includes(',') && cleanDateB.includes('Z')) {
        dateB = new Date(cleanDateB.replace(' Z', ' GMT'));
      } else {
        dateB = new Date(cleanDateB);
      }
      
      // Check for invalid dates
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      
      // Sort in descending order (latest first)
      const result = dateB.getTime() - dateA.getTime();
      console.log('Sort result:', {
        dateA: dateA.toISOString(),
        dateB: dateB.toISOString(),
        result
      });
      
      return result;
    } catch (error) {
      console.error('Error sorting dates:', error);
      return 0;
    }
  });

  console.log('M365NewsContent: Rendering news items:', {
    originalCount: newsItems.length,
    sortedCount: sortedNews.length,
    firstItemDate: sortedNews[0]?.published_date,
    lastItemDate: sortedNews[sortedNews.length - 1]?.published_date
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
