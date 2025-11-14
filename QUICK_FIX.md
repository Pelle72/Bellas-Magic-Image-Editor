# Quick Fix: Your "Hardware not compatible" Error

## What Happened

You tried to create a Hugging Face endpoint for SDXL and got:
```
Hardware not compatible with selected model
```

And it never loaded even after 15 minutes on both AWS and Google Cloud.

## Why It Failed

**You selected a CPU instance instead of a GPU instance.**

SDXL absolutely requires NVIDIA GPUs. CPUs cannot run SDXL because:
- No VRAM (SDXL needs 8-16GB VRAM from GPU)
- No CUDA cores (SDXL needs GPU acceleration)
- 50-100x too slow even if it could run

The error message is the CPU telling you it's not compatible with SDXL.

## How to Fix (3 Steps)

### Step 1: Delete Your Current Endpoint
1. Go to: https://huggingface.co/inference-endpoints
2. Click on your failed endpoint
3. Click "Delete endpoint"
4. Confirm

### Step 2: Create New Endpoint with GPU

Click "Create new endpoint" and use these **exact settings**:

```
Model Repository: stabilityai/stable-diffusion-xl-base-1.0

Cloud Provider: AWS  ← Use AWS or Google Cloud (Azure may not show GPU options)

Region: us-east-1  ← For AWS (or us-central1 for Google Cloud)

Instance Type: GPU [medium]  ← CRITICAL: Must say "GPU" not "CPU"
                              (Or ml.g5.xlarge for AWS)

Advanced Settings:
- Min replicas: 0
- Max replicas: 1
- Scale to zero: 15 minutes
```

### Step 3: Verify Before Creating

Before clicking "Create Endpoint", make sure you see:

✅ Instance description shows:
- "NVIDIA A10" or "NVIDIA T4"
- "24GB VRAM" or "16GB VRAM"
- Price: ~$1.30/hour (not $0.30/hour)

❌ If you see only:
- "4 vCPUs, 16GB RAM" (no GPU mentioned)
- Price: ~$0.30/hour
- **STOP! You selected CPU again!**

## What Should Happen

With GPU instance:
- ✅ Deploys in 5-10 minutes
- ✅ Status becomes "Running"
- ✅ No "Hardware not compatible" error

## Alternative: Use immers.cloud (Easier)

If Hugging Face doesn't show GPU options:

1. Go to: https://en.immers.cloud/ai/stabilityai/stable-diffusion-xl-base-1.0/
2. Click "Rent a GPU server"
3. Choose **RTX 3090** ($0.92/hour) or **A10** ($1.30/hour)
4. Server comes with SDXL pre-installed
5. Get endpoint URL
6. Put it in your app Settings

**Advantage:** Can't accidentally choose CPU - all servers have GPUs

## Key Points

1. **SDXL needs GPU, not CPU**
2. **Select "GPU [medium]" not "CPU [medium]"**
3. **Use Azure (shows GPU options clearly)**
4. **Verify "NVIDIA" appears in instance description**
5. **Alternative: immers.cloud has no CPU options to confuse you**

## Full Documentation

- Detailed guide: [ENDPOINT_HARDWARE_FIX.md](./ENDPOINT_HARDWARE_FIX.md)
- Setup guide: [QUICK_SETUP_SDXL.md](./QUICK_SETUP_SDXL.md)
- All providers: [CLOUD_INFERENCE_PROVIDERS.md](./CLOUD_INFERENCE_PROVIDERS.md)
