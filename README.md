## Immutable DB

It can be a pain to use Redux with TypeScript, when sticking to immutable data. This library makes it much easier. It's basically a type-safe database for Redux:

```typescript
interface SingleOperationOverDb {
  get<A>(table: A, id: RowId): Maybe<A>;
  all<A>(table: A): A[];
  for<A>(owner: A): RelationQuery<A>;
  getFor<A,B>(owner: A, table: B): Maybe<B>;
  update<A>(table: A, id: RowId, update: {}): Fallibly<A>;
  delete<A>(table: A, id: RowId): Fallibly<A>;
  relate<A>(record: A): RelationChain<A>;
}
```

For example, relating two records becomes concise and type-safe:

```typescript
const user = db.get(User, 10);
user.name // type error - it's a Maybe<User>, not a user
maybe.map(user, (u) => u.name); // string[]


const wasRelated = db.relate(User, user)
    .to(Message, 10); // Fallibly<RelationRecord<User,Message>>
```

So common reducer operations that can be quite intricate become a lot simpler:

```typescript
function reduceComments(state: CommentDb, action: Action) {
  switch(action.type) {
    case 'commentOnComment':
      const { newState, commented } = state
        .insert(Comment, action.commentData); // inserted: Comment

      return newState.relate(Comment, commented)
        .to(Comment, action.originalComment);
      
    // ...
  }
}
```

Defining schemas looks like this:

```javascript

const schema = schema({
  collections: [
    collection(User,
      relations(
        hasOne(Profile),
        hasMany(Message)
      )
    ),
    collection(Message,
      relations(
        belongsTo(User)
      )
    ),
    collection(Profile,
      relations(
        belongsTo(User)
      )
    ),
  ]
});

schema.insert(User, [
  { name: 'a' },
  { name: 'b' },
]) // User[]

schema.get(User, 1); // Maybe<User>
schema.update(User, 1, {}); // Fallibly<Updated>

schema.remove(User, 1); // Fallibly<Deleted>

schema.getAll(User); // User[]
schema.for(User, 2).get(Profile); // Maybe<Profile>
schema.for(User, 2).getAll(Message); // Message[]
```

## Anti-goals

It only throws errors on logical issues: e.g you relate a record to a table that it has no relation defined for. It returns an `Either` for any operations that might be expected to 'fail' - like relating to a record that no-longer exists.

Though the API feels similar to a relation DB, there is no attempt to do schema validation. That's much better solved elsewhere in your app. Think of it as a boiler-plate reducing wrapper around the kind of things you usually do with `Map`, manually.
