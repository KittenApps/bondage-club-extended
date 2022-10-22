/* eslint-disable quote-props */
export const VERSION = BCX_VERSION;

export const VERSION_CHECK_BOT: number = 37685;

// Server commit: b894fce7856593d16850721febc44b09c2ec94f7

// Game commit: c5f6cb7539a1507ba45c1e8e1efb936547c7b11e
export const FUNCTION_HASHES: Record<string, string[]> = {
	"Player.CanChangeClothesOn": ["40EF5292"],
	"Player.GetBlindLevel": ["32BC83FD"],
	"Player.GetBlurLevel": ["F6930456"],
	"Player.GetDeafLevel": ["42CB6D63"],
	"Player.HasTints": ["E09CA942"],
	"Player.IsSlow": ["6E60F118"],
	ActivityCheckPrerequisite: ["8C815308"],
	ActivityOrgasmPrepare: ["E4EE085D"],
	ActivityOrgasmStart: ["936CB457"],
	AppearanceClick: ["D29F295D"],
	AppearanceExit: ["AA300341"],
	AppearanceGetPreviewImageColor: ["06F02ADE"],
	AppearanceMenuBuild: ["A9809413"],
	AppearanceMenuClick: ["80444418"],
	AppearanceMenuDraw: ["28FDF65B"],
	AppearanceRun: ["C65F23EF"],
	AsylumEntranceCanWander: ["A85C35F3"],
	AsylumGGTSClick: ["E5660C8C"],
	AsylumGGTSLoad: ["DAB62F12"],
	BackgroundSelectionRun: ["F7AF6FF2"],
	CharacterAppearanceLoadCharacter: ["387F9BEF"],
	CharacterCanChangeToPose: ["F55FE4B0"],
	CharacterCanKneel: ["A5A325E3"],
	CharacterLoadCanvas: ["678F3155"],
	CharacterLoadEffect: ["27893941"],
	CharacterNickname: ["EB452E5E"],
	ChatAdminClick: ["D4354B95"],
	ChatAdminExit: ["EC263A9C"],
	ChatAdminLoad: ["BC01235B"],
	ChatAdminRun: ["1E16EBC7"],
	ChatCreateClick: ["8794FE74"],
	ChatCreateExit: ["6FF19445"],
	ChatCreateLoad: ["DC3CF453"],
	ChatCreateRun: ["007553E0"],
	ChatRoomAddCharacterToChatRoom: ["FD2725F4"],
	ChatRoomAdminAction: ["86DE8F3C"],
	ChatRoomCanAttemptKneel: ["0AA710FA"],
	ChatRoomCanAttemptStand: ["026065D0"],
	ChatRoomCanBeLeashedBy: ["A05C6F82"],
	ChatRoomCanLeave: ["7065F82F"],
	ChatRoomClearAllElements: ["C49AA2C1"],
	ChatRoomClickCharacter: ["715D92A0"],
	ChatRoomCreateElement: ["AD7CBE68"],
	ChatRoomDrawBackground: ["597B062C"],
	ChatRoomDrawCharacter: ["8ED3DF88"],
	ChatRoomDrawCharacterOverlay: ["4AE4AD9E"],
	ChatRoomFirstTimeHelp: ["078BEEA9"],
	ChatRoomIsOwnedByPlayer: ["82640FF9"],
	ChatRoomKeyDown: ["B4BFDB0C"],
	ChatRoomListUpdate: ["D7FA0EC7"],
	ChatRoomLovershipOptionIs: ["6F5CE6A0"],
	ChatRoomMenuClick: ["0F32BA38"],
	ChatRoomMenuDraw: ["0B8B0944"],
	ChatRoomMessage: ["91C72542"],
	ChatRoomOwnershipOptionIs: ["FE060F0B"],
	ChatRoomRun: ["685FF69C"],
	ChatRoomSendChat: ["7F540ED0"],
	ChatRoomSendEmote: ["6EF53CBA"],
	ChatRoomShouldBlockGaggedOOCMessage: ["16D6AED5"],
	ChatRoomStatusUpdate: ["35DA12E0"],
	ChatRoomSync: ["EE15739F"],
	ChatRoomSyncMemberLeave: ["A95EADE6"],
	ChatRoomUpdateDisplay: ["8DFC494A"],
	ChatSearchJoin: ["22514B80"],
	ChatSearchLoad: ["8AF12D1C"],
	ChatSearchNormalDraw: ["0C7BF5F6"],
	ChatSearchRun: ["64BCF8FB"],
	CheatFactor: ["594CFC45"],
	CheatImport: ["26C67608"],
	ColorPickerDraw: ["D1E82FB3"],
	CommandParse: ["6E46F29E"],
	CommonKeyDown: ["A8EC46AB"],
	CommonSetScreen: ["17692CD7"],
	DialogCanUnlock: ["B849E6BC"],
	DialogClickExpressionMenu: ["5938DDC1"],
	DialogDrawExpressionMenu: ["EEFB3D22"],
	DialogDrawItemMenu: ["E8711B10"],
	DialogDrawPoseMenu: ["4B146E82"],
	DialogFindPlayer: ["32851FF2"],
	DialogInventoryAdd: ["B00897D4"],
	DialogInventoryBuild: ["CFB24231"],
	DialogItemClick: ["542E1B06"],
	DialogLeaveItemMenu: ["B54FD195"],
	DialogMenuButtonBuild: ["D5E32886"],
	DialogMenuButtonClick: ["8ED0CF17"],
	DrawArousalMeter: ["DC0BB5B4"],
	DrawCharacter: ["C8F13D85"],
	DrawGetImage: ["BEC7B0DA"],
	DrawImageEx: ["3D3D74F5"],
	DrawProcess: ["4B2BE17E"],
	DrawStatus: ["FD747092"],
	ExtendedItemDraw: ["E831F57A"],
	FriendListBeepMenuSend: ["B81A695E"],
	FriendListClick: ["6B039C7C"],
	FriendListLoadFriendList: ["1F8A29E2"],
	FriendListRun: ["051E747B"],
	InfiltrationStealItems: ["1F601756"],
	InformationSheetClick: ["E535609B"],
	InformationSheetExit: ["75521907"],
	InformationSheetRun: ["EE8678A4"],
	InventoryItemNeckAccessoriesCollarAutoShockUnitDetectSpeech: ["441EAEBF"],
	LoginMistressItems: ["B58EF410"],
	LoginResponse: ["22A81B90"],
	LoginStableItems: ["EA93FBF7"],
	LogValue: ["6ED63114"],
	MainHallMaidsDisabledBegForMore: ["EA29F2B3"],
	MainHallWalk: ["E52553C4"],
	ManagementCanBeClubSlave: ["EB05C417"],
	ManagementCanBeReleased: ["A2E2CA35"],
	ManagementCanBeReleasedOnline: ["3374263B"],
	ManagementCanBreakDatingLoverOnline: ["366AECAE"],
	ManagementCanBreakTrialOnline: ["51E9B7F4", "2CBA193D"],
	ManagementCanBreakUpLoverOnline: ["92E30200"],
	ManagementCannotBeReleased: ["755DB909"],
	ManagementCannotBeReleasedExtreme: ["2DA1650E"],
	ManagementCannotBeReleasedOnline: ["D1ACE212"],
	PreferenceIsPlayerInSensDep: ["1DB1238E"],
	PreferenceSubscreenDifficultyClick: ["3882E581"],
	PreferenceSubscreenDifficultyRun: ["65BF560F"],
	PrivateRansomStart: ["511E91C6"],
	ServerAccountBeep: ["6A6EC803"],
	ServerPlayerIsInChatRoom: ["E3771112"],
	ServerSend: ["90A61F57"],
	SpeechGarble: ["9D669F73"],
	StruggleDrawStrengthProgress: ["4755C02D"],
	TextGet: ["4DDE5794"],
	ValidationCanAddOrRemoveItem: ["62A8266A"],
	ValidationResolveModifyDiff: ["C2FE52D3"],
	WardrobeClick: ["E96F7F63"],
	WardrobeGroupAccessible: ["2D406A64"],
	WardrobeRun: ["9616EB3A"]
};

export const FUNCTION_HASHES_NMOD: Record<string, string[]> = {
	ActivityOrgasmPrepare: ["AA5FC17F"],
	AppearanceClick: ["C18D893E"],
	AppearanceMenuClick: ["C01EFEE3"],
	AppearanceRun: ["9A24F9FE"],
	BackgroundSelectionRun: ["F605602A"],
	CharacterLoadEffect: ["74D62AA1"],
	ChatAdminClick: ["4BA1B803"],
	ChatAdminLoad: ["62FB992F"],
	ChatAdminRun: ["F92A0B2E"],
	ChatRoomAddCharacterToChatRoom: ["1C43D1C1"],
	ChatRoomCanChangeClothes: ["DF8A6550"], // Deprecated
	ChatRoomCanLeave: ["B406F3E5"],
	ChatRoomClearAllElements: ["52F91E02"],
	ChatRoomCreateElement: ["76299AEC"],
	ChatRoomDrawCharacter: ["FB2F0B97"],
	ChatRoomDrawCharacterOverlay: ["D9A831CC"],
	ChatRoomDrawFriendList: ["327DA1B8"],
	ChatRoomKeyDown: ["FCA8DF29"],
	ChatRoomMenuClick: ["8304B61F"],
	ChatRoomMessage: ["7C097519"],
	ChatRoomRun: ["9A1E764B"],
	ChatRoomStatusUpdate: ["6DBFC554"],
	ChatRoomSync: ["32E1C9AF"],
	ChatRoomUpdateDisplay: ["8B37556F"],
	ChatSearchLoad: ["4659E8F5"],
	CheatImport: ["1ECB0CC4"],
	ColorPickerDraw: ["FF93AF2E"],
	CommandParse: ["2F4176CA"],
	DialogClickExpressionMenu: ["AFBB0323"],
	DialogDrawItemMenu: ["05301080"],
	DialogFindPlayer: ["44A7263C"],
	DialogInventoryAdd: ["A6DED236"],
	DialogItemClick: ["1A6D14C0"],
	DialogMenuButtonBuild: ["AC45F4CF"],
	DialogMenuButtonClick: ["A4CE0C1C"],
	DrawCharacter: ["CFEDEF08"],
	DrawGetImage: ["8BFFECA9"],
	DrawStatus: ["E9DC1722"],
	FriendListBeepMenuSend: ["C5C27229"],
	FriendListClick: ["E08BFE66"],
	FriendListLoadFriendList: ["428B288B"],
	FriendListRun: ["96BCBB6E"],
	InformationSheetRun: ["08EF8A57"],
	LoginMistressItems: ["984A6AD9"],
	LoginResponse: ["9F59AEF1"],
	LoginStableItems: ["C3F50DD1"],
	ServerAccountBeep: ["0A2C7C78"],
	ServerSend: ["F8627678"],
	WardrobeClick: ["842709D9"],
	WardrobeRun: ["02775589"]
};
