import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, LockKeyhole, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button, Card } from '@restaurantos/ui';
import { useAuthStore } from '../store/use-auth-store';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { accessToken, login, loading } = useAuthStore();
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: 'admin', password: '' },
  });

  useEffect(() => {
    setFocus('password');
  }, [setFocus]);

  if (accessToken) return <Navigate to="/" replace />;

  const onSubmit = async (values: LoginForm) => {
    setError(undefined);
    try {
      await login(values.username, values.password);
      navigate('/', { replace: true });
    } catch {
      setError('Login failed. Check username, password, and API connection.');
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-[1.05fr_0.95fr] bg-white">
      <section className="flex flex-col justify-between bg-[#085655] p-10 text-white">
        <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.28em]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1ba09c] text-base">
            RO
          </span>
          RestaurantOS
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#aee4e1]">Desktop POS</p>
          <h1 className="mt-4 max-w-xl text-6xl font-black leading-[1.02]">
            Premium cashier workflow for busy restaurants.
          </h1>
          <p className="mt-5 max-w-lg text-lg font-semibold text-[#d7f4f2]">
            Secure sign-in protects discounts, refunds, stock changes, reports, and settings.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm font-bold text-[#d7f4f2]">
          <span>Roles</span>
          <span>Permissions</span>
          <span>Audit logs</span>
        </div>
      </section>

      <section className="flex items-center justify-center p-10">
        <Card className="w-full max-w-md p-7">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1ba09c]">Welcome back</p>
            <h2 className="mt-2 text-4xl font-black text-[#0d1717]">Sign in</h2>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="block">
              <span className="text-sm font-black text-[#4d5d5c]">Username</span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl bg-[#f4fbfa] px-4">
                <UserRound size={18} className="text-[#1ba09c]" />
                <input
                  className="h-full flex-1 bg-transparent font-semibold outline-none"
                  autoComplete="username"
                  {...register('username')}
                />
              </div>
              {errors.username ? (
                <span className="mt-1 block text-xs font-bold text-red-600">{errors.username.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#4d5d5c]">Password</span>
              <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl bg-[#f4fbfa] px-4">
                <LockKeyhole size={18} className="text-[#1ba09c]" />
                <input
                  className="h-full flex-1 bg-transparent font-semibold outline-none"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                />
              </div>
              {errors.password ? (
                <span className="mt-1 block text-xs font-bold text-red-600">{errors.password.message}</span>
              ) : null}
            </label>

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
                <AlertCircle size={18} />
                {error}
              </div>
            ) : null}

            <Button className="h-14 w-full text-base" disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-5 rounded-2xl bg-[#f4fbfa] p-4 text-sm font-semibold text-[#657574]">
            Development seed: username <strong>admin</strong>, password <strong>Admin@12345</strong>.
          </div>
        </Card>
      </section>
    </main>
  );
}
