import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BookOpen, TrendingUp, Trophy, LogOut, BarChart3 } from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = React.useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const res = await axios.get(`${API}/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" data-testid="student-dashboard">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AR Learning</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600" data-testid="user-name">Welcome, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-0 card-hover" data-testid="stats-assessments">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{loading ? '...' : stats?.total_assessments || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 card-hover" data-testid="stats-accuracy">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {loading ? '...' : `${Math.round((stats?.accuracy || 0) * 100)}%`}
              </div>
              {!loading && stats && (
                <Progress value={(stats.accuracy || 0) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 card-hover" data-testid="stats-correct">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Correct Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{loading ? '...' : stats?.correct_answers || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 cursor-pointer card-hover" onClick={() => navigate('/subjects')} data-testid="explore-models-card">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Explore Models</CardTitle>
              <CardDescription>Browse 3D models and start learning</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg border-0 cursor-pointer card-hover" onClick={() => navigate('/performance')} data-testid="view-analytics-card">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>View Analytics</CardTitle>
              <CardDescription>See detailed performance reports</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg border-0 cursor-pointer card-hover" onClick={() => navigate('/performance')} data-testid="leaderboard-card">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>See top performers</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg border-0 cursor-pointer card-hover" onClick={() => navigate('/subjects')} data-testid="continue-learning-card">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity */}
        {!loading && stats && stats.total_assessments > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Your learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.weak_topics && stats.weak_topics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Areas to Improve</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.weak_topics.map((topic, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">
                    {stats.accuracy >= 0.8 ? (
                      <span className="text-green-600 font-medium">✨ Excellent performance! Keep it up!</span>
                    ) : stats.accuracy >= 0.6 ? (
                      <span className="text-blue-600 font-medium">👍 Good progress! Practice more to improve.</span>
                    ) : (
                      <span className="text-orange-600 font-medium">💪 Focus on weak areas to boost your score!</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && (!stats || stats.total_assessments === 0) && (
          <Card className="shadow-lg border-0 text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Start Your Learning Journey</h3>
              <p className="text-gray-600 mb-6">Explore 3D models and take assessments to track your progress</p>
              <Button onClick={() => navigate('/subjects')} className="btn-hover bg-indigo-600" data-testid="start-learning-btn">
                Explore Subjects
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}