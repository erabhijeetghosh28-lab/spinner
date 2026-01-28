import { createAndUploadQR } from '../lib/qr-generator';

async function main() {
  console.log('Testing createAndUploadQR with code: TEST-123456');
  try {
    const url = await createAndUploadQR('TEST-123456');
    if (url) {
      console.log('✅ QR created successfully:', url);
    } else {
      console.error('❌ QR creation returned NULL (graceful failure)');
    }
  } catch (error) {
    console.error('❌ Unexpected error in test script:', error);
  }
}

main();
// Broadway: Main is not exported, so we just run it.
