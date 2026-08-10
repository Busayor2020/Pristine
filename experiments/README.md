# Experiments

The measurement harness for the product's central bet: that WhatsApp's Status
video pipeline preserves detail better than its image pipeline, so a photo sent
as a short clip survives the upload better than the same photo sent as a photo.

That claim is **unverified**. Nothing in `packages/encoder` may carry an
encoder parameter, and no copy may assert a quality gain, until `results.md`
exists and supports it.

This package is never shipped and is never imported by an app.

## Why there is a human in the middle

WhatsApp compresses on the sender's device before upload. There is no endpoint
to intercept and no API to observe. The only way to find out what the pipeline
does to a file is to post it and look at what comes back.

So the harness owns the two ends and you own the middle:

```
generate  ->  candidates/          you post each one to Status
                                   you download what comes back
              returned/       <-   you drop them here
compare   ->  results.md
```

## Protocol

Follow this exactly. The numbers are only as good as the round trip.

**1. Check the tooling.**

```bash
pnpm exp doctor
```

**2. Get a fixture.**

Preferred: put a real phone photograph in `fixtures/`. Straight off the camera.
Not a screenshot, not something that has already been through a messaging app,
and at least 1080x1920. Anything smaller is rejected, because the reference
render would upscale and quietly flatter every arm.

Fallback, so the harness runs today:

```bash
pnpm exp synth
```

That writes four synthetic charts at 1440x2560, each stressing one failure
mode: fine detail, gradient banding, sensor-like noise, and saturated chroma
edges. They have exact ground truth, but they carry no real sensor noise and no
real scene statistics, and noise is a large part of what compression destroys.
**Synthetic charts show a direction. They do not settle the bet.**

The design export's four mock photographs are not usable. They are 540x960 and
already JPEG compressed.

**3. Build the candidates.**

```bash
pnpm exp generate detail
```

Nine arms, sized for one sitting. Each differs from the baseline in exactly one
way, which is the only thing that makes the results readable.

**4. Post them.** For each file in `candidates/`, in id order:

- Post it to your own Status. `.jpg` files go as photos, `.mp4` files as
  videos. Do not let any other app touch the file first.
- Let it finish uploading.
- Download it back from your own Status.
- Save it into `returned/` with the two digit id as the prefix, for example
  `04-whatever-whatsapp-called-it.mp4`. Only the prefix is matched, so the rest
  of the name does not matter.

Keep conditions constant: one device, one account, one sitting, one app
version. Note them in the results afterwards.

```bash
pnpm exp status
```

**5. Score it.**

```bash
pnpm exp compare
```

Writes `results.md`. Partial runs are fine and are marked as partial.

## How scoring works

Both sides are normalised to a single lossless PNG at 1080x1920 before any
metric runs, because SSIM, PSNR and libvmaf all require matching resolution and
frame count, and a returned clip matches a reference still on neither.

Two decisions worth knowing about:

- **The reference is the original, not what we uploaded.** Scoring against what
  we sent would measure only WhatsApp's contribution, and would award a perfect
  score to a pipeline that wrecked the photo before upload.
- **The frame comes from the clip's midpoint, not its start.** The first frame
  is the keyframe and the best looking frame in the file. Scoring it would
  overstate every video arm.

## Reading the result

The verdict turns on one comparison: **arm 04 against arm 02**. Arm 02 is the
photo resized to the Status frame first, which is the best the photo path can
do. Beating arm 01, the naive untouched photo, proves only that resizing helps,
and resizing is not the product.

VMAF differences under about 1 point are inside the noise. A gain nobody can
see is not a product.

If arm 04 loses to arm 02 across fixtures, the honest conclusion is that
Pristine is a resize tool, and the photo-to-video technique should be dropped
rather than defended.
