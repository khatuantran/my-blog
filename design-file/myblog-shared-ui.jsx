// myblog-shared-ui.jsx — Shared TopBar, StatusBar, CommandPalette for all pages
const { useState, useEffect, useRef } = React;

const SHARED_CSS = `
  .srch-inp { width:100%; background:#0A0E1A; border:1px solid #2A3548; color:#A0AEC0; font-family:'JetBrains Mono',monospace; font-size:14px; padding:8px 70px 8px 36px; border-radius:6px; outline:none; transition:all .15s; }
  .srch-inp:focus { border-color:#00FFE5; box-shadow:0 0 14px rgba(0,255,229,.22); color:#E6EDF3; }
  .srch-inp::placeholder { color:#8B96AA; font-style:italic; }
  .cp-item { display:flex; align-items:center; gap:10px; padding:8px 16px; cursor:pointer; transition:background .1s; }
  .cp-item:hover,.cp-item.sel { background:rgba(0,255,229,.08); }
  .pulse { animation:sharedPulse 2s ease-in-out infinite; }
  @keyframes sharedPulse { 0%,100%{opacity:.7} 50%{opacity:1;filter:drop-shadow(0 0 3px currentColor)} }
  @keyframes fadeUpShared { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .fade-up { animation:fadeUpShared .15s ease; }
`;

// Inject shared CSS once
if (!document.getElementById('shared-ui-css')) {
  const style = document.createElement('style');
  style.id = 'shared-ui-css';
  style.textContent = SHARED_CSS;
  document.head.appendChild(style);
}

// ─── COMMAND PALETTE ──────────────────────────────────────────
function CommandPalette({ onClose }) {
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const nav = [
    { g:'navigate', icon:'🔍', label:'Search',        href:'MyBlog Search.html',      keys:['/']     },
    { g:'navigate', icon:'🏠', label:'Feed',          href:'MyBlog Feed.html',        keys:['⌘','1'] },
    { g:'navigate', icon:'✏️', label:'Create Post',   href:'MyBlog Create Post.html', keys:['⌘','N'] },
    { g:'navigate', icon:'⚙️', label:'Admin',         href:'MyBlog Admin.html',       keys:['⌘','3'] },
    { g:'navigate', icon:'🏷', label:'Tags',          href:'MyBlog Tags.html',        keys:['⌘','4'] },
    { g:'navigate', icon:'🔑', label:'Login',         href:'MyBlog Login.html',       keys:[] },
    { g:'actions',  icon:'🚪', label:'Logout',        href:'MyBlog Login.html',       keys:['⌘','Q'] },
  ];
  const filtered = q ? nav.filter(c => c.label.toLowerCase().includes(q.toLowerCase())) : nav;
  const groups = [...new Set(filtered.map(c => c.g))];
  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    const h = e => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.72)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'100px' }} className="fade-up"
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:'540px', maxWidth:'90vw', background:'#1A1F2E', border:'1px solid rgba(0,255,229,.35)', borderRadius:'10px', overflow:'hidden', boxShadow:'0 0 40px rgba(0,255,229,.15),0 24px 64px rgba(0,0,0,.6)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 16px', borderBottom:'1px solid #2A3548' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'15px', color:'#00FFE5' }}>~$</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="type a command or navigate..."
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:"'JetBrains Mono',monospace", fontSize:'15px', color:'#E6EDF3' }} />
          <button onClick={onClose} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8B96AA', background:'#232936', border:'1px solid #2A3548', borderRadius:'3px', padding:'2px 7px', cursor:'pointer' }}>Esc</button>
        </div>
        <div style={{ maxHeight:'320px', overflowY:'auto' }}>
          {groups.map(g => (
            <div key={g}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8B96AA', padding:'10px 16px 4px' }}>// {g}</div>
              {filtered.filter(c=>c.g===g).map((cmd,i) => (
                <a key={i} href={cmd.href} style={{ textDecoration:'none' }} className="cp-item">
                  <span style={{ fontSize:'17px' }}>{cmd.icon}</span>
                  <span style={{ flex:1, fontSize:'14px', color:'#E6EDF3' }}>{cmd.label}</span>
                  {cmd.keys.length > 0 && cmd.keys.map((k,ki) => (
                    <span key={ki} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#A0AEC0', background:'#232936', border:'1px solid #2A3548', borderRadius:'3px', padding:'1px 5px' }}>{k}</span>
                  ))}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding:'8px 16px', borderTop:'1px solid #1F2A3A', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8B96AA', display:'flex', gap:'12px' }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>Esc close</span>
          <span style={{ marginLeft:'auto' }}>// kha.blog nav</span>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────
const NOTIF_DATA = [
  { id:1,  type:'like',    user:'@user1',    isAnon:false, post:'abc123', snippet:'Hôm nay deploy xong feature mới...',     time:'2m ago',  read:false, group:'today' },
  { id:2,  type:'comment', user:'Anon#7',    isAnon:true,  post:'abc123', snippet:'Cảm ơn bạn đã chia sẻ!',                  time:'5m ago',  read:false, group:'today' },
  { id:3,  type:'like',    user:'@user2',    isAnon:false, post:'xyz789', snippet:'Đọc xong "A Philosophy of..."',           time:'12m ago', read:false, group:'today' },
  { id:4,  type:'share',   user:'@user3',    isAnon:false, post:'def456', snippet:'Vừa thử Cursor AI với codebase...',       time:'1h ago',  read:false, group:'today' },
  { id:5,  type:'comment', user:'@user1',    isAnon:false, post:'def456', snippet:'Vừa thử Cursor AI với codebase...',       time:'2h ago',  read:true,  group:'today' },
  { id:6,  type:'save',    user:'@user5',    isAnon:false, post:'ghi012', snippet:'Chiều nay ngồi cafe, không code...',      time:'5h ago',  read:true,  group:'today' },
  { id:7,  type:'like',    user:'Anon#11',   isAnon:true,  post:'abc123', snippet:'Hôm nay deploy xong feature mới...',     time:'1d ago',  read:true,  group:'yesterday' },
  { id:8,  type:'comment', user:'@user4',    isAnon:false, post:'xyz789', snippet:'Đọc xong "A Philosophy of..."',           time:'1d ago',  read:true,  group:'yesterday' },
  { id:9,  type:'share',   user:'@user6',    isAnon:false, post:'ghi012', snippet:'Chiều nay ngồi cafe, không code...',      time:'2d ago',  read:true,  group:'older' },
  { id:10, type:'like',    user:'@user8',    isAnon:false, post:'def456', snippet:'Vừa thử Cursor AI với codebase...',       time:'3d ago',  read:true,  group:'older' },
];

const NOTIF_CFG = {
  like:    { icon:'❤', color:'#FF6E96', verb:'liked'        },
  comment: { icon:'💬', color:'#7DCFFF', verb:'commented on' },
  share:   { icon:'↗', color:'#BB9AF7', verb:'shared'        },
  save:    { icon:'🔖', color:'#E0AF68', verb:'saved'         },
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIF_DATA);
  const [filter, setFilter] = useState('all');
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;
  const visible = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;
  const groups = ['today', 'yesterday', 'older'];

  const markAllRead = () => setNotifs(notifs.map(n => ({ ...n, read:true })));
  const markRead    = id => setNotifs(notifs.map(n => n.id === id ? { ...n, read:true } : n));

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width:'32px', height:'32px', borderRadius:'6px', border:'1px solid #2A3548',
          background:open?'rgba(0,255,229,.08)':'#1A1F2E',
          color:open?'#00FFE5':'#A0AEC0', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .15s', position:'relative',
          boxShadow:open?'0 0 12px rgba(0,255,229,.2)':'none' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="pulse" style={{ position:'absolute', top:'-3px', right:'-3px',
            minWidth:'16px', height:'16px', padding:'0 4px', borderRadius:'8px',
            background:'#FF6E96', color:'#0A0E1A', fontFamily:"'JetBrains Mono',monospace",
            fontSize:'10px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
            border:'1.5px solid #11151F', boxShadow:'0 0 6px #FF6E9680' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:'absolute', top:'42px', right:0, width:'380px', maxWidth:'95vw',
          background:'#11151F', border:'1px solid rgba(0,255,229,.25)', borderRadius:'10px',
          overflow:'hidden', zIndex:200, animation:'fadeUpShared .15s ease',
          boxShadow:'0 0 30px rgba(0,255,229,.08),0 16px 50px rgba(0,0,0,.6)' }}>

          {/* Header */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #1F2A3A', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0A0E1A' }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#00FFE5' }}>// notifications</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#566176', marginTop:'2px' }}>{unreadCount} unread · {notifs.length} total</div>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#00FFE5', background:'rgba(0,255,229,.08)', border:'1px solid rgba(0,255,229,.3)', borderRadius:'4px', padding:'4px 10px', cursor:'pointer' }}>
                ✓ mark all read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display:'flex', gap:'4px', padding:'8px 12px', borderBottom:'1px solid #1F2A3A' }}>
            {[['all','All',notifs.length],['unread','Unread',unreadCount]].map(([k,l,c]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ flex:1, fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', padding:'5px 10px',
                  borderRadius:'4px', cursor:'pointer',
                  color: filter===k?'#00FFE5':'#8B96AA',
                  background: filter===k?'rgba(0,255,229,.08)':'transparent',
                  border:`1px solid ${filter===k?'rgba(0,255,229,.4)':'transparent'}` }}>
                {l} <span style={{ color:'#566176', marginLeft:'3px' }}>({c})</span>
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ maxHeight:'400px', overflowY:'auto' }}>
            {visible.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <div style={{ fontSize:'28px', color:'#2A3548', marginBottom:'10px' }}>◎</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8B96AA' }}>
                  // {filter==='unread'?'all caught up!':'no notifications yet'}
                </div>
              </div>
            ) : (
              groups.map(g => {
                const items = visible.filter(n => n.group === g);
                if (!items.length) return null;
                const labels = { today:'today', yesterday:'yesterday', older:'older' };
                return (
                  <div key={g}>
                    <div style={{ padding:'8px 16px 4px', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#566176' }}>// {labels[g]}</div>
                    {items.map(n => {
                      const cfg = NOTIF_CFG[n.type];
                      return (
                        <a key={n.id} href={`MyBlog Post Detail.html`}
                          onClick={() => markRead(n.id)}
                          style={{ display:'flex', gap:'10px', padding:'10px 16px',
                            borderLeft:`2px solid ${n.read?'transparent':cfg.color}`,
                            background: n.read?'transparent':`${cfg.color}06`,
                            textDecoration:'none', cursor:'pointer', transition:'background .1s' }}
                          onMouseEnter={e=>e.currentTarget.style.background=n.read?'#1A1F2E':`${cfg.color}10`}
                          onMouseLeave={e=>e.currentTarget.style.background=n.read?'transparent':`${cfg.color}06`}>
                          {/* Avatar */}
                          <div style={{ position:'relative', width:'34px', height:'34px', flexShrink:0 }}>
                            <div style={{ width:'34px', height:'34px', borderRadius:'50%', border:'1.5px solid #2A3548',
                              background: n.isAnon?'#1A1F2E':'linear-gradient(135deg,#00FFE520,#BB9AF720)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontFamily:"'JetBrains Mono',monospace", fontSize:'12px',
                              color: n.isAnon?'#8B96AA':'#00FFE5' }}>
                              {n.isAnon ? '?' : n.user[1].toUpperCase()}
                            </div>
                            {/* Action badge */}
                            <div style={{ position:'absolute', bottom:'-2px', right:'-2px', width:'18px', height:'18px',
                              borderRadius:'50%', background:cfg.color, border:'2px solid #11151F',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'9px', boxShadow:`0 0 4px ${cfg.color}80` }}>
                              {cfg.icon}
                            </div>
                          </div>
                          {/* Content */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'12px', color:'#C9D1D9', lineHeight:'1.4', marginBottom:'2px' }}>
                              <span style={{ color: n.isAnon?'#8B96AA':'#7DCFFF', fontFamily:"'JetBrains Mono',monospace" }}>{n.user}</span>
                              {' '}<span style={{ color:'#A0AEC0' }}>{cfg.verb}</span>{' '}
                              <span style={{ color:'#8B96AA' }}>your post</span>
                            </div>
                            <div style={{ fontSize:'11px', color:'#8B96AA', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'2px' }}>
                              "{n.snippet}"
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#566176' }}>
                              <span>#{n.post}</span>
                              <span>·</span>
                              <span>{n.time}</span>
                              {!n.read && <span style={{ color:cfg.color, marginLeft:'auto' }}>● new</span>}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid #1F2A3A', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0A0E1A' }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#566176' }}>// click to mark as read</span>
            <a href="MyBlog Notifications.html" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#00FFE5', textDecoration:'none' }}>view all →</a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────
function TopBar({ onOpenCP, hideSearch = false }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const items = [
    { icon:'📝', label:'Manage Posts',    href:'MyBlog Manage Posts.html', color:'#7DCFFF', sep:false },
    { icon:'⚙️', label:'Admin Dashboard', href:'MyBlog Admin.html',       color:'#BB9AF7', sep:false },
    { icon:'🏷', label:'Manage Tags',     href:'MyBlog Tags.html',        color:'#E0AF68', sep:false },
    { icon:'🔧', label:'System Settings', href:'#',                       color:'#9ECE6A', sep:false },
    { icon:'👤', label:'Profile',          href:'MyBlog Profile.html',     color:'#A0AEC0', sep:true  },
    { icon:'🚪', label:'Logout',           href:'MyBlog Login.html',       color:'#F7768E', sep:false },
  ];
  return (
    <header style={{ position:'fixed', top:0, left:0, right:0, height:'52px', background:'rgba(17,21,31,.96)', borderBottom:'1px solid #1F2A3A', display:'flex', alignItems:'center', padding:'0 20px', zIndex:100, backdropFilter:'blur(8px)' }}>
      <a href="MyBlog Feed.html" style={{ display:'flex', alignItems:'center', gap:'8px', userSelect:'none', flexShrink:0, textDecoration:'none' }}>
        <svg width="24" height="24" viewBox="0 0 24 24"><polyline points="8,3 3,12 8,21" stroke="#00FFE5" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16,3 21,12 16,21" stroke="#BB9AF7" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'17px', letterSpacing:'-0.04em', lineHeight:1 }}>
          <span style={{ color:'#E6EDF3' }}>kha</span><span style={{ color:'#00FFE5' }}>.</span><span style={{ color:'#A0AEC0', fontWeight:500 }}>blog</span>
        </div>
      </a>
      {!hideSearch && (
      <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', width:'440px', zIndex:1 }}>
        <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#8B96AA', fontSize:'14px', pointerEvents:'none' }}>⌕</span>
        <input className="srch-inp" placeholder="~$ search posts, tags, users..." onClick={() => window.location.href='MyBlog Search.html'} readOnly style={{ cursor:'pointer' }} />
        <button onClick={onOpenCP} style={{ position:'absolute', right:'6px', top:'50%', transform:'translateY(-50%)', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8B96AA', background:'#1A1F2E', border:'1px solid #2A3548', borderRadius:'3px', padding:'2px 7px', cursor:'pointer', whiteSpace:'nowrap' }}>⌘K</button>
      </div>
      )}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginLeft:'auto', flexShrink:0 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8B96AA', border:'1px solid #2A3548', borderRadius:'3px', padding:'2px 7px' }}>[ v0.1.0 ]</span>
        <span style={{ display:'flex', alignItems:'center', gap:'4px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#9ECE6A' }}>
          <span className="pulse" style={{ fontSize:'8px' }}>●</span> 3
        </span>
        <NotificationBell />
        <div ref={menuRef} style={{ position:'relative' }}>
          <div onClick={() => setShowMenu(!showMenu)} style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2px solid #00FFE5', background:'linear-gradient(135deg,#00FFE520,#BB9AF720)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'14px', color:'#00FFE5', cursor:'pointer', boxShadow:showMenu?'0 0 18px rgba(0,255,229,.4)':'0 0 12px rgba(0,255,229,.25)', transition:'box-shadow .15s', position:'relative' }}>
            A
            <span style={{ position:'absolute', bottom:'-1px', right:'-1px', width:'8px', height:'8px', background:'#9ECE6A', borderRadius:'50%', border:'1.5px solid #11151F', boxShadow:'0 0 5px #9ECE6A' }} />
          </div>
          {showMenu && (
            <div style={{ position:'absolute', top:'42px', right:0, background:'#1A1F2E', border:'1px solid rgba(0,255,229,.25)', borderRadius:'8px', minWidth:'210px', padding:'6px', zIndex:200, boxShadow:'0 0 30px rgba(0,255,229,.1),0 12px 40px rgba(0,0,0,.6)' }} className="fade-up">
              <div style={{ padding:'8px 10px 10px', borderBottom:'1px solid #2A3548', marginBottom:'4px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', border:'1.5px solid #00FFE5', background:'linear-gradient(135deg,#00FFE520,#BB9AF720)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#00FFE5', fontWeight:700 }}>A</div>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#7DCFFF' }}>~/admin</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#FF9E64', marginTop:'1px' }}>[ ADMIN ]</div>
                  </div>
                </div>
              </div>
              {items.map((item,i) => (
                <React.Fragment key={i}>
                  {item.sep && <div style={{ height:'1px', background:'#2A3548', margin:'4px 0' }} />}
                  <a href={item.href} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'5px', transition:'background .1s' }} className="cp-item">
                    <span style={{ fontSize:'15px' }}>{item.icon}</span>
                    <span style={{ flex:1, fontSize:'14px', color:item.color==='#A0AEC0'?'#E6EDF3':item.color }}>{item.label}</span>
                  </a>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── STATUS BAR ───────────────────────────────────────────────
function StatusBar({ path = '~/feed', info = '' }) {
  const s = { padding:'0 14px', color:'#8B96AA', borderRight:'1px solid #1F2A3A', height:'100%', display:'flex', alignItems:'center', whiteSpace:'nowrap' };
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, height:'28px', background:'#070A14', borderTop:'1px solid #1F2A3A', display:'flex', alignItems:'center', zIndex:100, fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', overflow:'hidden' }}>
      <span style={{ ...s, color:'#00FFE5', background:'rgba(0,255,229,.07)' }}>{path}</span>
      {info && <span style={s}>{info}</span>}
      <span style={{ ...s, color:'#566176' }}>──────</span>
      <span style={s}>build: a1b2c3</span>
      <div style={{ marginLeft:'auto', display:'flex', height:'100%' }}>
        <span style={{ ...s, color:'#9ECE6A', borderLeft:'1px solid #1F2A3A', borderRight:'none' }}>
          <span className="pulse" style={{ fontSize:'8px', marginRight:'5px' }}>●</span>3 online
        </span>
        <span style={{ padding:'0 14px', color:'#8B96AA', borderLeft:'1px solid #1F2A3A', height:'100%', display:'flex', alignItems:'center' }}>[ v0.1.0 ]</span>
      </div>
    </div>
  );
}

Object.assign(window, { CommandPalette, TopBar, StatusBar });
