/**
 * Every user-facing string in Pristine, in English.
 *
 * Flat and dot-keyed rather than nested, so adding a locale is a matter of
 * copying this file and translating the values. Nothing here reads from the
 * token layer and nothing here contains markup: a string is a string.
 *
 * Interpolation uses `{name}` placeholders resolved by `format()` in
 * `./format.ts`. Values that vary (sizes, durations, counts) are always
 * placeholders, never baked into the sentence, because word order around them
 * changes between languages.
 *
 * Punctuation note: the design export used the em dash 19 times outside of
 * layout comments. Every one has been replaced with a period, comma, colon or
 * parenthesis chosen for what that specific sentence was doing. None became a
 * hyphen. MIGRATION.md lists all of them with the before and after.
 *
 * Nothing in this file may assert a quality gain we have not measured. The
 * strings that did are quarantined in `./unverified.ts` until
 * `/experiments/results.md` exists. A test enforces this.
 */

export const en = {
  // Product
  'app.name': 'pristine',
  'app.version': '{version}',

  // Shared actions
  'action.continue': 'Continue',
  'action.cancel': 'Cancel',
  'action.close': 'Close',
  'action.change': 'Change',
  'action.clear': 'Clear',
  'action.seePlans': 'See plans',
  'action.freeUpSpace': 'Free up space',
  'action.saveToDevice': 'Save to device',

  // Shared badges
  'badge.pro': 'PRO',
  'badge.paid': 'PAID',
  'badge.recommended': 'Recommended',

  // Shared formats
  'format.dimensions': '{width} × {height}',
  'format.mediaMeta': '{width} × {height} · {size}',
  'format.clipMeta': '{width} × {height} · {size} · {duration} clip',
  'format.libraryMeta': '{width} × {height} · {size} · {when}',

  // Connectivity
  'offline.title': "You're offline.",
  // Was: "Pristine still prepares media - sharing waits until you're back."
  'offline.body': "Pristine still prepares media. Sharing waits until you're back.",

  // First run
  'firstRun.title': 'Post to Status without losing the shot.',
  'firstRun.body':
    "WhatsApp re-encodes everything on your phone before it uploads. Pristine prepares your media first, so there's far less for that to ruin.",
  'firstRun.cta': 'Pick a photo',
  'firstRun.secondary': 'See how it works',
  'firstRun.reassurance': 'No account. Nothing leaves your phone.',

  // Before and after comparison. These two strings are fixed by the brief and
  // must not be reworded. The design export also carried uppercase duplicates
  // for the result screen; those are a text-transform concern, not a second
  // string, so they are gone.
  'compare.before': 'WhatsApp would send',
  'compare.after': 'Pristine sends',
  'compare.hint': 'Drag to compare, or tap to flip',

  // Education card
  'edu.eyebrow': 'ONE THING TO KNOW',
  'edu.title': 'Your photo comes back as a short clip.',
  'edu.subtitle': "That's on purpose. Here's why.",
  // edu.step1 through edu.step3 are quarantined in ./unverified.ts: they state
  // the photo-as-video hypothesis as fact.
  'edu.note':
    'Prefer to post a still? Turn clips off in {settingsPath}. Your photo will still be prepared, just not as sharp.',
  'edu.settingsPath': 'Settings › Media',
  'edu.cta': 'Got it',

  // Entry, browser
  'entry.title': 'Add media',
  'entryWeb.empty.title': 'Choose a photo or video',
  // Was: "Your browser opens its own file window - Pristine can't see your gallery."
  'entryWeb.empty.body': "Your browser opens its own file window. Pristine can't see your gallery.",
  'entryWeb.empty.cta': 'Browse files',
  'entryWeb.empty.note':
    'One file at a time in the browser. The Android app takes several at once.',
  'entryWeb.changeFile': 'Choose a different file',
  'entryWeb.more.title': 'Got more than one?',
  'entryWeb.more.body':
    'The browser hands over one file at a time. The Android app takes a whole gallery selection.',
  'entryWeb.more.cta': 'Install the app',

  // Orientation
  'orientation.title': 'This one is lying down',
  'orientation.body': 'Status shows a tall frame. Pick how it should fill it.',
  'orientation.fit': 'Fit with backdrop',
  'orientation.crop': 'Crop to fill',

  // Install prompt
  'install.title': 'Get the Android app',
  'install.body':
    'Pick straight from your gallery, queue several, and keep using your phone while it works.',
  'install.cta': 'Install',

  // Gallery
  'gallery.title': 'Recents',
  'gallery.selected': '{count} selected',

  // Quality preset
  'preset.title': 'Quality',
  'preset.question': 'How much detail do you want to keep?',
  'preset.body': "More detail means a bigger upload. Here's the real trade.",
  'preset.meta': '{width} × {height} · {size} · about {time} to upload',
  'preset.max.name': 'Max Quality',
  'preset.max.body': 'Every bit of detail Pristine can hold. Heaviest on your data.',
  'preset.balanced.name': 'Balanced',
  'preset.balanced.body': 'Sharp on Status without eating your bundle.',
  'preset.saver.name': 'Data Saver',
  'preset.saver.body': 'Fine texture softens a little. Kindest to your data.',
  // Was: "You're on the free plan - Balanced and Data Saver."
  'preset.planNote': "You're on the free plan: Balanced and Data Saver.",
  'preset.cta': 'Prepare',

  // Processing
  'processing.title': 'Preparing',
  'processing.percent': '{percent}%',
  'processing.note': 'This runs on your phone. Your media is never uploaded to us.',
  'processing.stage.analysing': 'Analysing',
  'processing.stage.reducingNoise': 'Reducing noise',
  'processing.stage.matchingDimensions': 'Matching Status dimensions',
  'processing.stage.encoding': 'Encoding',

  // Result
  'result.title': 'Ready',
  // Was: "...of data to post - roughly 14s on 4G."
  'result.dataNote': 'Uses about {size} of data to post, roughly {time} on 4G.',
  'result.explainTitle': 'Your photo is now a {seconds}-second clip',
  // result.explainBody and result.why are quarantined in ./unverified.ts.
  'result.cta': 'Post or save',

  // Export
  'export.title': 'Where to?',
  'export.ready': 'Prepared and ready',
  'export.otherWays': 'OTHER WAYS OUT',
  'export.status.title': 'Share to Status',
  'export.status.body': 'Opens WhatsApp · posts as a {width} × {height} clip',
  'export.document.title': 'Send as a document',
  // Was: "Nothing is re-encoded at all - but it lands in a chat, not on Status."
  'export.document.body': 'Nothing is re-encoded at all, but it lands in a chat, not on Status.',
  'export.save.title': 'Save to device',
  'export.save.body': 'Keeps a copy in Pictures/Pristine. Post it whenever.',

  // Long video split
  'split.title': 'Too long for one post',
  // Was: "Status takes it in parts - drag the marks to choose where they break."
  'split.body':
    'Your clip runs {duration}. Status takes it in parts. Drag the marks to choose where they break.',
  'split.30': '30s parts',
  'split.60': '60s parts',
  'split.part': 'Part {index} of {total}',
  'split.range': '{from} to {to}',
  'split.order': 'Pristine posts them oldest first, so viewers swipe through 1, 2, 3 in order.',
  'split.limit': 'Free splits into 2 parts. This one needs {needed}.',
  'split.cta': 'Prepare {count} parts',

  // Library
  'library.usage': 'Pristine is using {size}',
  'library.free': '{size} free',
  'library.prepared': 'Prepared',
  'library.originals': 'Originals',
  'library.sectionPrepared': 'PREPARED',
  'library.count': '{count} items',
  'library.cta': 'Prepare something',
  'libraryEmpty.title': 'Nothing prepared yet',
  'libraryEmpty.body':
    'Whatever you prepare stays here, so you can post it again without redoing the work.',
  'libraryEmpty.cta': 'Prepare a photo',

  // Permission priming
  'permission.title': 'Next, Android will ask about your photos',
  'permission.body': "Here's exactly what saying yes means.",
  'permission.point1':
    'Only the photos you tap. Pristine never goes through your gallery on its own.',
  // Was: "Nothing is uploaded to us - ever."
  'permission.point2': 'Everything happens on this phone. Nothing is uploaded to us, ever.',
  'permission.point3': 'Change your mind any time in Settings. Nothing breaks if you do.',
  'permission.accept': 'OK, ask me',
  'permission.decline': 'Not now',

  // Settings
  'settings.title': 'Settings',
  'settings.section.quality': 'QUALITY',
  'settings.defaultQuality': 'Default quality',
  'settings.section.media': 'MEDIA',
  'settings.orientation': "If it isn't vertical",
  'settings.clips': 'Turn photos into clips',
  'settings.clipsBody': 'The trick that keeps detail. Off means stills, which lose more.',
  'settings.section.storage': 'STORAGE',
  'settings.keepOriginals': 'Keep originals for',
  'settings.keepOriginalsValue': '{days} days',
  'settings.storageUsed': '{size} used',
  'settings.section.language': 'LANGUAGE',
  'settings.appLanguage': 'App language',
  'settings.section.plan': 'PLAN',
  'settings.planFree': 'Free',
  'settings.planFreeBody': 'Balanced and Data Saver, splits up to 2 parts, one at a time.',

  // Batch, seller flow
  'batch.title': '{count} products',
  'batch.progress': '{done} of {total} done',
  // Was: "Balanced - applied to all 8"
  'batch.presetApplied': 'Balanced (applied to all {count})',
  'batch.totalUpload': 'about {size} total to upload',
  'batch.preparing': 'Preparing {current} of {total}',
  'batch.timeLeft': 'about {time} left',
  'batch.state.done': 'Done',
  'batch.state.queued': 'Queued',
  'batch.itemMeta': '{from} to {to}',
  'batch.gate': 'Batches are a seller feature. Free does one at a time.',
  'batch.cta': 'Export all {count}',

  // Brand kit, seller flow
  'brandKit.title': 'Brand kit',
  'brandKit.body': 'Set it once. Every product photo comes out looking like the same shop.',
  'brandKit.logo': 'LOGO',
  'brandKit.logoBody': 'Add a PNG with a transparent background for the cleanest result.',
  'brandKit.position': 'POSITION',
  'brandKit.size': 'SIZE',
  'brandKit.priceTag': 'Price tag',
  'brandKit.priceTagBody': 'Add a price to every photo in a batch as you queue it.',
  'brandKit.cta': 'Save kit',

  // Sheet: encode failed
  'sheet.failed.title': "That one didn't finish",
  'sheet.failed.body':
    'The encoder ran out of room at {width} × {height}. It happens on busy phones.',
  'sheet.failed.hint':
    'Closing a few apps usually fixes it. Data Saver needs about a third of the memory.',
  'sheet.failed.retry': 'Try again',
  'sheet.failed.fallback': 'Use Data Saver instead',

  // Sheet: file too large
  'sheet.tooLarge.title': 'That file is too big for this phone',
  // Was: "...at the same time - about 2.8 GB free, and you have 1.2 GB."
  'sheet.tooLarge.body':
    "It's {size}. Pristine needs room for the original and the result at the same time: about {needed} free, and you have {available}.",
  'sheet.tooLarge.split': 'Cut it into parts first',
  'sheet.tooLarge.pick': 'Pick something smaller',

  // Sheet: unsupported format
  'sheet.unsupported.title': "The browser can't open .HEIC",
  // Was: "The Android app reads them fine - or re-save it as JPG and try again."
  'sheet.unsupported.body':
    'iPhone photos often arrive in this format. The Android app reads them fine, or re-save it as JPG and try again.',
  'sheet.unsupported.install': 'Install the app',
  'sheet.unsupported.other': 'Choose another file',

  // Sheet: low storage
  'sheet.lowStorage.title': 'Not enough space right now',
  'sheet.lowStorage.body':
    "This needs {needed} and your phone has {available}. Pristine's own originals are taking {reclaimable}.",
  // Was: "Use Data Saver - needs 0.7 GB"
  'sheet.lowStorage.saver': 'Use Data Saver (needs {size})',

  // Sheet: install the app
  'sheet.install.title': 'That part needs the app',
  'sheet.install.body':
    "Browsers won't hand a website your gallery. The Android app adds multi-select, recents, and processing that keeps going in the background.",
  'sheet.install.size': '{size} download',
  'sheet.install.offline': 'Works offline',
  'sheet.install.cta': 'Install Pristine',
  'sheet.install.dismiss': 'Keep using the browser',

  // Sheet: free up space
  'sheet.freeUp.title': 'Free up space',
  'sheet.freeUp.originals': 'Originals older than {days} days',
  'sheet.freeUp.originalsBody': "You've already posted these.",
  'sheet.freeUp.cache': 'Preview cache',
  'sheet.freeUp.cacheBody': 'Rebuilds itself when needed.',
  'sheet.freeUp.prepared': 'Prepared items',
  'sheet.freeUp.preparedBody': 'Kept until you delete them.',
  'sheet.freeUp.cta': 'Clear {size}',

  // Sheet: library item
  'sheet.item.postAgain': 'Post to Status again',
  // Was: "Delete - frees 1.9 MB"
  'sheet.item.delete': 'Delete (frees {size})',

  // Sheet: plans
  // Was: "SLOT - NOT BUILT YET"
  'sheet.plan.eyebrow': 'SLOT: NOT BUILT YET',
  'sheet.plan.title': 'Everything is free right now',
  'sheet.plan.body':
    "When plans arrive, this sheet is where they'll live. The limits are already drawn into the flow so nothing has to move.",
  'sheet.plan.item1': 'Max Quality preset',
  'sheet.plan.item2': 'Splits past 2 parts',
  'sheet.plan.item3': 'Batches and brand kit',

  // Desktop.
  //
  // The brief allows desktop variants for first run and library only, and the
  // wording genuinely differs rather than merely reflowing: on a laptop
  // "your phone" is wrong, and "nothing leaves your phone" is a promise about
  // the wrong device. These are separate strings on purpose, not duplicates.
  'desktop.nav.howItWorks': 'How it works',
  'desktop.nav.library': 'Library',
  'desktop.nav.settings': 'Settings',
  'desktop.nav.getApp': 'Get the Android app',

  'desktop.firstRun.eyebrow': 'RUNS IN YOUR BROWSER · NOTHING UPLOADED',
  'desktop.firstRun.body':
    "WhatsApp re-encodes everything on your device before it uploads, and detail goes with it. Pristine prepares your photo or video first, so there's far less for that to ruin.",
  'desktop.firstRun.cta': 'Choose a photo',
  'desktop.firstRun.reassurance': 'No account, no email. Your media never leaves this device.',

  'desktop.library.meta': '{count} items · {size} prepared',
  'desktop.library.reshare': 'Re-share',
  'desktop.library.using': 'Using {size}',
  'desktop.library.free': '{size} free on this device',

  // Languages, shown untranslated in their own script
  'language.english': 'English',
  'language.pidgin': 'Nigerian Pidgin',
  'language.hausa': 'Hausa',
  'language.swahili': 'Kiswahili',
  'language.hindi': 'हिन्दी',

  // Placeholder content used by the design mock. Kept because it is on screen
  // in the export, and because the naming pattern is what real users copy.
  // Was: "Ankara - wine", "Ankara - gold", "Ankara - indigo"
  'sample.library.1': 'Ankara (wine)',
  'sample.library.2': 'Lagos at night',
  'sample.library.3': 'Ankara (gold)',
  'sample.library.4': 'Rooftop',
  'sample.library.5': 'Ankara (indigo)',
  'sample.library.6': 'Harbour lights',
} as const;

export type CopyKey = keyof typeof en;
export type Copy = Record<CopyKey, string>;
