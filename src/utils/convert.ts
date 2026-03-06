export function convertWH6ToiFinD(wh6Code: string): string {
  if (!wh6Code) return '';

  let code = wh6Code;

  // 0. Pre-processing
  // Replace full-width quotes with half-width quotes
  code = code.replace(/‘/g, "'").replace(/’/g, "'").replace(/“/g, '"').replace(/”/g, '"');

  // 0.1 Handle Comments
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
  
  // Replace OPI with OPENVOL (持仓量 in TonghuaShun)
  code = code.replace(/\bOPI\b/gi, 'OPENVOL');
  
  // Replace AVPRICE with SETTLE
  code = code.replace(/\bAVPRICE\b/gi, 'SETTLE');
  
  // Replace UNIT with 1 (TonghuaShun lacks a universal contract multiplier variable in this context, using 1 preserves the trend/shape)
  code = code.replace(/\bUNIT\b/gi, '1');
  
  // Fix invalid variable names containing % (e.g., 比%, 资金1%)
  // Ensures it matches variables but not literal numbers like 100%
  code = code.replace(/([a-zA-Z0-9_]*[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5_]*)%/g, '$1率');
  
  // Replace IFF with IF
  code = code.replace(/\bIFF\s*\(/gi, 'IF(');
  
  // Replace MINPRICE with MINDIFF
  code = code.replace(/\bMINPRICE\b/gi, 'MINDIFF');
  
  // Replace DATATYPE with PERIOD
  code = code.replace(/\bDATATYPE\b/gi, 'PERIOD');
  
  // Replace DAYBARPOS
  code = code.replace(/\bDAYBARPOS\b/gi, '(BARSLAST(DATE<>REF(DATE,1))+1)');
  
  // Replace BARPOS
  code = code.replace(/\bBARPOS\b/gi, 'BARSCOUNT(C)');
  
  // CROSSDOWN and CROSSUP
  code = code.replace(/\bCROSSUP\s*\(/gi, 'CROSS(');
  
  // Replace STICKLINE1 with STICKLINE
  code = code.replace(/\bSTICKLINE1\s*\(/gi, 'STICKLINE(');

  // 2. Replace Operators and Constants
  code = code.replace(/&&/g, ' AND ');
  code = code.replace(/\|\|/g, ' OR ');
  code = code.replace(/!=/g, '<>');
  code = code.replace(/\bNULL\b/gi, 'DRAWNULL');
  code = code.replace(/\bPRICEPRECISION\b/gi, '2');
  
  // Replace GETPRICE1
  code = code.replace(/GETPRICE1\s*\(\s*['"]流通股本['"]\s*\)/gi, 'CAPITAL');
  code = code.replace(/GETPRICE1\s*\(\s*['"]总股本['"]\s*\)/gi, 'TOTALCAPITAL');
  
  code = code.replace(/==/g, '=');

  // 3. Handle Colors and Line Styles
  
  // Convert top-level RGB(...) and COLORRGB(...) to COLOR+Hex
  // In TonghuaShun, RGB(R,G,B) returns a number. If used as a line modifier at the top level, 
  // it compresses the Y-axis. TonghuaShun doesn't support COLORRGB(R,G,B) either.
  // It needs to be converted to a hex color like COLOR3D3D3D.
  let linesForColor = code.split('\n');
  for (let i = 0; i < linesForColor.length; i++) {
      let line = linesForColor[i];
      // Only process if it's not inside a function like DRAWGBK
      if ((line.toUpperCase().includes('RGB(') || line.toUpperCase().includes('COLORRGB(')) && !line.toUpperCase().includes('DRAWGBK(')) {
          line = line.replace(/(?:COLOR)?RGB\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi, (match, r, g, b) => {
              const hexR = parseInt(r).toString(16).padStart(2, '0').toUpperCase();
              const hexG = parseInt(g).toString(16).padStart(2, '0').toUpperCase();
              const hexB = parseInt(b).toString(16).padStart(2, '0').toUpperCase();
              return `COLOR${hexB}${hexG}${hexR}`; // TonghuaShun uses BGR format for hex colors
          });
          linesForColor[i] = line;
      }
  }
  code = linesForColor.join('\n');

  // Convert COLORXXX to colorxxx, but keep hex colors (e.g., COLOR3D3D3D) uppercase
  code = code.replace(/\bCOLOR([A-Z0-9]+)\b/gi, (match, p1) => {
      if (/^[0-9A-F]{6}$/i.test(p1)) {
          return 'COLOR' + p1.toUpperCase();
      }
      return 'color' + p1.toLowerCase();
  });

  // Replace line styles
  code = code.replace(/,\s*DOT\b/gi, ', DOTLINE');

  // Remove WH6 specific styling suffixes but leave a warning for alignment
  code = code.replace(/,\s*(FONTSIZE|ALIGN|VALIGN|PRECIS)(\d+)/gi, (match, p1, p2) => {
      let attr = p1.toUpperCase();
      if (attr === 'VALIGN' || attr === 'ALIGN') {
          return ` /* [对齐失效] 同花顺不支持${attr}，若文字重叠请手动加减本行的价格参数(如 +10) */`;
      }
      return '';
  });

  // 4. Handle SOUND function
  code = code.replace(/([^,;\n]+)\s*,\s*SOUND\s*\(\s*([^)]+)\s*\)\s*;/gi, '// PLAYSOUND($1, $2); /* 同花顺可能不支持此声音函数，已自动注释 */');

  // 5. Handle AUTOFILTER
  code = code.replace(/\bAUTOFILTER\s*;/gi, '// AUTOFILTER;');

  // Robust function parser helper
  function replaceFunction(source: string, funcName: string, callback: (args: string[], suffix: string, hasSemi: boolean) => string | null): string {
    let result = source;
    let startIndex = 0;
    while ((startIndex = result.toUpperCase().indexOf(funcName.toUpperCase(), startIndex)) !== -1) {
      // Ensure we don't match partial words (e.g., matching "DRAWTEXT" inside "MYDRAWTEXT" or "我的DRAWTEXT")
      if (startIndex > 0 && /[a-zA-Z0-9_\u4e00-\u9fa5]/.test(result[startIndex - 1])) {
        startIndex += funcName.length;
        continue;
      }

      // Ensure we are not inside a string literal or a comment
      let inSingle = false;
      let inDouble = false;
      let inLineComment = false;
      let inBlockComment = false;
      for (let i = 0; i < startIndex; i++) {
          if (inLineComment) {
              if (result[i] === '\n') inLineComment = false;
          } else if (inBlockComment) {
              if (result[i] === '*' && result[i+1] === '/') {
                  inBlockComment = false;
                  i++;
              }
          } else if (inSingle) {
              if (result[i] === "'") inSingle = false;
          } else if (inDouble) {
              if (result[i] === '"') inDouble = false;
          } else {
              if (result[i] === '/' && result[i+1] === '/') {
                  inLineComment = true;
                  i++;
              } else if (result[i] === '/' && result[i+1] === '*') {
                  inBlockComment = true;
                  i++;
              } else if (result[i] === "'") {
                  inSingle = true;
              } else if (result[i] === '"') {
                  inDouble = true;
              }
          }
      }
      if (inSingle || inDouble || inLineComment || inBlockComment) {
          startIndex += funcName.length;
          continue;
      }
      
      let openParenIndex = result.indexOf('(', startIndex);
      if (openParenIndex === -1) {
          startIndex += funcName.length;
          continue;
      }
      
      let between = result.substring(startIndex + funcName.length, openParenIndex);
      if (between.trim() !== '') {
          startIndex += funcName.length;
          continue;
      }
      
      let parenCount = 1;
      let closeParenIndex = -1;
      let inSingleQuoteForParen = false;
      let inDoubleQuoteForParen = false;
      let inBlockCommentForParen = false;
      let inLineCommentForParen = false;
      for (let i = openParenIndex + 1; i < result.length; i++) {
        if (inBlockCommentForParen) {
            if (result[i] === '*' && result[i+1] === '/') {
                inBlockCommentForParen = false;
                i++;
            }
            continue;
        }
        if (inLineCommentForParen) {
            if (result[i] === '\n') {
                inLineCommentForParen = false;
            }
            continue;
        }
        
        if (result[i] === "'" && !inDoubleQuoteForParen) inSingleQuoteForParen = !inSingleQuoteForParen;
        if (result[i] === '"' && !inSingleQuoteForParen) inDoubleQuoteForParen = !inDoubleQuoteForParen;
        let inString = inSingleQuoteForParen || inDoubleQuoteForParen;
        
        if (!inString) {
            if (result[i] === '/' && result[i+1] === '*') {
                inBlockCommentForParen = true;
                i++;
                continue;
            }
            if (result[i] === '/' && result[i+1] === '/') {
                inLineCommentForParen = true;
                i++;
                continue;
            }
            if (result[i] === '(') parenCount++;
            else if (result[i] === ')') parenCount--;
        }
        
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
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inBlockCommentArg = false;
        let inLineCommentArg = false;
        for (let i = 0; i < inner.length; i++) {
          if (inBlockCommentArg) {
              if (inner[i] === '*' && inner[i+1] === '/') {
                  inBlockCommentArg = false;
                  currentArg += '*/';
                  i++;
              } else {
                  currentArg += inner[i];
              }
              continue;
          }
          if (inLineCommentArg) {
              if (inner[i] === '\n') {
                  inLineCommentArg = false;
              }
              currentArg += inner[i];
              continue;
          }
          
          if (inner[i] === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
          if (inner[i] === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
          let inString = inSingleQuote || inDoubleQuote;
          
          if (!inString) {
              if (inner[i] === '/' && inner[i+1] === '*') {
                  inBlockCommentArg = true;
                  currentArg += '/*';
                  i++;
                  continue;
              }
              if (inner[i] === '/' && inner[i+1] === '/') {
                  inLineCommentArg = true;
                  currentArg += '//';
                  i++;
                  continue;
              }
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
        let hasSemi = false;
        let semiIndex = -1;
        let suffix = '';
        
        let lookAheadIndex = closeParenIndex + 1;
        let lookAheadInSingle = false;
        let lookAheadInDouble = false;
        let lookAheadInBlockComment = false;
        let lookAheadInLineComment = false;
        let lookAheadParenCount = 0;
        let hitOperator = false;
        
        while (lookAheadIndex < result.length) {
            let char = result[lookAheadIndex];
            
            if (lookAheadInBlockComment) {
                if (char === '*' && result[lookAheadIndex+1] === '/') {
                    lookAheadInBlockComment = false;
                    lookAheadIndex++;
                }
                lookAheadIndex++;
                continue;
            }
            if (lookAheadInLineComment) {
                if (char === '\n') {
                    lookAheadInLineComment = false;
                } else {
                    lookAheadIndex++;
                    continue;
                }
            }
            
            if (char === "'" && !lookAheadInDouble) lookAheadInSingle = !lookAheadInSingle;
            if (char === '"' && !lookAheadInSingle) lookAheadInDouble = !lookAheadInDouble;
            let lookAheadInString = lookAheadInSingle || lookAheadInDouble;
            
            if (!lookAheadInString) {
                if (char === '/' && result[lookAheadIndex+1] === '*') {
                    lookAheadInBlockComment = true;
                    lookAheadIndex++;
                    lookAheadIndex++;
                    continue;
                }
                if (char === '/' && result[lookAheadIndex+1] === '/') {
                    lookAheadInLineComment = true;
                    lookAheadIndex++;
                    lookAheadIndex++;
                    continue;
                }
                
                if (char === '(') {
                    lookAheadParenCount++;
                } else if (char === ')') {
                    lookAheadParenCount--;
                    if (lookAheadParenCount < 0) {
                        break; // Nested inside another function call
                    }
                } else if (lookAheadParenCount === 0) {
                    if (char === ';') {
                        semiIndex = lookAheadIndex;
                        isStandaloneStatement = true;
                        hasSemi = true;
                        break;
                    } else if (char === '\n') {
                        semiIndex = lookAheadIndex;
                        isStandaloneStatement = true;
                        hasSemi = false;
                        break;
                    } else if (char === '+' || char === '-' || char === '*' || char === '/' || char === '=' || char === '<' || char === '>' || char === '&' || char === '|') {
                        // If we hit an operator before a semicolon, it's nested or part of an expression
                        hitOperator = true;
                        break;
                    }
                }
            }
            lookAheadIndex++;
        }

        if (lookAheadIndex === result.length && !hitOperator && lookAheadParenCount === 0) {
            semiIndex = result.length;
            isStandaloneStatement = true;
            hasSemi = false;
        }

        if (isStandaloneStatement && semiIndex !== -1) {
            suffix = result.substring(closeParenIndex + 1, semiIndex);
        }
        
        let replacement = callback(args, suffix, hasSemi);
        if (replacement !== null) {
            let endReplaceIndex = closeParenIndex;
            if (isStandaloneStatement) {
                if (hasSemi) {
                    endReplaceIndex = semiIndex;
                } else {
                    endReplaceIndex = semiIndex - 1;
                }
            }
            result = result.substring(0, startIndex) + replacement + result.substring(endReplaceIndex + 1);
            // If the function name is preserved at the start of the replacement, advance past it to avoid infinite loops.
            // Otherwise, do not advance, allowing the parser to catch nested functions (e.g., VALUEWHEN inside VALUEWHEN).
            if (replacement.toUpperCase().startsWith(funcName.toUpperCase())) {
                startIndex += funcName.length;
            }
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
          let comment = args.length > 3 ? ' /* [位置提示] 原偏移量已去除，若文字重叠请微调价格参数(如 *1.01) */' : '';
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
          
          let comment = icon !== newIcon ? ` /* [图标提示] 原${icon}号已转为${newIcon}号(7笑脸/8哭脸/1红箭/2绿箭) */` : '';
          return `DRAWICON(${args[0]}, ${args[1]}, ${newIcon})${suffix}${hasSemi ? ';' : ''}${comment}`;
      }
      return null;
  });

  code = replaceFunction(code, 'KTEXT', (args, suffix, hasSemi) => {
      // KTEXT(COND, OFFSET, PRICE, ALIGN, COLOR, TEXT) -> DRAWTEXT(COND, PRICE, TEXT), COLOR;
      if (args.length >= 6) {
          return `DRAWTEXT(${args[0]}, ${args[2]}, ${args[5]}), ${args[4]}${suffix}${hasSemi ? ';' : ''} /* [位置提示] KTEXT偏移量已去除 */`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWLASTBARTEXT', (args, suffix, hasSemi) => {
      // DRAWLASTBARTEXT(COND, PRICE, TEXT) or DRAWLASTBARTEXT(PRICE, TEXT)
      if (args.length === 2) {
          return `DRAWTEXT(ISLASTBAR, ${args[0]}, ${args[1]})${suffix}${hasSemi ? ';' : ''}`;
      } else if (args.length >= 3) {
          return `DRAWTEXT(ISLASTBAR AND ${args[0]}, ${args[1]}, ${args[2]})${suffix}${hasSemi ? ';' : ''}`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWLASTBARNUMBER', (args, suffix, hasSemi) => {
      // DRAWLASTBARNUMBER(COND, PRICE, NUMBER, PRECISION, COLOR) or DRAWLASTBARNUMBER(PRICE, NUMBER, PRECISION, COLOR)
      if (args.length >= 5) {
          // If 5 args, it's COND, PRICE, NUMBER, PRECISION, COLOR
          return `DRAWNUMBER(ISLASTBAR AND ${args[0]}, ${args[1]}, ${args[2]}), ${args[4]}${suffix}${hasSemi ? ';' : ''}`;
      } else if (args.length === 4) {
          // If 4 args, it could be COND, PRICE, NUMBER, PRECISION or PRICE, NUMBER, PRECISION, COLOR
          if (/color/i.test(args[3])) {
              return `DRAWNUMBER(ISLASTBAR, ${args[0]}, ${args[1]}), ${args[3]}${suffix}${hasSemi ? ';' : ''}`;
          } else {
              return `DRAWNUMBER(ISLASTBAR AND ${args[0]}, ${args[1]}, ${args[2]})${suffix}${hasSemi ? ';' : ''}`;
          }
      } else if (args.length === 3) {
          // COND, PRICE, NUMBER or PRICE, NUMBER, PRECISION
          // It's hard to distinguish, but usually it's COND, PRICE, NUMBER
          return `DRAWNUMBER(ISLASTBAR AND ${args[0]}, ${args[1]}, ${args[2]})${suffix}${hasSemi ? ';' : ''}`;
      } else if (args.length === 2) {
          return `DRAWNUMBER(ISLASTBAR, ${args[0]}, ${args[1]})${suffix}${hasSemi ? ';' : ''}`;
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
          // In TonghuaShun, we need two IF statements to simulate DRAWCOLORLINE.
          // The suffix (like line styles) should be applied to both IF statements.
          // We need to ensure the first IF statement ends with a semicolon.
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
                  comment = ` /* [线宽提示] 原宽度${width}已放大为${newWidth}以适配同花顺 */`;
              }
          }
          return `STICKLINE(${args[0]}, ${args[1]}, ${args[2]}, ${newWidth}, ${args[4]})${suffix}${hasSemi ? ';' : ''}${comment}`;
      }
      return null;
  });

  code = replaceFunction(code, 'DRAWSL', (args, suffix, hasSemi) => {
      // DRAWSL is not supported in iFinD. Comment it out safely without affecting other statements on the same line.
      return `/* 同花顺不支持画斜线: 参数(${args.join(', ')})${suffix}${hasSemi ? ';' : ''} */`;
  });

  // 9. Auto-fix missing semicolons
  // Sometimes users miss semicolons, or paste partially converted code.
  // In iFinD, every statement must end with a semicolon.
  let lines = code.split('\n');
  let globalParenCount = 0;
  let inDoubleGlobal = false;
  let inSingleGlobal = false;
  let inBlockCommentGlobal = false;
  
  for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      let checkCode = '';
      let lastCodeCharIdx = -1;
      let inSingle = false;
      let inDouble = false;
      let inBlockComment = inBlockCommentGlobal;
      
      for (let j = 0; j < line.length; j++) {
          if (inBlockComment) {
              if (line[j] === '*' && line[j+1] === '/') {
                  inBlockComment = false;
                  j++;
              }
              continue;
          }
          if (line[j] === "'" && !inDouble) inSingle = !inSingle;
          if (line[j] === '"' && !inSingle) inDouble = !inDouble;
          let inString = inSingle || inDouble;
          
          if (!inString) {
              if (line[j] === '/' && line[j+1] === '/') {
                  break; // Line comment, rest of line is comment
              }
              if (line[j] === '/' && line[j+1] === '*') {
                  inBlockComment = true;
                  j++;
                  continue;
              }
          }
          checkCode += line[j];
          if (line[j].trim() !== '') {
              lastCodeCharIdx = j;
          }
      }
      
      inBlockCommentGlobal = inBlockComment;
      checkCode = checkCode.trim();
      
      if (checkCode === '') continue;
      
      // Update global parenthesis count for this line
      for (let char of checkCode) {
          if (char === "'" && !inDoubleGlobal) inSingleGlobal = !inSingleGlobal;
          if (char === '"' && !inSingleGlobal) inDoubleGlobal = !inDoubleGlobal;
          let inString = inSingleGlobal || inDoubleGlobal;
          if (!inString) {
              if (char === '(') globalParenCount++;
              if (char === ')') globalParenCount--;
          }
      }
      
      if (!checkCode.endsWith(';')) {
          if (globalParenCount === 0) {
              let nextLineStartsWithOperator = false;
              let tempInBlockComment = inBlockCommentGlobal;
              
              for (let j = i + 1; j < lines.length; j++) {
                  let nextLine = lines[j];
                  let nextCheckCode = '';
                  let nextInSingle = false;
                  let nextInDouble = false;
                  
                  for (let k = 0; k < nextLine.length; k++) {
                      if (tempInBlockComment) {
                          if (nextLine[k] === '*' && nextLine[k+1] === '/') {
                              tempInBlockComment = false;
                              k++;
                          }
                          continue;
                      }
                      if (nextLine[k] === "'" && !nextInDouble) nextInSingle = !nextInSingle;
                      if (nextLine[k] === '"' && !nextInSingle) nextInDouble = !nextInDouble;
                      let inString = nextInSingle || nextInDouble;
                      
                      if (!inString) {
                          if (nextLine[k] === '/' && nextLine[k+1] === '/') break;
                          if (nextLine[k] === '/' && nextLine[k+1] === '*') {
                              tempInBlockComment = true;
                              k++;
                              continue;
                          }
                      }
                      nextCheckCode += nextLine[k];
                  }
                  
                  nextCheckCode = nextCheckCode.trim();
                  if (nextCheckCode !== '') {
                      if (/^(\+|-|\*|\/|AND\b|OR\b|,)/i.test(nextCheckCode)) {
                          nextLineStartsWithOperator = true;
                      }
                      break;
                  }
              }
              
              // Check if it looks like a complete statement (ends with closing paren, number, string, or letter)
              // and doesn't end with an operator like AND, OR
              if (!nextLineStartsWithOperator && /[a-zA-Z0-9_)'"\u4e00-\u9fa5]$/.test(checkCode) && !/\b(AND|OR)$/i.test(checkCode)) {
                  // Don't add semicolon if the line ends with a comma
                  if (!checkCode.endsWith(',')) {
                      lines[i] = line.substring(0, lastCodeCharIdx + 1) + ';' + line.substring(lastCodeCharIdx + 1);
                  }
              }
          }
      }
  }
  code = lines.join('\n');

  return code;
}
