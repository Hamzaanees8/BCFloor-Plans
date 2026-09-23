'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import WhitelabelLogo from '@/components/WhitelabelLogo';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import { useOrganization } from '@/app/context/OrganizationContext';
import { KeyRound, Sparkles } from 'lucide-react';

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';
  const role = searchParams.get('role') || 'agent';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean; confirmation?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { setUserType } = useAppContext();
  const { organization } = useOrganization();

  // Password strength check
  const checkStrength = (pass: string) => {
    const requirements = [
      /.{8,}/,
      /[0-9]/,
      /[a-z]/,
      /[A-Z]/,
      /[^A-Za-z0-9]/,
    ];
    return requirements.filter((regex) => regex.test(pass)).length;
  };

  const strengthScore = useMemo(() => checkStrength(password), [password]);

  const getSegmentColor = (index: number, score: number) => {
    if (score === 0) return 'bg-gray-200';
    if (score <= 2) return index === 0 ? 'bg-red-500' : 'bg-gray-200';
    if (score <= 4) return index < 2 ? 'bg-amber-500' : 'bg-gray-200';
    return 'bg-emerald-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: boolean; password?: boolean; confirmation?: boolean } = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = true;
    }
    if (!password || password.length < 6) {
      newErrors.password = true;
    }
    if (password !== passwordConfirmation) {
      newErrors.confirmation = true;
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      if (newErrors.confirmation) {
        toast.error('Passwords do not match.');
      }
      return;
    }

    setIsLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
      // First attempt /reset-password endpoint
      let response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          token,
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
          role,
        }),
      });

      // Fallback to /set-password if /reset-password failed with 404
      if (response.status === 404) {
        response = await fetch(`${API_URL}/set-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            token,
            email: email.trim(),
            password,
            password_confirmation: passwordConfirmation,
            role,
          }),
        });
      }

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.message || resData.error || 'Failed to set password. Link may have expired.');
      }

      toast.success('Password created successfully! Logging you in...');

      // Check if direct token was returned
      const authToken = resData.token || resData.data?.token;
      const userObj = resData.user || resData.agent || resData.data?.user || resData.data?.agent || resData.data;

      if (authToken) {
        localStorage.setItem('token', authToken);
        localStorage.setItem('userType', 'agent');
        setUserType('agent');
        if (userObj) {
          localStorage.setItem('userInfo', JSON.stringify(userObj));
        }
        router.push('/dashboard/listings');
      } else {
        // Automatically attempt login with new credentials
        try {
          const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              email: email.trim(),
              password,
              role: 'agent',
            }),
          });
          const loginData = await loginRes.json().catch(() => ({}));
          const loginToken = loginData.data?.token || loginData.token;
          if (loginToken) {
            localStorage.setItem('token', loginToken);
            localStorage.setItem('userType', 'agent');
            setUserType('agent');
            const loginUser = loginData.data?.user || loginData.data?.agent || loginData.user || loginData.agent || loginData.data;
            if (loginUser) {
              localStorage.setItem('userInfo', JSON.stringify(loginUser));
            }
            router.push('/dashboard/listings');
            return;
          }
        } catch (loginErr) {
          console.warn('Auto-login after password setup failed, redirecting to login screen:', loginErr);
        }

        // Redirect to agent login
        router.push('/agent/login-user');
      }
    } catch (err: any) {
      console.error('Set password error:', err);
      toast.error(err.message || 'Failed to set password. Please try again or request a new invite.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-between items-center py-10 px-4 bg-gradient-to-b from-gray-50 to-gray-100/50">
      <div className="w-full max-w-[460px] bg-white rounded-2xl p-8 sm:p-10 shadow-lg border border-gray-100 flex flex-col gap-6 my-auto">
        <div className="flex justify-center pb-2">
          <WhitelabelLogo width={180} height={80} />
        </div>

        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Co-Agent Portal Invitation</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Create Your Password
          </h1>
          <p className="text-sm text-gray-600">
            Set a password to access shared listings, download high-res media, and manage billing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className={`text-xs font-semibold uppercase tracking-wider ${
                errors.email ? 'text-red-500' : 'text-gray-700'
              }`}
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="agent@brokerage.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: false }));
              }}
              className={`h-11 rounded-lg border-2 ${
                errors.email ? 'border-red-400 focus:ring-red-200' : 'border-gray-200'
              }`}
              required
            />
            {errors.email && (
              <span className="text-xs text-red-500">Please enter a valid email address.</span>
            )}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className={`text-xs font-semibold uppercase tracking-wider ${
                errors.password ? 'text-red-500' : 'text-gray-700'
              }`}
            >
              New Password
            </label>
            <PasswordInput
              id="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: false }));
              }}
              className={`h-11 rounded-lg border-2 ${
                errors.password ? 'border-red-400' : 'border-gray-200'
              }`}
              required
            />

            {/* Strength Meter */}
            <div className="flex h-1.5 w-full rounded-full overflow-hidden mt-1 gap-1" role="progressbar">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`flex-1 transition-all duration-300 rounded-full ${getSegmentColor(
                    index,
                    strengthScore
                  )}`}
                />
              ))}
            </div>
            {errors.password && (
              <span className="text-xs text-red-500">Password must be at least 6 characters long.</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="passwordConfirmation"
              className={`text-xs font-semibold uppercase tracking-wider ${
                errors.confirmation ? 'text-red-500' : 'text-gray-700'
              }`}
            >
              Confirm Password
            </label>
            <PasswordInput
              id="passwordConfirmation"
              placeholder="Re-enter your password"
              value={passwordConfirmation}
              onChange={(e) => {
                setPasswordConfirmation(e.target.value);
                if (errors.confirmation) setErrors((prev) => ({ ...prev, confirmation: false }));
              }}
              className={`h-11 rounded-lg border-2 ${
                errors.confirmation ? 'border-red-400' : 'border-gray-200'
              }`}
              required
            />
            {errors.confirmation && (
              <span className="text-xs text-red-500">Passwords do not match.</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-2 bg-[#1b365d] hover:bg-[#132744] text-white font-semibold rounded-lg text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Setting up account...</span>
              </div>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Save Password & Access Portal</span>
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center pt-2 border-t border-gray-100">
          <Link
            href="/agent/login-user"
            className="text-sm font-medium text-[#1b365d] hover:underline"
          >
            Already have an account? Sign In
          </Link>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        Powered by {organization?.slug ? organization.slug.toUpperCase() : 'BC Floor Plans'} &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading...
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}
