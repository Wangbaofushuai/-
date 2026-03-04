export function convertWH6ToiFinD(wh6Code: string): string {
  if (!wh6Code) return '';

  let code = wh6Code;

  // 0. Handle Comments
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
  
  // VALUEWHEN replacements (WH6 uses VALUEWHEN, iFinD uses BARSLAST + REF or sometimes VALUEWHEN is supported but often it's not standard)
  // Actually, iFinD DOES NOT support VALUEWHEN natively in all contexts. The equivalent is REF(X, BARSLAST(COND))
  // Example: VALUEWHEN(X0>0, X0) -> REF(X0, BARSLAST(X0>0))
  // We can use the robust parser for this.
  
  // GETPRICE replacements
  code = code.replace(/\bGETPRICE\s*\(\s*'YCLOSE'\s*\)/gi, 'DYNAINFO(3)');
  code = code.replace(/\bGETPRICE\s*\(\s*'OPEN'\s*\)/gi, 'DYNAINFO(4)');
  code = code.replace(/\bGETPRICE\s*\(\s*'HIGH'\s*\)/gi, 'DYNAINFO(5)');
  code = code.replace(/\bGETPRICE\s*\(\s*'LOW'\s*\)/gi, 'DYNAINFO(6)');
  code = code.replace(/\bGETPRICE\s*\(\s*'NEW'\s*\)/gi, 'DYNAINFO(7)');
  
  // CROSSUP and CROSSDOWN
  code = code.replace(/\bCROSSUP\s*\(/gi, 'CROSS(');
  // CROSSDOWN(A, B) -> CROSS(B, A)
  // Use a robust parser for CROSSDOWN to handle nested parentheses correctly
  code = replaceFunction(code, 'CROSSDOWN', (args, suffix) => {
      if (args.length >= 2) {
          return `CROSS(${args[1]}, ${args[0]})${suffix}`;
      }
      return null;
  });

  // 2. Replace Operators and Constants
  code = code.replace(/&&/g, ' AND ');
  code = code.replace(/\|\|/g, ' OR ');
  code = code.replace(/!=/g, '<>');
  code = code.replace(/\bNULL\b/gi, 'DRAWNULL');
  code = code.replace(/\bPRICEPRECISION\b/gi, '2');
  
  code = code.replace(/==/g, '=');

  // 3. Handle Colors
  code = code.replace(/\bCOLOR([A-Z0-9]+)\b/g, (match, p1) => 'color' + p1.toLowerCase());

  // Remove WH6 specific styling suffixes
  code = code.replace(/,\s*(FONTSIZE|ALIGN|VALIGN)\d+/gi, '');

  // 4. Handle SOUND function
  code = code.replace(/([^,;\n]+)\s*,\s*SOUND\s*\(\s*([^)]+)\s*\)\s*;/gi, '// PLAYSOUND($1, $2); /* 同花顺可能不支持此声音函数，已自动注释 */');

  // 5. Handle AUTOFILTER
  code = code.replace(/\bAUTOFILTER\s*;/gi, '// AUTOFILTER;');

  // Robust function parser helper
  function replaceFunction(source: string, funcName: string, callback: (args: string[], suffix: string, hasSemi: boolean) => string | null): string {
    let result = source;
    let startIndex = 0;
    while ((startIndex = result.toUpperCase().indexOf(funcName.toUpperCase(), startIndex)) !== -1) {
      // Ensure we don't match partial words (e.g., matching "DRAWTEXT" inside "MYDRAWTEXT")
      if (startIndex > 0 && /[a-zA-Z0-9_]/.test(result[startIndex - 1])) {
        startIndex += funcName.length;
        continue;
      }
      
      let openParenIndex = result.indexOf('(', startIndex);
      let between = result.substring(startIndex + funcName.length, openParenIndex);
      if (between.trim() !== '') {
          startIndex += funcName.length;
          continue;
      }

      if (openParenIndex === -1) {
          startIndex += funcName.length;
          continue;
      }
      
      let parenCount = 1;
      let closeParenIndex = -1;
      for (let i = openParenIndex + 1; i < result.length; i++) {
        if (result[i] === '(') parenCount++;
        else if (result[i] === ')') parenCount--;
        
        if (parenCount === 0) {
          closeParenIndex = i;
          break;
        }
      }
      
      if (closeParenIndex !== -1) {
        let inner = result.substring(openParenIndex + 1, closeParenIndex);
        let args = [];
        let currentArg = '';
        let pCount = 0;
        let inString = false;
        for (let i = 0; i < inner.length; i++) {
          if (inner[i] === "'") inString = !inString;
          
          if (!inString) {
              if (inner[i] === '(') pCount++;
              else if (inner[i] === ')') pCount--;
          }
          
          if (inner[i] === ',' && pCount === 0 && !inString) {
            args.push(currentArg.trim());
            currentArg = '';
          } else {
            currentArg += inner[i];
          }
        }
        args.push(currentArg.trim());
        
        let isStandaloneStatement = false;
        let semiIndex = -1;
        let suffix = '';
        
        let lookAheadIndex = closeParenIndex + 1;
        let lookAheadInString = false;
        while (lookAheadIndex < result.length) {
            let char = result[lookAheadIndex];
            if (char === "'") {
                lookAheadInString = !lookAheadInString;
            }
            if (!lookAheadInString) {
                if (char === ';') {
                    semiIndex = lookAheadIndex;
                    isStandaloneStatement = true;
                    break;
                } else if (char === ')' || char === '\n' || char === '+' || char === '-' || char === '*' || char === '/' || char === '=' || char === '<' || char === '>' || char === '&' || char === '|') {
                    // If we hit a closing parenthesis, newline, or operator before a semicolon, it's nested or part of an expression
                    break;
                }
            }
            lookAheadIndex++;
        }

        if (isStandaloneStatement && semiIndex !== -1) {
            suffix = result.substring(closeParenIndex + 1, semiIndex);
        }
        
        let replacement = callback(args, suffix, isStandaloneStatement);
        if (replacement !== null) {
            let endReplaceIndex = isStandaloneStatement ? semiIndex : closeParenIndex;
            result = result.substring(0, startIndex) + replacement + result.substring(endReplaceIndex + 1);
            // Advance startIndex by the length of the replacement to avoid infinite loops
            startIndex += replacement.length;
            continue; 
        }
      }
      // If no replacement was made, advance past the function name to avoid infinite loop
      startIndex += funcName.length;
    }
    return result;
  }

  // 6. Handle Drawing Functions with robust parser
  code = replaceFunction(code, 'VALUEWHEN', (args, suffix, hasSemi) => {
      // VALUEWHEN(COND, DATA) -> REF(DATA, BARSLAST(COND))
      if (args.length >= 2) {
          return `REF(${args[1]}, BARSLAST(${args[0]}))${suffix}${hasSemi ? ';' : ''}`;
      }
      return null;
  });

  code = replaceFunction(code, 'CROSSDOWN', (args, suffix, hasSemi) => {
      if (args.length >= 2) {
          // CROSSDOWN is almost always used as part of an expression (e.g., SC:=CROSSDOWN(...) or BARSLAST(CROSSDOWN(...)))
          // The robust parser might incorrectly identify the semicolon at the end of the line as belonging to CROSSDOWN
          // if it's the last function call on the line.
          // To be safe, we just return the replacement and let the parser append the suffix and semicolon.
          return `CROSS(${args[1]}, ${args[0]})${suffix}${hasSemi ? ';' : ''}`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWTEXT', (args, suffix, hasSemi) => {
      if (args.length >= 3) {
          let comment = args.length > 3 ? ' // [位置提示] 原偏移量已去除，若文字重叠请微调价格参数(如 *1.01)' : '';
          return `DRAWTEXT(${args[0]}, ${args[1]}, ${args[2]})${suffix}${hasSemi ? ';' : ''}${comment}`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWICON', (args, suffix, hasSemi) => {
      if (args.length >= 3) {
          let icon = args[2];
          let newIcon = icon;
          if (icon === '1') newIcon = '7';
          else if (icon === '2') newIcon = '8';
          else if (icon === '4') newIcon = '1';
          else if (icon === '5') newIcon = '2';
          
          let comment = icon !== newIcon ? ` // [图标提示] 原${icon}号已转为${newIcon}号(7笑脸/8哭脸/1红箭/2绿箭)` : '';
          return `DRAWICON(${args[0]}, ${args[1]}, ${newIcon})${suffix}${hasSemi ? ';' : ''}${comment}`;
      }
      return null;
  });

  code = replaceFunction(code, 'KTEXT', (args, suffix, hasSemi) => {
      // KTEXT(COND, OFFSET, PRICE, ALIGN, COLOR, TEXT) -> DRAWTEXT(COND, PRICE, TEXT), COLOR;
      if (args.length >= 6) {
          return `DRAWTEXT(${args[0]}, ${args[2]}, ${args[5]}), ${args[4]}${suffix}${hasSemi ? ';' : ''} // [位置提示] KTEXT偏移量已去除`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWNUMBER', (args, suffix, hasSemi) => {
      // DRAWNUMBER(COND, PRICE, NUMBER, PRECISION, COLOR)
      if (args.length >= 3) {
          let colorSuffix = args.length >= 5 ? `, ${args[4]}` : '';
          return `DRAWNUMBER(${args[0]}, ${args[1]}, ${args[2]})${colorSuffix}${suffix}${hasSemi ? ';' : ''}`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWCOLORLINE', (args, suffix, hasSemi) => {
      // DRAWCOLORLINE(COND, PRICE, COLOR1, COLOR2)
      if (args.length >= 4) {
          return `IF(${args[0]}, ${args[1]}, DRAWNULL), ${args[2]}${suffix};\nIF(NOT(${args[0]}), ${args[1]}, DRAWNULL), ${args[3]}${suffix}${hasSemi ? ';' : ''}`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWCOLORKLINE', (args, suffix, hasSemi) => {
      // DRAWCOLORKLINE(COND, COLOR, EMPTY)
      if (args.length >= 3) {
          return `STICKLINE(${args[0]}, O, C, 8, ${args[2]}), ${args[1]}${suffix};\nSTICKLINE(${args[0]}, H, L, 0, 0), ${args[1]}${suffix}${hasSemi ? ';' : ''}`;
      }
      return null;
  });

  code = replaceFunction(code, 'STICKLINE', (args, suffix, hasSemi) => {
      // STICKLINE(COND, PRICE1, PRICE2, WIDTH, EMPTY)
      if (args.length >= 5) {
          let width = args[3];
          let newWidth = width;
          let wNum = parseFloat(width);
          let comment = '';
          if (!isNaN(wNum)) {
              if (wNum > 0 && wNum <= 3) newWidth = String(wNum * 2);
              else if (wNum > 3 && wNum <= 5) newWidth = '8';
              else if (wNum > 5 && wNum < 10) newWidth = '10';
              
              if (newWidth !== width) {
                  comment = ` // [线宽提示] 原宽度${width}已放大为${newWidth}以适配同花顺`;
              }
          }
          return `STICKLINE(${args[0]}, ${args[1]}, ${args[2]}, ${newWidth}, ${args[4]})${suffix}${hasSemi ? ';' : ''}${comment}`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWSL', (args, suffix, hasSemi) => {
      // DRAWSL is not supported in iFinD. Comment it out safely without affecting other statements on the same line.
      return `/* 同花顺不支持 DRAWSL 画斜线: DRAWSL(${args.join(', ')})${suffix}${hasSemi ? ';' : ''} */`;
  });

  // 9. Auto-fix missing semicolons
  // Sometimes users miss semicolons, or paste partially converted code.
  // In iFinD, every statement must end with a semicolon.
  let lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
      
      let codePart = line;
      let commentPart = '';
      let commentIdx = line.indexOf('//');
      if (commentIdx !== -1) {
          codePart = line.substring(0, commentIdx);
          commentPart = line.substring(commentIdx);
      }
      
      let trimmedCode = codePart.trim();
      if (trimmedCode.length > 0 && !trimmedCode.endsWith(';')) {
          let isAssignment = trimmedCode.includes(':=') || trimmedCode.includes(':');
          let isDrawing = /^(DRAW|STICKLINE|IF|KTEXT)/.test(trimmedCode);
          
          if (isAssignment || isDrawing) {
              // Check if it looks like a complete statement (ends with closing paren, number, or letter)
              // and doesn't end with an operator like AND, OR
              if (/[a-zA-Z0-9_)]$/.test(trimmedCode) && !/\b(AND|OR)$/i.test(trimmedCode)) {
                  let rightTrimmedCode = codePart.replace(/\s+$/, '');
                  lines[i] = rightTrimmedCode + ';' + (commentPart ? ' ' + commentPart : '');
              }
          }
      }
  }
  code = lines.join('\n');

  return code;
}
