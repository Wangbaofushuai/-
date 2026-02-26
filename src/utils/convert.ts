export function convertWH6ToiFinD(wh6Code: string): string {
  if (!wh6Code) return '';

  let code = wh6Code;

  // 0. Handle Comments
  // WH6 uses {} for comments, iFinD uses // or /* */
  code = code.replace(/\{([^}]*)\}/g, (match, p1) => {
    if (p1.includes('\n')) {
      return `/*${p1}*/`;
    }
    return `//${p1}`;
  });

  // 1. Replace Functions
  code = code.replace(/\bHV\s*\(/gi, 'HHV(');
  code = code.replace(/\bLV\s*\(/gi, 'LLV(');
  code = code.replace(/\bIFELSE\s*\(/gi, 'IF(');
  code = code.replace(/\bISUP\b/gi, '(C>O)');
  code = code.replace(/\bISDOWN\b/gi, '(C<O)');
  code = code.replace(/\bISEQUAL\b/gi, '(C=O)');
  
  // CROSSUP and CROSSDOWN
  code = code.replace(/\bCROSSUP\s*\(/gi, 'CROSS(');
  code = code.replace(/\bCROSSDOWN\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'CROSS($2, $1)');

  // 2. Replace Operators
  code = code.replace(/&&/g, ' AND ');
  code = code.replace(/\|\|/g, ' OR ');
  code = code.replace(/!=/g, '<>');
  
  // Replace == with = but avoid :=
  // We can do this by looking for == specifically
  code = code.replace(/==/g, '=');

  // 3. Handle Colors (WH6 uses COLORRED, iFinD uses colorred)
  code = code.replace(/\bCOLOR([A-Z0-9]+)\b/g, (match, p1) => 'color' + p1.toLowerCase());

  // 4. Handle SOUND function
  // WH6: COND, SOUND('A');
  // iFinD often doesn't support PLAYSOUND as a standalone statement in this context (causes "missing ;" error).
  // We will comment it out to ensure compilation succeeds.
  code = code.replace(/([^,;\n]+)\s*,\s*SOUND\s*\(\s*([^)]+)\s*\)\s*;/gi, '// PLAYSOUND($1, $2); /* 同花顺可能不支持此声音函数，已自动注释 */');

  // 5. Handle AUTOFILTER (Not supported in iFinD, comment it out)
  code = code.replace(/\bAUTOFILTER\s*;/gi, '// AUTOFILTER;');

  // 6. Handle Drawing Functions (DRAWTEXT, DRAWICON)
  // In WH6, DRAWTEXT/DRAWICON might have 4 parameters: COND, PRICE, TEXT, OFFSET
  // In iFinD, they usually have 3 parameters: COND, PRICE, TEXT
  // We need to strip the 4th parameter (offset) if it exists.
  // Example: DRAWTEXT(CON1, 0.3, '低位金叉', 1) -> DRAWTEXT(CON1, 0.3, '低位金叉')
  code = code.replace(/\bDRAWTEXT\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*('[^']+')\s*,\s*[^)]+\s*\)/gi, 'DRAWTEXT($1, $2, $3)');
  
  // Same for DRAWICON
  // Example: DRAWICON(CON1, 0.5, 1, 1) -> DRAWICON(CON1, 0.5, 1)
  code = code.replace(/\bDRAWICON\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,)]+)\s*,\s*[^)]+\s*\)/gi, 'DRAWICON($1, $2, $3)');

  // 7. Handle STICKLINE
  // WH6: STICKLINE(COND, PRICE1, PRICE2, COLOR, EMPTY)
  // iFinD: STICKLINE(COND, PRICE1, PRICE2, WIDTH, EMPTY)
  // This is tricky because WH6 might put color directly in STICKLINE, while iFinD expects width.
  // Usually, we just let it pass, but if there's a specific WH6 pattern, we might need to adjust.
  // For now, let's just make sure the basic syntax is preserved.

  return code;
}
