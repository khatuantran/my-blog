import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { TerminalCard } from '@/components/auth/TerminalCard';
import { AsciiSpinner } from '@/components/feed/AsciiSpinner';
import { useLogin } from '@/hooks/mutations/use-login';
import { ApiError } from '@/services/api/client';

const BUILD_SHA = import.meta.env.VITE_BUILD_SHA?.slice(0, 6) || 'a1b2c3';

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const m = useLogin();

  function fail(msg: string) {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !password) {
      fail('[ERROR] all fields required');
      return;
    }
    setError('');
    m.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => {
          const next = params.get('next');
          navigate(next ? decodeURIComponent(next) : '/', { replace: true });
        },
        onError: (err) => {
          const msg =
            err instanceof ApiError && err.status === 401
              ? '[ERROR] invalid credentials'
              : `[ERROR] ${err.message}`;
          fail(msg);
        },
      },
    );
  }

  return (
    <TerminalCard
      path="~/auth/login"
      shaking={shaking}
      footer={
        <div className="mt-3.5 flex justify-between font-mono text-mono-sm text-td">
          <span>
            <span className="animate-pulse-status text-grn">●</span> connected to server
          </span>
          <span>build: {BUILD_SHA}</span>
        </div>
      }
    >
      <div className="mb-[18px] text-mono-sm text-tm">// authenticate to continue</div>

      <form onSubmit={onSubmit} aria-label="Login form">
        {/* Username */}
        <div className="mb-3.5">
          <div className="mb-1.5 text-mono-sm text-tm">username</div>
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
              placeholder="enter username..."
              autoComplete="username"
              autoFocus
              aria-label="Username"
              className="w-full rounded-md bg-[#070A14] py-2.5 pl-8 pr-3 font-mono text-mono-lg text-tp outline-none transition-all duration-150 placeholder:text-tm focus:border-cyan focus:shadow-glow-cyan-sm"
              style={{ border: '1px solid #2A3548' }}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-5">
          <div className="mb-1.5 text-mono-sm text-tm">password</div>
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
              placeholder="enter password..."
              autoComplete="current-password"
              aria-label="Password"
              className="w-full rounded-md bg-[#070A14] py-2.5 pl-8 pr-10 font-mono text-mono-lg text-tp outline-none transition-all duration-150 placeholder:text-tm focus:border-cyan focus:shadow-glow-cyan-sm"
              style={{ border: '1px solid #2A3548' }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 border-none bg-transparent text-mono-md text-tm"
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-3.5 rounded-sm px-3 py-2 font-mono text-mono text-red"
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
          className="w-full cursor-pointer rounded-md py-[11px] font-mono text-mono-md font-semibold text-cyan transition-all hover:bg-cyan/[0.14] disabled:cursor-default disabled:text-tm"
          style={{
            background: m.isPending ? '#1A1F2E' : 'rgba(0,255,229,.08)',
            border: `1px solid ${m.isPending ? '#2A3548' : 'rgba(0,255,229,.4)'}`,
            boxShadow: m.isPending ? 'none' : '0 0 12px rgba(0,255,229,.12)',
          }}
        >
          {m.isPending ? (
            <span>
              [ <AsciiSpinner /> AUTHENTICATING... ]
            </span>
          ) : (
            '[ AUTHENTICATE ↵ ]'
          )}
        </button>

        {/* Divider */}
        <div className="my-[18px] flex items-center gap-2.5">
          <div className="h-px flex-1 bg-b1" />
          <span className="text-mono-sm text-td">── or ──</span>
          <div className="h-px flex-1 bg-b1" />
        </div>

        {/* Anonymous */}
        <Link
          to="/"
          className="block rounded-md py-[9px] text-center font-mono text-[13px] text-pur no-underline transition-all hover:bg-pur/[0.08]"
          style={{
            background: 'rgba(187,154,247,.05)',
            border: '1px solid rgba(187,154,247,.2)',
          }}
          data-testid="anon-link"
        >
          Continue as anonymous →
        </Link>

        {/* Register link */}
        <div className="mt-4 text-center text-mono-sm text-td">
          // no account?{' '}
          <Link
            to="/auth/register"
            data-testid="register-link"
            className="text-blu no-underline hover:underline"
          >
            ❯ register here
          </Link>
        </div>
      </form>
    </TerminalCard>
  );
}
