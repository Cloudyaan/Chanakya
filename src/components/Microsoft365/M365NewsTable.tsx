
import React from 'react';
import { M365News } from '@/utils/types';
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
import { formatDistanceToNow } from 'date-fns';

interface M365NewsTableProps {
  news: M365News[];
  onFetch: () => void;
  isFetching: boolean;
}

const M365NewsTable = ({ news, onFetch, isFetching }: M365NewsTableProps) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const openExternalLink = (url: string | null | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!Array.isArray(news) || news.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Microsoft 365 News</CardTitle>
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
            There are no Microsoft 365 news updates in the database. Click the button below to fetch updates from the Microsoft RSS feed.
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Microsoft 365 News</CardTitle>
          <CardDescription>Recent Microsoft 365 news and updates (last 10 days)</CardDescription>
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
        {news.map((item) => (
          <div 
            key={item.id} 
            className="border p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openExternalLink(item.link)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium flex items-center gap-1 text-blue-600 hover:underline">
                  {item.title}
                  <ExternalLink size={14} />
                </h3>
                
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>{formatDate(item.published_date)}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.categories?.map((category, index) => (
                    <Badge key={index} variant="outline" className="flex gap-1 items-center bg-blue-50 text-blue-700 border-blue-200">
                      <Tag size={10} />
                      {category}
                    </Badge>
                  ))}
                </div>
                
                <p className="mt-3 text-gray-700 line-clamp-3">{item.summary}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default M365NewsTable;
