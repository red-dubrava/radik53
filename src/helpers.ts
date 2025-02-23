export const validateConfig = <TVarName extends string>(
  config: Record<PropertyKey, unknown>,
  vars: TVarName[],
): Record<NoInfer<TVarName>, string> => {
  const errors = new Array<string>();

  for (const variableName of vars) {
    if (!(variableName in config)) {
      errors.push(`variable ${variableName} is required`);
      continue;
    }
    if (typeof config[variableName] !== 'string') {
      errors.push(`variable ${variableName} (${String(config[variableName])}) must be a string`);
    }
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  return config as Record<TVarName, string>;
};
