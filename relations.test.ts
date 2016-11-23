import { expect } from "chai";
import { describe, it } from "mocha-sugar-free";
import { schema, collection } from "./builder";

const appState = schema({
	collection(User, {
		sent: { hasMany: Message, key: "from" },
		received: { hasMany: Message, key: "to" },
	}),
	collection(Message, {
		from: { belongsTo: "User" },
		to: { belongsTo: "User" },
	}),
})



describe('relations', () => {

});
