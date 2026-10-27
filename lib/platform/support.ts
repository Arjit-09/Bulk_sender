import prisma from '@/lib/prisma';
import type {SupportConnection} from '@prisma/client';
import {decrypt} from './crypto';
import {assert} from './policy';
import {replyAllowed} from './support-policy';
export async function ingest(connection:SupportConnection, input:{id:string;peer:string;name?:string;body:string;at:Date;subject?:string;threadKey?:string;emailMessageId?:string}) {
  assert(input.id && input.peer && input.body, 'Incomplete inbound event.');
  assert(Number.isFinite(input.at.getTime()) && input.at.getTime() <= Date.now()+300000, 'Invalid event timestamp.');
  const providerKey = `${connection.id}:${input.id}`;
  return prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${connection.id+input.peer}))`;
    if(await tx.supportMessage.findUnique({where:{providerKey}})) return;
    const threadKey = input.threadKey || '';
    let conversation = await tx.conversation.findUnique({where:{connectionId_peer_threadKey:{connectionId:connection.id,peer:input.peer,threadKey}}});
    const stop = /^(stop|unsubscribe|cancel)$/i.test(input.body.trim());
    if(!conversation) conversation = await tx.conversation.create({data:{workspaceId:connection.workspaceId,connectionId:connection.id,peer:input.peer,name:input.name||input.peer,subject:input.subject||'',threadKey,lastInboundAt:input.at,lastMessageAt:input.at,blocked:stop}});
    else await tx.conversation.update({where:{id:conversation.id},data:{status:'open',lastInboundAt:input.at > conversation.lastInboundAt ? input.at : conversation.lastInboundAt,lastMessageAt:input.at > conversation.lastMessageAt ? input.at : conversation.lastMessageAt, ...(stop?{blocked:true}:input.body.trim().toUpperCase()==='START'?{blocked:false}:{})}});
    await tx.supportMessage.create({data:{conversationId:conversation.id,providerKey,direction:'inbound',body:input.body.slice(0,50000),status:'received',emailMessageId:input.emailMessageId,createdAt:input.at}});
    if(stop) await tx.audienceContact.updateMany({where:{workspaceId:connection.workspaceId,destination:input.peer,channel:connection.provider==='whatsapp'?'whatsapp':connection.provider==='telnyx'?'sms':'email'},data:{unsubscribedAt:new Date()}});
  });
}
export async function supportReceipt(connectionId:string, id:string, status:string, emailMessageId?:string) {
  const predecessors: Record<string,string[]> = {sent:['accepted'],delivered:['accepted','sent'],read:['accepted','sent','delivered'],failed:['accepted','sent','delivered']};
  if(!predecessors[status]) return;
  const message=await prisma.supportMessage.findUnique({where:{providerKey:`${connectionId}:${id}`}});
  // Retry if receipt raced the provider response. Receipts for messages sent outside this app
  // also require operator reconciliation; they never update another tenant's messages.
  assert(message,'Message ID not recorded yet; retry callback.',503);
  await prisma.supportMessage.updateMany({where:{id:message.id,status:{in:predecessors[status]}},data:{status,...(emailMessageId?{emailMessageId}:{})}});
}
export async function processSupportQueue() {
  await prisma.supportMessage.updateMany({where:{status:'processing',claimedAt:{lt:new Date(Date.now()-300000)}},data:{status:'unknown',error:'Worker interrupted; reconcile provider logs before retrying.'}});
  const rows=await prisma.$queryRaw<{id:string}[]>`UPDATE "SupportMessage" SET status='processing', "claimedAt"=NOW() WHERE id IN (SELECT id FROM "SupportMessage" WHERE status='queued' ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id`;
  if(!rows.length)return 0;
  const message=await prisma.supportMessage.findUniqueOrThrow({where:{id:rows[0].id},include:{conversation:{include:{connection:true,workspace:true}}}});
  const c=message.conversation; const conn=c.connection; const w=c.workspace;
  let sending=false;
  try {
    assert(!w.suspended && w.subscriptionStatus==='active' && w.billingThrough && w.billingThrough>new Date(),'Workspace subscription is not active.');
    assert(conn.status==='verified','Support connection is not verified.');
    assert(message.actorId && await prisma.membership.findUnique({where:{accountId_workspaceId:{accountId:message.actorId,workspaceId:w.id}}}),'Agent access was revoked.');
    replyAllowed(c,conn.provider,!!message.templateId);
    const token=decrypt(conn.encryptedKey);
    const headers:Record<string,string>={'Content-Type':'application/json',Authorization:`Bearer ${token}`};
    let url:string; let body:object;
    if(conn.provider==='whatsapp') {
      assert(/^v\d+\.0$/.test(process.env.META_GRAPH_VERSION||''),'Configure META_GRAPH_VERSION.');
      let template;
      if(message.templateId) {
        template=await prisma.blueprint.findFirst({where:{id:message.templateId,workspaceId:w.id,channel:'whatsapp',approval:'approved'}});
        assert(template?.providerTemplateId,'Template no longer approved.');
        assert(await prisma.audienceContact.findFirst({where:{workspaceId:w.id,channel:'whatsapp',destination:c.peer,unsubscribedAt:null}}),'Template messages require recorded opt-in.');
      }
      url=`https://graph.facebook.com/${process.env.META_GRAPH_VERSION}/${conn.address}/messages`;
      body={messaging_product:'whatsapp',to:c.peer.slice(1),...(template?{type:'template',template:{name:template.providerTemplateId,language:{code:template.language}}}:{type:'text',text:{body:message.body}})};
    } else if(conn.provider==='telnyx') {
      assert(!c.peer.startsWith('+91'),'India SMS replies require a commissioned domestic compliance route; this Telnyx inbox cannot bypass DLT.');
      url='https://api.telnyx.com/v2/messages';body={from:conn.address,to:c.peer,text:message.body};
    } else {
      url='https://api.resend.com/emails';headers['Idempotency-Key']=message.id;
      const previous=await prisma.supportMessage.findFirst({where:{conversationId:c.id,emailMessageId:{not:null},direction:{not:'note'}},orderBy:{createdAt:'desc'}});
      body={from:`${conn.senderName} <${conn.address}>`,to:[c.peer],reply_to:conn.address,subject:c.subject.startsWith('Re:')?c.subject:`Re: ${c.subject||'Your support request'}`,text:message.body,...(previous?.emailMessageId?{headers:{'In-Reply-To':previous.emailMessageId,References:previous.emailMessageId}}:{})};
    }
    sending=true;
    const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    assert(response.ok,`Provider HTTP ${response.status}. Reconcile before retrying.`);
    const result=await response.json(); const id=conn.provider==='whatsapp'?result.messages?.[0]?.id:conn.provider==='telnyx'?result.data?.id:result.id;
    assert(typeof id==='string','Missing provider receipt ID.');
    await prisma.supportMessage.update({where:{id:message.id},data:{status:'accepted',providerKey:`${conn.id}:${id}`}});
  } catch(error) {
    await prisma.supportMessage.update({where:{id:message.id},data:{status:sending?'unknown':'blocked',error:error instanceof Error?error.message.slice(0,300):'Dispatch failed.'}});
  }
  return 1;
}
