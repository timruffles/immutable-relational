## Immutable DB

It's a pain to update immutable data! This library makes it much easier:

```javascript

const schema = schema(
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
);

schema.insert([])

schema.get(User, 1);
schema.update(User, 1, {});

schema.remove(User, 1);

schema.getAll(User);
schema.for(User, 2).get(Profile);
schema.for(User, 2).getAll(Message);

schema.relate(aUser).to(someProfile)

```

LIB only throws errors on logical issues: e.g you relate a record to a table that it has no relation defined for. It returns an `Either` for any operations that might be expected to 'fail' - like relating to a record that no-longer exists.
