// ============================================================================
// AI CHAT COMPONENT
// Main conversational interface for Sporely AI Assistant
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAI } from '../../lib/ai';
import type { ChatMessage, SuggestedAction } from '../../lib/ai/types';

// =============================================================================
// ICONS
// =============================================================================

const Icons = {
  Send: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Image: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  DNA: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Minimize: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
  Maximize: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  ),
  Loader: () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
};

// =============================================================================
// PROPS
// =============================================================================

interface AIChatProps {
  // Positioning
  mode?: 'inline' | 'floating' | 'fullscreen';
  isOpen?: boolean;
  onClose?: () => void;

  // Context
  contextEntityType?: 'culture' | 'grow' | 'inventory' | 'location' | 'recipe' | 'strain' | 'general';
  contextEntityId?: string;
  contextEntityLabel?: string;

  // Customization
  placeholder?: string;
  welcomeMessage?: string;
  quickActions?: Array<{ label: string; prompt: string }>;
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

const DEFAULT_QUICK_ACTIONS = [
  { label: 'Analyze my grows', prompt: 'Analyze my active grows and suggest any improvements' },
  { label: 'Check cultures', prompt: 'Review my culture library and flag any that need attention' },
  { label: 'Environment tips', prompt: 'What environmental conditions should I optimize for my current grows?' },
  { label: 'Contamination help', prompt: 'Help me identify and prevent contamination issues' },
];

// =============================================================================
// MESSAGE COMPONENT
// =============================================================================

const MessageBubble: React.FC<{
  message: ChatMessage;
  onActionClick?: (action: SuggestedAction) => void;
}> = ({ message, onActionClick }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-zinc-700' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}
      `}>
        {isUser ? (
          <Icons.User />
        ) : (
          <Icons.DNA />
        )}
      </div>

      {/* Message Content */}
      <div className={`
        max-w-[80%] rounded-2xl px-4 py-3
        ${isUser
          ? 'bg-emerald-600/20 border border-emerald-500/30'
          : 'bg-zinc-800/80 border border-zinc-700/50'
        }
      `}>
        {/* Role label */}
        <p className={`text-xs font-medium mb-1 ${isUser ? 'text-emerald-400' : 'text-zinc-400'}`}>
          {isUser ? 'You' : 'Sporely AI'}
          {message.processingTimeMs && !isUser && (
            <span className="text-zinc-500 ml-2">
              {(message.processingTimeMs / 1000).toFixed(1)}s
            </span>
          )}
        </p>

        {/* Message text */}
        <div className="text-sm text-zinc-200 whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Images if any */}
        {message.images && message.images.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt="Attached"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            ))}
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-zinc-700/50">
            <p className="text-xs text-zinc-500 mb-1">Sources:</p>
            <div className="flex flex-wrap gap-1">
              {message.sources.map((source, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-zinc-700/50 text-zinc-400 rounded-full"
                >
                  {source.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onActionClick?.(action)}
                className="text-xs px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AIChat: React.FC<AIChatProps> = ({
  mode = 'inline',
  isOpen = true,
  onClose,
  contextEntityType = 'general',
  contextEntityId,
  contextEntityLabel,
  placeholder = 'Ask me anything about your grows...',
  welcomeMessage,
  quickActions = DEFAULT_QUICK_ACTIONS,
}) => {
  // AI hook
  const {
    sendMessage,
    messages,
    isLoading,
    error,
    clearMessages,
  } = useAI({
    contextEntityType,
    contextEntityId,
    onError: (err) => console.error('AI Error:', err),
  });

  // Local state
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    await sendMessage(trimmed);
  }, [input, isLoading, sendMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle quick action
  const handleQuickAction = useCallback((prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  }, []);

  // Handle suggested action
  const handleSuggestedAction = useCallback((action: SuggestedAction) => {
    // TODO: Implement action handling based on type
    console.log('Action clicked:', action);
  }, []);

  // Don't render if closed (for floating mode)
  if (mode === 'floating' && !isOpen) {
    return null;
  }

  // Wrapper classes based on mode
  const wrapperClasses = {
    inline: 'relative w-full h-full min-h-[400px]',
    floating: 'fixed bottom-4 right-4 w-[400px] max-w-[calc(100vw-2rem)] z-50 shadow-2xl rounded-2xl overflow-hidden',
    fullscreen: 'fixed inset-0 z-50',
  };

  return (
    <div className={`
      ${wrapperClasses[mode]}
      bg-zinc-900/95 backdrop-blur-xl border border-zinc-800
      flex flex-col
      ${mode === 'floating' ? 'h-[600px] max-h-[calc(100vh-2rem)]' : ''}
      ${mode === 'fullscreen' ? '' : 'rounded-2xl'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Icons.Sparkles />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Sporely AI</h3>
            {contextEntityLabel && (
              <p className="text-xs text-zinc-500">
                Context: {contextEntityLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {mode === 'floating' && (
            <>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <Icons.Minimize />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <Icons.Close />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Minimized state */}
      {isMinimized && mode === 'floating' ? null : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center border border-emerald-500/30">
                  <Icons.DNA />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Welcome to Sporely AI
                </h4>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
                  {welcomeMessage || 'I can help you analyze your grows, identify contamination, optimize conditions, and answer mycology questions.'}
                </p>

                {/* Quick Actions */}
                <div className="flex flex-wrap justify-center gap-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="text-xs px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onActionClick={handleSuggestedAction}
              />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Icons.Loader />
                </div>
                <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl px-4 py-3">
                  <p className="text-xs text-zinc-400 mb-1">Sporely AI</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-zinc-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                {error.message}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex items-end gap-2">
              {/* Image upload button */}
              <button
                className="p-2.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                title="Upload image for analysis"
              >
                <Icons.Image />
              </button>

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  rows={1}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none min-h-[42px] max-h-[120px]"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`
                  p-2.5 rounded-xl transition-all
                  ${input.trim() && !isLoading
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? <Icons.Loader /> : <Icons.Send />}
              </button>
            </div>

            {/* Token usage hint */}
            <p className="text-xs text-zinc-600 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChat;
