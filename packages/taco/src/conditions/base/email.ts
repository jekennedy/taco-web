import { z } from 'zod';

import { Condition } from '../condition';
import { USER_ACCESS_TOKEN_PARAM } from '../const';
import { OmitConditionType } from '../shared';

export const OwnsEmailConditionType = 'email';

export const ownsEmailConditionSchema = z.object({
  conditionType: z
    .literal(OwnsEmailConditionType)
    .default(OwnsEmailConditionType),
  issuer: z.string(),
  parameters: z.array(z.literal(USER_ACCESS_TOKEN_PARAM)),
});

export type OwnsEmailConditionProps = z.infer<typeof ownsEmailConditionSchema>;

export class OwnsEmailCondition extends Condition {
  constructor(props: OmitConditionType<OwnsEmailConditionProps>) {
    super(ownsEmailConditionSchema, {
      conditionType: OwnsEmailConditionType,
      ...props,
    });
  }
}
