"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Plus,
  Radio,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import SupportInbox from "./SupportInbox";
import PricingManager from "./PricingManager";
import { PLANS } from "@/lib/platform/policy";
type Contact = {
  id: string;
  name: string;
  destination: string;
  channel: string;
  consentSource: string;
  unsubscribedAt: string | null;
};
type Template = {
  id: string;
  name: string;
  channel: string;
  content: string;
  subject: string;
  providerTemplateId: string;
  approval: string;
};
type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  createdAt: string;
  scheduledAt: string | null;
  _count: { deliveries: number };
};
type Connection = {
  id: string;
  channel: string;
  sender: string;
  status: string;
  entityId: string;
};
type Member = {
  id: string;
  role: string;
  account: { id: string; name: string; email: string };
};
type Audit = { id: string; action: string; detail: string; createdAt: string };
type Workspace = {
  id: string;
  name: string;
  plan: keyof typeof PLANS;
  subscriptionStatus: string;
  suspended: boolean;
};
type Overview = {
  account: { id: string; name: string; email: string; superAdmin: boolean };
  workspace: Workspace;
  role: string;
  contacts: Contact[];
  templates: Template[];
  campaigns: Campaign[];
  connections: Connection[];
  members: Member[];
  audit: Audit[];
  deliveries: { status: string; channel: string; _count: number }[];
  plans: Record<string,{name:string;price:number;limit:number;seats:number;versionId?:string}>;
  currentPlan: {name:string;price:number;limit:number;seats:number};
  usage: { reserved: number } | null;
};
type Delivery = {
  id: string;
  channel: string;
  destination: string;
  content: string;
  status: string;
  error: string;
  createdAt: string;
  campaign: { name: string };
};
const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/contacts", label: "Audience", icon: Users },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/inbox", label: "Support inbox", icon: MessageSquare },
  { href: "/reports", label: "Analytics", icon: BarChart3 },
];
const manage = [
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/team", label: "Team & access", icon: Building2 },
  { href: "/subscribe", label: "Billing & plans", icon: CreditCard },
  { href: "/settings", label: "Workspace", icon: Settings },
];
const channelName = (value: string) =>
  value === "sms" ? "SMS" : value === "whatsapp" ? "WhatsApp" : "Email";
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
const number = (value: number) => value.toLocaleString("en-IN");
function ChannelIcon({ channel }: { channel: string }) {
  return channel === "email" ? (
    <Mail size={18} />
  ) : channel === "sms" ? (
    <MessageSquare size={18} />
  ) : (
    <MessageCircle size={18} />
  );
}
function Badge({ children }: { children: ReactNode }) {
  return (
    <span className={`badge badge-${String(children).toLowerCase()}`}>
      {children}
    </span>
  );
}
function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Send size={24} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
async function api(path: string, body?: unknown) {
  const response = await fetch(
    `/api/platform/${path}`,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" },
  );
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(result.error || "Request failed."), {
      status: response.status,
    });
  return result;
}
export default function Platform() {
  const path = usePathname();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState("whatsapp");
  const [messages, setMessages] = useState<Delivery[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    const dialog = dialogRef.current;
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,textarea,a[href]",
        ) || [],
      );
    focusables()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal("");
      if (event.key !== "Tab") return;
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [modal]);
  const load = useCallback(async () => {
    try {
      const result = await api("overview");
      setData(result);
      setError("");
      
      if (path === "/admin") setWorkspaces(await api("admin"));
    } catch (e) {
      const err = e as Error & { status: number };
      if (err.status === 401) router.replace("/login");
      else setError(err.message);
    }
  }, [path, router]);
  useEffect(() => {
    void load();
  }, [load]);
  const act = async (endpoint: string, body: unknown, success: string) => {
    setBusy(true);
    setError("");
    try {
      const result = await api(endpoint, body);
      setNotice(success);
      setModal("");
      await load();
      return result;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.scheduledAt)
      values.scheduledAt = new Date(String(values.scheduledAt)).toISOString();
    await act(modal, values, "Saved successfully.");
  };
  const allNav = [...nav, ...manage];
  const title =
    allNav.find((n) => n.href === path)?.label || "Platform administration";
  const owner = data?.role === "owner" || data?.role === "admin";
  const total = data?.deliveries.reduce((sum, d) => sum + d._count, 0) || 0;
  const delivered =
    data?.deliveries
      .filter((d) => ["delivered", "read"].includes(d.status))
      .reduce((sum, d) => sum + d._count, 0) || 0;
  const campaigns = (data?.campaigns || []).filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" || c.channel === filter),
  );
  const open = (name: string) => {
    setError("");
    setSelectedChannel("whatsapp");
    setModal(name);
  };
  const campaignTable = (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Channel</th>
            <th>Status</th>
            <th>Recipients</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td>
                <div className="table-name">
                  <span className={`channel-mark ${c.channel}`}>
                    <ChannelIcon channel={c.channel} />
                  </span>
                  <span>
                    <strong>{c.name}</strong>
                    <small>
                      {c.scheduledAt
                        ? `Scheduled ${new Date(c.scheduledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
                        : "One-time campaign"}
                    </small>
                  </span>
                </div>
              </td>
              <td>{channelName(c.channel)}</td>
              <td>
                <Badge>{c.status}</Badge>
              </td>
              <td>{number(c._count.deliveries)}</td>
              <td>{date(c.createdAt)}</td>
              <td>
                {c.status === "draft" && owner && (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => {
                      setModal(`launch:${c.id}`);
                    }}
                  >
                    Review & launch <ArrowRight size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!campaigns.length && (
        <Empty title="Your next conversation starts here">
          Create a campaign with an approved template and an opted-in audience.
        </Empty>
      )}
    </div>
  );
  return (
    <div className="platform">
      {mobile && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Activity size={23} />
          </span>
          pulse<span className="brand-dot">.</span>
          <span className="brand-label">CONNECT</span>
        </Link>
        <div className="workspace-chip">
          <span className="workspace-avatar">
            {data?.workspace.name.slice(0, 1) || "P"}
          </span>
          <span>
            <strong>{data?.workspace.name || "Your workspace"}</strong>
            <small>
              {data
                ? `${data.currentPlan.name} workspace`
                : "Business messaging"}
            </small>
          </span>
          <ChevronDown size={14} />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav>
          {nav.map((n) => (
            <Link
              onClick={() => setMobile(false)}
              key={n.href}
              href={n.href}
              className={path === n.href ? "active" : ""}
            >
              <n.icon size={18} />
              {n.label}
              {n.href === "/campaigns" && !!data?.campaigns.length && (
                <span className="nav-count">{data.campaigns.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <p className="nav-caption">MANAGE</p>
        <nav>
          {manage.map((n) => (
            <Link
              onClick={() => setMobile(false)}
              key={n.href}
              href={n.href}
              className={path === n.href ? "active" : ""}
            >
              <n.icon size={18} />
              {n.label}
            </Link>
          ))}
          {data?.account.superAdmin && (
            <Link href="/admin" className={path === "/admin" ? "active" : ""}>
              <ShieldCheck size={18} />
              Super admin
            </Link>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="allowance">
            <div>
              <span>Monthly dispatch allowance</span>
              <strong>
                {number(data?.usage?.reserved || 0)} /{" "}
                {data ? number(data.currentPlan.limit) : "—"}
              </strong>
            </div>
            <progress
              value={data?.usage?.reserved || 0}
              max={data ? data.currentPlan.limit : 100}
            />
            <Link href="/subscribe">
              Explore plans <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="profile">
            <span className="avatar">
              {data?.account.name.slice(0, 2).toUpperCase() || "PC"}
            </span>
            <span>
              <strong>{data?.account.name || "Welcome"}</strong>
              <small>{data?.role || "Sign in to your workspace"}</small>
            </span>
            <button
              title="Sign out"
              aria-label="Sign out"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{title}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="india-label">🇮🇳 India · INR</span>
            <Link href="/settings">
              <CircleHelp size={18} />
              <span>Setup guide</span>
            </Link>
          </div>
        </header>
        <main className="main-content">
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="alert success" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR BUSINESS, BETTER CONNECTED</p>
              <h1>
                {path === "/" ? "A little closer to your customers." : title}
              </h1>
              <p>
                {path === "/"
                  ? "One workspace for every message. Make the next one count."
                  : path === "/campaigns"
                    ? "Create, schedule and track conversations across every channel."
                    : path === "/channels"
                      ? "Connect your business identity to the channels your customers use."
                      : path === "/subscribe"
                        ? "Predictable platform pricing. Your provider costs stay separate."
                        : "A clear view of your customer communications."}
              </p>
            </div>
            {["/", "/campaigns"].includes(path) && (
              <button
                className="button primary"
                onClick={() => open("campaigns")}
              >
                <Plus size={17} />
                Create campaign
              </button>
            )}
            {path === "/contacts" && (
              <button
                className="button primary"
                onClick={() => open("contacts")}
              >
                <Plus size={17} />
                Add contact
              </button>
            )}
            {path === "/templates" && (
              <button
                className="button primary"
                onClick={() => open("templates")}
              >
                <Plus size={17} />
                Create template
              </button>
            )}
            {path === "/team" && owner && (
              <button
                className="button primary"
                onClick={() => open("members")}
              >
                <Plus size={17} />
                Add teammate
              </button>
            )}
          </div>
          {!data ? (
            <div className="panel">
              <Empty
                title={
                  error ? "Workspace unavailable" : "Loading your workspace…"
                }
              >
                {error
                  ? "Connect PostgreSQL, apply migrations and sign in to continue."
                  : "Getting your campaigns, channels and audience."}
              </Empty>
              <button className="button" onClick={() => void load()}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {path === "/" && (
                <>
                  <section className="welcome-banner">
                    <div>
                      <span className="banner-tag">
                        <span /> LET’S GET YOU CONNECTED
                      </span>
                      <h2>
                        Three channels.
                        <br />
                        One meaningful connection.
                      </h2>
                      <p>
                        Reach your audience on WhatsApp, email and SMS.
                        <br />
                        Start with the channel that works for your business.
                      </p>
                      <Link className="button banner-button" href="/channels">
                        Set up your channels <ArrowRight size={16} />
                      </Link>
                    </div>
                    <div className="channel-orbit" aria-hidden="true">
                      <div className="orbit-ring" />
                      <span className="orbit-icon orbit-wa">
                        <MessageCircle size={35} />
                      </span>
                      <span className="orbit-icon orbit-email">
                        <Mail size={31} />
                      </span>
                      <span className="orbit-icon orbit-sms">
                        <MessageSquare size={27} />
                      </span>
                      <div className="orbit-center">
                        <Activity size={37} />
                      </div>
                      <span className="orbit-caption">
                        <span /> Made for your next conversation
                      </span>
                    </div>
                  </section>
                  <div className="stats-grid">
                    {[
                      {
                        label: "Messages queued",
                        value: number(total),
                        icon: Send,
                        note: "Across all channels",
                      },
                      {
                        label: "Confirmed delivery",
                        value: total
                          ? `${Math.round((delivered / total) * 100)}%`
                          : "—",
                        icon: Check,
                        note: "Based on provider receipts",
                      },
                      {
                        label: "Audience records",
                        value: number(data.contacts.length),
                        icon: Users,
                        note: "Up to 500 recent contacts",
                      },
                      {
                        label: "Campaigns",
                        value: number(data.campaigns.length),
                        icon: Megaphone,
                        note: "Up to 100 recent campaigns",
                      },
                    ].map((s) => (
                      <div className="stat-card" key={s.label}>
                        <div>
                          <span>{s.label}</span>
                          <s.icon size={17} />
                        </div>
                        <strong>{s.value}</strong>
                        <small>{s.note}</small>
                      </div>
                    ))}
                  </div>
                  <div className="section-heading">
                    <h2>
                      Your channels <span>03</span>
                    </h2>
                    <Link href="/channels">
                      Manage channels <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="channel-grid">
                    {["whatsapp", "email", "sms"].map((c) => {
                      const connection = data.connections.find(
                        (v) => v.channel === c,
                      );
                      return (
                        <Link className="channel-card" href="/channels" key={c}>
                          <div className={`channel-mark ${c}`}>
                            <ChannelIcon channel={c} />
                          </div>
                          <div>
                            <h3>{channelName(c)}</h3>
                            <p>
                              {c === "sms"
                                ? "Registered sender identity"
                                : c === "email"
                                  ? "Your brand, in their inbox"
                                  : "Conversations that convert"}
                            </p>
                            <Badge>
                              {connection?.status || "not connected"}
                            </Badge>
                          </div>
                          <ArrowUpRight size={17} />
                        </Link>
                      );
                    })}
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Recent campaigns</h2>
                        <p>Every conversation, all in one place.</p>
                      </div>
                      <Link href="/campaigns">
                        View all <ArrowRight size={14} />
                      </Link>
                    </div>
                    {campaignTable}
                  </section>
                  <div className="bottom-note">
                    <ShieldCheck size={16} /> Built around consent. Your
                    audience stays in control of their messages.
                  </div>
                </>
              )}
              {path === "/campaigns" && (
                <section className="panel">
                  <div className="toolbar">
                    <div className="tabs">
                      {["all", "whatsapp", "email", "sms"].map((c) => (
                        <button
                          className={filter === c ? "selected" : ""}
                          key={c}
                          onClick={() => setFilter(c)}
                        >
                          {c === "all" ? "All campaigns" : channelName(c)}
                        </button>
                      ))}
                    </div>
                    <label className="search">
                      <Search size={16} />
                      <input
                        placeholder="Search campaigns"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  {campaignTable}
                </section>
              )}
              {path === "/contacts" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your opted-in audience</h2>
                      <p>
                        Consent is recorded separately for each channel.
                        Unsubscribed contacts are excluded at dispatch.
                      </p>
                    </div>
                    <label className="search">
                      <Search size={16} />
                      <input
                        placeholder="Find a contact"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Contact</th>
                          <th>Destination</th>
                          <th>Channel</th>
                          <th>Consent source</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.contacts
                          .filter((c) =>
                            `${c.name} ${c.destination}`
                              .toLowerCase()
                              .includes(query.toLowerCase()),
                          )
                          .map((c) => (
                            <tr key={c.id}>
                              <td>
                                <strong>{c.name}</strong>
                              </td>
                              <td>{c.destination}</td>
                              <td>{channelName(c.channel)}</td>
                              <td>{c.consentSource}</td>
                              <td>
                                <Badge>
                                  {c.unsubscribedAt
                                    ? "unsubscribed"
                                    : "opted in"}
                                </Badge>
                              </td>
                              <td>
                                {!c.unsubscribedAt && (
                                  <button
                                    className="text-button"
                                    disabled={busy}
                                    onClick={() =>
                                      void act(
                                        "suppress",
                                        { id: c.id },
                                        "Contact unsubscribed.",
                                      )
                                    }
                                  >
                                    Unsubscribe
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!data.contacts.length && (
                      <Empty title="Build an audience that wants to hear from you">
                        Add your first contact with a record of how they opted
                        in.
                      </Empty>
                    )}
                  </div>
                </section>
              )}
              {path === "/templates" && (
                <div className="template-grid">
                  {data.templates.map((t) => (
                    <section className="panel template-card" key={t.id}>
                      <div className="section-heading">
                        <span className={`channel-mark ${t.channel}`}>
                          <ChannelIcon channel={t.channel} />
                        </span>
                        <Badge>{t.approval}</Badge>
                      </div>
                      <h3>{t.name}</h3>
                      <p className="template-body">{t.content}</p>
                      <footer>
                        <span>{channelName(t.channel)}</span>
                        <small>
                          {t.providerTemplateId || "No provider reference"}
                        </small>
                      </footer>
                      <small className="muted">ID: {t.id}</small>
                    </section>
                  ))}
                  {!data.templates.length && (
                    <section className="panel full-width">
                      <Empty title="Good messages start with a template">
                        Create reusable email content or register the exact
                        approved WhatsApp / DLT template. Fixed-content
                        templates are supported in this release.
                      </Empty>
                    </section>
                  )}
                </div>
              )}
              {path === "/channels" && (
                <>
                  <div className="channel-setup-grid">
                    {["whatsapp", "email", "sms"].map((c) => {
                      const connection = data.connections.find(
                        (v) => v.channel === c,
                      );
                      return (
                        <section className="panel setup-card" key={c}>
                          <div className="section-heading">
                            <span className={`channel-mark large ${c}`}>
                              <ChannelIcon channel={c} />
                            </span>
                            <Badge>
                              {connection?.status || "not connected"}
                            </Badge>
                          </div>
                          <h2>{channelName(c)}</h2>
                          <p>
                            {c === "whatsapp"
                              ? "Send approved marketing templates through Meta’s official Cloud API."
                              : c === "email"
                                ? "Send branded campaigns through Resend using your verified domain."
                                : "Show a registered brand header through an India domestic SMS route."}
                          </p>
                          <ul>
                            {(c === "whatsapp"
                              ? [
                                  "Meta business account & phone number ID",
                                  "Approved display name and message templates",
                                  "Explicit opt-in and easy opt-out",
                                ]
                              : c === "email"
                                ? [
                                    "Verified sending domain",
                                    "SPF, DKIM and DMARC configuration",
                                    "Consent records and unsubscribe links",
                                  ]
                                : [
                                    "DLT principal entity registration",
                                    "Registered header and content templates",
                                    "MSG91 template mapped to DLT records",
                                  ]
                            ).map((x) => (
                              <li key={x}>
                                <Check size={15} />
                                {x}
                              </li>
                            ))}
                          </ul>
                          {connection && (
                            <div className="connection-detail">
                              <small>Sender identity</small>
                              <strong>{connection.sender}</strong>
                            </div>
                          )}
                          {owner && (
                            <button
                              className="button"
                              onClick={() => {
                                setModal("connections");
                                setSelectedChannel(c);
                              }}
                            >
                              {connection
                                ? "Update connection"
                                : "Connect channel"}
                              <ArrowRight size={15} />
                            </button>
                          )}
                        </section>
                      );
                    })}
                  </div>
                  <div className="info-panel">
                    <ShieldCheck size={22} />
                    <div>
                      <h3>
                        Your organization name belongs to your sender identity.
                      </h3>
                      <p>
                        Saving a contact or renaming a template does not change
                        the sender customers see. SMS uses a registered header;
                        WhatsApp uses your approved business display name; email
                        uses your sender name and verified domain. MSG91 sends
                        the approved template configured in your provider
                        account.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {path === "/subscribe" && (
                <>
                  <section className="billing-summary panel">
                    <div>
                      <span className="eyebrow">CURRENT WORKSPACE</span>
                      <h2>
                        {data.currentPlan.name}{" "}
                        <Badge>{data.workspace.subscriptionStatus}</Badge>
                      </h2>
                      <p>
                        {number(data.usage?.reserved || 0)} of{" "}
                        {number(data.currentPlan.limit)} dispatches
                        reserved this calendar month (UTC).
                      </p>
                    </div>
                    <span className="currency-chip">₹ INR · Monthly</span>
                  </section>
                  <div className="pricing-grid">
                    {Object.entries(data.plans).map(([key, p]) => (
                      <section
                        className={`panel price-card ${key === "growth" ? "featured" : ""}`}
                        key={key}
                      >
                        {key === "growth" && (
                          <span className="recommended">ROOM TO GROW</span>
                        )}
                        <h2>{p.name}</h2>
                        <p>
                          {key === "starter"
                            ? "For your first customer conversations."
                            : key === "growth"
                              ? "For teams building momentum."
                              : "For businesses reaching further."}
                        </p>
                        <div className="price">
                          ₹{number(p.price)}
                          <small>/ month</small>
                        </div>
                        <ul>
                          <li>
                            <Check size={16} />
                            {number(p.limit)} dispatches / month
                          </li>
                          <li>
                            <Check size={16} />
                            {p.seats} workspace members
                          </li>
                          <li>
                            <Check size={16} />
                            WhatsApp, email & SMS workflows
                          </li>
                          <li>
                            <Check size={16} />
                            Consent records & activity logs
                          </li>
                          <li>
                            <Check size={16} />
                            Bring your own provider accounts
                          </li>
                        </ul>
                        <button
                          disabled={busy || data.role !== "owner"}
                          className={`button ${key === "growth" ? "primary" : ""}`}
                          onClick={async () => {
                            const result = await act(
                              "checkout",
                              { plan: key, versionId: p.versionId },
                              "Opening secure billing…",
                            );
                            if (result?.url) window.location.assign(result.url);
                          }}
                        >
                          Subscribe to {p.name}
                          <ArrowRight size={15} />
                        </button>
                      </section>
                    ))}
                  </div>
                  <p className="billing-footnote">
                    Proposed platform prices. Provider charges and applicable
                    taxes are separate. Trial workspaces can prepare campaigns;
                    sending requires an active subscription. Razorpay checkout
                    availability depends on platform configuration. Contact the
                    owner for cancellation or plan changes.
                  </p>
                </>
              )}
              {path === "/team" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>The people behind your conversations</h2>
                      <p>
                        Owners manage billing; admins manage sending and
                        channels; members prepare contacts, templates and
                        drafts.
                      </p>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.members.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.account.name}</strong>
                          </td>
                          <td>{m.account.email}</td>
                          <td>
                            <Badge>{m.role}</Badge>
                            {owner &&
                              m.role !== "owner" &&
                              (data.role === "owner" ||
                                m.role === "member") && (
                                <button
                                  className="text-button"
                                  style={{ marginLeft: 15 }}
                                  disabled={busy}
                                  onClick={() =>
                                    void act(
                                      "revoke-member",
                                      { id: m.id },
                                      "Workspace access revoked.",
                                    )
                                  }
                                >
                                  Remove access
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
              {path === "/inbox" && <SupportInbox accountId={data.account.id} members={data.members} templates={data.templates} manager={owner} superAdmin={data.account.superAdmin}/>}
              {path === "/reports" && (
                <div className="report-grid">
                  <section className="panel report-panel">
                    <h2>Delivery by channel</h2>
                    <p>All-time provider outcomes for this workspace.</p>
                    {["whatsapp", "email", "sms"].map((c) => {
                      const count = data.deliveries
                        .filter((d) => d.channel === c)
                        .reduce((a, d) => a + d._count, 0);
                      return (
                        <div className="report-row" key={c}>
                          <div>
                            <ChannelIcon channel={c} />
                            <strong>{channelName(c)}</strong>
                            <span>{number(count)}</span>
                          </div>
                          <progress value={count} max={total || 1} />
                        </div>
                      );
                    })}
                  </section>
                  <section className="panel report-panel">
                    <h2>Message outcomes</h2>
                    {!total ? (
                      <Empty title="Your analytics will grow with you">
                        Send your first campaign to start tracking outcomes.
                      </Empty>
                    ) : (
                      data.deliveries.map((d) => (
                        <div className="outcome" key={d.channel + d.status}>
                          <span>
                            {channelName(d.channel)} · {d.status}
                          </span>
                          <strong>{number(d._count)}</strong>
                        </div>
                      ))
                    )}
                    <p className="muted">
                      Email and SMS delivery receipts are not connected yet.
                      These channels remain “accepted” after provider
                      acceptance.
                    </p>
                  </section>
                </div>
              )}
              {path === "/settings" && (
                <>
                  <section className="panel settings-panel">
                    <h2>Workspace details</h2>
                    <dl>
                      <dt>Organization</dt>
                      <dd>{data.workspace.name}</dd>
                      <dt>Workspace ID</dt>
                      <dd>{data.workspace.id}</dd>
                      <dt>Your permission</dt>
                      <dd>{data.role}</dd>
                      <dt>Display timezone</dt>
                      <dd>Asia/Kolkata (IST)</dd>
                    </dl>
                    <h3>Launch checklist</h3>
                    <ol>
                      <li>
                        Connect your verified sending domain or Meta business
                        account.
                      </li>
                      <li>
                        Ask the platform administrator to verify the connection
                        and provider-approved templates.
                      </li>
                      <li>
                        Add contacts with channel-specific consent evidence.
                      </li>
                      <li>
                        Subscribe, create a draft and review the audience before
                        launch.
                      </li>
                    </ol>
                    <div className="info-panel">
                      <CircleHelp size={20} />
                      <p>
                        For India branded SMS, register the entity, sender
                        header and templates with DLT. A foreign phone number
                        does not replace this setup. Start with email or
                        WhatsApp while SMS onboarding is in progress.
                      </p>
                    </div>
                    <form
                      className="switch-form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await act(
                          "switch",
                          Object.fromEntries(new FormData(e.currentTarget)),
                          "Workspace switched.",
                        );
                      }}
                    >
                      <label>
                        Switch to a workspace you belong to
                        <input
                          name="workspaceId"
                          placeholder="Workspace ID from your team owner"
                          required
                        />
                      </label>
                      <button className="button" disabled={busy}>
                        Switch workspace
                      </button>
                    </form>
                  </section>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Audit trail</h2>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Details</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.audit.map((a) => (
                            <tr key={a.id}>
                              <td>{a.action}</td>
                              <td>{a.detail}</td>
                              <td>{date(a.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!data.audit.length && (
                        <Empty title="No changes recorded yet">
                          Workspace changes and sending actions will be recorded
                          here.
                        </Empty>
                      )}
                    </div>
                  </section>
                </>
              )}
              {path === "/admin" && data.account.superAdmin && (
                <>
                  <PricingManager/>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Client workspaces</h2>
                      <button className="button" onClick={() => open("admin")}>
                        Review verification
                      </button>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Organization</th>
                            <th>Workspace ID</th>
                            <th>Plan</th>
                            <th>Subscription</th>
                            <th>Access</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workspaces.map((w) => (
                            <tr key={w.id}>
                              <td>
                                <strong>{w.name}</strong>
                              </td>
                              <td>{w.id}</td>
                              <td>{w.plan}</td>
                              <td>
                                <Badge>{w.subscriptionStatus}</Badge>
                              </td>
                              <td>
                                <button
                                  className="text-button"
                                  disabled={busy}
                                  onClick={() =>
                                    void act(
                                      "admin",
                                      {
                                        workspaceId: w.id,
                                        action: w.suspended
                                          ? "restore"
                                          : "suspend",
                                        reason:
                                          "Platform administrator changed workspace access",
                                      },
                                      "Workspace access updated.",
                                    )
                                  }
                                >
                                  {w.suspended ? "Restore access" : "Suspend"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </>
          )}
          <footer className="app-footer">
            <span>
              pulse connect <span>·</span> Better conversations start here.
            </span>
            <span>
              All times in IST <span>·</span>{" "}
              <Link href="/settings">Help & setup</Link>
            </span>
          </footer>
        </main>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => !busy && setModal("")}>
          <section
            ref={dialogRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => setModal("")}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">PULSE CONNECT</span>
            <h2 id="modal-title">
              {modal.startsWith("launch:")
                ? "Review your campaign"
                : (
                    {
                      campaigns: "Create a campaign",
                      contacts: "Add an opted-in contact",
                      templates: "Create a template",
                      connections: "Connect a channel",
                      members: "Add a teammate",
                      admin: "Verify a client setup",
                    } as Record<string, string>
                  )[modal]}
            </h2>
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
            {modal.startsWith("launch:") ? (
              <>
                <p>
                  This will queue the campaign for all currently subscribed
                  contacts on its channel. Dispatches reserve your monthly
                  allowance; provider charges are billed separately.
                </p>
                <div className="info-panel">
                  <ShieldCheck size={20} />
                  <p>
                    Review consent, exact provider-approved content, sender
                    identity and the intended schedule before continuing.
                  </p>
                </div>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() =>
                    void act(
                      "launch",
                      { id: modal.split(":")[1] },
                      "Campaign queued. The worker will process the scheduled messages.",
                    )
                  }
                >
                  {busy ? "Queueing…" : "Confirm & queue campaign"}
                </button>
              </>
            ) : (
              <form onSubmit={submit}>
                {["contacts", "templates", "connections"].includes(modal) && (
                  <label>
                    Channel
                    <select
                      name="channel"
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </label>
                )}
                {modal === "campaigns" && (
                  <>
                    <label>
                      Campaign name
                      <input
                        name="name"
                        placeholder="e.g. November product launch"
                        maxLength={200}
                        required
                        autoFocus
                      />
                    </label>
                    <label>
                      Message template
                      <select name="templateId" required defaultValue="">
                        <option value="" disabled>
                          Select a template
                        </option>
                        {data?.templates.map((t) => (
                          <option value={t.id} key={t.id}>
                            {t.name} · {channelName(t.channel)} · {t.approval}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Schedule (optional, your device’s local time)
                      <input name="scheduledAt" type="datetime-local" />
                    </label>
                    <p className="form-note">
                      Saved as a draft. An owner or admin reviews and launches
                      it separately.
                    </p>
                  </>
                )}
                {modal === "contacts" && (
                  <>
                    <label>
                      Full name
                      <input name="name" required maxLength={200} />
                    </label>
                    <label>
                      {selectedChannel === "email"
                        ? "Email address"
                        : "Phone number (international format)"}
                      <input
                        name="destination"
                        type={selectedChannel === "email" ? "email" : "tel"}
                        placeholder={
                          selectedChannel === "email"
                            ? "customer@example.com"
                            : "+919876543210"
                        }
                        required
                      />
                    </label>
                    <label>
                      Consent evidence
                      <input
                        name="consentSource"
                        placeholder="e.g. Website signup, 27 Oct 2026, form record #123"
                        required
                        maxLength={500}
                      />
                    </label>
                    <p className="form-note">
                      Adding a previously unsubscribed contact does not restore
                      their consent.
                    </p>
                  </>
                )}
                {modal === "templates" && (
                  <>
                    <label>
                      Internal template name
                      <input name="name" required maxLength={200} />
                    </label>
                    {selectedChannel === "email" ? (
                      <label>
                        Email subject
                        <input name="subject" required maxLength={200} />
                      </label>
                    ) : (
                      <>
                        <label>
                          {selectedChannel === "sms"
                            ? "MSG91 template ID (not DLT ID)"
                            : "Meta approved template name"}
                          <input
                            name="providerTemplateId"
                            required
                            maxLength={200}
                          />
                        </label>
                        {selectedChannel === "sms" && (
                          <label>
                            DLT template ID
                            <input
                              name="dltTemplateId"
                              required
                              maxLength={200}
                            />
                          </label>
                        )}
                        <label>
                          Language code
                          <input
                            name="language"
                            defaultValue="en_US"
                            maxLength={20}
                          />
                        </label>
                      </>
                    )}
                    <label>
                      Exact message content
                      <textarea
                        name="content"
                        rows={5}
                        required
                        maxLength={5000}
                        placeholder="Write your message. Fixed-content templates only."
                      />
                    </label>
                    <p className="form-note">
                      WhatsApp and SMS templates remain drafts until the
                      platform administrator verifies provider approval.
                    </p>
                  </>
                )}
                {modal === "connections" && (
                  <>
                    <label>
                      {selectedChannel === "whatsapp"
                        ? "Meta phone number ID"
                        : selectedChannel === "email"
                          ? "Sender name and verified address"
                          : "Registered SMS header"}
                      <input
                        name="sender"
                        placeholder={
                          selectedChannel === "email"
                            ? "Your Organization <hello@yourdomain.in>"
                            : ""
                        }
                        required
                        maxLength={200}
                      />
                    </label>
                    <label>
                      Provider API key (MSG91 / Resend) or Meta access token
                      <input
                        name="secret"
                        type="password"
                        required
                        autoComplete="new-password"
                        maxLength={4000}
                      />
                    </label>
                    {selectedChannel === "sms" && (
                      <label>
                        DLT entity ID
                        <input name="entityId" required />
                      </label>
                    )}
                    <p className="form-note">
                      Credentials are encrypted on the server. A platform
                      administrator must verify your setup before sending.
                    </p>
                  </>
                )}
                {modal === "members" && (
                  <>
                    <label>
                      Existing account email
                      <input name="email" type="email" required />
                    </label>
                    <label>
                      Workspace role
                      <select name="role">
                        <option value="member">
                          Member — prepare campaigns and audience
                        </option>
                        {data?.role === "owner" && (
                          <option value="admin">
                            Admin — manage channels and launch campaigns
                          </option>
                        )}
                      </select>
                    </label>
                    <p className="form-note">
                      The teammate must register first. Share your workspace ID
                      so they can switch after being added.
                    </p>
                  </>
                )}
                {modal === "admin" && (
                  <>
                    <label>
                      Workspace ID
                      <input name="workspaceId" required />
                    </label>
                    <label>
                      Action
                      <select name="action">
                        <option value="verify">Verify channel</option>
                        <option value="approve-template">
                          Approve template
                        </option>
                      </select>
                    </label>
                    <label>
                      Channel
                      <select name="channel">
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                      </select>
                    </label>
                    <label>
                      Template ID (for approval)
                      <input name="templateId" />
                    </label>
                    <label>
                      Verification evidence
                      <textarea
                        name="reason"
                        required
                        placeholder="Provider approval reference, verified domain or DLT record"
                        maxLength={500}
                      />
                    </label>
                    <p className="form-note">
                      Verify the client’s actual provider records before
                      approving. This action creates an audit event.
                    </p>
                  </>
                )}
                <button className="button primary submit" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : modal === "campaigns"
                      ? "Save campaign draft"
                      : "Save changes"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
