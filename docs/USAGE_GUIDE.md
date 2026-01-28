# User Guide

## Getting Started

### First Launch

1. Open the Ecolab Stain ID application
2. Enter your credentials:
   - **Admin users**: `admin` / `Eco@09`
   - **Tester users**: `tester` / `Eco01`
3. Optionally enable biometric authentication for faster future logins

### Biometric Setup

After your first successful login, you can enable Face ID or Touch ID:

1. When prompted "Enable biometric login?", tap **Yes**
2. Your credentials will be securely stored
3. Future logins will only require biometric verification

---

## Analyzing Stains

### Step 1: Capture Images

1. From the home screen, tap **Identify Stain**
2. Position the stain within the center frame guide
3. **First photo (without flash)**: Captures natural color
   - Tap the capture button
   - Hold the device steady
4. **Second photo (with flash)**: Captures texture details
   - Flash will automatically enable
   - Tap the capture button again

### Step 2: View Results

After image capture, the app will:

1. Compress and upload images
2. Process through AI analysis
3. Display results including:
   - **Stain Type**: Identified stain category
   - **Confidence**: AI certainty percentage
   - **Treatment**: Recommended Ecolab product
   - **Instructions**: How to use the product

### Step 3: Provide Feedback

Help improve the AI by providing feedback:

1. Review the analysis result
2. Tap **Was this correct?**
3. Select **Yes** if accurate, or **No** to correct
4. If incorrect, select the actual stain type

---

## Supported Stain Types

| Stain Type | Description | Common Sources |
|------------|-------------|----------------|
| Foundation | Makeup stains | Face makeup, concealer |
| Iron | Rust-colored stains | Iron-rich water, rust |
| Sunscreen | Oily, yellowish stains | Sun protection products |
| Carbon Black | Dark, sooty stains | Soot, graphite, exhaust |
| Mascara | Dark eye makeup stains | Eye cosmetics |
| Lipstick | Waxy colored stains | Lip cosmetics |
| Blood | Organic protein stains | Blood spots |
| Ink/Dye | Penetrating color stains | Pens, hair dye |
| Food Soil | Grease-based stains | Cooking oils, food |
| Dirt | Particulate stains | Soil, mud |
| Body Soil | Oily skin stains | Lotions, body oils |

---

## Gallery & History

### Viewing Past Analyses

1. From home screen, tap **Gallery**
2. Browse analyses organized by stain type
3. Tap any entry to view full details

### Gallery Features

- **Folder view**: Organized by stain type
- **Timestamps**: When each analysis occurred
- **Accuracy tracking**: Feedback status for each entry
- **Full-screen view**: Pinch to zoom on images

---

## Statistics Dashboard

### Accessing Statistics

1. From home screen, tap **Statistics**
2. View overall accuracy metrics
3. See breakdown by stain type

### Available Metrics

- **Overall Accuracy**: Percentage of correct predictions
- **By Stain Type**: Accuracy for each category
- **Total Analyses**: Number of stains analyzed
- **Feedback Rate**: Percentage of analyses with feedback

### Admin Features

Admin users can:
- Reset all statistics (requires password)
- View detailed accuracy breakdowns
- Export feedback data

---

## Settings

### Language Selection

1. Go to **Settings**
2. Tap **Language**
3. Select English or Spanish
4. Changes apply immediately

### AI Model Selection (Admin Only)

1. Go to **Settings** or **Models**
2. Choose between:
   - **Claude Sonnet**: Higher accuracy (92%)
   - **Gemma**: Alternative model (85%)

### Connection Testing

1. Go to **Settings**
2. Tap **Test Connection**
3. Verify backend connectivity
4. Green = Connected, Red = Connection issue

### Logout

1. Go to **Settings**
2. Tap **Logout**
3. Confirm to end session

---

## Tips for Best Results

### Image Capture Tips

1. **Center the stain**: Keep it within the frame guide
2. **Good lighting**: Ensure adequate ambient light for no-flash photo
3. **Steady hands**: Avoid blur by holding device still
4. **Close-up**: Get close enough to see stain details
5. **Clean lens**: Wipe camera lens before capturing

### When Results Seem Incorrect

1. Check image quality - retake if blurry
2. Ensure good lighting conditions
3. Position stain properly in frame
4. Try with different lighting angles
5. Always provide feedback to improve AI

---

## Troubleshooting

### "Analysis taking too long"

- Check internet connection
- Wait up to 60 seconds for cold start
- App will retry automatically (up to 12 times)

### "Camera not working"

- Check camera permissions in device settings
- Restart the app
- Ensure no other app is using camera

### "Cannot connect to server"

- Check WiFi or cellular connection
- Use Settings > Test Connection
- Try again in a few minutes

### "Biometric login failed"

- Ensure biometric is enabled on device
- Re-enter credentials manually
- Re-enable biometric in settings

---

## Privacy & Data

- Images are processed but not permanently stored on servers
- Feedback data is stored locally on your device
- No personal tracking or analytics
- Credentials encrypted with SecureStore
