'use client'

import React from 'react'
import CodeExecutor from '@/components/code-executor'
import { BookOpen, Code2 } from 'lucide-react'
import { Topic, CodeExample } from '@/lib/course-api'

interface TopicRendererProps {
  topics: Topic[]
  className?: string
}

// Helper function to render different content types
const renderTopicContent = (topic: Topic) => {
  const { content, content_type } = topic;
  
  // Convert relative paths to absolute URLs with fallback options
  const getFullUrl = (path: string) => {
    console.log('Original path:', path);
    
    if (path.startsWith('http')) {
      console.log('Already full URL:', path);
      return path;
    }
    
    let fullUrl;
    if (path.startsWith('/storage/')) {
      fullUrl = `http://localhost:8000${path}`;
    } else if (path.startsWith('storage/')) {
      fullUrl = `http://localhost:8000/${path}`;
    } else {
      fullUrl = `http://localhost:8000/storage/${path}`;
    }
    
    console.log('Generated full URL:', fullUrl);
    return fullUrl;
  };

  // Generate fallback URL using our API route
  const getFallbackUrl = (path: string) => {
    const cleanPath = path.replace(/^\/storage\//, '').replace(/^storage\//, '');
    return `http://localhost:8000/api/admin/upload/serve-file/${encodeURIComponent(cleanPath)}`;
  };

  switch (content_type) {
    case 'image':
      return (
        <div className="flex justify-center my-6">
          <img 
            src={getFullUrl(content)} 
            alt={topic.title}
            className="max-w-full h-auto rounded-lg shadow-lg border border-gray-200"
            style={{ maxHeight: '500px' }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', getFullUrl(content));
            }}
            onError={(e) => {
              const currentSrc = e.currentTarget.src;
              const fallbackUrl = getFallbackUrl(content);
              
              console.error('❌ Image failed to load:', {
                originalContent: content,
                currentSrc: currentSrc,
                tryingFallback: fallbackUrl
              });
              
              // Try fallback URL if not already tried
              if (!currentSrc.includes('/api/admin/upload/serve-file/')) {
                console.log('🔄 Trying fallback URL:', fallbackUrl);
                e.currentTarget.src = fallbackUrl;
              } else {
                // If fallback also failed, show placeholder
                console.log('❌ Fallback also failed, showing placeholder');
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
              }
            }}
          />
        </div>
      );
      
    case 'video':
      return (
        <div className="flex justify-center my-6">
          <video 
            src={getFullUrl(content)} 
            controls
            className="max-w-full h-auto rounded-lg shadow-lg border border-gray-200"
            style={{ maxHeight: '400px' }}
            onError={(e) => {
              const currentSrc = e.currentTarget.src;
              const fallbackUrl = getFallbackUrl(content);
              
              console.error('❌ Video failed to load:', {
                originalContent: content,
                currentSrc: currentSrc,
                tryingFallback: fallbackUrl
              });
              
              // Try fallback URL if not already tried
              if (!currentSrc.includes('/api/admin/upload/serve-file/')) {
                console.log('🔄 Trying fallback video URL:', fallbackUrl);
                e.currentTarget.src = fallbackUrl;
              }
            }}
          >
            <p className="text-red-500">Your browser does not support the video tag.</p>
          </video>
        </div>
      );
      
    case 'text':
    default:
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
  }
};

const TopicRenderer: React.FC<TopicRendererProps> = ({ topics, className = '' }) => {
  if (!topics || topics.length === 0) {
    return null
  }


  return (
    <div className={`space-y-12 ${className}`}>
      {topics.map((topic, topicIndex) => (
        <div key={topic.id} className="space-y-8">
          
          {/* Lesson Content Section */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            {/* Topic Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {topicIndex + 1}. {topic.title}
                </h3>
              </div>
            </div>

            {/* Topic Content */}
            {topic.content && (
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                {renderTopicContent(topic)}
              </div>
            )}
          </div>

          {/* Code Examples Section - Visually Separated */}
          {topic.codeExamples && topic.codeExamples.length > 0 && (
            <div className="space-y-6">

              {/* Code Examples */}
              <div className="space-y-6">
                {topic.codeExamples.map((codeExample, exampleIndex) => (
                  <div 
                    key={codeExample.id}
                    className=""
                  >
                    {/* Code Example Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                        <Code2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-italic text-gray-900">
                          {codeExample.title && codeExample.description ? `${codeExample.title}: ${codeExample.description}` : codeExample.title || `Example ${exampleIndex + 1}`}
                        </h4>
                      </div>
                    </div>
                    
                    {/* Interactive Code Editor */}
                    <div className="">
                      <CodeExecutor
                        initialCode={codeExample.initial_code}
                        language={codeExample.language}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default TopicRenderer
