import cloneDeep from "lodash-es/cloneDeep";
import isEqual from "lodash-es/isEqual";
import { ChatroomCharacter } from "../characters";
import { ModuleCategory, ModuleInitPhase, Preset } from "../constants";
import { moduleInitPhase } from "../moduleManager";
import { initRules_bc_blocks } from "../rules/bc_blocks";
import { capitalizeFirstLetter, formatTimeInterval, isObject } from "../utils";
import { ChatRoomActionMessage, ChatRoomSendLocal, getCharacterName } from "../utilsClub";
import { AccessLevel, registerPermission } from "./authority";
import { Command_fixExclamationMark, Command_pickAutocomplete, registerWhisperCommand } from "./commands";
import { ConditionsAutocompleteSubcommand, ConditionsCheckAccess, ConditionsGetCategoryPublicData, ConditionsGetCondition, ConditionsIsConditionInEffect, ConditionsRegisterCategory, ConditionsRemoveCondition, ConditionsRunSubcommand, ConditionsSetCondition, ConditionsSubcommand, ConditionsSubcommands } from "./conditions";
import { LogEntryType, logMessage } from "./log";
import { queryHandlers } from "./messaging";
import { moduleIsEnabled } from "./presets";
import { BaseModule } from "./_BaseModule";

const RULES_ANTILOOP_RESET_INTERVAL = 60_000;
const RULES_ANTILOOP_THRESHOLD = 10;
const RULES_ANTILOOP_SUSPEND_TIME = 600_000;

export function guard_BCX_Rule(name: unknown): name is BCX_Rule {
	return typeof name === "string" && rules.has(name as BCX_Rule);
}

export function guard_RuleCustomData(rule: BCX_Rule, data: unknown): boolean {
	const descriptor = rules.get(rule as BCX_Rule);
	if (!descriptor)
		return false;

	if (descriptor.dataDefinition) {
		if (!isObject(data))
			return false;
		for (const k of Object.keys(data)) {
			if (!(descriptor.dataDefinition as Record<string, any>)[k])
				return false;
		}
		for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(descriptor.dataDefinition)) {
			const handler = ruleCustomDataHandlers[def.type];
			if (!handler || !handler.validate(data[k]))
				return false;
		}
	} else if (data !== undefined) {
		return false;
	}

	return true;
}

const rules: Map<BCX_Rule, RuleDefinition> = new Map();
const rulesList: BCX_Rule[] = [];

export function registerRule<ID extends BCX_Rule>(name: ID, data: RuleDefinition<ID>) {
	if (moduleInitPhase !== ModuleInitPhase.init) {
		throw new Error("Rules can be registered only during init");
	}
	if (rules.has(name)) {
		throw new Error(`Rule "${name}" already defined!`);
	}
	rules.set(name, data);
	rulesList.push(name);
}

export function RulesGetDisplayDefinition(rule: BCX_Rule): RuleDisplayDefinition {
	const data = rules.get(rule);
	if (!data) {
		throw new Error(`Attempt to get display definition for unknown rule '${rule}'`);
	}
	return {
		name: data.name,
		icon: data.icon,
		shortDescription: data.shortDescription,
		longDescription: data.longDescription,
		defaultLimit: data.defaultLimit
	};
}

export type RuleCustomDataHandler<type extends RuleCustomDataTypes = RuleCustomDataTypes> = {
	validate(value: unknown): boolean;
	onDataChange?(active: boolean, key: string, onInput: () => void): void;
	processInput?(key: string): RuleCustomDataTypesMap[type] | undefined;
	run(value: RuleCustomDataTypesMap[type], Y: number, key: string): void;
	click(value: RuleCustomDataTypesMap[type], Y: number, key: string): RuleCustomDataTypesMap[type] | undefined;
};

export const ruleCustomDataHandlers: {
	[type in RuleCustomDataTypes]: RuleCustomDataHandler<type>;
} = {
	memberNumberList: {
		validate: value => Array.isArray(value) && value.every(Number.isInteger),
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	},
	number: {
		validate: value => typeof value === "number",
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	},
	orgasm: {
		validate: value => value === "edge" || value === "ruined" || value === "noResist",
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	},
	poseSelect: {
		// TODO: stricten
		validate: value => Array.isArray(value) && value.every(i => typeof i === "string"),
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	},
	roleSelector: {
		validate: value => typeof value === "number" && AccessLevel[value] !== undefined,
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	},
	strengthSelect: {
		validate: value => value === "light" || value === "medium" || value === "heavy",
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	},
	string: {
		validate: value => typeof value === "string",
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	},
	stringList: {
		validate: value => Array.isArray(value) && value.every(i => typeof i === "string"),
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	},
	toggle: {
		validate: value => typeof value === "boolean",
		run(value, Y) { /* TODO */ },
		click(value, Y) { return undefined; }
	}
};

function parseRuleName(selector: string, filter?: (ruleName: BCX_Rule) => boolean): [true, BCX_Rule] | [false, string] {
	selector = selector.toLocaleLowerCase();
	const rule = Array.from(rules.entries())
		.filter(r => !filter || filter(r[0]))
		.find(([ruleName, data]) => ruleName.toLocaleLowerCase() === selector || data.name.toLocaleLowerCase() === selector);
	return rule ? [true, rule[0]] : [false, `Unknown rule "${selector}".`];
}

function autocompleteRuleName(selector: string, filter?: (ruleName: BCX_Rule) => boolean): string[] {
	selector = selector.toLocaleLowerCase();

	let options: string[] = Array.from(rules.entries())
		.filter(r => r[1].name.toLocaleLowerCase().startsWith(selector) && (!filter || filter(r[0])))
		.map(r => r[1].name);

	if (options.length === 0) {
		options = Array.from(rules.entries())
			.filter(r => r[0].toLocaleLowerCase().startsWith(selector) && (!filter || filter(r[0])))
			.map(r => r[0]);
	}

	return options;
}

export function RulesGetList(): [BCX_Rule, RuleDisplayDefinition][] {
	return rulesList.map(rule => [rule, RulesGetDisplayDefinition(rule)]);
}

export function RulesCreate(rule: BCX_Rule, character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Rules))
		return false;

	if (character && !ConditionsCheckAccess("rules", rule, character))
		return false;

	const display = RulesGetDisplayDefinition(rule);

	if (!ConditionsGetCondition("rules", rule)) {
		ConditionsSetCondition("rules", rule, {});
		if (character) {
			logMessage("rule_change", LogEntryType.plaintext, `${character} added a new rule: ${display.name}`);
			if (!character.isPlayer()) {
				ChatRoomSendLocal(`${character} gave you a new rule: "${display.name}"`);
			}
		}
	}

	return true;
}

export function RulesDelete(rule: BCX_Rule, character: ChatroomCharacter | null): boolean {
	if (!moduleIsEnabled(ModuleCategory.Rules))
		return false;

	if (character && !ConditionsCheckAccess("rules", rule, character))
		return false;

	const display = RulesGetDisplayDefinition(rule);

	if (ConditionsRemoveCondition("rules", rule) && character) {
		logMessage("rule_change", LogEntryType.plaintext, `${character} removed the rule: ${display.name}`);
		if (!character.isPlayer()) {
			ChatRoomSendLocal(`${character} removed your rule "${display.name}"`);
		}
	}

	return true;
}

export function RuleIsEnforced(rule: BCX_Rule): boolean {
	const data = ConditionsGetCondition("rules", rule);
	if (!data || !ConditionsIsConditionInEffect("rules", rule))
		return false;
	return data.data.enforce !== false;
}

export function RuleIsLogged(rule: BCX_Rule): boolean {
	const data = ConditionsGetCondition("rules", rule);
	if (!data || !ConditionsIsConditionInEffect("rules", rule))
		return false;
	return data.data.log !== false;
}

export class ModuleRules extends BaseModule {
	private resetTimer: number | null = null;
	private triggerCounts: Map<BCX_Rule, number> = new Map();
	private suspendedUntil: number | null = null;

	init() {
		registerPermission("rules_normal", {
			name: "Allows controlling non-limited rules",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.lover],
				[Preset.switch]: [true, AccessLevel.lover],
				[Preset.submissive]: [false, AccessLevel.mistress],
				[Preset.slave]: [false, AccessLevel.mistress]
			}
		});
		registerPermission("rules_limited", {
			name: "Allows controlling limited rules",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("rules_global_configuration", {
			name: "Allows editing the global rules configuration",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.owner],
				[Preset.switch]: [true, AccessLevel.owner],
				[Preset.submissive]: [false, AccessLevel.lover],
				[Preset.slave]: [false, AccessLevel.lover]
			}
		});
		registerPermission("rules_change_limits", {
			name: "Allows to limit/block specific rules",
			category: ModuleCategory.Rules,
			defaults: {
				[Preset.dominant]: [true, AccessLevel.self],
				[Preset.switch]: [true, AccessLevel.self],
				[Preset.submissive]: [true, AccessLevel.self],
				[Preset.slave]: [false, AccessLevel.owner]
			}
		});

		queryHandlers.ruleCreate = (sender, resolve, data) => {
			if (guard_BCX_Rule(data)) {
				resolve(true, RulesCreate(data, sender));
			} else {
				resolve(false);
			}
		};
		queryHandlers.ruleDelete = (sender, resolve, data) => {
			if (guard_BCX_Rule(data)) {
				resolve(true, RulesDelete(data, sender));
			} else {
				resolve(false);
			}
		};

		registerWhisperCommand("rules", "- Manage rules", (argv, sender, respond) => {
			if (!moduleIsEnabled(ModuleCategory.Rules)) {
				return respond(`Rules module is disabled.`);
			}
			const subcommand = (argv[0] || "").toLocaleLowerCase();
			const rulesInfo = ConditionsGetCategoryPublicData("rules", sender).conditions;
			if (ConditionsSubcommands.includes(subcommand as ConditionsSubcommand)) {
				return ConditionsRunSubcommand("rules", argv, sender, respond);
			} else if (subcommand === "list") {
				let result = "Current rules:";
				for (const [k, v] of Object.entries(rulesInfo)) {
					const data = RulesGetDisplayDefinition(k as BCX_Rule);
					const timerText = `Timer: ${v.timer ? formatTimeInterval(v.timer - Date.now(), "short") : "∞"}`;
					result += `\n${data.name} | ${timerText}`;
				}
				respond(result);
			} else {
				respond(Command_fixExclamationMark(sender, `!rules usage (page 1):\n` +
					`!rules list - List all currently applied rules\n`
				));
				respond(Command_fixExclamationMark(sender, `!rules usage (page 2):\n` +
					`!rules setactive <rule> <yes/no> - Switch the rule and its conditions on and off\n` +
					`!rules triggers <rule> global <yes/no> - Set the trigger condition of this rule to the global configuration\n` +
					`!rules triggers <rule> help - Set the trigger configuration of a rule\n` +
					`!rules globaltriggers help - Set global trigger configuration\n` +
					`!rules timer <rule> help - Set timer options of a rule\n` +
					`!rules defaulttimer help - Set default timer options used on new rules\n` +
					`!rules setlimit <rule> <normal/limited/blocked> - Set a limit on certain <rule>\n` +
					`\nHint: If an argument contains spaces: "put it in quotes"`
				));
			}
		}, (argv, sender) => {
			if (!moduleIsEnabled(ModuleCategory.Rules)) {
				return [];
			}
			if (argv.length <= 1) {
				return Command_pickAutocomplete(argv[0], ["list", ...ConditionsSubcommands]);
			}

			const subcommand = argv[0].toLocaleLowerCase();

			if (ConditionsSubcommands.includes(subcommand as ConditionsSubcommand)) {
				return ConditionsAutocompleteSubcommand("rules", argv, sender);
			}

			return [];
		});

		ConditionsRegisterCategory("rules", {
			category: ModuleCategory.Rules,
			permission_normal: "rules_normal",
			permission_limited: "rules_limited",
			permission_configure: "rules_global_configuration",
			permission_changeLimits: "rules_change_limits",
			loadValidateConditionKey: rule => guard_BCX_Rule(rule),
			loadValidateCondition: (rule, data) => {
				const info = data.data;
				const descriptor = rules.get(rule as BCX_Rule);
				if (!descriptor) {
					console.error(`BCX: Bad data for rule ${rule}: descriptor not found, removing it`);
					return false;
				}

				if (!isObject(info) ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					(info.enforce !== undefined && info.enforce !== false) ||
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
					(info.log !== undefined && info.log !== false)
				) {
					console.error(`BCX: Bad data for rule ${rule}, removing it`, info);
					return false;
				}

				if (descriptor.dataDefinition) {
					if (!isObject(info.customData)) {
						console.error(`BCX: Bad custom data for rule ${rule}, removing it`, info);
						return false;
					}
					for (const k of Object.keys(info.customData)) {
						if (!(descriptor.dataDefinition as Record<string, any>)[k]) {
							console.error(`BCX: Unknown custom data attribute '${k}' for rule ${rule}, removing it`, info);
							return false;
						}
					}
					for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(descriptor.dataDefinition)) {
						const handler = ruleCustomDataHandlers[def.type];
						if (!handler) {
							console.error(`BCX: Custom data for rule ${rule} unknown type ${def.type}, removing it`, info);
							return false;
						}
						if (!handler.validate(info.customData[k])) {
							console.error(`BCX: Bad custom data ${k} for rule ${rule}, expected type ${def.type}, removing it`, info);
							return false;
						}
					}
				} else if (info.customData !== undefined) {
					console.error(`BCX: Custom data for rule ${rule} without data definition, removing it`, info);
					return false;
				}

				return true;
			},
			tickHandler: this.ruleTick.bind(this),
			makePublicData: (rule, data) => ({
				enforce: data.data.enforce ?? true,
				log: data.data.log ?? true,
				customData: cloneDeep(data.data.customData)
			}),
			validatePublicData: (rule, data) =>
				isObject(data) &&
				typeof data.enforce === "boolean" &&
				typeof data.log === "boolean" &&
				guard_RuleCustomData(rule, data.customData),
			updateCondition: (condition, data, updateData) => {
				if (updateData.enforce) {
					delete data.data.enforce;
				} else {
					data.data.enforce = false;
				}

				if (updateData.log) {
					delete data.data.log;
				} else {
					data.data.log = false;
				}

				if (updateData.customData) {
					data.data.customData = cloneDeep(updateData.customData);
				}

				return true;
			},
			parseConditionName: (selector, onlyExisting) => {
				return parseRuleName(selector, onlyExisting ? (rule => onlyExisting.includes(rule)) : undefined);
			},
			autocompleteConditionName: (selector, onlyExisting) => {
				return autocompleteRuleName(selector, onlyExisting ? (rule => onlyExisting.includes(rule)) : undefined);
			},
			logLimitChange: (rule, character, newLimit) => {
				const definition = RulesGetDisplayDefinition(rule);
				logMessage("rule_change", LogEntryType.plaintext,
					`${character} changed ${Player.Name}'s '${definition.name}' rule permission to ${newLimit}`);
				if (!character.isPlayer()) {
					ChatRoomSendLocal(`${character} changed '${definition.name}' rule permission to ${newLimit}`, undefined, character.MemberNumber);
				}
			},
			logConditionUpdate: (rule, character, newData, oldData) => {
				const definition = RulesGetDisplayDefinition(rule);
				const visibleName = definition.name;

				const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
				const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
				const changeEvents: string[] = [];
				if (didTimerChange)
					changeEvents.push("timer");
				if (didTriggerChange)
					changeEvents.push("trigger condition");
				if (definition.dataDefinition) {
					for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(definition.dataDefinition)) {
						if (!isEqual(oldData.data.customData?.[k], newData.data.customData?.[k])) {
							changeEvents.push(def.description);
						}
					}
				}
				if (changeEvents.length > 0) {
					logMessage("rule_change", LogEntryType.plaintext,
						`${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s '${visibleName}' rule`);
				}
				if (!character.isPlayer()) {
					if (newData.timer !== oldData.timer)
						if (newData.timer === null) {
							ChatRoomSendLocal(`${character} disabled the timer of the '${visibleName}' rule`, undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} changed the remaining time of the timer of the '${visibleName}' rule to ${formatTimeInterval(newData.timer - Date.now())}`, undefined, character.MemberNumber);
						}
					if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
						ChatRoomSendLocal(`${character} changed the timer behavior of the '${visibleName}' rule to ${newData.timerRemove ? "remove" : "disable"} the rule when time runs out`, undefined, character.MemberNumber);
					if (didTriggerChange)
						if (newData.requirements === null) {
							ChatRoomSendLocal(`${character} set the triggers of '${visibleName}' rule to the global rules configuration`, undefined, character.MemberNumber);
						} else {
							const triggers: string[] = [];
							const r = newData.requirements;
							if (r.room) {
								triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
							}
							if (r.roomName) {
								triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
							}
							if (r.role) {
								const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
								triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
							}
							if (r.player) {
								const name = getCharacterName(r.player.memberNumber, null);
								triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
							}
							if (triggers.length > 0) {
								ChatRoomSendLocal(`${character} set the '${visibleName}' rule to trigger under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
							} else {
								ChatRoomSendLocal(`${character} deactivated all trigger conditions of the '${visibleName}' rule. The rule will now always trigger, while it is active`, undefined, character.MemberNumber);
							}
						}
					if (definition.dataDefinition) {
						for (const [k, def] of Object.entries<RuleCustomDataEntryDefinition>(definition.dataDefinition)) {
							if (!isEqual(oldData.data.customData?.[k], newData.data.customData?.[k])) {
								ChatRoomSendLocal(`${character} changed the '${visibleName}' rule '${def.description}' setting:`, undefined, character.MemberNumber);
							}
						}
					}
				}
			},
			logCategoryUpdate: (character, newData, oldData) => {
				const didTimerChange = newData.timer !== oldData.timer || newData.timerRemove !== oldData.timerRemove;
				const didTriggerChange = !isEqual(newData.requirements, oldData.requirements);
				const changeEvents = [];
				if (didTimerChange)
					changeEvents.push("default timer");
				if (didTriggerChange)
					changeEvents.push("trigger condition");
				if (changeEvents.length > 0) {
					logMessage("curse_change", LogEntryType.plaintext,
						`${character} changed the ${changeEvents.join(", ")} of ${Player.Name}'s global rules config`);
				}
				if (!character.isPlayer()) {
					if (newData.timer !== oldData.timer)
						if (newData.timer === null) {
							ChatRoomSendLocal(`${character} removed the default timer of the global rules configuration`, undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} changed the default timer of the global rules configuration to ${formatTimeInterval(newData.timer)}`, undefined, character.MemberNumber);
						}
					if (newData.timer !== null && newData.timerRemove !== oldData.timerRemove)
						ChatRoomSendLocal(`${character} changed the default timeout behavior of the global rules configuration to ${newData.timerRemove ? "removal of rules" : "disabling rules"} when time runs out`, undefined, character.MemberNumber);
					if (didTriggerChange) {
						const triggers: string[] = [];
						const r = newData.requirements;
						if (r.room) {
							triggers.push(`When ${r.room.inverted ? "not in" : "in"} ${r.room.type} room`);
						}
						if (r.roomName) {
							triggers.push(`When ${r.roomName.inverted ? "not in" : "in"} room named '${r.roomName.name}'`);
						}
						if (r.role) {
							const role = capitalizeFirstLetter(AccessLevel[r.role.role]) + (r.role.role !== AccessLevel.clubowner ? " ↑" : "");
							triggers.push(`When ${r.role.inverted ? "not in" : "in"} room with role '${role}'`);
						}
						if (r.player) {
							const name = getCharacterName(r.player.memberNumber, null);
							triggers.push(`When ${r.player.inverted ? "not in" : "in"} room with member '${r.player.memberNumber}'${name ? ` (${name})` : ""}`);
						}
						if (triggers.length > 0) {
							ChatRoomSendLocal(`${character} set the global rules configuration to trigger rules under following conditions:\n` + triggers.join("\n"), undefined, character.MemberNumber);
						} else {
							ChatRoomSendLocal(`${character} deactivated all trigger conditions for the global rules configuration. Rules set to this default configuration will now always trigger, while active`, undefined, character.MemberNumber);
						}
					}
				}
			},
			commandConditionSelectorHelp: "rule"
		});

		// Init individual rules
		initRules_bc_blocks();
	}

	load() {
		if (!moduleIsEnabled(ModuleCategory.Rules)) {
			return;
		}

		for (const rule of rules.values()) {
			if (rule.load) {
				rule.load();
			}
		}
	}

	run() {
		if (!moduleIsEnabled(ModuleCategory.Rules))
			return;

		this.resetTimer = setInterval(() => {
			this.triggerCounts.clear();
		}, RULES_ANTILOOP_RESET_INTERVAL);
	}

	unload() {
		if (this.resetTimer !== null) {
			clearInterval(this.resetTimer);
			this.resetTimer = null;
		}

		for (const rule of rules.values()) {
			if (rule.unload) {
				rule.unload();
			}
		}
	}

	reload() {
		this.unload();
		this.load();
		this.run();
	}

	ruleTick(rule: BCX_Rule, condition: ConditionsConditionData<"rules">): void {
		if (this.suspendedUntil !== null) {
			if (Date.now() >= this.suspendedUntil) {
				this.suspendedUntil = null;
				this.triggerCounts.clear();
				ChatRoomActionMessage(`All of ${Player.Name}'s temporarily suspended rules are in effect again.`);
			} else {
				return;
			}
		}

		const ruleDefinition = rules.get(rule);
		if (!ruleDefinition) {
			throw new Error(`Definition for rule ${rule} not found`);
		}

		if (ruleDefinition.tick) {
			if (ruleDefinition.tick()) {
				const counter = (this.triggerCounts.get(rule) ?? 0) + 1;
				this.triggerCounts.set(rule, counter);

				if (counter >= RULES_ANTILOOP_THRESHOLD) {
					ChatRoomActionMessage("Protection triggered: The effects of rules have been suspended for 10 minutes. Please refrain from triggering rules so rapidly, as it creates strain on the server and may lead to unwanted side effects! If you believe this message was triggered by a bug, please report it to BCX Discord.");
					this.suspendedUntil = Date.now() + RULES_ANTILOOP_SUSPEND_TIME;
				}
			}
		}
	}
}
