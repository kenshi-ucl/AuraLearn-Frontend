'use client'

import { useState } from 'react'
import { Play, RotateCcw, Copy, Eye, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CodeExecutorProps {
  initialCode?: string
  language: string
  onCodeChange?: (code: string) => void
}

export default function CodeExecutor({ 
  initialCode = '', 
  language,
  onCodeChange
}: CodeExecutorProps) {
  const [code, setCode] = useState(initialCode)
  const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor')
  const [splitView, setSplitView] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const executeCode = async () => {
    setIsRunning(true)
    try {
      // For HTML, show the result immediately
      if (language === 'html') {
        // Basic HTML validation
        if (code.trim() === '') {
          alert('Please enter some HTML code to run.')
          setIsRunning(false)
          return
        }
        setTimeout(() => {
          setIsRunning(false)
          setActiveTab('output')
        }, 300)
      } else {
        // For other languages, simulate execution
        setTimeout(() => {
          setIsRunning(false)
          setActiveTab('output')
        }, 500)
      }
    } catch (error) {
      console.error('Error executing code:', error)
      alert('An error occurred while running the code. Please try again.')
      setIsRunning(false)
    }
  }



  const resetCode = () => {
    setCode(initialCode)
    onCodeChange?.(initialCode)
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      // Optional: Add visual feedback
      alert('Code copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy code:', error)
      alert('Failed to copy code. Please try again.')
    }
  }

  const handleCodeChange = (value: string) => {
    setCode(value)
    onCodeChange?.(value)
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with macOS-style buttons and title */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm font-semibold text-gray-700">Try it Yourself</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyCode}
              className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCode}
              className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Only show when not in split view */}
      {!splitView && (
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'editor'
                  ? 'border-green-500 text-green-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" />
              Code Editor
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'output'
                  ? 'border-green-500 text-green-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Result
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="relative">
        {splitView ? (
          /* Split View - Editor and Result side by side */
          <div className="flex">
            {/* Left Side - Code Editor */}
            <div className="w-1/2 bg-white border-r border-gray-200">
              <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {language.toUpperCase()} Editor
                </span>
              </div>
              <div className="relative code-editor-container">
                <textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-96 font-mono text-sm bg-gray-50 text-gray-800 border-none outline-none resize-none code-textarea"
                  style={{
                    lineHeight: '1.5rem',
                    tabSize: 2,
                    paddingLeft: '3.5rem',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    paddingRight: '1rem'
                  }}
                  spellCheck={false}
                />
                {/* Line Numbers */}
                <div className="absolute left-0 top-0 h-full w-12 bg-gray-50 border-r border-gray-100 pointer-events-none">
                  <div 
                    className="font-mono text-sm text-gray-400 line-numbers-container"
                    style={{
                      paddingTop: '1rem',
                      paddingBottom: '1rem',
                      paddingLeft: '0.5rem',
                      paddingRight: '0.5rem',
                      lineHeight: '1.5rem'
                    }}
                  >
                    {code.split('\n').map((_, index) => (
                      <div 
                        key={index} 
                        className="text-right line-number-item"
                        style={{
                          height: '1.5rem',
                          lineHeight: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end'
                        }}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Result */}
            <div className="w-1/2 bg-white">
              <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Output Result
                </span>
                <span className="text-xs text-gray-500">Live Preview</span>
              </div>
              <div className="h-96 bg-white">
                {language === 'html' ? (
                  <iframe
                    srcDoc={
                      code?.includes('<head>') 
                        ? code.replace('<head>', `<head>
                            <base href="about:blank" target="_self">
                            <script>
                              document.addEventListener('DOMContentLoaded', function() {
                                document.addEventListener('click', function(e) {
                                  const target = e.target.closest('a[href^="#"]');
                                  if (target) {
                                    e.preventDefault();
                                    const hash = target.getAttribute('href').substring(1);
                                    const element = document.getElementById(hash);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }
                                });
                              });
                            </script>`)
                        : code
                    }
                    className="w-full h-full border-none"
                    title="HTML Output"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-top-navigation-by-user-activation"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="p-4 h-full overflow-auto">
                    <div className="bg-gray-50 border border-gray-100 rounded p-4 h-full">
                      <div className="text-sm text-gray-600 mb-2">Code Preview:</div>
                      <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap overflow-auto">
                        {code || 'No code to display'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Single View - Tab based */
          activeTab === 'editor' ? (
            /* Code Editor Panel */
            <div className="bg-white">
              <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {language.toUpperCase()} Editor
                </span>
              </div>
              <div className="relative code-editor-container">
                <textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-96 font-mono text-sm bg-gray-50 text-gray-800 border-none outline-none resize-none code-textarea"
                  style={{
                    lineHeight: '1.5rem',
                    tabSize: 2,
                    paddingLeft: '3.5rem',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    paddingRight: '1rem'
                  }}
                  spellCheck={false}
                />
                {/* Line Numbers */}
                <div className="absolute left-0 top-0 h-full w-12 bg-gray-50 border-r border-gray-100 pointer-events-none">
                  <div 
                    className="font-mono text-sm text-gray-400 line-numbers-container"
                    style={{
                      paddingTop: '1rem',
                      paddingBottom: '1rem',
                      paddingLeft: '0.5rem',
                      paddingRight: '0.5rem',
                      lineHeight: '1.5rem'
                    }}
                  >
                    {code.split('\n').map((_, index) => (
                      <div 
                        key={index} 
                        className="text-right line-number-item"
                        style={{
                          height: '1.5rem',
                          lineHeight: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end'
                        }}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Output Panel */
            <div className="bg-white">
              <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Output Result
                </span>
                <span className="text-xs text-gray-500">Live Preview</span>
              </div>
              <div className="h-96 bg-white">
                {language === 'html' ? (
                  <iframe
                    srcDoc={
                      code?.includes('<head>') 
                        ? code.replace('<head>', `<head>
                            <base href="about:blank" target="_self">
                            <script>
                              document.addEventListener('DOMContentLoaded', function() {
                                document.addEventListener('click', function(e) {
                                  const target = e.target.closest('a[href^="#"]');
                                  if (target) {
                                    e.preventDefault();
                                    const hash = target.getAttribute('href').substring(1);
                                    const element = document.getElementById(hash);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }
                                });
                              });
                            </script>`)
                        : code
                    }
                    className="w-full h-full border-none"
                    title="HTML Output"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="p-4 h-full overflow-auto">
                    <div className="bg-gray-50 border border-gray-100 rounded p-4 h-full">
                      <div className="text-sm text-gray-600 mb-2">Code Preview:</div>
                      <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap overflow-auto">
                        {code || 'No code to display'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Bottom Action Bar with Run button only */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-end">
          <Button
            onClick={executeCode}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-8 py-2 font-medium rounded-md transition-colors shadow-sm"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2 fill-current" />
                Run »
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}


