import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { Check, X, Car } from 'lucide-react'

interface PasswordRule {
  label: string
  test: (p: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: p => /[A-Z]/.test(p) },
  { label: 'One digit (0-9)', test: p => /\d/.test(p) },
]

const inputCls = "w-full bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 dark:focus:ring-orange-400/40 transition-all"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const passwordValid = PASSWORD_RULES.every(r => r.test(form.password))

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!passwordValid) return
    setLoading(true)
    setError('')
    try {
      await register(form)
      navigate('/login')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg.replace('Value error, ', '')).join('. '))
      } else {
        setError(detail ?? 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 shadow-xl shadow-orange-500/30 mb-4">
            <Car size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create an account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Join the AutoMarket community</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 p-8">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First name</label>
                <input
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  className={inputCls}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last name</label>
                <input
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  className={inputCls}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onFocus={() => setPasswordFocused(true)}
                className={`${inputCls} ${form.password && !passwordValid ? 'border-red-300 dark:border-red-500/40 focus:ring-red-400/40' : ''}`}
              />

              {(passwordFocused || form.password) && (
                <div className="mt-2 space-y-1.5 p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-white/[0.06]">
                  {PASSWORD_RULES.map(rule => {
                    const ok = rule.test(form.password)
                    return (
                      <div key={rule.label} className="flex items-center gap-2 text-xs">
                        {ok ? (
                          <Check size={13} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <X size={13} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                        )}
                        <span className={ok ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-2.5 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500">
              By creating an account you agree to our{' '}
              <Link to="/terms" className="text-orange-500 dark:text-orange-400 hover:underline">
                Terms &amp; Conditions
              </Link>.
            </p>

            <button
              type="submit"
              disabled={loading || !passwordValid}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white py-2.5 rounded-xl font-medium shadow-lg shadow-orange-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-5 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 dark:text-orange-400 hover:text-orange-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
