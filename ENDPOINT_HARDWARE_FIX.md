# Fix: "Hardware not compatible with selected model" Error

## Problem

When creating a Hugging Face Inference Endpoint with `stable-diffusion-xl-base-1.0`, you get this error:

```
Hardware not compatible with selected model
```

And the model never loads even after waiting 15+ minutes.

**Root Cause:** You selected a **CPU instance** instead of a **GPU instance**. 

The error message is coming from the CPU trying to load SDXL and failing because:
- ❌ CPUs don't have the VRAM needed for SDXL (SDXL needs 8-16GB VRAM)
- ❌ CPUs don't have CUDA cores for GPU acceleration
- ❌ SDXL requires NVIDIA GPU hardware to run
- ❌ CPU inference would take 50-100x longer (minutes instead of seconds)

**SDXL absolutely requires NVIDIA GPUs. It cannot run on CPUs.**

---

## ✅ Solution: Select a GPU Instance (Not CPU)

### Step 1: Delete Your Current Endpoint

Your current endpoint is using a CPU instance and will never work.

1. Go to [Hugging Face Endpoints](https://huggingface.co/inference-endpoints)
2. Find your failed endpoint
3. Click on it
4. Click **"Delete endpoint"**
5. Confirm deletion
6. You won't be charged for failed deployments

### Step 2: Create New Endpoint with GPU

Click "Create new endpoint" and configure:

**Model:**
```
stabilityai/stable-diffusion-xl-base-1.0
```

**Cloud Provider (IMPORTANT):**

Choose **Azure** (most reliable for GPU instances):
- Cloud Provider: **Azure**
- Region: **West Europe** or **East US 2**

**Instance Type (CRITICAL - This is where you made the mistake):**

When you see the compute/instance selection:

❌ **DO NOT SELECT THESE (CPU instances):**
- "CPU [small]", "CPU [medium]", "CPU [large]"
- Any option that says "CPU" in the name
- Options showing only vCPUs and RAM (no GPU mentioned)

✅ **DO SELECT THESE (GPU instances):**
- **"GPU [small]"** - T4 GPU (if available)
- **"GPU [medium]"** - ⭐ **RECOMMENDED** (A10 or T4 GPU)
- **"GPU [large]"** - A100 GPU (more expensive)

**How to verify it's a GPU instance:**

The instance description should show:
```
✅ CORRECT Example:
Instance: GPU [medium]
Hardware: 1x NVIDIA A10
VRAM: 24GB
Price: ~$1.30/hour
```

NOT this:
```
❌ WRONG Example:
Instance: CPU [medium]  
Hardware: 4 vCPUs, 16GB RAM
Price: ~$0.30/hour
```

**If you see only "CPU" options and no "GPU" options:**
- Try different region (West Europe, East US 2, UK South)
- Make sure billing is set up: [Hugging Face Billing](https://huggingface.co/settings/billing)
- Try different cloud provider (Azure usually has best GPU availability)

**Auto-scaling settings:**
- Min replicas: **0** (saves money)
- Max replicas: **1**
- Scale to zero timeout: **15 minutes**

### Step 3: Create and Wait

1. Click **"Create Endpoint"**
2. Wait **5-10 minutes** (not 15+)
3. Status should go: "Building" → "Running"

**If it works:**
- ✅ Status becomes "Running"
- ✅ Takes only 5-10 minutes
- ✅ No "Hardware not compatible" error

**If it fails again:**
- See alternative solutions below

---

## How to Identify GPU vs CPU Instances

### Signs you selected CPU (WRONG - will fail):
- ❌ Instance name contains "CPU"
- ❌ Description only shows: "4 vCPUs, 16GB RAM"
- ❌ No mention of "NVIDIA", "GPU", "T4", "A10", or "A100"
- ❌ No VRAM mentioned
- ❌ Very low price ($0.10-$0.40/hour)
- ❌ Error: "Hardware not compatible with selected model"
- ❌ Deployment never completes

### Signs you selected GPU (CORRECT - will work):
- ✅ Instance name contains "GPU"
- ✅ Description shows: "1x NVIDIA T4" or "1x NVIDIA A10"
- ✅ Shows VRAM: "16GB VRAM" or "24GB VRAM"
- ✅ Price is $0.60-$1.30/hour
- ✅ Deployment completes in 5-10 minutes
- ✅ Status becomes "Running"

---

## Cloud Provider Specific Instructions

### Option 1: Azure (RECOMMENDED - Easiest)

**Why Azure:**
- Shows GPU options clearly
- Best GPU availability
- Most reliable for SDXL

**Steps:**
1. Cloud Provider: **Azure**
2. Region: **West Europe** (or East US 2, UK South)
3. Instance Type dropdown - select **"GPU [medium]"**

You should see something like:
```
GPU [small] - NVIDIA T4, 16GB VRAM
GPU [medium] - NVIDIA A10, 24GB VRAM ← Select this
GPU [large] - NVIDIA A100, 40GB VRAM
```

**If you don't see "GPU" options in the dropdown:**
- Try different Azure region
- Make sure billing is enabled
- Azure might be out of GPU capacity in that region

### Option 2: AWS (If Azure doesn't work)

**Steps:**
1. Cloud Provider: **AWS**
2. Region: **us-east-1** (best GPU availability)
3. Instance Type - look for **ml.g5.xlarge**

AWS instance types that work for SDXL:
- ✅ **ml.g5.xlarge** (A10G GPU, 24GB VRAM) ← Best choice
- ✅ **ml.g5.2xlarge** (A10G GPU, 24GB VRAM, more CPU)
- ✅ **ml.p3.2xlarge** (V100 GPU, 16GB VRAM)
- ✅ **ml.p4d.24xlarge** (A100 GPU, expensive)

AWS instances to AVOID (CPU only):
- ❌ ml.t2.*, ml.t3.* (CPU only)
- ❌ ml.m5.*, ml.c5.*, ml.r5.* (CPU only)
- ❌ ml.inf1.* (Inferentia chips, not compatible with SDXL)

**AWS regions with best GPU availability:**
- us-east-1 (North Virginia)
- us-west-2 (Oregon)
- eu-west-1 (Ireland)

### Option 3: Google Cloud (Least Reliable)

**Not recommended** - Google Cloud integration with Hugging Face often doesn't show GPU options clearly.

If you must use GCP:
1. Cloud Provider: **Google Cloud**
2. Region: **us-central1**
3. Look for instance with **"NVIDIA T4"** or **"NVIDIA A100"** explicitly mentioned

**If GCP doesn't work:**
- Switch to Azure or AWS
- Or use immers.cloud/RunPod instead (see below)

---

## Still Can't See GPU Options?

### Possible Reasons:

1. **Billing not set up**
   - Go to [Hugging Face Billing](https://huggingface.co/settings/billing)
   - Add payment method
   - GPU endpoints require billing to be enabled

2. **No GPU quota**
   - Some accounts need to request GPU access
   - Contact Hugging Face support
   - May need to verify account or wait for approval

3. **Region has no GPUs**
   - Try different region
   - Azure: West Europe, East US 2, UK South
   - AWS: us-east-1, us-west-2

4. **Temporary capacity issues**
   - Cloud provider might be out of GPU capacity
   - Try again later
   - Try different cloud provider

---

## Alternative Solution: Use immers.cloud or RunPod

If Hugging Face doesn't show GPU options or keeps failing, use a provider that **only offers GPUs** (no confusing CPU options):

### immers.cloud (Easiest Alternative)

**Advantages:**
- All servers have GPUs (no CPU confusion)
- SDXL pre-configured and ready
- Clear pricing

**Setup:**
1. Go to: https://en.immers.cloud/ai/stabilityai/stable-diffusion-xl-base-1.0/
2. Click "Rent a GPU server"
3. Choose GPU:
   - **Tesla T4**: 16GB VRAM, $0.33/hour
   - **RTX 3090**: 24GB VRAM, $0.92/hour ⭐ Recommended
   - **A10**: 24GB VRAM, $1.30/hour
   - **A100**: 40GB+ VRAM, higher cost
4. Server deploys with SDXL already installed
5. Get API endpoint URL (like: `https://your-server.immers.cloud`)
6. In your app:
   - Settings (⚙️) → Custom Inference Endpoint
   - Paste the immers.cloud endpoint URL
   - Save

**Cost:** Same as Hugging Face GPU endpoints, but guaranteed to work

### RunPod (Flexible Alternative)

**Advantages:**
- All instances are GPU-based
- Per-minute billing
- Many GPU options

**Setup:**
1. Go to: https://runpod.io
2. Create account and add billing
3. Click "Deploy" → Search for "Stable Diffusion XL"
4. Select GPU (all options are GPUs):
   - RTX 3090 (24GB) - Good value
   - RTX A6000 (48GB) - High performance
   - A100 (40GB/80GB) - Best performance
5. Deploy pod
6. Get API endpoint URL
7. Use in app Settings

**Cost:** $0.40-$3.00/hour depending on GPU

### Vast.ai (Cheapest Alternative)

**Advantages:**
- Lowest prices
- Peer-to-peer GPU marketplace
- Many options

**Setup:**
1. Go to: https://vast.ai
2. Search for instances with:
   - VRAM: 24GB+
   - GPU: RTX 3090 or better
3. Rent instance (from ~$0.20/hour)
4. Deploy SDXL using their templates
5. Get endpoint URL

**Note:** Variable reliability (peer-to-peer), but very cheap

---

## Verification Checklist

Before clicking "Create Endpoint", verify:

- [ ] Model is: `stabilityai/stable-diffusion-xl-base-1.0`
- [ ] Cloud Provider is: **Azure** (or AWS us-east-1)
- [ ] Instance Type shows: **"GPU"** in the name
- [ ] Description mentions: "NVIDIA" and "VRAM"
- [ ] Price is: $0.60-$1.30/hour (not $0.10-$0.40)
- [ ] Min replicas set to: **0**
- [ ] Billing is enabled on your account

If all checked ✅, click Create!

---

## Expected Timeline

With **GPU instance** (correct):
- ✅ 0-2 min: "Building"
- ✅ 2-8 min: Installing model, loading into GPU
- ✅ 8-10 min: Status → "Running"
- ✅ Total: **5-10 minutes**

With **CPU instance** (wrong):
- ❌ Stuck at "Building"
- ❌ Error: "Hardware not compatible"
- ❌ Never finishes even after 15-30 minutes
- ❌ Must delete and recreate with GPU

---

## Summary

**The Problem:**
- You selected CPU instance when creating endpoint
- SDXL requires NVIDIA GPU, cannot run on CPU
- Error "Hardware not compatible" confirms CPU was selected

**The Fix:**
1. Delete current endpoint
2. Create new endpoint
3. Select **"GPU [medium]"** or instance with **"NVIDIA"** in description
4. **Do NOT select "CPU"** instances
5. Use **Azure** for best GPU availability
6. Should work in 5-10 minutes

**Alternative:**
- Use immers.cloud or RunPod
- All their servers have GPUs (can't make CPU mistake)
- Pre-configured for SDXL

**Key Point:** The instance description MUST mention "NVIDIA", "GPU", and "VRAM". If it only shows vCPUs and RAM, that's a CPU instance and won't work for SDXL.

---

## Still Need Help?

1. Check: [QUICK_SETUP_SDXL.md](./QUICK_SETUP_SDXL.md)
2. Check: [CLOUD_INFERENCE_PROVIDERS.md](./CLOUD_INFERENCE_PROVIDERS.md)
3. Ask in [Hugging Face Discord](https://discord.gg/huggingface)
4. Contact: Hugging Face Support
5. Open GitHub issue in this repository
