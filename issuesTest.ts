class Issue {
  constructor(
    public id: number,
    public text: string,
    public open: boolean
  ) {}
}

class Milestone {
  constructor(
    public id: number,
  ) {}
}

type Maybe<A> = A | undefined;

class Ui {
  constructor(
    public searchText: string,
    public currentMilestone: Maybe<number>,
  ) {}

  static initial() {
    return new Ui("", null);
  }
}

class VisibleIssue {
  constructor(
    public issueId: number
  ) {}
}

import { schema, collection } from "./builder";

const appSchema = schema({
  collections: [
    collection(Todo),
  ],
});

class AddIssue {
  constructor(

  ) {}
}

type Action = AddIssue;

function reducer(state = appSchema.emptyDb({ ui: Ui.initial() }), action: Action) {
  const db = appSchema.dbIn(state);

  switch(action.type) {
    case "AddIssue":
      return db.insert(Issue, action);

  }
}
