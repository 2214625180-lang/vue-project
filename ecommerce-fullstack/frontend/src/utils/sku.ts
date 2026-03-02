export interface SpecItem {
  name: string;
  values: string[];
}

/**
 * Generates the Cartesian product of the given specifications.
 * 
 * @param specs Array of SpecItems (e.g., [{ name: 'Color', values: ['Red', 'Blue'] }])
 * @returns Array of objects representing all combinations (e.g., [{ Color: 'Red' }, { Color: 'Blue' }])
 */
export function generateCartesianProduct(specs: SpecItem[]): Record<string, string>[] {
  if (!specs || specs.length === 0) {
    return [];
  }

  // Filter out specs with empty values to avoid generating empty combinations if not intended,
  // or handle as per requirement. Here we assume only specs with values contribute.
  const activeSpecs = specs.filter(spec => spec.values && spec.values.length > 0);

  if (activeSpecs.length === 0) {
    return [];
  }

  return activeSpecs.reduce<Record<string, string>[]>((acc, spec) => {
    const newCombinations: Record<string, string>[] = [];
    
    // If it's the first iteration (acc is empty but initial value is handled differently in reduce),
    // we need to handle the base case.
    // However, reduce with initial value [] works best if we seed it.
    // But we can't seed with [{}] because we need to mix in the first spec.
    
    if (acc.length === 0) {
      return spec.values.map(value => ({ [spec.name]: value }));
    }

    acc.forEach(existingCombination => {
      spec.values.forEach(value => {
        newCombinations.push({
          ...existingCombination,
          [spec.name]: value
        });
      });
    });

    return newCombinations;
  }, []); // Initial value is empty array, but logic inside handles the first spec separately or we can seed.
  // Actually, standard reduce for cartesian product:
  // [['Red', 'Blue'], ['S', 'M']] -> ...
}

/**
 * Alternative implementation for clarity and correctness with strict types
 */
export function generateSkuCartesian(specs: SpecItem[]): Record<string, string>[] {
  const activeSpecs = specs.filter(s => s.name && s.values.length > 0);
  
  if (activeSpecs.length === 0) return [];

  const [first, ...rest] = activeSpecs;
  
  let combinations: Record<string, string>[] = first.values.map(v => ({ [first.name]: v }));

  rest.forEach(spec => {
    const temp: Record<string, string>[] = [];
    combinations.forEach(comb => {
      spec.values.forEach(val => {
        temp.push({ ...comb, [spec.name]: val });
      });
    });
    combinations = temp;
  });

  return combinations;
}
