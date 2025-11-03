import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

export default function Assessment() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { token } = React.useContext(AuthContext);
  const [model, setModel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [startTime, setStartTime] = useState(Date.now());
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelAndQuestions();
  }, [modelId, difficulty]);

  const fetchModelAndQuestions = async () => {
    try {
      const [modelRes, questionsRes] = await Promise.all([
        axios.get(`${API}/models/${modelId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/questions/${modelId}?difficulty=${difficulty}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setModel(modelRes.data);
      setQuestions(questionsRes.data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load assessment');
      navigate('/subjects');
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) {
      toast.error('Please select an answer');
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const currentQuestion = questions[currentQuestionIndex];

    try {
      const res = await axios.post(
        `${API}/assessments/submit?model_id=${modelId}&subject_id=${model.subject_id}&time_spent=${timeSpent}`,
        {
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);
      setAnswered(true);

      if (res.data.is_correct) {
        setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      } else {
        setScore(prev => ({ ...prev, total: prev.total + 1 }));
      }

      // Update difficulty for next question
      if (res.data.next_difficulty) {
        setDifficulty(res.data.next_difficulty);
      }
    } catch (err) {
      toast.error('Failed to submit answer');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setResult(null);
      setStartTime(Date.now());
    } else {
      // Assessment complete
      navigate('/performance');
      toast.success(`Assessment complete! Score: ${score.correct + (result?.is_correct ? 1 : 0)}/${score.total + 1}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-xl font-medium text-indigo-600">Loading assessment...</div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/model/${modelId}`)} data-testid="back-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Assessment</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12 text-center">
          <Card className="max-w-md mx-auto shadow-lg">
            <CardContent className="py-12">
              <p className="text-gray-600 mb-4">No questions available for this model yet.</p>
              <Button onClick={() => navigate(`/model/${modelId}`)} className="btn-hover">Back to Model</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" data-testid="assessment-page">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/model/${modelId}`)} data-testid="back-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Assessment: {model?.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600" data-testid="question-progress">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium" data-testid="difficulty-badge">
              {currentQuestion.difficulty}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <span className="text-sm font-medium text-indigo-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Score Card */}
          <Card className="mb-6 shadow-lg border-0">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Score: {score.correct}/{score.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Accuracy: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card className="shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="question-text">{currentQuestion.question_text}</CardTitle>
              <CardDescription>Select the correct answer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = result && idx === currentQuestion.correct_answer;
                const isWrong = result && isSelected && !result.is_correct;

                return (
                  <button
                    key={idx}
                    data-testid={`option-${idx}`}
                    onClick={() => !answered && setSelectedAnswer(idx)}
                    disabled={answered}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isWrong
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {isWrong && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </button>
                );
              })}

              {result && (
                <div className={`p-4 rounded-xl mt-4 ${
                  result.is_correct ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
                }`} data-testid="feedback-message">
                  <p className={`font-medium ${
                    result.is_correct ? 'text-green-800' : 'text-orange-800'
                  }`}>
                    {result.feedback}
                  </p>
                  {result.next_difficulty && (
                    <p className="text-sm mt-2 text-gray-600">
                      Next question difficulty: <span className="font-medium">{result.next_difficulty}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {!answered ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className="flex-1 btn-hover bg-indigo-600"
                    data-testid="submit-answer-btn"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    className="flex-1 btn-hover bg-gradient-to-r from-indigo-600 to-purple-600"
                    data-testid="next-question-btn"
                  >
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Assessment'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}