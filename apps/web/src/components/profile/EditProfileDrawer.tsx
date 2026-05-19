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
  const [title, setTitle] = useState(user.title ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [skills, setSkills] = useState<Skill[]>(user.skills ?? []);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);

  const updateMut = useUpdateProfile();
  const pwMut = useChangePassword();

  useEffect(() => {
    if (!open) return;
    setTitle(user.title ?? '');
    setBio(user.bio ?? '');
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
    updateMut.mutate(
      { id: user.id, body: { title, bio, skills } },
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
    if (newPw.length < 8) {
      setPwError('New password tối thiểu 8 ký tự');
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
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

      {/* Drawer panel */}
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-[420px] overflow-y-auto border-l border-b2 bg-surf p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-mono text-mono-xs text-tm">// edit.profile</div>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            className="rounded-sm border border-b2 bg-elev px-2 py-0.5 font-mono text-mono-xs text-tm hover:text-tp"
          >
            ×
          </button>
        </div>

        {/* Profile section */}
        <form onSubmit={handleProfileSubmit} className="mb-6 space-y-3">
          <div className="font-mono text-mono-xs text-tm">// profile</div>
          <Field label="Title (max 80)">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Full-stack Developer"
              className="w-full rounded-sm border border-b2 bg-bg px-3 py-1.5 font-mono text-mono-sm text-tp outline-none placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-sm"
            />
          </Field>
          <Field label="Bio (max 500)">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Tell people about yourself..."
              className="w-full resize-y rounded-sm border border-b2 bg-bg px-3 py-2 font-mono text-mono-sm text-tp outline-none placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-sm"
            />
            <div className="mt-1 text-right font-mono text-mono-xs text-td">{bio.length}/500</div>
          </Field>
          <Field label="Skills (max 20)">
            <SkillChipInput value={skills} onChange={setSkills} />
          </Field>
          {profileError && (
            <div
              role="alert"
              className="rounded-sm border border-red/40 bg-red/[0.08] px-3 py-2 font-mono text-mono-xs text-red"
            >
              {profileError}
            </div>
          )}
          <button
            type="submit"
            disabled={updateMut.isPending}
            className="w-full rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-2 font-mono text-mono-xs text-cyan hover:bg-cyan/20 disabled:opacity-50"
          >
            {updateMut.isPending ? '⠋ saving...' : 'Save profile'}
          </button>
        </form>

        {/* Security section */}
        <form onSubmit={handlePwSubmit} className="space-y-3">
          <div className="font-mono text-mono-xs text-tm">// security</div>
          <Field label="Current password">
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-sm border border-b2 bg-bg px-3 py-1.5 font-mono text-mono-sm text-tp outline-none focus:border-cyan focus:shadow-glow-cyan-sm"
            />
          </Field>
          <Field label="New password (min 8)">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-sm border border-b2 bg-bg px-3 py-1.5 font-mono text-mono-sm text-tp outline-none focus:border-cyan focus:shadow-glow-cyan-sm"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-sm border border-b2 bg-bg px-3 py-1.5 font-mono text-mono-sm text-tp outline-none focus:border-cyan focus:shadow-glow-cyan-sm"
            />
          </Field>
          {pwError && (
            <div
              role="alert"
              className="rounded-sm border border-red/40 bg-red/[0.08] px-3 py-2 font-mono text-mono-xs text-red"
            >
              {pwError}
            </div>
          )}
          {pwOk && (
            <div className="rounded-sm border border-grn/40 bg-grn/[0.08] px-3 py-2 font-mono text-mono-xs text-grn">
              ✓ password changed
            </div>
          )}
          <button
            type="submit"
            disabled={pwMut.isPending || !currentPw || !newPw || !confirmPw}
            className="w-full rounded-sm border border-pur/50 bg-pur/10 px-3 py-2 font-mono text-mono-xs text-pur hover:bg-pur/20 disabled:opacity-50"
          >
            {pwMut.isPending ? '⠋ updating...' : 'Change password'}
          </button>
        </form>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 font-mono text-mono-xs text-tm">{label}</div>
      {children}
    </label>
  );
}
