import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsModal from '../SettingsModal';

const { mockAuthMe, mockUpdateMe } = vi.hoisted(() => ({
  mockAuthMe: vi.fn(),
  mockUpdateMe: vi.fn()
}));

vi.mock('@/api/platformClient', () => ({
  platformClient: {
    auth: {
      me: mockAuthMe,
      updateMe: mockUpdateMe
    }
  }
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    mockAuthMe.mockReset();
    mockUpdateMe.mockReset();
  });

  it('renders saved Hugging Face credentials when provider is configured', async () => {
    mockAuthMe.mockResolvedValue({
      id: 'user-1',
      chess_username: 'tester',
      ai_provider: 'huggingface',
      ai_model: 'mistralai/Mistral-7B-Instruct',
      ai_api_key: 'hf_secret'
    });

    const user = userEvent.setup();
    render(<SettingsModal open onOpenChange={() => {}} />);

    await user.click(screen.getByRole('tab', { name: /ai config/i }));

    const modelInput = await screen.findByLabelText('Model ID');
    expect(modelInput).toHaveValue('mistralai/Mistral-7B-Instruct');

    expect(screen.getByLabelText('HF API Key')).toHaveValue('hf_secret');
    expect(screen.getByText(/credentials entered here are saved/i)).toBeInTheDocument();
  });

  it('persists updated Bedrock credentials through platformClient', async () => {
    mockAuthMe.mockResolvedValue({
      id: 'user-2',
      chess_username: 'hikaru',
      ai_provider: 'bedrock',
      ai_model: 'anthropic.claude-3-sonnet-20240229-v1:0',
      ai_region: 'us-east-1',
      ai_access_key: '',
      ai_secret_key: '',
      ai_session_token: ''
    });
    mockUpdateMe.mockResolvedValue({});

    const onOpenChange = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(<SettingsModal open onOpenChange={onOpenChange} onSave={onSave} />);

    await user.click(screen.getByRole('tab', { name: /ai config/i }));

    const regionInput = await screen.findByLabelText('AWS Region');
    await user.clear(regionInput);
    await user.type(regionInput, 'us-west-2');

    const modelInput = screen.getByLabelText('Bedrock Model ID');
    await user.clear(modelInput);
    await user.type(modelInput, 'anthropic.claude-3-haiku-20240307-v1:0');

    const accessKeyInput = screen.getByLabelText('AWS Access Key ID');
    await user.type(accessKeyInput, 'AKIA123');

    const secretKeyInput = screen.getByLabelText('AWS Secret Access Key');
    await user.type(secretKeyInput, 'aws-secret');

    const sessionTokenInput = screen.getByLabelText('AWS Session Token (optional)');
    await user.type(sessionTokenInput, 'session-token');

    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(mockUpdateMe).toHaveBeenCalled();
    });

    expect(mockUpdateMe).toHaveBeenCalledWith({
      chess_username: 'hikaru',
      ai_provider: 'bedrock',
      ai_api_key: '',
      ai_model: 'anthropic.claude-3-haiku-20240307-v1:0',
      ai_model_version: '',
      ai_region: 'us-west-2',
      ai_access_key: 'AKIA123',
      ai_secret_key: 'aws-secret',
      ai_session_token: 'session-token'
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSave).toHaveBeenCalledWith({ chessUsername: 'hikaru', aiProvider: 'bedrock' });
  });
});
