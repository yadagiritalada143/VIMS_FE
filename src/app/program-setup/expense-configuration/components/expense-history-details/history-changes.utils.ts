function isObject(val) {
  return typeof val === 'object' && val; // required for "null" comparison
}

export function compare(obj1 = {}, obj2 = {}) {
  const output = {}, merged = { ...obj1, ...obj2 }; // has properties of both
  if(!obj1 || !obj2) return ;
  for (const key in merged) {

    const value1 = obj1[key],
      value2 = obj2[key];

    if (isObject(value1) || isObject(value2))
      output[key] = compare(value1, value2);
    // recursively call
    else output[key] = value1 === value2;
  }

  return output;
}

export function checkNoChanges(object) {
  return Object.values(object).every((v) => v && typeof v === 'object' ? checkNoChanges(v) : v === true
  );
}

