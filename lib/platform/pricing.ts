import prisma from '@/lib/prisma';
import { PLANS } from './policy';
export async function catalog() {
  const versions = await prisma.pricingVersion.findMany({where: {published: true}, orderBy: {createdAt: 'asc'}});
  const plans: Record<string, {name:string; price:number; limit:number; seats:number; versionId?:string; razorpayPlanId?:string}> = {...PLANS};
  for (const v of versions) plans[v.planKey] = {name:v.name,price:v.pricePaise/100,limit:v.dispatchLimit,seats:v.seats,versionId:v.id,razorpayPlanId:v.razorpayPlanId};
  return plans;
}
export async function entitlement(workspace: {plan:string; planVersionId:string|null}) {
  const v = workspace.planVersionId ? await prisma.pricingVersion.findUnique({where:{id:workspace.planVersionId}}) : null;
  return v ? {name:v.name, price:v.pricePaise/100, limit:v.dispatchLimit, seats:v.seats} : PLANS[workspace.plan as keyof typeof PLANS];
}
export async function verifyBillingPlan(id:string,amount:number) {
  const {assert}=await import('./policy');
  assert(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET,'Configure Razorpay credentials before publishing pricing.',503);
  const response=await fetch(`https://api.razorpay.com/v1/plans/${encodeURIComponent(id)}`,{headers:{Authorization:`Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`},signal:AbortSignal.timeout(15000)});
  assert(response.ok,'Unable to verify the Razorpay plan.',502);const p=await response.json();
  assert(p.period==='monthly'&&p.interval===1&&p.item?.currency==='INR'&&p.item?.amount===amount,'Razorpay currency, monthly interval or amount does not match this price.');
}
