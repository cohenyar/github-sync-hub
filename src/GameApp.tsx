import { useEffect, useRef, useState } from 'react'
import './App.css'
import { AdminPanel } from './admin'
import { defaultCampaign, getCampaignSummary, isCampaignComplete, type CampaignProgress } from './campaign'
import { CampaignCompleteBanner, MissionPanel, MissionSelect, SqlEditorPanel } from './components'
import { createProgressionMissionCompletedHandler, createUnlockReactionHandler, gameEventBus } from './events'
import { he } from './i18n'
import { getDefaultMission, getMissionById, missionRegistry, useMissionManager } from './missions'
import { getNpcById } from './npcs'
import { OdinPanel, useOdin } from './odin'
import { clearSavedGame, loadCurrentGame, saveCurrentGame } from './persistence'
import {
  createInitialPlayerProgress,
  getPlayerProgressSummary,
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

function GameApp() {
  // Checked once, synchronously, on the very first render — a valid save
  // boots the app straight into it; no save (or a corrupted one, since
  // loadCurrentGame already returns null for that) falls back to the same
  // fresh start as before.
  const [bootSave] = useState(() => loadCurrentGame())
  const [world, setWorld] = useState<WorldState>(() => bootSave?.world ?? initialWorldState)
  const [showAdmin, setShowAdmin] = useState(false)
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
  // The primary 3D world scene (Phase 2) — still an additional view
  // alongside the classic dashboard, not a replacement of it (that's a
  // separate future decision). sceneState is exactly as session-scoped as
  // selectedNpcId/showDebug above: never persisted, never touches an
  // engine, just tracks where the player currently is in the scene.
  const [showWorldScene, setShowWorldScene] = useState(false)
  const [sceneState, setSceneState] = useState(() => createInitialSceneState('north'))
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
    restoreProgress,
  } = useProgression(defaultCampaign, bootSave?.playerProgress)
  const { latestMessage: odinMessage, history: odinHistory } = useOdin()
  // The single most recent narration entry, if any — the same history
  // useOdin already tracks, just handed to OdinPresence as one object so it
  // can key its own reveal/dismiss timing on a stable id (see Living World
  // Sprint, Batch 1). Odin itself is unchanged: still read-only, still only
  // ever narrating the same six subscribed event types as before.
  const latestOdinEntry = odinHistory.length > 0 ? odinHistory[odinHistory.length - 1] : null

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

    const freshProgress = createInitialPlayerProgress(defaultCampaign)
    setWorld(initialWorldState)
    restoreProgress(freshProgress)
    resetUnlockBaseline(freshProgress)
    setConfirmingNewGame(false)
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
  }

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

  return (
    <div id="app-root">
      <GameControlBar
        justSaved={justSaved}
        confirmingNewGame={confirmingNewGame}
        showAdmin={showAdmin}
        showWorldScene={showWorldScene}
        isMuted={isMuted}
        onSave={handleSave}
        onLoad={handleLoad}
        onRequestNewGame={() => setConfirmingNewGame(true)}
        onConfirmNewGame={handleConfirmNewGame}
        onCancelNewGame={() => setConfirmingNewGame(false)}
        onToggleAdmin={() => setShowAdmin((current) => !current)}
        onToggleWorldScene={() => setShowWorldScene((current) => !current)}
        onToggleMuted={toggleMuted}
      />
      {campaignSummary.isComplete && <CampaignCompleteBanner totalMissions={campaignSummary.totalMissions} />}
      {showWorldScene ? (
        <>
          {sceneState.mode.kind === 'terminal' ? (
            <TerminalView
              mission={activeMission}
              status={status}
              onRun={run}
              onRetry={retry}
              campaignSummary={campaignSummary}
              nextMission={nextMission}
              nextMissionContentStatus={nextMissionContentStatus}
              completionPercentage={progressSummary.completionPercentage}
              contentStatus={contentStatus}
              coreStatus={coreStatus}
              destinationName={currentDestinationName}
              destinationProgress={currentDestinationProgress}
              onContinue={handleContinue}
              onReturnToWorld={() => setSceneState(exitTerminal)}
            />
          ) : (
            <>
              <WorldScene3D
                world={world}
                unlockedNpcIds={unlockedNpcIds}
                sceneState={sceneState}
                destinationInfoById={destinationInfoById}
                onMoveToDistrict={(districtId) => setSceneState((current) => moveToDistrict(current, districtId))}
                onEnterDestination={handleEnterDestination}
                onSelectNpc={(npcId) => setSceneState((current) => openNpcDialogue(current, npcId))}
              />
              {sceneState.mode.kind === 'dialogue' &&
                (() => {
                  const dialogueNpc = getNpcById(sceneState.mode.npcId)
                  return dialogueNpc ? (
                    <NpcDialogue
                      npc={dialogueNpc}
                      context={npcDialogueContext}
                      onOpen={playNpcTalk}
                      onClose={() => setSceneState(closeDialogue)}
                    />
                  ) : null
                })()}
            </>
          )}
          {/* Both stay mounted across the world<->Terminal switch above: Odin
              so an already-shown line doesn't replay just because the scene
              underneath remounted, and the transition overlay so it can
              detect the switch itself as an edge (see CoreTransitionOverlay). */}
          <OdinPresence latestEntry={latestOdinEntry} />
          <CoreTransitionOverlay active={sceneState.mode.kind === 'terminal'} glowColor={getDistrictStatusColor(coreStatus)} />
        </>
      ) : (
        <GameDashboardShell
          header={
            <JourneyHeader
              destinationName={activeDestinationName}
              activeMission={activeMission}
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
            <QuestTrack>
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
      {showAdmin && (
        // Admin is an English-only builder/debug surface (unchanged since v0.1) —
        // pinned to LTR explicitly so it renders correctly regardless of the
        // document's own RTL default.
        <section className="adminSection" dir="ltr" lang="en">
          <AdminPanel />
        </section>
      )}
    </div>
  )
}

export default GameApp
