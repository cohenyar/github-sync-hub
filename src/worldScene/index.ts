/**
 * The primary 3D world scene (Phase 2) plus the logic it shares with
 * everything else in this folder. Phase 1's disposable 2D renderer
 * (CityPlaza) has been removed — sceneState, dialogueContent, NpcDialogue,
 * and TerminalView survived the renderer swap unchanged, exactly as
 * planned.
 */
export * from './logic/sceneState'
export * from './logic/sceneSelectors'
export * from './logic/scenePositions3D'
export * from './logic/movement'
export * from './logic/proximity'
export * from './logic/dialogueContent'
export * from './logic/npcDialogueState'
export * from './logic/npcAppearance'
export * from './logic/destinationContent'
export * from './components/NpcDialogue'
export * from './components/TerminalView'
export * from './components/WorldScene3D'
export * from './components/InteractionPrompt'
export * from './components/OdinPresence'
export * from './components/CoreTransitionOverlay'
export * from './audio/gameAudioPlayer'
export * from './audio/useGameAudio'
