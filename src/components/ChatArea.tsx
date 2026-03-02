import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { apiChat } from '@/lib/api';
import { processMarkdown } from '@/lib/markdown';
import { externalSupabase } from '@/lib/externalSupabase';
import VoiceRecorder from '@/components/VoiceRecorder';

interface ChatAreaProps {
  socialStoriesMode?: boolean;
  initialMessages?: { role: string; content: string }[];
}

function checkIfImageRequest(message: string) {
  const keywords = ['generate image','create image','make image','draw','picture of','show me image','create picture','generate picture','make picture','draw me','create drawing','make drawing','image of','picture','generate photo','create photo','illustration','sketch','paint','show me a photo','can you draw','show me what','looks like'];
  return keywords.some(k => message.toLowerCase().includes(k));
}

function checkIfVideoRequest(message: string) {
  const keywords = ['generate video','create video','make video','video of','show me video','create animation','make animation','animate','video clip','moving picture','motion','film','movie','animated','show movement','in motion','moving','action'];
  return keywords.some(k => message.toLowerCase().includes(k));
}

const ChatArea: React.FC<ChatAreaProps> = ({ socialStoriesMode = false, initialMessages }) => {
  const { currentUser, currentUserName, userRole, sessionToken } = useAuth();
  const { voiceEnabled, toggleVoice, currentVolume, setCurrentVolume, conversationHistory, setConversationHistory, showNotification } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('Thinking... 🤔');
  const [messages, setMessages] = useState<{ role: string; content: string; imageData?: string; mimeType?: string; videoData?: string; videoMimeType?: string }[]>(
    initialMessages || (socialStoriesMode
      ? [{ role: 'assistant', content: `Hi ${currentUserName}! 😊 I'd love to help you explore social stories! Ask me about any social situation like going to a party, visiting the dentist, or meeting new friends and I'll share a helpful story with pictures or text! 🌟📚` }]
      : [{ role: 'assistant', content: `✨ **Hi ${currentUserName}!** 🌟\n\nI'm so excited to chat with you today! 🌈💬\n\nWe can talk, imagine fun stories, learn cool things, giggle together 😄🎨📚,\n\nand **I can even generate cute pictures and videos for you!** 🖼️🎬✨\n\n_Examples:_\n\n- "Draw a happy puppy" → I'll create an image 🎨\n\n- "Create a video of butterflies flying" → I'll make a video 🎬\n\n- "What is the sun?" → I'll explain it 💬` }]
    )
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: `Chat cleared! How can I help you? 😊` }]);
    setConversationHistory([]);
    showNotification('🗑️ Chat cleared!');
  };

  const showHelp = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `## 🤖 How to use the Learning Assistant\n\n**Chat Features:**\n- Click **Tom** 🐱 or **Jerry** 🐭 to greet them\n- Type messages to chat about *anything*\n- Use control buttons for features\n\n**What I can help with:**\n1. **Answering questions** - Ask me anything!\n2. **Explaining concepts** - I'll break it down\n3. **Creative writing** - Stories, poems, ideas\n4. **Problem solving** - Let's work together\n5. **Fun conversations** - Just chat and have fun!\n6. **Social Stories** - Visual stories to learn situations\n7. **Calm Breathing** - Relax with nature sounds\n8. **Feelings Helper** - Share and talk about your emotions\n9. **Memory Game** - Fun matching game with levels!\n\n**Tips:**\n- I understand *markdown* formatting\n- Ask follow-up questions\n- Be specific for better help\n- **Celebrate your progress!** 🎉\n\n*What would you like to explore together?* 🌟`
    }]);
  };

  const celebrateProgress = () => {
    showNotification('🎉 Amazing work! Tom and Jerry are so proud! 🌟');
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `## 🎉 **AMAZING WORK!** 🎉\n\n**Tom and Jerry are SO proud of you!** 🐱🐭\n\n*You're doing fantastic by:*\n- Asking great questions\n- Being curious and engaged\n- Making excellent progress\n\n### ⭐ Keep up the wonderful work! ⭐\n\n*What would you like to learn about next?* 🌈`
    }]);
  };

  const saveChatToDb = async (userMsg: string, assistantMsg: string) => {
    if (!currentUser?.id) return;
    try {
      let mode = 'general';
      if (socialStoriesMode) mode = 'social_stories';
      await externalSupabase.from('chat_history').insert([
        { user_id: currentUser.id, role: 'user', message_text: userMsg, mode },
        { user_id: currentUser.id, role: 'assistant', message_text: assistantMsg, mode },
      ]);
    } catch (e) { console.error('Chat save error:', e); }
  };

  const saveImageToDb = async (prompt: string, imageData: string | null, mimeType: string | null) => {
    if (!currentUser?.id) return;
    try {
      await externalSupabase.from('generated_images').insert({
        user_id: currentUser.id, prompt, mode: socialStoriesMode ? 'social_stories' : 'general',
        image_data: imageData, mime_type: mimeType,
      });
    } catch (e) { console.error('Image save error:', e); }
  };

  const saveVideoToDb = async (prompt: string, videoData: string | null, mimeType: string | null) => {
    if (!currentUser?.id) return;
    try {
      await externalSupabase.from('generated_videos').insert({
        user_id: currentUser.id, prompt, video_data: videoData, mime_type: mimeType,
      });
    } catch (e) { console.error('Video save error:', e); }
  };

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('📥 Downloaded!');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    const msg = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTyping(true);

    const isImageReq = checkIfImageRequest(msg);
    const isVideoReq = checkIfVideoRequest(msg);
    if (isVideoReq) setTypingText('Creating video... (may take a few minutes) 🎬');
    else if (isImageReq) setTypingText('Sketching... 🎨');
    else setTypingText('Thinking... 🤔');

    try {
      const result = await apiChat(msg, conversationHistory, userRole, sessionToken, currentUser?.id || null, currentUser?.email || null, socialStoriesMode);
      const reply = result.response || result.error || "I'm here to help! 😊";

      const newMsg: any = { role: 'assistant', content: reply };

      if (result.videoGenerated && result.videoData) {
        newMsg.videoData = result.videoData;
        newMsg.videoMimeType = result.mimeType;
        saveVideoToDb(msg, result.videoData, result.mimeType);
      }
      if (result.imageGenerated && result.imageData) {
        newMsg.imageData = result.imageData;
        newMsg.mimeType = result.mimeType;
        saveImageToDb(msg, result.imageData, result.mimeType);
      }

      setMessages(prev => [...prev, newMsg]);
      setConversationHistory(prev => {
        const updated = [...prev, { role: 'user', content: msg }, { role: 'assistant', content: reply }];
        return updated.length > 20 ? updated.slice(-20) : updated;
      });

      // Save chat to DB
      saveChatToDb(msg, reply);

      if (voiceEnabled) {
        const cleanText = reply.replace(/[*#_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.78;
        utterance.pitch = 0.85;
        utterance.volume = Math.min(currentVolume, 0.9);
        speechSynthesis.speak(utterance);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops! Something went wrong. Please try again! 😊" }]);
    }
    setIsTyping(false);
  };

  return (
    <>
      <div className="controls">
        <button className="control-btn" onClick={clearChat}>🗑️ Clear</button>
        <button className="control-btn" onClick={showHelp}>❓ Help</button>
        <button className="control-btn" onClick={celebrateProgress}>🎉 Celebrate</button>
        <button className="control-btn" onClick={toggleVoice}>{voiceEnabled ? '🔊 Voice' : '🔇 Voice'}</button>
        <div className="setting-item">
          <span>🔊</span>
          <input type="range" min="0" max="1" step="0.1" value={currentVolume} onChange={e => setCurrentVolume(parseFloat(e.target.value))} className="volume-slider" />
        </div>
      </div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-avatar">{msg.role === 'user' ? '👤' : '🐱'}</div>
            <div className="message-content">
              <div dangerouslySetInnerHTML={{ __html: processMarkdown(msg.content) }} />
              {msg.videoData && msg.videoMimeType && (
                <div style={{ margin: '10px 0' }}>
                  <video controls style={{ maxWidth: '100%', borderRadius: '10px', border: '2px solid rgba(255,255,255,0.3)' }}>
                    <source src={`data:${msg.videoMimeType};base64,${msg.videoData}`} type={msg.videoMimeType} />
                  </video>
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={() => downloadFile(`data:${msg.videoMimeType};base64,${msg.videoData}`, `video-${Date.now()}.mp4`)} style={{ background: 'linear-gradient(135deg, #4fc3f7, #29b6f6)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: '0.9em' }}>📥 Download Video</button>
                  </div>
                </div>
              )}
              {msg.imageData && msg.mimeType && (
                <div style={{ margin: '10px 0' }}>
                  <img src={`data:${msg.mimeType};base64,${msg.imageData}`} alt="Generated" style={{ maxWidth: '100%', borderRadius: '10px', border: '2px solid rgba(255,255,255,0.3)' }} />
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={() => downloadFile(`data:${msg.mimeType};base64,${msg.imageData}`, `image-${Date.now()}.png`)} style={{ background: 'linear-gradient(135deg, #4fc3f7, #29b6f6)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: '0.9em' }}>📥 Download Image</button>
                  </div>
                </div>
              )}
              {msg.role === 'assistant' && (
                <div className="emoji-reactions">
                  <button className="emoji-btn" onClick={() => showNotification('You reacted with 😊!')}>😊</button>
                  <button className="emoji-btn" onClick={() => showNotification('You reacted with 👍!')}>👍</button>
                  <button className="emoji-btn" onClick={() => showNotification('You reacted with ❤️!')}>❤️</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message assistant typing-indicator">
            <div className="message-avatar">{typingText.includes('video') ? '🎬' : typingText.includes('Sketch') ? '🎨' : '🐱'}</div>
            <div className="message-content">{typingText}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <VoiceRecorder onTranscript={(text) => setInputMessage(prev => prev ? prev + ' ' + text : text)} disabled={isTyping} />
        <input
          className="input-field"
          placeholder="Type your message here... 🌟"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={isTyping}
        />
        <button className="send-button" onClick={sendMessage} disabled={isTyping || !inputMessage.trim()}>➤</button>
      </div>
    </>
  );
};

export default ChatArea;