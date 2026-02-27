/**
 * ClawdBotOverlay - Slide-up Chat Interface
 *
 * The main interaction surface for clawdBot.
 * Shows conversation, action feedback, and quick actions.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Bot, Loader2, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { clawdBot } from '../../services/clawdBot';

/**
 * ClawdBotOverlay Component
 */
const ClawdBotOverlay = ({ isOpen, onClose, onNavigate }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'system',
      content: 'Ask me anything.\n\n🆘 Emergency: "Start CPR guide" or "Someone is choking"\n🔍 Search: "Find water purification"\n📊 Dev: "Validate app" or "Check offline coverage"',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send
  const handleSend = useCallback(async () => {
    const query = inputValue.trim();
    if (!query || isProcessing) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setIsThinking(true);

    try {
      // Process through clawdBot
      const response = await clawdBot.ask(query, {
        navigate: onNavigate,
        transition: (cb) => cb() // Simple transition wrapper
      });

      setIsThinking(false);

      // Add clawdBot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.message,
        action: response.action,
        confidence: response.confidence,
        quickActions: response.quickActions,
        result: response.result,
        error: response.error,
        requiresConfirmation: response.requiresConfirmation,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);

      // Handle navigation if result includes it
      if (response.result?.navigated) {
        // Navigation already happened via execution context
        onClose();
      }

      // Handle triage start
      if (response.action === 'start_triage' && response.result?.storyFile) {
        // Navigate to triage with story file
        onNavigate(`/triage/${response.result.storyFile.replace('.ink.json', '')}`);
      }

      // Handle protocol generation
      if (response.action === 'generate_protocol' && response.result?.protocol) {
        // Store protocol and navigate
        onNavigate('/protocol', { protocol: response.result.protocol });
      }

    } catch (error) {
      setIsThinking(false);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: 'Something went wrong. Please try again.',
        error: error.message,
        timestamp: Date.now()
      }]);
    }

    setIsProcessing(false);
  }, [inputValue, isProcessing, onNavigate, onClose]);

  // Handle quick action click
  const handleQuickAction = useCallback((quickAction) => {
    setInputValue(quickAction.query);
    // Auto-send after brief delay
    setTimeout(() => {
      handleSend();
    }, 100);
  }, [handleSend]);

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      />

      {/* Overlay Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
        style={{
          maxHeight: '80vh',
          borderRadius: '24px 24px 0 0',
          background: 'var(--color-bg-secondary)',
          borderTop: '1px solid var(--color-border-primary)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: '1px solid var(--color-border-primary)',
            background: 'var(--color-bg-glass)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px 24px 0 0'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
              }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3
                className="font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                clawdBot
              </h3>
              <p
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {isThinking ? 'Thinking...' : 'Ready'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div
          className="overflow-y-auto px-4 py-4 space-y-4"
          style={{ maxHeight: '50vh', minHeight: '200px' }}
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onQuickAction={handleQuickAction}
            />
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
                }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div
                className="px-4 py-2 rounded-2xl rounded-tl-none"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border-primary)'
                }}
              >
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary-500)' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="px-4 py-3 pb-safe"
          style={{
            borderTop: '1px solid var(--color-border-primary)',
            background: 'var(--color-bg-tertiary)'
          }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask clawdBot..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl transition-all"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-primary)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isProcessing}
              className="p-3 rounded-xl transition-all"
              style={{
                background: inputValue.trim() && !isProcessing
                  ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))'
                  : 'var(--color-bg-secondary)',
                color: inputValue.trim() && !isProcessing ? 'white' : 'var(--color-text-muted)',
                opacity: inputValue.trim() && !isProcessing ? 1 : 0.5
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Hint */}
          <p
            className="text-xs text-center mt-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Try: "Start CPR guide" or "Show riot protocol"
          </p>
        </div>
      </div>
    </>
  );
};

/**
 * Message Bubble Component
 */
const MessageBubble = ({ message, onQuickAction }) => {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';
  const isSystem = message.type === 'system';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isError
              ? 'var(--color-danger)'
              : 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
          }}
        >
          {isError ? (
            <AlertCircle className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
      )}

      {/* Content */}
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        {/* Message bubble */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: isUser
              ? 'var(--color-primary-600)'
              : isError
              ? 'rgba(239, 68, 68, 0.1)'
              : isSystem
              ? 'var(--color-bg-tertiary)'
              : 'var(--color-bg-tertiary)',
            border: isError
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : isSystem
              ? '1px dashed var(--color-border-primary)'
              : '1px solid var(--color-border-primary)',
            borderRadius: isUser ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0'
          }}
        >
          <p
            className="text-sm whitespace-pre-wrap"
            style={{
              color: isUser
                ? 'white'
                : isError
                ? 'var(--color-danger)'
                : 'var(--color-text-secondary)'
            }}
          >
            {message.content}
          </p>

          {/* Confidence indicator for bot messages */}
          {!isUser && !isError && !isSystem && message.confidence && (
            <div
              className="flex items-center gap-1 mt-2 text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {message.confidence > 0.8 ? (
                <>
                  <CheckCircle className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                  High confidence
                </>
              ) : message.confidence > 0.6 ? (
                <>Medium confidence</>
              ) : (
                <>Low confidence — please confirm</>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {message.quickActions && message.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onQuickAction(action)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-primary)',
                  color: 'var(--color-primary-400)'
                }}
              >
                {action.label}
                <ChevronRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {/* Confirmation prompt */}
        {message.requiresConfirmation && (
          <div
            className="mt-2 p-2 rounded-lg text-xs"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--color-info)'
            }}
          >
            Reply "yes" to confirm, "no" to cancel
          </div>
        )}
      </div>
    </div>
  );
};

export default ClawdBotOverlay;
