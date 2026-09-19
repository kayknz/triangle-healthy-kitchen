# Triangle Healthy Kitchen — Android App (Google Play Ready)

**App ID:** `com.trianglehealthykitchen.app`  
**App Name:** Triangle Healthy Kitchen

This package is hardened so the common failure points (payments, location, status bar, WebView navigation) are already handled in config.

---

## 1. Setup on your computer (one-time)

### Requirements
- Node.js 20 or 22 (LTS recommended)
- Android Studio (latest stable) + Android SDK
- A Google Play Console account (you already have this)

### Commands

```bash
# Unzip and enter the folder
unzip thk-mobile-capacitor.zip
cd thk-mobile

# Install everything
npm install

# Add the Android platform
npx cap add android

# Sync the web app into the native project
npx cap sync android
```

If `npx cap add android` fails with any error, run:
```bash
npx cap add android --force
npx cap sync android
```

---

## 2. Open in Android Studio & add required permissions

```bash
npx cap open android
```

Android Studio will open the `android/` project.

### Mandatory: Add location permission (used by the app)

1. Open `android/app/src/main/AndroidManifest.xml`
2. Inside the `<manifest>` tag (near the top, before `<application>`), add these lines if they are missing:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

3. Save the file.

### Optional but recommended: Cleartext / network security
The config already sets `allowMixedContent: true`. You should be fine.

---

## 3. Test on a real device or emulator

In Android Studio:
- Click the green **Run** button (or Shift+F10)
- Choose a connected phone or an emulator
- The app should open with the dark splash and load the THK website inside

If the screen stays blank:
- Check Logcat for errors
- Make sure you ran `npx cap sync android` after any change to `www/`

---

## 4. Generate the signed App Bundle (AAB) for Google Play

This is the file Google Play requires.

### First time only – create a keystore

In a terminal (outside Android Studio is fine):

```bash
keytool -genkey -v -keystore thk-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias thk
```

- Remember the **password** and **alias** (`thk`)
- Store the `.jks` file somewhere safe (you will need it for every future update)

### In Android Studio

1. Menu → **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Select your keystore (`thk-release-key.jks`)
4. Enter password + alias
5. Choose **release** build
6. Finish

The `.aab` file will be created (usually under `android/app/release/` or shown in the notification).

---

## 5. Upload to Google Play Console

1. Go to https://play.google.com/console
2. Create a new app (or select existing)
   - App name: **Triangle Healthy Kitchen**
   - Default language: English (or Arabic if preferred)
   - App or game: App
   - Free or paid: Free (or Paid if you want)
3. Complete the required sections (they appear as a checklist):
   - **App access** → usually “All functionality available without special access”
   - **Ads** → No (unless you add ads later)
   - **Content rating** → fill the questionnaire
   - **Target audience** → 18+ or as appropriate
   - **News app** → No
   - **Data safety** → you must declare that you collect location, email, etc. (Supabase + payments)
   - **Privacy policy** → you **must** provide a URL. Create a simple page on your website or use a free privacy policy generator.
4. Go to **Production** (or Testing → Internal testing first – recommended)
5. Create a new release → upload the `.aab`
6. Add release notes
7. Review and roll out

### Recommended order
1. Internal testing track first (add your own email as tester)
2. Once it works → Closed testing or Production

---

## 6. Common things that cause rejection / failure (already mitigated)

| Issue                        | Status in this package                  |
|-----------------------------|-----------------------------------------|
| Blank screen on launch      | Dark background + splash configured     |
| Payment page breaks app     | `allowNavigation` for Tap / Stripe / Dibsy |
| Location not working        | Permissions listed + Geolocation plugin |
| Status bar ugly             | StatusBar plugin configured             |
| Keyboard covers inputs      | Keyboard plugin configured              |
| App rejected as “just a website” | Hybrid Capacitor shell (standard accepted path) |

Still do these for higher approval chance:
- Provide good screenshots (phone + tablet)
- Write a proper short description
- Add a privacy policy URL
- Fill Data safety form honestly

---

## Updating the app later

1. Change the web code in Bolt → re-export / rebuild
2. Replace everything inside the `www/` folder
3. Run `npx cap sync android`
4. Generate a new signed AAB with the **same keystore**
5. Upload as a new release in Play Console (increase versionCode)

---

## Need help?

If anything fails at `npm install`, `cap add`, or `cap sync`, copy the exact error message and send it.

Prepared August 2026 – Triangle Healthy Kitchen
