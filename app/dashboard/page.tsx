'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { getDashboardStats, type DashboardStats } from '@/lib/dashboard-api';
import { 
  Trophy, 
  Zap, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Calendar, 
  Target,
  Clock,
  Star,
  BarChart3,
  Users,
  CheckCircle,
  PlayCircle,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      loadDashboardData();
    }
  }, [loading, isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setIsLoadingData(true);
      const data = await getDashboardStats();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !dashboardData) {
    if (!isAuthenticated || !user) {
      redirect('/signin');
    }
    return null;
  }

  const progressPercentage = Math.round((dashboardData.completedCourses / dashboardData.totalCourses) * 100);
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(dashboardData.streak, weeklyGoal);

  const stats = [
    {
      label: 'Total Points',
      value: dashboardData.totalPoints.toLocaleString(),
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      change: `+${dashboardData.pointsThisWeek} this week`,
      color: 'yellow'
    },
    {
      label: 'Current Streak',
      value: `${dashboardData.streak} days`,
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      change: 'Keep it up!',
      color: 'orange'
    },
    {
      label: 'Courses Completed',
      value: `${dashboardData.completedCourses}/${dashboardData.totalCourses}`,
      icon: <BookOpen className="h-6 w-6 text-blue-500" />,
      change: `${progressPercentage}% complete`,
      color: 'blue'
    },
    {
      label: 'Global Rank',
      value: `#${dashboardData.rank}`,
      icon: <Trophy className="h-6 w-6 text-purple-500" />,
      change: 'Top 10%',
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.fullName.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's your learning progress overview
              </p>
            </div>
            <Link
              href="/html"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center"
            >
              Continue Learning
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`bg-${stat.color}-100 p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Learning Progress</h2>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              
              {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Course Progress</span>
                  <span className="text-sm font-semibold text-purple-600">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Weekly Goal */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Weekly Learning Goal</span>
                  <span className="text-sm font-semibold text-blue-600">{weeklyProgress}/{weeklyGoal} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Course */}
              {dashboardData.currentCourse && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <PlayCircle className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{dashboardData.currentCourse}</h3>
                      <p className="text-sm text-gray-600">Continue your current lesson</p>
                    </div>
                    <Link
                      href="/html"
                      className="ml-auto bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                    >
                      Continue
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Lessons</h2>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {dashboardData.recentLessons.length > 0 ? (
                  dashboardData.recentLessons.map((lesson, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {lesson.progress === 100 ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <PlayCircle className="h-8 w-8 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{lesson.title}</h3>
                        <p className="text-sm text-gray-500">Last accessed: {new Date(lesson.lastAccessed).toLocaleDateString()}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                lesson.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${lesson.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{lesson.progress}%</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Link
                          href="/html"
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          {lesson.progress === 100 ? 'Review' : 'Continue'}
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No recent lessons yet. Start learning now!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time spent learning</span>
                  <span className="text-sm font-semibold text-gray-900">{dashboardData.timeSpent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Lessons completed</span>
                  <span className="text-sm font-semibold text-gray-900">{dashboardData.lessonsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average score</span>
                  <span className="text-sm font-semibold text-gray-900">{dashboardData.averageScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Projects completed</span>
                  <span className="text-sm font-semibold text-gray-900">{dashboardData.projectsCompleted}</span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Latest Badges</h3>
                <Link href="/achievements" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {dashboardData.badges.slice(0, 4).map((badge, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{badge}</p>
                      <p className="text-xs text-gray-500">Earned recently</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Recommendations */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Keep Learning!</h3>
              <p className="text-sm text-white/90 mb-4">
                You're doing great! Try these recommended topics to expand your skills.
              </p>
              <div className="space-y-2">
                <Link href="/css" className="block bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors">
                  <p className="font-medium text-sm">Advanced CSS Grid</p>
                  <p className="text-xs text-white/80">Master modern layouts</p>
                </Link>
                <Link href="/javascript" className="block bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors">
                  <p className="font-medium text-sm">JavaScript ES6+</p>
                  <p className="text-xs text-white/80">Modern JavaScript features</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 