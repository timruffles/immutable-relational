## Immutable DB

Redux works really well if you normalize data. There aren't many good patterns for handling relational data immutably though. This library makes it much easier. It's a type-safe relational data-structure for Redux: basically syntax-sugar around a bunch of maps.

For example, relating two records becomes concise and type-safe:

```typescript
const maybeUser = db.get(User, 10); // Maybe<User>
const maybeName = maybeUser.map((u) => u.name); // Maybe<string>
maybeUser.name // type error - it's a Maybe<User>, not a user

// operations that could logically fail get types (e.g is there a missing key?)
const maybeRelated = maybeUser.map(user => (
  db.relate(User, user)
    .to(Message, 10); // Fallibly<RelationRecord<User, Message>>
));
```

So common reducer operations that can be quite intricate become a lot simpler, with a `.after` method for operations that need to be sequenced.

```typescript
function reduceComments(state: CommentDb, action: Action) {
  switch(action.type) {
    case 'commentOnComment':
      const { newState, commented } = state
        .after
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
