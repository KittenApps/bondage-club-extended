import { isNModClient, drawIcon, DrawImageEx, drawTypingIndicatorSpeechBubble } from "../utilsClub";
import { VERSION } from "../config";
import { hiddenMessageHandlers, sendHiddenMessage } from "./messaging";
import { BaseModule } from "./_BaseModule";
import { hookFunction, patchFunction } from "../patching";
import { getChatroomCharacter, getPlayerCharacter } from "../characters";
import { modStorage } from "./storage";
import cloneDeep from "lodash-es/cloneDeep";
import { defaultBCXEffects } from "../constants";
import { isObject } from "../utils";
import { icon_heart, icon_BCX_cross } from "../resources";
import { BCX_setTimeout } from "../BCXContext";

export enum ChatRoomStatusManagerStatusType {
	None = "None",
	Typing = "Typing",
	Emote = "Emote",
	Whisper = "Whisper",
	DMS = "DMS",
	Wardrobe = "Wardrobe",
	Profile = "Profile",
	// NMod
	Action = "Action",
	Afk = 'Afk'
}

class ChatRoomStatusManager {
	InputTimeoutMs = 3_000;

	// Required for NMod!
	StatusTypes = {};

	private InputElement: HTMLTextAreaElement | null = null;

	private InputTimeout: number | null = null;

	Status: ChatRoomStatusManagerStatusType = ChatRoomStatusManagerStatusType.None;

	// Status triggers
	DMS: boolean = false;
	private TypingStatus: ChatRoomStatusManagerStatusType = ChatRoomStatusManagerStatusType.None;
	private WhisperTarget: number | null = null;

	GetCharacterStatus(C: Character): string | undefined {
		return C.ID === 0 ? ChatroomSM.Status : C.Status;
	}

	SetInputElement(elem: HTMLTextAreaElement | null) {
		if (this.InputElement !== elem) {
			this.InputElement = elem;
			if (elem !== null) {
				elem.addEventListener("blur", this.InputEnd.bind(this));
				elem.addEventListener("input", this.InputChange.bind(this));
			}
		}
	}

	GetStatus(): ChatRoomStatusManagerStatusType {
		if (this.DMS)
			return ChatRoomStatusManagerStatusType.DMS;
		if (modStorage.screenIndicatorEnable) {
			if (CurrentScreen === "Appearance")
				return ChatRoomStatusManagerStatusType.Wardrobe;
			if (["ChatAdmin", "FriendList", "InformationSheet", "OnlineProfile", "Preference", "Title"].includes(CurrentScreen))
				return ChatRoomStatusManagerStatusType.Profile;
			if (ChatRoomGame && CurrentScreen === `Game${ChatRoomGame}`)
				return ChatRoomStatusManagerStatusType.Profile;
		}
		if (modStorage.typingIndicatorEnable)
			return this.TypingStatus;
		return ChatRoomStatusManagerStatusType.None;
	}

	UpdateStatus() {
		const newStatus = this.GetStatus();
		if (newStatus !== this.Status) {
			if (this.WhisperTarget !== null && newStatus === ChatRoomStatusManagerStatusType.Whisper) {
				this.SendUpdate(ChatRoomStatusManagerStatusType.None, null);
			}
			this.Status = newStatus;
			this.SendUpdate(newStatus, newStatus === ChatRoomStatusManagerStatusType.Whisper ? this.WhisperTarget : null);
		}
	}

	private SendUpdate(type: ChatRoomStatusManagerStatusType, target: number | null = null) {
		sendHiddenMessage("ChatRoomStatusEvent", { Type: type, Target: target }, target);
		const NMod = isNModClient();
		if (NMod) ServerSend("ChatRoomStatusEvent", { Type: type, Target: target });
	}

	InputChange() {
		const value = this.InputElement?.value;
		if (typeof value === "string" && value.length > 1) {
			this.TypingStatus = ChatRoomStatusManagerStatusType.Typing;
			this.WhisperTarget = null;
			if (value.startsWith("*") || value.startsWith("/me ") || value.startsWith("/emote ") || value.startsWith("/action ")) {
				this.TypingStatus = ChatRoomStatusManagerStatusType.Emote;
			} else if (value.startsWith("/") || value.startsWith(".")) {
				return this.InputEnd();
			} else if (ChatRoomTargetMemberNumber !== null) {
				this.TypingStatus = ChatRoomStatusManagerStatusType.Whisper;
				this.WhisperTarget = ChatRoomTargetMemberNumber;
			}
			if (this.InputTimeout !== null) {
				clearTimeout(this.InputTimeout);
			}
			this.InputTimeout = BCX_setTimeout(this.InputEnd.bind(this), this.InputTimeoutMs);
			this.UpdateStatus();
		} else {
			this.InputEnd();
		}
	}

	InputEnd() {
		if (this.InputTimeout !== null) {
			clearTimeout(this.InputTimeout);
			this.InputTimeout = null;
		}
		this.TypingStatus = ChatRoomStatusManagerStatusType.None;
		this.UpdateStatus();
	}

	unload() {
		this.DMS = false;
		this.InputEnd();
	}
}

function DMSKeydown(ev: KeyboardEvent) {
	if (ev.altKey && ev.code === "NumpadEnter") {
		ev.preventDefault();
		ev.stopImmediatePropagation();
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		ChatroomSM.DMS = true;
		ChatroomSM.UpdateStatus();
	}
}

function DMSKeyup(ev: KeyboardEvent) {
	if (ChatroomSM.DMS && (ev.key === "Alt" || ev.code === "NumpadEnter")) {
		ChatroomSM.DMS = false;
		ChatroomSM.UpdateStatus();
	}
}

export let ChatroomSM: ChatRoomStatusManager;

function queryAnnounce() {
	announceSelf(true);
}

export class ModuleChatroom extends BaseModule {
	init() {
		ChatroomSM = new ChatRoomStatusManager();
	}

	private o_ChatRoomSM: any | null = null;

	load() {
		if (typeof modStorage.typingIndicatorEnable !== "boolean") {
			modStorage.typingIndicatorEnable = true;
		}
		if (typeof modStorage.screenIndicatorEnable !== "boolean") {
			modStorage.screenIndicatorEnable = true;
		}

		hiddenMessageHandlers.set("hello", (sender, message) => {
			const char = getChatroomCharacter(sender);
			if (!char) {
				console.warn(`BCX: Hello from character not found in room`, sender);
				return;
			}
			if (typeof message?.version !== "string") {
				console.warn(`BCX: Invalid hello`, sender, message);
				return;
			}
			// if (char.BCXVersion !== message.version) {
			// 	console.log(`BCX: ${char.Character.Name} (${char.Character.MemberNumber}) uses BCX version ${message.version}`);
			// }
			char.BCXVersion = message.version;
			// Apply effects
			const effects: Partial<BCX_effects> = isObject(message.effects) ? message.effects : {};
			char.Effects = cloneDeep(defaultBCXEffects);
			if (Array.isArray(effects.Effect) && effects.Effect.every(i => typeof i === "string")) {
				char.Effects.Effect = effects.Effect;
			}
			CharacterRefresh(char.Character, false);
			// Send announcement, if requested
			if (message.request === true) {
				announceSelf(false);
			}
		});

		hiddenMessageHandlers.set("goodbye", (sender) => {
			const char = getChatroomCharacter(sender);
			if (char) {
				char.BCXVersion = null;
				char.Effects = cloneDeep(defaultBCXEffects);
				CharacterRefresh(char.Character, false);
			}
		});

		hookFunction("ChatRoomMessage", 10, (args, next) => {
			const data = args[0];

			if (data?.Type === "Action" && data.Content === "ServerEnter") {
				announceSelf(false);
			}

			return next(args);
		});

		const NMod = isNModClient();

		if (NMod) {
			hookFunction("ChatRoomDrawFriendList", 0, (args, next) => {
				const [C, Zoom, CharX, CharY] = args as [Character, number, number, number];
				const Char = getChatroomCharacter(C.MemberNumber!);
				const Friend = C.ID === 0 || (Player.FriendList ?? []).includes(C.MemberNumber!);
				if (Char?.BCXVersion && ChatRoomHideIconState === 0) {
					if (Friend) {
						drawIcon(MainCanvas, icon_heart, CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom, 50, 1, 4, "#6e6eff");
					} else {
						drawIcon(MainCanvas, icon_BCX_cross, CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom, 50, 0.5, 3, "#6e6eff");
					}
				} else {
					next(args);
				}
			});

			patchFunction("ChatRoomDrawCharacterOverlay", {
				'switch (C.Status)': 'switch (null)'
			});
		} else {
			patchFunction("ChatRoomDrawCharacterOverlay", {
				'DrawImageResize("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom);': ""
			});

			hookFunction("ChatRoomDrawCharacterOverlay", 0, (args, next) => {
				next(args);

				const [C, CharX, CharY, Zoom] = args as [Character, number, number, number];
				const Char = getChatroomCharacter(C.MemberNumber!);
				const Friend = C.ID === 0 || (Player.FriendList ?? []).includes(C.MemberNumber!);
				if (Char?.BCXVersion && ChatRoomHideIconState === 0) {
					if (Friend) {
						drawIcon(MainCanvas, icon_heart, CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom, 50, 1, 4, "#6e6eff");
					} else {
						drawIcon(MainCanvas, icon_BCX_cross, CharX + 375 * Zoom, CharY, 50 * Zoom, 50 * Zoom, 50, 0.7, 3, "#6e6eff");
					}
				} else if (Friend && ChatRoomHideIconState === 0) {
					DrawImageEx("Icons/Small/FriendList.png", CharX + 375 * Zoom, CharY, {
						Width: 50 * Zoom,
						Height: 50 * Zoom
					});
				}
			});

			hookFunction("ChatRoomCreateElement", 0, (args, next) => {
				next(args);
				ChatroomSM.SetInputElement(document.getElementById("InputChat") as HTMLTextAreaElement);
			});
		}

		hookFunction("ChatRoomDrawCharacterOverlay", 0, (args, next) => {
			next(args);

			const [C, CharX, CharY, Zoom] = args as [Character, number, number, number];
			switch (ChatroomSM.GetCharacterStatus(C)) {
				case ChatRoomStatusManagerStatusType.Typing:
					drawTypingIndicatorSpeechBubble(MainCanvas, CharX + 375 * Zoom, CharY + 54 * Zoom, 50 * Zoom, 48 * Zoom, 1);
					break;
				case ChatRoomStatusManagerStatusType.Whisper:
					drawTypingIndicatorSpeechBubble(MainCanvas, CharX + 375 * Zoom, CharY + 54 * Zoom, 50 * Zoom, 48 * Zoom, 0.5);
					break;
				case ChatRoomStatusManagerStatusType.Emote:
					drawTypingIndicatorSpeechBubble(MainCanvas, CharX + 375 * Zoom, CharY + 54 * Zoom, 50 * Zoom, 48 * Zoom, 1, true);
					break;
				case ChatRoomStatusManagerStatusType.DMS:
					DrawRect(CharX + 380 * Zoom, CharY + 53 * Zoom, 40 * Zoom, 40 * Zoom, "White");
					DrawImageEx("Icons/Import.png", CharX + 375 * Zoom, CharY + 50 * Zoom, {
						Width: 50 * Zoom,
						Height: 50 * Zoom
					});
					break;
				case ChatRoomStatusManagerStatusType.Wardrobe:
					DrawImageEx("Assets/Female3DCG/Emoticon/Wardrobe/Icon.png", CharX + 375 * Zoom, CharY + 50 * Zoom, {
						Width: 50 * Zoom,
						Height: 50 * Zoom
					});
					break;
				case ChatRoomStatusManagerStatusType.Profile:
					DrawImageEx("Assets/Female3DCG/Emoticon/Read/Icon.png", CharX + 375 * Zoom, CharY + 50 * Zoom, {
						Width: 50 * Zoom,
						Height: 50 * Zoom,
						SourcePos: [7, 9, 74, 74]
					});
					break;
			}
		});

		window.addEventListener("keydown", DMSKeydown);
		window.addEventListener("keyup", DMSKeyup);

		hookFunction("ChatRoomSendChat", 0, (args, next) => {
			next(args);
			ChatroomSM.InputEnd();
		});

		hookFunction("ChatRoomClearAllElements", 0, (args, next) => {
			next(args);
			ChatroomSM.SetInputElement(null);
		});

		hookFunction("CommonSetScreen", 0, (args, next) => {
			next(args);
			ChatroomSM.UpdateStatus();
		});

		hiddenMessageHandlers.set("ChatRoomStatusEvent", (src, data: any) => {
			for (const char of ChatRoomCharacter) {
				if (char.MemberNumber === src) {
					char.Status = data.Target == null || data.Target === Player.MemberNumber ? data.Type : "None";
				}
			}
		});

		if (NMod) {
			this.o_ChatRoomSM = (window as any).ChatRoomSM;
			(window as any).ChatRoomSM = ChatroomSM;
			ServerSocket.on("ChatRoomMessageSync", queryAnnounce);
		}
	}

	run() {
		if (document.getElementById("InputChat") != null) {
			ChatroomSM.SetInputElement(document.getElementById("InputChat") as HTMLTextAreaElement);
		}
		queryAnnounce();
	}

	unload() {
		ChatroomSM.unload();
		if (this.o_ChatRoomSM) {
			(window as any).ChatRoomSM = this.o_ChatRoomSM;
		}
		ServerSocket.off("ChatRoomMessageSync", queryAnnounce);
		sendHiddenMessage("goodbye", undefined);

		window.removeEventListener("keydown", DMSKeydown);
		window.removeEventListener("keyup", DMSKeyup);
	}
}

export function announceSelf(request: boolean = false) {
	const player = getPlayerCharacter();
	sendHiddenMessage("hello", {
		version: VERSION,
		request,
		effects: player.Effects
	});
}
