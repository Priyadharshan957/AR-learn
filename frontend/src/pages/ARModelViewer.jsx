import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Maximize2,
  RotateCw,
  BookOpen,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react';
import '@google/model-viewer';

export default function ARModelViewer() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { token } = React.useContext(AuthContext);

  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔊 Audio & Language
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('en');
  const [tamilText, setTamilText] = useState('');

  useEffect(() => {
    fetchModel();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [modelId]);

  // Ensure voices are loaded
  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  const fetchModel = async () => {
    try {
      const res = await axios.get(`${API}/models/${modelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModel(res.data);
    } catch {
      toast.error('Failed to load model');
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  };

  // 🌐 AI Translation (Frontend only)
  const translateToTamil = async (text) => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|ta`;
      const response = await fetch(url);
      const data = await response.json();
      return data.responseData.translatedText;
    } catch {
      return '';
    }
  };

  // 🎙 Speech toggle (WITH ERROR POPUP)
  const toggleSpeech = async () => {
    if (!model?.description) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = model.description;
    let langCode = 'en-US';

   if (language === 'ta') {
  const voices = window.speechSynthesis.getVoices();
  const tamilVoiceAvailable = voices.some(
    v => v.lang && v.lang.toLowerCase().includes('ta')
  );

  if (!tamilVoiceAvailable) {
    toast.warning(
      'Tamil audio is not available on this device. Playing English audio.'
    );

    // fallback to English audio
    langCode = 'en-US';
    textToSpeak = model.description;
  } else {
    // Tamil voice exists → use Tamil text + voice
    if (!tamilText) {
      const translated = await translateToTamil(model.description);
      if (translated) {
        setTamilText(translated);
        textToSpeak = translated;
      }
    } else {
      textToSpeak = tamilText;
    }
    langCode = 'ta-IN';
  }
}


    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-xl font-medium text-indigo-600">
          Loading model...
        </div>
      </div>
    );
  }

  if (!model) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/subjects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-indigo-600">
              {model.title}
            </h1>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLanguage(language === 'en' ? 'ta' : 'en');
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }}
            >
              {language === 'en' ? 'தமிழ்' : 'English'}
            </Button>

            <Button
              onClick={() => navigate(`/assessment/${modelId}`)}
              className="btn-hover bg-indigo-600"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Take Assessment
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative w-full" style={{ height: '600px' }}>
                <model-viewer
                  src={model.model_url}
                  alt={model.title}
                  auto-rotate
                  camera-controls
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  style={{
                    width: '100%',
                    height: '100%',
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  {/* AUDIO BUTTON */}
                  <div className="absolute top-4 right-4">
                    <Button
                      onClick={toggleSpeech}
                      size="sm"
                      className="bg-white text-indigo-600 shadow-lg"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-4 h-4 mr-2" /> Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 mr-2" /> Listen
                        </>
                      )}
                    </Button>
                  </div>

                  <div
                    slot="ar-button"
                    className="absolute bottom-4 left-4 right-4 flex justify-center"
                  >
                    <Button className="bg-white text-indigo-600">
                      <Maximize2 className="w-4 h-4 mr-2" />
                      View in AR
                    </Button>
                  </div>
                </model-viewer>
              </div>
            </CardContent>
          </Card>

          {/* CONTROLS */}
          <Card className="mt-4 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RotateCw className="w-5 h-5 text-indigo-600" />
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Rotate:</span>
                <span>Click and drag</span>
              </div>
              <div className="flex justify-between">
                <span>Zoom:</span>
                <span>Scroll or pinch</span>
              </div>
              <div className="flex justify-between">
                <span>Pan:</span>
                <span>Right-click and drag</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* ABOUT */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                About This Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{model.description}</p>
            </CardContent>
          </Card>

          {/* START ASSESSMENT */}
          <Card className="shadow-lg border-0">
            <CardContent className="pt-4">
              <Button
                className="w-full btn-hover bg-gradient-to-r from-indigo-600 to-purple-600"
                onClick={() => navigate(`/assessment/${modelId}`)}
              >
                Start Assessment
              </Button>
            </CardContent>
          </Card>

          {/* LEARNING TIPS */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-lg">Learning Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <p>
                  Rotate and explore the model from all angles to understand its
                  structure
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <p>
                  Use AR mode on your mobile device for a more immersive
                  experience
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <p>
                  Take the assessment after exploring to test your understanding
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
