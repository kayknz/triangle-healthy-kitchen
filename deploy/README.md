# trianglehk.com Deployment

The application is configured for strict real-data mode. Demo records and demo credentials remain in source only and are inactive.

## Required access

- SSH or hosting-panel access to the server behind `185.146.167.193`
- DNS access for the `growlastdns.com` nameservers
- Twilio Verify API key, API secret, and Verify Service SID
- A supported Node.js 24 runtime

## Server directories

```text
/var/www/trianglehk              application files
/var/lib/trianglehk             persistent SQLite database
/etc/trianglehk/trianglehk.env  production secrets
```

The secret file must be readable only by the `trianglehk` service account. Start from `.env.production.example`, replace every placeholder, and do not place the completed file inside the application repository.

## Activation order

1. Create the `trianglehk` system user and the directories above.
2. Upload the application to `/var/www/trianglehk`.
3. Install Node.js 24 and Nginx.
4. Install `deploy/trianglehk.service` as `/etc/systemd/system/trianglehk.service`.
5. Store production secrets at `/etc/trianglehk/trianglehk.env` with mode `600`.
6. Start the service and verify `http://127.0.0.1:4173/api/health` on the server.
7. Point both `trianglehk.com` and `www.trianglehk.com` to the server.
8. Issue a Let's Encrypt certificate for both hostnames.
9. Install `deploy/nginx-trianglehk.conf`, validate Nginx, and reload it.
10. Verify `https://trianglehk.com/api/health`, registration OTP, CEO approval, customer login, kitchen jobs, and delivery jobs.

## Production boundary

The supplied service configuration supports a single persistent server. Before accepting customer payment details, connect the chosen payment gateway. Schedule encrypted off-server database backups before onboarding real customers.
