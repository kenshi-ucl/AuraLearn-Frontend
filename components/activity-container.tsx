'use client'

import { useState } from 'react'
import { Target, Code, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Activity {
  id: string
  title: string
  description: string
  instructions: string[]
  initialCode: string
  expectedCode: string
  expectedOutput: string
  hints: string[]
}

interface ActivityContainerProps {
  activity: Activity
  onComplete?: (activityId: string) => void
}

export default function ActivityContainer({ activity, onComplete }: ActivityContainerProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(false)

  const enterActivity = () => {
    // Navigate to the full-screen activity editor
    router.push(`/activity/${activity.id}`)
  }

  return (
    <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg overflow-hidden">
      {/* Activity Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6" />
          <div>
            <h3 className="text-lg font-semibold">Activity: {activity.title}</h3>
            <p className="text-purple-100 text-sm">{activity.description}</p>
          </div>
        </div>
      </div>

      {/* Activity Instructions */}
      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <Code className="h-5 w-5 mr-2 text-purple-600" />
            Instructions
          </h4>
          <ul className="space-y-2">
            {activity.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="text-gray-700">{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-purple-200">
          <div className="text-sm text-gray-600 flex items-center">
            <ExternalLink className="h-4 w-4 mr-2 text-purple-500" />
            <span className="font-medium">Opens in full-screen editor</span>
          </div>
          <Button
            onClick={enterActivity}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2"
          >
            <Target className="h-4 w-4 mr-2" />
            Enter Activity
          </Button>
        </div>
      </div>
    </div>
  )
}
