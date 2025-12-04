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
