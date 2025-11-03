import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LogOut, Plus, Database } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = React.useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [models, setModels] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newSubject, setNewSubject] = useState({ name: '', description: '', category: 'anatomy' });
  const [newModel, setNewModel] = useState({ title: '', description: '', model_url: '', subject_id: '', labels: '' });
  const [newQuestion, setNewQuestion] = useState({
    subject_id: '',
    model_id: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    difficulty: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, modRes] = await Promise.all([
        axios.get(`${API}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/models`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSubjects(subRes.data);
      setModels(modRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleInitializeData = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/admin/initialize-data`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Sample data initialized!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to initialize data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/subjects`, newSubject, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Subject created!');
      setNewSubject({ name: '', description: '', category: 'anatomy' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...newModel,
        labels: newModel.labels.split(',').map(l => l.trim()).filter(l => l)
      };
      await axios.post(`${API}/models`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('3D Model created!');
      setNewModel({ title: '', description: '', model_url: '', subject_id: '', labels: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create model');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/questions`, newQuestion, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Question created!');
      setNewQuestion({
        subject_id: '',
        model_id: '',
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        difficulty: 'medium'
      });
    } catch (err) {
      toast.error('Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" data-testid="admin-dashboard">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600" data-testid="admin-name">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={handleInitializeData} disabled={loading} className="btn-hover bg-indigo-600" data-testid="initialize-data-btn">
            <Database className="w-4 h-4 mr-2" />
            Initialize Sample Data
          </Button>
        </div>

        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="subjects" data-testid="subjects-tab">Subjects</TabsTrigger>
            <TabsTrigger value="models" data-testid="models-tab">3D Models</TabsTrigger>
            <TabsTrigger value="questions" data-testid="questions-tab">Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Create Subject</CardTitle>
                <CardDescription>Add a new subject category</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSubject} className="space-y-4" data-testid="create-subject-form">
                  <div>
                    <Label>Subject Name</Label>
                    <Input
                      data-testid="subject-name-input"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      placeholder="Human Anatomy"
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      data-testid="subject-description-input"
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                      placeholder="Explore human body parts"
                      required
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      data-testid="subject-category-select"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newSubject.category}
                      onChange={(e) => setNewSubject({ ...newSubject, category: e.target.value })}
                    >
                      <option value="anatomy">Anatomy</option>
                      <option value="automobile">Automobile</option>
                      <option value="physics">Physics</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={loading} className="btn-hover" data-testid="create-subject-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Subject
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Existing Subjects ({subjects.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {subjects.map(subject => (
                    <div key={subject.id} className="p-4 bg-gray-50 rounded-lg" data-testid={`subject-item-${subject.id}`}>
                      <h4 className="font-medium">{subject.name}</h4>
                      <p className="text-sm text-gray-600">{subject.description}</p>
                      <span className="text-xs text-gray-500">{subject.category}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Create 3D Model</CardTitle>
                <CardDescription>Add a new 3D model to a subject</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateModel} className="space-y-4" data-testid="create-model-form">
                  <div>
                    <Label>Model Title</Label>
                    <Input
                      data-testid="model-title-input"
                      value={newModel.title}
                      onChange={(e) => setNewModel({ ...newModel, title: e.target.value })}
                      placeholder="Human Heart"
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      data-testid="model-description-input"
                      value={newModel.description}
                      onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                      placeholder="Detailed heart model"
                      required
                    />
                  </div>
                  <div>
                    <Label>Model URL (.glb / .gltf)</Label>
                    <Input
                      data-testid="model-url-input"
                      value={newModel.model_url}
                      onChange={(e) => setNewModel({ ...newModel, model_url: e.target.value })}
                      placeholder="https://example.com/model.glb"
                      required
                    />
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <select
                      data-testid="model-subject-select"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newModel.subject_id}
                      onChange={(e) => setNewModel({ ...newModel, subject_id: e.target.value })}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Labels (comma-separated)</Label>
                    <Input
                      data-testid="model-labels-input"
                      value={newModel.labels}
                      onChange={(e) => setNewModel({ ...newModel, labels: e.target.value })}
                      placeholder="Heart, Cardiovascular, Anatomy"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="btn-hover" data-testid="create-model-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Model
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Existing Models ({models.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {models.map(model => (
                    <div key={model.id} className="p-4 bg-gray-50 rounded-lg" data-testid={`model-item-${model.id}`}>
                      <h4 className="font-medium">{model.title}</h4>
                      <p className="text-sm text-gray-600">{model.description}</p>
                      <p className="text-xs text-blue-600 mt-1">{model.model_url}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Create Question</CardTitle>
                <CardDescription>Add assessment questions for models</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateQuestion} className="space-y-4" data-testid="create-question-form">
                  <div>
                    <Label>Subject</Label>
                    <select
                      data-testid="question-subject-select"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newQuestion.subject_id}
                      onChange={(e) => setNewQuestion({ ...newQuestion, subject_id: e.target.value })}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Model</Label>
                    <select
                      data-testid="question-model-select"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newQuestion.model_id}
                      onChange={(e) => setNewQuestion({ ...newQuestion, model_id: e.target.value })}
                      required
                    >
                      <option value="">Select Model</option>
                      {models.filter(m => m.subject_id === newQuestion.subject_id).map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Question Text</Label>
                    <Input
                      data-testid="question-text-input"
                      value={newQuestion.question_text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                      placeholder="What is the function of...?"
                      required
                    />
                  </div>
                  {[0, 1, 2, 3].map(idx => (
                    <div key={idx}>
                      <Label>Option {idx + 1}</Label>
                      <Input
                        data-testid={`question-option-${idx}-input`}
                        value={newQuestion.options[idx]}
                        onChange={(e) => {
                          const opts = [...newQuestion.options];
                          opts[idx] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: opts });
                        }}
                        placeholder={`Option ${idx + 1}`}
                        required
                      />
                    </div>
                  ))}
                  <div>
                    <Label>Correct Answer</Label>
                    <select
                      data-testid="question-correct-answer-select"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newQuestion.correct_answer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: parseInt(e.target.value) })}
                    >
                      <option value={0}>Option 1</option>
                      <option value={1}>Option 2</option>
                      <option value={2}>Option 3</option>
                      <option value={3}>Option 4</option>
                    </select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <select
                      data-testid="question-difficulty-select"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={loading} className="btn-hover" data-testid="create-question-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Question
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}