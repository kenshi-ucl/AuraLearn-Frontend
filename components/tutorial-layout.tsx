'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Menu, X, BookOpen, Home, ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface TutorialLayoutProps {
  title: string
  description: string
  currentTopic: string
  topics: string[]
  children: React.ReactNode
  onNext?: () => void
  onPrevious?: () => void
  showCourseInfo?: boolean
}

export default function TutorialLayout({
  title,
  description,
  currentTopic,
  topics,
  children,
  onNext,
  onPrevious,
  showCourseInfo = false
}: TutorialLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const currentIndex = topics.indexOf(currentTopic)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Left Sidebar - Navigation */}
        <aside className={`
          fixed lg:sticky lg:top-16 inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out lg:h-[calc(100vh-4rem)] flex-shrink-0
          ${sidebarCollapsed ? 'w-20' : 'w-80'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full bg-white border-r border-gray-200 overflow-hidden flex flex-col shadow-lg">
            {/* Sidebar Header */}
            <div className="bg-gradient-to-r from-[#9929EA] to-[#B84AE8] text-white flex-shrink-0">
              {!sidebarCollapsed ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{title}</h3>
                        <p className="text-white/80 text-xs">Complete Course</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSidebarCollapsed(true)}
                        className="hidden lg:flex text-white hover:bg-white/20 rounded-xl p-2"
                        title="Collapse sidebar"
                      >
                        <PanelLeftClose className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSidebarOpen(false)} 
                        className="lg:hidden text-white hover:bg-white/20 rounded-xl"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="bg-white/20 rounded-full h-1.5 mb-2">
                    <div 
                      className="bg-white rounded-full h-1.5 transition-all duration-500"
                      style={{ width: `${((currentIndex + 1) / topics.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/90">
                    <span>{currentIndex + 1} of {topics.length}</span>
                    <span>{Math.round(((currentIndex + 1) / topics.length) * 100)}% Complete</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSidebarCollapsed(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 w-full"
                    title="Expand sidebar"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                  <div className="mt-2 text-xs text-white/90">
                    {currentIndex + 1}/{topics.length}
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <nav className={`py-4 space-y-1 ${sidebarCollapsed ? 'px-1' : 'px-2'}`}>
                {topics.map((topic, index) => {
                  const isCompleted = index < currentIndex
                  const isCurrent = topic === currentTopic
                  const isLocked = index > currentIndex + 1
                  
                  return (
                    <Link
                      key={topic}
                      href={`#${topic.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`
                        group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200
                        ${sidebarCollapsed ? 'p-3 justify-center mx-1' : 'p-3 ml-1 mr-2'}
                        ${isCurrent 
                          ? 'bg-[#9929EA] text-white shadow-md border-l-4 border-[#B84AE8]' 
                          : isCompleted
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 border-l-4 border-green-400'
                          : isLocked
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-[#9929EA] hover:text-white border border-gray-200 hover:border-[#9929EA] hover:shadow-sm'
                        }
                      `}
                      title={sidebarCollapsed ? topic : ''}
                    >
                      {sidebarCollapsed ? (
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                          ${isCurrent 
                            ? 'bg-white text-[#9929EA] border-2 border-white' 
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : isLocked
                            ? 'bg-gray-300 text-gray-500'
                            : 'bg-[#9929EA] text-white group-hover:bg-white group-hover:text-[#9929EA]'
                          }
                        `}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 w-full">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                            ${isCurrent 
                              ? 'bg-white text-[#9929EA] border-2 border-white' 
                              : isCompleted
                              ? 'bg-green-500 text-white'
                              : isLocked
                              ? 'bg-gray-300 text-gray-500'
                              : 'bg-[#9929EA] text-white group-hover:bg-white group-hover:text-[#9929EA]'
                            }
                          `}>
                            {isCompleted ? '✓' : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">{topic}</div>
                            {isCurrent && (
                              <div className="text-xs text-white/90 mt-1">Currently Learning</div>
                            )}
                            {isCompleted && (
                              <div className="text-xs text-green-600 mt-1">Completed</div>
                            )}
                            {isLocked && (
                              <div className="text-xs text-gray-500 mt-1">Locked</div>
                            )}
                          </div>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </nav>
              
              {/* Bottom Navigation */}
              {!sidebarCollapsed && (
                <div className="mt-auto pt-4 border-t border-gray-200 space-y-2 px-4 pb-4 bg-white">
                  <Link href="/" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:text-[#9929EA] hover:bg-gray-50 transition-colors">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Back to Home</span>
                  </Link>
                  <Link href="/dashboard" className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:text-[#9929EA] hover:bg-gray-50 transition-colors">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area - Dynamically positioned */}
        <main className="flex-1 min-h-screen">
          {/* Top Navigation Bar */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Menu
                  </Button>
                  
                  <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
                    <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/tutorials" className="hover:text-purple-600 transition-colors">Tutorials</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-purple-600 font-medium">{title}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {currentIndex > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onPrevious}
                      className="hidden sm:flex border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                  )}
                  {currentIndex < topics.length - 1 && (
                    <Button 
                      size="sm"
                      onClick={onNext}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Page Header */}
          <div className="bg-white text-gray-900 border-b border-gray-200 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{title}</h1>
                  <p className="text-xl text-gray-600 mb-4">{description}</p>
                  {/* Only show course info on first lesson */}
                  {showCourseInfo && (
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-gray-600">Free Course</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-600">{topics.length} Lessons</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-600">Beginner Friendly</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="py-8">
            {children}
          </div>

          {/* Bottom Navigation */}
          <div className="bg-white border-t border-gray-200 py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  {currentIndex > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={onPrevious}
                      className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      {topics[currentIndex - 1]}
                    </Button>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Lesson {currentIndex + 1} of {topics.length}</div>
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full h-2 transition-all duration-500"
                      style={{ width: `${((currentIndex + 1) / topics.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {currentIndex < topics.length - 1 && (
                    <Button 
                      onClick={onNext}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3"
                    >
                      {topics[currentIndex + 1]}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


