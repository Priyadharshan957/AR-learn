import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Maximize2, RotateCw, BookOpen, Info } from 'lucide-react';
import '@google/model-viewer';

export default function ARModelViewer() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { token } = React.useContext(AuthContext);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModel();
  }, [modelId]);

  const fetchModel = async () => {
    try {
      const res = await axios.get(`${API}/models/${modelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModel(res.data);
    } catch (err) {
      toast.error('Failed to load model');
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-xl font-medium text-indigo-600">Loading model...</div>
      </div>
    );
  }

  if (!model) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" data-testid="ar-model-viewer">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/subjects')} data-testid="back-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {model.title}
            </h1>
          </div>
          <Button onClick={() => navigate(`/assessment/${modelId}`)} className="btn-hover bg-indigo-600" data-testid="take-assessment-btn">
            <BookOpen className="w-4 h-4 mr-2" />
            Take Assessment
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 3D Model Viewer */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative w-full" style={{ height: '600px' }}>
                  <model-viewer
                    data-testid="model-viewer-element"
                    src={model.model_url}
                    alt={model.title}
                    auto-rotate
                    camera-controls
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                    loading="eager"
                  >
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center" slot="ar-button">
                      <Button className="btn-hover bg-white text-indigo-600 hover:bg-gray-100" data-testid="view-ar-btn">
                        <Maximize2 className="w-4 h-4 mr-2" />
                        View in AR
                      </Button>
                    </div>
                  </model-viewer>
                </div>
              </CardContent>
            </Card>

            {/* Controls Info */}
            <Card className="mt-4 shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-indigo-600" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Rotate:</span>
                  <span>Click and drag</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Zoom:</span>
                  <span>Scroll or pinch</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Pan:</span>
                  <span>Right-click and drag</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">AR View:</span>
                  <span>Click "View in AR" button</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Information */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  About This Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Description</h4>
                  <p className="text-gray-700">{model.description}</p>
                </div>

                {model.labels && model.labels.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {model.labels.map((label, idx) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button onClick={() => navigate(`/assessment/${modelId}`)} className="w-full btn-hover bg-gradient-to-r from-indigo-600 to-purple-600" data-testid="start-assessment-btn">
                    Start Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-lg">Learning Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <p>Rotate and explore the model from all angles to understand its structure</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <p>Use AR mode on your mobile device for a more immersive experience</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <p>Take the assessment after exploring to test your understanding</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}