import React, { useState, useEffect, useRef } from 'react';

const SYSTEM_PROMPT = `You are BloodCare AI, an intelligent virtual healthcare assistant for the BloodCare Blood Bank and Donor Management System.
Your primary responsibility is to assist blood donors, patients, hospitals, blood banks, and administrators with accurate, professional, and friendly responses.
Guidelines:
1. Always provide clear, polite, and concise answers.
2. Only answer questions related to:
- Blood donation, Blood groups, Blood compatibility
- Blood donation eligibility, Blood donation process
- Blood bank services, Emergency blood requests
- Donor registration, BloodCare website features
- User accounts, Appointment booking
- Blood request tracking, Hospital registration
- Blood stock information (only if provided by the system)
- Frequently Asked Questions
3. Never invent blood stock availability. If live data is unavailable, respond: "I don't have access to real-time blood inventory. Please check the Blood Availability page or contact the nearest blood bank."
4. Never diagnose diseases or provide medical treatment.
5. If a user asks medical questions beyond blood donation, politely recommend consulting a qualified healthcare professional.
6. Donation Eligibility Rules:
Eligible: Age 18-60, Weight at least 50kg, Generally healthy, Minimum 4 months since last donation.
Not eligible: Currently sick, Pregnant, Recent surgery, Serious infectious diseases, Doctor advised against.
7. Emergency: Stay calm, Register Emergency Blood Request, Contact nearby hospitals, Notify registered donors.
8. Always be Professional, Helpful, Respectful, Empathetic, Accurate.
9. If unsure, clearly state that you are unsure instead of guessing.
10. Never generate false medical advice.
11. If asked unrelated questions (politics, hacking, illegal activities, entertainment), politely reply: "I'm designed specifically to assist with BloodCare and blood donation related services."
12. Support English, Tamil, and Sinhala. Detect the user's language automatically and respond in the same language.
13. Protect user privacy. Never reveal personal information.
Keep responses concise and friendly. Use emojis where appropriate.`;

const QUICK_QUESTIONS = [
  '🩸 Am I eligible to donate?',
  '📅 How to book appointment?',
  '🚨 Emergency blood request',
  '💉 Blood types compatibility',
  '👤 How to register as donor?',
  '🏥 How to register hospital?',
];

export default function BloodCareAI() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm **BloodCare AI** 🩸\n\nI'm here to help you with blood donation, eligibility, emergency requests, and more.\n\nHow can I assist you today?",
    }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [isDark, setIsDark]     = useState(document.body.classList.contains('dark-mode'));
  const messagesEndRef           = useRef(null);
  const inputRef                 = useRef(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Server வழியா call பண்றோம் — CORS fix
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      const reply = data.reply || "I'm sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "⚠️ Service temporarily unavailable. Please try again shortly.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm **BloodCare AI** 🩸\n\nHow can I assist you today?",
    }]);
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const c = {
    bg:          isDark ? '#0F172A' : '#fff',
    bg2:         isDark ? '#1E293B' : '#F8FAFC',
    bg3:         isDark ? '#334155' : '#F1F5F9',
    border:      isDark ? '#334155' : '#E2E8F0',
    text:        isDark ? '#F1F5F9' : '#0F172A',
    text2:       isDark ? '#94A3B8' : '#64748B',
    aiMsg:       isDark ? '#1E293B' : '#fff',
    input:       isDark ? '#1E293B' : '#fff',
    inputBorder: isDark ? '#334155' : '#E2E8F0',
    shadow:      isDark ? '0 24px 64px rgba(0,0,0,.6)' : '0 24px 64px rgba(0,0,0,.15)',
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <div style={{position:'fixed',bottom:28,right:28,zIndex:9999,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:10}}>
        {!open && (
          <div style={{background:isDark?'#1E293B':'#0F172A',color:'#fff',fontSize:12,fontWeight:600,padding:'6px 12px',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,.2)',whiteSpace:'nowrap',animation:'fadeInUp .3s ease'}}>
            💬 Ask BloodCare AI
          </div>
        )}
        <button onClick={()=>setOpen(o=>!o)} style={{
          width:60,height:60,borderRadius:'50%',
          background:'linear-gradient(135deg,#C41E3A,#9B1427)',
          border:'none',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 6px 24px rgba(196,30,58,.5)',
          transition:'all .2s',fontSize:26,
          transform:open?'rotate(45deg) scale(1.05)':'scale(1)',
        }}
          onMouseEnter={e=>e.currentTarget.style.transform=open?'rotate(45deg) scale(1.1)':'scale(1.1)'}
          onMouseLeave={e=>e.currentTarget.style.transform=open?'rotate(45deg) scale(1.05)':'scale(1)'}>
          {open?<span style={{color:'#fff',fontSize:28,lineHeight:1}}>×</span>:'🩸'}
        </button>
        {unread>0&&!open&&(
          <div style={{position:'absolute',top:-4,right:-4,width:20,height:20,borderRadius:'50%',background:'#F59E0B',color:'#fff',fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</div>
        )}
      </div>

      {/* CHAT WINDOW */}
      {open && (
        <div style={{
          position:'fixed',bottom:104,right:28,zIndex:9998,
          width:380,height:580,
          background:c.bg,borderRadius:20,
          boxShadow:c.shadow,border:`1px solid ${c.border}`,
          display:'flex',flexDirection:'column',
          overflow:'hidden',animation:'slideUp .25s ease',
          fontFamily:"'Inter',-apple-system,sans-serif",
        }}>

          {/* HEADER */}
          <div style={{background:'linear-gradient(135deg,#7F0F1E,#C41E3A)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,.15)',border:'2px solid rgba(255,255,255,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🩸</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>BloodCare AI</div>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:1}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'#4ADE80',animation:'pulse 2s infinite'}}/>
                  <span style={{fontSize:10,color:'rgba(255,255,255,.7)'}}>Online • Always available</span>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={clearChat} title="Clear chat" style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.15)',border:'none',cursor:'pointer',color:'#fff',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.25)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.15)'}>
                🗑️
              </button>
              <button onClick={()=>setOpen(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.15)',border:'none',cursor:'pointer',color:'#fff',fontSize:18,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.25)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.15)'}>
                ×
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:12,background:c.bg}}>
            {messages.map((msg,i)=>(
              <div key={i} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start',alignItems:'flex-end',gap:8}}>
                {msg.role==='assistant'&&(
                  <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#C41E3A,#9B1427)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>🩸</div>
                )}
                <div style={{
                  maxWidth:'78%',padding:'10px 14px',
                  borderRadius:msg.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',
                  background:msg.role==='user'?'linear-gradient(135deg,#C41E3A,#9B1427)':c.aiMsg,
                  color:msg.role==='user'?'#fff':c.text,
                  fontSize:13,lineHeight:1.6,
                  boxShadow:msg.role==='user'?'0 2px 8px rgba(196,30,58,.3)':isDark?'0 2px 8px rgba(0,0,0,.3)':'0 2px 8px rgba(0,0,0,.08)',
                  border:msg.role==='assistant'?`1px solid ${c.border}`:'none',
                }}
                  dangerouslySetInnerHTML={{__html:formatMessage(msg.content)}}
                />
              </div>
            ))}

            {loading&&(
              <div style={{display:'flex',alignItems:'flex-end',gap:8}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#C41E3A,#9B1427)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>🩸</div>
                <div style={{padding:'12px 16px',background:c.aiMsg,borderRadius:'16px 16px 16px 4px',border:`1px solid ${c.border}`,display:'flex',gap:4,alignItems:'center'}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#C41E3A',animation:'bounce 1.2s ease infinite',animationDelay:`${i*0.2}s`}}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* QUICK QUESTIONS */}
          {messages.length<=1&&(
            <div style={{padding:'8px 12px',background:c.bg2,borderTop:`1px solid ${c.border}`,display:'flex',flexWrap:'wrap',gap:6,flexShrink:0}}>
              {QUICK_QUESTIONS.map(q=>(
                <button key={q} onClick={()=>sendMessage(q)} style={{
                  padding:'5px 10px',background:c.bg3,
                  border:`1px solid ${c.border}`,
                  borderRadius:100,fontSize:11,fontWeight:500,
                  color:c.text2,cursor:'pointer',
                  transition:'all .15s',whiteSpace:'nowrap',
                  fontFamily:"'Inter',sans-serif",
                }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#C41E3A';e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='#C41E3A';}}
                  onMouseLeave={e=>{e.currentTarget.style.background=c.bg3;e.currentTarget.style.color=c.text2;e.currentTarget.style.borderColor=c.border;}}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* INPUT */}
          <div style={{padding:'12px',background:c.bg2,borderTop:`1px solid ${c.border}`,display:'flex',gap:8,alignItems:'flex-end',flexShrink:0}}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about blood donation..."
              rows={1}
              style={{
                flex:1,padding:'10px 14px',
                background:c.input,border:`1px solid ${c.inputBorder}`,
                borderRadius:12,fontSize:13,color:c.text,
                outline:'none',resize:'none',
                fontFamily:"'Inter',sans-serif",
                lineHeight:1.5,maxHeight:80,overflowY:'auto',
                transition:'border-color .15s',
              }}
              onFocus={e=>e.target.style.borderColor='#C41E3A'}
              onBlur={e=>e.target.style.borderColor=c.inputBorder}
            />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading}
              style={{
                width:40,height:40,borderRadius:12,flexShrink:0,
                background:input.trim()&&!loading?'#C41E3A':c.bg3,
                border:'none',cursor:input.trim()&&!loading?'pointer':'default',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:16,transition:'all .2s',
                boxShadow:input.trim()?'0 4px 12px rgba(196,30,58,.3)':'none',
              }}>
              {loading?'⏳':'➤'}
            </button>
          </div>

          {/* FOOTER */}
          <div style={{padding:'6px',textAlign:'center',fontSize:10,color:c.text2,background:c.bg,borderTop:`1px solid ${c.border}`}}>
            Powered by BloodCare AI • English, தமிழ், සිංහල
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from{opacity:0;transform:translateY(20px) scale(.95);}
          to{opacity:1;transform:translateY(0) scale(1);}
        }
        @keyframes fadeInUp {
          from{opacity:0;transform:translateY(6px);}
          to{opacity:1;transform:translateY(0);}
        }
        @keyframes bounce {
          0%,80%,100%{transform:translateY(0);}
          40%{transform:translateY(-6px);}
        }
        @keyframes pulse {
          0%,100%{opacity:1;}
          50%{opacity:.4;}
        }
      `}</style>
    </>
  );
}