import {createPublicKey,verify} from 'node:crypto';
import {Webhook} from 'svix';
import prisma from '@/lib/prisma';
import {decrypt,validHmac} from '@/lib/platform/crypto';
import {assert} from '@/lib/platform/policy';
import {failure} from '@/lib/platform/auth';
import {ingest,supportReceipt} from '@/lib/platform/support';
import {mailbox} from '@/lib/platform/support-policy';
type Context={params:Promise<{provider:string;id:string}>};
export async function GET(req:Request,ctx:Context) {
 const {provider,id}=await ctx.params;const c=await prisma.supportConnection.findUnique({where:{id}});const u=new URL(req.url);
 if(c&&provider==='whatsapp'&&c.provider===provider&&process.env.META_VERIFY_TOKEN&&u.searchParams.get('hub.verify_token')===process.env.META_VERIFY_TOKEN&&u.searchParams.get('hub.mode')==='subscribe')return new Response(u.searchParams.get('hub.challenge'));
 return new Response('Forbidden',{status:403});
}
export async function POST(req:Request,ctx:Context) {
 try {
  const {provider,id}=await ctx.params;const c=await prisma.supportConnection.findUnique({where:{id}});assert(c&&c.provider===provider&&c.status==='verified','Unknown or unverified connection.',404);
  const raw=await req.text();assert(raw.length<=1000000,'Payload too large.',413);const secret=decrypt(c.encryptedWebhookSecret);
  if(provider==='telnyx') {
   const ts=req.headers.get('telnyx-timestamp')||'';assert(/^\d+$/.test(ts)&&Math.abs(Date.now()/1000-Number(ts))<300,'Expired webhook.',401);
   let valid=false;try {const key=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),Buffer.from(secret,'base64')]),format:'der',type:'spki'});valid=verify(null,Buffer.from(`${ts}|${raw}`),key,Buffer.from(req.headers.get('telnyx-signature-ed25519')||'','base64'));}catch{}
   assert(valid,'Invalid Telnyx signature.',401);
  }else if(provider==='whatsapp')assert(validHmac(raw,(req.headers.get('x-hub-signature-256')||'').replace(/^sha256=/,''),secret),'Invalid Meta signature.',401);
  else if(provider==='resend'){let valid=false;try{new Webhook(secret).verify(raw,{'svix-id':req.headers.get('svix-id')||'','svix-timestamp':req.headers.get('svix-timestamp')||'','svix-signature':req.headers.get('svix-signature')||''});valid=true;}catch{}assert(valid,'Invalid Resend signature.',401);}
  else assert(false,'Unknown provider.',404);
  const event=JSON.parse(raw);
  if(provider==='telnyx') {
   const p=event.data?.payload;
   if(event.data?.event_type==='message.received') {
    assert(p.to?.some((v:{phone_number:string})=>v.phone_number===c.address),'Recipient mismatch.',403);
    assert(/^\+[1-9]\d{7,14}$/.test(p.from?.phone_number||''),'Invalid sender.');
    await ingest(c,{id:p.id,peer:p.from.phone_number,body:p.text||'[MMS received: media viewing is not supported]',at:new Date(p.received_at||event.data.occurred_at)});
   }else if(event.data?.event_type==='message.finalized') await supportReceipt(c.id,p.id,p.to?.[0]?.status==='delivered'?'delivered':'failed');
  }else if(provider==='whatsapp') {
   for(const entry of event.entry||[])for(const change of entry.changes||[]) {
    const v=change.value;if(v.metadata?.phone_number_id!==c.address)continue;
    for(const m of v.messages||[]){assert(/^\d{8,15}$/.test(m.from),'Invalid sender.');await ingest(c,{id:m.id,peer:`+${m.from}`,name:v.contacts?.find((x:{wa_id:string})=>x.wa_id===m.from)?.profile?.name,body:m.text?.body||m.button?.text||m.interactive?.button_reply?.title||m.interactive?.list_reply?.title||`[${m.type} received: media viewing is not supported]`,at:new Date(Number(m.timestamp)*1000)});}
    for(const status of v.statuses||[])await supportReceipt(c.id,status.id,status.status);
   }
  }else {
   const d=event.data;
   if(event.type==='email.received') {
    assert(Array.isArray(d.to)&&d.to.some((to:string)=>mailbox(to)===c.address),'Recipient mismatch.',403);
    const response=await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(d.email_id)}`,{headers:{Authorization:`Bearer ${decrypt(c.encryptedKey)}`},signal:AbortSignal.timeout(15000)});assert(response.ok,'Unable to fetch inbound email; retry.',503);const email=await response.json();
    const peer=mailbox(email.from);const subject=String(email.subject||'Support request').slice(0,200);
    const headers=email.headers||{};const refs=String(headers['in-reply-to']||headers['In-Reply-To']||'').slice(0,1000);
    const prior=refs?await prisma.supportMessage.findFirst({where:{emailMessageId:refs,conversation:{connectionId:c.id,peer}},include:{conversation:true}}):null;
    // When provider headers are unavailable, keep each inbound email in its own thread.
    const threadKey=prior?.conversation.threadKey||String(email.message_id||d.email_id);
    await ingest(c,{id:d.email_id,peer,name:peer,body:email.text||'[HTML-only email received. Ask the customer for a plain-text reply. Attachments are not displayed.]',subject,threadKey,emailMessageId:email.message_id,at:new Date(email.created_at||event.created_at)});
   }else if(['email.delivered','email.bounced','email.complained','email.failed'].includes(event.type)){
    await supportReceipt(c.id,d.email_id,event.type==='email.delivered'?'delivered':'failed',d.message_id);
    if(['email.bounced','email.complained'].includes(event.type)){const message=await prisma.supportMessage.findUnique({where:{providerKey:`${c.id}:${d.email_id}`},include:{conversation:true}});if(message)await prisma.$transaction([prisma.conversation.update({where:{id:message.conversationId},data:{blocked:true}}),prisma.audienceContact.updateMany({where:{workspaceId:c.workspaceId,channel:'email',destination:message.conversation.peer},data:{unsubscribedAt:new Date()}})]);}
   }
  }
  return Response.json({ok:true});
 }catch(e){return failure(e);}
}
