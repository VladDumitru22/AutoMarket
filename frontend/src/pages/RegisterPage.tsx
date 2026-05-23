import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { Check, X } from 'lucide-react'

interface PasswordRule {
  label: string
  test: (p: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: p => /[A-Z]/.test(p) },
  { label: 'One digit (0-9)', test: p => /\d/.test(p) },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const passwordValid = PASSWORD_RULES.every(r => r.test(form.password))

  const submit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-8">
      <div className="bg-white p-8 rounded-xl border border-slate-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create an account</h1>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
              <input
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
              <input
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onFocus={() => setPasswordFocused(true)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                form.password && !passwordValid ? 'border-red-300' : 'border-slate-300'
              }`}
            />

            {(passwordFocused || form.password) && (
              <div className="mt-2 space-y-1.5 p-3 bg-slate-50 rounded-lg">
                {PASSWORD_RULES.map(rule => {
                  const ok = rule.test(form.password)
                  return (
                    <div key={rule.label} className="flex items-center gap-2 text-xs">
                      {ok ? (
                        <Check size={13} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <X size={13} className="text-slate-300 flex-shrink-0" />
                      )}
                      <span className={ok ? 'text-green-700' : 'text-slate-500'}>{rule.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <p className="text-xs text-slate-400">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-blue-600 hover:underline">Terms &amp; Conditions</Link>.
          </p>

          <button
            type="submit"
            disabled={loading || !passwordValid}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
