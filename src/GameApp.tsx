import { useEffect, useRef, useState } from 'react'
import './App.css'
import { getArchivePageByLessonId, getArchivePageById } from './archive'
import { defaultCampaign, getCampaignSummary, isCampaignComplete, type CampaignProgress } from './campaign'
import { ArchivePagesPanel, CampaignCompleteBanner, MissionPanel, MissionSelect, SqlEditorPanel } from './components'
import { createProgressionMissionCompletedHandler, createUnlockReactionHandler, gameEventBus } from './events'
import { he } from './i18n'
import { getLearningPath, getLessonById, LEARNING_PATHS, LessonStage } from './learning'
import { getDefaultMission, getMissionById, getMissionDisplayText, missionRegistry, useMissionManager } from './missions'
import { getNpcById } from './npcs'
import { OdinPanel, useOdin } from './odin'
import {
  BootSequence,
  clearOnboardingFlag,
  hasCompletedOnboarding,
  markOnboardingComplete,
  ProfileCreation,
  WelcomeScreen,
} from './onboarding'
import { clearSavedGame, loadCurrentGame, saveCurrentGame } from './persistence'
import {
  createInitialPlayerProgress,
  getExplorerRank,
  getNpcFamiliarityTier,
  getPlayerProgressSummary,
  hasLocalPlayerProfile,
  useProgression,
  type PlayerProgress,
} from './progression'
import { getMissionContentStatus, getUnlockedNpcIds } from './unlocks'
import { applyEffect, createWorldState, getDistrictStatus, initialDistricts, type WorldState } from './worldState'
import {
  closeDialogue,
  CoreTransitionOverlay,
  createInitialSceneState,
  DESTINATION_IDS,
  type DestinationPromptInfo,
  enterDestination,
  exitTerminal,
  getDestinationConfig,
  getDestinationContentStatus,
  getDestinationEntryMission,
  getDestinationProgress,
  getDistrictStatusColor,
  getNpcDialogue,
  getNpcDialogueState,
  moveToDistrict,
  NpcDialogue,
  type NpcDialogueContext,
  OdinPresence,
  openNpcDialogue,
  QuestChip,
  TerminalView,
  useGameAudio,
  WorldScene3D,
} from './worldScene'
import {
  bannerFromOdinEntry,
  GameControlBar,
  GameDashboardShell,
  type GameEventBannerModel,
  getCompanionNpc,
  getDistrictIdForMission,
  JourneyHeader,
  loadBanner,
  MissionStage,
  NotificationsRail,
  QuestTrack,
  saveBanner,
  WorldMapPanel,
} from './game-ui'

const initialWorldState: WorldState = createWorldState(initialDistricts)

export interface GameAppProps {
  /** Batch 3A.2 — the Dashboard's chosen subject, carried in as the /world?path= query param (see App.tsx's WorldRoute). Undefined/invalid resolves to no highlighted building — every existing caller (tests included) that renders <GameApp /> with no props is unaffected. */
  initialLearningPathId?: string | null
}

function GameApp({ initialLearningPathId }: GameAppProps = {}) {
  // Checked once, synchronously, on the very first render — a valid save
  // boots the app straight into it; no save (or a corrupted one, since
  // loadCurrentGame already returns null for that) falls back to the same
  // fresh start as before.
  const [bootSave] = useState(() => loadCurrentGame())
  // Batch 3A.2: resolved once at mount, the same way bootSave is — this
  // batch only uses it to highlight a building; later batches may read it
  // for more (spawn/NPC/lesson), all from this single already-resolved value.
  // Onboarding: an explicit ?path= is always preserved as-is; with none
  // given (the normal first-time-onboarding case, since there's no subject
  // picker in that flow), this now defaults to Math rather than resolving
  // to no highlight at all — a first-time player needs a real, visible
  // starting building/NPC to walk toward, not just "the only unlocked node."
  const [learningPath] = useState(() => getLearningPath(initialLearningPathId ?? null) ?? LEARNING_PATHS.math)
  // Batch 3A.4B: set by NpcDialogue's "Start Lesson" action, resolved
  // through lessonRegistry only (getLessonById) — never fed into
  // activeMissionId/useMissionManager, so a Math/English lesson id can
  // never reach the SQL mission runtime or verifier. An id that doesn't
  // resolve to a real lesson (should never happen via the real UI, but
  // kept safe regardless) simply leaves this null — no crash, no SQL
  // fallback.
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [world, setWorld] = useState<WorldState>(() => bootSave?.world ?? initialWorldState)
  // Raw world-state JSON is a debug view, not something a player needs to
  // see by default — collapsed until explicitly opened.
  const [showDebug, setShowDebug] = useState(false)
  // Transient "Saved." confirmation and the New Game confirmation step are
  // both pure UI state — nothing here touches persistence or progression.
  const [justSaved, setJustSaved] = useState(false)
  const [confirmingNewGame, setConfirmingNewGame] = useState(false)
  // Transient Save/Load feedback shown in the notifications rail. The recent
  // *game* events shown alongside it are derived directly from odinHistory
  // (see recentNotifications below) — no new event system, no subscription.
  // bannerNonceRef just gives Save/Load banners a unique key.
  const [eventBanner, setEventBanner] = useState<GameEventBannerModel | null>(null)
  const bannerNonceRef = useRef(0)
  // Which NPC's bio is open, if any — session-scoped UI state, same as
  // showDebug/confirmingNewGame. Not part of SaveGame.
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)
  // Onboarding: the World Scene is now the default home experience (not the
  // classic dashboard) for both first-time and returning players — the
  // classic dashboard is still fully available via the existing manual
  // toggle, it's just no longer what a player sees first. sceneState is
  // exactly as session-scoped as selectedNpcId/showDebug above: never
  // persisted, never touches an engine, just tracks where the player
  // currently is in the scene.
  const [showWorldScene, setShowWorldScene] = useState(true)
  const [sceneState, setSceneState] = useState(() => createInitialSceneState('north'))
  // Onboarding: true only for a player who has never finished (or skipped)
  // the boot sequence before — read once at mount from onboardingStorage,
  // exactly like bootSave/learningPath above. A returning player (flag
  // already set) never sees this at all.
  const [showBootSequence, setShowBootSequence] = useState(() => !hasCompletedOnboarding())
  // Meridian 1.4 — the title screen, shown once per app mount (every real
  // launch, not just the first one — distinct from onboarding/showBootSequence,
  // which are one-time-ever). showProfileEditor reopens ProfileCreation for
  // an existing profile (from the Welcome Screen or the settings menu);
  // whether Profile Creation shows at all for a NEW profile is derived from
  // playerProgress itself (hasLocalPlayerProfile below), not its own state,
  // so it can never disagree with what's actually saved.
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])
  // Which mission is loaded in the SQL console — session-scoped UI state,
  // not part of SaveGame (Save/Load persists world/progress only, same as
  // before Step 28). useMissionManager already resets its own runtime and
  // reloads the mission database whenever the mission it's given changes,
  // so switching missions needed no changes there.
  const [activeMissionId, setActiveMissionId] = useState(() => getDefaultMission().id)
  const activeMission = getMissionById(activeMissionId) ?? getDefaultMission()
  const {
    progress: playerProgress,
    recordCompletion,
    recordLessonCompletion,
    recordNpcConversation,
    recordArchivePageFound,
    setPlayerProfile,
    restoreProgress,
  } = useProgression(defaultCampaign, bootSave?.playerProgress)
  const completedLessonIds = playerProgress.completedLessonIds ?? []
  // Meridian 1.3 — Core Loop §04: resolved fresh from progress every render, same fallback-to-empty convention as completedLessonIds.
  const collectedArchivePages = (playerProgress.collectedArchivePageIds ?? [])
    .map((pageId) => getArchivePageById(pageId))
    .filter((page) => page !== undefined)
  const [showArchivePages, setShowArchivePages] = useState(false)
  const { latestMessage: odinMessage, history: odinHistory } = useOdin()
  // The single most recent narration entry, if any — the same history
  // useOdin already tracks, just handed to OdinPresence as one object so it
  // can key its own reveal/dismiss timing on a stable id (see Living World
  // Sprint, Batch 1). Odin itself is unchanged: still read-only, still only
  // ever narrating the same six subscribed event types as before.
  const latestOdinEntry = odinHistory.length > 0 ? odinHistory[odinHistory.length - 1] : null

  // Meridian 1.3 — Core Loop §01: a returning player (the boot sequence
  // never shows) gets one welcome-back narration per mount, so the world
  // acknowledges they came back — the counterpart to WorldEntered's
  // one-time first-arrival greeting. Must run after useOdin() above (React
  // fires effects in hook-declaration order) so Odin's bus subscription
  // already exists before this publishes — otherwise the event fires into
  // an empty room and Odin never sees it. Runs once on mount only: reading
  // showBootSequence here captures its *initial* value, exactly like
  // handleBootSequenceDone's own WorldEntered publish is a one-time thing.
  useEffect(() => {
    if (!showBootSequence) {
      gameEventBus.publish({ type: 'SessionResumed' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Living World Sprint, Batch 5: one shared, presentation-only audio
  // player for the whole session. Every cue is best-effort (see
  // gameAudioPlayer.ts) — a blocked/unavailable AudioContext, or the player
  // muted, behaves identically to silence, with no effect on any engine.
  const { isMuted, toggleMuted, playPass, playFail, playNpcTalk, playStatusChange, setAmbientMode } = useGameAudio()

  // Ambient bed follows where the player currently is: off outside the
  // world scene entirely, a plaza bed in the open world, a distinct
  // Terminal bed once inside the Core.
  useEffect(() => {
    if (!showWorldScene) {
      setAmbientMode('off')
    } else if (sceneState.mode.kind === 'terminal') {
      setAmbientMode('terminal')
    } else {
      setAmbientMode('plaza')
    }
  }, [showWorldScene, sceneState.mode.kind, setAmbientMode])

  // Progression subscribes to MissionCompleted via the bus instead of being
  // called directly. recordCompletion is re-created every render (Step 15's
  // useProgression is unchanged), so it's read through a ref to keep this
  // subscription stable across renders while always calling the latest one.
  const recordCompletionRef = useRef(recordCompletion)
  recordCompletionRef.current = recordCompletion

  useEffect(() => {
    const handler = createProgressionMissionCompletedHandler((missionId) => recordCompletionRef.current(missionId))
    gameEventBus.subscribe('MissionCompleted', handler)
    return () => gameEventBus.unsubscribe(handler)
  }, [])

  // Lets Odin (and any future subscriber) learn about newly unlocked
  // content without the Unlock Engine or Progression changing at all: this
  // re-checks unlock state via the same read-only engine from Step 16
  // whenever playerProgress changes, publishing ContentUnlocked for
  // anything that's newly available (e.g. District Ties once First Contact
  // completes). playerProgress is read through a ref so the handler
  // instance (created once) always sees the latest value.
  const playerProgressRef = useRef(playerProgress)
  playerProgressRef.current = playerProgress
  const [unlockReactionHandler, setUnlockReactionHandler] = useState(() =>
    createUnlockReactionHandler(gameEventBus, () => playerProgressRef.current),
  )
  useEffect(() => {
    unlockReactionHandler()
  }, [playerProgress, unlockReactionHandler])

  // Meridian 1.0 closeout: auto-saves whenever the player leaves /world, so
  // a lesson (or mission) completion they already saw acknowledged isn't
  // silently lost just because they didn't press the manual Save button
  // first. Reuses the exact same saveCurrentGame the Save button calls
  // (same format, no new persisted shape); the manual button and its
  // "Saved." confirmation are completely untouched — this never calls
  // setJustSaved/setEventBanner, so it has no visible UI side effect.
  //
  // There is no in-app link from /world back to /dashboard (the Dashboard
  // is only reached by the browser's own Back button or the address bar),
  // so leaving /world is always a real browser navigation, not a
  // same-document route change — React never gets a chance to run a plain
  // effect's unmount cleanup before that happens (confirmed: an
  // unmount-only cleanup alone does not fire for page.goto() in the e2e
  // suite). 'pagehide' is the standard, reliable event for exactly this —
  // it fires both for a real navigation/tab-close *and* is still correct
  // if GameApp is ever unmounted the ordinary React way (e.g. a future
  // in-app link, or React StrictMode/HMR in dev), since the effect's own
  // cleanup below covers that case too. Both paths call the same saveNow,
  // reading world/playerProgress through refs (not the closure's own
  // values) so the save always reflects whatever was actually last on
  // screen. Registered with an empty dependency array — one listener per
  // mount, removed on cleanup, never re-subscribed on a re-render, so
  // there is no duplicate-save loop. world/playerProgress are only ever
  // set via useState initializers that already run synchronously before
  // first paint (no async boot step), so these refs are never in an
  // uninitialized/default state that could overwrite a real save.
  const worldRef = useRef(world)
  worldRef.current = world
  useEffect(() => {
    function saveNow() {
      saveCurrentGame(worldRef.current, playerProgressRef.current)
    }
    window.addEventListener('pagehide', saveNow)
    return () => {
      window.removeEventListener('pagehide', saveNow)
      saveNow()
    }
  }, [])

  // Rebuilds the unlock-reaction baseline from a just-restored progress
  // (assigned synchronously so the handler's eager getProgress() capture
  // sees it immediately) so already-unlocked content isn't re-announced by
  // Odin as newly unlocked. Shared by Load and New Game.
  function resetUnlockBaseline(progress: PlayerProgress) {
    playerProgressRef.current = progress
    setUnlockReactionHandler(() => createUnlockReactionHandler(gameEventBus, () => playerProgressRef.current))
  }

  // Save/Load/New Game only ever go through the persistence service's
  // saveCurrentGame/loadCurrentGame/clearSavedGame — this component has no
  // idea localStorage exists.
  function handleSave() {
    saveCurrentGame(world, playerProgress)

    setJustSaved(true)
    bannerNonceRef.current += 1
    setEventBanner(saveBanner(bannerNonceRef.current))
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2000)
  }

  function handleLoad() {
    const saved = loadCurrentGame()
    if (!saved) return

    setWorld(saved.world)
    restoreProgress(saved.playerProgress)
    resetUnlockBaseline(saved.playerProgress)
    bannerNonceRef.current += 1
    setEventBanner(loadBanner(bannerNonceRef.current))
  }

  // New Game is destructive, so the header only ever wires it up behind an
  // explicit confirmation step — this function is the actual reset.
  function handleConfirmNewGame() {
    clearSavedGame()
    // Onboarding: a full reset also clears "has this player onboarded
    // before" — but deliberately does NOT reopen the boot sequence within
    // this same mounted session (that would mean re-showing it right on
    // top of the reset confirmation, which is jarring). It reappears
    // correctly on the next fresh entry (reload or re-navigation to
    // /world), since showBootSequence's initializer re-reads this flag.
    clearOnboardingFlag()

    const freshProgress = createInitialPlayerProgress(defaultCampaign)
    setWorld(initialWorldState)
    restoreProgress(freshProgress)
    resetUnlockBaseline(freshProgress)
    setConfirmingNewGame(false)
  }

  // Onboarding: called exactly once, either when BootSequence's scripted
  // lines finish naturally or when the player clicks Skip — both paths are
  // already deduplicated inside BootSequence itself (see its doneRef
  // guard), so this never runs twice for the same boot sequence. Marking
  // the flag here (not earlier) means an interrupted session — the tab
  // closed mid-sequence — correctly shows the boot sequence again next
  // time. Publishing WorldEntered here (rather than from a generic mount
  // effect) is what guarantees it fires only for this first-time path, and
  // never again from toggling the classic dashboard afterward.
  function handleBootSequenceDone() {
    markOnboardingComplete()
    gameEventBus.publish({ type: 'WorldEntered' })
    setShowBootSequence(false)
  }

  // Meridian 1.4 — Player Identity MVP. The same handler serves both the
  // one-time, mandatory creation gate (hasProfile is false, no onCancel
  // passed to ProfileCreation) and the reopenable editor for an existing
  // profile (showProfileEditor) — setPlayerProfile always overwrites, so
  // there is no separate "create" vs "update" branch to keep in sync.
  function handleProfileSubmit(name: string, avatarId: string) {
    setPlayerProfile(name, avatarId)
    setShowProfileEditor(false)
  }

  // Batch 3A.4B: resolves strictly through lessonRegistry (getLessonById) —
  // never touches activeMissionId/useMissionManager, so a lesson id can
  // never reach the SQL mission runtime or verifier. An id that fails to
  // resolve fails safely: activeLessonId becomes null (nothing renders),
  // it never falls back to a SQL mission.
  function handleStartLesson(lessonId: string) {
    const lesson = getLessonById(lessonId)
    setActiveLessonId(lesson ? lesson.id : null)
    setSceneState(closeDialogue)
  }

  // Fired by LessonStage on every exercise submission, pass or fail. Only
  // ever writes to completedLessonIds (via Progression's separate
  // recordLessonCompletion) and publishes the lesson-side events Odin
  // listens for — never touches completedMissionIds, campaignProgress, or
  // WorldState, so a lesson can never move the SQL campaign's completion
  // count.
  function handleLessonResult(lessonId: string, pass: boolean) {
    if (pass) {
      // Meridian 1.3 — Core Loop §04: grant the linked Archive Page only on
      // the first-ever completion of this lesson, checked against progress
      // as it stood *before* this call — a replay must never re-grant (it's
      // already collected) or re-publish ArchivePageFound (which would
      // replay Odin's one-time reaction to finding it).
      const isFirstCompletion = !completedLessonIds.includes(lessonId)
      recordLessonCompletion(lessonId)
      gameEventBus.publish({ type: 'LessonCompleted', lessonId })
      if (isFirstCompletion) {
        const page = getArchivePageByLessonId(lessonId)
        if (page) {
          recordArchivePageFound(page.id)
          gameEventBus.publish({ type: 'ArchivePageFound', pageId: page.id })
        }
      }
      playPass()
    } else {
      gameEventBus.publish({ type: 'LessonFailed', lessonId })
      playFail()
    }
  }

  function handleReturnFromLesson() {
    setActiveLessonId(null)
  }

  // Guards against selecting a locked mission even though MissionSelect
  // already disables those buttons — defense in depth, not a new rule.
  function handleSelectMission(missionId: string) {
    if (getMissionContentStatus(playerProgress, missionId) === 'locked') return
    setActiveMissionId(missionId)
  }

  function handleSelectNpc(npcId: string) {
    setSelectedNpcId(npcId)
  }

  const contentStatus = getMissionContentStatus(playerProgress, activeMission.id)

  const { status, run, retry } = useMissionManager(activeMission, {
    initiallyCompleted: contentStatus === 'completed',
    onComplete: (mission) => {
      const effect = mission.successEffect
      // Living World Sprint, Batch 5: whether any district's status label
      // actually flips as a result of this effect — drives a presentation-
      // only sting, the same moment the district markers/HUD would show it.
      let anyDistrictStatusChanged = false
      if (effect) {
        // Compute the next world synchronously from this render's closure
        // (not inside setWorld's updater, which React defers until the
        // commit phase) so WorldStateChanged publishes before the rest of
        // this handler, in the order these events actually happen.
        const next = applyEffect(world, effect)
        anyDistrictStatusChanged = Object.values(world.districts).some((district) => {
          const updated = next.districts[district.id]
          return updated !== undefined && getDistrictStatus(updated) !== getDistrictStatus(district)
        })
        gameEventBus.publish({ type: 'WorldStateChanged', world: next })
        setWorld(next)
      }

      const wasComplete = isCampaignComplete(defaultCampaign, {
        completedMissionIds: playerProgress.completedMissionIds,
      })
      const willBeComplete = isCampaignComplete(defaultCampaign, {
        completedMissionIds: [...playerProgress.completedMissionIds, mission.id],
      })

      gameEventBus.publish({ type: 'MissionCompleted', missionId: mission.id })

      if (!wasComplete && willBeComplete) {
        gameEventBus.publish({ type: 'CampaignCompleted', campaignId: defaultCampaign.id })
      }

      playPass()
      if (anyDistrictStatusChanged) playStatusChange()
    },
    onFailure: (mission, result) => {
      gameEventBus.publish({
        type: 'QueryFailed',
        missionId: mission.id,
        reason: result.kind === 'error' ? 'sql-error' : 'mismatch',
      })
      playFail()
    },
  })

  // Fires once, the moment the mission's database finishes preparing.
  const previousPhaseRef = useRef(status.phase)
  useEffect(() => {
    if (previousPhaseRef.current !== 'active' && status.phase === 'active') {
      gameEventBus.publish({ type: 'MissionStarted', missionId: activeMission.id })
    }
    previousPhaseRef.current = status.phase
  }, [status.phase])


  const campaignProgress: CampaignProgress = { completedMissionIds: playerProgress.completedMissionIds }
  const campaignSummary = getCampaignSummary(defaultCampaign, campaignProgress)
  const progressSummary = getPlayerProgressSummary(playerProgress)
  const explorerRank = getExplorerRank(playerProgress)
  const hasProfile = hasLocalPlayerProfile(playerProgress)
  const unlockedNpcIds = getUnlockedNpcIds(playerProgress)
  const selectedNpc = selectedNpcId ? getNpcById(selectedNpcId) : undefined
  const missionOptions = missionRegistry.map((mission) => ({
    mission,
    status: getMissionContentStatus(playerProgress, mission.id),
  }))

  // The mission after the one actually loaded in the SQL console — not
  // campaign/selectors.ts's getNextMission(), which tracks the campaign's
  // own "current" (first-incomplete) pointer and would skip ahead of
  // whatever the player has manually selected via MissionSelect.
  const activeCampaignEntry = defaultCampaign.missions.find((entry) => entry.missionId === activeMission.id)
  const nextCampaignEntry = activeCampaignEntry
    ? defaultCampaign.missions.find((entry) => entry.order === activeCampaignEntry.order + 1)
    : undefined
  const nextMission = nextCampaignEntry ? getMissionById(nextCampaignEntry.missionId) : undefined
  const nextMissionContentStatus = nextMission ? getMissionContentStatus(playerProgress, nextMission.id) : undefined

  // Living World Sprint, Batch 2: everything an NPC's dialogue state needs
  // to acknowledge the player's progress, assembled from selectors these
  // engines already expose (Unlock Engine's getMissionContentStatus, Mission
  // Runtime's status.lastResult, World State's getDistrictStatus) — no new
  // engine, no new persisted state.
  const npcDialogueContext: NpcDialogueContext = {
    missionContentStatusByMissionId: Object.fromEntries(
      missionRegistry.map((mission) => [mission.id, getMissionContentStatus(playerProgress, mission.id)]),
    ),
    activeMissionId: activeMission.id,
    hasAttemptedActiveMission: status.lastResult !== null,
    districtStatusByDistrictId: Object.fromEntries(
      Object.values(world.districts).map((district) => [district.id, getDistrictStatus(district)]),
    ),
    completedLessonIds,
  }

  const activeLesson = activeLessonId ? getLessonById(activeLessonId) : undefined

  // Living World Sprint, Batch 3: the Records Core's own current status,
  // read the same way the world scene's HUD already does — TerminalView's
  // ambient framing and the entry/exit transition both key off this so the
  // Terminal visibly reflects the same state the player just saw outside.
  const coreStatus = getDistrictStatus(world.districts.core)

  // Hub World, A1: every destination's prompt info, derived fresh from
  // playerProgress on every render — no independent progression engine, no
  // new persisted state (see destinationContent.ts).
  const destinationInfoById: Readonly<Record<string, DestinationPromptInfo>> = Object.fromEntries(
    DESTINATION_IDS.map((destinationId) => [
      destinationId,
      {
        name: getDestinationConfig(destinationId)?.name ?? destinationId,
        status: getDestinationContentStatus(destinationId, playerProgress),
        progress: getDestinationProgress(destinationId, playerProgress),
      },
    ]),
  )
  const currentDestinationInfo = destinationInfoById[sceneState.playerDistrictId]
  const currentDestinationName = currentDestinationInfo?.name ?? sceneState.playerDistrictId
  const currentDestinationProgress = currentDestinationInfo?.progress ?? { completed: 0, total: 0 }

  // Dashboard presentation-only derivations (no new engine state):
  // which district owns the active mission (lights the map's active node),
  // and the companion NPC + their existing authored dialogue line.
  const activeDistrictId = getDistrictIdForMission(activeMission.id)
  const activeDestinationName = activeDistrictId ? destinationInfoById[activeDistrictId]?.name : undefined
  const companion = getCompanionNpc(activeMission.id, unlockedNpcIds)
  const companionDialogue = companion
    ? getNpcDialogue(companion.id, getNpcDialogueState(companion, npcDialogueContext))
    : undefined
  const companionMessage = companionDialogue
    ? [companionDialogue.greeting, companionDialogue.missionContext].filter(Boolean).join('\n')
    : undefined

  // Recent game events for the notifications rail, derived from the same
  // structured GameEvents that already ride on Odin's narration history —
  // no new event system, no subscription. Newest first, capped at 4.
  const recentNotifications = odinHistory
    .slice(-4)
    .map((entry) => bannerFromOdinEntry(entry))
    .filter((model): model is GameEventBannerModel => model !== null)
    .reverse()

  // The single primary action behind both the header CTA and the mobile
  // sticky CTA: advance to the next mission when one is actually ready
  // (same gate MissionPanel uses for its Continue button), otherwise bring
  // the player to the mission console. The scroll is pure presentation.
  const MISSION_STAGE_ID = 'mission-stage'
  const canContinueMission =
    status.phase === 'completed' && Boolean(nextMission) && nextMissionContentStatus !== 'locked'
  function handlePrimaryAction() {
    if (canContinueMission) {
      handleContinue()
      return
    }
    const stage = document.getElementById(MISSION_STAGE_ID)
    if (stage) stage.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Locked destinations never open a Terminal — the InteractionPrompt
  // already shows this before the player even tries, so this is a
  // deliberate, explained no-op, not a silent failure. Entering an
  // unlocked destination opens whichever mission getDestinationEntryMission
  // says is next (see destinationContent.ts) and only then switches the
  // scene into Terminal mode.
  function handleEnterDestination(destinationId: string) {
    if (getDestinationContentStatus(destinationId, playerProgress) === 'locked') return

    const entryMission = getDestinationEntryMission(destinationId, playerProgress)
    if (entryMission) handleSelectMission(entryMission.id)
    setSceneState((current) => enterDestination(current, destinationId))
  }

  function handleContinue() {
    if (nextMission) handleSelectMission(nextMission.id)
  }

  // Meridian 1.4 — the title screen comes first, on every mount, ahead of
  // even Profile Creation: a returning player with a profile already sees
  // Continue Journey; a first-time player sees the sign-in/guest choice,
  // then Profile Creation right after dismissing this screen.
  if (showWelcomeScreen) {
    return (
      <WelcomeScreen
        hasProfile={hasProfile}
        playerName={playerProgress.playerName}
        playerAvatarId={playerProgress.playerAvatarId}
        onContinue={() => setShowWelcomeScreen(false)}
        onEditProfile={() => setShowProfileEditor(true)}
        isMuted={isMuted}
        onToggleMuted={toggleMuted}
        confirmingNewGame={confirmingNewGame}
        onRequestNewGame={() => setConfirmingNewGame(true)}
        onConfirmNewGame={handleConfirmNewGame}
        onCancelNewGame={() => setConfirmingNewGame(false)}
      />
    )
  }

  // A first-time player (no local profile yet) must set one before anything
  // else — no onCancel, so there's no way to dismiss without submitting.
  if (!hasProfile) {
    return <ProfileCreation onSubmit={handleProfileSubmit} />
  }

  if (showBootSequence) {
    return <BootSequence onDone={handleBootSequenceDone} />
  }

  return (
    <div id="app-root">
      {showProfileEditor && (
        <ProfileCreation
          initialName={playerProgress.playerName}
          initialAvatarId={playerProgress.playerAvatarId}
          onSubmit={handleProfileSubmit}
          onCancel={() => setShowProfileEditor(false)}
        />
      )}
      <GameControlBar
        explorerRank={explorerRank}
        archivePageCount={collectedArchivePages.length}
        onToggleArchivePages={() => setShowArchivePages((current) => !current)}
        justSaved={justSaved}
        confirmingNewGame={confirmingNewGame}
        showWorldScene={showWorldScene}
        isMuted={isMuted}
        onSave={handleSave}
        onLoad={handleLoad}
        onRequestNewGame={() => setConfirmingNewGame(true)}
        onConfirmNewGame={handleConfirmNewGame}
        onCancelNewGame={() => setConfirmingNewGame(false)}
        onToggleWorldScene={() => setShowWorldScene((current) => !current)}
        onToggleMuted={toggleMuted}
        playerName={playerProgress.playerName}
        playerAvatarId={playerProgress.playerAvatarId}
        onEditProfile={() => setShowProfileEditor(true)}
      />
      {campaignSummary.isComplete && <CampaignCompleteBanner totalMissions={campaignSummary.totalMissions} />}
      {showArchivePages && (
        <ArchivePagesPanel pages={collectedArchivePages} onClose={() => setShowArchivePages(false)} />
      )}
      {showWorldScene ? (
        <>
          {sceneState.mode.kind === 'terminal' ? (
            <TerminalView
              mission={activeMission}
              status={status}
              onRun={run}
              onRetry={retry}
              campaignSummary={campaignSummary}
              activeMissionOrder={activeCampaignEntry?.order}
              nextMission={nextMission}
              nextMissionContentStatus={nextMissionContentStatus}
              completionPercentage={progressSummary.completionPercentage}
              contentStatus={contentStatus}
              coreStatus={coreStatus}
              destinationName={currentDestinationName}
              destinationProgress={currentDestinationProgress}
              onContinue={handleContinue}
              onReturnToWorld={() => setSceneState(exitTerminal)}
              npc={companion}
              npcMessage={companionMessage}
            />
          ) : (
            <>
              {/* Hidden during an active Math/English lesson — that flow
                  never touches activeMissionId/useMissionManager (see
                  handleStartLesson), so this SQL-campaign readout would be
                  showing the wrong context otherwise. */}
              {!activeLesson && (
                <QuestChip
                  title={getMissionDisplayText(activeMission).title}
                  currentMissionIndex={activeCampaignEntry?.order}
                  totalMissions={campaignSummary.totalMissions}
                />
              )}
              <WorldScene3D
                world={world}
                unlockedNpcIds={unlockedNpcIds}
                sceneState={sceneState}
                destinationInfoById={destinationInfoById}
                onMoveToDistrict={(districtId) => setSceneState((current) => moveToDistrict(current, districtId))}
                onEnterDestination={handleEnterDestination}
                onSelectNpc={(npcId) => setSceneState((current) => openNpcDialogue(current, npcId))}
                highlightedBuildingId={learningPath?.buildingId}
                highlightedNpcId={learningPath?.npcId}
                completedLessonIds={completedLessonIds}
                playerAvatarId={playerProgress.playerAvatarId}
              />
              {sceneState.mode.kind === 'dialogue' &&
                (() => {
                  const dialogueNpc = getNpcById(sceneState.mode.npcId)
                  return dialogueNpc ? (
                    <NpcDialogue
                      npc={dialogueNpc}
                      context={npcDialogueContext}
                      onOpen={() => {
                        playNpcTalk()
                        recordNpcConversation(dialogueNpc.id)
                      }}
                      onClose={() => setSceneState(closeDialogue)}
                      onStartLesson={handleStartLesson}
                      familiarityTier={getNpcFamiliarityTier(playerProgress, dialogueNpc.id)}
                    />
                  ) : null
                })()}
              {/* Batch 3A.4B: the real exercise flow. Rendering is decided
                  entirely by activeLesson's own subject (via LessonStage's
                  isMathLesson/isEnglishLesson type guards) — never routed
                  through activeMissionId/useMissionManager/runQuery. */}
              {activeLesson && (
                <LessonStage
                  lesson={activeLesson}
                  isCompleted={completedLessonIds.includes(activeLesson.id)}
                  onResult={(pass) => handleLessonResult(activeLesson.id, pass)}
                  onReturnToWorld={handleReturnFromLesson}
                />
              )}
            </>
          )}
          {/* Both stay mounted across the world<->Terminal switch above: Odin
              so an already-shown line doesn't replay just because the scene
              underneath remounted, and the transition overlay so it can
              detect the switch itself as an edge (see CoreTransitionOverlay). */}
          <OdinPresence latestEntry={latestOdinEntry} hidden={sceneState.mode.kind === 'dialogue'} />
          <CoreTransitionOverlay active={sceneState.mode.kind === 'terminal'} glowColor={getDistrictStatusColor(coreStatus)} />
        </>
      ) : (
        <GameDashboardShell
          header={
            <JourneyHeader
              destinationName={activeDestinationName}
              activeMission={activeMission}
              activeMissionOrder={activeCampaignEntry?.order}
              completionPercentage={progressSummary.completionPercentage}
              campaignSummary={campaignSummary}
              companion={companion}
              companionMessage={companionMessage}
              onPrimary={handlePrimaryAction}
            />
          }
          notifications={
            <NotificationsRail
              transient={eventBanner}
              recent={recentNotifications}
              onDismiss={() => setEventBanner(null)}
            />
          }
          worldMap={
            <WorldMapPanel
              world={world}
              unlockedNpcIds={unlockedNpcIds}
              activeDistrictId={activeDistrictId}
              onSelectNpc={handleSelectNpc}
              selectedNpc={selectedNpc}
              onCloseNpc={() => setSelectedNpcId(null)}
            />
          }
          mission={
            <MissionStage
              id={MISSION_STAGE_ID}
              panel={
                <MissionPanel
                  mission={activeMission}
                  phase={status.phase}
                  campaignSummary={campaignSummary}
                  activeMissionOrder={activeCampaignEntry?.order}
                  nextMission={nextMission}
                  nextMissionContentStatus={nextMissionContentStatus}
                  completionPercentage={progressSummary.completionPercentage}
                  contentStatus={contentStatus}
                  onContinue={handleContinue}
                />
              }
              terminal={<SqlEditorPanel status={status} onRun={run} onRetry={retry} />}
            />
          }
          questTrack={
            <QuestTrack
              archivePageCount={collectedArchivePages.length}
              onOpenArchivePages={() => setShowArchivePages(true)}
            >
              <MissionSelect options={missionOptions} activeMissionId={activeMission.id} onSelect={handleSelectMission} />
            </QuestTrack>
          }
          advisor={<OdinPanel latestMessage={odinMessage} history={odinHistory} />}
          devTools={
            <>
              <button type="button" className="debugToggle" onClick={() => setShowDebug((current) => !current)}>
                {showDebug ? he.hideRawWorldState : he.showRawWorldState}
              </button>
              {showDebug && <pre className="worldStateDump">{JSON.stringify(world, null, 2)}</pre>}
            </>
          }
          onPrimary={handlePrimaryAction}
          primaryLabel={he.continueMissionCta}
        />
      )}
    </div>
  )
}

export default GameApp
