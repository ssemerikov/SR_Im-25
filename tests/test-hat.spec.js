const { test, expect } = require('@playwright/test');

test('test hat loading', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('Console Error:', msg.text());
    }
  });

  const assetsToTrack = ['assets/hat.gltf', 'assets/scene.bin', 'assets/headOccluder.glb'];
  const trackedAssets = {};

  page.on('response', response => {
    const url = response.url();
    for (const asset of assetsToTrack) {
      if (url.includes(asset)) {
        trackedAssets[asset] = response.status();
        console.log(`Asset Loaded: ${asset} - Status: ${response.status()}`);
      }
    }
  });

  console.log('Navigating to http://localhost:3000/week9/test.html');
  await page.goto('/week9/test.html');

  // Wait for MindAR to initialize and potentially load models
  console.log('Waiting 5 seconds for MindAR...');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'screenshot.png' });
  console.log('Screenshot taken: screenshot.png');

  console.log('Summary of tracked assets:', trackedAssets);

  // Check if assets were at least attempted to be loaded and returned 200
  // Note: Some assets might not be loaded if MindAR fails early, but we want to see what happens.
  for (const asset of assetsToTrack) {
    if (trackedAssets[asset]) {
      expect(trackedAssets[asset]).toBe(200);
    } else {
      console.warn(`Warning: Asset ${asset} was not requested/intercepted.`);
    }
  }

  if (errors.length > 0) {
    console.log('Errors found during test execution.');
  }
});
