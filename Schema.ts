type RowId = number | string;

type Either<Result> = Result | Error;
type Maybe<A> = A | undefined;

function mapEither<T,U>(e: Either<T>, map: (t: T) => U): Either<U> {
  return e instanceof Error ? e : map(e);
}

class Schema {
  get<A>(row: SpecificRow<A>): Maybe<A>;
  get<A>(table: A, id: RowId): Maybe<A>;
  get<A>(a:any,b?) {
    return undefined;
  }

  all<A>(table: A): A[] {
    return [];
  }

  for<A>(owner: A): RelationQuery<A>;
  for<A>(owner: A): RelationQuery<A> {
    return new RelationQuery(owner);
  }

  getFor<A,B>(owner: A, table: B): B[] {
  }

  update<A>(table: A, id: RowId, update: {}) {
  }

  relate<A>(record: A): Either<RelationRecord> {
  }
}

class RelationRecord {
  constructor(
    public idA: RowId,
    public idb: RowId
  ) {}
}

type SpecificRow<A> = A;
