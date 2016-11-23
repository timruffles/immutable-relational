import { schema, collection } from "./builder";

export class Todo {
  constructor(
    public id: number,
    public text: string,
    public completed: boolean,
  ) {}
}

const appSchema = schema({
  collections: [
    collection(Todo),
  ],
});

type Action = any;

function getInitial() {
  const i = appSchema.initial();
  return appSchema.db(i).after.insert(Todo, new Todo(0, "Use Redux", false));
}

function fromArray(xs: any[]) {
  const idb = appSchema.db(appSchema.initial());
  return xs.reduce((s,x) => s.update(Todo, x.id, x), idb).run();
}

export default function todos(state: any = getInitial(), action: Action) {
  if(typeof state.length === 'number') {
    state = fromArray(state);
  }

  const db = appSchema.db(state);
  const after = db.after;

  switch (action.type) {
    case "ADD_TODO":
      const id = db.all(Todo).reduce((maxId, todo) => Math.max(todo.id, maxId), -1) + 1;
      return after.insert(Todo, new Todo(
        id,
        action.text,
        false
      ));

    case "DELETE_TODO":
      return after.delete(Todo, action.id);

    case "EDIT_TODO":
      return after.update(Todo, action.id, { text: action.text });

    case "COMPLETE_TODO":
      return after.update(Todo, action.id, (todo) => ({ completed: !todo.completed }));

    case "COMPLETE_ALL":
      const areAllMarked = db.all(Todo).every(t => t.completed);
      return after.updateAll(Todo, { completed: !areAllMarked });

    case "CLEAR_COMPLETED":
      return after.deleteWhere(Todo, t => t.completed);

    default:
      return state
  }
}


import { expect } from "chai";
import { describe, it } from "mocha-sugar-free";


describe.only('todos reducer', () => {
  it('should handle initial state', () => {
    expect(
      prepareState(todos(undefined, {}))
    ).deep.equals([
      {
        text: 'Use Redux',
        completed: false,
        id: 0
      }
    ])
  })

  it('should handle ADD_TODO', () => {
    expect(
      prepareState(todos([], {
        type: 'ADD_TODO',
        text: 'Run the tests'
      }))
    ).deep.equals([
      {
        text: 'Run the tests',
        completed: false,
        id: 0
      }
    ])

    expect(
      prepareState(todos([
        {
          text: 'Use Redux',
          completed: false,
          id: 0
        }
      ], {
        type: 'ADD_TODO',
        text: 'Run the tests'
      }))
    ).deep.equals([
      {
        text: 'Run the tests',
        completed: false,
        id: 1
      }, {
        text: 'Use Redux',
        completed: false,
        id: 0
      }
    ])

    expect(
      prepareState(todos([
        {
          text: 'Run the tests',
          completed: false,
          id: 1
        }, {
          text: 'Use Redux',
          completed: false,
          id: 0
        }
      ], {
        type: 'ADD_TODO',
        text: 'Fix the tests'
      }))
    ).deep.equals([
      {
        text: 'Fix the tests',
        completed: false,
        id: 2
      }, {
        text: 'Run the tests',
        completed: false,
        id: 1
      }, {
        text: 'Use Redux',
        completed: false,
        id: 0
      }
    ])
  })

  it('should handle DELETE_TODO', () => {
    expect(
      prepareState(todos([
        {
          text: 'Run the tests',
          completed: false,
          id: 1
        }, {
          text: 'Use Redux',
          completed: false,
          id: 0
        }
      ], {
        type: 'DELETE_TODO',
        id: 1
      }))
    ).deep.equals([
      {
        text: 'Use Redux',
        completed: false,
        id: 0
      }
    ])
  })

  it('should handle EDIT_TODO', () => {
    expect(
      prepareState(todos([
        {
          text: 'Run the tests',
          completed: false,
          id: 1
        }, {
          text: 'Use Redux',
          completed: false,
          id: 0
        }
      ], {
        type: 'EDIT_TODO',
        text: 'Fix the tests',
        id: 1
      }))
    ).deep.equals([
      {
        text: 'Fix the tests',
        completed: false,
        id: 1
      }, {
        text: 'Use Redux',
        completed: false,
        id: 0
      }
    ])
  })

  it('should handle COMPLETE_TODO', () => {
    expect(
      prepareState(todos([
        {
          text: 'Run the tests',
          completed: false,
          id: 1
        }, {
          text: 'Use Redux',
          completed: false,
          id: 0
        }
      ], {
        type: 'COMPLETE_TODO',
        id: 1
      }))
    ).deep.equals([
      {
        text: 'Run the tests',
        completed: true,
        id: 1
      }, {
        text: 'Use Redux',
        completed: false,
        id: 0
      }
    ])
  })

  it('should handle COMPLETE_ALL', () => {
    expect(
      prepareState(todos([
        {
          text: 'Run the tests',
          completed: true,
          id: 1
        }, {
          text: 'Use Redux',
          completed: false,
          id: 0
        }
      ], {
        type: 'COMPLETE_ALL'
      }))
    ).deep.equals([
      {
        text: 'Run the tests',
        completed: true,
        id: 1
      }, {
        text: 'Use Redux',
        completed: true,
        id: 0
      }
    ])

    // Unmark if all todos are currently completed
    expect(
      prepareState(todos([
        {
          text: 'Run the tests',
          completed: true,
          id: 1
        }, {
          text: 'Use Redux',
          completed: true,
          id: 0
        }
      ], {
        type: 'COMPLETE_ALL'
      }))
    ).deep.equals([
      {
        text: 'Run the tests',
        completed: false,
        id: 1
      }, {
        text: 'Use Redux',
        completed: false,
        id: 0
      }
    ])
  })

  it('should handle CLEAR_COMPLETED', () => {
    expect(
      prepareState(todos([
        {
          text: 'Run the tests',
          completed: true,
          id: 1
        }, {
          text: 'Use Redux',
          completed: false,
          id: 0
        }
      ], {
        type: 'CLEAR_COMPLETED'
      }))
    ).deep.equals([
      {
        text: 'Use Redux',
        completed: false,
        id: 0
      }
    ])
  })

  it('should not generate duplicate ids after CLEAR_COMPLETED', () => {
    expect(
      prepareState([
        {
          type: 'COMPLETE_TODO',
          id: 0
        }, {
          type: 'CLEAR_COMPLETED'
        }, {
          type: 'ADD_TODO',
          text: 'Write more tests'
        }
      ].reduce(todos, [
        {
          id: 0,
          completed: false,
          text: 'Use Redux'
        }, {
          id: 1,
          completed: false,
          text: 'Write tests'
        }
      ]))
    ).deep.equals([
      {
        text: 'Write more tests',
        completed: false,
        id: 2
      }, {
        text: 'Write tests',
        completed: false,
        id: 1
      }
    ])
  })
})

function prepareState(t: Map<any,any>) {
  return [...(t.get("Todo").values() as any)].sort((a,b) => b.id - a.id)
}
