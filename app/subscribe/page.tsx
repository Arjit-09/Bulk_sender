'use client';

import React, { useState } from 'react';

export default function SubscribePage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!agreed) {
      setError('You must agree to receive SMS messages to subscribe.');
      return;
    }

    setSubmitted(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .subscribe-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
        }

        .card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 48px 40px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          justify-content: center;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .logo-text {
          font-size: 1.4rem;
          font-weight: 700;
          color: #ffffff;
        }

        h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          margin-bottom: 8px;
        }

        .subtitle {
          text-align: center;
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 1rem;
          color: #ffffff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .form-input::placeholder { color: rgba(255,255,255,0.3); }

        .form-input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.2);
        }

        .consent-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .consent-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .consent-checkbox {
          width: 20px;
          height: 20px;
          min-width: 20px;
          accent-color: #7c3aed;
          cursor: pointer;
          margin-top: 2px;
        }

        .consent-text {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          cursor: pointer;
        }

        .consent-text a {
          color: #a78bfa;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .msg-freq {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.45);
          margin-top: 10px;
          line-height: 1.5;
        }

        .msg-freq a { color: rgba(167,139,250,0.8); text-decoration: underline; }

        .btn {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'Inter', system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(124,58,237,0.4);
        }

        .btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 28px rgba(124,58,237,0.55); }
        .btn:active { transform: translateY(0); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .error-msg {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.85rem;
          color: #fca5a5;
          margin-bottom: 16px;
        }

        .success-card { text-align: center; }

        .success-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 24px;
          box-shadow: 0 8px 30px rgba(16,185,129,0.4);
        }

        .success-title { font-size: 1.5rem; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .success-text { font-size: 0.9rem; color: rgba(255,255,255,0.65); line-height: 1.6; }

        .stop-note {
          margin-top: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 14px;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
        }

        .page-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.3);
        }

        .page-footer a { color: rgba(255,255,255,0.45); text-decoration: underline; }
      `}</style>

      <div className="subscribe-page">
        <div className="card">
          <div className="logo">
            <div className="logo-icon">💬</div>
            <span className="logo-text">Zenith Services</span>
          </div>

          {submitted ? (
            <div className="success-card">
              <div className="success-icon">✓</div>
              <h2 className="success-title">You&apos;re subscribed!</h2>
              <p className="success-text">
                Thank you, <strong style={{ color: '#fff' }}>{name || 'subscriber'}</strong>!<br />
                You will now receive SMS updates at <strong style={{ color: '#fff' }}>{phone}</strong>.
              </p>
              <div className="stop-note">
                📵 To unsubscribe, reply <strong>STOP</strong> to any message.<br />
                For help, reply <strong>HELP</strong> or email <a href="mailto:arjit.sharma@hestabit.in" style={{ color: 'rgba(255,255,255,0.55)' }}>arjit.sharma@hestabit.in</a>
              </div>
            </div>
          ) : (
            <>
              <h1>Subscribe to SMS Updates</h1>
              <p className="subtitle">
                Get important updates and notifications from Zenith Services directly on your phone.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sub-name">Your Name (optional)</label>
                  <input
                    id="sub-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sub-phone">
                    Mobile Phone Number <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    id="sub-phone"
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="tel"
                  />
                </div>

                <div className="consent-box">
                  <div className="consent-row">
                    <input
                      id="sms-consent"
                      type="checkbox"
                      className="consent-checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <label htmlFor="sms-consent" className="consent-text">
                      I agree to receive recurring SMS text messages from{' '}
                      <strong style={{ color: '#fff' }}>Zenith Services</strong> for important
                      updates and service notifications. I understand that consent is not a
                      condition of purchase.
                    </label>
                  </div>
                  <p className="msg-freq">
                    Message frequency varies. Message and data rates may apply.
                    Reply <strong>STOP</strong> to cancel · Reply <strong>HELP</strong> for help ·{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{' '}
                    ·{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                  </p>
                </div>

                {error && <div className="error-msg">⚠️ {error}</div>}

                <button type="submit" id="subscribe-btn" className="btn" disabled={!agreed}>
                  Subscribe to SMS Notifications
                </button>
              </form>
            </>
          )}
        </div>

        <div className="page-footer">
          <p>© 2026 Zenith Services · <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a></p>
        </div>
      </div>
    </>
  );
}
