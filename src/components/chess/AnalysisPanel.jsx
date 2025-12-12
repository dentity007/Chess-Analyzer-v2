import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, AlertCircle, Target, TrendingUp, Brain, Lightbulb, HelpCircle, Loader2 } from 'lucide-react';

export default function AnalysisPanel({ 
  analysis, 
  aiInsights, 
  aiQuestions = [],
  onQuestionSelect,
  activeQuestion,
  questionAnswer,
  questionLoading
}) {
  if (!analysis) {
    return (
      <Card className="bg-stone-800/50 border-stone-700">
        <CardContent className="p-6 text-center text-stone-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No analysis available</p>
          <p className="text-sm mt-1">Select a game to analyze</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, blunders = [], mistakes = [] } = analysis;
  const questions = Array.isArray(aiQuestions) ? aiQuestions.filter(Boolean) : [];

  return (
    <div className="space-y-4">
      {/* Accuracy Card */}
      <Card className="bg-stone-800/50 border-stone-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Target className="w-5 h-5 text-amber-400" />
            Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-stone-400">White</span>
                <span className="text-sm font-semibold text-white">
                  {summary?.white_accuracy?.toFixed(1) || analysis.accuracy?.toFixed(1) || '--'}%
                </span>
              </div>
              <Progress 
                value={summary?.white_accuracy || analysis.accuracy || 0} 
                className="h-2 bg-stone-700"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-stone-400">Black</span>
                <span className="text-sm font-semibold text-white">
                  {summary?.black_accuracy?.toFixed(1) || analysis.accuracy?.toFixed(1) || '--'}%
                </span>
              </div>
              <Progress 
                value={summary?.black_accuracy || analysis.accuracy || 0} 
                className="h-2 bg-stone-700"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="bg-stone-800/50 border-stone-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-stone-700/50 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {summary?.total_moves || analysis.total_moves || 0}
              </div>
              <div className="text-xs text-stone-400">Moves</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">
                {summary?.blunder_count || blunders.length || 0}
              </div>
              <div className="text-xs text-red-400">Blunders</div>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="text-2xl font-bold text-orange-400">
                {summary?.mistake_count || mistakes.length || 0}
              </div>
              <div className="text-xs text-orange-400">Mistakes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blunders & Mistakes */}
      {(blunders.length > 0 || mistakes.length > 0) && (
        <Card className="bg-stone-800/50 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Critical Moments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {blunders.slice(0, 3).map((blunder, idx) => (
              <div 
                key={`blunder-${idx}`}
                className="flex items-center gap-3 p-2 bg-red-500/10 rounded border border-red-500/20"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-white font-mono">
                    {blunder.move_number}. {blunder.move}
                  </span>
                  <span className="text-red-400 text-sm ml-2">
                    ({blunder.evaluation_change > 0 ? '+' : ''}{blunder.evaluation_change} cp)
                  </span>
                </div>
                <Badge className="bg-red-500/20 text-red-300">Blunder</Badge>
              </div>
            ))}
            {mistakes.slice(0, 3).map((mistake, idx) => (
              <div 
                key={`mistake-${idx}`}
                className="flex items-center gap-3 p-2 bg-orange-500/10 rounded border border-orange-500/20"
              >
                <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-white font-mono">
                    {mistake.move_number}. {mistake.move}
                  </span>
                  <span className="text-orange-400 text-sm ml-2">
                    ({mistake.evaluation_change > 0 ? '+' : ''}{mistake.evaluation_change} cp)
                  </span>
                </div>
                <Badge className="bg-orange-500/20 text-orange-300">Mistake</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Suggested Questions */}
      {questions.length > 0 && (
        <Card className="bg-stone-800/50 border-stone-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              Study Prompts
            </CardTitle>
            <p className="text-xs text-stone-500">Tap a prompt to ask your AI coach.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((question, idx) => (
              <button
                type="button"
                key={`${idx}-${question.slice(0, 12)}`}
                onClick={() => onQuestionSelect?.(question)}
                disabled={questionLoading && activeQuestion === question}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeQuestion === question
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-stone-700/40 border-stone-700/80 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Q{idx + 1}</Badge>
                  <div className="flex-1">
                    <p className="text-sm text-stone-200 leading-relaxed">{question}</p>
                    {questionLoading && activeQuestion === question && (
                      <div className="flex items-center gap-2 text-xs text-amber-300 mt-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Asking your coach...
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {(activeQuestion || questionAnswer) && (
              <div className="p-3 bg-stone-700/50 rounded-lg border border-stone-600">
                <div className="text-xs uppercase tracking-wide text-amber-300 mb-1">AI Response</div>
                <p className="text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
                  {questionAnswer || 'Waiting for a response...'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {aiInsights && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              AI Coach Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">
              {aiInsights}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}