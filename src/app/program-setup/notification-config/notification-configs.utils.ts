export const  lookups =(object, key) =>{
    for (var k in object) {
      var value = object[k];
  
      if (k == key) {
        return [key, value];
      }
  
      if (typeof(value) === "object" && !Array.isArray(value)) {
        var y = lookup(value, key);
        if (y && y[0] == key) return y;
      }
      if (Array.isArray(value)) {
        // for..in doesn't work the way you want on arrays in some browsers
        //
        for (var i = 0; i < value.length; ++i) {
          var x = lookup(value[i], key);
          if (x && x[0] == key) return x;
        }
      }
    }
  
    return null;
}

export const  lookup = (object, key) =>{
  if(typeof(object) != 'object') {
    return null;
  }
  var result = null;
  if(object.hasOwnProperty(key)) {
    return object[key];
  } else {
    for(var o in object) {
      result = lookup(object[o], key);
      if(result == null) continue;
      else break;
    }
  }
  return result;
}