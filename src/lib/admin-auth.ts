import "server-only";
import {cookies} from "next/headers";
import {createHmac,timingSafeEqual} from "node:crypto";

const COOKIE_NAME="forticestas_admin";
const SESSION_SECONDS=60*60*24*7;
function signature(value:string,secret:string){return createHmac("sha256",secret).update(value).digest("base64url");}
export function validateAdminCredentials(email:string,password:string){
 const expectedEmail=(process.env.ADMIN_EMAIL||"").trim().toLowerCase(),expectedPassword=process.env.ADMIN_PASSWORD||"";
 if(!expectedEmail||!expectedPassword||!process.env.ADMIN_SESSION_SECRET)return false;
 const a=Buffer.from(email.trim().toLowerCase()),b=Buffer.from(expectedEmail),c=Buffer.from(password),d=Buffer.from(expectedPassword);
 return a.length===b.length&&c.length===d.length&&timingSafeEqual(a,b)&&timingSafeEqual(c,d);
}
export function createAdminToken(email:string){
 const secret=process.env.ADMIN_SESSION_SECRET;if(!secret||secret.length<32)throw new Error("ADMIN_SESSION_SECRET precisa ter pelo menos 32 caracteres.");
 const payload=Buffer.from(JSON.stringify({email:email.trim().toLowerCase(),expiresAt:Date.now()+SESSION_SECONDS*1000})).toString("base64url");
 return payload+"."+signature(payload,secret);
}
export function verifyAdminToken(token:string){
 const secret=process.env.ADMIN_SESSION_SECRET;if(!secret||secret.length<32)return null;
 const [payload,received]=token.split(".");if(!payload||!received)return null;
 const expected=Buffer.from(signature(payload,secret)),actual=Buffer.from(received);
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;
 try{const decoded=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as {email?:string;expiresAt?:number};
  if(!decoded.email||!decoded.expiresAt||decoded.expiresAt<Date.now()||decoded.email!==(process.env.ADMIN_EMAIL||"").trim().toLowerCase())return null;
  return {email:decoded.email};
 }catch{return null;}
}
export async function getAdminContext(){
 if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD||!process.env.ADMIN_SESSION_SECRET||process.env.ADMIN_SESSION_SECRET.length<32)
  return {ok:false as const,status:503,message:"Configure ADMIN_EMAIL, ADMIN_PASSWORD e ADMIN_SESSION_SECRET no servidor."};
 const store=await cookies(),token=store.get(COOKIE_NAME)?.value,user=token?verifyAdminToken(token):null;
 if(!user)return {ok:false as const,status:401,message:"Faça login para continuar."};
 return {ok:true as const,user};
}
export {COOKIE_NAME,SESSION_SECONDS};
