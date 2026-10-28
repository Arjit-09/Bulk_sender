import { redirect } from 'next/navigation';

// WhatsApp is not supported in this platform.
// All messaging is handled via Telnyx SMS (US & Canada only).
export default function WhatsAppPage() {
  redirect('/campaigns');
}
