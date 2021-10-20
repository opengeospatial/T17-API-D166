class StringUtils{
  static equalIgnoreCase(a, b){
      return typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
          : a === b;
  }
}
module.exports=StringUtils;
