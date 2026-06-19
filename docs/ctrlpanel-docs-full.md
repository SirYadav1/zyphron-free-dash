# CtrlPanel.gg Documentation - Complete Content

**Source:** https://ctrlpanel.gg/docs
**Version:** 1.2.x (Latest)
**Extracted:** June 15, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Configuration](#basic-configuration)
3. [Migration](#migration)
4. [Backup & Restore](#backup--restore)
5. [Themes](#themes)
6. [Uninstall](#uninstall)
7. [Updating from 1.2.x](#updating-from-12x)
8. [Updating from 1.1.x](#updating-from-11x)

---

## Introduction

Welcome to the CtrlPanel.gg documentation. Here you'll find guides for installation, updating, migration and other useful articles and pages.

### What is CtrlPanel?

CtrlPanel is a user-friendly management app built to give clients a simple way to control their Pterodactyl servers. It includes a flexible billing system with support for hourly to annual plans - offering both scalability and ease of use.

### Features

- Server creation using **plans**
- Billing options ranging from **hourly to annual**
- **Automatic suspension** of servers when clients don't have enough credits to renew
- Per-user server limit (server slots)
- **Discord verification** and **role assignment** with **automatic invite** to your Discord server
- One account per IP limit
- **Referral** and **partner** systems
- **Coupons** for credit rewards and **discounts** for product discounts*
- **Built-in** ticket system
- Integrated support for popular payment gateways (**PayPal**, **Stripe**, **Mollie**, and **MercadoPago**)
- **Docker** image and docker compose **support**
- **API** support
- **Egg** support
- And much more

*\* Coupons apply to store products such as server slots and credit purchases. They do **not** apply to server plans.*

### Want to try first?

You can visit our demo panel [here](https://demo.ctrlpanel.gg)

### Compatibility

| OS | Version | Supported | Notes |
|---|---|---|---|
| Debian | 11 | ⭕ | EOL (End-of-life) |
| Debian | 12 | ✅ | |
| Debian | 13 | ✅ | |
| Ubuntu | 20.04 | ⭕ | EOL (End-of-life) |
| Ubuntu | 22.04 | ✅ | |
| Ubuntu | 24.04 | ✅ | |
| RHEL-based systems¹ | ❓ | ❓ | Not tested |
| Windows | ❓ | ❓ | Not tested |

*¹ RHEL, Rocky Linux, AlmaLinux, CentOS*

---

## Basic Configuration

We'll cover the basics of configuring CtrlPanel. Where to get what, and how to configure it. We'll also include a minimal debug checklist for common issues.

### Images and icons

- **Favicon:** must be in 64x64 ico format
  - Displayed in the browser's address bar as a small icon representing your site
- **Icon:** 1:1 aspect ratio recommended
  - Displayed in your site's SEO and embed previews, as well as in the top-right corner next to the name
- **Login-page Logo**
  - Displayed above the login form of your panel

> **INFO:** Updating the images may take some time. To speed up this, clear your browser cache and Cloudflare cache if you're using it.

### reCAPTCHA

CtrlPanel lets you choose between three CAPTCHA options: reCAPTCHA v2, reCAPTCHA v3, and Cloudflare Turnstile. Be careful when selecting the version and entering the keys, otherwise, you may have to disable CAPTCHA manually to regain access.

#### reCAPTCHA v2 ("I'm not a robot" Checkbox)

The classic CAPTCHA that asks users to check a box and solve image challenges.
To get reCAPTCHA v2 keys, go to the reCAPTCHA admin creation page, fill in the required details, and select `Challenge (v2)` with the `"I(')m not a robot" Checkbox` option. Once done, you'll see your `site key` and `secret key`. Copy both and enter them in your CtrlPanel settings.

#### reCAPTCHA v3

An invisible CAPTCHA that evaluates users using a score based on their behavior on the page.
The process for obtaining the keys is the same as for reCAPTCHA v2, but you need to select the `Score based (v3)` option instead.

#### Cloudflare Turnstile

Cloudflare's alternative to reCAPTCHA.
Follow the official instructions on the Cloudflare website to obtain your `site key` and `secret key`.

### SMTP Configuration

In order for your panel to send email verification messages to users, you'll need to configure an SMTP server.
To do that, start by choosing an SMTP provider - you can find plenty with a quick Google search. Once you set up your domain and/or mailbox, you'll need to fill in the following details:

- **Mail Host:** Depends on your provider. Check their documentation.
- **Mail Port:** Most commonly 465 for SSL, 587 for (START)TLS. Refer to your provider's docs.
- **Mail Username:** Usually your email address, but some providers use a generated name.
- **Mail Password:** The account password. Some providers require an application-specific key instead.
- **Mail Encryption:** As mentioned above, this depends on your provider's mail server settings. Refer to their documentation.
- **Mail From Address:** Almost always the email that will be used to send messages.
- **Mail From Name:** The name that will appear to your clients in their email client.

### Discord

Allows you to configure Discord verification. After completing it, the user can be automatically added to your Discord server. The bot is also used to assign a verified role and a client role.

1. Go to https://discord.com/developers/applications and create a new application. You need to obtain the bot token, application ID, and application secret.
2. Then go to the OAuth2 tab and add redirect URL like https://your.ctrlpanel.url/auth/callback.
3. Don't forget to invite the bot to your server in advance so it can assign roles and add users.
4. To do that, open the following link in your browser: https://discord.com/api/oauth2/authorize?client_id=<CLIENT_ID_HERE>&permissions=8&scope=bot. Make sure to replace `<CLIENT_ID_HERE>` with your bot's ID you got earlier.

### Payment Configuration

> **DANGER:** Creating a hosting is a serious responsibility, including legal liability - it requires solid knowledge of network infrastructure, Linux systems, and related technologies. If you don't know what you're doing, don't do it.

We also reserve the right to deny you support on our Discord server if you lack at least basic technical knowledge or understanding of what you're doing.

To accept payments, you need to set up one of the available payment gateways or write an addon for required one yourself.

#### PayPal

To accept live payments through PayPal, you need a business account. Personal accounts only support Sandbox payments.

**Live payments:**
1. Go to Paypal Developer Portal.
2. Select Live in the top left corner.
3. Click Create App button.
4. Copy your Client ID and Secret key.
5. Scroll down to "Webhooks" section.
6. Click Add Webhook button.
7. Set webhook URL to https://your.ctrlpanel.url/payment/PayPalWebhook and event types to All Events, or if you want fine-grained permissions:
   - Checkout -> Checkout order approved
   - Payments & Payouts -> Payment capture completed
   - Payments & Payouts -> Payment capture pending
   - Payments & Payouts -> Payment capture denied
   - Payments & Payouts -> Payment capture declined
   - Payments & Payouts -> Payment capture refunded
   - Payments & Payouts -> Payment capture reversed
8. Copy your Webhook ID
9. Paste the copied data into the corresponding fields in the CtrlPanel settings.

**Sandbox payments:**
1. Go to Paypal Developer Portal.
2. Select Sandbox in the top left corner.
3. Click Create App button.
4. Copy your Client ID and Secret key.
5. Scroll down to "Webhooks" section.
6. Click Add Webhook button.
7. Set webhook URL to https://your.ctrlpanel.url/payment/PayPalWebhook and event types to All Events, or if you want fine-grained permissions:
   - Checkout -> Checkout order approved
   - Payments & Payouts -> Payment capture completed
   - Payments & Payouts -> Payment capture pending
   - Payments & Payouts -> Payment capture denied
   - Payments & Payouts -> Payment capture declined
   - Payments & Payouts -> Payment capture refunded
   - Payments & Payouts -> Payment capture reversed
8. Copy your Webhook ID
9. Paste the copied data into the corresponding fields in the CtrlPanel settings.

Now, go to your CtrlPanel root directory (/var/www/ctrlpanel/) and open your .env file. Find APP_ENV variable, and change it from production to local.
You can now make test payments using PayPal Sandbox account.

#### Stripe

To use Stripe as your payment gateway, you first have to setup a "company" on Stripe's dashboard which you can find here

To setup Stripe, go to the Developer page and click on API Keys. You only need the Secret key in order to use Stripe as your payment gateway. Once you have the secret key go to your Ctrlpanel setup and paste the secret into the Secret Key section.

Now, you will need to setup a Stripe Webhook in order to accept payments that are not 100% instantly confirmed by stripe (Klarna, Bank-Transfer etc.).
To do so, click on Webhooks and add an endpoint.
The endpoint route would look something like this: https://your.ctrlpanel.url/payment/StripeWebhooks. Change the your.ctrlpanel.url to your Ctrlpanel setup link.
Choose the payment_intent.succeeded, payment_intent.processing and payment_intent.payment_failed events to be sent to your WebhookRoute.
After the webhook creation, you need to get the endpoint secret and copy paste it to your Ctrlpanel payment settings. The endpoint secret can be found in the Webhook Overview page.

Just like Paypal, you can change it from Live to Sandbox and vice-versa in case you want to test to make sure that your payments are working correctly.

#### Mollie

Unfortunately, we don't have information on how to configure this payment gateway. Know how and want to help? Let us know!

#### MercadoPago

Unfortunately, we don't have information on how to configure this payment gateway. Know how and want to help? Let us know!

---

## Migration

Let's talk about migrating your panel between servers. It doesn't matter whether you're switching hosting providers or just moving from localhost to your own custom domain.

> **INFO:** During migration, do not install a newer or older version of CtrlPanel on the new server. Always install the exact same version as your current one. Otherwise, you may run into compatibility issues.

### Backup your database and .env file

> **DANGER:** Never lose your .env file, more specifically, your APP_KEY. Without it, you'll lose almost all data that Laravel encrypts in the database using this key.

We have a separate guide on how to back up your database and where to find the .env file. You can find it [here](https://ctrlpanel.gg/docs/guides/backup).

That's all we need - just SQL file of your database, and .env file with your APP_KEY.

### Preparing new location

Follow the default installation guide and complete all steps up to the final one - "Navigate to the installer". Once you reach that point, come back here.

### Database migration

Now we need to import the data from your .sql file into the database on your new server. You can follow [this](https://ctrlpanel.gg/docs/guides/backup) guide to do it.

After that, place your old .env file into the CtrlPanel root directory (/var/www/ctrlpanel/).
Update the database password or other values if needed, such as APP_URL or APP_NAME.

### Lock installer

Now create an empty install.lock file in the CtrlPanel root directory (/var/www/ctrlpanel/) to disable installer since we don't need it anymore.

```bash
touch /var/www/ctrlpanel/install.lock
```

### Finish

Congratulations! You can now try opening your CtrlPanel page in the browser and check if your data was successfully migrated.

---

## Backup & Restore

All important data is stored in the database. This includes all servers, users, and other information.
It's important to keep backups of your database to ensure that you can restore your panel if something goes wrong.

### How to create database backup

You can use MySQL dump to backup your database.
This command will create a backup file in the /var/www/ctrlpanel/ folder.

```bash
# If you use MySQL server
mysqldump -u root -p ctrlpanel > /var/www/ctrlpanel/backup.sql

# If you use MariaDB server
mariadb-dump -u root -p ctrlpanel > /var/www/ctrlpanel/backup.sql
```

### How to restore database backup

To restore a backup, you need a fresh database. If you already have a database, you can use the following command to drop it.

> **WARNING:** Warning, this will delete all CtrlPanel related data! Make sure your database is backed up before continuing.

```bash
# If you use MySQL server
mysql -u root -p ctrlpanel -e "DROP DATABASE ctrlpanel"

# If you use MariaDB server
mariadb -u root -p ctrlpanel -e "DROP DATABASE ctrlpanel"
```

First you need to create the database and reassign user permissions to it:

```bash
# If you use MySQL server
mysql -u root -p

# if you use MariaDB server
mariadb -u root -p
```

```sql
CREATE DATABASE ctrlpanel;

GRANT ALL PRIVILEGES ON ctrlpanel.* TO 'ctrlpaneluser'@'127.0.0.1';

FLUSH PRIVILEGES;

exit
```

Now you can restore the backup:

```bash
# If you use MySQL
mysql -u root -p ctrlpanel < /var/www/ctrlpanel/backup.sql

# If you use MariaDB
mariadb -u root -p ctrlpanel < /var/www/ctrlpanel/backup.sql
```

If you have a backup from an older version of CtrlPanel, you have to migrate the database to the latest version.

```bash
cd /var/www/ctrlpanel

sudo php artisan migrate --seed --force
```

### Automatically backup your database

You can automatically back up your database every day at midnight, for example. First, create a read only user for the database.

```bash
# Create backup directory
mkdir -p /var/www/ctrlpanel/backups
```

```bash
# If you use MySQL server
mysql -u root -p

# If you use MariaDB server
mariadb -u root -p
```

```sql
CREATE USER 'ctrlpanelbackupuser'@'127.0.0.1' IDENTIFIED BY 'USE_YOUR_OWN_PASSWORD';

GRANT LOCK TABLES, SELECT ON ctrlpanel.* TO 'ctrlpanelbackupuser'@'127.0.0.1';

FLUSH PRIVILEGES;

exit
```

Then create a cronjob to run the following command at midnight. Run `crontab -e` and add the following line:

```bash
# If you use MySQL server
0 0 * * * mysqldump -u ctrlpanelbackupuser --password=<USE_YOUR_OWN_PASSWORD> --single-transaction --quick --lock-tables=false ctrlpanel > /var/www/ctrlpanel/backups-$(date +\%F).sql

# if you use MariaDB server
0 0 * * * mariadb-dump -u ctrlpanelbackupuser --password=<USE_YOUR_OWN_PASSWORD> --single-transaction --quick --lock-tables=false ctrlpanel > /var/www/ctrlpanel/backups-$(date +\%F).sql
```

This will create a backup at /var/www/ctrlpanel/backups-<date>.sql every day at midnight. Every file will have the date when it was made in the filename, so you can also resolve issues that happened a few days ago.

### Application key

> **DANGER:** Never lose your .env file, more specifically, your APP_KEY. Without it, you'll lose almost all data that Laravel encrypts in the database using this key.

#### Backup the application key

The app key is stored in the APP_KEY variable inside your .env file. You can either save the entire .env file (easier and recommended) or just the value of the variable separately.

Open your .env:

```bash
nano /var/www/ctrlpanel/.env
```

Store file content and/or APP_KEY in a safe place!

#### Restore the application key

After you have reinstalled the panel go back into the .env:

```bash
nano /var/www/ctrlpanel/.env
```

Now, paste your old file content or just APP_KEY variable.

---

## Themes

> **WARNING:** There have been reports that this section doesn't work. It is currently unmaintained, and the information here may be outdated.

### Create a theme

#### Basic setup

Ctrlpanel.gg uses the module laravel-themer.
To start creating your own theme run the following command:

```bash
php artisan make:theme
```

Once you do this, the script will ask you some basic questions and will set up a base for you to start with.

#### Bladefiles & layout

Now you can find a copy of the original default theme files in the new folder the command above just created.
You should start by modifying those two files first because those are responsible for the main layout of the dashboard.

- `/themes/<YourThemeName>/views/layouts/app.blade.php`
- `/themes/<YourThemeName>/views/layouts/main.blade.php`

#### CSS

You can create a new folder in `/themes/<YourThemeName>/app.css` with your own custom CSS.
Import the CSS in your blade files with the following line

```html
<link rel="stylesheet" href="{{ asset('themes/<YourThemeName>/app.css') }}">
```

and remove the line

```php
@vite('themes/default/sass/app.scss')
```

#### Sharing the theme (Optional)

Make sure you include both the `/themes` and `/public/themes` folder and a file to guide other users on how to install your theme.
Keep the installation instructions as simple as possible and verify you didn't forget anything, no matter how small the step might seem to you.

You can upload your theme to our Market or share it however you like.

---

## Uninstall

> **WARNING:** You will lose all data that you have stored in your Ctrlpanel.

### Before you start

- This will only work if you have carefully followed our documentation.
- You might need to modify the commands to fit your installation.

### Stop everything

Before deleting anything, you need to stop CtrlPanel and all of its services.

```bash
cd /var/www/ctrlpanel

sudo php artisan down
```

```bash
sudo systemctl stop ctrlpanel
```

### Delete files

#### Service and cronjob

You have to stop and remove the services and cronjobs.

```bash
sudo systemctl stop ctrlpanel

sudo systemctl disable ctrlpanel

sudo rm /etc/systemd/system/ctrlpanel.service

sudo systemctl daemon-reload

sudo systemctl reset-failed
```

To open crontab, please run `crontab -e` and remove the following configuration from crontab.

```
* * * * * php /var/www/ctrlpanel/artisan schedule:run >> /dev/null 2>&1
```

#### Webconfig and SSL certificates

Once you've done this, you need to remove the webserver configuration and restart it.

**Nginx:**
```bash
sudo unlink /etc/nginx/sites-enabled/ctrlpanel.conf

sudo rm /etc/nginx/sites-available/ctrlpanel.conf

sudo systemctl reload nginx
```

Don't forget to delete SSL certificates.

```bash
sudo certbot delete --cert-name <Your Domain>
```

#### Database and User

Now that you've deleted the webserver files, you need to remove the database and user:

**MySQL:**
```bash
mysql -u root -p

DROP DATABASE ctrlpanel;

DROP USER 'ctrlpaneluser'@'127.0.0.1';

FLUSH PRIVILEGES;

exit
```

#### Files

Now you need to remove the files.

```bash
sudo rm -rf /var/www/ctrlpanel
```

### Optional

#### Extra Dependency

CtrlPanel should now be uninstalled. If you want to fully clean your server, please run the following commands. You need to uninstall PHP. Make sure to check your PHP version before you do this.

```bash
sudo apt remove php8.3-{intl,redis}
```

#### Pterodactyl API Key

Login to your Pterodactyl panel and go to the admin page.
Then go to the API tab (`/admin/api`) and delete the key you made for CtrlPanel.

---

## Updating from 1.2.x

> **INFO:** This guide is for updates 1.2.x -> 1.2.x

If you want to upgrade from version 1.1.x to 1.2.x, please follow 1.1.x update guide.

> **DANGER:** Always backup your database and any code changes before updating! It's better to not need them, than to lose everything when you do. We've explained how to do that here.

Without a backup, you won't be able to roll back without losing all your data.

### Enable Maintenance Mode

```bash
cd /var/www/ctrlpanel

php artisan down
```

### Pulling the New Files

```bash
git stash

git pull

chmod -R 755 /var/www/ctrlpanel
```

### Update Dependencies

```bash
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader
```

### Updating the Database

```bash
php artisan migrate --seed --force
```

### Clear Compiled Template Cache

```bash
php artisan view:clear

php artisan config:clear
```

### Set Permissions

```bash
# If using NGINX or Apache (not on CentOS):
chown -R www-data:www-data /var/www/ctrlpanel/

# If using NGINX on CentOS:
chown -R nginx:nginx /var/www/ctrlpanel/

# If using Apache on CentOS
chown -R apache:apache /var/www/ctrlpanel/
```

### Restarting Queue Workers

After every update, you should restart the queue worker to ensure that the new code is loaded in and used.

```bash
php artisan queue:restart
```

### Disable Maintenance Mode

```bash
php artisan up
```

### Disclaimer

If you notice any bugs 🐛 or would like something to be improved or added, let us know by making a GitHub Issue.
For any major security risk, create GitHub vulnerability report. Avoid discussing vulnerabilities in public chats, and also do not create reports on public trackers!

---

## Updating from 1.1.x

> **INFO:** This guide is for updates 1.1.x -> 1.2.x

If you want to upgrade from version 1.2.x to 1.2.x, please follow 1.2.x update guide.

> **DANGER:** Always backup your database and any code changes before updating! It's better to not need them, than to lose everything when you do. We've explained how to do that here.

Without a backup, you won't be able to roll back without losing all your data.

### Enable Maintenance Mode

```bash
cd /var/www/ctrlpanel

php artisan down
```

### Pulling the New Files

> **WARNING:** This release includes a refactor of payment gateways. Now you need to add a Webhook ID for PayPal and add new events to Stripe Webhook for correct payment processing. You can find gateway configuration guides here

Also, please double-check referral and partner rewards, email/discord confirmation rewards, initial credits, product prices, voucher and coupon values.

```bash
git stash

git pull

chmod -R 755 /var/www/ctrlpanel
```

### Update Dependencies

```bash
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader
```

### Updating the Database

```bash
php artisan migrate --seed --force
```

### Clear Compiled Template Cache

```bash
php artisan cache:clear

php artisan route:clear

php artisan view:clear

php artisan config:clear

php artisan settings:clear-cache
```

### Rebuild Settings Cache via UI

After clearing caches, open your application Settings, navigate to the User tab, and click Save. This refreshes the settings cache for normal credit calculation runtime behavior.

### Set Permissions

```bash
# If using NGINX or Apache (not on CentOS):
chown -R www-data:www-data /var/www/ctrlpanel/

# If using NGINX on CentOS:
chown -R nginx:nginx /var/www/ctrlpanel/

# If using Apache on CentOS
chown -R apache:apache /var/www/ctrlpanel/
```

### Restarting Queue Workers

After every update, you should restart the queue worker to ensure that the new code is loaded in and used.

```bash
php artisan queue:restart
```

### Disable Maintenance Mode

```bash
php artisan up
```

### Disclaimer

If you notice any bugs 🐛 or would like something to be improved or added, let us know by making a GitHub Issue.
For any major security risk, create GitHub vulnerability report. Avoid discussing vulnerabilities in public chats, and also do not create reports on public trackers!

---

*Document compiled from CtrlPanel.gg documentation (https://ctrlpanel.gg/docs)*
