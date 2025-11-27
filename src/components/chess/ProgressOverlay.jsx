import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, AlertCircle, Brain, Download } from 'lucide-react';

export default function ProgressOverlay({ 
  isVisible, 
  status = 'idle', 
  progress = 0, 
  message = '',
  type = 'analyze' // 'analyze' | 'fetch'
}) {
  if (!isVisible) return null;

  const icons = {
    analyzing: <Brain className="w-8 h-8 text-amber-400 animate-pulse" />,
    fetching: <Download className="w-8 h-8 text-amber-400 animate-bounce" />,
    loading: <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />,
    completed: <CheckCircle className="w-8 h-8 text-green-400" />,
    error: <AlertCircle className="w-8 h-8 text-red-400" />
  };

  const getIcon = () => {
    if (status === 'completed') return icons.completed;
    if (status === 'error') return icons.error;
    if (type === 'fetch') return icons.fetching;
    if (type === 'analyze') return icons.analyzing;
    return icons.loading;
  };

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {getIcon()}
          
          <h3 className="text-xl font-semibold text-white mt-4">
            {status === 'completed' ? 'Complete!' : 
             status === 'error' ? 'Error' :
             type === 'fetch' ? 'Fetching Games' : 'Analyzing Games'}
          </h3>
          
          <p className="text-stone-400 mt-2">
            {message || (status === 'completed' ? 'All done!' : 'Please wait...')}
          </p>

          {status !== 'completed' && status !== 'error' && (
            <div className="w-full mt-6">
              <Progress 
                value={progress} 
                className="h-2 bg-stone-700"
              />
              <div className="flex justify-between mt-2 text-sm text-stone-500">
                <span>{Math.round(progress)}%</span>
                <span>{status}</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg w-full">
              <p className="text-sm text-red-400">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}