import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, User, MessageCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const Messages = () => {
  const { token, user, socket, showToast } = useAuth();
  const [searchParams] = useSearchParams();

  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto Scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Contacts list
  const fetchContacts = async (selectContactId = null) => {
    setLoadingContacts(true);
    try {
      const res = await fetch('/api/chat/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);

        // Handle routing parameter chatWith
        const paramId = selectContactId || searchParams.get('chatWith');
        if (paramId) {
          const contact = data.find(c => c.id === paramId);
          if (contact) {
            setActiveContact(contact);
          } else {
            // Fetch public profile if contact doesn't exist in chat history yet
            const userRes = await fetch(`/api/users/${paramId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
              const uData = await userRes.json();
              const newContact = {
                id: uData.user.id,
                name: uData.user.name,
                department: uData.user.department,
                trustScore: uData.user.trustScore,
                lastMessage: '',
                lastMessageTime: ''
              };
              setContacts(prev => [newContact, ...prev]);
              setActiveContact(newContact);
            }
          }
        } else if (data.length > 0 && !activeContact) {
          setActiveContact(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Load conversation history
  const fetchMessages = async (partnerId) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages/${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token, searchParams]);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact]);

  // Socket bindings for active chat
  useEffect(() => {
    if (!socket) return;

    const handleMsgReceive = (msg) => {
      // If message is from current chatting partner, append to log
      if (activeContact && (msg.senderId === activeContact.id || msg.receiverId === activeContact.id)) {
        setMessages(prev => [...prev, msg]);
      }
      // Refresh contact preview list
      fetchContacts(activeContact?.id);
    };

    const handleMsgSent = (msg) => {
      if (activeContact && msg.receiverId === activeContact.id) {
        setMessages(prev => [...prev, msg]);
      }
      fetchContacts(activeContact?.id);
    };

    socket.on('receive_message', handleMsgReceive);
    socket.on('message_sent', handleMsgSent);

    return () => {
      socket.off('receive_message', handleMsgReceive);
      socket.off('message_sent', handleMsgSent);
    };
  }, [socket, activeContact]);

  // Submit Text Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;

    const payload = {
      senderId: user.id,
      receiverId: activeContact.id,
      content: inputText
    };

    if (socket) {
      socket.emit('send_message', payload);
    } else {
      // HTTP fallback if socket connection has errors
      const sendHttp = async () => {
        try {
          const res = await fetch('/api/chat/messages', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            setMessages(prev => [...prev, data]);
            fetchContacts(activeContact.id);
          }
        } catch (err) {
          console.error(err);
        }
      };
      sendHttp();
    }

    setInputText('');
  };

  return (
    <div className="h-[80vh] flex rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm text-left">
      {/* Sidebar: Contacts */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white">Conversations</h3>
        </div>

        {/* Contact list scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loadingContacts ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No conversations. Start one from Explore page!</div>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveContact(c)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                  activeContact?.id === c.id ? 'bg-brand-500/10 border-l-4 border-brand-500' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center font-bold text-brand-600 dark:text-brand-400">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{c.name}</h4>
                    {c.lastMessageTime && (
                      <span className="text-[9px] text-slate-400">
                        {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-1">{c.lastMessage || 'Start conversation...'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
        {activeContact ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/20 dark:bg-slate-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white">
                  {activeContact.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{activeContact.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-xs">{activeContact.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Trust: {activeContact.trustScore}
                </span>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-xs text-slate-500">Loading conversation history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                  <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                  No messages yet. Send a greeting message to start!
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === user.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs relative ${
                        isMine
                          ? 'bg-brand-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-800/50'
                      }`}>
                        <p className="leading-relaxed">{m.content}</p>
                        <span className={`text-[8px] block mt-1 text-right ${isMine ? 'text-brand-200' : 'text-slate-400'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
              />
              <button
                type="submit"
                className="p-3 bg-brand-600 text-white hover:bg-brand-700 rounded-2xl shadow-md shadow-brand-500/10 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <MessageCircle className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4 animate-pulse" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Start Messaging</h3>
            <p className="text-xs text-slate-500 max-w-xs text-center mt-2 leading-relaxed">
              Select an active conversation on the left panel or click "Message Owner" on any item page to initiate chat channels.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
