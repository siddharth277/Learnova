"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Mail,
  Phone,
  ArrowUpRight,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Heart,
  Sparkles,
  ExternalLink,
  Keyboard,
} from "lucide-react";
import { motion } from "framer-motion";
import { CONTACT_INFO } from "../constants/contact";

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FooterLink({ href, children, external = false }) {
  const LinkComponent = external ? "a" : Link;
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <motion.li
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <LinkComponent
        href={href}
        {...externalProps}
        className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-purple-400"
      >
        <span className="relative">
          {children}
          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-300 group-hover:w-full" />
        </span>
        <ArrowUpRight
          size={12}
          className="opacity-0 -translate-y-0.5 translate-x-[-4px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0"
        />
      </LinkComponent>
    </motion.li>
  );
}

function SocialIcon({ href, icon: Icon, label, glowColor = "purple" }) {
  const glowMap = {
    purple: "hover:shadow-purple-500/30 hover:border-purple-500/50 hover:text-purple-400",
    blue: "hover:shadow-blue-500/30 hover:border-blue-500/50 hover:text-blue-400",
    pink: "hover:shadow-pink-500/30 hover:border-pink-500/50 hover:text-pink-400",
    red: "hover:shadow-red-500/30 hover:border-red-500/50 hover:text-red-400",
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      whileHover={{ scale: 1.15, y: -3 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground transition-all duration-300 hover:shadow-lg ${glowMap[glowColor]}`}
    >
      <Icon size={18} />
    </motion.a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [hoveredBrandLetter, setHoveredBrandLetter] = useState(null);

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Productivity", href: "/productivity" },
    { label: "Activities", href: "/activity" },
    { label: "Contact", href: "/contact" },
    { label: "Register", href: "/register" },
    { label: "Contributors", href: "/contributors" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Streaks", href: "/streaks" },
  ];

  const sectionLinks = [
    { label: "Mission", href: "/#mission" },
    { label: "Values", href: "/#values" },
    { label: "Productivity", href: "/#productivity" },
    { label: "Team", href: "/#team" },
    { label: "Impact", href: "/#impact" },
    { label: "Get Started", href: "/#get-started" },
  ];

  const socialLinks = [
    { icon: Github, href: "https://github.com/Premshaw23/Learnova", label: "GitHub", glow: "purple" },
    { icon: Twitter, href: "https://twitter.com/learnova", label: "Twitter", glow: "blue" },
    { icon: Linkedin, href: "https://linkedin.com/company/learnova", label: "LinkedIn", glow: "blue" },
    { icon: Youtube, href: "https://youtube.com/@learnova", label: "YouTube", glow: "red" },
  ];

  const brandLetters = "LEARNOVA".split("");

  return (
    <footer className="relative overflow-hidden border-t border-border bg-background text-foreground transition-colors duration-300">
      {/* Decorative background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-64 w-64 rounded-full bg-purple-500/8 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-blue-500/8 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Main content */}
      <motion.div
        className="relative mx-auto max-w-7xl px-6 pb-10 pt-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <motion.div className="space-y-6 lg:col-span-1" variants={itemVariants}>
            <div className="flex items-center gap-3">
              <motion.span
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-purple-500/30"
                whileHover={{ rotate: 8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <BookOpen className="h-6 w-6 text-purple-400" />
              </motion.span>
              <div>
                <p className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">
                  Learnova
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-purple-400/70">
                  Smart Learning
                </p>
              </div>
            </div>

            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered engagement and smart attendance for modern campuses.
              Build consistent learning outcomes with real-time insights.
            </p>

            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <SocialIcon
                  key={social.label}
                  href={social.href}
                  icon={social.icon}
                  label={social.label}
                  glowColor={social.glow}
                />
              ))}
            </div>
          </motion.div>

          {/* Quick Links column */}
          <motion.div className="space-y-5" variants={itemVariants}>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              <span className="h-px w-4 bg-gradient-to-r from-purple-500 to-transparent" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
              <motion.li
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("learnova:open-shortcuts"))
                  }
                  className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-purple-400"
                >
                  <Keyboard size={13} className="shrink-0" />
                  Keyboard Shortcuts
                </button>
              </motion.li>
            </ul>
          </motion.div>

          {/* Sections column */}
          <motion.div className="space-y-5" variants={itemVariants}>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              <span className="h-px w-4 bg-gradient-to-r from-blue-500 to-transparent" />
              Sections
            </h3>
            <ul className="space-y-3">
              {sectionLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </motion.div>

          {/* Contact column */}
          <motion.div className="space-y-5" variants={itemVariants}>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              <span className="h-px w-4 bg-gradient-to-r from-indigo-500 to-transparent" />
              Contact
            </h3>
            <ul className="space-y-4">
              <li>
                <motion.a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-400"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Mail className="h-4 w-4 shrink-0 text-purple-400/70 transition-colors group-hover:text-purple-400" />
                  <span className="truncate">{CONTACT_INFO.email}</span>
                </motion.a>
              </li>
              <li>
                <motion.a
                  href={`tel:${CONTACT_INFO.phone.replace(/\s+/g, "")}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Phone className="h-4 w-4 shrink-0 text-blue-400/70 transition-colors group-hover:text-blue-400" />
                  <span>{CONTACT_INFO.phone}</span>
                </motion.a>
              </li>
            </ul>

            <motion.div
              className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 p-4"
              whileHover={{ borderColor: "rgba(168,85,247,0.3)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold text-foreground">Stay Updated</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Get the latest updates on features and improvements.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 transition-colors hover:text-purple-300"
              >
                Get in touch
                <ExternalLink size={11} />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          className="mt-14 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            © {currentYear} Learnova. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="flex items-center gap-1.5 text-purple-400/80">
              <Heart size={10} className="fill-purple-400/80" />
              Trusted by educators
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
            <span>Built for modern classrooms</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Large watermark branding */}
      <div className="relative overflow-hidden border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-center justify-center select-none" aria-hidden="true">
            {brandLetters.map((letter, i) => (
              <motion.span
                key={i}
                className="cursor-default text-6xl font-black tracking-tight sm:text-7xl md:text-8xl lg:text-9xl"
                style={{
                  WebkitTextStroke: "1px",
                  WebkitTextStrokeColor:
                    hoveredBrandLetter === i
                      ? "rgba(168,85,247,0.5)"
                      : "rgba(128,128,128,0.12)",
                  color: "transparent",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={() => setHoveredBrandLetter(i)}
                onMouseLeave={() => setHoveredBrandLetter(null)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
