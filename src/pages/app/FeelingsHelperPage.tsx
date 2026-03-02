import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { apiChat } from '@/lib/api';
import { processMarkdown } from '@/lib/markdown';
import { feelings } from '@/data/gameData';
import VoiceRecorder from '@/components/VoiceRecorder';

const FEELINGS_CONTEXT_PREFIX = `[FEELINGS HELPER MODE] The child is using the Feelings Helper. Your role is to be a caring emotional support companion. CRITICAL RULES FOR THIS MODE:
1. ALWAYS take the child's feelings seriously - never dismiss, minimize, or redirect away from their concern
2. ALWAYS acknowledge what they said and validate their feelings first
3. Provide gentle, age-appropriate guidance on how to handle or solve the situation they describe
4. Remember previous messages in this conversation and respond accordingly
5. If they describe a problem, help them work through it step by step
6. NEVER say "let's talk about something else" or change the topic - stay focused on helping them
7. Use empathy, warmth, and practical child-friendly advice
8. If they mention abuse, bullying, or danger, follow the safety protocol immediately

The child says: `;

const FeelingsHelperPage: React.FC = () => {
  const { currentUser, currentUserName, userRole, sessionToken } = useAuth();
  const { voiceEnabled, toggleVoice, currentVolume, setCurrentVolume, conversationHistory, setConversationHistory, showNotification } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFeelings, setShowFeelings] = useState(false);
  const [feelingsHistory, setFeelingsHistory] = useState<{ role: string; content: string }[]>([]);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: `Hi ${currentUserName}! 😊 How are you feeling today? Tap the 😊 button to pick a feeling, or just type to tell me! 🌟` }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFeelingClick = async (feelingKey: string) => {
    const feeling = feelings[feelingKey];
    if (!feeling) return;
    setShowFeelings(false);

    const userMsg = `I'm feeling ${feeling.name} ${feeling.emoji}`;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      // Send to AI with feelings context so it can provide deeper, contextual help
      const contextMsg = FEELINGS_CONTEXT_PREFIX + userMsg;
      const result = await apiChat(contextMsg, feelingsHistory, userRole, sessionToken, currentUser?.id || null, currentUser?.email || null, false);
      const reply = result.response || feeling.prompt;

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setFeelingsHistory(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: reply }]);

      if (voiceEnabled) {
        const utterance = new SpeechSynthesisUtterance(reply.replace(/[*#_`]/g, ''));
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    } catch {
      // Fallback to static prompt if API fails
      setMessages(prev => [...prev, { role: 'assistant', content: feeling.prompt }]);
      setFeelingsHistory(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: feeling.prompt }]);
    }
    setIsTyping(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    const msg = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTyping(true);

    try {
      // Prepend feelings context so AI knows to be an emotional support guide
      const contextMsg = FEELINGS_CONTEXT_PREFIX + msg;
      const result = await apiChat(contextMsg, feelingsHistory, userRole, sessionToken, currentUser?.id || null, currentUser?.email || null, false);
      const reply = result.response || result.error || "I'm here to help! 😊";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setFeelingsHistory(prev => [...prev, { role: 'user', content: msg }, { role: 'assistant', content: reply }]);
      setConversationHistory(prev => [...prev, { role: 'user', content: msg }, { role: 'assistant', content: reply }]);
      if (voiceEnabled) {
        const utterance = new SpeechSynthesisUtterance(reply.replace(/[*#_`]/g, ''));
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops! Something went wrong. Please try again! 😊" }]);
    }
    setIsTyping(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Controls */}
      <div className="controls" style={{ flexShrink: 0 }}>
        <button className="control-btn" onClick={() => {
          setMessages([{ role: 'assistant', content: `Hi ${currentUserName}! 😊 How are you feeling today? Tap the 😊 button to pick a feeling, or just type to tell me! 🌟` }]);
          setFeelingsHistory([]);
          setConversationHistory([]);
          showNotification('🗑️ Chat cleared!');
        }}>🗑️ Clear</button>
        <button className="control-btn" onClick={toggleVoice}>{voiceEnabled ? '🔊 Voice' : '🔇 Voice'}</button>
        <div className="setting-item">
          <span>🔊</span>
          <input type="range" min="0" max="1" step="0.1" value={currentVolume} onChange={e => setCurrentVolume(parseFloat(e.target.value))} className="volume-slider" />
        </div>
      </div>

      {/* Chat messages */}
      <div className="messages" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-avatar">{msg.role === 'user' ? '👤' : '🐱'}</div>
            <div className="message-content" dangerouslySetInnerHTML={{ __html: processMarkdown(msg.content) }} />
          </div>
        ))}
        {isTyping && (
          <div className="message assistant typing-indicator">
            <div className="message-avatar">🐱</div>
            <div className="message-content">Thinking... 🤔</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Feelings popup panel - appears above input */}
      {showFeelings && (
        <div style={{
          flexShrink: 0, padding: '8px', background: 'rgba(255,255,255,0.08)',
          borderRadius: '14px', marginBottom: '6px', maxHeight: '35vh', overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {Object.entries(feelings).map(([key, f]) => (
              <button key={key} onClick={() => handleFeelingClick(key)} style={{
                background: f.color, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '12px',
                padding: '8px 4px', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '2px', fontFamily: 'inherit', fontSize: '0.75em', fontWeight: 600,
                transition: 'transform 0.2s', minHeight: '52px',
              }}>
                <span style={{ fontSize: '1.6em' }}>{f.emoji}</span>
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area with feelings toggle */}
      <div className="input-area" style={{ flexShrink: 0 }}>
        <button
          onClick={() => setShowFeelings(!showFeelings)}
          style={{
            background: showFeelings ? 'rgba(79,195,247,0.3)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px',
            padding: '8px 10px', cursor: 'pointer', fontSize: '1.3em', flexShrink: 0,
            transition: 'all 0.2s',
          }}
          title="Pick a feeling"
        >
          😊
        </button>
        <VoiceRecorder onTranscript={(text) => setInputMessage(prev => prev ? prev + ' ' + text : text)} disabled={isTyping} />
        <input className="input-field" placeholder="Tell me how you're feeling... 💬" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={isTyping} />
        <button className="send-button" onClick={sendMessage} disabled={isTyping || !inputMessage.trim()}>➤</button>
      </div>
    </div>
  );
};

export default FeelingsHelperPage;