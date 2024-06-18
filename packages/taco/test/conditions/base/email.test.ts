import { describe, expect, it } from 'vitest';

import {
  OwnsEmailCondition,
  OwnsEmailConditionProps,
  ownsEmailConditionSchema,
  OwnsEmailConditionType,
} from '../../../src/conditions/base/email';
import { USER_ACCESS_TOKEN_PARAM } from '../../../src/conditions/const';
import { testOwnsEmailConditionObj } from '../../test-utils';

// TODO should these vars go somewhere else?
const TEST_ACCESS_TOKEN =
  'access-token';

describe('validation', () => {
  it('accepts a valid schema', () => {
    const conditionObj: OwnsEmailConditionProps = {
      ...testOwnsEmailConditionObj,
      parameters: [USER_ACCESS_TOKEN_PARAM],
    };
    const result = OwnsEmailCondition.validate(
      ownsEmailConditionSchema,
      conditionObj,
    );

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual(conditionObj);
  });

  it('rejects an invalid schema', () => {
    const badObj = {
      conditionType: OwnsEmailConditionType,
      // leaving out other params
    } as unknown as OwnsEmailConditionProps;
    const result = OwnsEmailCondition.validate(
      ownsEmailConditionSchema,
      badObj,
    );

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it('infers condition type from constructor', () => {
    const condition = new OwnsEmailCondition({
      ...testOwnsEmailConditionObj,
      parameters: [USER_ACCESS_TOKEN_PARAM],
    });
    expect(condition.value.conditionType).toEqual(OwnsEmailConditionType);
  });

  it('rejects non-existing access token', () => {
    const badObj = {
      conditionType: OwnsEmailConditionType,
      testOwnsEmailConditionObj,
    } as unknown as OwnsEmailConditionProps;
    const result = OwnsEmailCondition.validate(
      ownsEmailConditionSchema,
      badObj,
    );

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });
});
