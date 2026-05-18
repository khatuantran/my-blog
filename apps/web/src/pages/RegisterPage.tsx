import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { TerminalCard } from '@/components/auth/TerminalCard';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';
import { useRegister } from '@/hooks/mutations/use-register';
import { ApiError } from '@/services/api/client';

const BUILD_SHA = import.meta.env.VITE_BUILD_SHA?.slice(0, 6) || 'a1b2c3';
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const m = useRegister();

  function fail(msg: string) {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  }

  function validate(): string | null {
    if (!username.trim() || !password) return '[ERROR] username + password required';
    if (username.length < 3 || username.length > 32) return '[ERROR] username 3-32 chars';
    if (!USERNAME_PATTERN.test(username)) return '[ERROR] username chỉ chữ/số/_/-';
    if (password.length < 8) return '[ERROR] password min 8 chars';
    return null;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = validate();
    if (v) return fail(v);
    setError('');
    m.mutate(
      { username: username.trim(), password, email: email.trim() || undefined },
      {
        onSuccess: () => navigate('/', { replace: true }),
        onError: (err) => {
          let msg = `[ERROR] ${err.message}`;
          if (err instanceof ApiError) {
            if (err.status === 409 || err.code === 'USERNAME_TAKEN') {
              msg = '[ERROR] username already taken';
            } else if (err.status === 400) {
              msg = '[ERROR] invalid input · check fields';
            }
          }
          fail(msg);
        },
      },
    );
  }

  return (
    <TerminalCard
      path="~/auth/register"
      shaking={shaking}
      footer={
        <div className="mt-3.5 flex justify-between font-mono text-[10px] text-td">
          <span>
            <span className="animate-pulse-status text-grn">●</span> connected to server
          </span>
          <span>build: {BUILD_SHA}</span>
        </div>
      }
    >
      <div className="mb-[18px] text-[10px] text-tm">// create new account</div>

      <form onSubmit={onSubmit} aria-label="Register form">
        {/* Username */}
        <div className="mb-3.5">
          <div className="mb-1.5 text-[10px] text-tm">username</div>
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-cyan"
            >
              ❯
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="choose username..."
              autoComplete="username"
              autoFocus
              aria-label="Username"
              className="w-full rounded-md bg-[#070A14] py-2.5 pl-8 pr-3 font-mono text-[14px] text-tp outline-none transition-all duration-150 placeholder:text-tm focus:border-cyan focus:shadow-glow-cyan-sm"
              style={{ border: '1px solid #2A3548' }}
            />
          </div>
          <div className="mt-1 text-[10px] text-td">// 3-32 chars, alphanumeric + - _</div>
        </div>

        {/* Password */}
        <div className="mb-3.5">
          <div className="mb-1.5 text-[10px] text-tm">password</div>
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-cyan"
            >
              ❯
            </span>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 8 chars..."
              autoComplete="new-password"
              aria-label="Password"
              className="w-full rounded-md bg-[#070A14] py-2.5 pl-8 pr-10 font-mono text-[14px] text-tp outline-none transition-all duration-150 placeholder:text-tm focus:border-cyan focus:shadow-glow-cyan-sm"
              style={{ border: '1px solid #2A3548' }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 border-none bg-transparent text-[13px] text-tm"
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Email (optional) */}
        <div className="mb-5">
          <div className="mb-1.5 text-[10px] text-tm">
            email <span className="text-td">// optional</span>
          </div>
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-cyan"
            >
              ❯
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-label="Email"
              className="w-full rounded-md bg-[#070A14] py-2.5 pl-8 pr-3 font-mono text-[14px] text-tp outline-none transition-all duration-150 placeholder:text-tm focus:border-cyan focus:shadow-glow-cyan-sm"
              style={{ border: '1px solid #2A3548' }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-3.5 rounded-sm px-3 py-2 font-mono text-[12px] text-red"
            style={{
              background: 'rgba(247,118,142,.08)',
              border: '1px solid rgba(247,118,142,.3)',
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={m.isPending}
          className="w-full cursor-pointer rounded-md py-[11px] font-mono text-[13px] font-semibold text-cyan transition-all hover:bg-cyan/[0.14] disabled:cursor-default disabled:text-tm"
          style={{
            background: m.isPending ? '#1A1F2E' : 'rgba(0,255,229,.08)',
            border: `1px solid ${m.isPending ? '#2A3548' : 'rgba(0,255,229,.4)'}`,
            boxShadow: m.isPending ? 'none' : '0 0 12px rgba(0,255,229,.12)',
          }}
        >
          {m.isPending ? (
            <span>
              [ <AsciiSpinner /> CREATING... ]
            </span>
          ) : (
            '[ CREATE ACCOUNT ↵ ]'
          )}
        </button>

        {/* Login link */}
        <div className="mt-4 text-center text-[11px] text-td">
          // already have account?{' '}
          <Link to="/auth/login" className="text-blu no-underline hover:underline">
            ❯ sign in
          </Link>
        </div>
      </form>
    </TerminalCard>
  );
}
