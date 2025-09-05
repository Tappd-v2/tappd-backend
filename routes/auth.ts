import { Hono } from "hono";

import { kindeClient, sessionManager } from "../kinde";
import { getUserWithPermissions } from "../kinde"

export const authRoute = new Hono()
  .get("/login", async (c) => {
    const loginUrl = await kindeClient.login(sessionManager(c));
    return c.redirect(loginUrl.toString());
  })
  .get("/register", async (c) => {
    const registerUrl = await kindeClient.register(sessionManager(c));
    return c.redirect(registerUrl.toString());
  })
  .get("/callback", async (c) => {
    const url = new URL(c.req.url);
    await kindeClient.handleRedirectToApp(sessionManager(c), url);
    return c.redirect(process.env.KINDE_SITE_URL! + "/account");
  })
  .get("/logout", async (c) => {
    const logoutUrl = await kindeClient.logout(sessionManager(c));
    return c.redirect(logoutUrl.toString());
  })
  .get("/me", getUserWithPermissions, async (c) => {
    return c.json({ user: c.var.user, permissions: c.var.permissions });
  });

export default authRoute;