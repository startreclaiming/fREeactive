import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/usageTracking';

/**
 * Reclaim — Community : user-defined network (v1)
 * --------------------------------------------------------------------------
 * A person CREATES a network (their street, building, group), gets a join
 * code, and others JOIN with it. Inside a network: a scoped feed + members.
 *
 * Persistence is local-first (survives reloads on this device) and is fully
 * isolated behind the `db` object below. Swapping to Supabase = reimplement
 * `db` only; the component never touches storage directly.
 *
 * Reflowed into the wireframe's 4 named steps: Anchor Your Block (create form,
 * now with a ZIP) → Set Trusted Boundary (privacy guarantees, non-negotiable
 * by design) → Activate Block Circle (invite code) → Fabric Dashboard
 * (feed/members/board tabs + Local Unclaimed Wealth + Emergency Alert).
 */

/* ─── Types ──────────────────────────────────────────────────────────── */
type NetworkType = 'Neighborhood' | 'Building' | 'Group';
type PostKind = 'Update' | 'Alert' | 'Event' | 'Check-in';

interface Network { id: string; name: string; type: NetworkType; description: string; zip: string; code: string; createdAt: number; }
interface Member  { id: string; name: string; role: 'admin' | 'member'; joinedAt: number; }
interface Post    { id: string; authorId: string; authorName: string; kind: PostKind; text: string; createdAt: number; }
interface Me      { id: string; name: string; }
type BoardKind = 'offer' | 'request';
interface BoardListing { id: string; title: string; kind: BoardKind; category: string; note: string; }

interface Store {
  me: Me | null;
  networks: Record<string, Network>;
  members: Record<string, Member[]>;
  posts: Record<string, Post[]>;
  myNetworkIds: string[];
  currentNetworkId: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 10);
const makeCode = () => {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => a[Math.floor(Math.random() * a.length)]).join('');
};
const timeAgo = (t: number) => {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
};

/** Local Unclaimed Wealth: sums alameda_property_cache.amount for a ZIP.
 * Best-effort — silently returns null if the table/network is unavailable
 * (e.g. no backend connected yet), same graceful-degradation pattern as
 * the bill/appliance scanners. Capped at 500 rows client-side sum. */
async function fetchZipUnclaimedTotal(zip: string): Promise<{ total: number; count: number } | null> {
  if (!zip.trim()) return null;
  try {
    const { data, error } = await supabase
      .from('alameda_property_cache')
      .select('amount')
      .eq('zipcode', parseInt(zip.trim(), 10))
      .limit(500);
    if (error || !data) return null;
    const total = data.reduce((s: number, r: { amount: number }) => s + (Number(r.amount) || 0), 0);
    return { total, count: data.length };
  } catch {
    return null;
  }
}

/* ─── Data layer (the ONLY thing Supabase replaces later) ────────────── */
const KEY = 'reclaim_community_fabric_v1';
const empty: Store = { me: null, networks: {}, members: {}, posts: {}, myNetworkIds: [], currentNetworkId: null };

const db = {
  read(): Store {
    try { const raw = localStorage.getItem(KEY); return raw ? { ...empty, ...JSON.parse(raw) } : { ...empty }; }
    catch { return { ...empty }; }
  },
  write(s: Store) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* preview / SSR */ }
  },
};

/* ─── Component ──────────────────────────────────────────────────────── */
const Chevron = ({ size = 14 }: { size?: number }) => (
  <span style={{ display: 'inline-block', width: 0, height: 0,
    borderTop: `${size * 0.62}px solid transparent`, borderBottom: `${size * 0.62}px solid transparent`,
    borderRight: `${size}px solid #f0a700` }} />
);

const KIND_META: Record<PostKind, { color: string; bg: string }> = {
  Update:     { color: '#cfcabf', bg: 'rgba(255,255,255,0.06)' },
  Alert:      { color: '#e76a6a', bg: 'rgba(231,106,106,0.14)' },
  Event:      { color: '#f0a700', bg: 'rgba(240,167,0,0.14)' },
  'Check-in': { color: '#5dcaa5', bg: 'rgba(93,202,165,0.14)' },
};

const CommunityFabric: React.FC = () => {
  const [store, setStore] = useState<Store>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);

  useEffect(() => { setStore(db.read()); setHydrated(true); }, []);
  const commit = (next: Store) => { setStore(next); db.write(next); };

  const current = store.currentNetworkId ? store.networks[store.currentNetworkId] : null;
  const myNetworks = useMemo(
    () => store.myNetworkIds.map((id) => store.networks[id]).filter(Boolean),
    [store]
  );

  /* actions */
  const createNetwork = (name: string, type: NetworkType, description: string, zip: string, myName: string) => {
    const meId = store.me?.id ?? uid();
    const id = uid();
    const code = makeCode();
    const me: Me = { id: meId, name: myName };
    const net: Network = { id, name, type, description, zip, code, createdAt: Date.now() };
    const member: Member = { id: meId, name: myName, role: 'admin', joinedAt: Date.now() };
    commit({
      ...store, me,
      networks: { ...store.networks, [id]: net },
      members: { ...store.members, [id]: [member] },
      posts:   { ...store.posts, [id]: [] },
      myNetworkIds: [...store.myNetworkIds, id],
      currentNetworkId: id,
    });
    trackEvent('community_network_created', 'community', { type });
    setPendingActivationId(id);
  };

  const joinNetwork = (code: string, myName: string): string | null => {
    const net = Object.values(store.networks).find((n) => n.code === code.trim().toUpperCase());
    if (!net) return 'No network found for that code. Check it with whoever invited you.';
    const meId = store.me?.id ?? uid();
    const me: Me = { id: meId, name: myName };
    const existing = store.members[net.id] ?? [];
    const already = existing.some((m) => m.id === meId);
    const members = already ? existing : [...existing, { id: meId, name: myName, role: 'member' as const, joinedAt: Date.now() }];
    commit({
      ...store, me,
      members: { ...store.members, [net.id]: members },
      myNetworkIds: store.myNetworkIds.includes(net.id) ? store.myNetworkIds : [...store.myNetworkIds, net.id],
      currentNetworkId: net.id,
    });
    trackEvent('community_network_joined', 'community');
    return null;
  };

  const addPost = (kind: PostKind, text: string) => {
    if (!current || !store.me || !text.trim()) return;
    const post: Post = { id: uid(), authorId: store.me.id, authorName: store.me.name, kind, text: text.trim(), createdAt: Date.now() };
    commit({ ...store, posts: { ...store.posts, [current.id]: [post, ...(store.posts[current.id] ?? [])] } });
    if (kind === 'Alert') trackEvent('community_emergency_alert', 'community');
  };

  const switchNetwork = (id: string) => commit({ ...store, currentNetworkId: id });
  const goOnboarding = () => commit({ ...store, currentNetworkId: null });

  if (!hydrated) return null;

  const activating = pendingActivationId ? store.networks[pendingActivationId] : null;
  if (activating) {
    return <ActivateScreen network={activating} onContinue={() => setPendingActivationId(null)} />;
  }

  return (
    <div className="rcn">
      <style>{css}</style>

      <div className="rcn-top">
        <div className="rcn-brand"><Chevron /><span>COMMUNITY&nbsp;FABRIC</span></div>
        {myNetworks.length > 0 && (
          <select
            className="rcn-switch"
            value={current?.id ?? ''}
            onChange={(e) => (e.target.value === '__new' ? goOnboarding() : switchNetwork(e.target.value))}
          >
            {myNetworks.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            <option value="__new">+ New / join a network</option>
          </select>
        )}
      </div>

      {current
        ? <NetworkHome
            network={current}
            members={store.members[current.id] ?? []}
            posts={store.posts[current.id] ?? []}
            meId={store.me?.id ?? ''}
            onPost={addPost}
          />
        : <Onboarding defaultName={store.me?.name ?? ''} onCreate={createNetwork} onJoin={joinNetwork} />
      }
    </div>
  );
};

/* ─── Activate Block Circle: show the invite code before entering the dashboard ─ */
const ActivateScreen: React.FC<{ network: Network; onContinue: () => void }> = ({ network, onContinue }) => {
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(network.code); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { /* clipboard blocked */ }
  };
  return (
    <div className="rcn">
      <style>{css}</style>
      <div className="rcn-hero">
        <div className="rcn-brand" style={{ marginBottom: 18 }}><Chevron /><span>ACTIVATE BLOCK CIRCLE</span></div>
        <h2 className="rcn-h">{network.name} is ready.</h2>
        <p className="rcn-sub">Share this code with neighbors you trust — anyone with it can join {network.name}.</p>
        <button className="rcn-invite" onClick={copyCode} style={{ marginBottom: 24 }}>
          <span className="rcn-invite-label">Invite code</span>
          <span className="rcn-invite-code">{network.code}</span>
          <span className="rcn-invite-action">{copied ? 'Copied ✓' : 'Tap to copy'}</span>
        </button>
        <button className="rcn-primary" onClick={onContinue}>Continue to your Fabric Dashboard</button>
      </div>
    </div>
  );
};

/* ─── Onboarding: Anchor Your Block → Set Trusted Boundary, or Join ──── */
const Onboarding: React.FC<{
  defaultName: string;
  onCreate: (name: string, type: NetworkType, description: string, zip: string, myName: string) => void;
  onJoin: (code: string, myName: string) => string | null;
}> = ({ defaultName, onCreate, onJoin }) => {
  const [mode, setMode] = useState<'pick' | 'create' | 'boundary' | 'join'>('pick');
  const [myName, setMyName] = useState(defaultName);
  const [name, setName] = useState('');
  const [type, setType] = useState<NetworkType>('Neighborhood');
  const [zip, setZip] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  if (mode === 'pick') return (
    <div className="rcn-hero">
      <h2 className="rcn-h">Your community, woven by you.</h2>
      <p className="rcn-sub">Community Fabric lets you start a network for your street, building, or group — then weave in the people you trust.</p>
      <div className="rcn-pick">
        <button className="rcn-card-btn" onClick={() => setMode('create')}>
          <span className="rcn-card-title">Anchor your block</span>
          <span className="rcn-card-desc">Name it, set who it's for, and get an invite code to share.</span>
        </button>
        <button className="rcn-card-btn" onClick={() => setMode('join')}>
          <span className="rcn-card-title">Join with a code</span>
          <span className="rcn-card-desc">Got an invite code from a neighbor? Enter it to join their network.</span>
        </button>
      </div>
    </div>
  );

  if (mode === 'create') return (
    <div className="rcn-form">
      <button className="rcn-back" onClick={() => setMode('pick')}>← Back</button>
      <div className="rcn-brand" style={{ marginBottom: 14 }}><Chevron /><span>STEP 1 · ANCHOR YOUR BLOCK</span></div>
      <h2 className="rcn-h">Anchor your block</h2>
      <label className="rcn-label">Your name</label>
      <input className="rcn-input" value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="e.g. Shaun" />
      <label className="rcn-label">Network name</label>
      <input className="rcn-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maple Street" />
      <label className="rcn-label">ZIP code</label>
      <input className="rcn-input" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="e.g. 94601" inputMode="numeric" />
      <label className="rcn-label">Type</label>
      <div className="rcn-chips">
        {(['Neighborhood', 'Building', 'Group'] as NetworkType[]).map((t) => (
          <button key={t} className={`rcn-chip${type === t ? ' on' : ''}`} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>
      <label className="rcn-label">Description <span className="rcn-opt">(optional)</span></label>
      <input className="rcn-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this network for?" />
      <button
        className="rcn-primary"
        disabled={!myName.trim() || !name.trim()}
        onClick={() => setMode('boundary')}
      >Continue</button>
    </div>
  );

  if (mode === 'boundary') return (
    <div className="rcn-form">
      <button className="rcn-back" onClick={() => setMode('create')}>← Back</button>
      <div className="rcn-brand" style={{ marginBottom: 14 }}><Chevron /><span>STEP 2 · SET TRUSTED BOUNDARY</span></div>
      <h2 className="rcn-h">Coordination, not surveillance.</h2>
      <p className="rcn-sub">These aren't settings you can turn off — they're how Reclaim Community works, always.</p>
      <div className="rcn-boundary">
        <div className="rcn-boundary-item">✓ Opt-in neighbor circle only — nobody sees this without your invite code</div>
        <div className="rcn-boundary-item">✓ Zero police / HOA data feeds — this is neighbor-to-neighbor, full stop</div>
        <div className="rcn-boundary-item">✓ Shared power / outage alerts stay inside your circle</div>
      </div>
      <button
        className="rcn-primary"
        onClick={() => onCreate(name.trim(), type, description.trim(), zip.trim(), myName.trim())}
      >Create network</button>
    </div>
  );

  return (
    <div className="rcn-form">
      <button className="rcn-back" onClick={() => { setMode('pick'); setErr(''); }}>← Back</button>
      <h2 className="rcn-h">Join a network</h2>
      <label className="rcn-label">Your name</label>
      <input className="rcn-input" value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="e.g. Dana" />
      <label className="rcn-label">Invite code</label>
      <input className="rcn-input rcn-code-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="6-character code" maxLength={6} />
      {err && <p className="rcn-err">{err}</p>}
      <button
        className="rcn-primary"
        disabled={!myName.trim() || code.trim().length < 4}
        onClick={() => { const e = onJoin(code, myName.trim()); setErr(e ?? ''); }}
      >Join network</button>
    </div>
  );
};

/* ─── Network home: invite + feed + members + board ──────────────────── */
const NetworkHome: React.FC<{
  network: Network; members: Member[]; posts: Post[]; meId: string;
  onPost: (kind: PostKind, text: string) => void;
}> = ({ network, members, posts, meId, onPost }) => {
  const [tab, setTab] = useState<'feed' | 'members' | 'board'>('feed');
  const [kind, setKind] = useState<PostKind>('Update');
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [wealth, setWealth] = useState<{ total: number; count: number } | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setWealth(undefined);
    fetchZipUnclaimedTotal(network.zip).then((r) => { if (!cancelled) setWealth(r); });
    return () => { cancelled = true; };
  }, [network.zip]);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(network.code); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { /* clipboard blocked */ }
  };

  const sendAlert = () => {
    if (!alertText.trim()) return;
    onPost('Alert', alertText.trim());
    setAlertText('');
    setAlertOpen(false);
  };

  const money = (n: number) => '$' + Math.round(n).toLocaleString();

  return (
    <>
      <div className="rcn-net-head">
        <div>
          <div className="rcn-net-type">{network.type}</div>
          <h2 className="rcn-net-name">{network.name}</h2>
          <div className="rcn-net-meta">{members.length} member{members.length === 1 ? '' : 's'}{network.description ? ` · ${network.description}` : ''}</div>
        </div>
        <button className="rcn-invite" onClick={copyCode} title="Copy invite code">
          <span className="rcn-invite-label">Invite code</span>
          <span className="rcn-invite-code">{network.code}</span>
          <span className="rcn-invite-action">{copied ? 'Copied ✓' : 'Tap to copy'}</span>
        </button>
      </div>

      {/* Local Unclaimed Wealth + Emergency Alert */}
      <div className="rcn-stat-row">
        {wealth && wealth.total > 0 ? (
          <div className="rcn-stat-card">
            <span className="rcn-stat-label">Local unclaimed wealth · ZIP {network.zip}</span>
            <span className="rcn-stat-value">{money(wealth.total)}</span>
            <span className="rcn-stat-sub">across {wealth.count} record{wealth.count === 1 ? '' : 's'} — alert your block</span>
          </div>
        ) : (
          <div className="rcn-stat-card rcn-stat-card-muted">
            <span className="rcn-stat-label">Local unclaimed wealth</span>
            <span className="rcn-stat-sub">{network.zip ? 'No unclaimed records found for this ZIP yet.' : 'Add a ZIP to your network to see this.'}</span>
          </div>
        )}
        <button className="rcn-alert-btn" onClick={() => setAlertOpen((v) => !v)}>🚨 Emergency Alert</button>
      </div>

      {alertOpen && (
        <div className="rcn-composer" style={{ marginBottom: 16 }}>
          <textarea className="rcn-textarea" value={alertText} onChange={(e) => setAlertText(e.target.value)}
            placeholder="What's happening? (outage, safety concern, urgent need...)" rows={2} />
          <button className="rcn-primary rcn-post-btn" style={{ background: '#e76a6a' }} disabled={!alertText.trim()} onClick={sendAlert}>
            Send alert to {network.name}
          </button>
        </div>
      )}

      <div className="rcn-tabs">
        <button className={`rcn-tab${tab === 'feed' ? ' on' : ''}`} onClick={() => setTab('feed')}>Feed</button>
        <button className={`rcn-tab${tab === 'members' ? ' on' : ''}`} onClick={() => setTab('members')}>Members</button>
        <button className={`rcn-tab${tab === 'board' ? ' on' : ''}`} onClick={() => setTab('board')}>Board</button>
      </div>

      {tab === 'feed' && (
        <>
          <div className="rcn-composer">
            <div className="rcn-chips">
              {(['Update', 'Alert', 'Event', 'Check-in'] as PostKind[]).map((k) => (
                <button key={k} className={`rcn-chip${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}>{k}</button>
              ))}
            </div>
            <textarea className="rcn-textarea" value={text} onChange={(e) => setText(e.target.value)}
              placeholder={`Post an ${kind.toLowerCase()} to ${network.name}…`} rows={2} />
            <button className="rcn-primary rcn-post-btn" disabled={!text.trim()} onClick={() => { onPost(kind, text); setText(''); }}>
              Post to neighbors
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="rcn-empty">Nothing here yet. Post the first update and your network will see it.</div>
          ) : (
            <div className="rcn-feed">
              {posts.map((p) => (
                <div className="rcn-post" key={p.id}>
                  <div className="rcn-post-top">
                    <span className="rcn-badge" style={{ color: KIND_META[p.kind].color, background: KIND_META[p.kind].bg }}>{p.kind}</span>
                    <span className="rcn-post-author">{p.authorName}{p.authorId === meId ? ' (you)' : ''}</span>
                    <span className="rcn-post-time">{timeAgo(p.createdAt)}</span>
                  </div>
                  <div className="rcn-post-text">{p.text}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'members' && (
        <div className="rcn-members">
          {members.map((m) => (
            <div className="rcn-member" key={m.id}>
              <span className="rcn-avatar">{m.name.slice(0, 1).toUpperCase()}</span>
              <span className="rcn-member-name">{m.name}{m.id === meId ? ' (you)' : ''}</span>
              {m.role === 'admin' && <span className="rcn-admin">admin</span>}
            </div>
          ))}
        </div>
      )}

      {tab === 'board' && <NeighborhoodBoard />}
    </>
  );
};

/* ─── Neighbourhood Board tab: tool/skill/service swaps, dark-themed to match ── */
const BOARD_KEY = 'reclaim_community_listings';
const BOARD_CATEGORIES = ['Tool', 'Skill', 'Service', 'Lift / Transport', 'Other'];

const NeighborhoodBoard: React.FC = () => {
  const [listings, setListings] = useState<BoardListing[]>(() => {
    try { const raw = localStorage.getItem(BOARD_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [filter, setFilter] = useState<'all' | BoardKind>('all');
  const [form, setForm] = useState<Omit<BoardListing, 'id'>>({ title: '', kind: 'offer', category: 'Tool', note: '' });

  const persist = (next: BoardListing[]) => {
    setListings(next);
    try { localStorage.setItem(BOARD_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const add = () => {
    if (!form.title.trim()) return;
    persist([{ id: uid(), ...form, title: form.title.trim(), note: form.note.trim() }, ...listings]);
    setForm({ title: '', kind: 'offer', category: 'Tool', note: '' });
  };
  const remove = (id: string) => persist(listings.filter((l) => l.id !== id));
  const shown = listings.filter((l) => filter === 'all' || l.kind === filter);

  return (
    <div>
      <div className="rcn-composer">
        <input className="rcn-input" placeholder="Title (e.g. Lend my pressure washer)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="rcn-chips">
          <select className="rcn-switch" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as BoardKind })}>
            <option value="offer">I'm offering</option>
            <option value="request">I'm requesting</option>
          </select>
          <select className="rcn-switch" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {BOARD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <textarea className="rcn-textarea" placeholder="Details (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} />
        <button className="rcn-primary rcn-post-btn" onClick={add}>Post to board</button>
      </div>

      <div className="rcn-chips" style={{ marginBottom: 14 }}>
        {(['all', 'offer', 'request'] as const).map((f) => (
          <button key={f} className={`rcn-chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'offer' ? 'Offers' : 'Requests'}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rcn-empty">Be the first to share a tool, skill, or service.</div>
      ) : (
        <div className="rcn-feed">
          {shown.map((l) => (
            <div className="rcn-post" key={l.id}>
              <div className="rcn-post-top">
                <span className="rcn-badge" style={l.kind === 'offer' ? { color: '#5dcaa5', background: 'rgba(93,202,165,0.14)' } : { color: '#f0a700', background: 'rgba(240,167,0,0.14)' }}>{l.kind}</span>
                <span className="rcn-post-author">{l.category}</span>
                <button onClick={() => remove(l.id)} className="rcn-post-time" style={{ marginLeft: 'auto', cursor: 'pointer' }}>remove</button>
              </div>
              <div className="rcn-post-text">{l.title}{l.note ? ` — ${l.note}` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Scoped styles ──────────────────────────────────────────────────── */
const css = `
.rcn{--bg:#181818;--panel:#1f1f1f;--line:#2f2f2f;--gold:#f0a700;--white:#f4f1ea;--muted:#9a968c;--dim:#6e6a62;
  font-family:'Poppins',system-ui,sans-serif;color:var(--white);background:var(--bg);
  max-width:640px;margin:0 auto;padding:20px 18px 40px;min-height:100%;}
.rcn *{box-sizing:border-box;}
.rcn-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
.rcn-brand{display:flex;align-items:center;gap:7px;}
.rcn-brand span{font-size:11px;font-weight:700;letter-spacing:.18em;color:var(--muted);}
.rcn-switch{background:var(--panel);color:var(--white);border:1px solid var(--line);border-radius:9px;
  font-family:inherit;font-size:12px;padding:7px 10px;cursor:pointer;}
.rcn-h{font-size:24px;font-weight:600;letter-spacing:-.01em;line-height:1.15;margin:0 0 8px;}
.rcn-sub{font-size:13px;font-weight:300;color:var(--muted);line-height:1.6;margin:0 0 22px;max-width:440px;}
.rcn-hero{padding-top:8px;}
.rcn-pick{display:grid;gap:12px;}
.rcn-card-btn{display:flex;flex-direction:column;gap:5px;text-align:left;background:var(--panel);
  border:1px solid var(--line);border-radius:14px;padding:18px 18px;cursor:pointer;transition:border-color .18s,transform .18s;}
.rcn-card-btn:hover{border-color:rgba(240,167,0,.5);transform:translateY(-2px);}
.rcn-card-title{font-size:15px;font-weight:600;color:var(--white);}
.rcn-card-desc{font-size:12px;font-weight:300;color:var(--muted);line-height:1.5;}
.rcn-form{display:flex;flex-direction:column;}
.rcn-back{align-self:flex-start;background:none;border:none;color:var(--muted);font-family:inherit;font-size:12px;cursor:pointer;padding:0 0 14px;}
.rcn-label{font-size:11px;font-weight:600;letter-spacing:.04em;color:var(--muted);margin:14px 0 6px;}
.rcn-opt{font-weight:300;color:var(--dim);}
.rcn-input,.rcn-textarea{width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;
  color:var(--white);font-family:inherit;font-size:14px;padding:12px 14px;outline:none;transition:border-color .18s;}
.rcn-input:focus,.rcn-textarea:focus{border-color:var(--gold);}
.rcn-code-input{letter-spacing:.3em;font-weight:600;text-transform:uppercase;}
.rcn-textarea{resize:vertical;line-height:1.5;}
.rcn-chips{display:flex;flex-wrap:wrap;gap:8px;}
.rcn-chip{background:var(--panel);border:1px solid var(--line);color:var(--muted);border-radius:20px;
  font-family:inherit;font-size:12px;font-weight:500;padding:7px 14px;cursor:pointer;transition:all .15s;}
.rcn-chip.on{background:rgba(240,167,0,.14);border-color:rgba(240,167,0,.6);color:var(--gold);}
.rcn-boundary{display:flex;flex-direction:column;gap:10px;margin-bottom:8px;}
.rcn-boundary-item{background:rgba(93,202,165,.08);border:1px solid rgba(93,202,165,.3);color:#bfe8d5;
  border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.5;}
.rcn-primary{margin-top:20px;background:var(--gold);color:#1a1a1a;border:none;border-radius:11px;
  font-family:inherit;font-weight:700;font-size:13px;letter-spacing:.03em;padding:13px;cursor:pointer;transition:opacity .15s;}
.rcn-primary:disabled{opacity:.4;cursor:not-allowed;}
.rcn-err{color:#e76a6a;font-size:12px;margin:10px 0 0;}
.rcn-net-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px;}
.rcn-net-type{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:4px;}
.rcn-net-name{font-size:24px;font-weight:600;letter-spacing:-.01em;margin:0;}
.rcn-net-meta{font-size:12px;font-weight:300;color:var(--muted);margin-top:5px;}
.rcn-invite{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;background:linear-gradient(135deg,#241d10,#1c1710);
  border:1px solid #3a2e12;border-radius:12px;padding:10px 16px;cursor:pointer;transition:border-color .18s;}
.rcn-invite:hover{border-color:rgba(240,167,0,.55);}
.rcn-invite-label{font-size:9px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);}
.rcn-invite-code{font-size:20px;font-weight:700;letter-spacing:.16em;color:var(--gold);}
.rcn-invite-action{font-size:9px;font-weight:500;color:var(--dim);}
.rcn-stat-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
.rcn-stat-card{flex:1;min-width:220px;background:linear-gradient(135deg,#241d10,#1c1710);border:1px solid #3a2e12;
  border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:2px;}
.rcn-stat-card-muted{background:var(--panel);border:1px solid var(--line);}
.rcn-stat-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
.rcn-stat-value{font-size:22px;font-weight:700;color:var(--gold);}
.rcn-stat-sub{font-size:11px;color:var(--dim);}
.rcn-alert-btn{background:rgba(231,106,106,.12);border:1px solid rgba(231,106,106,.4);color:#e76a6a;
  border-radius:12px;padding:0 18px;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;transition:background .15s;}
.rcn-alert-btn:hover{background:rgba(231,106,106,.2);}
.rcn-tabs{display:flex;gap:8px;border-bottom:1px solid var(--line);margin-bottom:16px;}
.rcn-tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:inherit;
  font-size:13px;font-weight:600;padding:8px 4px;margin-bottom:-1px;cursor:pointer;}
.rcn-tab.on{color:var(--white);border-bottom-color:var(--gold);}
.rcn-composer{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:18px;display:flex;flex-direction:column;gap:10px;}
.rcn-post-btn{margin-top:2px;}
.rcn-empty{text-align:center;color:var(--dim);font-size:13px;font-weight:300;padding:32px 16px;line-height:1.6;}
.rcn-feed{display:flex;flex-direction:column;gap:10px;}
.rcn-post{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:13px 15px;}
.rcn-post-top{display:flex;align-items:center;gap:9px;margin-bottom:6px;}
.rcn-badge{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:20px;}
.rcn-post-author{font-size:12px;font-weight:600;color:var(--white);}
.rcn-post-time{font-size:11px;color:var(--dim);margin-left:auto;}
.rcn-post-text{font-size:13px;font-weight:300;line-height:1.55;color:var(--white);}
.rcn-members{display:flex;flex-direction:column;gap:8px;}
.rcn-member{display:flex;align-items:center;gap:11px;background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:11px 14px;}
.rcn-avatar{width:32px;height:32px;border-radius:50%;background:rgba(240,167,0,.16);color:var(--gold);
  display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
.rcn-member-name{font-size:13px;font-weight:500;}
.rcn-admin{margin-left:auto;font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  color:var(--gold);background:rgba(240,167,0,.12);padding:3px 9px;border-radius:20px;}
`;

export default CommunityFabric;
