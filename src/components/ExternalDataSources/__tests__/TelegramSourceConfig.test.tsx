import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TelegramSourceConfig } from '../TelegramSourceConfig';

// Mock de l'API
jest.mock('../../../utils/external-data-api', () => ({
  externalDataApi: {
    testTelegramConnection: jest.fn(),
    createExternalDataSource: jest.fn(),
    updateExternalDataSource: jest.fn(),
    deleteExternalDataSource: jest.fn(),
  },
}));

const mockExternalDataApi = require('../../../utils/external-data-api').externalDataApi;

describe('TelegramSourceConfig', () => {
  const defaultProps = {
    familyId: 'test-family-id',
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<TelegramSourceConfig {...defaultProps} />);
    
    expect(screen.getByText('Nouvelle source Telegram')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom de la source *')).toBeInTheDocument();
    expect(screen.getByLabelText('Token du bot Telegram *')).toBeInTheDocument();
    expect(screen.getByLabelText('ID du chat *')).toBeInTheDocument();
    expect(screen.getByText('Tester')).toBeInTheDocument();
  });

  it('shows edit mode when existingSource is provided', () => {
    const existingSource = {
      id: 'test-source-id',
      family_id: 'test-family-id',
      type: 'telegram' as const,
      name: 'Test Source',
      config: {
        bot_token: 'test-token',
        chat_id: 'test-chat-id',
        description: 'Test description',
      },
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(
      <TelegramSourceConfig
        {...defaultProps}
        existingSource={existingSource}
      />
    );

    expect(screen.getByText('Modifier la source Telegram')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Source')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test-token')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test-chat-id')).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    render(<TelegramSourceConfig {...defaultProps} />);
    
    const saveButton = screen.getByText('Créer');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Le nom de la source est requis')).toBeInTheDocument();
    });
  });

  it('tests connection when test button is clicked', async () => {
    mockExternalDataApi.testTelegramConnection.mockResolvedValue({
      success: true,
    });

    render(<TelegramSourceConfig {...defaultProps} />);
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText('Nom de la source *'), {
      target: { value: 'Test Source' },
    });
    fireEvent.change(screen.getByLabelText('Token du bot Telegram *'), {
      target: { value: 'test-token' },
    });
    fireEvent.change(screen.getByLabelText('ID du chat *'), {
      target: { value: 'test-chat-id' },
    });

    // Click test button
    const testButton = screen.getByText('Tester');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockExternalDataApi.testTelegramConnection).toHaveBeenCalledWith(
        'test-token',
        'test-chat-id'
      );
    });
  });

  it('creates new source when form is submitted', async () => {
    const mockSource = {
      id: 'new-source-id',
      family_id: 'test-family-id',
      type: 'telegram' as const,
      name: 'Test Source',
      config: {
        bot_token: 'test-token',
        chat_id: 'test-chat-id',
        description: 'Test description',
      },
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockExternalDataApi.createExternalDataSource.mockResolvedValue({
      success: true,
      data: mockSource,
    });

    render(<TelegramSourceConfig {...defaultProps} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Nom de la source *'), {
      target: { value: 'Test Source' },
    });
    fireEvent.change(screen.getByLabelText('Token du bot Telegram *'), {
      target: { value: 'test-token' },
    });
    fireEvent.change(screen.getByLabelText('ID du chat *'), {
      target: { value: 'test-chat-id' },
    });
    fireEvent.change(screen.getByLabelText('Description (optionnel)'), {
      target: { value: 'Test description' },
    });

    // Submit form
    const saveButton = screen.getByText('Créer');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockExternalDataApi.createExternalDataSource).toHaveBeenCalledWith({
        family_id: 'test-family-id',
        type: 'telegram',
        name: 'Test Source',
        config: {
          bot_token: 'test-token',
          chat_id: 'test-chat-id',
          description: 'Test description',
        },
      });
    });

    expect(defaultProps.onSave).toHaveBeenCalledWith(mockSource);
  });

  it('updates existing source when editing', async () => {
    const existingSource = {
      id: 'test-source-id',
      family_id: 'test-family-id',
      type: 'telegram' as const,
      name: 'Old Name',
      config: {
        bot_token: 'old-token',
        chat_id: 'old-chat-id',
      },
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const updatedSource = { ...existingSource, name: 'New Name' };

    mockExternalDataApi.updateExternalDataSource.mockResolvedValue({
      success: true,
      data: updatedSource,
    });

    render(
      <TelegramSourceConfig
        {...defaultProps}
        existingSource={existingSource}
      />
    );
    
    // Update name
    fireEvent.change(screen.getByLabelText('Nom de la source *'), {
      target: { value: 'New Name' },
    });

    // Submit form
    const saveButton = screen.getByText('Mettre à jour');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockExternalDataApi.updateExternalDataSource).toHaveBeenCalledWith(
        'test-source-id',
        {
          name: 'New Name',
          config: {
            bot_token: 'old-token',
            chat_id: 'old-chat-id',
          },
        }
      );
    });

    expect(defaultProps.onSave).toHaveBeenCalledWith(updatedSource);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<TelegramSourceConfig {...defaultProps} />);
    
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked in edit mode', async () => {
    const existingSource = {
      id: 'test-source-id',
      family_id: 'test-family-id',
      type: 'telegram' as const,
      name: 'Test Source',
      config: {
        bot_token: 'test-token',
        chat_id: 'test-chat-id',
      },
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockExternalDataApi.deleteExternalDataSource.mockResolvedValue({
      success: true,
    });

    // Mock confirm to return true
    global.confirm = jest.fn(() => true);

    render(
      <TelegramSourceConfig
        {...defaultProps}
        existingSource={existingSource}
        onDelete={defaultProps.onDelete}
      />
    );
    
    const deleteButton = screen.getByText('Supprimer');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockExternalDataApi.deleteExternalDataSource).toHaveBeenCalledWith('test-source-id');
    });

    expect(defaultProps.onDelete).toHaveBeenCalledWith('test-source-id');
  });
});
