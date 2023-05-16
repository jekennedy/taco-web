import Joi from 'joi';

import { Condition } from './condition';
import { makeReturnValueTest } from './schema';

export class TimelockCondition extends Condition {
  // TODO: This is the only condition that uses defaults, and also the only condition that uses `method` in order
  //   to determine the schema. I.e. the only method that used `METHOD = 'timelock'` in `nucypher/nucypher`.
  // TODO: Consider introducing a different field for this, e.g. `conditionType` or `type`. Use this field in a
  //  condition factory.
  defaults = {
    method: 'timelock',
  };

  public readonly schema = Joi.object({
    method: Joi.string().valid(this.defaults.method).required(),
    returnValueTest: makeReturnValueTest(),
  });
}
