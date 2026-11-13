import { NextRequest,NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { allowAuthAttempt } from "@/lib/server/auth-rate-limit";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.object({currentPassword:z.string().min(1).max(128),newPassword:z.string().min(12).max(128).refine(v=>/[A-Za-z]/.test(v)&&/[0-9]/.test(v),"Use a mix of letters and numbers.")});
const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");

export async function POST(request:NextRequest){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"Cross-origin request rejected."},{status:403});
 try{
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Sign in to change your password."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Enter your current password and a new password of at least 12 characters containing letters and numbers."},{status:400});
  if(!(await allowAuthAttempt("password",user.email,10)))return NextResponse.json({error:"Too many password change attempts. Try again in 15 minutes."},{status:429});
  const db=getDb();
  const account=await db.query("SELECT password_hash FROM users WHERE id=$1 AND disabled_at IS NULL",[user.id]);
  const stored=account.rows[0]?.password_hash;
  if(!stored||!(await bcrypt.compare(parsed.data.currentPassword,stored)))return NextResponse.json({error:"Current password is incorrect."},{status:401});
  const jar=await cookies();
  const token=jar.get("cc_session")?.value;
  if(!token)return NextResponse.json({error:"Current session is unavailable. Sign in again."},{status:401});
  const newHash=await bcrypt.hash(parsed.data.newPassword,12);
  const client=await db.connect();
  try{
   await client.query("BEGIN");
   await client.query("UPDATE users SET password_hash=$1 WHERE id=$2",[newHash,user.id]);
   await client.query("DELETE FROM user_sessions WHERE user_id=$1 AND token_hash<>$2",[user.id,tokenHash(token)]);
   await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK").catch(()=>undefined);throw error;}
  finally{client.release();}
  return NextResponse.json({ok:true,message:"Password updated. Other active sessions have been signed out."});
 }catch(error){
  if((error as Error)?.message==="DATABASE_NOT_CONFIGURED")return NextResponse.json({error:"Account database is not configured."},{status:503});
  return NextResponse.json({error:"Unable to change your password right now."},{status:500});
 }
}
