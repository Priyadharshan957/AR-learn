import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Search, Eye, BookOpen } from 'lucide-react';

export default function SubjectSelection() {
  const navigate = useNavigate();
  const { token } = React.useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubjects(res.data);
    } catch (err) {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async (subjectId) => {
    try {
      const res = await axios.get(`${API}/models?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModels(res.data);
    } catch (err) {
      toast.error('Failed to load models');
    }
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    fetchModels(subject.id);
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredModels = models.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" data-testid="subject-selection">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => selectedSubject ? setSelectedSubject(null) : navigate('/dashboard')} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {selectedSubject ? selectedSubject.name : 'Select Subject'}
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              data-testid="search-input"
              className="pl-10"
              placeholder={selectedSubject ? "Search models..." : "Search subjects..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!selectedSubject ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12 text-gray-500">Loading subjects...</div>
            ) : filteredSubjects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">No subjects found</div>
            ) : (
              filteredSubjects.map(subject => (
                <Card
                  key={subject.id}
                  className="shadow-lg border-0 cursor-pointer card-hover"
                  onClick={() => handleSelectSubject(subject)}
                  data-testid={`subject-card-${subject.id}`}
                >
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-2xl flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription>{subject.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-indigo-600 font-medium">
                      <Eye className="w-4 h-4 mr-2" />
                      Explore Models
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">No models found for this subject</div>
            ) : (
              filteredModels.map(model => (
                <Card
                  key={model.id}
                  className="shadow-lg border-0 cursor-pointer card-hover"
                  onClick={() => navigate(`/model/${model.id}`)}
                  data-testid={`model-card-${model.id}`}
                >
                  <CardHeader>
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4">
                      <Eye className="w-16 h-16 text-indigo-400" />
                    </div>
                    <CardTitle>{model.title}</CardTitle>
                    <CardDescription>{model.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {model.labels && model.labels.slice(0, 3).map((label, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-indigo-600 font-medium">
                      <Eye className="w-4 h-4 mr-2" />
                      View in AR
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}