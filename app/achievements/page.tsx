'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { 
  Award, 
  Trophy, 
  Star, 
  CheckCircle, 
  TrendingUp, 
  BookOpen,
  Zap,
  Target,
  Medal,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getUserAchievements,
  getAchievementStats,
  getAchievementsByCourse,
  getCertificateTypeDisplayName,
  getBadgeDisplayName,
  getBadgeColor,
  type Achievement,
  type CourseAchievementSummary
} from '@/lib/achievements-api';
import HTML5Logo from '@/app/assets/HTML5.png';

export default function AchievementsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [courseAchievements, setCourseAchievements] = useState<CourseAchievementSummary[]>([]);
  const [stats, setStats] = useState({
    total_achievements: 0,
    certificates_earned: 0,
    total_points: 0,
    badges: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    },
    recent_achievements: [] as Achievement[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      loadAchievements();
    }
  }, [loading, isAuthenticated]);

  const loadAchievements = async () => {
    try {
      setIsLoading(true);
      
      // Load all achievement data in parallel
      const [achievementsData, statsData, coursesData] = await Promise.all([
        getUserAchievements().catch(() => ({ achievements: [] })),
        getAchievementStats().catch(() => ({
          total_achievements: 0,
          certificates_earned: 0,
          total_points: 0,
          badges: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
          recent_achievements: []
        })),
        getAchievementsByCourse().catch(() => ({ courses: [] }))
      ]);

      setAchievements(achievementsData.achievements || []);
      setStats(statsData);
      setCourseAchievements(coursesData.courses || []);
      
      // Auto-select HTML5 course if available
      const html5Course = coursesData.courses?.find(
        c => c.course_slug === 'html5-tutorial' || c.course_title.toLowerCase().includes('html')
      );
      if (html5Course) {
        setSelectedCourse(html5Course.course_id.toString());
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    redirect('/signin');
  }

  // Filter achievements based on selected course
  const filteredAchievements = selectedCourse === 'all' 
    ? achievements 
    : courseAchievements.find(c => c.course_id.toString() === selectedCourse)?.achievements || [];

  const selectedCourseData = courseAchievements.find(c => c.course_id.toString() === selectedCourse);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Achievements</h1>
              <p className="text-purple-100">Track your learning journey and celebrate your success</p>
            </div>
            <div className="hidden md:block">
              <Trophy className="h-24 w-24 text-yellow-300 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Achievements</p>
                <p className="text-3xl font-bold text-purple-600">{stats.total_achievements}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Certificates</p>
                <p className="text-3xl font-bold text-blue-600">{stats.certificates_earned}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Medal className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Points</p>
                <p className="text-3xl font-bold text-green-600">{stats.total_points}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Platinum Badges</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.badges.platinum}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Badge Collection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Medal className="h-6 w-6 mr-2 text-purple-600" />
            Badge Collection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.badges).map(([level, count]) => (
              <div 
                key={level}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center"
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r ${getBadgeColor(level)} flex items-center justify-center shadow-lg`}>
                  <Medal className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{getBadgeDisplayName(level)}</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Course Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-purple-600" />
            Filter by Course
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCourse('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCourse === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Courses
            </button>
            {courseAchievements.map((course) => (
              <button
                key={course.course_id}
                onClick={() => setSelectedCourse(course.course_id.toString())}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  selectedCourse === course.course_id.toString()
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {course.course_slug === 'html5-tutorial' && (
                  <Image 
                    src={HTML5Logo} 
                    alt="HTML5" 
                    width={20} 
                    height={20}
                    className="w-5 h-5"
                  />
                )}
                <span>{course.course_title}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {course.total_achievements}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Course Progress Summary */}
        {selectedCourseData && selectedCourse !== 'all' && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Target className="h-6 w-6 mr-2 text-purple-600" />
              {selectedCourseData.course_title} Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-3">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - selectedCourseData.progress_percentage / 100)}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9333EA" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-purple-600">
                      {Math.round(selectedCourseData.progress_percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Course Progress</p>
              </div>
              
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {selectedCourseData.lessons_completed}/{selectedCourseData.total_lessons}
                </p>
                <p className="text-sm text-gray-600">Lessons Completed</p>
              </div>
              
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {selectedCourseData.certificates_earned}
                </p>
                <p className="text-sm text-gray-600">Certificates Earned</p>
              </div>
            </div>
          </div>
        )}

        {/* Achievements List */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-purple-600" />
            {selectedCourse === 'all' ? 'All Achievements' : `${selectedCourseData?.course_title} Achievements`}
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading achievements...</p>
            </div>
          ) : filteredAchievements.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No achievements yet</p>
              <p className="text-gray-400 mb-6">Complete activities to earn your first achievement!</p>
              <Link 
                href="/html"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Start Learning HTML5
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getBadgeColor(achievement.badge_level)} flex items-center justify-center shadow-lg`}>
                      {achievement.certificate_type === 'perfect_score' && (
                        <Star className="h-8 w-8 text-white" />
                      )}
                      {achievement.certificate_type === 'first_attempt' && (
                        <Zap className="h-8 w-8 text-white" />
                      )}
                      {achievement.certificate_type === 'excellence' && (
                        <Trophy className="h-8 w-8 text-white" />
                      )}
                      {achievement.certificate_type === 'completion' && (
                        <CheckCircle className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${getBadgeColor(achievement.badge_level)} text-white shadow`}>
                      {getBadgeDisplayName(achievement.badge_level)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {getCertificateTypeDisplayName(achievement.certificate_type)}
                  </h3>
                  
                  {achievement.achievement_data.activity_title && (
                    <p className="text-sm text-gray-600 mb-3">
                      {achievement.achievement_data.activity_title}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Score:</span>
                      <span className="font-semibold text-purple-600">
                        {achievement.achievement_data.score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Attempt:</span>
                      <span className="font-semibold text-blue-600">
                        #{achievement.achievement_data.attempt_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold text-green-600">
                        {achievement.achievement_data.time_spent_minutes} min
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-purple-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </span>
                      {achievement.is_verified && (
                        <span className="flex items-center text-xs text-green-600 font-medium">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Achievements */}
        {stats.recent_achievements.length > 0 && selectedCourse === 'all' && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-purple-600" />
              Recent Achievements
            </h2>
            <div className="space-y-4">
              {stats.recent_achievements.slice(0, 5).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getBadgeColor(achievement.badge_level)} flex items-center justify-center shadow`}>
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {getCertificateTypeDisplayName(achievement.certificate_type)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {achievement.achievement_data.activity_title || 'Achievement earned'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${getBadgeColor(achievement.badge_level)} text-white`}>
                      {getBadgeDisplayName(achievement.badge_level)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

