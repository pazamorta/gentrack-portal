<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jXJ3j_-bhmMEOEgnJybM4YAOBhyHbxne

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

3. Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   Get your API key from: https://aistudio.google.com/apikey

4. Run the app:
   ```bash
   npm run dev
   ```

**Important:** Never commit `.env.local` to git. It's already in `.gitignore` to protect your API key.

## GitHub Pages Deployment

This project uses GitHub Actions to automatically build and deploy to GitHub Pages. The API key is injected during the build process using GitHub Secrets.

### Setting up GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GEMINI_API_KEY`
5. Value: Your Gemini API key
6. Click **Add secret**

The GitHub Actions workflow will automatically:
- Build the app with the API key from secrets
- Deploy to GitHub Pages on every push to `main`

### Manual Deployment

You can also deploy manually using:
```bash
npm run deploy
```

Note: Manual deployment won't include the API key unless you have `.env.local` set up locally.
