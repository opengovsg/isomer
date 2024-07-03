import type { SelectExpression, Selection, Simplify } from "kysely";

import type { DB } from "./generatedTypes";

export type SelectFromExpr<TB extends keyof DB> = SelectExpression<DB, TB>;

export type Selected<
  TB extends keyof DB,
  SE extends SelectFromExpr<TB> | SelectFromExpr<TB>[],
> =
  SE extends ArrayLike<unknown>
    ? Simplify<Selection<DB, TB, SE[number]>>
    : Simplify<Selection<DB, TB, SE>>;
