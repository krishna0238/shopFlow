import { cookies } from "next/headers";

import { SessionService } from "@/server/services/session.service";

const SESSION_COOKIE_NAME = "shopflow_session";

export async function getCurrentSession() {
const cookieStore = await cookies();
const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

if (!token) {
return null;
}

const session = await SessionService.getSessionByToken(token);

if (!session) {
cookieStore.delete(SESSION_COOKIE_NAME);
return null;
}

return session;
}

export async function getCurrentUser() {
const session = await getCurrentSession();

if (!session) {
return null;
}

return session.user;
}

export async function logoutCurrentSession() {
const cookieStore = await cookies();
const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

if (token) {
await SessionService.deleteSession(token);
}

cookieStore.delete(SESSION_COOKIE_NAME);
}
