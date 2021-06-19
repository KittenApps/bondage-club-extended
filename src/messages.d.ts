type BCX_beep_versionCheck = {
	version: string;
	UA: string;
};

type BCX_beep_versionResponse = {
	status: "unsupported" | "deprecated" | "newAvailable" | "current";
};

type BCX_beeps = {
	versionCheck: BCX_beep_versionCheck;
	versionResponse: BCX_beep_versionResponse;
};

type BCX_message_ChatRoomStatusEvent = {
	Type: string;
	Target: number | null;
};

type BCX_message_hello = {
	version: string;
	request: boolean;
};

type BCX_message_query = {
	id: string;
	query: keyof BCX_queries;
	data?: any;
};

type BCX_message_queryAnswer = {
	id: string;
	ok: boolean;
	data?: any;
};

type BCX_messages = {
	ChatRoomStatusEvent: BCX_message_ChatRoomStatusEvent;
	hello: BCX_message_hello;
	goodbye: undefined;
	query: BCX_message_query;
	queryAnswer: BCX_message_queryAnswer;
	somethingChanged: undefined;
};

type BCX_queries = {
	permissions: [undefined, PermissionsBundle];
};