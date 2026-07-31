// Non-blocking warnings, kept separate from `validate.js` so the validation
// core stays free of any network dependency and can run offline unchanged.
//
// The URL-reachability check is the only warning, and it needs a transport.
// Rather than import one, take it by injection: the web SPA passes its
// `checkURLActive` from src/api/actions, the mobile app passes its own, and
// tests pass a stub.

/**
 * @param {object} deps
 * @param {(url: string) => Promise<{ data: unknown }>} deps.checkURLActive
 * @returns {{ warnings: object, validateFieldWarning: Function }}
 */
export function createWarnings({ checkURLActive }) {
  const warnings = {
    distribution: {
      tab: "resources",
      // Resolves to the NUMBER of unreachable resources, so a truthy result
      // means "there is a problem". Preserved from the original.
      validation: async (val) => {
        const processedVal = await Promise.all(
          val.map(async (dist) => {
            const res = await checkURLActive(dist.url);
            return { ...dist, status: res.data };
          }),
        );
        const filterVal = processedVal.filter((dist) => !dist.status);
        return filterVal.length;
      },
      error: {
        en: "Resource URL is not accessible. This could be because it has not been created yet or is otherwise unreachable",
        fr: "L'URL de la ressource n'est pas accessible. Cela peut être dû au fait qu'il n'a pas encore été créé ou qu'il est autrement inaccessible.",
      },
    },
  };

  const validateFieldWarning = async (record, fieldName) => {
    const valueToValidate = record[fieldName];
    // no warning validator for this field means there is nothing to warn about
    const validationFunction =
      (warnings[fieldName] && warnings[fieldName].validation) || (() => true);

    const res = await validationFunction(valueToValidate, record);
    return validationFunction && res;
  };

  return { warnings, validateFieldWarning };
}
