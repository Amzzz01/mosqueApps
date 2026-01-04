'use client';

import { Announcement } from '@/types';
import { Calendar, Tag, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';

interface AnnouncementCardProps {
  announcement: Announcement;
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const priorityLabels = {
    low: 'Biasa',
    medium: 'Sederhana',
    high: 'Penting',
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMMM yyyy, HH:mm', { locale: ms });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Priority Badge - Top colored bar */}
      {announcement.priority === 'high' && (
        <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500" />
      )}
      {announcement.priority === 'medium' && (
        <div className="h-2 bg-gradient-to-r from-yellow-500 to-amber-500" />
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {announcement.priority === 'high' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {announcement.title}
              </h2>
            </div>
            
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(announcement.createdAt)}</span>
              </div>
              
              {announcement.category && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span className="capitalize">{announcement.category}</span>
                </div>
              )}
            </div>
          </div>

          {/* Priority Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityColors[announcement.priority || 'low']}`}>
            {priorityLabels[announcement.priority || 'low']}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {announcement.content}
          </p>
        </div>

        {/* Footer */}
        {announcement.author && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Disiarkan oleh: <span className="font-medium text-gray-700">{announcement.author}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}