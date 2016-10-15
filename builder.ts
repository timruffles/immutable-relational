import { 
  Schema,
  SchemaOptions,
  ClassOf,
  Collection
} from "./Schema";

export function schema(opts: SchemaOptions): Schema {
  return new Schema(opts);
}


export function collection<A>(a: ClassOf<A>): Collection<A> {
  return new Collection(a);
}
