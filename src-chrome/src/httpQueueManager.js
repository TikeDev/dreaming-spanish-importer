const STORAGE_KEY = 'submissionQueue';
const MAX_PER_SECOND = 2;
const DELAY_MS = 1000 / MAX_PER_SECOND;

let isProcessing = false;

async function loadQueue() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

async function saveQueue(queue) {
  await chrome.storage.local.set({ [STORAGE_KEY]: queue });
}

async function addToQueue(newItems, apiUrl, bearerToken) {
  const queue = await loadQueue();
  const updatedQueue = [...queue, ...newItems];
  await saveQueue(updatedQueue);

  if (!isProcessing) {
    processQueue(apiUrl, bearerToken); // fire and forget
  }
}

async function processQueue(apiUrl, bearerToken) {
  isProcessing = true;
  let queue = await loadQueue();

  while (queue.length > 0) {
    const item = queue[0];

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + bearerToken,
        },
        body: JSON.stringify(item),
      });

      const responseText = await response.text(); // Read response body as text

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      console.log('[HTTP Queue Manager] ✅ SENT!', item);
      console.log('[HTTP Queue Manager] 📬 Response:', responseText);

      queue.shift(); // remove item from queue
      await saveQueue(queue);
    } catch (err) {
      console.warn('[HTTP Queue Manager] ❌ FAILED TO SEND', item, err.message);
      break; // stop processing if request failed
    }

    await new Promise((res) => setTimeout(res, DELAY_MS));
  }

  isProcessing = false;
}
