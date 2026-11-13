import { NextRequest,NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";
import { isSameOriginRequest } from "@/lib/server/request-security";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const cookieName="cc_session";
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");

export async function GET(){
 try{
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Sign in to view your sessions."},{status:401});
  const token=(await cookies()).get(cookieName)?.value;
  if(!token)return NextResponse.json({error:"Current session is unavailable."},{status:401});
  const result=await getDb().query(
   "SELECT id,created_at,expires_at,(token_hash=$2) AS current FROM user_sessions WHERE user_id=$1 AND expires_at>NOW() ORDER BY created_at DESC",
   [user.id,hash(token)]
  );
  return NextResponse.json({sessions:result.rows},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if((error as Error)?.message==="DATABASE_NOT_CONFIGURED")return NextResponse.json({error:"Account database is not configured."},{status:503});
  return NextResponse.json({error:"Unable to load active sessions."},{status:500});
 }
}

export async function DELETE(request:NextRequest){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"Cross-origin request rejected."},{status:403});
 try{
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Sign in to manage sessions."},{status:401});
  const body=await request.json().catch(()=>null) as {sessionId?:unknown;others?:unknown}|null;
  const db=getDb();
  if(body?.others===true){
   const token=(await cookies()).get(cookieName)?.value;
   if(!token)return NextResponse.json({error:"Current session is unavailable."},{status:401});
   await db.query("DELETE FROM user_sessions WHERE user_id=$1 AND token_hash<>$2",[user.id,hash(token)]);
  }else if(typeof body?.sessionId==="string"){
   const result=await db.query("DELETE FROM user_sessions WHERE id=$1 AND user_id=$2 RETURNING id",[body.sessionId,user.id]);
   if(!result.rowCount)return NextResponse.json({error:"Session not found."},{status:404});
  }else return NextResponse.json({error:"Choose a session to revoke."},{status:400});
  return NextResponse.json({ok:true});
 }catch(error){
  if((error as Error)?.message==="DATABASE_NOT_CONFIGURED")return NextResponse.json({error:"Account database is not configured."},{status:503});
  return NextResponse.json({error:"Unable to revoke this session."},{status:500});
 }
}
