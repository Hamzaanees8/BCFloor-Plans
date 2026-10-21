'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { login } from '@/app/agent/login-user/login';
import { useAppContext } from '@/app/context/AppContext';

interface OrgInfo {
  id: number;
  org_id?: number;
  uuid: string;
  name: string;
  slug: string;
  from_name?: string | null;
  from_email?: string | null;
  branding?: {
    primary_color?: string;
    secondary_color?: string;
    logo?: string | null;
    white_label_styles?: any;
  };
}

const RESERVED_SLUGS = new Set([
  'login',
  'login-user',
  'signup',
  'forget-password',
  'login-first-time',
  'new-password',
  'password-success',
  'set-password',
  'about',
  'book-now',
  'tours',
  'tour',
  'dashboard',
  'vendor',
  'admin',
  'api',
]);

export default function OrgAgentLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const { setUserType } = useAppContext();

  const [orgData, setOrgData] = useState<OrgInfo | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);
  const [orgNotFound, setOrgNotFound] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slug || RESERVED_SLUGS.has(slug.toLowerCase())) {
      setIsLoadingOrg(false);
      setOrgNotFound(true);
      return;
    }

    let isCancelled = false;

    const fetchOrg = async () => {
      try {
        setIsLoadingOrg(true);
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com').replace(/\/api\/?$/, '');
        const res = await fetch(`${baseUrl}/api/public/organizations/${encodeURIComponent(slug)}`, { cache: 'no-store' });

        if (isCancelled) return;

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setOrgData(json.data);
            setOrgNotFound(false);
          } else {
            setOrgNotFound(true);
          }
        } else {
          setOrgNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load organization for login:', err);
        if (!isCancelled) {
          setOrgNotFound(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingOrg(false);
        }
      }
    };

    fetchOrg();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

    if (!email.trim() || !isValidEmail(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!orgData) {
      toast.error('Organization information is missing. Please refresh and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
        role: 'agent',
        organization_id: orgData.id || orgData.org_id,
      });

      toast.success('Login successful!');
      localStorage.setItem('token', response.data.token);

      const userObj = (response.data as any).user || (response.data as any).agent || response.data;
      const agentType = userObj?.agent_type;
      const responseType = (response.data as any).type;
      const resolvedType = (agentType === 'agent_admin' || agentType === 'assistant' || responseType === 'agent_admin')
        ? 'agent_admin'
        : (responseType || 'agent');

      setUserType(resolvedType);
      localStorage.setItem('userType', resolvedType);
      localStorage.setItem('userInfo', JSON.stringify(userObj));

      router.push('/dashboard/calendar');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Login failed. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor =
    orgData?.branding?.white_label_styles?.agent?.pageTabColor ||
    orgData?.branding?.primary_color ||
    '#6BAE41';

  if (isLoadingOrg) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-[#6BAE41] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading organization details...</p>
      </div>
    );
  }

  if (orgNotFound || !orgData) {
    return (
      <div className="w-full flex justify-center items-start pt-[100px] px-4">
        <div className="w-full max-w-[420px] bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center text-center gap-4">
          <div className="relative w-[160px] h-[80px]">
            <Image
              src="/tojuco.png"
              alt="logo"
              fill
              sizes="160px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Organization Not Found</h2>
          <p className="text-sm text-gray-600">
            We could not find an active organization with the slug &quot;{slug}&quot;. Please verify the URL.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#6BAE41] rounded-md hover:opacity-90 transition-opacity"
          >
            Go to Platform Login
          </Link>
        </div>
      </div>
    );
  }

  const orgDisplayName = orgData.name || orgData.from_name || slug.toUpperCase();
  const logoUrl = orgData.branding?.logo || '/tojuco.png';

  return (
    <div className="w-full flex justify-center items-start pt-[60px] pb-[80px] px-[20px] md:px-0">
      <form onSubmit={handleLogin} className="w-full max-w-[420px] flex flex-col gap-[22px]">
        {/* Organization Logo */}
        <div className="relative mx-auto w-[180px] h-[90px]">
          <Image
            src={logoUrl}
            alt={orgDisplayName}
            fill
            sizes="180px"
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        <div className="text-center flex flex-col gap-1">
          <h1 className="text-[22px] font-[600] text-[#222222]">
            Agent Portal Login
          </h1>
          <p className="text-[14px] text-[#666666]">
            Welcome to <span className="font-[600]" style={{ color: primaryColor }}>{orgDisplayName}</span>
          </p>
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[13px] font-[500] ${errors.email ? 'text-red-500' : 'text-[#333]'}`} htmlFor="email">
            Email Address *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="agent@example.com"
            className={`h-[42px] border-[2px] rounded-[6px] ${errors.email ? 'border-red-500' : 'border-[#BBBBBB]'}`}
            value={email}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().replace(/[^a-z0-9@._\-+]/g, '');
              setEmail(val);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />
          {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[13px] font-[500] ${errors.password ? 'text-red-500' : 'text-[#333]'}`} htmlFor="password">
            Password *
          </label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="••••••••"
            className={`h-[42px] border-[2px] rounded-[6px] ${errors.password ? 'border-red-500' : 'border-[#BBBBBB]'}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />
          {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: primaryColor }}
          className="w-full flex justify-center items-center hover:opacity-90 transition-all duration-200 rounded-[6px] h-[44px] font-[600] text-[18px] text-white mt-1"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" opacity="0.3" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
              </svg>
              <span>Logging in...</span>
            </div>
          ) : (
            'Log In'
          )}
        </Button>

        {/* Forgot Password */}
        <div className="flex justify-center">
          <Link
            href={`/${slug}/forget-password`}
            style={{ color: primaryColor, borderColor: primaryColor }}
            className="w-fit text-[15px] font-[400] text-center border-b-[1px] leading-[18px] hover:opacity-85 transition-opacity"
          >
            Forgot Password
          </Link>
        </div>

        {/* Switch to signup */}
        <div className="flex justify-center items-center gap-1.5 text-[14px]">
          <span className="text-[#666]">Don&apos;t have an account?</span>
          <Link
            href={`/${slug}/signup`}
            style={{ color: primaryColor }}
            className="font-[600] hover:underline"
          >
            Sign up
          </Link>
        </div>

        <p className="text-[10px] text-[#666666] font-[400] mx-auto mt-2">
          Powered by Tojuco Software {new Date().getFullYear()}
        </p>
      </form>
    </div>
  );
}
