import {assert} from './policy';
export function replyAllowed(c: {blocked:boolean; lastInboundAt:Date}, provider:string, template:boolean, now = Date.now()) {
  assert(!c.blocked, 'This conversation is blocked or opted out.');
  if(provider === 'whatsapp' && !template) assert(now - c.lastInboundAt.getTime() < 24*3600000, 'The WhatsApp 24-hour window is closed. Select an approved template for an opted-in recipient.');
}
export function mailbox(input:string) {
  const result = (input.match(/<([^<>]+)>/)?.[1] || input).trim().toLowerCase();
  assert(/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result), 'Invalid mailbox.'); return result;
}
