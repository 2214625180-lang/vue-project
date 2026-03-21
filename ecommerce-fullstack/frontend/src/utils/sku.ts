export interface SpecItem {
  name: string;
  values: string[];
}
export function generateCartesianProduct(specs: SpecItem[]): Record<string, string>[] {
  if (!specs || specs.length === 0) {
    return [];
  }

  const activeSpecs = specs.filter(spec => spec.values && spec.values.length > 0);

  if (activeSpecs.length === 0) {
    return [];
  }

  return activeSpecs.reduce<Record<string, string>[]>((acc, spec) => {
    const newCombinations: Record<string, string>[] = [];
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
  }, []); 
}
export function generateSkuCartesian(specs: SpecItem[]): Record<string, string>[] {
  const activeSpecs = specs.filter(s => s.name && s.values.length > 0);
  
  if (activeSpecs.length === 0) return [];

  const [first, ...rest] = activeSpecs;
  
  let combinations: Record<string, string>[] = first ? first.values.map(v => ({ [first.name]: v })) : [];

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
