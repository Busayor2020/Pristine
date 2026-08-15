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

The photograph has to arrive as the file the camera wrote. A copy that has
been sent through a chat, posted anywhere, or pulled out of a gallery sync has
already been re-encoded, and the run would then be measuring damage that
happened before the experiment started. `pnpm exp serve` will take it off the
phone unchanged.

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

**4. Move the candidates to the phone, byte for byte.**

`generate` writes to a computer and Status is posted from a handset, so there
is a transfer in the middle. Most ways of doing it re-encode the file, and a
re-encoded input makes the whole run measure the wrong thing: the arm would be
scored on damage that happened before WhatsApp ever saw it.

Easiest, and the reason this command exists:

```bash
pnpm exp serve
```

That prints a `http://192.168.x.x:8080/` address. Open it on the phone, on
the same wifi, and save each file. A plain HTTP GET does not touch the bytes,
every file is sent as an attachment so the browser saves it rather than
decoding it into a player, and the page lists the byte count to check each
download against. Stop it with Ctrl+C when the last file is down.

Also safe, because the bytes arrive unchanged:

- USB cable, copying into the phone's `Download` or `DCIM` folder.
- An SD card or a USB-C stick.
- A cloud drive, downloading the file back as a file. Not "save to Photos".

Not safe:

- WhatsApp itself, including sending to your own number or to a saved
  messages chat. It compresses on send, which is the very thing under test.
- Google Photos, or any gallery sync set to anything but original quality.
- Anything offering to "optimise", "resize" or "share a link" instead of
  sending the file.

Check one file after transferring: the size on the phone must match the size
on disk exactly. If it does not, the transfer route re-encoded it, and every
number from that run is void.

**5. Post them.** For each file in `candidates/`, in id order:

- Post it to your own Status. `.jpg` files go as photos, `.mp4` files as
  videos. Post from the file manager or gallery, not from inside another app's
  share sheet.
- Let it finish uploading.
- Download it back from your own Status.
- Get it into `returned/` with the two digit id as the prefix, for example
  `04-whatever-whatsapp-called-it.mp4`. Only the prefix is matched, so the rest
  of the name does not matter.

The page `pnpm exp serve` is already showing carries the files back the other
way too. Pick the returned files under "Send to returned/" and they land in
the right directory, unchanged, without a cable. The same page will take a
fixture photo straight off the phone into `fixtures/`, which is the easiest
way to satisfy step 2 with a real photograph.

Keep conditions constant: one device, one account, one sitting, one app
version. Note them in the results afterwards.

If a file will not post at all, record which id and what the app did, then
skip it and carry on. A partial run is scored and marked partial, which is
worth more than a run abandoned halfway. Arm `07` is one second long and is
the likeliest to be refused, since the Status trimmer has a floor.

```bash
pnpm exp status
```

**6. Record the conditions.**

```bash
cp conditions.example.json conditions.json
```

Fill in the device, OS and WhatsApp version. None of it is recoverable later,
and a score with no handset attached cannot be compared to anything: WhatsApp
changes its pipeline by app version and behaves differently by device. The
ffmpeg build is captured automatically.

This is read at `compare` time, not at `generate` time, so filling it in after
the posting pass and re-running `compare` attaches it.

**7. Score it.**

```bash
pnpm exp compare
```

Writes `results/<fixture>-<fit>.md` and refreshes `results.md`, which is the
index over every run. Partial runs are fine and are marked as partial.

**8. Put the run away before starting the next fixture.**

```bash
pnpm exp archive
```

Moves `candidates/` and `returned/` into `runs/<timestamp>-<fixture>/` and
leaves the working directories clear.

## Guard rails

`generate` refuses to overwrite `candidates/` while `returned/` holds files
that have not been scored. Getting nine files through Status by hand is the
expensive part of this experiment, and silently discarding a posting session is
the one mistake the harness can prevent. Override with `--force` if you really
do mean to throw it away.

`results.md` always exists and always means "the evidence". Before any run it
says the stage 4 gate is closed. `pnpm exp reindex` rebuilds it from whatever
reports are on disk.

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
