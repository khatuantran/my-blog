import { useEffect, useState } from 'react';
import { ApiError } from '@/services/api/client';
import { SkillChipInput } from '@/components/shared/SkillChipInput';
import { useChangePassword, useUpdateProfile } from '@/hooks/mutations/use-update-profile';
import type { ProfileUser, Skill } from '@/types/api';

type Props = {
  open: boolean;
  user: ProfileUser;
  onClose: () => void;
};

export function EditProfileDrawer({ open, user, onClose }: Props) {
  // basic.info
  const [name, setName] = useState(user.name ?? '');
  const [title, setTitle] = useState(user.title ?? '');
  const [bio, setBio] = useState(user.bio ?? '');

  // contact.links
  const [location, setLocation] = useState(user.location ?? '');
  const [bornYear, setBornYear] = useState(user.bornYear ? String(user.bornYear) : '');
  const [github, setGithub] = useState(user.github ?? '');
  const [website, setWebsite] = useState(user.website ?? '');

  // skills.stack
  const [skills, setSkills] = useState<Skill[]>(user.skills ?? []);

  const [profileError, setProfileError] = useState<string | null>(null);

  // security
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);

  const updateMut = useUpdateProfile();
  const pwMut = useChangePassword();

  useEffect(() => {
    if (!open) return;
    setName(user.name ?? '');
    setTitle(user.title ?? '');
    setBio(user.bio ?? '');
    setLocation(user.location ?? '');
    setBornYear(user.bornYear ? String(user.bornYear) : '');
    setGithub(user.github ?? '');
    setWebsite(user.website ?? '');
    setSkills(user.skills ?? []);
    setProfileError(null);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setPwError(null);
    setPwOk(false);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    const body: Parameters<typeof updateMut.mutate>[0]['body'] = {
      title: title || undefined,
      bio: bio || undefined,
      skills,
      name: name || undefined,
      location: location || undefined,
      bornYear: bornYear ? Number(bornYear) : undefined,
      github: github || undefined,
      website: website || undefined,
    };
    updateMut.mutate(
      { id: user.id, body },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          let msg = err.message;
          if (err instanceof ApiError && err.status === 400) {
            msg = 'Invalid input · check fields (title 80 / bio 500 / skills 20)';
          }
          setProfileError(msg);
        },
      },
    );
  }

  function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwOk(false);
    if (newPw !== confirmPw) {
      setPwError('New password và confirm không khớp');
      return;
    }
    if (newPw.length < 5) {
      setPwError('New password tối thiểu 5 ký tự');
      return;
    }
    pwMut.mutate(
      { currentPassword: currentPw, newPassword: newPw },
      {
        onSuccess: () => {
          setPwOk(true);
          setCurrentPw('');
          setNewPw('');
          setConfirmPw('');
        },
        onError: (err) => {
          if (
            err instanceof ApiError &&
            (err.status === 401 || err.code === 'INVALID_CREDENTIALS')
          ) {
            setPwError('Current password sai');
          } else {
            setPwError(err.message);
          }
        },
      },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      className="fixed inset-0 z-[300]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

      <aside
        className="animate-slide-in absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-cyan/20 bg-surf shadow-[-20px_0_60px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header — 2-line title per design L370-374 */}
        <div className="flex shrink-0 items-center justify-between border-b border-b2 px-5 py-4">
          <div>
            <div className="font-mono text-[12px] text-cyan">// edit.profile</div>
            <div className="mt-0.5 font-mono text-[11px] text-td">~/settings/profile</div>
          </div>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            className="border-none bg-transparent text-[24px] leading-none text-tm hover:text-tp"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Section 1: basic.info */}
            <Section title="// basic.info">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="Jane Doe"
                    className={inputCls}
                  />
                </Field>
                <Field label="Handle">
                  <input
                    type="text"
                    value={`@${user.username}`}
                    readOnly
                    aria-label="Handle (read-only)"
                    className={`${inputCls} cursor-default opacity-50`}
                  />
                </Field>
              </div>
              <Field label="Title (max 80)">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="Full-stack Developer"
                  className={inputCls}
                />
              </Field>
              <Field label="Bio (max 500)">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell people about yourself..."
                  className={`${inputCls} resize-y py-2`}
                />
                <div className="mt-1 text-right font-mono text-mono-sm text-td">
                  {bio.length}/500
                </div>
              </Field>
            </Section>

            {/* Section 2: contact.links */}
            <Section title="// contact.links">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Location">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={80}
                    placeholder="Ho Chi Minh City"
                    className={inputCls}
                  />
                </Field>
                <Field label="Born year">
                  <input
                    type="number"
                    value={bornYear}
                    onChange={(e) => setBornYear(e.target.value)}
                    min={1900}
                    max={new Date().getFullYear()}
                    placeholder="1995"
                    className={inputCls}
                  />
                </Field>
                <Field label="GitHub">
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    maxLength={120}
                    placeholder="github.com/handle"
                    className={inputCls}
                  />
                </Field>
                <Field label="Website">
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    maxLength={200}
                    placeholder="https://yoursite.com"
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            {/* Section 3: skills.stack */}
            <Section title="// skills.stack">
              <Field label="Skills (max 20)">
                <SkillChipInput value={skills} onChange={setSkills} />
              </Field>
            </Section>

            {profileError && (
              <div
                role="alert"
                className="rounded-sm border border-red/40 bg-red/[0.08] px-3 py-2 font-mono text-mono-sm text-red"
              >
                {profileError}
              </div>
            )}
          </form>

          {/* Section 4: security (separate form) */}
          <form onSubmit={handlePwSubmit} className="mt-5 space-y-3">
            <Section title="// security">
              <Field label="Current password">
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                  className={inputCls}
                />
              </Field>
              <Field label="New password (min 5)">
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                  minLength={5}
                  className={inputCls}
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                  className={inputCls}
                />
              </Field>
              {pwError && (
                <div
                  role="alert"
                  className="rounded-sm border border-red/40 bg-red/[0.08] px-3 py-2 font-mono text-mono-sm text-red"
                >
                  {pwError}
                </div>
              )}
              {pwOk && (
                <div className="rounded-sm border border-grn/40 bg-grn/[0.08] px-3 py-2 font-mono text-mono-sm text-grn">
                  ✓ password changed
                </div>
              )}
              <button
                type="submit"
                disabled={pwMut.isPending || !currentPw || !newPw || !confirmPw}
                className="w-full rounded-sm border border-pur/50 bg-pur/10 px-3 py-2 font-mono text-mono-sm text-pur hover:bg-pur/20 disabled:opacity-50"
              >
                {pwMut.isPending ? '⠋ updating...' : 'Change password'}
              </button>
            </Section>
          </form>
        </div>

        {/* Sticky footer — design L425-433 */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-b2 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-b2 bg-elev px-5 py-2 font-mono text-[13px] text-tm hover:text-tp"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="profile-form"
            disabled={updateMut.isPending}
            data-testid="save-changes-btn"
            className="rounded-md border-none bg-cyan px-5 py-2 font-mono text-[13px] font-semibold text-[#0A0E1A] shadow-[0_0_14px_rgba(0,255,229,0.3)] hover:shadow-[0_0_20px_rgba(0,255,229,0.4)] disabled:opacity-50"
          >
            {updateMut.isPending ? '⠋ saving...' : '✓ Save Changes'}
          </button>
        </div>
      </aside>
    </div>
  );
}

// design L57 .edit-inp: 14px JetBrains Mono, bg #070A14 (=bg), padding 8px 12px, radius 6px
const inputCls =
  'w-full rounded-md border border-b2 bg-bg px-3 py-2 font-mono text-[14px] text-tp outline-none placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-sm';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="sb-lbl font-mono text-mono-sm text-tm">{title}</div>
        <div className="h-px flex-1 bg-b2" />
      </div>
      {children}
    </div>
  );
}

// design L60 .edit-lbl: 11px JetBrains Mono UPPERCASE letter-spacing .05em color tm
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-tm">
        {label}
      </div>
      {children}
    </label>
  );
}
