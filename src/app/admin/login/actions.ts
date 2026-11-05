"use server";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {COOKIE_NAME,SESSION_SECONDS,createAdminToken,validateAdminCredentials} from "@/lib/admin-auth";
export async function signInAdmin(formData:FormData){
 const email=String(formData.get("email")||"").trim().toLowerCase(),password=String(formData.get("password")||"");
 if(!email||!password)redirect("/admin/login?error=preencha-os-campos");
 if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD||!process.env.ADMIN_SESSION_SECRET||process.env.ADMIN_SESSION_SECRET.length<32)redirect("/admin/login?error=admin-nao-configurado");
 if(!validateAdminCredentials(email,password))redirect("/admin/login?error=credenciais-invalidas");
 const store=await cookies();store.set(COOKIE_NAME,createAdminToken(email),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:SESSION_SECONDS});
 redirect("/admin");
}
export async function signOutAdmin(){const store=await cookies();store.delete(COOKIE_NAME);redirect("/admin/login");}
