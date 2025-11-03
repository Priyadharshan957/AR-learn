import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, TrendingUp, Award, BarChart3, Target, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981'];

export default function Performance() {
  const navigate = useNavigate();
  const { token } = React.useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [perfRes, leaderRes] = await Promise.all([
        axios.get(`${API}/performance`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(perfRes.data);
      setLeaderboard(leaderRes.data);
    } catch (err) {
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-xl font-medium text-indigo-600">Loading analytics...</div>
      </div>
    );
  }

  const subjectWiseData = stats?.subject_wise_performance
    ? Object.entries(stats.subject_wise_performance).map(([subject, data]) => ({
        name: subject.length > 15 ? subject.substring(0, 12) + '...' : subject,
        fullName: subject,
        accuracy: Math.round(data.accuracy * 100),
        total: data.total
      }))
    : [];

  const performanceData = [
    { name: 'Correct', value: stats?.correct_answers || 0 },
    { name: 'Incorrect', value: (stats?.total_assessments || 0) - (stats?.correct_answers || 0) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" data-testid="performance-page">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Performance Analytics</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 card-hover" data-testid="stat-total">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Assessments</CardTitle>
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{stats?.total_assessments || 0}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 card-hover" data-testid="stat-accuracy">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Overall Accuracy</CardTitle>
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {Math.round((stats?.accuracy || 0) * 100)}%
              </div>
              <Progress value={(stats?.accuracy || 0) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 card-hover" data-testid="stat-correct">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Correct Answers</CardTitle>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.correct_answers || 0}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 card-hover" data-testid="stat-avg-time">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Time</CardTitle>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats?.avg_time_spent ? `${Math.round(stats.avg_time_spent)}s` : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Subject-wise Performance Chart */}
          {subjectWiseData.length > 0 && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Subject-wise Performance</CardTitle>
                <CardDescription>Accuracy percentage by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectWiseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Performance Distribution */}
          {stats && stats.total_assessments > 0 && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Correct vs Incorrect answers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
              <CardDescription>Top performers</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No leaderboard data yet</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg"
                      data-testid={`leaderboard-item-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-indigo-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium">{entry.name}</div>
                          <div className="text-xs text-gray-500">{entry.total_assessments} assessments</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-indigo-600">{entry.accuracy}%</div>
                        <div className="text-xs text-gray-500">accuracy</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weak Topics & Recommendations */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Areas to Improve</CardTitle>
              <CardDescription>Focus on these topics</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.weak_topics && stats.weak_topics.length > 0 ? (
                <div className="space-y-4">
                  {stats.weak_topics.map((topic, idx) => (
                    <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-lg" data-testid={`weak-topic-${idx}`}>
                      <div className="font-medium text-orange-800">{topic}</div>
                      <p className="text-sm text-orange-600 mt-1">
                        Review this subject and practice more assessments
                      </p>
                    </div>
                  ))}
                  <Button onClick={() => navigate('/subjects')} className="w-full btn-hover bg-orange-600 mt-4" data-testid="practice-weak-topics-btn">
                    Practice Weak Topics
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    {stats?.total_assessments === 0
                      ? 'Complete assessments to see recommendations'
                      : 'Great job! No weak areas identified.'}
                  </p>
                  <Button onClick={() => navigate('/subjects')} className="btn-hover" data-testid="continue-learning-btn">
                    Continue Learning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}