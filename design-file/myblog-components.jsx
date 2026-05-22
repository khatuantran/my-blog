// myblog-components.jsx — Data + shared UI components
// Exported to window for use by main HTML file

const { useState: useSt } = React;

// ─── MOCK DATA ─────────────────────────────────────────────────

const POSTS_DATA = [
  {
    id: 'abc123', time: '2h ago', ts: '[2026-05-17 12:30]', mood: 'HAPPY',
    content: 'Hôm nay deploy xong feature mới sau 3 ngày debug. Cái bug khó chịu nhất hóa ra là một dòng typo trong config file 🎉\n```js\n// Before: process.env.AUTH_SERCET\n// Fixed:  process.env.AUTH_SECRET\n```\nLesson learned: luôn double-check tên biến env.',
    images: 4, files: [
      { name:'debug-report.pdf',     type:'pdf',  size:'1.2 MB' },
      { name:'env-config-notes.txt', type:'txt',  size:'4 KB'   },
    ],
    tags: ['#code', '#dev', '#debugging'], likes: 24, comments: 5, saved: false,
  },
  {
    id: 'xyz789', time: '5h ago', ts: '[2026-05-17 09:15]', mood: 'THOUGHTFUL',
    content: 'Đọc xong "A Philosophy of Software Design". Deep modules vs shallow modules thực sự thay đổi cách mình thiết kế API.\n\nMọi abstraction tốt đều ẩn complexity, expose simplicity. Đang áp dụng lại toàn bộ service layer trong project hiện tại.',
    images: 0, files: [
      { name:'philosophy-of-sw-design-notes.docx', type:'docx', size:'2.4 MB' },
      { name:'api-redesign-plan.pdf',               type:'pdf',  size:'890 KB' },
    ],
    tags: ['#books', '#architecture', '#thoughts'], likes: 18, comments: 3, saved: true,
  },
  {
    id: 'def456', time: '1d ago', ts: '[2026-05-16 20:45]', mood: 'EXCITED',
    content: 'Vừa thử Cursor AI với codebase 50k lines — productivity tăng ~30% chỉ sau 1 ngày. Context window lớn + @codebase search thực sự giúp navigate cực nhanh.\n\nRecommend mạnh cho các team lớn!',
    images: 2, files: [],
    tags: ['#ai', '#tools', '#productivity'], likes: 42, comments: 11, saved: false,
  },
  {
    id: 'ghi012', time: '2d ago', ts: '[2026-05-16 15:20]', mood: 'CALM',
    content: 'Chiều nay ngồi cafe, không code, không check Slack. Chỉ đọc sách và ngắm mưa. Đôi khi brain cần được defrag như disk vậy.\n\nNgày mai fresh perspective. ☕',
    images: 1, files: [
      { name:'reading-list-2026.xlsx', type:'xlsx', size:'18 KB' },
    ],
    tags: ['#life', '#mindset', '#offline'], likes: 31, comments: 7, saved: true,
  },
];

const MOOD_CFG = {
  HAPPY:      { emoji: '😊', color: '#FFD93D', label: 'happy'     },
  EXCITED:    { emoji: '⚡', color: '#FF9E64', label: 'excited'   },
  THOUGHTFUL: { emoji: '💭', color: '#BB9AF7', label: 'thoughtful'},
  CALM:       { emoji: '😌', color: '#7DCFFF', label: 'calm'      },
  SAD:        { emoji: '😢', color: '#6BCFFF', label: 'sad'       },
  GRATEFUL:   { emoji: '🙏', color: '#9ECE6A', label: 'grateful'  },
  ANGRY:      { emoji: '😠', color: '#F7768E', label: 'angry'     },
};

const MOOD_STATS = [
  { mood: 'HAPPY', count: 12 }, { mood: 'EXCITED', count: 8 },
  { mood: 'CALM', count: 7 },   { mood: 'THOUGHTFUL', count: 6 },
  { mood: 'GRATEFUL', count: 4 },{ mood: 'SAD', count: 3 },
  { mood: 'ANGRY', count: 2 },
];

const TAGS_DATA = [
  { name: '#code',   count: 24, color: '#00FFE5' },
  { name: '#life',   count: 18, color: '#FF6E96' },
  { name: '#travel', count: 9,  color: '#BB9AF7' },
  { name: '#books',  count: 6,  color: '#9ECE6A' },
  { name: '#ai',     count: 5,  color: '#E0AF68' },
];

const ACTIVITY = [
  { type: 'like',    user: '@user1',    target: '"Deploy xong..."',   time: '2m ago'  },
  { type: 'comment', user: 'Anon#7',    target: 'post #xyz789',       time: '5m ago'  },
  { type: 'save',    user: '@user2',    target: '"Philosophy..."',     time: '12m ago' },
  { type: 'like',    user: '@user3',    target: '"Cursor AI..."',      time: '18m ago' },
  { type: 'comment', user: '@user1',    target: 'post #def456',        time: '25m ago' },
];

const SPARKLINES = {
  posts:    [5,8,12,7,15,18,14,10,16,20,18,22],
  likes:    [20,35,28,45,62,50,58,44,70,85,72,90],
  comments: [3,8,5,12,9,15,11,8,14,18,15,20],
  views:    [100,180,150,220,310,280,350,290,420,510,480,560],
};

// ─── SPARKLINE SVG ─────────────────────────────────────────────

function Sparkline({ data, color = '#00FFE5', width = 80, height = 22 }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const p = 2;
  const pts = data.map((v,i) => `${(i/(data.length-1))*width},${height-p-((v-min)/range)*(height-p*2)}`).join(' ');
  const gid = `sp${color.replace(/[^a-zA-Z0-9]/g,'')}`;
  const lx = width, ly = height-p-((data[data.length-1]-min)/range)*(height-p*2);
  return (
    <svg width={width} height={height} style={{ display:'block', overflow:'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={`url(#${gid})`} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} style={{ filter:`drop-shadow(0 0 3px ${color})` }} />
    </svg>
  );
}

// ─── UTILITY COMPONENTS ────────────────────────────────────────

function AsciiBar({ value, max, width = 10, color = '#00FFE5' }) {
  const n = Math.round((value / max) * width);
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", color, fontSize:'10px', letterSpacing:'-0.5px' }}>
      {'█'.repeat(n)}{'░'.repeat(width - n)}
    </span>
  );
}

function TagPill({ name, color }) {
  const [h, setH] = useSt(false);
  return (
    <span onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color: h?'#E6EDF3':color,
        background:`${color}${h?'28':'15'}`, border:`1px solid ${color}${h?'70':'40'}`,
        borderRadius:'4px', padding:'2px 8px', cursor:'pointer', transition:'all 0.15s',
        boxShadow: h?`0 0 8px ${color}50`:'none', whiteSpace:'nowrap' }}>
      {name}
    </span>
  );
}

function MoodBadge({ mood }) {
  const c = MOOD_CFG[mood]; if (!c) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:`${c.color}18`,
      border:`1px solid ${c.color}55`, borderRadius:'4px', padding:'2px 9px',
      fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:c.color,
      boxShadow:`0 0 10px ${c.color}30`, whiteSpace:'nowrap' }}>
      {c.emoji} {c.label}
    </span>
  );
}

// ─── IMAGE GRID ─────────────────────────────────────────────────

function ImgSlot({ idx }) {
  const cfgs = [
    { bg:'#081420', acc:'#00FFE5', lbl:'photo.01' },
    { bg:'#160820', acc:'#BB9AF7', lbl:'photo.02' },
    { bg:'#081A0C', acc:'#9ECE6A', lbl:'photo.03' },
    { bg:'#1E0C08', acc:'#FF9E64', lbl:'photo.04' },
  ];
  const { bg, acc, lbl } = cfgs[idx % 4];
  return (
    <div style={{ width:'100%', height:'100%',
      background:`repeating-linear-gradient(135deg,${bg} 0px,${bg} 7px,${acc}10 7px,${acc}10 14px)`,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
      <span style={{ fontSize:'20px', opacity:0.3 }}>⬡</span>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", color:acc, opacity:0.45, fontSize:'9px' }}>{lbl}</span>
    </div>
  );
}

function ImageGrid({ count }) {
  if (!count) return null;
  const r = { borderRadius:'4px', overflow:'hidden' };
  if (count === 1) return <div style={{ height:'200px', ...r, marginBottom:'12px' }}><ImgSlot idx={0} /></div>;
  if (count === 2) return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px', height:'160px', borderRadius:'6px', overflow:'hidden', marginBottom:'12px' }}>
      {[0,1].map(i => <div key={i} style={r}><ImgSlot idx={i} /></div>)}
    </div>
  );
  const shown = Math.min(count, 4);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px', height:'180px', borderRadius:'6px', overflow:'hidden', marginBottom:'12px' }}>
      <div style={r}><ImgSlot idx={0} /></div>
      <div style={{ display:'grid', gridTemplateRows:`repeat(${shown-1},1fr)`, gap:'3px' }}>
        {Array.from({ length: shown-1 }).map((_,i) => (
          <div key={i} style={{ position:'relative', ...r }}>
            <ImgSlot idx={i+1} />
            {count > 4 && i === shown-2 && (
              <div style={{ position:'absolute', inset:0, background:'rgba(10,14,26,0.78)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#E6EDF3', fontSize:'18px', fontWeight:700 }}>+{count-4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────

function Sidebar({ activeMood, onMoodFilter, isAdmin = false }) {
  const maxM = Math.max(...MOOD_STATS.map(m => m.count));
  const navItems = [
    { l:'Feed',  s:'⌘1', active:true  },
    { l:'Saved', s:'⌘2'               },
    { l:'Tags',  s:null               },
    { l:'Admin', s:'⌘3', badge:true   },
  ];
  return (
    <aside style={{ width:'220px', minWidth:'220px', background:'#11151F', borderRight:'1px solid #1F2A3A',
      overflowY:'auto', position:'sticky', top:'52px', height:'calc(100vh - 52px - 28px)',
      display:'flex', flexDirection:'column' }}>

      {/* Nav — admin only */}
      {isAdmin && (
        <div style={{ padding:'12px 14px' }}>
          <div className="sb-lbl">~/nav</div>
          {navItems.map(item => (
            <div key={item.l} className={`nav-item${item.active?' nav-act':''}`}>
              <span style={{ width:'12px', fontSize:'10px', color:'#00FFE5' }}>{item.active ? '❯' : ''}</span>
              <span style={{ flex:1, fontSize:'13px' }}>{item.l}</span>
              {item.badge && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#FF9E64', border:'1px solid #FF9E6460', borderRadius:'2px', padding:'0 4px' }}>[ admin ]</span>}
              {item.s && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#63707F' }}>{item.s}</span>}
            </div>
          ))}
        </div>
      )}



      {/* Hex deco */}
      <div style={{ marginTop:'auto', padding:'12px 14px', borderTop:'1px solid #1A1F2E' }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#2A3548', lineHeight:'1.9' }}>
          <div>0xDEAD·BEEF·CAFE</div>
          <div>0b10110101·11001010</div>
          <div>pid: 3141 · uid: root</div>
        </div>
      </div>
    </aside>
  );
}

// ─── RIGHT PANEL ───────────────────────────────────────────────

function RightPanel() {
  const total = MOOD_STATS.reduce((s, m) => s + m.count, 0);

  // 28-day heatmap: pseudo-random post counts per day
  const heatData = [0,2,1,3,0,1,2, 1,3,2,0,2,1,3, 2,1,0,3,2,1,2, 0,2,3,1,2,1,3];
  const heatColor = v => ['#1A1F2E','#2A3548','#00FFE535','#00FFE590'][v];
  const dayLabels = ['M','T','W','T','F','S','S'];

  const visitors = [
    { id:'0x7F·4A2C', page:'/post/abc123', action:'reading',  time:'1m', geo:'HN' },
    { id:'0x3B·9C71', page:'/feed',        action:'browsing', time:'4m', geo:'SG' },
    { id:'0xE1·D2F8', page:'/post/def456', action:'reading',  time:'9m', geo:'HN' },
  ];

  return (
    <aside style={{ width:'260px', minWidth:'260px', background:'#11151F', borderLeft:'1px solid #1F2A3A',
      overflowY:'auto', position:'sticky', top:'52px', height:'calc(100vh - 52px - 28px)' }}>

      {/* Mood distribution */}
      <div style={{ padding:'12px 14px' }}>
        <div className="sb-lbl">// mood.distribution</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8B96AA', marginBottom:'10px' }}>
          {total} posts · all time
        </div>
        {MOOD_STATS.map(m => {
          const c = MOOD_CFG[m.mood];
          const pct = Math.round((m.count / total) * 100);
          return (
            <div key={m.mood} style={{ marginBottom:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontSize:'12px' }}>{c.emoji}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:c.color }}>{c.label}</span>
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8B96AA' }}>
                  {m.count} <span style={{ color:'#63707F' }}>·</span> {pct}%
                </span>
              </div>
              <div style={{ height:'4px', background:'#1A1F2E', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${c.color}90,${c.color})`,
                  borderRadius:'2px', boxShadow:`0 0 6px ${c.color}60`, transition:'width .4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity heatmap */}
      <div style={{ padding:'4px 14px 14px' }}>
        <div className="sb-lbl">// activity.heatmap</div>
        {/* Day labels */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px', marginBottom:'3px' }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'8px', color:'#63707F', textAlign:'center' }}>{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px', marginBottom:'8px' }}>
          {heatData.map((v, i) => (
            <div key={i} title={`${v} post${v!==1?'s':''}`}
              style={{ height:'13px', borderRadius:'2px', background:heatColor(v), cursor:'default',
                boxShadow: v>0?`0 0 4px ${heatColor(v)}`:undefined, transition:'all .15s' }}
              className="heat-hover" />
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'flex-end' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#63707F' }}>less</span>
          {[0,1,2,3].map(v => (
            <div key={v} style={{ width:'9px', height:'9px', borderRadius:'2px', background:heatColor(v) }} />
          ))}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#63707F' }}>more</span>
        </div>
      </div>

      {/* Live visitors */}
      <div style={{ padding:'4px 14px 14px' }}>
        <div className="sb-lbl">// live.visitors</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8B96AA', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
          <span className="pulse" style={{ color:'#9ECE6A', fontSize:'8px' }}>●</span>
          <span>3 active sessions</span>
        </div>
        {visitors.map(v => (
          <div key={v.id} style={{ marginBottom:'8px', padding:'9px 10px', background:'#1A1F2E', borderRadius:'6px',
            border:'1px solid #2A3548', borderLeft:'2px solid #9ECE6A40', transition:'all .15s' }}
            className="sc-hover">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#7DCFFF', fontWeight:500 }}>{v.id}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#63707F', background:'#232936', padding:'1px 5px', borderRadius:'3px' }}>{v.geo}</span>
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8B96AA', marginBottom:'3px' }}>{v.page}</div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <span className="pulse" style={{ color:'#9ECE6A', fontSize:'7px' }}>●</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#9ECE6A' }}>{v.action}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'#63707F' }}>· {v.time} ago</span>
            </div>
          </div>
        ))}
      </div>

    </aside>
  );
}

function FileAttachments({ files }) {
  if (!files || !files.length) return null;
  const getCfg = t => ({
    pdf:  { label:'PDF',  color:'#F7768E' },
    doc:  { label:'DOC',  color:'#7DCFFF' },
    docx: { label:'DOCX', color:'#7DCFFF' },
    xls:  { label:'XLS',  color:'#9ECE6A' },
    xlsx: { label:'XLSX', color:'#9ECE6A' },
    txt:  { label:'TXT',  color:'#A0AEC0' },
    csv:  { label:'CSV',  color:'#E0AF68' },
  })[t?.toLowerCase()] || { label:(t||'FILE').toUpperCase(), color:'#8B96AA' };

  return (
    <div style={{ marginBottom:'12px' }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8B96AA', marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px' }}>
        <span>// attachments</span><span style={{ color:'#566176' }}>[{files.length}]</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        {files.map((f, i) => {
          const { label, color } = getCfg(f.type);
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 12px', background:'#1A1F2E', border:`1px solid ${color}28`, borderRadius:'6px', borderLeft:`2px solid ${color}80`, transition:'border-color .15s' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color, background:`${color}18`, border:`1px solid ${color}50`, borderRadius:'3px', padding:'1px 5px', flexShrink:0 }}>{label}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#C9D1D9', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#8B96AA', flexShrink:0 }}>{f.size}</span>
              <button style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color, background:`${color}10`, border:`1px solid ${color}40`, borderRadius:'4px', padding:'2px 8px', cursor:'pointer', flexShrink:0 }}>↓</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, {
  POSTS_DATA, MOOD_CFG, MOOD_STATS, TAGS_DATA, ACTIVITY, SPARKLINES,
  Sparkline, AsciiBar, TagPill, MoodBadge, ImgSlot, ImageGrid,
  Sidebar, RightPanel,
  FILE_CFG: {
    pdf:  { label:'PDF',  color:'#F7768E' },
    doc:  { label:'DOC',  color:'#7DCFFF' },
    docx: { label:'DOCX', color:'#7DCFFF' },
    xls:  { label:'XLS',  color:'#9ECE6A' },
    xlsx: { label:'XLSX', color:'#9ECE6A' },
    txt:  { label:'TXT',  color:'#A0AEC0' },
    csv:  { label:'CSV',  color:'#E0AF68' },
  },
  getFileCfg: t => ({
    pdf:  { label:'PDF',  color:'#F7768E' },
    doc:  { label:'DOC',  color:'#7DCFFF' },
    docx: { label:'DOCX', color:'#7DCFFF' },
    xls:  { label:'XLS',  color:'#9ECE6A' },
    xlsx: { label:'XLSX', color:'#9ECE6A' },
    txt:  { label:'TXT',  color:'#A0AEC0' },
    csv:  { label:'CSV',  color:'#E0AF68' },
  })[t?.toLowerCase()] || { label:(t||'FILE').toUpperCase(), color:'#8B96AA' },
  FileAttachments,
});
