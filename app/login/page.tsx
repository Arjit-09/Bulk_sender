"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Check,
  MessageCircle,
  Mail,
  MessageSquare,
} from "lucide-react";
export default function Login() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <Activity size={24} />
          </span>
          pulse<span className="brand-dot">.</span>
          <span className="brand-label">CONNECT</span>
        </div>
        <div>
          <span className="banner-tag">BUSINESS MESSAGING, TOGETHER.</span>
          <h1>
            More than a message.
            <br />A connection.
          </h1>
          <p>
            Bring your WhatsApp, email and SMS campaigns into one thoughtful
            workspace.
          </p>
          <div className="login-channel-icons">
            <MessageCircle />
            <Mail />
            <MessageSquare />
          </div>
          <ul>
            <li>
              <Check size={18} />
              Your brand. Your sender identity.
            </li>
            <li>
              <Check size={18} />
              Separate workspaces for every business.
            </li>
            <li>
              <Check size={18} />
              Made for teams growing in India.
            </li>
          </ul>
        </div>
        <small>pulse connect · Built for meaningful conversations.</small>
      </section>
      <section className="login-form">
        <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
        <h2>
          {register
            ? "Let’s build your next connection."
            : "Good to have you back."}
        </h2>
        <p>
          {register
            ? "Create your organization’s private workspace."
            : "Sign in to keep the conversation going."}
        </p>
        {error && (
          <p className="alert error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={submit}>
          {register && (
            <>
              <label>
                Your name
                <input
                  name="name"
                  required
                  maxLength={200}
                  autoComplete="name"
                />
              </label>
              <label>
                Organization name
                <input
                  name="organization"
                  required
                  maxLength={200}
                  autoComplete="organization"
                />
              </label>
            </>
          )}
          <label>
            Work email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete={register ? "new-password" : "current-password"}
            />
          </label>
          <p className="form-note">
            Use at least 12 characters. For account recovery, contact your
            platform operator.
          </p>
          <button className="button primary submit" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create workspace" : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="login-switch">
          {register ? "Already have a workspace?" : "New to Pulse Connect?"}{" "}
          <button
            className="text-button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register ? "Sign in" : "Create an account"}
          </button>
        </p>
        <small className="muted">
          Sending is enabled after channel verification and subscription
          activation.
        </small>
      </section>
    </main>
  );
}
