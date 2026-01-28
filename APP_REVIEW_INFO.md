# App Store Review Information

## DEMO ACCOUNT CREDENTIALS

**Copy this information to App Store Connect → App Review Information → Sign-in Required**

### Admin Account (Full Access)
- **Username:** admin
- **Password:** Eco@09
- **Role:** Administrator with access to all features including AI model selection, statistics reset, and gallery management

### Tester Account (Standard Access)
- **Username:** tester  
- **Password:** Eco01
- **Role:** Standard user with access to stain identification, gallery, and statistics viewing

## APP FEATURES TO TEST

1. **Stain Identification**
   - Take a photo of a stain
   - AI analyzes and identifies the stain type
   - Provides treatment recommendations

2. **Gallery**
   - View history of analyzed stains
   - See images, results, and timestamps
   - Filter by date or stain type
   - Flag problematic results for review

3. **Statistics**
   - View analysis accuracy metrics
   - See usage statistics
   - Admin can reset statistics with password

4. **Settings**
   - Language selection (English/Spanish)
   - AI Model selection (Admin only)

5. **Authentication**
   - Login with username/password
   - Face ID/Touch ID support (on enrolled devices)
   - Logout functionality

## PRIVACY & TRACKING INFORMATION

### Data Collection Statement
This app does NOT track users for advertising or share data with third-party data brokers.

**What we collect:**
- Stain images (stored locally on device)
- Analysis results (stored locally on device)
- User preferences (language, selected AI model)
- Authentication state (logged in user)

**What we DON'T do:**
- NO advertising or marketing tracking
- NO cross-app or cross-website tracking
- NO data sharing with data brokers
- NO user profiling for advertising
- NO third-party analytics (Google Analytics, Facebook SDK, etc.)

**Data Storage:**
- All data is stored locally using AsyncStorage and SecureStore
- No personal data is transmitted to external servers for tracking purposes
- The app communicates with our backend API only for stain analysis using AI

### App Store Connect Privacy Settings

**Update these privacy labels in App Store Connect:**

1. Go to App Store Connect → Your App → App Privacy
2. Update data collection to reflect:
   - **Data Not Collected** for tracking purposes
   - **Data Used for App Functionality Only**: Images (for stain analysis), User Content
   - **Data Not Linked to User**: All data is local, not associated with identity
   - **Tracking**: NO (Do not track)

## REVIEW NOTES

**Copy this to App Store Connect → App Review Information → Notes:**

---

Thank you for reviewing StainID - Stain Identification System.

**DEMO CREDENTIALS:**
- Username: admin
- Password: Eco@09

**HOW TO TEST THE APP:**

1. **Login**: Use the credentials above to access the app
2. **Main Feature**: Tap "Identify a Stain" → Allow camera access → Take a photo of any stained surface
3. **View Results**: After a few seconds, you'll see AI analysis with stain type and treatment recommendations
4. **Gallery**: Tap "Gallery" button to see history of analyzed stains
5. **Statistics**: Tap "Stats" button to view analytics and accuracy metrics
6. **Settings**: Tap the language button (top right on home screen) to change language to Spanish
7. **AI Models** (Admin feature): Tap "Models" button to see available AI models

**PRIVACY & TRACKING:**
This app does NOT track users for advertising purposes. All data is stored locally on the device. The app only communicates with our backend API for stain image analysis using AI (OpenAI GPT-4 Vision or similar). No personal data is collected, and no third-party tracking SDKs are used.

We have updated our App Privacy Information in App Store Connect to accurately reflect that this app does not track users.

**IMPORTANT NOTES:**
- This is an enterprise tool for Ecolab staff to identify stains and recommend cleaning products
- All image analysis is done via our secure backend API
- No advertising, no analytics, no user tracking
- The app works on both iPhone and iPad

Please let us know if you need any additional information.

---

## STEPS TO RESOLVE REJECTION

### Step 1: Update App Privacy in App Store Connect

1. Log in to App Store Connect
2. Go to your app → **App Privacy**
3. Click **Edit** next to Data Collection
4. Make sure the following is set:
   - **"Does this app collect data from users?"** → Select appropriate options:
     - Photos/Videos: Yes (for app functionality - stain analysis)
     - User Content: Yes (for app functionality - analysis results)
   - **For each data type selected, configure:**
     - **Linked to User?** → NO (data is local, not linked)
     - **Used for Tracking?** → NO
     - **Purpose:** App Functionality only
5. **Important:** Under **"Tracking"** section:
   - Answer: **"No, this app does not collect data for tracking purposes"**
6. Save changes

### Step 2: Add Demo Account in App Store Connect

1. Go to your app → **App Information** → **App Review Information**
2. Check **"Sign-in required"** checkbox
3. Enter demo credentials:
   - **Username:** admin
   - **Password:** Eco@09
4. In the **Notes** field, paste the review notes from above
5. Save changes

### Step 3: Resubmit

1. Create a new version or update existing pending version
2. Make sure App Privacy and Demo Account info are saved
3. Submit for review
4. In the submission notes, briefly mention:
   - "Updated privacy information to reflect no tracking"
   - "Provided demo account credentials in App Review Information"

## RESPONSE TO APPLE'S REJECTION

**Copy this response when resubmitting in App Store Connect:**

---

Dear App Review Team,

Thank you for your feedback. We have addressed both issues:

**Regarding Tracking (Guideline 5.1.2):**
We have updated our App Privacy Information in App Store Connect to accurately reflect that this app does NOT track users. This app:
- Does NOT collect data for advertising purposes
- Does NOT share data with data brokers
- Does NOT use third-party tracking SDKs (no Google Analytics, Facebook SDK, etc.)
- Only communicates with our backend API for stain image analysis functionality

All user data (images, analysis results, preferences) is stored locally on the device and is not used for tracking purposes.

**Regarding Demo Account (Guideline 2.1):**
We have provided demo account credentials in the App Review Information section:
- Username: admin
- Password: Eco@09

This account has full access to all features including stain identification, gallery, statistics, and settings.

We have also added detailed instructions in the Review Notes to help you test all features of the app.

Thank you for your time and consideration.

---
