"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight, Loader2 } from "lucide-react";
import { ROLE_CONFIG, USER_ROLES } from "@/constants/userRoles";
import { getPasswordStrength } from "@/utils/passwordStrength";
import {
  validateRequired,
  validateEmail,
  validatePassword,
  validateName,
} from "@/utils/formValidation";

function InputField({ label, error, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        {children}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-background py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:ring-indigo-400/30 dark:focus:border-indigo-400";

export default function AuthForm({
  isLogin,
  selectedRole,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  instituteName,
  setInstituteName,
  inviteCode,
  setInviteCode,
  errors,
  setErrors,
  isLoading,
  onSubmit,
  onGoogleLogin,
  onRoleChange,
  onToggleLogin,
  onForgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password || ""),
    [password]
  );

  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateField = (field, value) => {
    let result = true;
    if (field === "fullName") result = validateName(value, "Full Name");
    else if (field === "instituteName") result = validateRequired(value, "Institute Name");
    else if (field === "inviteCode") result = validateRequired(value, "Invite Code");
    else if (field === "email") result = validateEmail(value);
    else if (field === "password")
      result = isLogin ? validateRequired(value, "Password") : validatePassword(value);

    if (result !== true) setErrors((prev) => ({ ...prev, [field]: result }));
    else clearError(field);
  };

  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null;

  return (
    <div className="w-full">
      {/* Role badge */}
      {roleConfig && (
        <div className="mb-5">
          <button
            onClick={onRoleChange}
            className="group inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-all duration-200 hover:border-indigo-500/50 hover:shadow-sm"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${roleConfig.color} shadow-sm`}>
              <roleConfig.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">{roleConfig.title}</p>
              <p className="text-xs text-muted-foreground group-hover:text-indigo-500 transition-colors">
                Click to change role
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card shadow-xl shadow-black/5 dark:shadow-black/20">
        {/* Card header */}
        <div className="border-b border-border px-8 py-6">
          <h2 className="text-xl font-bold tracking-tight text-card-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin
              ? `Sign in to your ${roleConfig?.title.toLowerCase() ?? "account"}`
              : `Get started with your ${roleConfig?.title.toLowerCase() ?? "account"}`}
          </p>
        </div>

        {/* Card body */}
        <div className="px-8 py-6">
          {/* Submit error banner */}
          {errors.submit && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              </span>
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Signup-only fields */}
            {!isLogin && (
              <>
                <InputField label="Full Name" error={errors.fullName} icon={User}>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) validateField("fullName", e.target.value);
                    }}
                    onBlur={(e) => validateField("fullName", e.target.value)}
                    className={`${inputBase} pl-10 pr-4 ${errors.fullName ? "border-destructive focus:ring-destructive/30 focus:border-destructive" : "border-border"}`}
                  />
                </InputField>

                {selectedRole === USER_ROLES.INSTITUTE && (
                  <InputField label="Institute Name" error={errors.instituteName} icon={Building}>
                    <input
                      type="text"
                      name="instituteName"
                      placeholder="Enter your institute name"
                      value={instituteName}
                      onChange={(e) => {
                        setInstituteName(e.target.value);
                        if (errors.instituteName) validateField("instituteName", e.target.value);
                      }}
                      onBlur={(e) => validateField("instituteName", e.target.value)}
                      className={`${inputBase} pl-10 pr-4 ${errors.instituteName ? "border-destructive focus:ring-destructive/30 focus:border-destructive" : "border-border"}`}
                    />
                  </InputField>
                )}
              </>
            )}

            {/* Email */}
            <InputField label="Email address" error={errors.email} icon={Mail}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                maxLength={254}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) validateField("email", e.target.value);
                }}
                onBlur={(e) => validateField("email", e.target.value)}
                className={`${inputBase} pl-10 pr-4 ${errors.email ? "border-destructive focus:ring-destructive/30 focus:border-destructive" : "border-border"}`}
              />
            </InputField>

            {/* Password */}
            <InputField label="Password" error={errors.password} icon={Lock}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                maxLength={254}
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) validateField("password", e.target.value);
                }}
                onBlur={(e) => validateField("password", e.target.value)}
                className={`${inputBase} pl-10 pr-11 ${errors.password ? "border-destructive focus:ring-destructive/30 focus:border-destructive" : "border-border"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </InputField>

            {/* Password strength — signup only */}
            {!isLogin && password && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password strength</span>
                  <span className={`font-semibold ${passwordStrength.textClass}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${passwordStrength.barClass} ${passwordStrength.widthClass}`}
                  />
                </div>
              </div>
            )}

            {/* Forgot password */}
            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  {isLogin ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isLoading ? "Please wait…" : "Continue with Google"}
          </button>
        </div>

        {/* Card footer */}
        <div className="border-t border-border px-8 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={onToggleLogin}
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
