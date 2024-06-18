import { z } from 'zod';

import {
  CONTEXT_PARAM_PREFIX,
  CONTEXT_PARAM_REGEXP,
  ETH_ADDRESS_REGEXP,
  USER_ADDRESS_PARAM,
} from './const';

export const contextParamSchema = z.string().regex(CONTEXT_PARAM_REGEXP);
// We want to discriminate between ContextParams and plain strings
// If a string starts with `:`, it's a ContextParam
export const plainStringSchema = z.string().refine(
  (str) => {
    return !str.startsWith(CONTEXT_PARAM_PREFIX);
  },
  {
    message: 'String must not be a context parameter i.e. not start with ":"',
  },
);

const paramSchema = z.union([plainStringSchema, z.boolean(), z.number()]);

export const paramOrContextParamSchema: z.ZodSchema = z.union([
  paramSchema,
  contextParamSchema,
  z.lazy(() => z.array(paramOrContextParamSchema)),
]);

export const returnValueTestSchema = z.object({
  index: z.number().int().nonnegative().optional(),
  comparator: z.enum(['==', '>', '<', '>=', '<=', '!=']),
  value: paramOrContextParamSchema,
});

export type ReturnValueTestProps = z.infer<typeof returnValueTestSchema>;

/*
  // TODO is there any reason we'd need to test the email returned from the provider? 
export const emailParamSchema = z.string().email();
export const returnEmailValidationSchema = z.object({
  comparator: z.enum(['==', '!=']),
  email: emailParamSchema,
});

export type ReturnEmailValidationProps = z.infer<
  typeof returnEmailValidationSchema
>;
*/

const EthAddressSchema = z.string().regex(ETH_ADDRESS_REGEXP);
const UserAddressSchema = z.literal(USER_ADDRESS_PARAM);
export const EthAddressOrUserAddressSchema = z.union([
  EthAddressSchema,
  UserAddressSchema,
]);

export type OmitConditionType<T> = Omit<T, 'conditionType'>;
