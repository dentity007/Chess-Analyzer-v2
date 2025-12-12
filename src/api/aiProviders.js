/* c8 ignore file */
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { analyzeGameLocally } from './analysisEngine';

const JSON_INSTRUCTIONS = `Analyze this chess game PGN and respond with JSON using the schema:
{
  "total_moves": number,
  "blunders": [{"move_number": number, "move": string, "player": "white"|"black", "evaluation_change": number}],
  "mistakes": [{"move_number": number, "move": string, "player": "white"|"black", "evaluation_change": number}],
  "white_accuracy": number,
  "black_accuracy": number,
  "critical_moments": [{"move_number": number, "description": string}],
  "opening_assessment": string,
  "coaching_advice": string,
  "suggested_questions": string[]
}
Return ONLY valid JSON.`;

function buildQuestionPrompt(game, question) {
  const truncatedPgn = game?.pgn?.substring(0, 4000) || '';
  const trimmedQuestion = (question || '').trim() || 'Give me one practical improvement I should focus on for this game.';
  return `You are a concise chess coach. Use the game PGN and answer the question in 2-4 sentences with 1 actionable takeaway.\nQuestion: ${trimmedQuestion}\nPGN:\n${truncatedPgn}`;
}

export const AI_PROVIDER_DEFINITIONS = [
  {
    id: 'local',
    label: 'Local (Offline)',
    description: 'Built-in heuristic analyzer—works without any API keys.',
    fields: []
  },
  {
    id: 'xai',
    label: 'xAI (Grok)',
    description: 'Call Grok through the official xAI API.',
    docsUrl: 'https://docs.x.ai/docs/api-reference',
    fields: [
      { name: 'ai_model', label: 'Model ID', placeholder: 'grok-beta' },
      { name: 'ai_api_key', label: 'xAI API Key', placeholder: 'xai_sk_...', type: 'password' }
    ]
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'Use GPT-4o, GPT-4.1, or any other OpenAI chat completion model.',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    fields: [
      { name: 'ai_model', label: 'Model ID', placeholder: 'gpt-4o-mini' },
      { name: 'ai_api_key', label: 'OpenAI API Key', placeholder: 'sk-...', type: 'password' }
    ]
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    description: 'Connect directly to the Claude Messages API.',
    docsUrl: 'https://docs.anthropic.com/claude/reference/messages_post',
    fields: [
      { name: 'ai_model', label: 'Model ID', placeholder: 'claude-3-5-sonnet-20241022' },
      { name: 'ai_model_version', label: 'Anthropic Version', placeholder: '2023-06-01' },
      { name: 'ai_api_key', label: 'Anthropic API Key', placeholder: 'sk-ant-...', type: 'password' }
    ]
  },
  {
    id: 'huggingface',
    label: 'Hugging Face Inference API',
    description: 'Calls a Hugging Face model using your personal access token.',
    docsUrl: 'https://huggingface.co/docs/api-inference/index',
    fields: [
      { name: 'ai_model', label: 'Model ID', placeholder: 'mistralai/Mistral-7B-Instruct' },
      { name: 'ai_api_key', label: 'HF API Key', placeholder: 'hf_xxx', type: 'password' }
    ]
  },
  {
    id: 'replicate',
    label: 'Replicate',
    description: 'Use hosted OSS models through Replicate predictions.',
    docsUrl: 'https://replicate.com/docs/reference/http',
    fields: [
      { name: 'ai_model', label: 'Model (owner/name)', placeholder: 'replicate/llama-2-13b-chat' },
      { name: 'ai_model_version', label: 'Model Version', placeholder: 'latest version hash' },
      { name: 'ai_api_key', label: 'Replicate API Token', placeholder: 'r8_xxx', type: 'password' }
    ]
  },
  {
    id: 'bedrock',
    label: 'Amazon Bedrock',
    description: 'Invoke Bedrock models directly with AWS credentials (Claude, Titan, etc.).',
    docsUrl: 'https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html',
    fields: [
      { name: 'ai_region', label: 'AWS Region', placeholder: 'us-east-1' },
      { name: 'ai_model', label: 'Bedrock Model ID', placeholder: 'anthropic.claude-3-sonnet-20240229-v1:0' },
      { name: 'ai_access_key', label: 'AWS Access Key ID' },
      { name: 'ai_secret_key', label: 'AWS Secret Access Key', type: 'password' },
      { name: 'ai_session_token', label: 'AWS Session Token (optional)', type: 'password' }
    ]
  }
];

function buildPrompt(game) {
  const truncatedPgn = game.pgn?.substring(0, 4000) || '';
  return `${JSON_INSTRUCTIONS}\n\nPGN:\n${truncatedPgn}`;
}

function extractJsonFromText(text) {
  if (typeof text !== 'string') {
    throw new Error('Model response was not a string');
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON detected in response');
  }
  const jsonString = text.slice(start, end + 1);
  return JSON.parse(jsonString);
}

function normalizeAnalysis(json) {
  return {
    total_moves: json.total_moves || 0,
    blunders: json.blunders || [],
    mistakes: json.mistakes || [],
    white_accuracy: json.white_accuracy || 0,
    black_accuracy: json.black_accuracy || 0,
    critical_moments: json.critical_moments || [],
    opening_assessment: json.opening_assessment || '',
    coaching_advice: json.coaching_advice || '',
    suggested_questions: json.suggested_questions || []
  };
}

function unwrapChatContent(content) {
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part?.text) return part.text;
        if (part?.content) return unwrapChatContent(part.content);
        return '';
      })
      .join('\n')
      .trim();
  }
  if (typeof content === 'string') {
    return content;
  }
  if (content?.text) {
    return content.text;
  }
  return JSON.stringify(content ?? {});
}

async function analyzeWithXAI(game, settings) {
  if (!settings?.ai_api_key) {
    throw new Error('Missing xAI API key');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.ai_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.ai_model || 'grok-beta',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are a chess analyst who returns strictly valid JSON.' },
        { role: 'user', content: buildPrompt(game) }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI error: ${errorText}`);
  }

  const payload = await response.json();
  const text = unwrapChatContent(payload.choices?.[0]?.message?.content || '');
  return normalizeAnalysis(extractJsonFromText(text));
}

async function analyzeWithOpenAI(game, settings) {
  if (!settings?.ai_api_key) {
    throw new Error('Missing OpenAI API key');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.ai_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.ai_model || 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are a chess analyst who returns strictly valid JSON.' },
        { role: 'user', content: buildPrompt(game) }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${errorText}`);
  }

  const payload = await response.json();
  const text = unwrapChatContent(payload.choices?.[0]?.message?.content || '');
  return normalizeAnalysis(extractJsonFromText(text));
}

async function analyzeWithAnthropic(game, settings) {
  if (!settings?.ai_api_key) {
    throw new Error('Missing Anthropic API key');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': settings.ai_api_key,
      'anthropic-version': settings.ai_model_version || '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.ai_model || 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: buildPrompt(game)
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic error: ${errorText}`);
  }

  const payload = await response.json();
  const text = unwrapChatContent(payload.content || payload.output || '');
  return normalizeAnalysis(extractJsonFromText(text));
}

async function analyzeWithHuggingFace(game, settings) {
  if (!settings?.ai_api_key || !settings?.ai_model) {
    throw new Error('Missing Hugging Face token or model');
  }
  const response = await fetch(`https://api-inference.huggingface.co/models/${settings.ai_model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.ai_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: buildPrompt(game) })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face error: ${errorText}`);
  }

  const data = await response.json();
  const text = Array.isArray(data)
    ? data[0]?.generated_text || data[0]?.summary_text || JSON.stringify(data[0])
    : data.generated_text || data.output_text || JSON.stringify(data);
  return normalizeAnalysis(extractJsonFromText(text));
}

async function pollReplicatePrediction(predictionId, apiKey) {
  while (true) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    const payload = await res.json();
    if (payload.status === 'succeeded') {
      return payload;
    }
    if (payload.status === 'failed' || payload.status === 'canceled') {
      throw new Error(payload.error || 'Replicate prediction failed');
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

async function analyzeWithReplicate(game, settings) {
  if (!settings?.ai_api_key || !settings?.ai_model_version || !settings?.ai_model) {
    throw new Error('Missing Replicate configuration');
  }

  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.ai_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: settings.ai_model_version,
      input: {
        prompt: buildPrompt(game)
      }
    })
  });

  const created = await createResponse.json();
  if (createResponse.status >= 400) {
    throw new Error(created?.detail || 'Replicate request failed');
  }

  const result = await pollReplicatePrediction(created.id, settings.ai_api_key);
  const output = Array.isArray(result.output) ? result.output.join('\n') : result.output;
  return normalizeAnalysis(extractJsonFromText(output));
}

async function analyzeWithBedrock(game, settings) {
  const { ai_access_key, ai_secret_key, ai_region, ai_model, ai_session_token } = settings || {};
  if (!ai_access_key || !ai_secret_key || !ai_region || !ai_model) {
    throw new Error('Missing AWS Bedrock credentials/config');
  }

  const client = new BedrockRuntimeClient({
    region: ai_region,
    credentials: {
      accessKeyId: ai_access_key,
      secretAccessKey: ai_secret_key,
      sessionToken: ai_session_token || undefined
    }
  });

  let body;
  if (ai_model.startsWith('anthropic.')) {
    body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 800,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildPrompt(game)
            }
          ]
        }
      ]
    });
  } else {
    body = JSON.stringify({
      inputText: buildPrompt(game),
      textGenerationConfig: {
        maxTokenCount: 800,
        temperature: 0.2
      }
    });
  }

  const command = new InvokeModelCommand({
    modelId: ai_model,
    contentType: 'application/json',
    accept: 'application/json',
    body
  });

  const response = await client.send(command);
  const raw = new TextDecoder().decode(response.body);
  let text;
  if (ai_model.startsWith('anthropic.')) {
    const json = JSON.parse(raw);
    const contents = json?.content || json?.output || json?.output_text || [];
    if (Array.isArray(contents)) {
      text = contents.map((item) => item?.text || '').join('\n');
    } else if (typeof contents === 'string') {
      text = contents;
    } else {
      text = json?.result || raw;
    }
  } else {
    const json = JSON.parse(raw);
    text = json?.results?.[0]?.outputText || json?.completions?.[0]?.data?.text || raw;
  }
  return normalizeAnalysis(extractJsonFromText(text));
}

async function answerQuestionLocally(game, question) {
  const analysis = await analyzeGameLocally(game);
  const blunder = analysis?.blunders?.[0];
  const mistake = analysis?.mistakes?.[0];
  const hooks = [];
  if (blunder) {
    hooks.push(`Biggest swing: move ${blunder.move_number} (${blunder.move}) costing about ${blunder.evaluation_change} cp.`);
  }
  if (mistake) {
    hooks.push(`Another miss: move ${mistake.move_number} (${mistake.move}).`);
  }
  const baseline = hooks.join(' ');
  return (
    `${question ? `Q: ${question}\n` : ''}` +
    (baseline || 'Game looked steady; focus on reviewing critical moments and time usage.') +
    ' Practical next step: replay those moves on a board and find a single safer alternative.'
  ).trim();
}

async function askWithXAI(game, question, settings) {
  if (!settings?.ai_api_key) {
    throw new Error('Missing xAI API key');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.ai_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.ai_model || 'grok-beta',
      temperature: 0.5,
      messages: [
        { role: 'system', content: 'You are a concise chess coach. Use the PGN to answer clearly in 2-4 sentences.' },
        { role: 'user', content: buildQuestionPrompt(game, question) }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI error: ${errorText}`);
  }

  const payload = await response.json();
  return unwrapChatContent(payload.choices?.[0]?.message?.content || '').trim();
}

async function askWithOpenAI(game, question, settings) {
  if (!settings?.ai_api_key) {
    throw new Error('Missing OpenAI API key');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.ai_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.ai_model || 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'You are a concise chess coach. Cite the move numbers you reference.' },
        { role: 'user', content: buildQuestionPrompt(game, question) }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${errorText}`);
  }

  const payload = await response.json();
  return unwrapChatContent(payload.choices?.[0]?.message?.content || '').trim();
}

async function askWithAnthropic(game, question, settings) {
  if (!settings?.ai_api_key) {
    throw new Error('Missing Anthropic API key');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': settings.ai_api_key,
      'anthropic-version': settings.ai_model_version || '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.ai_model || 'claude-3-5-sonnet-20241022',
      max_tokens: 400,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: buildQuestionPrompt(game, question)
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic error: ${errorText}`);
  }

  const payload = await response.json();
  return unwrapChatContent(payload.content || payload.output || '').trim();
}

async function askWithHuggingFace(game, question, settings) {
  if (!settings?.ai_api_key || !settings?.ai_model) {
    throw new Error('Missing Hugging Face token or model');
  }
  const response = await fetch(`https://api-inference.huggingface.co/models/${settings.ai_model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.ai_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: buildQuestionPrompt(game, question) })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face error: ${errorText}`);
  }

  const data = await response.json();
  const text = Array.isArray(data)
    ? data[0]?.generated_text || data[0]?.summary_text || JSON.stringify(data[0])
    : data.generated_text || data.output_text || JSON.stringify(data);
  return unwrapChatContent(text).trim();
}

async function askWithReplicate(game, question, settings) {
  if (!settings?.ai_api_key || !settings?.ai_model_version || !settings?.ai_model) {
    throw new Error('Missing Replicate configuration');
  }

  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.ai_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: settings.ai_model_version,
      input: {
        prompt: buildQuestionPrompt(game, question)
      }
    })
  });

  const created = await createResponse.json();
  if (createResponse.status >= 400) {
    throw new Error(created?.detail || 'Replicate request failed');
  }

  const result = await pollReplicatePrediction(created.id, settings.ai_api_key);
  const output = Array.isArray(result.output) ? result.output.join('\n') : result.output;
  return unwrapChatContent(output || '').trim();
}

async function askWithBedrock(game, question, settings) {
  const { ai_access_key, ai_secret_key, ai_region, ai_model, ai_session_token } = settings || {};
  if (!ai_access_key || !ai_secret_key || !ai_region || !ai_model) {
    throw new Error('Missing AWS Bedrock credentials/config');
  }

  const client = new BedrockRuntimeClient({
    region: ai_region,
    credentials: {
      accessKeyId: ai_access_key,
      secretAccessKey: ai_secret_key,
      sessionToken: ai_session_token || undefined
    }
  });

  let body;
  if (ai_model.startsWith('anthropic.')) {
    body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 400,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildQuestionPrompt(game, question)
            }
          ]
        }
      ]
    });
  } else {
    body = JSON.stringify({
      inputText: buildQuestionPrompt(game, question),
      textGenerationConfig: {
        maxTokenCount: 400,
        temperature: 0.4
      }
    });
  }

  const command = new InvokeModelCommand({
    modelId: ai_model,
    contentType: 'application/json',
    accept: 'application/json',
    body
  });

  const response = await client.send(command);
  const raw = new TextDecoder().decode(response.body);
  if (ai_model.startsWith('anthropic.')) {
    const json = JSON.parse(raw);
    const contents = json?.content || json?.output || json?.output_text || [];
    if (Array.isArray(contents)) {
      return contents.map((item) => item?.text || '').join('\n').trim();
    }
    if (typeof contents === 'string') return contents.trim();
    return (json?.result || raw || '').trim();
  }
  const json = JSON.parse(raw);
  const text = json?.results?.[0]?.outputText || json?.completions?.[0]?.data?.text || raw;
  return unwrapChatContent(text || '').trim();
}

export async function askQuestionWithProvider(game, question, userSettings = {}) {
  const rawProvider = (userSettings.ai_provider || 'local').toLowerCase();
  const provider = rawProvider === 'auto' ? 'local' : rawProvider;
  try {
    if (provider === 'xai') {
      return await askWithXAI(game, question, userSettings);
    }
    if (provider === 'openai') {
      return await askWithOpenAI(game, question, userSettings);
    }
    if (provider === 'anthropic') {
      return await askWithAnthropic(game, question, userSettings);
    }
    if (provider === 'huggingface') {
      return await askWithHuggingFace(game, question, userSettings);
    }
    if (provider === 'replicate') {
      return await askWithReplicate(game, question, userSettings);
    }
    if (provider === 'bedrock') {
      return await askWithBedrock(game, question, userSettings);
    }
  } catch (error) {
    console.warn('[AI provider] Question failed, falling back to local answer.', error);
  }

  return answerQuestionLocally(game, question);
}

export async function analyzeWithProvider(game, userSettings = {}) {
  const rawProvider = (userSettings.ai_provider || 'local').toLowerCase();
  const provider = rawProvider === 'auto' ? 'local' : rawProvider;
  try {
    if (provider === 'xai') {
      return await analyzeWithXAI(game, userSettings);
    }
    if (provider === 'openai') {
      return await analyzeWithOpenAI(game, userSettings);
    }
    if (provider === 'anthropic') {
      return await analyzeWithAnthropic(game, userSettings);
    }
    if (provider === 'huggingface') {
      return await analyzeWithHuggingFace(game, userSettings);
    }
    if (provider === 'replicate') {
      return await analyzeWithReplicate(game, userSettings);
    }
    if (provider === 'bedrock') {
      return await analyzeWithBedrock(game, userSettings);
    }
  } catch (error) {
    console.warn('[AI provider] Falling back to local analysis because provider call failed.', error);
  }

  return analyzeGameLocally(game);
}
