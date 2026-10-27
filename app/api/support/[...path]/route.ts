import prisma from '@/lib/prisma';
import {Prisma} from '@prisma/client';
import {failure,session,sameOrigin,manager,rateLimit} from '@/lib/platform/auth';
import {assert,field} from '@/lib/platform/policy';
import {encrypt} from '@/lib/platform/crypto';
import {replyAllowed,mailbox} from '@/lib/platform/support-policy';
import {entitlement} from '@/lib/platform/pricing';
type Context={params:Promise<{path:string[]}>};
export async function GET(req:Request,ctx:Context) {
 try {
  const s=await session();const {path}=await ctx.params;const url=new URL(req.url);const where={workspaceId:s.workspaceId};
  if(path[0]==='connections')return Response.json(await prisma.supportConnection.findMany({where,select:{id:true,provider:true,address:true,senderName:true,status:true}}));
  if(path[0]==='conversations'&&!path[1]) {
   const status=url.searchParams.get('status')||'open';assert(['open','pending','resolved','all'].includes(status),'Invalid filter.');
   const page=Math.max(0,Math.min(10000,Number(url.searchParams.get('page')||0)||0));
   return Response.json(await prisma.conversation.findMany({where:{...where,...(status==='all'?{}:{status}),...(url.searchParams.get('mine')==='true'?{assigneeId:s.account.id}:{}),...(url.searchParams.get('q')?{OR:[{name:{contains:url.searchParams.get('q')!.slice(0,100),mode:'insensitive'}},{peer:{contains:url.searchParams.get('q')!.slice(0,100)}}]}:{})},orderBy:[{lastMessageAt:'desc'},{id:'desc'}],take:50,skip:page*50,include:{connection:{select:{provider:true,address:true}},reads:{where:{accountId:s.account.id}},messages:{orderBy:{createdAt:'desc'},take:1}}}));
  }
  if(path[0]==='conversations'&&path[1]) {
   const c=await prisma.conversation.findFirst({where:{...where,id:path[1]},include:{connection:{select:{provider:true,address:true,status:true}}}});assert(c,'Conversation not found.',404);
   const before=url.searchParams.get('before');
   const messages=await prisma.supportMessage.findMany({where:{conversationId:c.id},orderBy:[{createdAt:'desc'},{id:'desc'}],take:100,...(before?{cursor:{id:before},skip:1}:{})});
   if(before)assert(await prisma.supportMessage.findFirst({where:{id:before,conversationId:c.id}}),'Invalid message cursor.');
   return Response.json({...c,messages:messages.reverse(),hasMore:messages.length===100});
  }
  return Response.json({error:'Not found'},{status:404});
 }catch(e){return failure(e);}
}
export async function POST(req:Request,ctx:Context) {
 try {
  sameOrigin(req);const s=await session();await rateLimit(`support:${s.account.id}`,90);const {path}=await ctx.params;const d=await req.json();
  if(path[0]==='connections') {
   manager(s.role);assert(['whatsapp','telnyx','resend'].includes(d.provider),'Unknown provider.');
   const address=field(d.address,'Receiving address');
   assert(d.provider==='whatsapp'?/^\d+$/.test(address):d.provider==='telnyx'?/^\+[1-9]\d{7,14}$/.test(address):mailbox(address)===address,'Use a valid number ID, international number or lowercase mailbox.');
   const senderName=field(d.senderName,'Organization name',100);assert(!/[<>\r\n]/.test(senderName),'Invalid organization name.');
   const data={senderName,encryptedKey:encrypt(field(d.key,'API token',4000)),encryptedWebhookSecret:encrypt(field(d.webhookSecret,'Webhook signing secret or Telnyx public key',4000)),status:'pending'};
   const existing=await prisma.supportConnection.findUnique({where:{provider_address:{provider:d.provider,address}}});
   assert(!existing||existing.workspaceId===s.workspaceId,'This address belongs to another workspace.',409);
   const result=existing?await prisma.supportConnection.update({where:{id:existing.id},data}):await prisma.supportConnection.create({data:{...data,workspaceId:s.workspaceId,provider:d.provider,address}});
   await prisma.auditEvent.create({data:{workspaceId:s.workspaceId,actorId:s.account.id,action:'support.connection_submitted',detail:result.id}});
   return Response.json({id:result.id});
  }
  if(path[0]==='verify') {
   assert(s.account.superAdmin,'Super-admin permission required.',403);
   const connection=await prisma.supportConnection.findUnique({where:{id:field(d.id,'Connection ID')}});assert(connection,'Connection not found.',404);
   await prisma.$transaction([prisma.supportConnection.update({where:{id:connection.id},data:{status:'verified'}}),prisma.auditEvent.create({data:{workspaceId:connection.workspaceId,actorId:s.account.id,action:'support.connection_verified',detail:field(d.evidence,'Verification evidence',500)}})]);
   return Response.json({ok:true});
  }
  const c=await prisma.conversation.findFirst({where:{id:field(d.id,'Conversation'),workspaceId:s.workspaceId},include:{connection:true}});assert(c,'Conversation not found.',404);
  if(path[0]==='read') {
   const readAt=new Date(d.at);assert(Number.isFinite(readAt.getTime())&&readAt<=new Date(),'Invalid read timestamp.');
   await prisma.conversationRead.upsert({where:{conversationId_accountId:{conversationId:c.id,accountId:s.account.id}},create:{conversationId:c.id,accountId:s.account.id,readAt},update:{}});
   await prisma.conversationRead.updateMany({where:{conversationId:c.id,accountId:s.account.id,readAt:{lt:readAt}},data:{readAt}});
   return Response.json({ok:true});
  }
  if(path[0]==='update') {
   const changes:{status?:string;assigneeId?:string|null;blocked?:boolean}={};
   if(d.status!==undefined){assert(['open','pending','resolved'].includes(d.status),'Invalid status.');changes.status=d.status;}
   if(d.assigneeId!==undefined){if(d.assigneeId)assert(await prisma.membership.findUnique({where:{accountId_workspaceId:{accountId:d.assigneeId,workspaceId:s.workspaceId}}}),'Assignee must belong to this workspace.');changes.assigneeId=d.assigneeId||null;}
   if(d.blocked!==undefined){assert(d.blocked===true,'Only a customer START message can clear an opt-out.');changes.blocked=true;}
   await prisma.$transaction([prisma.conversation.update({where:{id:c.id},data:changes}),prisma.auditEvent.create({data:{workspaceId:s.workspaceId,actorId:s.account.id,action:'support.updated',detail:JSON.stringify({id:c.id,...changes})}})]);return Response.json({ok:true});
  }
  if(path[0]==='reply'||path[0]==='note') {
   const key=field(d.clientKey,'Idempotency key',100);assert(/^[a-zA-Z0-9-]{16,100}$/.test(key),'Invalid request key.');
   const clientKey=`${s.workspaceId}:${key}`;const existing=await prisma.supportMessage.findUnique({where:{clientKey}});
   if(existing){assert(existing.conversationId===c.id&&existing.actorId===s.account.id,'Request key already used.',409);return Response.json(existing);}
   const note=path[0]==='note';let body=field(d.body,'Message',c.connection.provider==='telnyx'?1600:4000);
   const template=d.templateId?await prisma.blueprint.findFirst({where:{id:d.templateId,workspaceId:s.workspaceId,channel:'whatsapp',approval:'approved'}}):null;
   if(!note){
    assert(!s.workspace.suspended&&s.workspace.subscriptionStatus==='active'&&s.workspace.billingThrough&&s.workspace.billingThrough>new Date(),'Active subscription required.');
    assert(c.connection.status==='verified','Verify the support connection before replying.');
    if(d.templateId){assert(c.connection.provider==='whatsapp'&&template?.providerTemplateId,'Approved WhatsApp template required.');body=template.content;assert(await prisma.audienceContact.findFirst({where:{workspaceId:s.workspaceId,channel:'whatsapp',destination:c.peer,unsubscribedAt:null}}),'Template messages require recorded opt-in.');}
    replyAllowed(c,c.connection.provider,!!template);
    assert(!(c.connection.provider==='telnyx'&&c.peer.startsWith('+91')),'India SMS needs a domestic compliance route. Use WhatsApp or email for this conversation.');
   }
   const limits=await entitlement(s.workspace);
   const result=await prisma.$transaction(async tx=>{
    if(!note){const usage=await tx.usagePeriod.upsert({where:{workspaceId_month:{workspaceId:s.workspaceId,month:new Date().toISOString().slice(0,7)}},create:{workspaceId:s.workspaceId,month:new Date().toISOString().slice(0,7),reserved:1},update:{reserved:{increment:1}}});assert(usage.reserved<=limits.limit,'Monthly dispatch allowance reached.');}
    const message=await tx.supportMessage.create({data:{conversationId:c.id,actorId:s.account.id,clientKey,direction:note?'note':'outbound',body,status:note?'internal':'queued',templateId:note?null:template?.id}});
    await tx.conversation.update({where:{id:c.id},data:{lastMessageAt:new Date()}});return message;
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});return Response.json(result);
  }
  return Response.json({error:'Unknown action'},{status:404});
 }catch(e){return failure(e);}
}
