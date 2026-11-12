import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculatePortfolio } from "@/lib/portfolio";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";
import { isSameOriginRequest } from "@/lib/server/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const date = z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/);
const watchItem = z.object({symbol:z.string().trim().min(1).max(24),note:z.string().max(300).default("")});
const trade = z.object({
  id:z.string().min(1).max(80),
  symbol:z.string().trim().min(1).max(24),
  side:z.enum(["buy","sell"]),
  tradeDate:date,
  quantity:z.number().finite().positive(),
  pricePerShare:z.number().finite().nonnegative(),
  feesNpr:z.number().finite().nonnegative().default(0)
});
const action = z.object({
  id:z.string().min(1).max(80),symbol:z.string().trim().min(1).max(24),
  kind:z.enum(["cash_dividend","bonus_share","rights_share"]),actionDate:date,
  cashReceived:z.number().finite().nonnegative(),sharesCredited:z.number().finite().nonnegative(),
  note:z.string().max(500).default(""),sourceUrl:z.string().max(2048).refine(v=>!v||/^https:\\/\\//i.test(v))
});
const preset = z.object({
  id:z.string().min(1).max(80),name:z.string().trim().min(1).max(50),
  createdAt:z.string().datetime(),values:z.record(z.string(),z.string().max(80))
});
const stateSchema = z.object({
  watchlist:z.array(watchItem).max(5000),
  trades:z.array(trade).max(10000),
  corporateActions:z.array(action).max(10000),
  screenerPresets:z.array(preset).max(30)
}).strict();

export async function GET() {
  try {
    const user=await getSessionUser();
    if(!user)return NextResponse.json({error:"Sign in to access account sync."},{status:401});
    const result=await getDb().query(
      "SELECT schema_version,watchlist,trades,corporate_actions AS \"corporateActions\",screener_presets AS \"screenerPresets\",updated_at FROM user_workspace_state WHERE user_id=$1",
      [user.id]
    );
    return NextResponse.json({state:result.rows[0]??null},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    if((error as Error)?.message==="DATABASE_NOT_CONFIGURED")return NextResponse.json({error:"Account database is not configured."},{status:503});
    return NextResponse.json({error:"Unable to load your account workspace."},{status:500});
  }
}

export async function PUT(request:NextRequest) {
  if(!isSameOriginRequest(request))return NextResponse.json({error:"Cross-origin request rejected."},{status:403});
  try {
    const user=await getSessionUser();
    if(!user)return NextResponse.json({error:"Sign in to save account data."},{status:401});
    const raw=await request.text();
    if(raw.length>5*1024*1024)return NextResponse.json({error:"Workspace backup exceeds the 5 MB limit."},{status:413});
    let body:unknown;
    try{body=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid JSON workspace data."},{status:400});}
    const parsed=stateSchema.safeParse(body);
    if(!parsed.success)return NextResponse.json({error:"Workspace data did not pass validation."},{status:400});
    const ids=new Set<string>();
    for(const item of parsed.data.trades){if(ids.has(item.id))return NextResponse.json({error:"Duplicate transaction IDs are not allowed."},{status:400});ids.add(item.id);}
    for(const item of parsed.data.corporateActions){if(ids.has(item.id))return NextResponse.json({error:"Duplicate record IDs are not allowed."},{status:400});ids.add(item.id);}
    for(const item of parsed.data.screenerPresets){if(ids.has(item.id))return NextResponse.json({error:"Duplicate record IDs are not allowed."},{status:400});ids.add(item.id);}
    try{calculatePortfolio(parsed.data.trades);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid portfolio ledger."},{status:400});}
    const state=parsed.data;
    const saved=await getDb().query(
      `INSERT INTO user_workspace_state (user_id,schema_version,watchlist,trades,corporate_actions,screener_presets,updated_at)
       VALUES ($1,1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,NOW())
       ON CONFLICT (user_id) DO UPDATE SET schema_version=1,watchlist=EXCLUDED.watchlist,trades=EXCLUDED.trades,corporate_actions=EXCLUDED.corporate_actions,screener_presets=EXCLUDED.screener_presets,updated_at=NOW()
       RETURNING updated_at`,
      [user.id,JSON.stringify(state.watchlist),JSON.stringify(state.trades),JSON.stringify(state.corporateActions),JSON.stringify(state.screenerPresets)]
    );
    return NextResponse.json({ok:true,updatedAt:saved.rows[0].updated_at});
  } catch(error) {
    if((error as Error)?.message==="DATABASE_NOT_CONFIGURED")return NextResponse.json({error:"Account database is not configured."},{status:503});
    return NextResponse.json({error:"Unable to save your account workspace."},{status:500});
  }
}
