import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Calendar as CalendarIcon, Loader2, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function FetchGamesForm({ onFetch, isLoading = false }) {
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('last');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [days, setDays] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFetch({
      username: mode === 'demo' ? '' : username,
      mode,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      days: parseInt(days) || 30
    });
  };

  return (
    <Card className="bg-stone-800/50 border-stone-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <Download className="w-5 h-5 text-amber-400" />
          Fetch Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label className="text-stone-300">Chess.com Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., hikaru"
              className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-500"
              disabled={mode === 'demo'}
            />
          </div>

          {/* Fetch Mode */}
          <div className="space-y-2">
            <Label className="text-stone-300">Fetch Mode</Label>
            <RadioGroup value={mode} onValueChange={setMode} className="grid grid-cols-2 gap-2">
              <Label 
                htmlFor="last" 
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  mode === 'last' 
                    ? "bg-amber-500/20 border-amber-500 text-white" 
                    : "bg-stone-700/50 border-stone-600 text-stone-400 hover:border-stone-500"
                )}
              >
                <RadioGroupItem value="last" id="last" className="sr-only" />
                Last Game
              </Label>
              <Label 
                htmlFor="range"
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  mode === 'range' 
                    ? "bg-amber-500/20 border-amber-500 text-white" 
                    : "bg-stone-700/50 border-stone-600 text-stone-400 hover:border-stone-500"
                )}
              >
                <RadioGroupItem value="range" id="range" className="sr-only" />
                Date Range
              </Label>
              <Label 
                htmlFor="days"
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  mode === 'days' 
                    ? "bg-amber-500/20 border-amber-500 text-white" 
                    : "bg-stone-700/50 border-stone-600 text-stone-400 hover:border-stone-500"
                )}
              >
                <RadioGroupItem value="days" id="days" className="sr-only" />
                Last X Days
              </Label>
              <Label 
                htmlFor="demo"
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  mode === 'demo' 
                    ? "bg-purple-500/20 border-purple-500 text-white" 
                    : "bg-stone-700/50 border-stone-600 text-stone-400 hover:border-stone-500"
                )}
              >
                <RadioGroupItem value="demo" id="demo" className="sr-only" />
                <PlayCircle className="w-4 h-4" />
                Demo Mode
              </Label>
            </RadioGroup>
          </div>

          {/* Date Range Inputs */}
          {mode === 'range' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-stone-300">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-stone-700 border-stone-600",
                        !startDate && "text-stone-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-stone-300">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-stone-700 border-stone-600",
                        !endDate && "text-stone-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Days Input */}
          {mode === 'days' && (
            <div className="space-y-2">
              <Label className="text-stone-300">Number of Days</Label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                min={1}
                max={365}
                className="bg-stone-700 border-stone-600 text-white"
              />
            </div>
          )}

          {/* Demo Mode Info */}
          {mode === 'demo' && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300">
                Demo mode will load sample games so you can try the analysis features without needing a Chess.com account.
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold"
            disabled={isLoading || (mode !== 'demo' && !username)}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {mode === 'demo' ? 'Load Demo Games' : 'Fetch Games'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}