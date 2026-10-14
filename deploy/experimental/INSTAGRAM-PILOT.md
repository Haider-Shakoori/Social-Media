# Instagram: single-session, human-assisted private pilot

**Experimental only. Do not treat this as a connected Instagram account or a production integration.**

This opt-in mode uses Playwright solely to open a normal Chromium window on Instagram's login page. The human owner signs in manually, including any 2FA or security prompts. It does **not** collect credentials, scrape account data, persist browser cookies, export sessions, post, automate login, circumvent challenges or publish. Instagram may refuse login from a VPS or automated browser; do not try to bypass those checks. No Meta Developer App is needed to *manually access instagram.com*, but official Meta integration is still required for reliable production account management.

## Security design

- **One session**: operator start script stops the existing read-only browser-lab worker before starting the pilot. Both use the same tested browser image, with single replica, 896 MiB RAM and 1 vCPU limit.
- **One temporary account**: login profile lives in `/tmp` tmpfs and is destroyed when the container exits; it is not mounted to a persistent Docker volume.
- **Private screen**: SSH port forwarding to VPS loopback `127.0.0.1:6081`, not a public web port. Browser access through noVNC requires a separately generated VNC password (the classic VNC protocol uses only the first eight characters).
- **No password visibility**: password entry occurs inside the private remote browser, not in ChatGPT, the SaaS form or an API JSON payload. However the VPS browser necessarily handles the login and the infrastructure operator could access it; this is **not an end-to-end encrypted login** and should be used only with an authorized, disposable test account. Change the test account password if compromised.
- **15-minute deadline**: browser session exits automatically after 15 minutes. Operator should run the down script to restore the normal worker and remove the VNC password file.
- **Restricted destinations**: pilot browser only permits HTTPS resources on Instagram/Meta first-party domains. No access to the VPS private network or arbitrary websites through Playwright route interception.
- **NoVNC does not bypass Instagram security**: if Instagram requests additional verification, complete it yourself or abandon the pilot.

## Steps (authorized operator)

From VPS root shell, after GitHub CI builds the updated image and the operator loads it, run:

```bash
cd /opt/social-media-staging
sh deploy/experimental/instagram-pilot-up.sh
```

On your Windows PC open PowerShell and keep this SSH tunnel running (replace login details with those you already use to reach your VPS):

```powershell
ssh -N -L 6081:127.0.0.1:6081 <VPS_USER>@<VPS_HOST>
```

Now open **http://127.0.0.1:6081/vnc.html?autoconnect=true** in your own browser and use the VNC password obtained from your authorized VPS shell at `/opt/social-media-staging-private/instagram-pilot-vnc.pass` (never paste that password in a chat or commit it). Enter your Instagram login **directly inside the real Instagram page**, complete any checks and observe whether the page opens successfully. This alone is *not an account connection* to the SaaS.

When done (or after the 15-minute timeout):

```bash
cd /opt/social-media-staging
sh deploy/experimental/instagram-pilot-down.sh
```

This restores the normal management heartbeat and read-only tests. No other Docker volumes, providers or clients are changed. Do not expose 5900/6081 to the internet. Do not browse to `https://socials.businessos.af` expecting a VNC screen: there is deliberately no public pilot viewer endpoint.

## Future work

A production-quality flow would require explicit user consent, platform-compliant authorization, tenant/session separation, key management, revocation, audit trails, strong real-time viewer authorization and extensive security review. Browser-assisted login does not itself confer API permission or support reliable Instagram publishing. For unattended client integrations, official Instagram professional-account APIs remain the recommended route.
