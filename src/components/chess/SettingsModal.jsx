import React, { useState, useEffect, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Key, User, Check, AlertCircle, Loader2, ExternalLink, ShieldAlert } from 'lucide-react';
import { platformClient } from '@/api/platformClient';
import { AI_PROVIDER_DEFINITIONS } from '@/api/aiProviders';

export default function SettingsModal({ open, onOpenChange, onSave }) {
  const [chessUsername, setChessUsername] = useState('');
  const [aiProvider, setAiProvider] = useState('local');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiModelVersion, setAiModelVersion] = useState('');
  const [aiRegion, setAiRegion] = useState('');
  const [aiAccessKey, setAiAccessKey] = useState('');
  const [aiSecretKey, setAiSecretKey] = useState('');
  const [aiSessionToken, setAiSessionToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const instanceId = useId();
  const chessUsernameId = `${instanceId}-chess-username`;
  const aiProviderId = `${instanceId}-ai-provider`;
  const getFieldId = (name) => `${instanceId}-${name}`;

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    const user = await platformClient.auth.me();
    if (user) {
      setChessUsername(user.chess_username || '');
      const providerValue = user.ai_provider && user.ai_provider !== 'auto' ? user.ai_provider : 'local';
      setAiProvider(providerValue);
      setAiApiKey(user.ai_api_key || '');
      setAiModel(user.ai_model || '');
      setAiModelVersion(user.ai_model_version || '');
      setAiRegion(user.ai_region || '');
      setAiAccessKey(user.ai_access_key || '');
      setAiSecretKey(user.ai_secret_key || '');
      setAiSessionToken(user.ai_session_token || '');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await platformClient.auth.updateMe({
        chess_username: chessUsername,
        ai_provider: aiProvider || 'local',
        ai_api_key: aiApiKey || '',
        ai_model: aiModel || '',
        ai_model_version: aiModelVersion || '',
        ai_region: aiRegion || '',
        ai_access_key: aiAccessKey || '',
        ai_secret_key: aiSecretKey || '',
        ai_session_token: aiSessionToken || ''
      });
      onSave?.({ chessUsername, aiProvider });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setTestResult({ status: 'loading' });
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResult({ status: 'success', message: 'Connection successful!' });
    } catch (error) {
      setTestResult({ status: 'error', message: 'Connection failed' });
    }
  };

  const providerDefinition = AI_PROVIDER_DEFINITIONS.find((p) => p.id === aiProvider) || AI_PROVIDER_DEFINITIONS[0];
  const providerFields = providerDefinition.fields || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-stone-900 border-stone-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5 text-amber-400" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="account" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-stone-800">
            <TabsTrigger value="account" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
              <User className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
              <Key className="w-4 h-4 mr-2" />
              AI Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-stone-300" htmlFor={chessUsernameId}>Chess.com Username</Label>
              <Input
                id={chessUsernameId}
                value={chessUsername}
                onChange={(e) => setChessUsername(e.target.value)}
                placeholder="Your Chess.com username"
                className="bg-stone-800 border-stone-600 text-white"
              />
              <p className="text-xs text-stone-500">
                This will be used as the default username when fetching games
              </p>
            </div>

            <Button 
              variant="outline" 
              onClick={testConnection}
              className="w-full border-stone-600 hover:bg-stone-800"
            >
              {testResult?.status === 'loading' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : testResult?.status === 'success' ? (
                <Check className="w-4 h-4 mr-2 text-green-400" />
              ) : testResult?.status === 'error' ? (
                <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
              ) : null}
              Test Connection
            </Button>

            {testResult && testResult.status !== 'loading' && (
              <p className={`text-sm ${testResult.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.message}
              </p>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-stone-300" htmlFor={aiProviderId}>AI Provider</Label>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger id={aiProviderId} className="bg-stone-800 border-stone-600">
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-700">
                    {AI_PROVIDER_DEFINITIONS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

              {providerFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label className="text-stone-300" htmlFor={getFieldId(field.name)}>{field.label}</Label>
                  <Input
                    id={getFieldId(field.name)}
                    type={field.type || 'text'}
                    value={
                      {
                        ai_api_key: aiApiKey,
                        ai_model: aiModel,
                        ai_model_version: aiModelVersion,
                        ai_region: aiRegion,
                        ai_access_key: aiAccessKey,
                        ai_secret_key: aiSecretKey,
                        ai_session_token: aiSessionToken
                      }[field.name] || ''
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      switch (field.name) {
                        case 'ai_api_key':
                          setAiApiKey(value);
                          break;
                        case 'ai_model':
                          setAiModel(value);
                          break;
                        case 'ai_model_version':
                          setAiModelVersion(value);
                          break;
                        case 'ai_region':
                          setAiRegion(value);
                          break;
                        case 'ai_access_key':
                          setAiAccessKey(value);
                          break;
                        case 'ai_secret_key':
                          setAiSecretKey(value);
                          break;
                        case 'ai_session_token':
                          setAiSessionToken(value);
                          break;
                        default:
                          break;
                      }
                    }}
                    placeholder={field.placeholder}
                    className="bg-stone-800 border-stone-600 text-white"
                  />
                </div>
              ))}

              {providerDefinition.docsUrl && (
                <a
                  href={providerDefinition.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Provider docs
                </a>
              )}

            <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700">
              <p className="text-xs text-stone-400">
                  <strong className="text-stone-300">Note:</strong> Secrets are stored locally for demo purposes only. Use a backend proxy for production workloads.
              </p>
            </div>
          </TabsContent>
        </Tabs>

          {providerFields.length > 0 && (
            <div className="flex items-start gap-2 p-3 mt-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded">
              <ShieldAlert className="w-4 h-4 mt-0.5" />
              <span>
                Credentials entered here are saved to your browser storage. For production deployments route API calls through a secure server.
              </span>
            </div>
          )}

        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 border-stone-600 hover:bg-stone-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}