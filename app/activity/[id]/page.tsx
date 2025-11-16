'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, RotateCcw, Lightbulb, Target, CheckCircle2, Trophy, Star, Sparkles, ChevronDown, ChevronUp, BookOpen, MessageCircle, BarChart3, CheckSquare, Bot, X, Send, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getActivityById, formatActivityForUI, submitActivity, getActivitySubmissionStatus, type Activity, type UIActivity } from '@/lib/course-api'
import { Spin, Alert } from 'antd'
import { auraBotAPI, type AuraBotResponse, type SessionStatus } from '@/lib/aurabot-api'
import { debugSubmissionResponse, isActivityCompleted } from './debug-submission'
import { NotificationBadge, NotificationBadgeLarge } from '@/components/ui/notification-badge'

// Add slideDown animation styles
const dropdownStyles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 500px;
    }
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out forwards;
  }
  
  @keyframes fadeInSlideRight {
    from {
      opacity: 0;
      transform: translate(100px, -50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(0, -50%) scale(1);
    }
  }
  
  .animate-fadeInSlideRight {
    animation: fadeInSlideRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
`

// Floating AuraBot Button Component
const FloatingAuraBotButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onClick}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 animate-bounce"
        title="Open AuraBot"
      >
        <Bot className="h-8 w-8" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
      </button>
    </div>
  )
}

// Enhanced Confetti animation component
const ConfettiPiece = ({ delay, duration, left, index }: { delay: number; duration: number; left: number; index: number }) => {
  const [isClient, setIsClient] = useState(false)
  const [dimensions, setDimensions] = useState({ shape: 'circle', color: '#fbbf24', width: '8px', height: '8px' })
  
  useEffect(() => {
    setIsClient(true)
    
    // Use index as seed for deterministic but varied results
  const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316']
  const shapes = ['circle', 'square', 'triangle']
    const shape = shapes[index % shapes.length]
    const color = colors[index % colors.length]
    const isLarge = (index % 3) === 0 // Every 3rd piece is larger
    
    setDimensions({
      shape,
      color,
      width: shape === 'triangle' ? '0' : isLarge ? '8px' : '6px',
      height: shape === 'triangle' ? '0' : isLarge ? '8px' : '6px'
    })
  }, [index])

  if (!isClient) {
    return null // Avoid hydration mismatch by not rendering on server
  }
  
  return (
    <div
      className={`absolute opacity-90 ${dimensions.shape === 'circle' ? 'rounded-full' : dimensions.shape === 'triangle' ? 'triangle' : ''}`}
      style={{
        left: `${left}%`,
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: dimensions.shape === 'triangle' ? 'transparent' : dimensions.color,
        borderLeft: dimensions.shape === 'triangle' ? '4px solid transparent' : 'none',
        borderRight: dimensions.shape === 'triangle' ? '4px solid transparent' : 'none',
        borderBottom: dimensions.shape === 'triangle' ? `8px solid ${dimensions.color}` : 'none',
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
      }}
    >
      <style jsx>{`
        div {
          animation: enhanced-confetti-fall linear infinite;
        }
        @keyframes enhanced-confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 1;
            transform: translateY(-50vh) rotate(360deg) scale(1.2);
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Submission Result Modal Component
const SubmissionResultModal = ({ isVisible, onClose, data }: {
  isVisible: boolean,
  onClose: () => void,
  data: any
}) => {
  if (!isVisible || !data) return null

  const isSuccess = data.completion_status === 'completed'
  
  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 z-[10000] ${isVisible ? 'block' : 'hidden'}`}
      style={{ zIndex: 10000 }}
    >
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 backdrop-blur-md bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="bg-[var(--surface)] bg-opacity-95 dark:bg-opacity-98 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden shadow-2xl border border-[var(--border)] border-opacity-30 z-20"
        style={{
          animation: 'submission-modal-popup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Background Decoration */}
        <div className={`absolute inset-0 ${isSuccess ? 'bg-gradient-to-br from-green-50 via-emerald-25 to-teal-50' : 'bg-gradient-to-br from-red-50 via-orange-25 to-yellow-50'} opacity-60 rounded-3xl`}></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="mb-6 relative">
            <div 
              className={`mx-auto h-24 w-24 ${isSuccess ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}
              style={{
                animation: 'icon-bounce 0.6s ease-out 0.2s',
                boxShadow: `0 0 0 12px ${isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`
              }}
            >
              {isSuccess ? (
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              ) : (
                <span className="text-4xl">😢</span>
              )}
            </div>
          </div>
          
          {/* Title */}
          <h2 className={`text-2xl font-bold mb-3 ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
            {isSuccess ? 'Great Job!' : 'Not Quite Right'}
          </h2>
          
          {/* Message */}
          <p className="text-[var(--text-secondary)] mb-6">
            {isSuccess 
              ? `You've successfully completed the activity!`
              : 'Your code is incorrect. Please try again.'}
          </p>
          
          {/* Validation Results */}
          {data.validation_summary && (
            <div className="mb-6 text-left bg-white dark:bg-gray-800 rounded-lg p-4 shadow-inner">
              <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-2">Validation Results:</h3>
              
              {/* Overall Progress */}
              {data.validation_summary.overall && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[var(--text-secondary)]">Overall Progress</span>
                    <span className={`text-xs font-medium ${
                      data.validation_summary.overall.passed === data.validation_summary.overall.total 
                        ? 'text-green-600' 
                        : 'text-orange-600'
                    }`}>
                      {data.validation_summary.overall.passed}/{data.validation_summary.overall.total} Checks Passed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        data.validation_summary.overall.passed === data.validation_summary.overall.total 
                          ? 'bg-green-500' 
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${(data.validation_summary.overall.passed / data.validation_summary.overall.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Individual Checks */}
              <div className="space-y-2">
                {data.validation_summary.structure_validation && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Structure Validation</span>
                    <span className={data.validation_summary.structure_validation.valid ? 'text-green-600' : 'text-red-600'}>
                      {data.validation_summary.structure_validation.valid ? '✓ Passed' : '✗ Failed'}
                    </span>
                  </div>
                )}
                
                {data.validation_summary.required_elements && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Required Elements</span>
                    <span className={`${
                      data.validation_summary.required_elements.found === data.validation_summary.required_elements.required 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {data.validation_summary.required_elements.found}/{data.validation_summary.required_elements.required}
                    </span>
                  </div>
                )}
                
                {data.validation_summary.content_validation && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Content Validation</span>
                    <span className={data.validation_summary.content_validation.valid ? 'text-green-600' : 'text-red-600'}>
                      {data.validation_summary.content_validation.valid ? '✓ Passed' : '✗ Failed'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Attempt Number */}
          <p className="text-xs text-[var(--text-tertiary)] mb-4">
            Attempt #{data.attempt_number || 1}
          </p>
          
          {/* Button */}
          <Button
            onClick={onClose}
            className={`w-full ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {isSuccess ? 'Continue' : 'Try Again'}
          </Button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes submission-modal-popup {
          0% {
            transform: scale(0.8) translateY(20px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes icon-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}

// Celebration overlay component
const CelebrationOverlay = ({ 
  isVisible, 
  onClose, 
  activityTitle, 
  activityNumber 
}: { 
  isVisible: boolean
  onClose: () => void
  activityTitle: string
  activityNumber: number
}) => {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true)
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 6000) // Extended to 6 seconds for better effect
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
      {/* Overlay Background with Glassmorphism */}
      <div className="absolute inset-0 bg-[var(--surface)] bg-opacity-10 dark:bg-opacity-20"></div>
      
      {/* Enhanced Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
          {Array.from({ length: 80 }).map((_, i) => (
            <ConfettiPiece
              key={i}
              index={i}
              delay={i * 50 + (i % 7) * 200} // Deterministic delay based on index
              duration={4000 + (i % 5) * 500} // Deterministic duration variation
              left={(i % 20) * 5 + (i % 3) * 3} // Deterministic left position
            />
          ))}
        </div>
      )}

      {/* Celebration Card */}
      <div 
        className="bg-[var(--surface)] bg-opacity-95 dark:bg-opacity-98 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden shadow-2xl border border-[var(--border)] border-opacity-30 z-20"
        style={{
          animation: 'celebration-popup 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Background Decoration with Glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-25 to-yellow-50 opacity-60 rounded-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Trophy Icon with Enhanced Animation */}
          <div className="mb-8 relative">
            <div 
              className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white border-opacity-50"
              style={{ 
                animation: 'trophy-bounce 1.2s ease-in-out infinite alternate',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
                boxShadow: '0 15px 35px rgba(251, 191, 36, 0.4), 0 5px 15px rgba(0, 0, 0, 0.12)'
              }}
            >
              <Trophy className="w-12 h-12 text-white drop-shadow-sm" />
            </div>
            {/* Enhanced Sparkle effects */}
            <Sparkles className="w-7 h-7 text-yellow-400 absolute -top-1 right-6 animate-pulse drop-shadow-sm" />
            <Star className="w-5 h-5 text-pink-400 absolute bottom-1 left-5 animate-ping drop-shadow-sm" />
            <Star className="w-6 h-6 text-blue-400 absolute top-2 left-3 animate-bounce drop-shadow-sm" />
            <Sparkles className="w-4 h-4 text-purple-400 absolute top-4 right-2 animate-pulse animation-delay-500" />
          </div>

          {/* Congratulations Text with Better Typography */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent mb-3 leading-tight">
              Congratulations!
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4"></div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              Activity {activityNumber} Complete! 🎉
            </h2>
            <p className="text-[var(--text-secondary)] text-lg font-medium">
              {activityTitle}
            </p>
          </div>

          {/* Enhanced Success Badge */}
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-8 py-4 rounded-2xl font-bold mb-8 border border-green-200 shadow-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg">Activity Completed Successfully!</span>
          </div>

          {/* Enhanced Action Button */}
          <div className="space-y-4">
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #9333ea 100%)',
                boxShadow: '0 10px 25px rgba(147, 51, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Continue Learning</span>
                <Star className="w-5 h-5 animate-pulse" />
              </span>
            </Button>
            <p className="text-sm text-[var(--text-tertiary)] font-medium">
              Great job! Keep up the excellent work! 💪
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes celebration-popup {
            0% {
              transform: scale(0.3) translateY(100px);
              opacity: 0;
              filter: blur(10px);
            }
            60% {
              transform: scale(1.05) translateY(-5px);
              opacity: 0.9;
              filter: blur(0px);
            }
            100% {
              transform: scale(1) translateY(0);
              opacity: 1;
              filter: blur(0px);
            }
          }
          @keyframes trophy-bounce {
            0% { 
              transform: translateY(0px) scale(1) rotate(0deg); 
              filter: brightness(1);
            }
            100% { 
              transform: translateY(-12px) scale(1.08) rotate(5deg); 
              filter: brightness(1.1);
            }
          }
          .animation-delay-500 {
            animation-delay: 500ms;
          }
        `}</style>
      </div>
    </div>
  )
}

export default function ActivityEditorPage() {
  const params = useParams()
  const router = useRouter()
  const activityId = params?.id as string

  // State for dynamic activity data
  const [activity, setActivity] = useState<UIActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [showHints, setShowHints] = useState(false)
  const [currentHint, setCurrentHint] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [submissionStartTime, setSubmissionStartTime] = useState<Date | null>(null)
  const [validationResults, setValidationResults] = useState<any>(null)
  const [submissionStatus, setSubmissionStatus] = useState<any>(null)
  const [score, setScore] = useState<number>(0)
  const [detailedFeedback, setDetailedFeedback] = useState<string>('')
  const [instructionProgress, setInstructionProgress] = useState<any>(null)
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false)
  const [isInstructionDropdownOpen, setIsInstructionDropdownOpen] = useState(false)
  const [isFeedbackDropdownOpen, setIsFeedbackDropdownOpen] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [submissionModalData, setSubmissionModalData] = useState<any>(null)
  const [showAuraBot, setShowAuraBot] = useState(false) // Only show after 3 attempts
  const [auraBotMinimized, setAuraBotMinimized] = useState(false) // Track minimize state
  const [auraBotMessages, setAuraBotMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'bot';
    message: string;
    timestamp: Date;
  }>>([])
  const [auraBotInput, setAuraBotInput] = useState('')
  const [auraBotLoading, setAuraBotLoading] = useState(false)
  const [auraBotSessionId, setAuraBotSessionId] = useState('')
  const [auraBotSessionStatus, setAuraBotSessionStatus] = useState<SessionStatus | null>(null)
  const [auraBotError, setAuraBotError] = useState<string | null>(null)
  const [auraBotInitialized, setAuraBotInitialized] = useState(false)
  const [codeErrors, setCodeErrors] = useState<Array<{
    line: number;
    column: number;
    length: number;
    message: string;
    severity: 'error' | 'warning';
    type: string;
  }>>([])
  const [showErrorPanel, setShowErrorPanel] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Calculate feedback count for notification badge
  const feedbackCount = (() => {
    let count = 0;
    if (detailedFeedback && !isCompleted) count++;
    if (instructionProgress && !isCompleted) count++;
    if (validationResults && !isCompleted) count++;
    if (showHints) count++;
    return count;
  })()

  // Initialize AuraBot when component mounts
  useEffect(() => {
    const initializeAuraBot = async () => {
      // Get user ID from localStorage for user-specific sessions
      let userId: string | undefined;
      try {
        const userData = localStorage.getItem('auralearn_user');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id?.toString();
        }
      } catch (e) {
        console.warn('Could not get user ID for AuraBot session');
      }

      // Create user and activity-specific session ID
      const sessionId = auraBotAPI.getSessionId(activityId, userId)
      setAuraBotSessionId(sessionId)

      // Load session status
      const status = await auraBotAPI.getSessionStatus(sessionId)
      setAuraBotSessionStatus(status)

      // Load conversation history
      const history = await auraBotAPI.getConversationHistory(sessionId)
      if (history.length > 0) {
        const formattedMessages = history.map(msg => ({
          id: msg.id,
          sender: msg.role === 'user' ? 'user' : 'bot' as 'user' | 'bot',
          message: msg.content,
          timestamp: new Date(msg.timestamp)
        }))
        setAuraBotMessages(formattedMessages)
      } else {
        // Add welcome message for new sessions
        setAuraBotMessages([{
          id: 'welcome',
          sender: 'bot',
          message: "Hi! I'm AuraBot 🤖 I can help you with this HTML activity! I'll provide hints and guidance to help you learn. Ask me unlimited questions - I'm here to help! What do you need help with?",
          timestamp: new Date()
        }])
      }

      setAuraBotInitialized(true)
    }

    // Only initialize AuraBot, visibility is controlled separately by attempt count
    initializeAuraBot()
  }, [activityId]) // Depend on activityId to reinitialize for different activities

  // Load activity data from API
  useEffect(() => {
    const loadActivity = async () => {
      if (!activityId) return

      try {
        setLoading(true)
        setError(null)
        
        const response = await getActivityById(activityId)
        const uiActivity = formatActivityForUI(response.activity)
        setActivity(uiActivity)
        setCode(uiActivity.initialCode)
      } catch (err) {
        console.error('Failed to load activity:', err)
        setError(`Failed to load activity: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [activityId])

  useEffect(() => {
    if (activity) {
      setCode(activity.initialCode)
      setSubmissionStartTime(new Date())
      // Load submission status
      loadSubmissionStatus()
    }
  }, [activity])

  // Load user's submission status for this activity
  const loadSubmissionStatus = async () => {
    if (!activityId) return

    try {
      const status = await getActivitySubmissionStatus(activityId)
      setSubmissionStatus(status)
      setAttempts(status.total_attempts)
      setIsCompleted(status.is_completed)
      setScore(status.best_score)
      
      // Show AuraBot only if user already has 3+ attempts and hasn't completed the activity
      if (status.total_attempts >= 3 && !status.is_completed) {
        setShowAuraBot(true)
        setAuraBotMinimized(false) // Ensure it's not minimized when first appearing
      } else {
        setShowAuraBot(false) // Ensure it's hidden for 0, 1, 2 attempts or when completed
        setAuraBotMinimized(false) // Reset minimized state
      }
      
      if (status.max_attempts && status.total_attempts >= status.max_attempts) {
        setMaxAttemptsReached(true)
      }

      // If user has completed this activity, show celebration
      if (status.is_completed && status.latest_submission) {
        setDetailedFeedback(status.latest_submission.feedback)
      }

      // Ensure feedback dropdown starts closed when loading existing activities
      setIsFeedbackDropdownOpen(false)
    } catch (error) {
      console.error('Failed to load submission status:', error)
      // Don't show error for this, just proceed without status
    }
  }

  // Real-time error checking - only for syntax errors
  useEffect(() => {
    if (code && activity) {
      const errors = validateCodeForErrors(code, activity)
      setCodeErrors(errors)
      // Only show error panel for actual syntax errors, not missing elements
      setShowErrorPanel(errors.length > 0 && errors.some(e => e.type === 'syntax-error' || e.type === 'unclosed-tag'))
    }
  }, [code, activity])

  // Comprehensive error validation function - ONLY for actual HTML syntax errors
  const validateCodeForErrors = (userCode: string, activityData: UIActivity) => {
    const errors: Array<{
      line: number;
      column: number;
      length: number;
      message: string;
      severity: 'error' | 'warning';
      type: string;
    }> = []

    const lines = userCode.split('\n')

    // Only check for ACTUAL syntax errors, not missing elements
    lines.forEach((line, lineIndex) => {
      // Check for malformed tags (missing closing >)
      const malformedTags = line.match(/<[^>]*$/g)
      if (malformedTags) {
        malformedTags.forEach(tag => {
          const column = line.indexOf(tag)
          errors.push({
            line: lineIndex + 1,
            column,
            length: tag.length,
            message: 'Malformed HTML tag - missing closing >',
            severity: 'error',
            type: 'syntax-error'
          })
        })
      }

      // Check for invalid nested < characters in tags
      const invalidTags = line.match(/<[^>]*<[^>]*>/g)
      if (invalidTags) {
        invalidTags.forEach(tag => {
          const column = line.indexOf(tag)
          errors.push({
            line: lineIndex + 1,
            column,
            length: tag.length,
            message: 'Invalid nested < character in HTML tag',
            severity: 'error',
            type: 'syntax-error'
          })
        })
      }

      // Check for unmatched quotes in attributes
      const tagMatches = line.match(/<[^>]+>/g) || []
      tagMatches.forEach(tag => {
        const singleQuotes = (tag.match(/'/g) || []).length
        const doubleQuotes = (tag.match(/"/g) || []).length
        
        if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
          const column = line.indexOf(tag)
          errors.push({
            line: lineIndex + 1,
            column,
            length: tag.length,
            message: 'Unmatched quotes in HTML attribute',
            severity: 'error',
            type: 'syntax-error'
          })
        }
      })

      // Check for obvious typos in common tags
      const commonTagTypos = [
        { wrong: '<htlm>', correct: '<html>' },
        { wrong: '<haed>', correct: '<head>' },
        { wrong: '<boyd>', correct: '<body>' },
        { wrong: '<titl>', correct: '<title>' },
        { wrong: '<mta>', correct: '<meta>' }
      ]

      commonTagTypos.forEach(typo => {
        if (line.toLowerCase().includes(typo.wrong)) {
          const column = line.toLowerCase().indexOf(typo.wrong)
          errors.push({
            line: lineIndex + 1,
            column,
            length: typo.wrong.length,
            message: `Possible typo: "${typo.wrong}" should be "${typo.correct}"`,
            severity: 'error',
            type: 'typo'
          })
        }
      })
    })

    // Check for basic unclosed tags (only obvious ones)
    const criticalTags = ['html', 'head', 'body', 'title']
    criticalTags.forEach(tagName => {
      const openTag = `<${tagName}`
      const closeTag = `</${tagName}>`
      const lowerCode = userCode.toLowerCase()
      
      if (lowerCode.includes(openTag) && !lowerCode.includes(closeTag)) {
        // Find the line with the opening tag
        const lineIndex = lines.findIndex(line => line.toLowerCase().includes(openTag))
        if (lineIndex !== -1) {
          const column = lines[lineIndex].toLowerCase().indexOf(openTag)
          errors.push({
            line: lineIndex + 1,
            column,
            length: openTag.length + 1,
            message: `Missing closing tag </${tagName}>`,
            severity: 'error',
            type: 'unclosed-tag'
          })
        }
      }
    })

    return errors
  }

  // Helper function to find best line to insert missing elements
  const findBestInsertionLine = (lines: string[], after: string) => {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(`<${after}`)) {
        return i + 2 // Insert after the opening tag
      }
    }
    return lines.length
  }

  // Handle textarea scroll for line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollOffset(e.currentTarget.scrollTop)
  }

  // Function to just run/preview the code without submitting
  const runCode = () => {
    console.log('🏃 Running code preview...')
    setOutput(code)
  }

  // Function to submit code for validation and scoring
  const submitCode = async () => {
    if (!activity || !submissionStartTime) return
    
    // Check if max attempts reached
    if (maxAttemptsReached) {
      alert('You have reached the maximum number of attempts for this activity.')
      return
    }

    setIsRunning(true)
    
    try {
      // Calculate time spent on this submission
      const timeSpentMinutes = Math.ceil((Date.now() - submissionStartTime.getTime()) / (1000 * 60))
      
      console.log('Submitting activity:', activity.id, 'with code length:', code.length, 'time spent:', timeSpentMinutes)
      
      const submission = await submitActivity(activity.id, code, timeSpentMinutes)
      console.log('Submission response:', submission)
      
      // Debug the submission response
      debugSubmissionResponse(submission, activity.id)
      
      // Check if submission was successful - use completion_status instead of success property
      if (submission.completion_status === 'failed' || submission.completion_status === 'pending') {
        console.error('❌ Submission failed:', submission.feedback)
        setDetailedFeedback(submission.feedback || 'AI validation service is temporarily unavailable. Please try again.')
        setIsCompleted(false)
        setShowCelebration(false)
        setShowAuraBot(false)
        
        // Show submission modal for failed attempts
        setSubmissionModalData(submission)
        setShowSubmissionModal(true)
        setIsRunning(false) // Reset the running state before returning
        return
      }
      
      // Update local state with submission results
      setAttempts(submission.attempt_number || 1)
      setScore(submission.score || 0)
      setValidationResults(submission.validation_summary)
      setDetailedFeedback(submission.feedback)
      setInstructionProgress(submission.instruction_progress)
      
      // Use strict type checking for completion status
      const isCompleted = isActivityCompleted(submission)
      setIsCompleted(isCompleted)
      
      // Show AuraBot only after 3 attempts (not on 1st or 2nd attempt)
      if (submission.attempt_number >= 3 && !submission.is_completed) {
        setShowAuraBot(true)
        setAuraBotMinimized(false) // Ensure it's not minimized when first appearing
      } else {
        setShowAuraBot(false) // Keep hidden for attempts 1-2
      }
      
      // Show submission modal first for all non-completed submissions
      if (isCompleted !== true) {
        // Show the submission modal for failed/incomplete attempts
        setSubmissionModalData(submission)
        setShowSubmissionModal(true)
      }

      // Handle different completion statuses with strict type checking
      if (isCompleted === true) {
        console.log('🎉 Activity completed successfully!')
        // Show celebration overlay for successful completion
        setShowCelebration(true)
        setShowAuraBot(false) // Hide AuraBot when activity is completed
        setAuraBotMinimized(false) // Reset minimized state on completion
        
        // Show celebration data if provided
        if (submission.celebration) {
          console.log('🏆 Celebration:', submission.celebration)
        }
      } else {
        console.log('❌ Activity not completed, status:', submission.completion_status)
        
        // Show hints if available and score is low
        if (submission.hints && submission.hints.length > 0) {
          setShowHints(true)
          setCurrentHint(0) // Reset to first hint
          // Only auto-open feedback dropdown after 3 attempts
          if (submission.attempt_number >= 3) {
            setIsFeedbackDropdownOpen(true) // Auto-open after 3 attempts
          }
        }
        
        // Provide specific feedback based on validation results
        if (submission.validation_summary) {
          console.log('📊 Validation summary:', submission.validation_summary)
          displayValidationFeedback(submission.validation_summary)
          // Only auto-open feedback dropdown after 3 attempts
          if (submission.attempt_number >= 3) {
            setIsFeedbackDropdownOpen(true) // Auto-open after 3 attempts
          }
        }
        
        // Show instruction progress
        if (submission.instruction_progress) {
          console.log('📋 Instruction progress:', submission.instruction_progress)
          try {
            displayInstructionFeedback(submission.instruction_progress)
            // Only auto-open feedback dropdown after 3 attempts
            if (submission.attempt_number >= 3) {
              setIsFeedbackDropdownOpen(true) // Auto-open after 3 attempts
            }
    } catch (error) {
            console.warn('⚠️ Error displaying instruction feedback:', error)
          }
        }
        
        // Auto-open dropdown if there's detailed feedback (after 3 attempts)
        if (submission.feedback && submission.attempt_number >= 3) {
          setIsFeedbackDropdownOpen(true) // Auto-open after 3 attempts
        }
      }
      
      // Reset submission timer for next attempt
      setSubmissionStartTime(new Date())
      
      // Note: No need to reload submission status since we already have the latest data from the submission response
      
    } catch (error) {
      console.error('❌ Activity submission failed:', error)
      
      // Show submission modal with error
      const errorSubmission = {
        completion_status: 'failed',
        attempt_number: attempts + 1,
        feedback: error instanceof Error ? error.message : 'Unknown error occurred',
        validation_summary: {
          overall: { passed: 0, total: 1 }
        }
      }
      setSubmissionModalData(errorSubmission)
      setShowSubmissionModal(true)
      
      // Don't fall back to old validation - force proper submission
      setDetailedFeedback('Submission failed. Please ensure you are logged in and try again.')
      setIsRunning(false) // Reset the running state on error
    } finally {
      setIsRunning(false) // Ensure isRunning is always reset
    }
  }

  // Display detailed validation feedback to help students
  const displayValidationFeedback = (validationSummary: any) => {
    console.log('🔍 Displaying validation feedback:', validationSummary)
    
    if (!validationSummary || !validationSummary.details) {
      console.warn('⚠️ Validation summary or details missing')
      return
    }
    
    const failedChecks = Object.entries(validationSummary.details)
      .filter(([_, result]: [string, any]) => result && !result.passed)
      .map(([check, result]: [string, any]) => `${check.replace(/_/g, ' ')}: ${result.message || 'Failed'}`)
    
    if (failedChecks.length > 0) {
      console.log('❌ Failed validation checks:', failedChecks)
    }
  }

  // Display instruction compliance feedback
  const displayInstructionFeedback = (instructionProgress: any) => {
    console.log('📝 Instruction progress:', instructionProgress)
    
    // Safety check for undefined/null data
    if (!instructionProgress) {
      console.warn('⚠️ Instruction progress is undefined or null')
      return
    }
    
    // Handle cases where details might not exist
    if (!instructionProgress.details) {
      console.log('📋 Instruction progress summary:', `${instructionProgress.completed}/${instructionProgress.total} completed`)
      return
    }
    
    const incompleteInstructions = Object.entries(instructionProgress.details)
      .filter(([_, completed]: [string, any]) => !completed)
      .map(([instruction, _]: [string, any]) => instruction.replace(/_/g, ' '))
    
    if (incompleteInstructions.length > 0) {
      console.log('📋 Incomplete instructions:', incompleteInstructions)
    }
  }


  const normalizeHtml = (html: string): string => {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
      .toLowerCase()
  }

  const extractTextFromHtml = (html: string): string => {
    // Simple text extraction - remove HTML tags
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const resetCode = () => {
    if (activity) {
      setCode(activity.initialCode)
      setOutput('')
      setIsCompleted(false)
      setAttempts(0)
      setCurrentHint(0)
      setShowHints(false)
      setShowAuraBot(false) // Hide AuraBot when resetting
    }
  }

  // Handle AuraBot message submission with RAG integration
  const handleAuraBotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auraBotInput.trim() || auraBotLoading || !auraBotSessionId) return

    // Check if user can ask questions
    if (auraBotSessionStatus && !auraBotSessionStatus.can_ask) {
      setAuraBotError(`You've reached your question limit. ${auraBotSessionStatus.blocked_until ? `Please wait until ${auraBotSessionStatus.blocked_until}` : 'Please try again later.'}`)
      return
    }

    // Add user message immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      message: auraBotInput,
      timestamp: new Date()
    }

    setAuraBotMessages(prev => [...prev, userMessage])
    const currentInput = auraBotInput
    setAuraBotInput('')
    setAuraBotLoading(true)
    setAuraBotError(null)

    try {
        // Get current HTML code and activity instructions for context
        const htmlContext = code || undefined
        const instructionsContext = activity ? 
          `Activity Title: ${activity.title}\nActivity Description: ${activity.description}\n\nInstructions:\n${activity.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}\n\nExpected Output: ${activity.expectedOutput}`
          : undefined
        
        // Build feedback context from previous submissions
        let feedbackContext: string | undefined = undefined
        if (detailedFeedback || instructionProgress || validationResults) {
          const feedbackParts = []
          
          if (detailedFeedback) {
            feedbackParts.push(`Detailed Feedback:\n${detailedFeedback}`)
          }
          
          if (instructionProgress) {
            feedbackParts.push(`Instruction Progress: ${instructionProgress.completed}/${instructionProgress.total} completed (${instructionProgress.percentage}%)`)
          }
          
          if (validationResults?.overall) {
            feedbackParts.push(`Validation Results: ${validationResults.overall.passed}/${validationResults.overall.total} checks passed (${validationResults.overall.percentage}%)`)
          }
          
          if (score > 0) {
            feedbackParts.push(`Current Score: ${score}/100`)
          }
          
          feedbackContext = feedbackParts.join('\n\n')
        }

      // Send question to AuraBot RAG API
      const response = await auraBotAPI.askQuestion(
        auraBotSessionId,
        currentInput,
        htmlContext,
        instructionsContext,
        feedbackContext
      )

      if (response.success && response.response) {
        // Add AI response
        const aiMessage = {
          id: response.message_id || `ai-${Date.now()}`,
          sender: 'bot' as const,
          message: response.response,
          timestamp: new Date()
        }

        setAuraBotMessages(prev => [...prev, aiMessage])

        // Update session status
        if (response.session_info) {
          setAuraBotSessionStatus(prev => prev ? {
            ...prev,
            can_ask: response.remaining_attempts! > 0,
            remaining_attempts: response.remaining_attempts!,
            attempt_count: response.session_info!.attempt_count,
            is_blocked: response.session_info!.is_blocked
          } : null)
        }

      } else {
        // Handle API error
        const errorMessage = {
          id: `error-${Date.now()}`,
          sender: 'bot' as const,
          message: response.error || 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date()
        }
        setAuraBotMessages(prev => [...prev, errorMessage])
        setAuraBotError(response.error || 'An error occurred')
      }

    } catch (error) {
      console.error('AuraBot submission error:', error)
      const errorMessage = {
        id: `error-${Date.now()}`,
        sender: 'bot' as const,
        message: 'I apologize, but I encountered a connection error. Please check your internet connection and try again.',
        timestamp: new Date()
      }
      setAuraBotMessages(prev => [...prev, errorMessage])
      setAuraBotError('Connection error. Please try again.')
    } finally {
      setAuraBotLoading(false)
    }
  }

  const showNextHint = () => {
    if (activity && currentHint < activity.hints.length - 1) {
      setCurrentHint(prev => prev + 1)
    }
    setShowHints(true)
    setIsFeedbackDropdownOpen(true) // Auto-open feedback dropdown to show hints
  }

  const goBack = () => {
    router.back()
  }

  const handleCelebrationClose = () => {
    setShowCelebration(false)
    // Could navigate to next activity or back to lesson
    router.back()
  }

  const handleSubmissionModalClose = () => {
    setShowSubmissionModal(false)
    setSubmissionModalData(null)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-active)] flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-[var(--text-secondary)]">Loading activity...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !activity) {
    return (
      <div className="min-h-screen bg-[var(--surface-active)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Alert
            message="Activity not found"
            description={error || "This activity could not be loaded. It may have been moved or deleted."}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Button onClick={goBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] h-screen overflow-y-auto">
      {/* Dropdown Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: dropdownStyles }} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lesson
              </Button>
              <div className="h-6 w-px bg-[var(--surface)] opacity-30"></div>
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6" />
                <div>
                  <h1 className="text-lg font-semibold">Activity: {activity.title}</h1>
                  <p className="text-purple-100 text-sm">{activity.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isCompleted ? (
                <div className="flex items-center space-x-2 bg-green-500 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Completed! Score: {score}%</span>
                </div>
              ) : score > 0 && (
                <div className="flex items-center space-x-2 bg-blue-500 px-3 py-1 rounded-full">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Score: {score}%</span>
                </div>
              )}
              <div className="text-sm">
                <span>Attempts: {attempts}</span>
                {submissionStatus?.max_attempts && (
                  <span className="text-gray-400 ml-1">/ {submissionStatus.max_attempts}</span>
                )}
            </div>
              {maxAttemptsReached && (
                <div className="flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-white">Max attempts reached</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Navigation Bar with Dropdowns and Action Buttons */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Left Side - Dropdown Buttons */}
            <div className="flex items-center space-x-6">
              {/* Instructions Dropdown Button */}
              <div 
                className="flex items-center space-x-2 cursor-pointer hover:bg-[var(--surface-hover)] px-3 py-2 rounded-lg transition-colors duration-200"
                onClick={() => setIsInstructionDropdownOpen(!isInstructionDropdownOpen)}
              >
                <BookOpen className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-medium text-[var(--text-primary)]">Instructions</h3>
                <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
                  <span className="text-xs font-medium text-purple-700">
                    {activity.instructions.length} Steps
                  </span>
                </div>
                {isInstructionDropdownOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
                )}
              </div>

              {/* Feedback Dropdown Button - Only show after 3 attempts */}
              {attempts >= 3 && (
                <div 
                  className="flex items-center space-x-2 cursor-pointer hover:bg-[var(--surface-hover)] px-3 py-2 rounded-lg transition-colors duration-200"
                  onClick={() => setIsFeedbackDropdownOpen(!isFeedbackDropdownOpen)}
                >
                  <div className="relative">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    {feedbackCount > 0 && <NotificationBadge count={feedbackCount} />}
                  </div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">Feedback & Progress</h3>
                  
                  {/* Status Indicators */}
                  <div className="flex items-center space-x-2">
                    {instructionProgress && (
                      <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                        <span className="text-xs font-medium text-blue-700">
                          {instructionProgress.completed}/{instructionProgress.total} Steps
                        </span>
                      </div>
                    )}
                    
                    {validationResults && validationResults.overall && (
                      <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                        <span className="text-xs font-medium text-green-700">
                          {validationResults.overall.passed}/{validationResults.overall.total} Checks
                        </span>
                      </div>
                    )}
                    
                    {detailedFeedback && !isCompleted && (
                      <div className="flex items-center space-x-1 bg-red-100 px-2 py-1 rounded-full">
                        <span className="text-xs font-medium text-red-700">Feedback</span>
                      </div>
                    )}
                    
                    {showHints && (
                      <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full">
                        <span className="text-xs font-medium text-orange-700">Hints Available</span>
                      </div>
                    )}
                  </div>

                  {isFeedbackDropdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={runCode}
                disabled={isRunning}
                variant="outline"
                className="font-semibold px-6 border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Run Preview</span>
              </Button>

              <Button
                onClick={submitCode}
                disabled={isRunning || maxAttemptsReached || isCompleted}
                className={`font-semibold px-6 flex items-center space-x-2 ${
                  isCompleted 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : maxAttemptsReached 
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed</span>
                  </>
                ) : maxAttemptsReached ? (
                  <span>Max Attempts Reached</span>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    <span>Submit & Validate</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Dropdown Content */}
      {isInstructionDropdownOpen && (
        <div className="bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="pb-4 border-t border-[var(--divider)] animate-slideDown">
              <div className="mt-4">
                <div className="space-y-3">
                {activity.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start space-x-3 text-sm text-[var(--text-secondary)]">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                      {index + 1}
                    </span>
                      <span className="leading-relaxed">{instruction}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Dropdown Content - Only show after 3 attempts */}
      {isFeedbackDropdownOpen && attempts >= 3 && (
        <div className="bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="pb-4 border-t border-[var(--divider)] animate-slideDown">
              {/* Detailed Feedback Section */}
              {detailedFeedback && !isCompleted && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg px-4 py-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Feedback</p>
                      <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">{detailedFeedback}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instruction Progress */}
              {instructionProgress && !isCompleted && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg px-4 py-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckSquare className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Instruction Progress: {instructionProgress.completed} / {instructionProgress.total} completed ({instructionProgress.percentage}%)
                      </p>
                      <div className="mt-2 bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${instructionProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Results */}
              {validationResults && validationResults.overall && !isCompleted && (
                <div className="mt-4 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-4 py-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-[var(--surface-active)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BarChart3 className="h-3 w-3 text-[var(--text-secondary)]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Validation: {validationResults.overall.passed} / {validationResults.overall.total} checks passed ({validationResults.overall.percentage}%)
                      </p>
                      <div className="mt-2 bg-[var(--surface-hover)] rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${validationResults.overall.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hints Section */}
              {showHints && (
                <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-lg px-4 py-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="h-3 w-3 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-orange-800">Hint {currentHint + 1} of {activity.hints.length}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentHint(Math.max(0, currentHint - 1))}
                            disabled={currentHint === 0}
                            className="text-xs px-2 py-1 bg-orange-200 text-orange-700 rounded hover:bg-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentHint(Math.min(activity.hints.length - 1, currentHint + 1))}
                            disabled={currentHint === activity.hints.length - 1}
                            className="text-xs px-2 py-1 bg-orange-200 text-orange-700 rounded hover:bg-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-orange-700">{activity.hints[currentHint]}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Content Message */}
              {!detailedFeedback && !instructionProgress && !validationResults && !showHints && (
                <div className="mt-4 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-4 py-3">
            <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[var(--surface-active)] rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-3 w-3 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">No feedback available yet. Submit your code to get feedback!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className={`bg-[var(--background)] ${showAuraBot && !auraBotMinimized ? 'flex flex-col h-[calc(100vh-200px)]' : 'flex h-[calc(100vh-200px)]'}`}>
        {showAuraBot && !auraBotMinimized ? (
          // Layout with AuraBot: Code Editor + AuraBot side by side, Result below left only
          <>
            {/* Top Section: Your Code + AuraBot side by side */}
            <div className="flex h-3/4 bg-[var(--background)]">
              {/* Code Editor - Left Side */}
              <div className="w-3/4 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-hover)] border-b border-[var(--border)]">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Your Code</span>
                <Button
                  variant="outline"
                  size="sm"
                    onClick={resetCode}
                    className="text-xs"
                >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                </Button>
                </div>
                
                <div className="flex-1 relative overflow-hidden code-editor-container">
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onScroll={handleScroll}
                    className="w-full h-full font-mono text-sm bg-[var(--surface)] text-[var(--text-primary)] border-none outline-none resize-none code-textarea"
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
                  
                  {/* Error Underlines - Only for syntax errors */}
                  <div 
                    className="absolute pointer-events-none font-mono text-sm"
                    style={{
                      left: '3.5rem',
                      top: '1rem',
                      right: '1rem',
                      bottom: '1rem',
                      lineHeight: '1.5rem',
                      transform: `translateY(-${scrollOffset}px)`,
                      overflow: 'hidden'
                    }}
                  >
                    {codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').map((error, index) => {
                      const lines = code.split('\n')
                      const lineContent = lines[error.line - 1] || ''
                      const beforeError = lineContent.substring(0, error.column)
                      const errorText = error.length > 0 ? lineContent.substring(error.column, error.column + error.length) : ''
                      
                      return (
                        <div
                          key={index}
                          className="absolute"
                          style={{
                            top: `${(error.line - 1) * 1.5}rem`,
                            left: `${beforeError.length * 0.6}rem`, // Approximate character width
                            width: error.length > 0 ? `${errorText.length * 0.6}rem` : '2rem',
                            height: '1.5rem'
                          }}
                        >
                          {/* Red curly underline like VSCode */}
                          <div 
                            className="absolute bottom-0 left-0 right-0"
                            style={{
                              height: '2px',
                              backgroundImage: `url("data:image/svg+xml,%3csvg width='6' height='3' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M0 3c0-1 1-2 3-2s3 1 3 2' stroke='%23ef4444' stroke-width='1' fill='none'/%3e%3c/svg%3e")`,
                              backgroundRepeat: 'repeat-x',
                              backgroundPosition: 'bottom'
                            }}
                            title={error.message}
                          />
                          {/* Error indicator for missing elements */}
                          {error.type === 'missing-element' && (
                            <div 
                              className="absolute -left-2 top-0 w-4 h-6 flex items-center justify-center"
                              style={{ fontSize: '12px' }}
                              title={error.message}
                            >
                              <span className="text-red-500 font-bold">⚠</span>
                            </div>
              )}
            </div>
                      )
                    })}
          </div>
          
                  {/* Line Numbers with Error Indicators */}
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-[var(--surface-hover)] border-r border-[var(--border)] overflow-hidden">
                    <div 
                      className="font-mono text-sm relative line-numbers-container"
                      style={{
                        transform: `translateY(-${scrollOffset}px)`,
                        paddingTop: '1rem',
                        paddingBottom: '1rem',
                        paddingLeft: '0.5rem',
                        paddingRight: '0.5rem',
                        lineHeight: '1.5rem'
                      }}
                    >
                      {code.split('\n').map((_, index) => {
                        const lineNumber = index + 1
                        const hasError = codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').some(error => error.line === lineNumber)
                        
                        return (
                        <div 
                          key={index} 
                            className={`text-right select-none line-number-item ${
                              hasError ? 'text-red-500 font-semibold' : 'text-gray-400'
                            }`}
                          style={{
                            height: '1.5rem',
                            lineHeight: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                              justifyContent: 'flex-end',
                              position: 'relative'
                          }}
                        >
                            {hasError && (
                              <div className="absolute -left-1 top-0 w-2 h-6 bg-red-500 rounded-r-sm opacity-80"></div>
                            )}
                            {lineNumber}
                        </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* AuraBot - Right Side */}
              <div className="w-1/4 bg-[var(--surface-hover)] flex items-start justify-start p-0 relative z-10">
                <div className="w-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden relative z-20">
                  {/* AuraBot Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <Bot className="h-6 w-6 text-white" />
                        </div>
                <div>
                          <h3 className="font-semibold text-lg">AuraBot</h3>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs opacity-90">Online Now</span>
                </div>
              </div>
                      </div>
                      <button 
                        onClick={() => setAuraBotMinimized(true)}
                        className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                        title="Minimize AuraBot"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 h-80 min-h-[350px] overflow-y-auto bg-[var(--surface-hover)]">
                    <div className="space-y-4">
                      {auraBotMessages.map((msg) => (
                        <div key={msg.id} className={`flex items-start space-x-3 ${
                          msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          {msg.sender === 'bot' ? (
                            // Bot message - left side with bot icon
                            <>
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="bg-[var(--surface)] rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm border border-[var(--divider)] max-w-[85%]">
                                  <p className="text-[var(--text-primary)] text-sm leading-relaxed">{msg.message}</p>
                                </div>
                                <div className="text-xs text-[var(--text-tertiary)] mt-1 px-2">
                                  {msg.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </>
                          ) : (
                            // User message - right side with blue background
                            <>
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 flex justify-end">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-lg px-4 py-3 shadow-sm max-w-[85%]">
                                  <p className="text-sm leading-relaxed">{msg.message}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      
                      {/* Loading indicator */}
                      {auraBotLoading && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-[var(--surface)] rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm border border-[var(--divider)]">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-[var(--text-disabled)] rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-[var(--text-disabled)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-[var(--text-disabled)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
                    {/* Error display */}
                    {auraBotError && (
                      <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
                        <span>{auraBotError}</span>
                        <button onClick={() => setAuraBotError(null)} className="text-red-500 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Session status */}
                  

                    <form onSubmit={handleAuraBotSubmit} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={auraBotInput}
                        onChange={(e) => setAuraBotInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleAuraBotSubmit(e as any)
                          }
                        }}
                        placeholder={
                          auraBotSessionStatus?.can_ask === false 
                            ? "Question limit reached..." 
                            : "Ask AuraBot for help with this activity..."
                        }
                        className="flex-1 px-3 py-2 bg-[var(--surface-active)] rounded-full border-0 focus:ring-2 focus:ring-purple-500 focus:bg-[var(--surface)] transition-colors text-sm text-[var(--text-primary)]"
                        disabled={auraBotLoading || !auraBotInitialized || auraBotSessionStatus?.can_ask === false}
                      />
                      <button 
                        type="submit"
                        className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:transform-none"
                        disabled={auraBotLoading || !auraBotInput.trim() || !auraBotInitialized || auraBotSessionStatus?.can_ask === false}
                      >
                        {auraBotLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 text-white" />
                        )}
                      </button>
                    </form>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
                      {auraBotSessionStatus?.remaining_attempts !== undefined 
                        ? `Powered by AuraLearn`
                        : ''
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Result - Only left 75% width */}
            <div className="flex h-1/4 border-t border-[var(--border)] bg-[var(--surface-active)]">
              {/* Result - Only left side */}
              <div className="w-3/4 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-hover)] border-b border-[var(--border)]">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Result</span>
                  <span className="text-xs text-[var(--text-tertiary)]">Live Preview</span>
                </div>
                
                <div className="flex-1 bg-[var(--surface)]">
                  {output ? (
                    <iframe
                      srcDoc={output}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
                      <span>Run your code to see the result</span>
            </div>
          )}
        </div>
      </div>

              {/* Empty space - Right side (reserved for AuraBot area) */}
              <div className="w-1/4 bg-[var(--surface-hover)] pointer-events-none"></div>
            </div>
          </>
        ) : (
          // Normal layout without AuraBot: 50/50 split
          <>
        {/* Code Editor */}
        <div className="w-1/2 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-hover)] border-b border-[var(--border)]">
            <span className="text-sm font-medium text-[var(--text-primary)]">Your Code</span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetCode}
              className="text-xs"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="flex-1 relative overflow-hidden code-editor-container">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              className="w-full h-full font-mono text-sm bg-[var(--surface)] text-[var(--text-primary)] border-none outline-none resize-none code-textarea"
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
            
            {/* Error Underlines - Only for syntax errors */}
            <div 
              className="absolute pointer-events-none font-mono text-sm"
              style={{
                left: '3.5rem',
                top: '1rem',
                right: '1rem',
                bottom: '1rem',
                lineHeight: '1.5rem',
                transform: `translateY(-${scrollOffset}px)`,
                overflow: 'hidden'
              }}
            >
              {codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').map((error, index) => {
                const lines = code.split('\n')
                const lineContent = lines[error.line - 1] || ''
                const beforeError = lineContent.substring(0, error.column)
                const errorText = error.length > 0 ? lineContent.substring(error.column, error.column + error.length) : ''
                
                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      top: `${(error.line - 1) * 1.5}rem`,
                      left: `${beforeError.length * 0.6}rem`, // Approximate character width
                      width: error.length > 0 ? `${errorText.length * 0.6}rem` : '2rem',
                      height: '1.5rem'
                    }}
                  >
                    {/* Red curly underline like VSCode */}
                    <div 
                      className="absolute bottom-0 left-0 right-0"
                      style={{
                        height: '2px',
                        backgroundImage: `url("data:image/svg+xml,%3csvg width='6' height='3' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M0 3c0-1 1-2 3-2s3 1 3 2' stroke='%23ef4444' stroke-width='1' fill='none'/%3e%3c/svg%3e")`,
                        backgroundRepeat: 'repeat-x',
                        backgroundPosition: 'bottom'
                      }}
                      title={error.message}
                    />
                    {/* Error indicator for missing elements */}
                    {error.type === 'missing-element' && (
                      <div 
                        className="absolute -left-2 top-0 w-4 h-6 flex items-center justify-center"
                        style={{ fontSize: '12px' }}
                        title={error.message}
                      >
                        <span className="text-red-500 font-bold">⚠</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Line Numbers with Error Indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[var(--surface-hover)] border-r border-[var(--border)] overflow-hidden">
              <div 
                className="font-mono text-sm relative line-numbers-container"
                style={{
                  transform: `translateY(-${scrollOffset}px)`,
                  paddingTop: '1rem',
                  paddingBottom: '1rem',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  lineHeight: '1.5rem'
                }}
              >
                {code.split('\n').map((_, index) => {
                  const lineNumber = index + 1
                  const hasError = codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').some(error => error.line === lineNumber)
                  
                  return (
                  <div 
                    key={index} 
                      className={`text-right select-none line-number-item ${
                        hasError ? 'text-red-500 font-semibold' : 'text-gray-400'
                      }`}
                    style={{
                      height: '1.5rem',
                      lineHeight: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                        justifyContent: 'flex-end',
                        position: 'relative'
                    }}
                  >
                      {hasError && (
                        <div className="absolute -left-1 top-0 w-2 h-6 bg-red-500 rounded-r-sm opacity-80"></div>
                      )}
                      {lineNumber}
                  </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-1/2 bg-[var(--surface)] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-hover)] border-b border-[var(--border)]">
            <span className="text-sm font-medium text-[var(--text-primary)]">Result</span>
            <span className="text-xs text-[var(--text-tertiary)]">Live Preview</span>
          </div>
          
          <div className="flex-1 bg-[var(--surface)]">
            {output ? (
              <iframe
                srcDoc={
                  output?.includes('<head>') 
                    ? output.replace('<head>', `<head>
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
                    : output
                }
                className="w-full h-full border-none"
                title="Activity Output"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                Run your code to see the result
              </div>
            )}
        </div>
      </div>

      {/* Error Panel - Only for syntax errors */}
      {showErrorPanel && codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length > 0 && (
        <div className="bg-red-50 border-t border-red-200">
          <div className="px-4 py-2 bg-red-100 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length}</span>
              </div>
              <span className="text-sm font-medium text-red-800">
                {codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length} Syntax Error{codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length !== 1 ? 's' : ''} Found
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorPanel(false)}
              className="text-red-600 hover:text-red-800 hover:bg-red-200"
            >
              ×
            </Button>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').map((error, index) => (
              <div 
                key={index}
                className="px-4 py-2 border-b border-red-100 last:border-b-0 hover:bg-red-100 cursor-pointer"
                onClick={() => {
                  // Focus on the error line
                  if (textareaRef.current) {
                    const lines = code.split('\n')
                    let charPosition = 0
                    for (let i = 0; i < error.line - 1; i++) {
                      charPosition += lines[i].length + 1 // +1 for newline
                    }
                    charPosition += error.column
                    textareaRef.current.focus()
                    textareaRef.current.setSelectionRange(charPosition, charPosition + error.length)
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {error.severity === 'error' ? (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">×</span>
                      </div>
                    ) : (
                      <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-red-800">
                      Line {error.line}: {error.message}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {error.type === 'missing-element' && 'Required HTML element is missing'}
                      {error.type === 'unclosed-tag' && 'HTML tag is not properly closed'}
                      {error.type === 'syntax-error' && 'HTML syntax error detected'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
          </>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-[var(--surface)] border-t border-[var(--border)] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-[var(--text-secondary)] flex items-center space-x-4">
            {!isCompleted ? (
              <>
               
                {codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length > 0 && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium">
                      {codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length} syntax error{codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Activity completed successfully! Final score: {score}%
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length > 0 && !showErrorPanel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowErrorPanel(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Show Syntax Errors ({codeErrors.filter(e => e.type === 'syntax-error' || e.type === 'unclosed-tag').length})
              </Button>
            )}

          </div>
        </div>
      </div>

      {/* Submission Result Modal */}
      <SubmissionResultModal
        isVisible={showSubmissionModal}
        onClose={handleSubmissionModalClose}
        data={submissionModalData}
      />

      {/* Celebration Overlay - Only show when activity is truly completed */}
      <CelebrationOverlay
        isVisible={showCelebration && isCompleted === true}
        onClose={handleCelebrationClose}
        activityTitle={activity.title}
        activityNumber={parseInt(activityId) || 1}
      />

      {/* Floating AuraBot Button - shows when AuraBot is available but minimized */}
      {showAuraBot && auraBotMinimized && (
        <FloatingAuraBotButton onClick={() => setAuraBotMinimized(false)} />
      )}
    </div>
  )
}

