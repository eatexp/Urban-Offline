/**
 * ClawdBotFAB - Floating Action Button
 *
 * The primary interface to clawdBot. Always visible,
 * expands into chat overlay when tapped.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Sparkles, MessageCircle } from 'lucide-react';
import { clawdBot } from '../../services/clawdBot';
import { useViewTransition } from '../../hooks/useViewTransition';
import ClawdBotOverlay from './ClawdBotOverlay';

/**
 * ClawdBotFAB Component
 */
const ClawdBotFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasProactive, setHasProactive] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState(null);
  const navigate = useNavigate();
  const transition = useViewTransition();
  const fabRef = useRef(null);

  // Handle proactive suggestion click
  const handleProactiveClick = useCallback(async () => {
    setHasProactive(false);
    
    if (proactiveMessage?.action) {
      // Execute the suggested action
      const response = await clawdBot.ask(
        proactiveMessage.action.params?.destination || 'navigate',
        { navigate, transition }
      );
      
      if (response.result?.navigated) {
        // Navigation happened, we're done
        return;
      }
    }
    
    // Otherwise open overlay with suggestion
    setIsOpen(true);
  }, [proactiveMessage, navigate, transition]);

  // Check for proactive suggestions
  const checkProactiveSuggestion = useCallback(() => {
    const suggestion = clawdBot.getProactiveSuggestion();
    if (suggestion) {
      setProactiveMessage(suggestion);
      setHasProactive(true);
    }
  }, []);

  // Handle FAB click
  const handleFabClick = useCallback(() => {
    if (hasProactive && proactiveMessage) {
      // Execute proactive suggestion
      handleProactiveClick();
    } else {
      // Open overlay
      setIsOpen(true);
    }
  }, [hasProactive, proactiveMessage, handleProactiveClick]);

  // Initialize clawdBot on mount
  useEffect(() => {
    const init = async () => {
      await clawdBot.init();
      
      // Check for proactive suggestion
      checkProactiveSuggestion();
    };
    
    init();

    // Periodic check for proactive suggestions
    const interval = setInterval(checkProactiveSuggestion, 30000);
    return () => clearInterval(interval);
  }, [checkProactiveSuggestion]);

  // Close overlay
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle navigation from overlay
  const handleNavigate = useCallback((destination, navContext) => {
    transition(() => {
      navigate(destination, navContext ? { state: navContext } : undefined);
    });
    setIsOpen(false);
  }, [navigate, transition]);

  // Dismiss proactive
  const dismissProactive = (e) => {
    e.stopPropagation();
    setHasProactive(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div
        ref={fabRef}
        className={`fixed z-50 transition-all duration-300 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          bottom: '24px',
          right: '24px'
        }}
      >
        {/* Proactive suggestion tooltip */}
        {hasProactive && proactiveMessage && (
          <div
            className="absolute bottom-full right-0 mb-3 animate-fade-in"
            style={{ width: '240px' }}
          >
            <div
              className="rounded-xl p-3 shadow-lg relative"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-primary-500)'
              }}
            >
              <button
                onClick={dismissProactive}
                className="absolute top-1 right-1 p-1 rounded-full transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                aria-label="Dismiss suggestion"
              >
                <X size={14} />
              </button>
              <p
                className="text-sm pr-5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {proactiveMessage.message}
              </p>
              <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-3 h-3"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderRight: '1px solid var(--color-primary-500)',
                  borderBottom: '1px solid var(--color-primary-500)'
                }}
              />
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={handleFabClick}
          className={`
            relative w-14 h-14 rounded-full shadow-2xl 
            flex items-center justify-center
            transition-all duration-300 transform
            hover:scale-110 active:scale-95
            ${hasProactive ? 'animate-pulse' : ''}
          `}
          style={{
            background: hasProactive
              ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
              : 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
            boxShadow: hasProactive
              ? '0 0 20px rgba(99, 102, 241, 0.5)'
              : '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
          aria-label={hasProactive ? 'clawdBot has a suggestion' : 'Open clawdBot'}
        >
          {hasProactive ? (
            <Sparkles className="w-6 h-6 text-white" />
          ) : (
            <Bot className="w-6 h-6 text-white" />
          )}
          
          {/* Pulse ring when proactive */}
          {hasProactive && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-purple))'
              }}
            />
          )}
        </button>
      </div>

      {/* Overlay */}
      <ClawdBotOverlay
        isOpen={isOpen}
        onClose={handleClose}
        onNavigate={handleNavigate}
        proactiveMessage={proactiveMessage}
      />
    </>
  );
};

export default ClawdBotFAB;
