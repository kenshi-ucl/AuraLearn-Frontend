'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/header'
import TutorialLayout from '@/components/tutorial-layout'
import CodeExecutor from '@/components/code-executor'
import ActivityContainer from '@/components/activity-container'
import TopicRenderer from '@/components/topic-renderer'
import { Code2 } from 'lucide-react'
import { getCourseBySlug, formatActivityForUI, type Course, type Lesson, type Activity, type UIActivity } from '@/lib/course-api'
import { Spin, Alert } from 'antd'

export default function HTMLTutorial() {
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [activities, setActivities] = useState<UIActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch course data by slug
        const response = await getCourseBySlug('html5-tutorial')
        setCourse(response.course)
        setLessons(response.course.lessons || [])
        
        // Set the first lesson as current
        if (response.course.lessons && response.course.lessons.length > 0) {
          const firstLesson = response.course.lessons[0]
          setCurrentLesson(firstLesson)
          
          
          // Convert backend activities to UI format
          if (firstLesson.activities && firstLesson.activities.length > 0) {
            const uiActivities = firstLesson.activities.map(formatActivityForUI)
            setActivities(uiActivities)
          }
        }
      } catch (err) {
        console.error('Failed to load course data:', err)
        setError(`Failed to load course content: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    loadCourseData()
  }, [])

  const handleActivityComplete = (activityId: string) => {
    console.log(`Activity ${activityId} completed!`)
    // Here you could save progress to localStorage or send to backend
  }

  // Get current lesson index
  const getCurrentLessonIndex = () => {
    return lessons.findIndex(lesson => lesson.id === currentLesson?.id)
  }

  // Navigation handlers
  const handleNext = () => {
    const currentIndex = lessons.findIndex(lesson => lesson.id === currentLesson?.id)
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1]
      setCurrentLesson(nextLesson)
      
      // Load activities for the next lesson
      if (nextLesson.activities && nextLesson.activities.length > 0) {
        const uiActivities = nextLesson.activities.map(formatActivityForUI)
        setActivities(uiActivities)
      } else {
        setActivities([])
      }
    }
  }

  const handlePrevious = () => {
    const currentIndex = lessons.findIndex(lesson => lesson.id === currentLesson?.id)
    if (currentIndex > 0) {
      const prevLesson = lessons[currentIndex - 1]
      setCurrentLesson(prevLesson)
      
      // Load activities for the previous lesson
      if (prevLesson.activities && prevLesson.activities.length > 0) {
        const uiActivities = prevLesson.activities.map(formatActivityForUI)
        setActivities(uiActivities)
      } else {
        setActivities([])
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Loading course content...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state with fallback
  if (error || !course) {
    // Fallback state for offline content
    const [fallbackCurrentIndex, setFallbackCurrentIndex] = useState(0)
    
    // Fallback to static content if API fails
    const fallbackCourse = {
      title: 'HTML5 Tutorial',
      description: 'HTML is the standard markup language for Web pages.',
    }
    
    const fallbackLessons = ['HTML Introduction', 'HTML Editors', 'HTML Basic']
    const fallbackCurrentTopic = fallbackLessons[fallbackCurrentIndex]
    
    // Fallback navigation handlers
    const handleFallbackNext = () => {
      if (fallbackCurrentIndex < fallbackLessons.length - 1) {
        setFallbackCurrentIndex(fallbackCurrentIndex + 1)
      }
    }

    const handleFallbackPrevious = () => {
      if (fallbackCurrentIndex > 0) {
        setFallbackCurrentIndex(fallbackCurrentIndex - 1)
      }
    }
    
    // Dynamic content based on current lesson
    const getLessonContent = (index: number) => {
      const contents = [
        // HTML Introduction
        `<!DOCTYPE html>
<html>
<head>
<title>HTML Introduction</title>
</head>
<body>

<h1>What is HTML?</h1>
<p>HTML stands for <strong>Hyper Text Markup Language</strong></p>
<p>HTML is the standard markup language for creating Web pages</p>
<p>HTML describes the structure of a Web page</p>

</body>
</html>`,
        // HTML Editors
        `<!DOCTYPE html>
<html>
<head>
<title>HTML Editors</title>
</head>
<body>

<h1>HTML Editors</h1>
<p>You can edit HTML files using:</p>
<ul>
  <li><strong>Visual Studio Code</strong> - Popular and free</li>
  <li><strong>Sublime Text</strong> - Fast and lightweight</li>
  <li><strong>Notepad++</strong> - Simple and effective</li>
</ul>

</body>
</html>`,
        // HTML Basic
        `<!DOCTYPE html>
<html>
<head>
<title>HTML Basic Structure</title>
</head>
<body>

<h1>HTML Basic Structure</h1>
<p>Every HTML document has these basic elements:</p>
<ul>
  <li><code>&lt;!DOCTYPE html&gt;</code> - Document type declaration</li>
  <li><code>&lt;html&gt;</code> - Root element</li>
  <li><code>&lt;head&gt;</code> - Contains metadata</li>
  <li><code>&lt;body&gt;</code> - Contains visible content</li>
</ul>

</body>
</html>`
      ]
      return contents[index] || contents[0]
    }

    const fallbackExample = getLessonContent(fallbackCurrentIndex)

    // Dynamic activities based on current lesson
    const getLessonActivity = (index: number) => {
      const activities = [
        // HTML Introduction Activity
        {
          id: 'html-introduction-activity',
          title: 'HTML Introduction Practice',
          description: 'Create your first HTML page with basic structure and content',
          instructions: [
            'Start with the HTML5 DOCTYPE declaration',
            'Create the basic HTML structure with html, head, and body tags',
            'Add a title "My First HTML Page" in the head section',
            'Add an h1 heading that says "Welcome to HTML!"',
            'Add a paragraph explaining what HTML is'
          ],
          initialCode: `<!DOCTYPE html>
<html>
<head>
    <!-- Add your title here -->
</head>
<body>
    <!-- Add your heading and paragraph here -->
</body>
</html>`,
          expectedCode: `<!DOCTYPE html>
<html>
<head>
    <title>My First HTML Page</title>
</head>
<body>
    <h1>Welcome to HTML!</h1>
    <p>HTML is the markup language for creating web pages</p>
</body>
</html>`,
          expectedOutput: 'Welcome to HTML!',
          hints: [
            'Remember to add a <title> tag inside the <head> section',
            'Use <h1> tags for the main heading',
            'Use <p> tags for paragraphs about HTML',
            'Make sure all tags are properly closed'
          ]
        },
        // HTML Editors Activity
        {
          id: 'html-editors-activity',
          title: 'HTML Editors Practice',
          description: 'Create a page listing different HTML editors',
          instructions: [
            'Create an HTML page with proper structure',
            'Add a title "HTML Editors" in the head',
            'Add an h1 heading "Best HTML Editors"',
            'Create an unordered list with at least 3 HTML editors',
            'Use <strong> tags to highlight editor names'
          ],
          initialCode: `<!DOCTYPE html>
<html>
<head>
    <title>HTML Editors</title>
</head>
<body>
    <!-- Add your heading and list here -->
</body>
</html>`,
          expectedCode: `<!DOCTYPE html>
<html>
<head>
    <title>HTML Editors</title>
</head>
<body>
    <h1>Best HTML Editors</h1>
    <ul>
        <li><strong>Visual Studio Code</strong></li>
        <li><strong>Sublime Text</strong></li>
        <li><strong>Atom</strong></li>
    </ul>
</body>
</html>`,
          expectedOutput: 'Best HTML Editors',
          hints: [
            'Use <ul> for unordered lists',
            'Use <li> for list items',
            'Use <strong> to make text bold',
            'Include at least 3 popular editors'
          ]
        },
        // HTML Basic Activity
        {
          id: 'html-basic-activity',
          title: 'HTML Basic Structure',
          description: 'Practice creating proper HTML document structure',
          instructions: [
            'Create a complete HTML document',
            'Add DOCTYPE declaration',
            'Include meta charset and viewport tags',
            'Add a title "HTML Structure"',
            'Create a main heading and explain each HTML element'
          ],
          initialCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Add meta tags and title -->
</head>
<body>
    <!-- Add content explaining HTML structure -->
</body>
</html>`,
          expectedCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Structure</title>
</head>
<body>
    <h1>HTML Document Structure</h1>
    <p>Every HTML document contains these essential elements</p>
</body>
</html>`,
          expectedOutput: 'HTML Document Structure',
          hints: [
            'Add charset meta tag for proper encoding',
            'Include viewport meta tag for responsive design',
            'Use descriptive title in the head section',
            'Structure your content with proper headings and paragraphs'
          ]
        }
      ]
      return activities[index] || activities[0]
    }

    const fallbackActivity = getLessonActivity(fallbackCurrentIndex)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Alert
            message="Using Offline Content"
            description={`API connection failed: ${error}. Showing static content for demonstration.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </div>
        <TutorialLayout
          title={fallbackCourse.title}
          description={fallbackCourse.description}
          currentTopic={fallbackCurrentTopic}
          topics={fallbackLessons}
          onNext={handleFallbackNext}
          onPrevious={handleFallbackPrevious}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="space-y-12">
                <div className="bg-white rounded-2xl p-8 text-gray-900 border border-gray-200">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
                      <Code2 className="w-8 h-8 text-gray-700" />
                    </div>
                    <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{fallbackLessons[fallbackCurrentIndex]}</h1>
                    <p className="text-gray-600 text-lg">
                      {fallbackCurrentIndex === 0 && "Learn what HTML is and why it's important for web development"}
                      {fallbackCurrentIndex === 1 && "Discover the best tools and editors for writing HTML code"}
                      {fallbackCurrentIndex === 2 && "Understand the basic structure that every HTML document needs"}
                    </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 mb-8">
                  <CodeExecutor
                    initialCode={fallbackExample}
                    language="html"
                  />
                </div>
                
                <div className="mt-8">
                  <ActivityContainer
                    activity={fallbackActivity}
                    onComplete={handleActivityComplete}
                  />
                </div>
              </div>
            </div>
          </div>
        </TutorialLayout>
      </div>
    )
  }

  // Get topic titles for sidebar navigation
  const topicTitles = lessons.map(lesson => lesson.title)
  const currentTopicTitle = currentLesson?.title || 'HTML Introduction'
  const currentIndex = getCurrentLessonIndex()

  // Get current lesson content and code examples
  const lessonContent = currentLesson?.content || '<h2>Welcome to HTML!</h2><p>Loading lesson content...</p>'
  
  // Only show course title/description on first lesson, otherwise show lesson title
  const displayTitle = currentIndex === 0 ? course.title : (currentLesson?.title || course.title)
  const displayDescription = currentIndex === 0 ? (course.description || '') : (currentLesson?.description || '')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      <TutorialLayout
        title={displayTitle}
        description={displayDescription}
        currentTopic={currentTopicTitle}
        topics={topicTitles}
        onNext={handleNext}
        onPrevious={handlePrevious}
        showCourseInfo={currentIndex === 0}
      >
        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Main Content Area */}
            <div className="space-y-12">

              {/* Topics Section - Display topics with their content and code examples */}
              {currentLesson?.topics && currentLesson.topics.length > 0 && (
                <div className="mt-16 mb-16">
                  <TopicRenderer topics={currentLesson.topics} />
                </div>
              )}

              {/* Dynamic Activities Section */}
              <div className="space-y-12">
                {activities.map((activity) => (
                  <div key={activity.id} className="mt-8">
                    <ActivityContainer
                      activity={activity}
                      onComplete={handleActivityComplete}
                    />
                  </div>
                ))}
              </div>

              {/* Fallback message if no content */}
              {!currentLesson?.content && (!currentLesson?.topics || currentLesson.topics.length === 0) && activities.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                  <Code2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Content Available</h3>
                  <p className="text-gray-600">
                    This lesson doesn't have content yet. Please add content through the admin panel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </TutorialLayout>
    </div>
  )
}


