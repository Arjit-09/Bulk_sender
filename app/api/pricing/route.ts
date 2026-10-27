import prisma from '@/lib/prisma';
import {session,sameOrigin,failure,rateLimit} from '@/lib/platform/auth';
import {assert,field,PLANS} from '@/lib/platform/policy';
import {verifyBillingPlan} from '@/lib/platform/pricing';
export async function GET() {try{const s=await session();assert(s.account.superAdmin,'Super-admin permission required.',403);return Response.json(await prisma.pricingVersion.findMany({orderBy:{createdAt:'desc'},take:100}));}catch(e){return failure(e);}}
export async function POST(req:Request) {
 try{
  sameOrigin(req);const s=await session();assert(s.account.superAdmin,'Super-admin permission required.',403);await rateLimit(`pricing:${s.account.id}`,10);const d=await req.json();
  if(d.action==='publish') {
   const v=await prisma.pricingVersion.findUnique({where:{id:field(d.id,'Version')}});assert(v,'Version not found.',404);
   await verifyBillingPlan(v.razorpayPlanId,v.pricePaise);
   await prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`pricing:${v.planKey}`}))`;
    await tx.pricingVersion.updateMany({where:{planKey:v.planKey,published:true},data:{published:false}});
    await tx.pricingVersion.update({where:{id:v.id},data:{published:true}});
    await tx.auditEvent.create({data:{workspaceId:s.workspaceId,actorId:s.account.id,action:'pricing.published',detail:v.id}});
   });return Response.json({ok:true});
  }
  assert(d.action==='create','Unknown action.');assert(Object.hasOwn(PLANS,d.planKey),'Choose starter, growth or scale.');
  for(const [key,min,max] of [['pricePaise',10000,100000000],['dispatchLimit',100,10000000],['seats',1,1000]] as const)assert(Number.isSafeInteger(d[key])&&d[key]>=min&&d[key]<=max,`Invalid ${key}.`);
  const v=await prisma.pricingVersion.create({data:{planKey:d.planKey,name:field(d.name,'Plan name',60),pricePaise:d.pricePaise,dispatchLimit:d.dispatchLimit,seats:d.seats,razorpayPlanId:field(d.razorpayPlanId,'Razorpay monthly INR plan ID',100)}});
  await prisma.auditEvent.create({data:{workspaceId:s.workspaceId,actorId:s.account.id,action:'pricing.draft_created',detail:v.id}});return Response.json(v);
 }catch(e){return failure(e);}
}
