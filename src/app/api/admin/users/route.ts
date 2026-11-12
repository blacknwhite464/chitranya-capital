import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";
import { isSameOriginRequest } from "@/lib/server/request-security";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
  try{
    const admin=await getSessionUser();
    if(!admin||admin.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});
    const result=await getDb().query(
      "SELECT id,email,display_name,role,disabled_at,created_at,email_verified_at FROM users ORDER BY created_at DESC LIMIT 200"
    );
    return NextResponse.json({users:result.rows},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    if((error as Error)?.message==="DATABASE_NOT_CONFIGURED")return NextResponse.json({error:"Database is not configured."},{status:503});
    return NextResponse.json({error:"Unable to load customer accounts."},{status:500});
  }
}

export async function PATCH(request:NextRequest){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"Cross-origin request rejected."},{status:403});
  const admin=await getSessionUser();
  if(!admin||admin.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});
  const parsed=z.object({userId:z.string().uuid(),action:z.enum(["disable","enable"])}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid account update."},{status:400});
  if(parsed.data.userId===admin.id)return NextResponse.json({error:"You cannot disable your own administrator account."},{status:400});
  const db=getDb();
  const client=await db.connect();
  try{
    await client.query("BEGIN");
    const target=await client.query("SELECT id,role,disabled_at FROM users WHERE id=$1 FOR UPDATE",[parsed.data.userId]);
    if(!target.rowCount){await client.query("ROLLBACK");return NextResponse.json({error:"Account not found."},{status:404});}
    if(target.rows[0].role==="admin"){await client.query("ROLLBACK");return NextResponse.json({error:"Administrator accounts cannot be changed here."},{status:403});}
    if(parsed.data.action==="disable"){
      await client.query("UPDATE users SET disabled_at=NOW() WHERE id=$1",[parsed.data.userId]);
      await client.query("DELETE FROM user_sessions WHERE user_id=$1",[parsed.data.userId]);
    }else{
      await client.query("UPDATE users SET disabled_at=NULL WHERE id=$1",[parsed.data.userId]);
    }
    await client.query("COMMIT");
    return NextResponse.json({ok:true});
  }catch{
    await client.query("ROLLBACK").catch(()=>undefined);
    return NextResponse.json({error:"Unable to update this account."},{status:500});
  }finally{client.release();}
}
