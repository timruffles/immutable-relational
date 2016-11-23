import { Map } from "immutable";

type RowId = number | string;

type Fallibly<Result> = Result | Error;
type Maybe<A> = A | undefined;

function mapFallibly<T,U>(e: Fallibly<T>, map: (t: T) => U): Fallibly<U> {
  return e instanceof Error ? e : map(e);
}

export class Collection<A> {
  constructor(
    public klass: ClassOf<A>
  ) {}
}

export interface SchemaOptions {
  collections: Collection<{}>[]
}

function emptyTable() {
  return Map<RowId,{}>();
}

function toTableName(x: any) {
  return x.name;
}

function getTableKey(x: any) {
  return x.name;
}

type TableName = string;
type TableSpace = Map<TableName, Table<{}>>;



export class Schema {
  public collections: Collection<{}>[];

  constructor({ collections }: SchemaOptions) {
    this.collections = collections;
  }

  initial() {
    return this.collections.reduce((a,c) =>
      a.set(toTableName(c.klass), emptyTable())
    , Map<TableName, Table<{}>>());
  }

  db(s: TableSpace) {
    return new Db(this, s);
  }
}

type Updater<A> = (a: A) => A;
type UpdaterOrPatch<A> = {} | Updater<A>;

export class SingleOperationReturningState {

  constructor(
    private db: Db
  ) {
  }

  update<A>(table: TableSpec<A>, id: RowId, update: UpdaterOrPatch<A>): TableSpace {
    return this.db.update(table, id, update).run();
  }

  updateAll<A>(table: TableSpec<A>, update: UpdaterOrPatch<A>): TableSpace {
    return this.db.updateAll(table, update).run();
  }

  insert<A>(table: TableSpec<A>, row: A): TableSpace {
    return this.db.update(table, (row as any).id, row).run();
  }

  delete<A>(table: TableSpec<A>, id: RowId): TableSpace {
    return this.db.delete(table, id).run();
  }


  deleteWhere<A>(table: TableSpec<A>, pred: (a: A, id: RowId) => any): TableSpace {
    return this.db.deleteWhere(table, pred).run();
  }

}



interface SingleOperationOverDb {
  get<A>(table: A, id: RowId): Maybe<A>;
  all<A>(table: A): A[];
  for<A>(owner: A): RelationQuery<A>;
  getFor<A,B>(owner: A, table: B): Maybe<B>;
  update<A>(table: A, id: RowId, update: {}): Fallibly<A>;
  delete<A>(table: A, id: RowId): Fallibly<A>;
  relate<A>(table: A, record: A): RelationChain<A>;
}


export class Db {

  operations: Function[] = [];

  constructor(
    private schema: Schema,
    private state: TableSpace
  ) {
  }

  get after(): SingleOperationReturningState {
    return new SingleOperationReturningState(this);
  }

  all<A>(table: TableSpec<A>): A[] {
    return [
      ...(this.state.get(getTableKey(table)).values() as any)
    ];
  }

  update<A>(table: TableSpec<A>, id: RowId, update: UpdaterOrPatch<A>) {
    this.queue((s) => {
      const fn = typeof update === 'function'
        ? (v: any) => Object.assign({}, v, update(v))
        : (v: any) => Object.assign({}, v, update);
      return s.updateIn([getTableKey(table), id], fn);
    })
    return this;
  }


  updateAll<A>(table: TableSpec<A>, update: UpdaterOrPatch<A>) {
    this.queue((s) => {
      const innerUpdate = typeof update === 'function'
        ? (c: any, v: any, id: any) => c.updateIn([getTableKey(table), id], update)
        : (c: any, v: any, id: any) => {
          return c.update(id, (curr: any) => Object.assign({}, curr, update))
        }
        ;

      // super dumb implementation
      const tableKey = getTableKey(table);
      const original = s.get(tableKey)
      
      return s.set(tableKey, original.reduce(innerUpdate, original));
    });

    return this;
  }

  delete<A>(table: TableSpec<A>, id: RowId) {
    this.queue((s) => {
      return s.deleteIn([getTableKey(table), id]);
    })
    return this;
  }

  deleteWhere<A>(table: TableSpec<A>, pred: (a: A, id: RowId) => any) {
    this.queue((s) => {
      const key = getTableKey(table);
      return s.set(key, s.get(key).filterNot(pred) as any);
    });
    return this;
  }

  run() {
    let state = this.state;
    this.operations.forEach((op) => {
      state = op(state);
    })

    this.state = state;
    return state;
  }

  queue(operation: (s: TableSpace) => TableSpace) {
    this.operations.push(operation);
  }


}

type Table<A> = Map<RowId, A>;
type TableSpec<A> = ClassOf<A>;

class RelationChain<A> {
  constructor(
    private a: A,
    private schema: Schema
  ) {}

  to<B>(b: B): Fallibly<RelationRecord> {
    return Error("this doesn't relate!");
  }
}

export class RelationRecord {
  constructor(
    public idA: RowId,
    public idb: RowId
  ) {}
}

export type SpecificRow<A> = A;
export interface ClassOf<T> {
  new (...args: any[]): T;
}

class RelationQuery<A> {
  constructor(
    private a: A
  ) {}

  all<B>(b: ClassOf<B>): B[] {
    return [];
  }
}

