# Hardware Requirements for Custom Inference Endpoints

## Summary

When setting up a custom Hugging Face Inference Endpoint for Bella's Magic Image Editor, you **MUST** use a GPU instance. CPU instances are not compatible with Stable Diffusion models.

## Cloud Provider Recommendation

### ✅ Recommended: AWS (Amazon Web Services)

**Why AWS:**
- Best GPU availability and variety (T4, A10G, A100)
- Most reliable regions for GPU instances
- Competitive pricing
- Fast deployment times
- Wide region selection

**Recommended AWS Regions:**
- `us-east-1` (N. Virginia) - Most GPU availability
- `us-west-2` (Oregon) - Good availability, lower latency for West Coast
- `eu-west-1` (Ireland) - Best for European users

### ⚠️ Alternative: Azure

**Azure is acceptable but:**
- Slightly higher pricing in some regions
- Less GPU availability than AWS
- Good option if you're already in Azure ecosystem

**Recommended Azure Regions:**
- `eastus` (East US)
- `westus2` (West US 2)
- `northeurope` (North Europe)

### ❌ Not Recommended: Google Cloud Platform (GCP)

**Avoid Google Cloud because:**
- Very limited GPU instance options
- Fewer regions with GPU availability
- More restrictive allocation policies
- The error in the issue was from a GCP endpoint attempt

**If you must use GCP:**
- Expect longer wait times for GPU instances
- Limited to specific regions
- May encounter capacity issues

## ✅ Compatible Hardware

### GPU Instances (REQUIRED)

| Instance Type | GPU | Cost/Hour | Best For | Recommendation |
|--------------|-----|-----------|----------|----------------|
| T4 Small | NVIDIA T4 | $0.60 | SD 1.5, basic SDXL | Minimum viable option |
| A10G Medium | NVIDIA A10G | $1.30 | SDXL, NSFW XL | **Recommended** |
| A100 Large | NVIDIA A100 | $4.50 | Maximum quality | Overkill for most users |

**Why GPU is Required:**
- Stable Diffusion uses deep neural networks
- Requires massive parallel computation (thousands of cores)
- GPUs are optimized for this type of workload
- CPUs lack the parallel processing power needed

## ❌ Incompatible Hardware

### CPU Instances (DO NOT USE)

| Instance Type | CPU | Cost/Hour | Why It Fails |
|--------------|-----|-----------|--------------|
| Intel Sapphire Rapids | Intel Xeon | $0.05 | Only 1-2 vCPUs, no GPU cores |
| AMD EPYC | AMD EPYC | Varies | Only CPU cores, no GPU acceleration |
| Any CPU-only | Various | Varies | Cannot run neural network models |

**Error You'll Encounter:**
```
Error in inference endpoint config: Intel Sapphire Rapids
1x vCPU · 2 GB
$0.05 / h

Hardware not compatible with selected model.
```

**Note**: This error can occur on any cloud provider (AWS, Azure, or Google Cloud) when selecting CPU instances. Always choose GPU instances.

## Why Not CPU?

### Technical Explanation

1. **Parallel Processing Requirements**:
   - Stable Diffusion models perform billions of matrix operations
   - GPUs have 1,000-10,000+ cores working in parallel
   - CPUs typically have 2-32 cores
   - GPU is ~100-1000x faster for this workload

2. **Memory Bandwidth**:
   - Models require high-speed memory access
   - GPUs have dedicated high-bandwidth VRAM (100s of GB/s)
   - CPU RAM is much slower for this use case

3. **Specialized Hardware**:
   - GPUs have Tensor Cores optimized for AI/ML
   - CPUs don't have equivalent specialized units

### Real-World Impact

**With CPU instance (if it worked):**
- Single image generation: 5-30 minutes
- High CPU usage, system slowdown
- Excessive memory consumption
- **Reality: Won't work at all - will fail immediately**

**With GPU instance:**
- Single image generation: 5-30 seconds
- Efficient resource usage
- High quality output
- Reliable performance

## Cost Considerations

Yes, GPU instances cost more than CPU instances:

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **CPU ($0.05/hr)** | Cheapest | Low cost | **Won't work** - incompatible |
| **T4 GPU ($0.60/hr)** | 12x more | Works, basic SDXL | Lower quality than A10G |
| **A10G GPU ($1.30/hr)** | 26x more | Best quality, NSFW support | More expensive |
| **Public API (Free)** | Free | No cost, reliable | 512x512 only, no NSFW |

### Cost Optimization Tips

If GPU costs are too high:

1. **Use Auto-scaling**:
   - Set min replicas to 0
   - Endpoint scales down when not in use
   - Only pay when actively generating images

2. **Use Scale-to-Zero**:
   - Set timeout to 15-30 minutes
   - Endpoint shuts down after inactivity
   - First request after shutdown takes 30-60s to wake up

3. **Use Public API**:
   - Free Hugging Face API
   - Limited to 512x512 resolution
   - No NSFW support
   - No custom models
   - Good for testing and light use

4. **Batch Your Work**:
   - Generate multiple images in one session
   - Maximize value from endpoint uptime
   - Reduces start/stop overhead

## Cloud Provider Comparison

### AWS (Recommended) ✅

| Aspect | Rating | Details |
|--------|--------|---------|
| GPU Availability | ⭐⭐⭐⭐⭐ | Excellent availability of T4, A10G, A100 |
| Pricing | ⭐⭐⭐⭐ | Competitive, transparent pricing |
| Regions | ⭐⭐⭐⭐⭐ | Wide selection (us-east-1, us-west-2, eu-west-1, etc.) |
| Deployment Speed | ⭐⭐⭐⭐⭐ | Fast, reliable deployment |
| Reliability | ⭐⭐⭐⭐⭐ | Highly stable, minimal downtime |

**Best Regions:**
- `us-east-1` (N. Virginia) - Best availability
- `us-west-2` (Oregon) - Good for West Coast users
- `eu-west-1` (Ireland) - Best for Europe

### Azure (Alternative) ⚠️

| Aspect | Rating | Details |
|--------|--------|---------|
| GPU Availability | ⭐⭐⭐⭐ | Good, but less than AWS |
| Pricing | ⭐⭐⭐ | Slightly higher in some regions |
| Regions | ⭐⭐⭐⭐ | Good selection (eastus, westus2, northeurope) |
| Deployment Speed | ⭐⭐⭐⭐ | Generally fast |
| Reliability | ⭐⭐⭐⭐ | Reliable, occasional capacity issues |

**Best Regions:**
- `eastus` (East US)
- `westus2` (West US 2)
- `northeurope` (North Europe)

### Google Cloud Platform (Not Recommended) ❌

| Aspect | Rating | Details |
|--------|--------|---------|
| GPU Availability | ⭐⭐ | Very limited, often unavailable |
| Pricing | ⭐⭐⭐ | Similar to others when available |
| Regions | ⭐⭐ | Limited regions with GPU instances |
| Deployment Speed | ⭐⭐ | Slower, capacity issues common |
| Reliability | ⭐⭐⭐ | Stable when running, but hard to provision |

**Issues:**
- GPU instances frequently unavailable
- More restrictive allocation policies
- Fewer regions support GPU instances
- The original error in this issue was from attempting GCP

**Only use GCP if:**
- You have existing GCP credits
- You're already heavily invested in GCP
- You have a GCP enterprise agreement

**Even then, expect:**
- Longer wait times for deployment
- Potential capacity errors
- Need to try multiple regions

## How to Choose the Right GPU

### For Most Users: A10G ($1.30/hour)

**Best for:**
- SDXL models (1024x1024 resolution)
- NSFW XL models
- High quality image generation
- Professional use
- Balanced cost/performance

### For Budget-Conscious Users: T4 ($0.60/hour)

**Best for:**
- SD 1.5 models (512x512 resolution)
- Basic SDXL (may be slower)
- Learning and experimentation
- Occasional use
- Tight budget

### For Maximum Quality: A100 ($4.50/hour)

**Best for:**
- Absolute highest quality
- Very large batch processing
- Commercial applications
- When speed is critical
- Money is no object

**Note**: For most Bella's Magic Image Editor users, A100 is overkill. A10G provides excellent quality at reasonable cost.

## Setup Checklist

When creating your endpoint:

- [ ] Logged into Hugging Face
- [ ] Billing information added
- [ ] Navigated to Inference Endpoints
- [ ] Clicked "Create new endpoint"
- [ ] Selected your model (e.g., stabilityai/stable-diffusion-xl-base-1.0)
- [ ] ✅ **Selected GPU instance** (T4, A10G, or A100)
- [ ] ❌ **Did NOT select CPU instance**
- [ ] Set min replicas to 0 (for cost savings)
- [ ] Set scale-to-zero timeout to 15 minutes
- [ ] Clicked "Create Endpoint"
- [ ] Waited for "Running" status
- [ ] Copied endpoint URL
- [ ] Configured in Bella's settings

## Troubleshooting

### I Already Created a CPU Endpoint

**Solution:**
1. Go to [Inference Endpoints](https://huggingface.co/inference-endpoints)
2. Find your CPU endpoint
3. Click "Delete" or "Terminate"
4. Create a new endpoint following the checklist above
5. Select a GPU instance this time

**Note**: You're not charged for failed/deleted endpoints.

### I Can't Afford GPU Pricing

**Solution:**
1. Use the free public Hugging Face API:
   - Set up API key in settings
   - Leave "Custom Inference Endpoint" blank
   - Works with 512x512 resolution
   - No NSFW support

2. Consider:
   - Generate images in batches to maximize value
   - Use scale-to-zero to minimize costs
   - Start with T4 ($0.60/hr) instead of A10G
   - Only use for final production images

### Can I Use My Own GPU?

**Not directly with Hugging Face Endpoints**, but you have options:

1. **Run locally**:
   - Install Stable Diffusion on your PC
   - Requires NVIDIA GPU (GTX 1060+ or RTX series)
   - Modify the app to point to local API
   - Free but requires technical setup

2. **Other providers**:
   - RunPod, Vast.ai, Lambda Labs offer cheaper GPU rentals
   - Would require code modifications
   - May have different APIs

## Additional Resources

- [CUSTOM_ENDPOINT_SETUP.md](./CUSTOM_ENDPOINT_SETUP.md) - Complete setup guide
- [ENDPOINT_QUICK_START.md](./ENDPOINT_QUICK_START.md) - Quick configuration
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [Hugging Face Endpoint Docs](https://huggingface.co/docs/inference-endpoints/) - Official documentation

## Questions?

**Q: Why can't Hugging Face just make it work on CPU?**  
A: It's technically impossible. The models are designed for GPU architecture and would take hours or fail entirely on CPU.

**Q: Can I try CPU anyway?**  
A: No - Hugging Face blocks incompatible hardware at creation time. You'll get the "Hardware not compatible" error.

**Q: Is there a free GPU option?**  
A: Not for dedicated endpoints. Use the public Inference API instead (free, but limited features).

**Q: Can I use multiple GPU types?**  
A: Yes - create separate endpoints for different use cases. Use T4 for testing, A10G for production.

---

**Bottom Line**: Stable Diffusion requires GPU. There's no workaround. Choose the GPU tier that fits your budget and quality needs.
