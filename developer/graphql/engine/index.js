// @bun
// zveltio-extensions/node_modules/graphql/jsutils/devAssert.mjs
function devAssert(condition, message) {
  const booleanCondition = Boolean(condition);
  if (!booleanCondition) {
    throw new Error(message);
  }
}

// zveltio-extensions/node_modules/graphql/jsutils/inspect.mjs
var MAX_ARRAY_LENGTH = 10;
var MAX_RECURSIVE_DEPTH = 2;
function inspect(value) {
  return formatValue(value, []);
}
function formatValue(value, seenValues) {
  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "function":
      return value.name ? `[function ${value.name}]` : "[function]";
    case "object":
      return formatObjectValue(value, seenValues);
    default:
      return String(value);
  }
}
function formatObjectValue(value, previouslySeenValues) {
  if (value === null) {
    return "null";
  }
  if (previouslySeenValues.includes(value)) {
    return "[Circular]";
  }
  const seenValues = [...previouslySeenValues, value];
  if (isJSONable(value)) {
    const jsonValue = value.toJSON();
    if (jsonValue !== value) {
      return typeof jsonValue === "string" ? jsonValue : formatValue(jsonValue, seenValues);
    }
  } else if (Array.isArray(value)) {
    return formatArray(value, seenValues);
  }
  return formatObject(value, seenValues);
}
function isJSONable(value) {
  return typeof value.toJSON === "function";
}
function formatObject(object, seenValues) {
  const entries = Object.entries(object);
  if (entries.length === 0) {
    return "{}";
  }
  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[" + getObjectTag(object) + "]";
  }
  const properties = entries.map(([key, value]) => key + ": " + formatValue(value, seenValues));
  return "{ " + properties.join(", ") + " }";
}
function formatArray(array, seenValues) {
  if (array.length === 0) {
    return "[]";
  }
  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[Array]";
  }
  const len = Math.min(MAX_ARRAY_LENGTH, array.length);
  const remaining = array.length - len;
  const items = [];
  for (let i = 0;i < len; ++i) {
    items.push(formatValue(array[i], seenValues));
  }
  if (remaining === 1) {
    items.push("... 1 more item");
  } else if (remaining > 1) {
    items.push(`... ${remaining} more items`);
  }
  return "[" + items.join(", ") + "]";
}
function getObjectTag(object) {
  const tag = Object.prototype.toString.call(object).replace(/^\[object /, "").replace(/]$/, "");
  if (tag === "Object" && typeof object.constructor === "function") {
    const name = object.constructor.name;
    if (typeof name === "string" && name !== "") {
      return name;
    }
  }
  return tag;
}

// zveltio-extensions/node_modules/graphql/jsutils/instanceOf.mjs
var isProduction = globalThis.process && false;
var instanceOf = isProduction ? function instanceOf(value, constructor) {
  return value instanceof constructor;
} : function instanceOf(value, constructor) {
  if (value instanceof constructor) {
    return true;
  }
  if (typeof value === "object" && value !== null) {
    var _value$constructor;
    const className = constructor.prototype[Symbol.toStringTag];
    const valueClassName = Symbol.toStringTag in value ? value[Symbol.toStringTag] : (_value$constructor = value.constructor) === null || _value$constructor === undefined ? undefined : _value$constructor.name;
    if (className === valueClassName) {
      const stringifiedValue = inspect(value);
      throw new Error(`Cannot use ${className} "${stringifiedValue}" from another module or realm.

Ensure that there is only one instance of "graphql" in the node_modules
directory. If different versions of "graphql" are the dependencies of other
relied on modules, use "resolutions" to ensure only one version is installed.

https://yarnpkg.com/en/docs/selective-version-resolutions

Duplicate "graphql" modules cannot be used at the same time since different
versions may have different capabilities and behavior. The data from one
version used in the function from another could produce confusing and
spurious results.`);
    }
  }
  return false;
};

// zveltio-extensions/node_modules/graphql/jsutils/isObjectLike.mjs
function isObjectLike(value) {
  return typeof value == "object" && value !== null;
}

// zveltio-extensions/node_modules/graphql/jsutils/toObjMap.mjs
function toObjMap(obj) {
  if (obj == null) {
    return Object.create(null);
  }
  if (Object.getPrototypeOf(obj) === null) {
    return obj;
  }
  const map = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    map[key] = value;
  }
  return map;
}

// zveltio-extensions/node_modules/graphql/language/ast.mjs
class Location {
  constructor(startToken, endToken, source) {
    this.start = startToken.start;
    this.end = endToken.end;
    this.startToken = startToken;
    this.endToken = endToken;
    this.source = source;
  }
  get [Symbol.toStringTag]() {
    return "Location";
  }
  toJSON() {
    return {
      start: this.start,
      end: this.end
    };
  }
}

class Token {
  constructor(kind, start, end, line, column, value) {
    this.kind = kind;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
  get [Symbol.toStringTag]() {
    return "Token";
  }
  toJSON() {
    return {
      kind: this.kind,
      value: this.value,
      line: this.line,
      column: this.column
    };
  }
}
var QueryDocumentKeys = {
  Name: [],
  Document: ["definitions"],
  OperationDefinition: [
    "description",
    "name",
    "variableDefinitions",
    "directives",
    "selectionSet"
  ],
  VariableDefinition: [
    "description",
    "variable",
    "type",
    "defaultValue",
    "directives"
  ],
  Variable: ["name"],
  SelectionSet: ["selections"],
  Field: ["alias", "name", "arguments", "directives", "selectionSet"],
  Argument: ["name", "value"],
  FragmentSpread: ["name", "directives"],
  InlineFragment: ["typeCondition", "directives", "selectionSet"],
  FragmentDefinition: [
    "description",
    "name",
    "variableDefinitions",
    "typeCondition",
    "directives",
    "selectionSet"
  ],
  IntValue: [],
  FloatValue: [],
  StringValue: [],
  BooleanValue: [],
  NullValue: [],
  EnumValue: [],
  ListValue: ["values"],
  ObjectValue: ["fields"],
  ObjectField: ["name", "value"],
  Directive: ["name", "arguments"],
  NamedType: ["name"],
  ListType: ["type"],
  NonNullType: ["type"],
  SchemaDefinition: ["description", "directives", "operationTypes"],
  OperationTypeDefinition: ["type"],
  ScalarTypeDefinition: ["description", "name", "directives"],
  ObjectTypeDefinition: [
    "description",
    "name",
    "interfaces",
    "directives",
    "fields"
  ],
  FieldDefinition: ["description", "name", "arguments", "type", "directives"],
  InputValueDefinition: [
    "description",
    "name",
    "type",
    "defaultValue",
    "directives"
  ],
  InterfaceTypeDefinition: [
    "description",
    "name",
    "interfaces",
    "directives",
    "fields"
  ],
  UnionTypeDefinition: ["description", "name", "directives", "types"],
  EnumTypeDefinition: ["description", "name", "directives", "values"],
  EnumValueDefinition: ["description", "name", "directives"],
  InputObjectTypeDefinition: ["description", "name", "directives", "fields"],
  DirectiveDefinition: [
    "description",
    "name",
    "arguments",
    "directives",
    "locations"
  ],
  SchemaExtension: ["directives", "operationTypes"],
  DirectiveExtension: ["name", "directives"],
  ScalarTypeExtension: ["name", "directives"],
  ObjectTypeExtension: ["name", "interfaces", "directives", "fields"],
  InterfaceTypeExtension: ["name", "interfaces", "directives", "fields"],
  UnionTypeExtension: ["name", "directives", "types"],
  EnumTypeExtension: ["name", "directives", "values"],
  InputObjectTypeExtension: ["name", "directives", "fields"],
  TypeCoordinate: ["name"],
  MemberCoordinate: ["name", "memberName"],
  ArgumentCoordinate: ["name", "fieldName", "argumentName"],
  DirectiveCoordinate: ["name"],
  DirectiveArgumentCoordinate: ["name", "argumentName"]
};
var kindValues = new Set(Object.keys(QueryDocumentKeys));
function isNode(maybeNode) {
  const maybeKind = maybeNode === null || maybeNode === undefined ? undefined : maybeNode.kind;
  return typeof maybeKind === "string" && kindValues.has(maybeKind);
}
var OperationTypeNode;
(function(OperationTypeNode) {
  OperationTypeNode["QUERY"] = "query";
  OperationTypeNode["MUTATION"] = "mutation";
  OperationTypeNode["SUBSCRIPTION"] = "subscription";
})(OperationTypeNode || (OperationTypeNode = {}));

// zveltio-extensions/node_modules/graphql/jsutils/didYouMean.mjs
var MAX_SUGGESTIONS = 5;
function didYouMean(firstArg, secondArg) {
  const [subMessage, suggestionsArg] = secondArg ? [firstArg, secondArg] : [undefined, firstArg];
  let message = " Did you mean ";
  if (subMessage) {
    message += subMessage + " ";
  }
  const suggestions = suggestionsArg.map((x) => `"${x}"`);
  switch (suggestions.length) {
    case 0:
      return "";
    case 1:
      return message + suggestions[0] + "?";
    case 2:
      return message + suggestions[0] + " or " + suggestions[1] + "?";
  }
  const selected = suggestions.slice(0, MAX_SUGGESTIONS);
  const lastItem = selected.pop();
  return message + selected.join(", ") + ", or " + lastItem + "?";
}

// zveltio-extensions/node_modules/graphql/jsutils/identityFunc.mjs
function identityFunc(x) {
  return x;
}

// zveltio-extensions/node_modules/graphql/jsutils/keyMap.mjs
function keyMap(list, keyFn) {
  const result = Object.create(null);
  for (const item of list) {
    result[keyFn(item)] = item;
  }
  return result;
}

// zveltio-extensions/node_modules/graphql/jsutils/keyValMap.mjs
function keyValMap(list, keyFn, valFn) {
  const result = Object.create(null);
  for (const item of list) {
    result[keyFn(item)] = valFn(item);
  }
  return result;
}

// zveltio-extensions/node_modules/graphql/jsutils/mapValue.mjs
function mapValue(map, fn) {
  const result = Object.create(null);
  for (const key of Object.keys(map)) {
    result[key] = fn(map[key], key);
  }
  return result;
}

// zveltio-extensions/node_modules/graphql/jsutils/naturalCompare.mjs
function naturalCompare(aStr, bStr) {
  let aIndex = 0;
  let bIndex = 0;
  while (aIndex < aStr.length && bIndex < bStr.length) {
    let aChar = aStr.charCodeAt(aIndex);
    let bChar = bStr.charCodeAt(bIndex);
    if (isDigit(aChar) && isDigit(bChar)) {
      let aNum = 0;
      do {
        ++aIndex;
        aNum = aNum * 10 + aChar - DIGIT_0;
        aChar = aStr.charCodeAt(aIndex);
      } while (isDigit(aChar) && aNum > 0);
      let bNum = 0;
      do {
        ++bIndex;
        bNum = bNum * 10 + bChar - DIGIT_0;
        bChar = bStr.charCodeAt(bIndex);
      } while (isDigit(bChar) && bNum > 0);
      if (aNum < bNum) {
        return -1;
      }
      if (aNum > bNum) {
        return 1;
      }
    } else {
      if (aChar < bChar) {
        return -1;
      }
      if (aChar > bChar) {
        return 1;
      }
      ++aIndex;
      ++bIndex;
    }
  }
  return aStr.length - bStr.length;
}
var DIGIT_0 = 48;
var DIGIT_9 = 57;
function isDigit(code) {
  return !isNaN(code) && DIGIT_0 <= code && code <= DIGIT_9;
}

// zveltio-extensions/node_modules/graphql/jsutils/suggestionList.mjs
function suggestionList(input, options) {
  const optionsByDistance = Object.create(null);
  const lexicalDistance = new LexicalDistance(input);
  const threshold = Math.floor(input.length * 0.4) + 1;
  for (const option of options) {
    const distance = lexicalDistance.measure(option, threshold);
    if (distance !== undefined) {
      optionsByDistance[option] = distance;
    }
  }
  return Object.keys(optionsByDistance).sort((a, b) => {
    const distanceDiff = optionsByDistance[a] - optionsByDistance[b];
    return distanceDiff !== 0 ? distanceDiff : naturalCompare(a, b);
  });
}

class LexicalDistance {
  constructor(input) {
    this._input = input;
    this._inputLowerCase = input.toLowerCase();
    this._inputArray = stringToArray(this._inputLowerCase);
    this._rows = [
      new Array(input.length + 1).fill(0),
      new Array(input.length + 1).fill(0),
      new Array(input.length + 1).fill(0)
    ];
  }
  measure(option, threshold) {
    if (this._input === option) {
      return 0;
    }
    const optionLowerCase = option.toLowerCase();
    if (this._inputLowerCase === optionLowerCase) {
      return 1;
    }
    let a = stringToArray(optionLowerCase);
    let b = this._inputArray;
    if (a.length < b.length) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    const aLength = a.length;
    const bLength = b.length;
    if (aLength - bLength > threshold) {
      return;
    }
    const rows = this._rows;
    for (let j = 0;j <= bLength; j++) {
      rows[0][j] = j;
    }
    for (let i = 1;i <= aLength; i++) {
      const upRow = rows[(i - 1) % 3];
      const currentRow = rows[i % 3];
      let smallestCell = currentRow[0] = i;
      for (let j = 1;j <= bLength; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let currentCell = Math.min(upRow[j] + 1, currentRow[j - 1] + 1, upRow[j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          const doubleDiagonalCell = rows[(i - 2) % 3][j - 2];
          currentCell = Math.min(currentCell, doubleDiagonalCell + 1);
        }
        if (currentCell < smallestCell) {
          smallestCell = currentCell;
        }
        currentRow[j] = currentCell;
      }
      if (smallestCell > threshold) {
        return;
      }
    }
    const distance = rows[aLength % 3][bLength];
    return distance <= threshold ? distance : undefined;
  }
}
function stringToArray(str) {
  const strLength = str.length;
  const array = new Array(strLength);
  for (let i = 0;i < strLength; ++i) {
    array[i] = str.charCodeAt(i);
  }
  return array;
}

// zveltio-extensions/node_modules/graphql/language/location.mjs
function getLocation(source, position) {
  const lineRegexp = /\r\n|[\n\r]/g;
  let line = 1;
  let column = position + 1;
  let match;
  while ((match = lineRegexp.exec(source.body)) && match.index < position) {
    line++;
    column = position + 1 - (match.index + match[0].length);
  }
  return {
    line,
    column
  };
}
function getLocations(locations) {
  if (locations.length < 2) {
    return locations.map(({ source, start }) => getLocation(source, start));
  }
  const bySource = new Map;
  locations.forEach(({ source, start }, index) => {
    let positions = bySource.get(source);
    if (positions === undefined) {
      positions = [];
      bySource.set(source, positions);
    }
    positions.push({
      position: start,
      index
    });
  });
  const result = new Array(locations.length);
  for (const [source, positions] of bySource) {
    const lineRegexp = /\r\n|[\n\r]/g;
    let match = lineRegexp.exec(source.body);
    let line = 1;
    let lastLineStart = 0;
    positions.sort((a, b) => a.position - b.position);
    for (const { position, index } of positions) {
      while (match !== null && match.index < position) {
        lastLineStart = match.index + match[0].length;
        line++;
        match = lineRegexp.exec(source.body);
      }
      result[index] = {
        line,
        column: position + 1 - lastLineStart
      };
    }
  }
  return result;
}

// zveltio-extensions/node_modules/graphql/language/printLocation.mjs
function printLocation(location) {
  return printSourceLocation(location.source, getLocation(location.source, location.start));
}
function printSourceLocation(source, sourceLocation) {
  const firstLineColumnOffset = source.locationOffset.column - 1;
  const body = "".padStart(firstLineColumnOffset) + source.body;
  const lineIndex = sourceLocation.line - 1;
  const lineOffset = source.locationOffset.line - 1;
  const lineNum = sourceLocation.line + lineOffset;
  const columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
  const columnNum = sourceLocation.column + columnOffset;
  const locationStr = `${source.name}:${lineNum}:${columnNum}
`;
  const lines = body.split(/\r\n|[\n\r]/g);
  const locationLine = lines[lineIndex];
  if (locationLine.length > 120) {
    const subLineIndex = Math.floor(columnNum / 80);
    const subLineColumnNum = columnNum % 80;
    const subLines = [];
    for (let i = 0;i < locationLine.length; i += 80) {
      subLines.push(locationLine.slice(i, i + 80));
    }
    return locationStr + printPrefixedLines([
      [`${lineNum} |`, subLines[0]],
      ...subLines.slice(1, subLineIndex + 1).map((subLine) => ["|", subLine]),
      ["|", "^".padStart(subLineColumnNum)],
      ["|", subLines[subLineIndex + 1]]
    ]);
  }
  return locationStr + printPrefixedLines([
    [`${lineNum - 1} |`, lines[lineIndex - 1]],
    [`${lineNum} |`, locationLine],
    ["|", "^".padStart(columnNum)],
    [`${lineNum + 1} |`, lines[lineIndex + 1]]
  ]);
}
function printPrefixedLines(lines) {
  const existingLines = lines.filter(([_, line]) => line !== undefined);
  const padLen = Math.max(...existingLines.map(([prefix]) => prefix.length));
  return existingLines.map(([prefix, line]) => prefix.padStart(padLen) + (line ? " " + line : "")).join(`
`);
}

// zveltio-extensions/node_modules/graphql/error/GraphQLError.mjs
function toNormalizedOptions(args) {
  const firstArg = args[0];
  if (firstArg == null || "kind" in firstArg || "length" in firstArg) {
    return {
      nodes: firstArg,
      source: args[1],
      positions: args[2],
      path: args[3],
      originalError: args[4],
      extensions: args[5]
    };
  }
  return firstArg;
}

class GraphQLError extends Error {
  constructor(message, ...rawArgs) {
    var _this$nodes, _nodeLocations$, _ref;
    const { nodes, source, positions, path, originalError, extensions } = toNormalizedOptions(rawArgs);
    super(message);
    this.name = "GraphQLError";
    this.path = path !== null && path !== undefined ? path : undefined;
    this.originalError = originalError !== null && originalError !== undefined ? originalError : undefined;
    this.nodes = undefinedIfEmpty(Array.isArray(nodes) ? nodes : nodes ? [nodes] : undefined);
    const nodeLocations = undefinedIfEmpty((_this$nodes = this.nodes) === null || _this$nodes === undefined ? undefined : _this$nodes.map((node) => node.loc).filter((loc) => loc != null));
    this.source = source !== null && source !== undefined ? source : nodeLocations === null || nodeLocations === undefined ? undefined : (_nodeLocations$ = nodeLocations[0]) === null || _nodeLocations$ === undefined ? undefined : _nodeLocations$.source;
    this.positions = positions !== null && positions !== undefined ? positions : nodeLocations === null || nodeLocations === undefined ? undefined : nodeLocations.map((loc) => loc.start);
    this.locations = positions && source ? getLocations(positions.map((start) => ({
      source,
      start
    }))) : nodeLocations && getLocations(nodeLocations);
    const originalExtensions = isObjectLike(originalError === null || originalError === undefined ? undefined : originalError.extensions) ? originalError === null || originalError === undefined ? undefined : originalError.extensions : undefined;
    this.extensions = (_ref = extensions !== null && extensions !== undefined ? extensions : originalExtensions) !== null && _ref !== undefined ? _ref : Object.create(null);
    Object.defineProperties(this, {
      message: {
        writable: true,
        enumerable: true
      },
      name: {
        enumerable: false
      },
      nodes: {
        enumerable: false
      },
      source: {
        enumerable: false
      },
      positions: {
        enumerable: false
      },
      originalError: {
        enumerable: false
      }
    });
    if (originalError !== null && originalError !== undefined && originalError.stack) {
      Object.defineProperty(this, "stack", {
        value: originalError.stack,
        writable: true,
        configurable: true
      });
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphQLError);
    } else {
      Object.defineProperty(this, "stack", {
        value: Error().stack,
        writable: true,
        configurable: true
      });
    }
  }
  get [Symbol.toStringTag]() {
    return "GraphQLError";
  }
  toString() {
    let output = this.message;
    if (this.nodes) {
      for (const node of this.nodes) {
        if (node.loc) {
          output += `

` + printLocation(node.loc);
        }
      }
    } else if (this.source && this.locations) {
      for (const location of this.locations) {
        output += `

` + printSourceLocation(this.source, location);
      }
    }
    return output;
  }
  toJSON() {
    const formattedError = {
      message: this.message
    };
    if (this.locations != null) {
      formattedError.locations = this.locations;
    }
    if (this.path != null) {
      formattedError.path = this.path;
    }
    if (this.extensions != null && Object.keys(this.extensions).length > 0) {
      formattedError.extensions = this.extensions;
    }
    return formattedError;
  }
}
function undefinedIfEmpty(array) {
  return array === undefined || array.length === 0 ? undefined : array;
}

// zveltio-extensions/node_modules/graphql/language/kinds.mjs
var Kind;
(function(Kind) {
  Kind["NAME"] = "Name";
  Kind["DOCUMENT"] = "Document";
  Kind["OPERATION_DEFINITION"] = "OperationDefinition";
  Kind["VARIABLE_DEFINITION"] = "VariableDefinition";
  Kind["SELECTION_SET"] = "SelectionSet";
  Kind["FIELD"] = "Field";
  Kind["ARGUMENT"] = "Argument";
  Kind["FRAGMENT_SPREAD"] = "FragmentSpread";
  Kind["INLINE_FRAGMENT"] = "InlineFragment";
  Kind["FRAGMENT_DEFINITION"] = "FragmentDefinition";
  Kind["VARIABLE"] = "Variable";
  Kind["INT"] = "IntValue";
  Kind["FLOAT"] = "FloatValue";
  Kind["STRING"] = "StringValue";
  Kind["BOOLEAN"] = "BooleanValue";
  Kind["NULL"] = "NullValue";
  Kind["ENUM"] = "EnumValue";
  Kind["LIST"] = "ListValue";
  Kind["OBJECT"] = "ObjectValue";
  Kind["OBJECT_FIELD"] = "ObjectField";
  Kind["DIRECTIVE"] = "Directive";
  Kind["NAMED_TYPE"] = "NamedType";
  Kind["LIST_TYPE"] = "ListType";
  Kind["NON_NULL_TYPE"] = "NonNullType";
  Kind["SCHEMA_DEFINITION"] = "SchemaDefinition";
  Kind["OPERATION_TYPE_DEFINITION"] = "OperationTypeDefinition";
  Kind["SCALAR_TYPE_DEFINITION"] = "ScalarTypeDefinition";
  Kind["OBJECT_TYPE_DEFINITION"] = "ObjectTypeDefinition";
  Kind["FIELD_DEFINITION"] = "FieldDefinition";
  Kind["INPUT_VALUE_DEFINITION"] = "InputValueDefinition";
  Kind["INTERFACE_TYPE_DEFINITION"] = "InterfaceTypeDefinition";
  Kind["UNION_TYPE_DEFINITION"] = "UnionTypeDefinition";
  Kind["ENUM_TYPE_DEFINITION"] = "EnumTypeDefinition";
  Kind["ENUM_VALUE_DEFINITION"] = "EnumValueDefinition";
  Kind["INPUT_OBJECT_TYPE_DEFINITION"] = "InputObjectTypeDefinition";
  Kind["DIRECTIVE_DEFINITION"] = "DirectiveDefinition";
  Kind["SCHEMA_EXTENSION"] = "SchemaExtension";
  Kind["DIRECTIVE_EXTENSION"] = "DirectiveExtension";
  Kind["SCALAR_TYPE_EXTENSION"] = "ScalarTypeExtension";
  Kind["OBJECT_TYPE_EXTENSION"] = "ObjectTypeExtension";
  Kind["INTERFACE_TYPE_EXTENSION"] = "InterfaceTypeExtension";
  Kind["UNION_TYPE_EXTENSION"] = "UnionTypeExtension";
  Kind["ENUM_TYPE_EXTENSION"] = "EnumTypeExtension";
  Kind["INPUT_OBJECT_TYPE_EXTENSION"] = "InputObjectTypeExtension";
  Kind["TYPE_COORDINATE"] = "TypeCoordinate";
  Kind["MEMBER_COORDINATE"] = "MemberCoordinate";
  Kind["ARGUMENT_COORDINATE"] = "ArgumentCoordinate";
  Kind["DIRECTIVE_COORDINATE"] = "DirectiveCoordinate";
  Kind["DIRECTIVE_ARGUMENT_COORDINATE"] = "DirectiveArgumentCoordinate";
})(Kind || (Kind = {}));

// zveltio-extensions/node_modules/graphql/language/characterClasses.mjs
function isWhiteSpace(code) {
  return code === 9 || code === 32;
}
function isDigit2(code) {
  return code >= 48 && code <= 57;
}
function isLetter(code) {
  return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function isNameStart(code) {
  return isLetter(code) || code === 95;
}
function isNameContinue(code) {
  return isLetter(code) || isDigit2(code) || code === 95;
}

// zveltio-extensions/node_modules/graphql/language/blockString.mjs
function dedentBlockStringLines(lines) {
  var _firstNonEmptyLine2;
  let commonIndent = Number.MAX_SAFE_INTEGER;
  let firstNonEmptyLine = null;
  let lastNonEmptyLine = -1;
  for (let i = 0;i < lines.length; ++i) {
    var _firstNonEmptyLine;
    const line = lines[i];
    const indent = leadingWhitespace(line);
    if (indent === line.length) {
      continue;
    }
    firstNonEmptyLine = (_firstNonEmptyLine = firstNonEmptyLine) !== null && _firstNonEmptyLine !== undefined ? _firstNonEmptyLine : i;
    lastNonEmptyLine = i;
    if (i !== 0 && indent < commonIndent) {
      commonIndent = indent;
    }
  }
  return lines.map((line, i) => i === 0 ? line : line.slice(commonIndent)).slice((_firstNonEmptyLine2 = firstNonEmptyLine) !== null && _firstNonEmptyLine2 !== undefined ? _firstNonEmptyLine2 : 0, lastNonEmptyLine + 1);
}
function leadingWhitespace(str) {
  let i = 0;
  while (i < str.length && isWhiteSpace(str.charCodeAt(i))) {
    ++i;
  }
  return i;
}
function printBlockString(value, options) {
  const escapedValue = value.replace(/"""/g, '\\"""');
  const lines = escapedValue.split(/\r\n|[\n\r]/g);
  const isSingleLine = lines.length === 1;
  const forceLeadingNewLine = lines.length > 1 && lines.slice(1).every((line) => line.length === 0 || isWhiteSpace(line.charCodeAt(0)));
  const hasTrailingTripleQuotes = escapedValue.endsWith('\\"""');
  const hasTrailingQuote = value.endsWith('"') && !hasTrailingTripleQuotes;
  const hasTrailingSlash = value.endsWith("\\");
  const forceTrailingNewline = hasTrailingQuote || hasTrailingSlash;
  const printAsMultipleLines = !(options !== null && options !== undefined && options.minimize) && (!isSingleLine || value.length > 70 || forceTrailingNewline || forceLeadingNewLine || hasTrailingTripleQuotes);
  let result = "";
  const skipLeadingNewLine = isSingleLine && isWhiteSpace(value.charCodeAt(0));
  if (printAsMultipleLines && !skipLeadingNewLine || forceLeadingNewLine) {
    result += `
`;
  }
  result += escapedValue;
  if (printAsMultipleLines || forceTrailingNewline) {
    result += `
`;
  }
  return '"""' + result + '"""';
}

// zveltio-extensions/node_modules/graphql/language/printString.mjs
function printString(str) {
  return `"${str.replace(escapedRegExp, escapedReplacer)}"`;
}
var escapedRegExp = /[\x00-\x1f\x22\x5c\x7f-\x9f]/g;
function escapedReplacer(str) {
  return escapeSequences[str.charCodeAt(0)];
}
var escapeSequences = [
  "\\u0000",
  "\\u0001",
  "\\u0002",
  "\\u0003",
  "\\u0004",
  "\\u0005",
  "\\u0006",
  "\\u0007",
  "\\b",
  "\\t",
  "\\n",
  "\\u000B",
  "\\f",
  "\\r",
  "\\u000E",
  "\\u000F",
  "\\u0010",
  "\\u0011",
  "\\u0012",
  "\\u0013",
  "\\u0014",
  "\\u0015",
  "\\u0016",
  "\\u0017",
  "\\u0018",
  "\\u0019",
  "\\u001A",
  "\\u001B",
  "\\u001C",
  "\\u001D",
  "\\u001E",
  "\\u001F",
  "",
  "",
  "\\\"",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "\\\\",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "\\u007F",
  "\\u0080",
  "\\u0081",
  "\\u0082",
  "\\u0083",
  "\\u0084",
  "\\u0085",
  "\\u0086",
  "\\u0087",
  "\\u0088",
  "\\u0089",
  "\\u008A",
  "\\u008B",
  "\\u008C",
  "\\u008D",
  "\\u008E",
  "\\u008F",
  "\\u0090",
  "\\u0091",
  "\\u0092",
  "\\u0093",
  "\\u0094",
  "\\u0095",
  "\\u0096",
  "\\u0097",
  "\\u0098",
  "\\u0099",
  "\\u009A",
  "\\u009B",
  "\\u009C",
  "\\u009D",
  "\\u009E",
  "\\u009F"
];

// zveltio-extensions/node_modules/graphql/language/reducer.mjs
function reduce(root, reducer) {
  const stack = [];
  let frame = {
    parent: [root],
    keys: undefined,
    results: [],
    index: -1
  };
  let node;
  do {
    let kind;
    frame.index++;
    const length = frame.keys === undefined ? frame.parent.length : frame.keys.length;
    if (frame.index === length) {
      node = frame.results;
      kind = frame.keys === undefined ? undefined : frame.results.kind;
      frame = stack.pop();
    } else {
      node = frame.keys === undefined ? frame.parent[frame.index] : frame.parent[frame.keys[frame.index]];
      if (node == null && stack.length !== 0) {
        continue;
      }
      if (Array.isArray(node)) {
        if (node.length !== 0) {
          stack.push(frame);
          frame = {
            parent: node,
            keys: undefined,
            results: [],
            index: -1
          };
          continue;
        }
      } else {
        const parent = node;
        kind = parent === null || parent === undefined ? undefined : parent.kind;
        const keys = typeof kind === "string" ? QueryDocumentKeys[kind] : undefined;
        if (!Array.isArray(keys)) {
          throw new Error(`Invalid AST Node: ${inspect(node)}.`);
        }
        if (keys.length !== 0) {
          stack.push(frame);
          frame = {
            parent,
            keys,
            results: { ...parent },
            index: -1
          };
          continue;
        }
      }
    }
    if (kind !== undefined) {
      const reduceNode = reducer[kind];
      node = reduceNode === null || reduceNode === undefined ? undefined : reduceNode(node);
    }
    if (frame.keys === undefined) {
      frame.results.push(node);
    } else {
      frame.results[frame.keys[frame.index]] = node;
    }
  } while (stack.length !== 0);
  return node;
}

// zveltio-extensions/node_modules/graphql/language/printer.mjs
function print(ast, options) {
  var _options$maxIndentDep;
  return render(reduce(ast, printDocASTReducer), (_options$maxIndentDep = options === null || options === undefined ? undefined : options.maxIndentDepth) !== null && _options$maxIndentDep !== undefined ? _options$maxIndentDep : Infinity);
}
function printForError(ast) {
  return print(ast, {
    maxIndentDepth: 100
  });
}
var MAX_LINE_LENGTH = 80;

class PrintBuffer {
  next = undefined;
  tail = this;
  indentBefore = false;
  dedentAfter = false;
  constructor(value = "", isBlockString = false) {
    this.length = value.length;
    this.lines = value.includes(`
`) ? value.split(`
`) : value;
    this.newlines = typeof this.lines === "string" ? 0 : this.lines.length - 1;
    this.isBlockString = isBlockString;
  }
  append(result) {
    if (result.length === 0) {
      return this;
    }
    const next = typeof result === "string" ? new PrintBuffer(result) : result;
    this.tail.next = next;
    this.tail = next.tail;
    this.length += next.length;
    this.newlines += next.newlines;
    return this;
  }
  indent() {
    if (this.length === 0) {
      return this;
    }
    this.indentBefore = true;
    this.tail.dedentAfter = true;
    this.length += 2 * (this.newlines + 1);
    return this;
  }
}
var EMPTY = new PrintBuffer;
function render(buffer, maxDepth) {
  let output = "";
  let text = "";
  let depth = 0;
  let indentation = "";
  let part = buffer;
  while (part !== undefined) {
    const lines = part.lines;
    if (part.indentBefore) {
      if (depth < maxDepth) {
        indentation += "  ";
        text += "  ";
      }
      depth++;
    }
    if (typeof lines === "string") {
      text += lines;
    } else {
      text += lines[0];
      const newline = !part.isBlockString && depth >= maxDepth ? " " : `
` + indentation;
      for (let i = 1;i < lines.length; i++) {
        output += text;
        text = newline + lines[i];
      }
    }
    if (part.dedentAfter) {
      depth--;
      indentation = indentation.slice(0, depth * 2);
    }
    part = part.next;
  }
  return output + text;
}
var printDocASTReducer = {
  Name: (node) => new PrintBuffer(node.value),
  Variable: (node) => join(["$", node.name]),
  Document: (node) => join(node.definitions, `

`),
  OperationDefinition(node) {
    const varDefs = hasMultilineItems(node.variableDefinitions) ? wrap(`(
`, join(node.variableDefinitions, `
`), `
)`) : wrap("(", join(node.variableDefinitions, ", "), ")");
    const prefix = join([
      wrap("", node.description, `
`),
      join([
        node.operation,
        join([node.name, varDefs]),
        join(node.directives, " ")
      ], " ")
    ]);
    return join([
      node.operation === "query" && prefix.length === node.operation.length ? "" : join([prefix, " "]),
      node.selectionSet
    ]);
  },
  VariableDefinition: ({
    variable,
    type,
    defaultValue,
    directives,
    description
  }) => join([
    wrap("", description, `
`),
    variable,
    ": ",
    type,
    wrap(" = ", defaultValue),
    wrap(" ", join(directives, " "))
  ]),
  SelectionSet: ({ selections }) => block(selections),
  Field({ alias, name, arguments: args, directives, selectionSet }) {
    const prefix = join([wrap("", alias, ": "), name], "");
    return join([
      wrappedLineAndArgs(prefix, args),
      wrap(" ", join(directives, " ")),
      wrap(" ", selectionSet)
    ]);
  },
  Argument: ({ name, value }) => join([name, ": ", value]),
  FragmentSpread: ({ name, directives }) => join(["...", name, wrap(" ", join(directives, " "))]),
  InlineFragment: ({ typeCondition, directives, selectionSet }) => join(["...", wrap("on ", typeCondition), join(directives, " "), selectionSet], " "),
  FragmentDefinition: ({
    name,
    typeCondition,
    variableDefinitions,
    directives,
    selectionSet,
    description
  }) => join([
    wrap("", description, `
`),
    "fragment ",
    name,
    wrap("(", join(variableDefinitions, ", "), ")"),
    " on ",
    typeCondition,
    " ",
    wrap("", join(directives, " "), " "),
    selectionSet
  ]),
  IntValue: ({ value }) => new PrintBuffer(value),
  FloatValue: ({ value }) => new PrintBuffer(value),
  StringValue: ({ value, block: isBlockString }) => new PrintBuffer(isBlockString === true ? printBlockString(value) : printString(value), isBlockString === true),
  BooleanValue: ({ value }) => new PrintBuffer(value ? "true" : "false"),
  NullValue: () => new PrintBuffer("null"),
  EnumValue: ({ value }) => new PrintBuffer(value),
  ListValue: ({ values }) => join(["[", join(values, ", "), "]"]),
  ObjectValue: ({ fields }) => join(["{", join(fields, ", "), "}"]),
  ObjectField: ({ name, value }) => join([name, ": ", value]),
  Directive: ({ name, arguments: args }) => join(["@", name, wrap("(", join(args, ", "), ")")]),
  NamedType: ({ name }) => name,
  ListType: ({ type }) => join(["[", type, "]"]),
  NonNullType: ({ type }) => join([type, "!"]),
  SchemaDefinition: ({ description, directives, operationTypes }) => join([
    wrap("", description, `
`),
    join(["schema", join(directives, " "), block(operationTypes)], " ")
  ]),
  OperationTypeDefinition: ({ operation, type }) => join([operation, ": ", type]),
  ScalarTypeDefinition: ({ description, name, directives }) => join([
    wrap("", description, `
`),
    join(["scalar", name, join(directives, " ")], " ")
  ]),
  ObjectTypeDefinition: ({
    description,
    name,
    interfaces,
    directives,
    fields
  }) => join([
    wrap("", description, `
`),
    join([
      "type",
      name,
      wrap("implements ", join(interfaces, " & ")),
      join(directives, " "),
      block(fields)
    ], " ")
  ]),
  FieldDefinition: ({ description, name, arguments: args, type, directives }) => join([
    wrap("", description, `
`),
    name,
    hasMultilineItems(args) ? wrap(`(
`, join(args, `
`).indent(), `
)`) : wrap("(", join(args, ", "), ")"),
    ": ",
    type,
    wrap(" ", join(directives, " "))
  ]),
  InputValueDefinition: ({
    description,
    name,
    type,
    defaultValue,
    directives
  }) => join([
    wrap("", description, `
`),
    name,
    ": ",
    type,
    wrap(" = ", defaultValue),
    wrap(" ", join(directives, " "))
  ]),
  InterfaceTypeDefinition: ({
    description,
    name,
    interfaces,
    directives,
    fields
  }) => join([
    wrap("", description, `
`),
    join([
      "interface",
      name,
      wrap("implements ", join(interfaces, " & ")),
      join(directives, " "),
      block(fields)
    ], " ")
  ]),
  UnionTypeDefinition: ({ description, name, directives, types }) => join([
    wrap("", description, `
`),
    join(["union", name, join(directives, " "), wrap("= ", join(types, " | "))], " ")
  ]),
  EnumTypeDefinition: ({ description, name, directives, values }) => join([
    wrap("", description, `
`),
    join(["enum", name, join(directives, " "), block(values)], " ")
  ]),
  EnumValueDefinition: ({ description, name, directives }) => join([
    wrap("", description, `
`),
    join([name, join(directives, " ")], " ")
  ]),
  InputObjectTypeDefinition: ({ description, name, directives, fields }) => join([
    wrap("", description, `
`),
    join(["input", name, join(directives, " "), block(fields)], " ")
  ]),
  DirectiveDefinition: ({
    description,
    name,
    arguments: args,
    directives,
    repeatable,
    locations
  }) => join([
    wrap("", description, `
`),
    "directive @",
    name,
    hasMultilineItems(args) ? wrap(`(
`, join(args, `
`).indent(), `
)`) : wrap("(", join(args, ", "), ")"),
    wrap(" ", join(directives, " ")),
    repeatable ? " repeatable" : "",
    " on ",
    join(locations, " | ")
  ]),
  SchemaExtension: ({ directives, operationTypes }) => join(["extend schema", join(directives, " "), block(operationTypes)], " "),
  ScalarTypeExtension: ({ name, directives }) => join(["extend scalar", name, join(directives, " ")], " "),
  ObjectTypeExtension: ({ name, interfaces, directives, fields }) => join([
    "extend type",
    name,
    wrap("implements ", join(interfaces, " & ")),
    join(directives, " "),
    block(fields)
  ], " "),
  InterfaceTypeExtension: ({ name, interfaces, directives, fields }) => join([
    "extend interface",
    name,
    wrap("implements ", join(interfaces, " & ")),
    join(directives, " "),
    block(fields)
  ], " "),
  UnionTypeExtension: ({ name, directives, types }) => join([
    "extend union",
    name,
    join(directives, " "),
    wrap("= ", join(types, " | "))
  ], " "),
  EnumTypeExtension: ({ name, directives, values }) => join(["extend enum", name, join(directives, " "), block(values)], " "),
  InputObjectTypeExtension: ({ name, directives, fields }) => join(["extend input", name, join(directives, " "), block(fields)], " "),
  DirectiveExtension: ({ name, directives }) => join([join(["extend directive @", name]), join(directives, " ")], " "),
  TypeCoordinate: ({ name }) => name,
  MemberCoordinate: ({ name, memberName }) => join([name, wrap(".", memberName)]),
  ArgumentCoordinate: ({ name, fieldName, argumentName }) => join([name, wrap(".", fieldName), wrap("(", argumentName, ":)")]),
  DirectiveCoordinate: ({ name }) => join(["@", name]),
  DirectiveArgumentCoordinate: ({ name, argumentName }) => join(["@", name, wrap("(", argumentName, ":)")])
};
function join(maybeArray, separator = "") {
  if (maybeArray == null || maybeArray.length === 0) {
    return EMPTY;
  }
  let result = EMPTY;
  for (const item of maybeArray) {
    if (item === undefined || item.length === 0) {
      continue;
    }
    if (result.length === 0) {
      result = typeof item === "string" ? new PrintBuffer(item) : item;
    } else {
      if (separator !== "") {
        result.append(separator);
      }
      result.append(item);
    }
  }
  return result;
}
function joinedLength(array, separator) {
  let length = 0;
  for (const item of array) {
    if (item.length !== 0) {
      length += (length === 0 ? 0 : separator.length) + item.length;
    }
  }
  return length;
}
function block(array) {
  return wrap(`{
`, join(array, `
`).indent(), `
}`);
}
function wrap(start, maybeBuffer, end = "") {
  return maybeBuffer != null && maybeBuffer.length !== 0 ? start === "" ? maybeBuffer.append(end) : new PrintBuffer(start).append(maybeBuffer).append(end) : EMPTY;
}
function hasMultilineItems(maybeArray) {
  var _maybeArray$some;
  return (_maybeArray$some = maybeArray === null || maybeArray === undefined ? undefined : maybeArray.some((result) => result.newlines !== 0)) !== null && _maybeArray$some !== undefined ? _maybeArray$some : false;
}
function wrappedLineAndArgs(prefix, args) {
  if (args == null || args.length === 0) {
    return prefix;
  }
  return join([
    prefix,
    prefix.length + joinedLength(args, ", ") + 2 > MAX_LINE_LENGTH ? wrap(`(
`, join(args, `
`).indent(), `
)`) : wrap("(", join(args, ", "), ")")
  ]);
}

// zveltio-extensions/node_modules/graphql/utilities/valueFromASTUntyped.mjs
function valueFromASTUntyped(valueNode, variables) {
  switch (valueNode.kind) {
    case Kind.NULL:
      return null;
    case Kind.INT:
      return parseInt(valueNode.value, 10);
    case Kind.FLOAT:
      return parseFloat(valueNode.value);
    case Kind.STRING:
    case Kind.ENUM:
    case Kind.BOOLEAN:
      return valueNode.value;
    case Kind.LIST:
      return valueNode.values.map((node) => valueFromASTUntyped(node, variables));
    case Kind.OBJECT:
      return keyValMap(valueNode.fields, (field) => field.name.value, (field) => valueFromASTUntyped(field.value, variables));
    case Kind.VARIABLE:
      return variables === null || variables === undefined ? undefined : variables[valueNode.name.value];
  }
}

// zveltio-extensions/node_modules/graphql/type/assertName.mjs
function assertName(name) {
  name != null || devAssert(false, "Must provide name.");
  typeof name === "string" || devAssert(false, "Expected name to be a string.");
  if (name.length === 0) {
    throw new GraphQLError("Expected name to be a non-empty string.");
  }
  for (let i = 1;i < name.length; ++i) {
    if (!isNameContinue(name.charCodeAt(i))) {
      throw new GraphQLError(`Names must only contain [_a-zA-Z0-9] but "${name}" does not.`);
    }
  }
  if (!isNameStart(name.charCodeAt(0))) {
    throw new GraphQLError(`Names must start with [_a-zA-Z] but "${name}" does not.`);
  }
  return name;
}
function assertEnumValueName(name) {
  if (name === "true" || name === "false" || name === "null") {
    throw new GraphQLError(`Enum values cannot be named: ${name}`);
  }
  return assertName(name);
}

// zveltio-extensions/node_modules/graphql/type/definition.mjs
function isType(type) {
  return isScalarType(type) || isObjectType(type) || isInterfaceType(type) || isUnionType(type) || isEnumType(type) || isInputObjectType(type) || isListType(type) || isNonNullType(type);
}
function isScalarType(type) {
  return instanceOf(type, GraphQLScalarType);
}
function isObjectType(type) {
  return instanceOf(type, GraphQLObjectType);
}
function isInterfaceType(type) {
  return instanceOf(type, GraphQLInterfaceType);
}
function isUnionType(type) {
  return instanceOf(type, GraphQLUnionType);
}
function isEnumType(type) {
  return instanceOf(type, GraphQLEnumType);
}
function isInputObjectType(type) {
  return instanceOf(type, GraphQLInputObjectType);
}
function isListType(type) {
  return instanceOf(type, GraphQLList);
}
function isNonNullType(type) {
  return instanceOf(type, GraphQLNonNull);
}
function isInputType(type) {
  return isScalarType(type) || isEnumType(type) || isInputObjectType(type) || isWrappingType(type) && isInputType(type.ofType);
}
function isOutputType(type) {
  return isScalarType(type) || isObjectType(type) || isInterfaceType(type) || isUnionType(type) || isEnumType(type) || isWrappingType(type) && isOutputType(type.ofType);
}
function isLeafType(type) {
  return isScalarType(type) || isEnumType(type);
}
function isCompositeType(type) {
  return isObjectType(type) || isInterfaceType(type) || isUnionType(type);
}
function isAbstractType(type) {
  return isInterfaceType(type) || isUnionType(type);
}
class GraphQLList {
  constructor(ofType) {
    isType(ofType) || devAssert(false, `Expected ${inspect(ofType)} to be a GraphQL type.`);
    this.ofType = ofType;
  }
  get [Symbol.toStringTag]() {
    return "GraphQLList";
  }
  toString() {
    return "[" + String(this.ofType) + "]";
  }
  toJSON() {
    return this.toString();
  }
}

class GraphQLNonNull {
  constructor(ofType) {
    isNullableType(ofType) || devAssert(false, `Expected ${inspect(ofType)} to be a GraphQL nullable type.`);
    this.ofType = ofType;
  }
  get [Symbol.toStringTag]() {
    return "GraphQLNonNull";
  }
  toString() {
    return String(this.ofType) + "!";
  }
  toJSON() {
    return this.toString();
  }
}
function isWrappingType(type) {
  return isListType(type) || isNonNullType(type);
}
function isNullableType(type) {
  return isType(type) && !isNonNullType(type);
}
function getNullableType(type) {
  if (type) {
    return isNonNullType(type) ? type.ofType : type;
  }
}
function isNamedType(type) {
  return isScalarType(type) || isObjectType(type) || isInterfaceType(type) || isUnionType(type) || isEnumType(type) || isInputObjectType(type);
}
function getNamedType(type) {
  if (type) {
    let unwrappedType = type;
    while (isWrappingType(unwrappedType)) {
      unwrappedType = unwrappedType.ofType;
    }
    return unwrappedType;
  }
}
function resolveReadonlyArrayThunk(thunk) {
  return typeof thunk === "function" ? thunk() : thunk;
}
function resolveObjMapThunk(thunk) {
  return typeof thunk === "function" ? thunk() : thunk;
}

class GraphQLScalarType {
  constructor(config) {
    var _config$parseValue, _config$serialize, _config$parseLiteral, _config$extensionASTN;
    const parseValue = (_config$parseValue = config.parseValue) !== null && _config$parseValue !== undefined ? _config$parseValue : identityFunc;
    this.name = assertName(config.name);
    this.description = config.description;
    this.specifiedByURL = config.specifiedByURL;
    this.serialize = (_config$serialize = config.serialize) !== null && _config$serialize !== undefined ? _config$serialize : identityFunc;
    this.parseValue = parseValue;
    this.parseLiteral = (_config$parseLiteral = config.parseLiteral) !== null && _config$parseLiteral !== undefined ? _config$parseLiteral : (node, variables) => parseValue(valueFromASTUntyped(node, variables));
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN = config.extensionASTNodes) !== null && _config$extensionASTN !== undefined ? _config$extensionASTN : [];
    config.specifiedByURL == null || typeof config.specifiedByURL === "string" || devAssert(false, `${this.name} must provide "specifiedByURL" as a string, ` + `but got: ${inspect(config.specifiedByURL)}.`);
    config.serialize == null || typeof config.serialize === "function" || devAssert(false, `${this.name} must provide "serialize" function. If this custom Scalar is also used as an input type, ensure "parseValue" and "parseLiteral" functions are also provided.`);
    if (config.parseLiteral) {
      typeof config.parseValue === "function" && typeof config.parseLiteral === "function" || devAssert(false, `${this.name} must provide both "parseValue" and "parseLiteral" functions.`);
    }
  }
  get [Symbol.toStringTag]() {
    return "GraphQLScalarType";
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      specifiedByURL: this.specifiedByURL,
      serialize: this.serialize,
      parseValue: this.parseValue,
      parseLiteral: this.parseLiteral,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}

class GraphQLObjectType {
  constructor(config) {
    var _config$extensionASTN2;
    this.name = assertName(config.name);
    this.description = config.description;
    this.isTypeOf = config.isTypeOf;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN2 = config.extensionASTNodes) !== null && _config$extensionASTN2 !== undefined ? _config$extensionASTN2 : [];
    this._fields = () => defineFieldMap(config);
    this._interfaces = () => defineInterfaces(config);
    config.isTypeOf == null || typeof config.isTypeOf === "function" || devAssert(false, `${this.name} must provide "isTypeOf" as a function, ` + `but got: ${inspect(config.isTypeOf)}.`);
  }
  get [Symbol.toStringTag]() {
    return "GraphQLObjectType";
  }
  getFields() {
    if (typeof this._fields === "function") {
      this._fields = this._fields();
    }
    return this._fields;
  }
  getInterfaces() {
    if (typeof this._interfaces === "function") {
      this._interfaces = this._interfaces();
    }
    return this._interfaces;
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      interfaces: this.getInterfaces(),
      fields: fieldsToFieldsConfig(this.getFields()),
      isTypeOf: this.isTypeOf,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
function defineInterfaces(config) {
  var _config$interfaces;
  const interfaces = resolveReadonlyArrayThunk((_config$interfaces = config.interfaces) !== null && _config$interfaces !== undefined ? _config$interfaces : []);
  Array.isArray(interfaces) || devAssert(false, `${config.name} interfaces must be an Array or a function which returns an Array.`);
  return interfaces;
}
function defineFieldMap(config) {
  const fieldMap = resolveObjMapThunk(config.fields);
  isPlainObj(fieldMap) || devAssert(false, `${config.name} fields must be an object with field names as keys or a function which returns such an object.`);
  return mapValue(fieldMap, (fieldConfig, fieldName) => {
    var _fieldConfig$args;
    isPlainObj(fieldConfig) || devAssert(false, `${config.name}.${fieldName} field config must be an object.`);
    fieldConfig.resolve == null || typeof fieldConfig.resolve === "function" || devAssert(false, `${config.name}.${fieldName} field resolver must be a function if ` + `provided, but got: ${inspect(fieldConfig.resolve)}.`);
    const argsConfig = (_fieldConfig$args = fieldConfig.args) !== null && _fieldConfig$args !== undefined ? _fieldConfig$args : {};
    isPlainObj(argsConfig) || devAssert(false, `${config.name}.${fieldName} args must be an object with argument names as keys.`);
    return {
      name: assertName(fieldName),
      description: fieldConfig.description,
      type: fieldConfig.type,
      args: defineArguments(argsConfig),
      resolve: fieldConfig.resolve,
      subscribe: fieldConfig.subscribe,
      deprecationReason: fieldConfig.deprecationReason,
      extensions: toObjMap(fieldConfig.extensions),
      astNode: fieldConfig.astNode
    };
  });
}
function defineArguments(config) {
  return Object.entries(config).map(([argName, argConfig]) => ({
    name: assertName(argName),
    description: argConfig.description,
    type: argConfig.type,
    defaultValue: argConfig.defaultValue,
    deprecationReason: argConfig.deprecationReason,
    extensions: toObjMap(argConfig.extensions),
    astNode: argConfig.astNode
  }));
}
function isPlainObj(obj) {
  return isObjectLike(obj) && !Array.isArray(obj);
}
function fieldsToFieldsConfig(fields) {
  return mapValue(fields, (field) => ({
    description: field.description,
    type: field.type,
    args: argsToArgsConfig(field.args),
    resolve: field.resolve,
    subscribe: field.subscribe,
    deprecationReason: field.deprecationReason,
    extensions: field.extensions,
    astNode: field.astNode
  }));
}
function argsToArgsConfig(args) {
  return keyValMap(args, (arg) => arg.name, (arg) => ({
    description: arg.description,
    type: arg.type,
    defaultValue: arg.defaultValue,
    deprecationReason: arg.deprecationReason,
    extensions: arg.extensions,
    astNode: arg.astNode
  }));
}
function isRequiredArgument(arg) {
  return isNonNullType(arg.type) && arg.defaultValue === undefined;
}

class GraphQLInterfaceType {
  constructor(config) {
    var _config$extensionASTN3;
    this.name = assertName(config.name);
    this.description = config.description;
    this.resolveType = config.resolveType;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN3 = config.extensionASTNodes) !== null && _config$extensionASTN3 !== undefined ? _config$extensionASTN3 : [];
    this._fields = defineFieldMap.bind(undefined, config);
    this._interfaces = defineInterfaces.bind(undefined, config);
    config.resolveType == null || typeof config.resolveType === "function" || devAssert(false, `${this.name} must provide "resolveType" as a function, ` + `but got: ${inspect(config.resolveType)}.`);
  }
  get [Symbol.toStringTag]() {
    return "GraphQLInterfaceType";
  }
  getFields() {
    if (typeof this._fields === "function") {
      this._fields = this._fields();
    }
    return this._fields;
  }
  getInterfaces() {
    if (typeof this._interfaces === "function") {
      this._interfaces = this._interfaces();
    }
    return this._interfaces;
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      interfaces: this.getInterfaces(),
      fields: fieldsToFieldsConfig(this.getFields()),
      resolveType: this.resolveType,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}

class GraphQLUnionType {
  constructor(config) {
    var _config$extensionASTN4;
    this.name = assertName(config.name);
    this.description = config.description;
    this.resolveType = config.resolveType;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN4 = config.extensionASTNodes) !== null && _config$extensionASTN4 !== undefined ? _config$extensionASTN4 : [];
    this._types = defineTypes.bind(undefined, config);
    config.resolveType == null || typeof config.resolveType === "function" || devAssert(false, `${this.name} must provide "resolveType" as a function, ` + `but got: ${inspect(config.resolveType)}.`);
  }
  get [Symbol.toStringTag]() {
    return "GraphQLUnionType";
  }
  getTypes() {
    if (typeof this._types === "function") {
      this._types = this._types();
    }
    return this._types;
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      types: this.getTypes(),
      resolveType: this.resolveType,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
function defineTypes(config) {
  const types = resolveReadonlyArrayThunk(config.types);
  Array.isArray(types) || devAssert(false, `Must provide Array of types or a function which returns such an array for Union ${config.name}.`);
  return types;
}

class GraphQLEnumType {
  constructor(config) {
    var _config$extensionASTN5;
    this.name = assertName(config.name);
    this.description = config.description;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN5 = config.extensionASTNodes) !== null && _config$extensionASTN5 !== undefined ? _config$extensionASTN5 : [];
    this._values = typeof config.values === "function" ? config.values : defineEnumValues(this.name, config.values);
    this._valueLookup = null;
    this._nameLookup = null;
  }
  get [Symbol.toStringTag]() {
    return "GraphQLEnumType";
  }
  getValues() {
    if (typeof this._values === "function") {
      this._values = defineEnumValues(this.name, this._values());
    }
    return this._values;
  }
  getValue(name) {
    if (this._nameLookup === null) {
      this._nameLookup = keyMap(this.getValues(), (value) => value.name);
    }
    return this._nameLookup[name];
  }
  serialize(outputValue) {
    if (this._valueLookup === null) {
      this._valueLookup = new Map(this.getValues().map((enumValue) => [enumValue.value, enumValue]));
    }
    const enumValue = this._valueLookup.get(outputValue);
    if (enumValue === undefined) {
      throw new GraphQLError(`Enum "${this.name}" cannot represent value: ${inspect(outputValue)}`);
    }
    return enumValue.name;
  }
  parseValue(inputValue, hideSuggestions) {
    if (typeof inputValue !== "string") {
      const valueStr = inspect(inputValue);
      throw new GraphQLError(`Enum "${this.name}" cannot represent non-string value: ${valueStr}.` + (hideSuggestions ? "" : didYouMeanEnumValue(this, valueStr)));
    }
    const enumValue = this.getValue(inputValue);
    if (enumValue == null) {
      throw new GraphQLError(`Value "${inputValue}" does not exist in "${this.name}" enum.` + (hideSuggestions ? "" : didYouMeanEnumValue(this, inputValue)));
    }
    return enumValue.value;
  }
  parseLiteral(valueNode, _variables, hideSuggestions) {
    if (valueNode.kind !== Kind.ENUM) {
      const valueStr = printForError(valueNode);
      throw new GraphQLError(`Enum "${this.name}" cannot represent non-enum value: ${valueStr}.` + (hideSuggestions ? "" : didYouMeanEnumValue(this, valueStr)), {
        nodes: valueNode
      });
    }
    const enumValue = this.getValue(valueNode.value);
    if (enumValue == null) {
      const valueStr = printForError(valueNode);
      throw new GraphQLError(`Value "${valueStr}" does not exist in "${this.name}" enum.` + (hideSuggestions ? "" : didYouMeanEnumValue(this, valueStr)), {
        nodes: valueNode
      });
    }
    return enumValue.value;
  }
  toConfig() {
    const values = keyValMap(this.getValues(), (value) => value.name, (value) => ({
      description: value.description,
      value: value.value,
      deprecationReason: value.deprecationReason,
      extensions: value.extensions,
      astNode: value.astNode
    }));
    return {
      name: this.name,
      description: this.description,
      values,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
function didYouMeanEnumValue(enumType, unknownValueStr) {
  const allNames = enumType.getValues().map((value) => value.name);
  const suggestedValues = suggestionList(unknownValueStr, allNames);
  return didYouMean("the enum value", suggestedValues);
}
function defineEnumValues(typeName, valueMap) {
  isPlainObj(valueMap) || devAssert(false, `${typeName} values must be an object with value names as keys.`);
  return Object.entries(valueMap).map(([valueName, valueConfig]) => {
    isPlainObj(valueConfig) || devAssert(false, `${typeName}.${valueName} must refer to an object with a "value" key ` + `representing an internal value but got: ${inspect(valueConfig)}.`);
    return {
      name: assertEnumValueName(valueName),
      description: valueConfig.description,
      value: valueConfig.value !== undefined ? valueConfig.value : valueName,
      deprecationReason: valueConfig.deprecationReason,
      extensions: toObjMap(valueConfig.extensions),
      astNode: valueConfig.astNode
    };
  });
}

class GraphQLInputObjectType {
  constructor(config) {
    var _config$extensionASTN6, _config$isOneOf;
    this.name = assertName(config.name);
    this.description = config.description;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN6 = config.extensionASTNodes) !== null && _config$extensionASTN6 !== undefined ? _config$extensionASTN6 : [];
    this.isOneOf = (_config$isOneOf = config.isOneOf) !== null && _config$isOneOf !== undefined ? _config$isOneOf : false;
    this._fields = defineInputFieldMap.bind(undefined, config);
  }
  get [Symbol.toStringTag]() {
    return "GraphQLInputObjectType";
  }
  getFields() {
    if (typeof this._fields === "function") {
      this._fields = this._fields();
    }
    return this._fields;
  }
  toConfig() {
    const fields = mapValue(this.getFields(), (field) => ({
      description: field.description,
      type: field.type,
      defaultValue: field.defaultValue,
      deprecationReason: field.deprecationReason,
      extensions: field.extensions,
      astNode: field.astNode
    }));
    return {
      name: this.name,
      description: this.description,
      fields,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes,
      isOneOf: this.isOneOf
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
function defineInputFieldMap(config) {
  const fieldMap = resolveObjMapThunk(config.fields);
  isPlainObj(fieldMap) || devAssert(false, `${config.name} fields must be an object with field names as keys or a function which returns such an object.`);
  return mapValue(fieldMap, (fieldConfig, fieldName) => {
    !("resolve" in fieldConfig) || devAssert(false, `${config.name}.${fieldName} field has a resolve property, but Input Types cannot define resolvers.`);
    return {
      name: assertName(fieldName),
      description: fieldConfig.description,
      type: fieldConfig.type,
      defaultValue: fieldConfig.defaultValue,
      deprecationReason: fieldConfig.deprecationReason,
      extensions: toObjMap(fieldConfig.extensions),
      astNode: fieldConfig.astNode
    };
  });
}
function isRequiredInputField(field) {
  return isNonNullType(field.type) && field.defaultValue === undefined;
}

// zveltio-extensions/node_modules/graphql/language/directiveLocation.mjs
var DirectiveLocation;
(function(DirectiveLocation) {
  DirectiveLocation["QUERY"] = "QUERY";
  DirectiveLocation["MUTATION"] = "MUTATION";
  DirectiveLocation["SUBSCRIPTION"] = "SUBSCRIPTION";
  DirectiveLocation["FIELD"] = "FIELD";
  DirectiveLocation["FRAGMENT_DEFINITION"] = "FRAGMENT_DEFINITION";
  DirectiveLocation["FRAGMENT_SPREAD"] = "FRAGMENT_SPREAD";
  DirectiveLocation["INLINE_FRAGMENT"] = "INLINE_FRAGMENT";
  DirectiveLocation["VARIABLE_DEFINITION"] = "VARIABLE_DEFINITION";
  DirectiveLocation["SCHEMA"] = "SCHEMA";
  DirectiveLocation["SCALAR"] = "SCALAR";
  DirectiveLocation["OBJECT"] = "OBJECT";
  DirectiveLocation["FIELD_DEFINITION"] = "FIELD_DEFINITION";
  DirectiveLocation["ARGUMENT_DEFINITION"] = "ARGUMENT_DEFINITION";
  DirectiveLocation["INTERFACE"] = "INTERFACE";
  DirectiveLocation["UNION"] = "UNION";
  DirectiveLocation["ENUM"] = "ENUM";
  DirectiveLocation["ENUM_VALUE"] = "ENUM_VALUE";
  DirectiveLocation["INPUT_OBJECT"] = "INPUT_OBJECT";
  DirectiveLocation["INPUT_FIELD_DEFINITION"] = "INPUT_FIELD_DEFINITION";
  DirectiveLocation["DIRECTIVE_DEFINITION"] = "DIRECTIVE_DEFINITION";
})(DirectiveLocation || (DirectiveLocation = {}));

// zveltio-extensions/node_modules/graphql/type/scalars.mjs
var GRAPHQL_MAX_INT = 2147483647;
var GRAPHQL_MIN_INT = -2147483648;
var GraphQLInt = new GraphQLScalarType({
  name: "Int",
  description: "The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "boolean") {
      return coercedValue ? 1 : 0;
    }
    let num = coercedValue;
    if (typeof coercedValue === "string" && coercedValue !== "") {
      num = Number(coercedValue);
    }
    if (typeof num !== "number" || !Number.isInteger(num)) {
      throw new GraphQLError(`Int cannot represent non-integer value: ${inspect(coercedValue)}`);
    }
    if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
      throw new GraphQLError("Int cannot represent non 32-bit signed integer value: " + inspect(coercedValue));
    }
    return num;
  },
  parseValue(inputValue) {
    if (typeof inputValue !== "number" || !Number.isInteger(inputValue)) {
      throw new GraphQLError(`Int cannot represent non-integer value: ${inspect(inputValue)}`);
    }
    if (inputValue > GRAPHQL_MAX_INT || inputValue < GRAPHQL_MIN_INT) {
      throw new GraphQLError(`Int cannot represent non 32-bit signed integer value: ${inputValue}`);
    }
    return inputValue;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.INT) {
      throw new GraphQLError(`Int cannot represent non-integer value: ${printForError(valueNode)}`, {
        nodes: valueNode
      });
    }
    const num = parseInt(valueNode.value, 10);
    if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
      throw new GraphQLError(`Int cannot represent non 32-bit signed integer value: ${valueNode.value}`, {
        nodes: valueNode
      });
    }
    return num;
  }
});
var GraphQLFloat = new GraphQLScalarType({
  name: "Float",
  description: "The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "boolean") {
      return coercedValue ? 1 : 0;
    }
    let num = coercedValue;
    if (typeof coercedValue === "string" && coercedValue !== "") {
      num = Number(coercedValue);
    }
    if (typeof num !== "number" || !Number.isFinite(num)) {
      throw new GraphQLError(`Float cannot represent non numeric value: ${inspect(coercedValue)}`);
    }
    return num;
  },
  parseValue(inputValue) {
    if (typeof inputValue !== "number" || !Number.isFinite(inputValue)) {
      throw new GraphQLError(`Float cannot represent non numeric value: ${inspect(inputValue)}`);
    }
    return inputValue;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.FLOAT && valueNode.kind !== Kind.INT) {
      throw new GraphQLError(`Float cannot represent non numeric value: ${printForError(valueNode)}`, valueNode);
    }
    return parseFloat(valueNode.value);
  }
});
var GraphQLString = new GraphQLScalarType({
  name: "String",
  description: "The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "string") {
      return coercedValue;
    }
    if (typeof coercedValue === "boolean") {
      return coercedValue ? "true" : "false";
    }
    if (typeof coercedValue === "number" && Number.isFinite(coercedValue)) {
      return coercedValue.toString();
    }
    throw new GraphQLError(`String cannot represent value: ${inspect(outputValue)}`);
  },
  parseValue(inputValue) {
    if (typeof inputValue !== "string") {
      throw new GraphQLError(`String cannot represent a non string value: ${inspect(inputValue)}`);
    }
    return inputValue;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.STRING) {
      throw new GraphQLError(`String cannot represent a non string value: ${printForError(valueNode)}`, {
        nodes: valueNode
      });
    }
    return valueNode.value;
  }
});
var GraphQLBoolean = new GraphQLScalarType({
  name: "Boolean",
  description: "The `Boolean` scalar type represents `true` or `false`.",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "boolean") {
      return coercedValue;
    }
    if (Number.isFinite(coercedValue)) {
      return coercedValue !== 0;
    }
    throw new GraphQLError(`Boolean cannot represent a non boolean value: ${inspect(coercedValue)}`);
  },
  parseValue(inputValue) {
    if (typeof inputValue !== "boolean") {
      throw new GraphQLError(`Boolean cannot represent a non boolean value: ${inspect(inputValue)}`);
    }
    return inputValue;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.BOOLEAN) {
      throw new GraphQLError(`Boolean cannot represent a non boolean value: ${printForError(valueNode)}`, {
        nodes: valueNode
      });
    }
    return valueNode.value;
  }
});
var GraphQLID = new GraphQLScalarType({
  name: "ID",
  description: 'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "string") {
      return coercedValue;
    }
    if (Number.isInteger(coercedValue)) {
      return String(coercedValue);
    }
    throw new GraphQLError(`ID cannot represent value: ${inspect(outputValue)}`);
  },
  parseValue(inputValue) {
    if (typeof inputValue === "string") {
      return inputValue;
    }
    if (typeof inputValue === "number" && Number.isInteger(inputValue)) {
      return inputValue.toString();
    }
    throw new GraphQLError(`ID cannot represent value: ${inspect(inputValue)}`);
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.STRING && valueNode.kind !== Kind.INT) {
      throw new GraphQLError("ID cannot represent a non-string and non-integer value: " + printForError(valueNode), {
        nodes: valueNode
      });
    }
    return valueNode.value;
  }
});
var specifiedScalarTypes = Object.freeze([
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID
]);
function serializeObject(outputValue) {
  if (isObjectLike(outputValue)) {
    if (typeof outputValue.valueOf === "function") {
      const valueOfResult = outputValue.valueOf();
      if (!isObjectLike(valueOfResult)) {
        return valueOfResult;
      }
    }
    if (typeof outputValue.toJSON === "function") {
      return outputValue.toJSON();
    }
  }
  return outputValue;
}

// zveltio-extensions/node_modules/graphql/type/directives.mjs
function isDirective(directive) {
  return instanceOf(directive, GraphQLDirective);
}
class GraphQLDirective {
  constructor(config) {
    var _config$isRepeatable, _config$extensionASTN, _config$args;
    this.name = assertName(config.name);
    this.description = config.description;
    this.locations = config.locations;
    this.isRepeatable = (_config$isRepeatable = config.isRepeatable) !== null && _config$isRepeatable !== undefined ? _config$isRepeatable : false;
    this.deprecationReason = config.deprecationReason;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN = config.extensionASTNodes) !== null && _config$extensionASTN !== undefined ? _config$extensionASTN : [];
    Array.isArray(config.locations) || devAssert(false, `@${config.name} locations must be an Array.`);
    const args = (_config$args = config.args) !== null && _config$args !== undefined ? _config$args : {};
    isObjectLike(args) && !Array.isArray(args) || devAssert(false, `@${config.name} args must be an object with argument names as keys.`);
    this.args = defineArguments(args);
  }
  get [Symbol.toStringTag]() {
    return "GraphQLDirective";
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      locations: this.locations,
      args: argsToArgsConfig(this.args),
      isRepeatable: this.isRepeatable,
      deprecationReason: this.deprecationReason,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return "@" + this.name;
  }
  toJSON() {
    return this.toString();
  }
}
var GraphQLIncludeDirective = new GraphQLDirective({
  name: "include",
  description: "Directs the executor to include this field or fragment only when the `if` argument is true.",
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FRAGMENT_SPREAD,
    DirectiveLocation.INLINE_FRAGMENT
  ],
  args: {
    if: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Included when true."
    }
  }
});
var GraphQLSkipDirective = new GraphQLDirective({
  name: "skip",
  description: "Directs the executor to skip this field or fragment when the `if` argument is true.",
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FRAGMENT_SPREAD,
    DirectiveLocation.INLINE_FRAGMENT
  ],
  args: {
    if: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Skipped when true."
    }
  }
});
var DEFAULT_DEPRECATION_REASON = "No longer supported";
var GraphQLDeprecatedDirective = new GraphQLDirective({
  name: "deprecated",
  description: "Marks an element of a GraphQL schema as no longer supported.",
  locations: [
    DirectiveLocation.FIELD_DEFINITION,
    DirectiveLocation.ARGUMENT_DEFINITION,
    DirectiveLocation.INPUT_FIELD_DEFINITION,
    DirectiveLocation.ENUM_VALUE,
    DirectiveLocation.DIRECTIVE_DEFINITION
  ],
  args: {
    reason: {
      type: GraphQLString,
      description: "Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).",
      defaultValue: DEFAULT_DEPRECATION_REASON
    }
  }
});
var GraphQLSpecifiedByDirective = new GraphQLDirective({
  name: "specifiedBy",
  description: "Exposes a URL that specifies the behavior of this scalar.",
  locations: [DirectiveLocation.SCALAR],
  args: {
    url: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The URL that specifies the behavior of this scalar."
    }
  }
});
var GraphQLOneOfDirective = new GraphQLDirective({
  name: "oneOf",
  description: "Indicates exactly one field must be supplied and this field must not be `null`.",
  locations: [DirectiveLocation.INPUT_OBJECT],
  args: {}
});
var specifiedDirectives = Object.freeze([
  GraphQLIncludeDirective,
  GraphQLSkipDirective,
  GraphQLDeprecatedDirective,
  GraphQLSpecifiedByDirective,
  GraphQLOneOfDirective
]);

// zveltio-extensions/node_modules/graphql/jsutils/invariant.mjs
function invariant(condition, message) {
  const booleanCondition = Boolean(condition);
  if (!booleanCondition) {
    throw new Error(message != null ? message : "Unexpected invariant triggered.");
  }
}

// zveltio-extensions/node_modules/graphql/jsutils/isIterableObject.mjs
function isIterableObject(maybeIterable) {
  return typeof maybeIterable === "object" && typeof (maybeIterable === null || maybeIterable === undefined ? undefined : maybeIterable[Symbol.iterator]) === "function";
}

// zveltio-extensions/node_modules/graphql/utilities/astFromValue.mjs
function astFromValue(value, type) {
  if (isNonNullType(type)) {
    const astValue = astFromValue(value, type.ofType);
    if ((astValue === null || astValue === undefined ? undefined : astValue.kind) === Kind.NULL) {
      return null;
    }
    return astValue;
  }
  if (value === null) {
    return {
      kind: Kind.NULL
    };
  }
  if (value === undefined) {
    return null;
  }
  if (isListType(type)) {
    const itemType = type.ofType;
    if (isIterableObject(value)) {
      const valuesNodes = [];
      for (const item of value) {
        const itemNode = astFromValue(item, itemType);
        if (itemNode != null) {
          valuesNodes.push(itemNode);
        }
      }
      return {
        kind: Kind.LIST,
        values: valuesNodes
      };
    }
    return astFromValue(value, itemType);
  }
  if (isInputObjectType(type)) {
    if (!isObjectLike(value)) {
      return null;
    }
    const fieldNodes = [];
    for (const field of Object.values(type.getFields())) {
      const fieldValue = astFromValue(value[field.name], field.type);
      if (fieldValue) {
        fieldNodes.push({
          kind: Kind.OBJECT_FIELD,
          name: {
            kind: Kind.NAME,
            value: field.name
          },
          value: fieldValue
        });
      }
    }
    return {
      kind: Kind.OBJECT,
      fields: fieldNodes
    };
  }
  if (isLeafType(type)) {
    const serialized = type.serialize(value);
    if (serialized == null) {
      return null;
    }
    if (typeof serialized === "boolean") {
      return {
        kind: Kind.BOOLEAN,
        value: serialized
      };
    }
    if (typeof serialized === "number" && Number.isFinite(serialized)) {
      const stringNum = String(serialized);
      return integerStringRegExp.test(stringNum) ? {
        kind: Kind.INT,
        value: stringNum
      } : {
        kind: Kind.FLOAT,
        value: stringNum
      };
    }
    if (typeof serialized === "string") {
      if (isEnumType(type)) {
        return {
          kind: Kind.ENUM,
          value: serialized
        };
      }
      if (type === GraphQLID && integerStringRegExp.test(serialized)) {
        return {
          kind: Kind.INT,
          value: serialized
        };
      }
      return {
        kind: Kind.STRING,
        value: serialized
      };
    }
    throw new TypeError(`Cannot convert value to AST: ${inspect(serialized)}.`);
  }
  invariant(false, "Unexpected input type: " + inspect(type));
}
var integerStringRegExp = /^-?(?:0|[1-9][0-9]*)$/;

// zveltio-extensions/node_modules/graphql/type/introspection.mjs
var __Schema = new GraphQLObjectType({
  name: "__Schema",
  description: "A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.",
  fields: () => ({
    description: {
      type: GraphQLString,
      resolve: (schema) => schema.description
    },
    types: {
      description: "A list of all types supported by this server.",
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(__Type))),
      resolve(schema) {
        return Object.values(schema.getTypeMap());
      }
    },
    queryType: {
      description: "The type that query operations will be rooted at.",
      type: new GraphQLNonNull(__Type),
      resolve: (schema) => schema.getQueryType()
    },
    mutationType: {
      description: "If this server supports mutation, the type that mutation operations will be rooted at.",
      type: __Type,
      resolve: (schema) => schema.getMutationType()
    },
    subscriptionType: {
      description: "If this server support subscription, the type that subscription operations will be rooted at.",
      type: __Type,
      resolve: (schema) => schema.getSubscriptionType()
    },
    directives: {
      description: "A list of all directives supported by this server.",
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(__Directive))),
      args: {
        includeDeprecated: {
          type: new GraphQLNonNull(GraphQLBoolean),
          defaultValue: false
        }
      },
      resolve: (schema, { includeDeprecated }) => includeDeprecated ? schema.getDirectives() : schema.getDirectives().filter((directive) => directive.deprecationReason == null)
    }
  })
});
var __Directive = new GraphQLObjectType({
  name: "__Directive",
  description: `A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.

In some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.`,
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (directive) => directive.name
    },
    description: {
      type: GraphQLString,
      resolve: (directive) => directive.description
    },
    isRepeatable: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (directive) => directive.isRepeatable
    },
    locations: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(__DirectiveLocation))),
      resolve: (directive) => directive.locations
    },
    args: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(__InputValue))),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(field, { includeDeprecated }) {
        return includeDeprecated ? field.args : field.args.filter((arg) => arg.deprecationReason == null);
      }
    },
    isDeprecated: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (directive) => directive.deprecationReason != null
    },
    deprecationReason: {
      type: GraphQLString,
      resolve: (directive) => directive.deprecationReason
    }
  })
});
var __DirectiveLocation = new GraphQLEnumType({
  name: "__DirectiveLocation",
  description: "A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.",
  values: {
    QUERY: {
      value: DirectiveLocation.QUERY,
      description: "Location adjacent to a query operation."
    },
    MUTATION: {
      value: DirectiveLocation.MUTATION,
      description: "Location adjacent to a mutation operation."
    },
    SUBSCRIPTION: {
      value: DirectiveLocation.SUBSCRIPTION,
      description: "Location adjacent to a subscription operation."
    },
    FIELD: {
      value: DirectiveLocation.FIELD,
      description: "Location adjacent to a field."
    },
    FRAGMENT_DEFINITION: {
      value: DirectiveLocation.FRAGMENT_DEFINITION,
      description: "Location adjacent to a fragment definition."
    },
    FRAGMENT_SPREAD: {
      value: DirectiveLocation.FRAGMENT_SPREAD,
      description: "Location adjacent to a fragment spread."
    },
    INLINE_FRAGMENT: {
      value: DirectiveLocation.INLINE_FRAGMENT,
      description: "Location adjacent to an inline fragment."
    },
    VARIABLE_DEFINITION: {
      value: DirectiveLocation.VARIABLE_DEFINITION,
      description: "Location adjacent to a variable definition."
    },
    SCHEMA: {
      value: DirectiveLocation.SCHEMA,
      description: "Location adjacent to a schema definition."
    },
    SCALAR: {
      value: DirectiveLocation.SCALAR,
      description: "Location adjacent to a scalar definition."
    },
    OBJECT: {
      value: DirectiveLocation.OBJECT,
      description: "Location adjacent to an object type definition."
    },
    FIELD_DEFINITION: {
      value: DirectiveLocation.FIELD_DEFINITION,
      description: "Location adjacent to a field definition."
    },
    ARGUMENT_DEFINITION: {
      value: DirectiveLocation.ARGUMENT_DEFINITION,
      description: "Location adjacent to an argument definition."
    },
    INTERFACE: {
      value: DirectiveLocation.INTERFACE,
      description: "Location adjacent to an interface definition."
    },
    UNION: {
      value: DirectiveLocation.UNION,
      description: "Location adjacent to a union definition."
    },
    ENUM: {
      value: DirectiveLocation.ENUM,
      description: "Location adjacent to an enum definition."
    },
    ENUM_VALUE: {
      value: DirectiveLocation.ENUM_VALUE,
      description: "Location adjacent to an enum value definition."
    },
    INPUT_OBJECT: {
      value: DirectiveLocation.INPUT_OBJECT,
      description: "Location adjacent to an input object type definition."
    },
    INPUT_FIELD_DEFINITION: {
      value: DirectiveLocation.INPUT_FIELD_DEFINITION,
      description: "Location adjacent to an input object field definition."
    },
    DIRECTIVE_DEFINITION: {
      value: DirectiveLocation.DIRECTIVE_DEFINITION,
      description: "Location adjacent to a directive definition."
    }
  }
});
var __Type = new GraphQLObjectType({
  name: "__Type",
  description: "The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.\n\nDepending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.",
  fields: () => ({
    kind: {
      type: new GraphQLNonNull(__TypeKind),
      resolve(type) {
        if (isScalarType(type)) {
          return TypeKind.SCALAR;
        }
        if (isObjectType(type)) {
          return TypeKind.OBJECT;
        }
        if (isInterfaceType(type)) {
          return TypeKind.INTERFACE;
        }
        if (isUnionType(type)) {
          return TypeKind.UNION;
        }
        if (isEnumType(type)) {
          return TypeKind.ENUM;
        }
        if (isInputObjectType(type)) {
          return TypeKind.INPUT_OBJECT;
        }
        if (isListType(type)) {
          return TypeKind.LIST;
        }
        if (isNonNullType(type)) {
          return TypeKind.NON_NULL;
        }
        invariant(false, `Unexpected type: "${inspect(type)}".`);
      }
    },
    name: {
      type: GraphQLString,
      resolve: (type) => ("name" in type) ? type.name : undefined
    },
    description: {
      type: GraphQLString,
      resolve: (type) => ("description" in type) ? type.description : undefined
    },
    specifiedByURL: {
      type: GraphQLString,
      resolve: (obj) => ("specifiedByURL" in obj) ? obj.specifiedByURL : undefined
    },
    fields: {
      type: new GraphQLList(new GraphQLNonNull(__Field)),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(type, { includeDeprecated }) {
        if (isObjectType(type) || isInterfaceType(type)) {
          const fields = Object.values(type.getFields());
          return includeDeprecated ? fields : fields.filter((field) => field.deprecationReason == null);
        }
      }
    },
    interfaces: {
      type: new GraphQLList(new GraphQLNonNull(__Type)),
      resolve(type) {
        if (isObjectType(type) || isInterfaceType(type)) {
          return type.getInterfaces();
        }
      }
    },
    possibleTypes: {
      type: new GraphQLList(new GraphQLNonNull(__Type)),
      resolve(type, _args, _context, { schema }) {
        if (isAbstractType(type)) {
          return schema.getPossibleTypes(type);
        }
      }
    },
    enumValues: {
      type: new GraphQLList(new GraphQLNonNull(__EnumValue)),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(type, { includeDeprecated }) {
        if (isEnumType(type)) {
          const values = type.getValues();
          return includeDeprecated ? values : values.filter((field) => field.deprecationReason == null);
        }
      }
    },
    inputFields: {
      type: new GraphQLList(new GraphQLNonNull(__InputValue)),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(type, { includeDeprecated }) {
        if (isInputObjectType(type)) {
          const values = Object.values(type.getFields());
          return includeDeprecated ? values : values.filter((field) => field.deprecationReason == null);
        }
      }
    },
    ofType: {
      type: __Type,
      resolve: (type) => ("ofType" in type) ? type.ofType : undefined
    },
    isOneOf: {
      type: GraphQLBoolean,
      resolve: (type) => {
        if (isInputObjectType(type)) {
          return type.isOneOf;
        }
      }
    }
  })
});
var __Field = new GraphQLObjectType({
  name: "__Field",
  description: "Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.",
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (field) => field.name
    },
    description: {
      type: GraphQLString,
      resolve: (field) => field.description
    },
    args: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(__InputValue))),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(field, { includeDeprecated }) {
        return includeDeprecated ? field.args : field.args.filter((arg) => arg.deprecationReason == null);
      }
    },
    type: {
      type: new GraphQLNonNull(__Type),
      resolve: (field) => field.type
    },
    isDeprecated: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (field) => field.deprecationReason != null
    },
    deprecationReason: {
      type: GraphQLString,
      resolve: (field) => field.deprecationReason
    }
  })
});
var __InputValue = new GraphQLObjectType({
  name: "__InputValue",
  description: "Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.",
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (inputValue) => inputValue.name
    },
    description: {
      type: GraphQLString,
      resolve: (inputValue) => inputValue.description
    },
    type: {
      type: new GraphQLNonNull(__Type),
      resolve: (inputValue) => inputValue.type
    },
    defaultValue: {
      type: GraphQLString,
      description: "A GraphQL-formatted string representing the default value for this input value.",
      resolve(inputValue) {
        const { type, defaultValue } = inputValue;
        const valueAST = astFromValue(defaultValue, type);
        return valueAST ? print(valueAST) : null;
      }
    },
    isDeprecated: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (field) => field.deprecationReason != null
    },
    deprecationReason: {
      type: GraphQLString,
      resolve: (obj) => obj.deprecationReason
    }
  })
});
var __EnumValue = new GraphQLObjectType({
  name: "__EnumValue",
  description: "One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.",
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (enumValue) => enumValue.name
    },
    description: {
      type: GraphQLString,
      resolve: (enumValue) => enumValue.description
    },
    isDeprecated: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (enumValue) => enumValue.deprecationReason != null
    },
    deprecationReason: {
      type: GraphQLString,
      resolve: (enumValue) => enumValue.deprecationReason
    }
  })
});
var TypeKind;
(function(TypeKind) {
  TypeKind["SCALAR"] = "SCALAR";
  TypeKind["OBJECT"] = "OBJECT";
  TypeKind["INTERFACE"] = "INTERFACE";
  TypeKind["UNION"] = "UNION";
  TypeKind["ENUM"] = "ENUM";
  TypeKind["INPUT_OBJECT"] = "INPUT_OBJECT";
  TypeKind["LIST"] = "LIST";
  TypeKind["NON_NULL"] = "NON_NULL";
})(TypeKind || (TypeKind = {}));
var __TypeKind = new GraphQLEnumType({
  name: "__TypeKind",
  description: "An enum describing what kind of type a given `__Type` is.",
  values: {
    SCALAR: {
      value: TypeKind.SCALAR,
      description: "Indicates this type is a scalar."
    },
    OBJECT: {
      value: TypeKind.OBJECT,
      description: "Indicates this type is an object. `fields` and `interfaces` are valid fields."
    },
    INTERFACE: {
      value: TypeKind.INTERFACE,
      description: "Indicates this type is an interface. `fields`, `interfaces`, and `possibleTypes` are valid fields."
    },
    UNION: {
      value: TypeKind.UNION,
      description: "Indicates this type is a union. `possibleTypes` is a valid field."
    },
    ENUM: {
      value: TypeKind.ENUM,
      description: "Indicates this type is an enum. `enumValues` is a valid field."
    },
    INPUT_OBJECT: {
      value: TypeKind.INPUT_OBJECT,
      description: "Indicates this type is an input object. `inputFields` is a valid field."
    },
    LIST: {
      value: TypeKind.LIST,
      description: "Indicates this type is a list. `ofType` is a valid field."
    },
    NON_NULL: {
      value: TypeKind.NON_NULL,
      description: "Indicates this type is a non-null. `ofType` is a valid field."
    }
  }
});
var SchemaMetaFieldDef = {
  name: "__schema",
  type: new GraphQLNonNull(__Schema),
  description: "Access the current type schema of this server.",
  args: [],
  resolve: (_source, _args, _context, { schema }) => schema,
  deprecationReason: undefined,
  extensions: Object.create(null),
  astNode: undefined
};
var TypeMetaFieldDef = {
  name: "__type",
  type: __Type,
  description: "Request the type information of a single type.",
  args: [
    {
      name: "name",
      description: undefined,
      type: new GraphQLNonNull(GraphQLString),
      defaultValue: undefined,
      deprecationReason: undefined,
      extensions: Object.create(null),
      astNode: undefined
    }
  ],
  resolve: (_source, { name }, _context, { schema }) => schema.getType(name),
  deprecationReason: undefined,
  extensions: Object.create(null),
  astNode: undefined
};
var TypeNameMetaFieldDef = {
  name: "__typename",
  type: new GraphQLNonNull(GraphQLString),
  description: "The name of the current Object type at runtime.",
  args: [],
  resolve: (_source, _args, _context, { parentType }) => parentType.name,
  deprecationReason: undefined,
  extensions: Object.create(null),
  astNode: undefined
};
var introspectionTypes = Object.freeze([
  __Schema,
  __Directive,
  __DirectiveLocation,
  __Type,
  __Field,
  __InputValue,
  __EnumValue,
  __TypeKind
]);
function isIntrospectionType(type) {
  return introspectionTypes.some(({ name }) => type.name === name);
}

// zveltio-extensions/node_modules/graphql/type/schema.mjs
function isSchema(schema) {
  return instanceOf(schema, GraphQLSchema);
}
function assertSchema(schema) {
  if (!isSchema(schema)) {
    throw new Error(`Expected ${inspect(schema)} to be a GraphQL schema.`);
  }
  return schema;
}

class GraphQLSchema {
  constructor(config) {
    var _config$extensionASTN, _config$directives;
    this.__validationErrors = config.assumeValid === true ? [] : undefined;
    isObjectLike(config) || devAssert(false, "Must provide configuration object.");
    !config.types || Array.isArray(config.types) || devAssert(false, `"types" must be Array if provided but got: ${inspect(config.types)}.`);
    !config.directives || Array.isArray(config.directives) || devAssert(false, '"directives" must be Array if provided but got: ' + `${inspect(config.directives)}.`);
    this.description = config.description;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN = config.extensionASTNodes) !== null && _config$extensionASTN !== undefined ? _config$extensionASTN : [];
    this._queryType = config.query;
    this._mutationType = config.mutation;
    this._subscriptionType = config.subscription;
    this._directives = (_config$directives = config.directives) !== null && _config$directives !== undefined ? _config$directives : specifiedDirectives;
    const allReferencedTypes = new Set(config.types);
    if (config.types != null) {
      for (const type of config.types) {
        allReferencedTypes.delete(type);
        collectReferencedTypes(type, allReferencedTypes);
      }
    }
    if (this._queryType != null) {
      collectReferencedTypes(this._queryType, allReferencedTypes);
    }
    if (this._mutationType != null) {
      collectReferencedTypes(this._mutationType, allReferencedTypes);
    }
    if (this._subscriptionType != null) {
      collectReferencedTypes(this._subscriptionType, allReferencedTypes);
    }
    for (const directive of this._directives) {
      if (isDirective(directive)) {
        for (const arg of directive.args) {
          collectReferencedTypes(arg.type, allReferencedTypes);
        }
      }
    }
    collectReferencedTypes(__Schema, allReferencedTypes);
    this._typeMap = Object.create(null);
    this._subTypeMap = Object.create(null);
    this._implementationsMap = Object.create(null);
    for (const namedType of allReferencedTypes) {
      if (namedType == null) {
        continue;
      }
      const typeName = namedType.name;
      typeName || devAssert(false, "One of the provided types for building the Schema is missing a name.");
      if (this._typeMap[typeName] !== undefined) {
        throw new Error(`Schema must contain uniquely named types but contains multiple types named "${typeName}".`);
      }
      this._typeMap[typeName] = namedType;
      if (isInterfaceType(namedType)) {
        for (const iface of namedType.getInterfaces()) {
          if (isInterfaceType(iface)) {
            let implementations = this._implementationsMap[iface.name];
            if (implementations === undefined) {
              implementations = this._implementationsMap[iface.name] = {
                objects: [],
                interfaces: []
              };
            }
            implementations.interfaces.push(namedType);
          }
        }
      } else if (isObjectType(namedType)) {
        for (const iface of namedType.getInterfaces()) {
          if (isInterfaceType(iface)) {
            let implementations = this._implementationsMap[iface.name];
            if (implementations === undefined) {
              implementations = this._implementationsMap[iface.name] = {
                objects: [],
                interfaces: []
              };
            }
            implementations.objects.push(namedType);
          }
        }
      }
    }
  }
  get [Symbol.toStringTag]() {
    return "GraphQLSchema";
  }
  getQueryType() {
    return this._queryType;
  }
  getMutationType() {
    return this._mutationType;
  }
  getSubscriptionType() {
    return this._subscriptionType;
  }
  getRootType(operation) {
    switch (operation) {
      case OperationTypeNode.QUERY:
        return this.getQueryType();
      case OperationTypeNode.MUTATION:
        return this.getMutationType();
      case OperationTypeNode.SUBSCRIPTION:
        return this.getSubscriptionType();
    }
  }
  getTypeMap() {
    return this._typeMap;
  }
  getType(name) {
    return this.getTypeMap()[name];
  }
  getPossibleTypes(abstractType) {
    return isUnionType(abstractType) ? abstractType.getTypes() : this.getImplementations(abstractType).objects;
  }
  getImplementations(interfaceType) {
    const implementations = this._implementationsMap[interfaceType.name];
    return implementations !== null && implementations !== undefined ? implementations : {
      objects: [],
      interfaces: []
    };
  }
  isSubType(abstractType, maybeSubType) {
    let map = this._subTypeMap[abstractType.name];
    if (map === undefined) {
      map = Object.create(null);
      if (isUnionType(abstractType)) {
        for (const type of abstractType.getTypes()) {
          map[type.name] = true;
        }
      } else {
        const implementations = this.getImplementations(abstractType);
        for (const type of implementations.objects) {
          map[type.name] = true;
        }
        for (const type of implementations.interfaces) {
          map[type.name] = true;
        }
      }
      this._subTypeMap[abstractType.name] = map;
    }
    return map[maybeSubType.name] !== undefined;
  }
  getDirectives() {
    return this._directives;
  }
  getDirective(name) {
    return this.getDirectives().find((directive) => directive.name === name);
  }
  toConfig() {
    return {
      description: this.description,
      query: this.getQueryType(),
      mutation: this.getMutationType(),
      subscription: this.getSubscriptionType(),
      types: Object.values(this.getTypeMap()),
      directives: this.getDirectives(),
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes,
      assumeValid: this.__validationErrors !== undefined
    };
  }
}
function collectReferencedTypes(type, typeSet) {
  const namedType = getNamedType(type);
  if (!typeSet.has(namedType)) {
    typeSet.add(namedType);
    if (isUnionType(namedType)) {
      for (const memberType of namedType.getTypes()) {
        collectReferencedTypes(memberType, typeSet);
      }
    } else if (isObjectType(namedType) || isInterfaceType(namedType)) {
      for (const interfaceType of namedType.getInterfaces()) {
        collectReferencedTypes(interfaceType, typeSet);
      }
      for (const field of Object.values(namedType.getFields())) {
        collectReferencedTypes(field.type, typeSet);
        for (const arg of field.args) {
          collectReferencedTypes(arg.type, typeSet);
        }
      }
    } else if (isInputObjectType(namedType)) {
      for (const field of Object.values(namedType.getFields())) {
        collectReferencedTypes(field.type, typeSet);
      }
    }
  }
  return typeSet;
}
// zveltio-extensions/node_modules/graphql/utilities/typeComparators.mjs
function isEqualType(typeA, typeB) {
  if (typeA === typeB) {
    return true;
  }
  if (isNonNullType(typeA) && isNonNullType(typeB)) {
    return isEqualType(typeA.ofType, typeB.ofType);
  }
  if (isListType(typeA) && isListType(typeB)) {
    return isEqualType(typeA.ofType, typeB.ofType);
  }
  return false;
}
function isTypeSubTypeOf(schema, maybeSubType, superType) {
  if (maybeSubType === superType) {
    return true;
  }
  if (isNonNullType(superType)) {
    if (isNonNullType(maybeSubType)) {
      return isTypeSubTypeOf(schema, maybeSubType.ofType, superType.ofType);
    }
    return false;
  }
  if (isNonNullType(maybeSubType)) {
    return isTypeSubTypeOf(schema, maybeSubType.ofType, superType);
  }
  if (isListType(superType)) {
    if (isListType(maybeSubType)) {
      return isTypeSubTypeOf(schema, maybeSubType.ofType, superType.ofType);
    }
    return false;
  }
  if (isListType(maybeSubType)) {
    return false;
  }
  return isAbstractType(superType) && (isInterfaceType(maybeSubType) || isObjectType(maybeSubType)) && schema.isSubType(superType, maybeSubType);
}
function doTypesOverlap(schema, typeA, typeB) {
  if (typeA === typeB) {
    return true;
  }
  if (isAbstractType(typeA)) {
    if (isAbstractType(typeB)) {
      return schema.getPossibleTypes(typeA).some((type) => schema.isSubType(typeB, type));
    }
    return schema.isSubType(typeA, typeB);
  }
  if (isAbstractType(typeB)) {
    return schema.isSubType(typeB, typeA);
  }
  return false;
}

// zveltio-extensions/node_modules/graphql/type/validate.mjs
function validateSchema(schema) {
  assertSchema(schema);
  if (schema.__validationErrors) {
    return schema.__validationErrors;
  }
  const context = new SchemaValidationContext(schema);
  validateRootTypes(context);
  validateDirectives(context);
  validateTypes(context);
  const errors = context.getErrors();
  schema.__validationErrors = errors;
  return errors;
}
function assertValidSchema(schema) {
  const errors = validateSchema(schema);
  if (errors.length !== 0) {
    throw new Error(errors.map((error) => error.message).join(`

`));
  }
}

class SchemaValidationContext {
  constructor(schema) {
    this._errors = [];
    this.schema = schema;
  }
  reportError(message, nodes) {
    const _nodes = Array.isArray(nodes) ? nodes.filter(Boolean) : nodes;
    this._errors.push(new GraphQLError(message, {
      nodes: _nodes
    }));
  }
  getErrors() {
    return this._errors;
  }
}
function validateRootTypes(context) {
  const schema = context.schema;
  const queryType = schema.getQueryType();
  if (!queryType) {
    context.reportError("Query root type must be provided.", schema.astNode);
  } else if (!isObjectType(queryType)) {
    var _getOperationTypeNode;
    context.reportError(`Query root type must be Object type, it cannot be ${inspect(queryType)}.`, (_getOperationTypeNode = getOperationTypeNode(schema, OperationTypeNode.QUERY)) !== null && _getOperationTypeNode !== undefined ? _getOperationTypeNode : queryType.astNode);
  }
  const mutationType = schema.getMutationType();
  if (mutationType && !isObjectType(mutationType)) {
    var _getOperationTypeNode2;
    context.reportError("Mutation root type must be Object type if provided, it cannot be " + `${inspect(mutationType)}.`, (_getOperationTypeNode2 = getOperationTypeNode(schema, OperationTypeNode.MUTATION)) !== null && _getOperationTypeNode2 !== undefined ? _getOperationTypeNode2 : mutationType.astNode);
  }
  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType && !isObjectType(subscriptionType)) {
    var _getOperationTypeNode3;
    context.reportError("Subscription root type must be Object type if provided, it cannot be " + `${inspect(subscriptionType)}.`, (_getOperationTypeNode3 = getOperationTypeNode(schema, OperationTypeNode.SUBSCRIPTION)) !== null && _getOperationTypeNode3 !== undefined ? _getOperationTypeNode3 : subscriptionType.astNode);
  }
}
function getOperationTypeNode(schema, operation) {
  var _flatMap$find;
  return (_flatMap$find = [schema.astNode, ...schema.extensionASTNodes].flatMap((schemaNode) => {
    var _schemaNode$operation;
    return (_schemaNode$operation = schemaNode === null || schemaNode === undefined ? undefined : schemaNode.operationTypes) !== null && _schemaNode$operation !== undefined ? _schemaNode$operation : [];
  }).find((operationNode) => operationNode.operation === operation)) === null || _flatMap$find === undefined ? undefined : _flatMap$find.type;
}
function validateDirectives(context) {
  for (const directive of context.schema.getDirectives()) {
    if (!isDirective(directive)) {
      context.reportError(`Expected directive but got: ${inspect(directive)}.`, directive === null || directive === undefined ? undefined : directive.astNode);
      continue;
    }
    validateName(context, directive);
    if (directive.locations.length === 0) {
      context.reportError(`Directive @${directive.name} must include 1 or more locations.`, directive.astNode);
    }
    for (const arg of directive.args) {
      validateName(context, arg);
      if (!isInputType(arg.type)) {
        context.reportError(`The type of @${directive.name}(${arg.name}:) must be Input Type ` + `but got: ${inspect(arg.type)}.`, arg.astNode);
      }
      if (isRequiredArgument(arg) && arg.deprecationReason != null) {
        var _arg$astNode;
        context.reportError(`Required argument @${directive.name}(${arg.name}:) cannot be deprecated.`, [
          getDeprecatedDirectiveNode(arg.astNode),
          (_arg$astNode = arg.astNode) === null || _arg$astNode === undefined ? undefined : _arg$astNode.type
        ]);
      }
    }
  }
}
function validateName(context, node) {
  if (node.name.startsWith("__")) {
    context.reportError(`Name "${node.name}" must not begin with "__", which is reserved by GraphQL introspection.`, node.astNode);
  }
}
function validateTypes(context) {
  const validateInputObjectCircularRefs = createInputObjectCircularRefsValidator(context);
  const typeMap = context.schema.getTypeMap();
  for (const type of Object.values(typeMap)) {
    if (!isNamedType(type)) {
      context.reportError(`Expected GraphQL named type but got: ${inspect(type)}.`, type.astNode);
      continue;
    }
    if (!isIntrospectionType(type)) {
      validateName(context, type);
    }
    if (isObjectType(type)) {
      validateFields(context, type);
      validateInterfaces(context, type);
    } else if (isInterfaceType(type)) {
      validateFields(context, type);
      validateInterfaces(context, type);
    } else if (isUnionType(type)) {
      validateUnionMembers(context, type);
    } else if (isEnumType(type)) {
      validateEnumValues(context, type);
    } else if (isInputObjectType(type)) {
      validateInputFields(context, type);
      validateInputObjectCircularRefs(type);
    }
  }
}
function validateFields(context, type) {
  const fields = Object.values(type.getFields());
  if (fields.length === 0) {
    context.reportError(`Type ${type.name} must define one or more fields.`, [
      type.astNode,
      ...type.extensionASTNodes
    ]);
  }
  for (const field of fields) {
    validateName(context, field);
    if (!isOutputType(field.type)) {
      var _field$astNode;
      context.reportError(`The type of ${type.name}.${field.name} must be Output Type ` + `but got: ${inspect(field.type)}.`, (_field$astNode = field.astNode) === null || _field$astNode === undefined ? undefined : _field$astNode.type);
    }
    for (const arg of field.args) {
      const argName = arg.name;
      validateName(context, arg);
      if (!isInputType(arg.type)) {
        var _arg$astNode2;
        context.reportError(`The type of ${type.name}.${field.name}(${argName}:) must be Input ` + `Type but got: ${inspect(arg.type)}.`, (_arg$astNode2 = arg.astNode) === null || _arg$astNode2 === undefined ? undefined : _arg$astNode2.type);
      }
      if (isRequiredArgument(arg) && arg.deprecationReason != null) {
        var _arg$astNode3;
        context.reportError(`Required argument ${type.name}.${field.name}(${argName}:) cannot be deprecated.`, [
          getDeprecatedDirectiveNode(arg.astNode),
          (_arg$astNode3 = arg.astNode) === null || _arg$astNode3 === undefined ? undefined : _arg$astNode3.type
        ]);
      }
    }
  }
}
function validateInterfaces(context, type) {
  const ifaceTypeNames = Object.create(null);
  for (const iface of type.getInterfaces()) {
    if (!isInterfaceType(iface)) {
      context.reportError(`Type ${inspect(type)} must only implement Interface types, ` + `it cannot implement ${inspect(iface)}.`, getAllImplementsInterfaceNodes(type, iface));
      continue;
    }
    if (type === iface) {
      context.reportError(`Type ${type.name} cannot implement itself because it would create a circular reference.`, getAllImplementsInterfaceNodes(type, iface));
      continue;
    }
    if (ifaceTypeNames[iface.name]) {
      context.reportError(`Type ${type.name} can only implement ${iface.name} once.`, getAllImplementsInterfaceNodes(type, iface));
      continue;
    }
    ifaceTypeNames[iface.name] = true;
    validateTypeImplementsAncestors(context, type, iface);
    validateTypeImplementsInterface(context, type, iface);
  }
}
function validateTypeImplementsInterface(context, type, iface) {
  const typeFieldMap = type.getFields();
  for (const ifaceField of Object.values(iface.getFields())) {
    const fieldName = ifaceField.name;
    const typeField = typeFieldMap[fieldName];
    if (!typeField) {
      context.reportError(`Interface field ${iface.name}.${fieldName} expected but ${type.name} does not provide it.`, [ifaceField.astNode, type.astNode, ...type.extensionASTNodes]);
      continue;
    }
    if (!isTypeSubTypeOf(context.schema, typeField.type, ifaceField.type)) {
      var _ifaceField$astNode, _typeField$astNode;
      context.reportError(`Interface field ${iface.name}.${fieldName} expects type ` + `${inspect(ifaceField.type)} but ${type.name}.${fieldName} ` + `is type ${inspect(typeField.type)}.`, [
        (_ifaceField$astNode = ifaceField.astNode) === null || _ifaceField$astNode === undefined ? undefined : _ifaceField$astNode.type,
        (_typeField$astNode = typeField.astNode) === null || _typeField$astNode === undefined ? undefined : _typeField$astNode.type
      ]);
    }
    for (const ifaceArg of ifaceField.args) {
      const argName = ifaceArg.name;
      const typeArg = typeField.args.find((arg) => arg.name === argName);
      if (!typeArg) {
        context.reportError(`Interface field argument ${iface.name}.${fieldName}(${argName}:) expected but ${type.name}.${fieldName} does not provide it.`, [ifaceArg.astNode, typeField.astNode]);
        continue;
      }
      if (!isEqualType(ifaceArg.type, typeArg.type)) {
        var _ifaceArg$astNode, _typeArg$astNode;
        context.reportError(`Interface field argument ${iface.name}.${fieldName}(${argName}:) ` + `expects type ${inspect(ifaceArg.type)} but ` + `${type.name}.${fieldName}(${argName}:) is type ` + `${inspect(typeArg.type)}.`, [
          (_ifaceArg$astNode = ifaceArg.astNode) === null || _ifaceArg$astNode === undefined ? undefined : _ifaceArg$astNode.type,
          (_typeArg$astNode = typeArg.astNode) === null || _typeArg$astNode === undefined ? undefined : _typeArg$astNode.type
        ]);
      }
    }
    for (const typeArg of typeField.args) {
      const argName = typeArg.name;
      const ifaceArg = ifaceField.args.find((arg) => arg.name === argName);
      if (!ifaceArg && isRequiredArgument(typeArg)) {
        context.reportError(`Object field ${type.name}.${fieldName} includes required argument ${argName} that is missing from the Interface field ${iface.name}.${fieldName}.`, [typeArg.astNode, ifaceField.astNode]);
      }
    }
  }
}
function validateTypeImplementsAncestors(context, type, iface) {
  const ifaceInterfaces = type.getInterfaces();
  for (const transitive of iface.getInterfaces()) {
    if (!ifaceInterfaces.includes(transitive)) {
      context.reportError(transitive === type ? `Type ${type.name} cannot implement ${iface.name} because it would create a circular reference.` : `Type ${type.name} must implement ${transitive.name} because it is implemented by ${iface.name}.`, [
        ...getAllImplementsInterfaceNodes(iface, transitive),
        ...getAllImplementsInterfaceNodes(type, iface)
      ]);
    }
  }
}
function validateUnionMembers(context, union) {
  const memberTypes = union.getTypes();
  if (memberTypes.length === 0) {
    context.reportError(`Union type ${union.name} must define one or more member types.`, [union.astNode, ...union.extensionASTNodes]);
  }
  const includedTypeNames = Object.create(null);
  for (const memberType of memberTypes) {
    if (includedTypeNames[memberType.name]) {
      context.reportError(`Union type ${union.name} can only include type ${memberType.name} once.`, getUnionMemberTypeNodes(union, memberType.name));
      continue;
    }
    includedTypeNames[memberType.name] = true;
    if (!isObjectType(memberType)) {
      context.reportError(`Union type ${union.name} can only include Object types, ` + `it cannot include ${inspect(memberType)}.`, getUnionMemberTypeNodes(union, String(memberType)));
    }
  }
}
function validateEnumValues(context, enumType) {
  const enumValues = enumType.getValues();
  if (enumValues.length === 0) {
    context.reportError(`Enum type ${enumType.name} must define one or more values.`, [enumType.astNode, ...enumType.extensionASTNodes]);
  }
  for (const enumValue of enumValues) {
    validateName(context, enumValue);
  }
}
function validateInputFields(context, inputObj) {
  const fields = Object.values(inputObj.getFields());
  if (fields.length === 0) {
    context.reportError(`Input Object type ${inputObj.name} must define one or more fields.`, [inputObj.astNode, ...inputObj.extensionASTNodes]);
  }
  for (const field of fields) {
    validateName(context, field);
    if (!isInputType(field.type)) {
      var _field$astNode2;
      context.reportError(`The type of ${inputObj.name}.${field.name} must be Input Type ` + `but got: ${inspect(field.type)}.`, (_field$astNode2 = field.astNode) === null || _field$astNode2 === undefined ? undefined : _field$astNode2.type);
    }
    if (isRequiredInputField(field) && field.deprecationReason != null) {
      var _field$astNode3;
      context.reportError(`Required input field ${inputObj.name}.${field.name} cannot be deprecated.`, [
        getDeprecatedDirectiveNode(field.astNode),
        (_field$astNode3 = field.astNode) === null || _field$astNode3 === undefined ? undefined : _field$astNode3.type
      ]);
    }
    if (inputObj.isOneOf) {
      validateOneOfInputObjectField(inputObj, field, context);
    }
  }
}
function validateOneOfInputObjectField(type, field, context) {
  if (isNonNullType(field.type)) {
    var _field$astNode4;
    context.reportError(`OneOf input field ${type.name}.${field.name} must be nullable.`, (_field$astNode4 = field.astNode) === null || _field$astNode4 === undefined ? undefined : _field$astNode4.type);
  }
  if (field.defaultValue !== undefined) {
    context.reportError(`OneOf input field ${type.name}.${field.name} cannot have a default value.`, field.astNode);
  }
}
function createInputObjectCircularRefsValidator(context) {
  const visitedTypes = Object.create(null);
  const fieldPath = [];
  const fieldPathIndexByTypeName = Object.create(null);
  return detectCycleRecursive;
  function detectCycleRecursive(inputObj) {
    if (visitedTypes[inputObj.name]) {
      return;
    }
    visitedTypes[inputObj.name] = true;
    fieldPathIndexByTypeName[inputObj.name] = fieldPath.length;
    const fields = Object.values(inputObj.getFields());
    for (const field of fields) {
      if (isNonNullType(field.type) && isInputObjectType(field.type.ofType)) {
        const fieldType = field.type.ofType;
        const cycleIndex = fieldPathIndexByTypeName[fieldType.name];
        fieldPath.push(field);
        if (cycleIndex === undefined) {
          detectCycleRecursive(fieldType);
        } else {
          const cyclePath = fieldPath.slice(cycleIndex);
          const pathStr = cyclePath.map((fieldObj) => fieldObj.name).join(".");
          context.reportError(`Cannot reference Input Object "${fieldType.name}" within itself through a series of non-null fields: "${pathStr}".`, cyclePath.map((fieldObj) => fieldObj.astNode));
        }
        fieldPath.pop();
      }
    }
    fieldPathIndexByTypeName[inputObj.name] = undefined;
  }
}
function getAllImplementsInterfaceNodes(type, iface) {
  const { astNode, extensionASTNodes } = type;
  const nodes = astNode != null ? [astNode, ...extensionASTNodes] : extensionASTNodes;
  return nodes.flatMap((typeNode) => {
    var _typeNode$interfaces;
    return (_typeNode$interfaces = typeNode.interfaces) !== null && _typeNode$interfaces !== undefined ? _typeNode$interfaces : [];
  }).filter((ifaceNode) => ifaceNode.name.value === iface.name);
}
function getUnionMemberTypeNodes(union, typeName) {
  const { astNode, extensionASTNodes } = union;
  const nodes = astNode != null ? [astNode, ...extensionASTNodes] : extensionASTNodes;
  return nodes.flatMap((unionNode) => {
    var _unionNode$types;
    return (_unionNode$types = unionNode.types) !== null && _unionNode$types !== undefined ? _unionNode$types : [];
  }).filter((typeNode) => typeNode.name.value === typeName);
}
function getDeprecatedDirectiveNode(definitionNode) {
  var _definitionNode$direc;
  return definitionNode === null || definitionNode === undefined ? undefined : (_definitionNode$direc = definitionNode.directives) === null || _definitionNode$direc === undefined ? undefined : _definitionNode$direc.find((node) => node.name.value === GraphQLDeprecatedDirective.name);
}
// zveltio-extensions/node_modules/graphql/language/source.mjs
class Source {
  constructor(body, name = "GraphQL request", locationOffset = {
    line: 1,
    column: 1
  }) {
    typeof body === "string" || devAssert(false, `Body must be a string. Received: ${inspect(body)}.`);
    this.body = body;
    this.name = name;
    this.locationOffset = locationOffset;
    this.locationOffset.line > 0 || devAssert(false, "line in locationOffset is 1-indexed and must be positive.");
    this.locationOffset.column > 0 || devAssert(false, "column in locationOffset is 1-indexed and must be positive.");
  }
  get [Symbol.toStringTag]() {
    return "Source";
  }
}
function isSource(source) {
  return instanceOf(source, Source);
}

// zveltio-extensions/node_modules/graphql/language/tokenKind.mjs
var TokenKind;
(function(TokenKind) {
  TokenKind["SOF"] = "<SOF>";
  TokenKind["EOF"] = "<EOF>";
  TokenKind["BANG"] = "!";
  TokenKind["DOLLAR"] = "$";
  TokenKind["AMP"] = "&";
  TokenKind["PAREN_L"] = "(";
  TokenKind["PAREN_R"] = ")";
  TokenKind["DOT"] = ".";
  TokenKind["SPREAD"] = "...";
  TokenKind["COLON"] = ":";
  TokenKind["EQUALS"] = "=";
  TokenKind["AT"] = "@";
  TokenKind["BRACKET_L"] = "[";
  TokenKind["BRACKET_R"] = "]";
  TokenKind["BRACE_L"] = "{";
  TokenKind["PIPE"] = "|";
  TokenKind["BRACE_R"] = "}";
  TokenKind["NAME"] = "Name";
  TokenKind["INT"] = "Int";
  TokenKind["FLOAT"] = "Float";
  TokenKind["STRING"] = "String";
  TokenKind["BLOCK_STRING"] = "BlockString";
  TokenKind["COMMENT"] = "Comment";
})(TokenKind || (TokenKind = {}));

// zveltio-extensions/node_modules/graphql/error/syntaxError.mjs
function syntaxError(source, position, description) {
  return new GraphQLError(`Syntax Error: ${description}`, {
    source,
    positions: [position]
  });
}

// zveltio-extensions/node_modules/graphql/language/lexer.mjs
class Lexer {
  constructor(source) {
    const startOfFileToken = new Token(TokenKind.SOF, 0, 0, 0, 0);
    this.source = source;
    this.lastToken = startOfFileToken;
    this.token = startOfFileToken;
    this.line = 1;
    this.lineStart = 0;
    this._maxComments = undefined;
    this._commentCount = 0;
  }
  get [Symbol.toStringTag]() {
    return "Lexer";
  }
  advance() {
    this.lastToken = this.token;
    const token = this.token = this.lookahead();
    return token;
  }
  lookahead() {
    let token = this.token;
    if (token.kind !== TokenKind.EOF) {
      do {
        if (token.next) {
          token = token.next;
        } else {
          const nextToken = readNextToken(this, token.end);
          token.next = nextToken;
          nextToken.prev = token;
          token = nextToken;
        }
      } while (token.kind === TokenKind.COMMENT);
    }
    return token;
  }
}
function isPunctuatorTokenKind(kind) {
  return kind === TokenKind.BANG || kind === TokenKind.DOLLAR || kind === TokenKind.AMP || kind === TokenKind.PAREN_L || kind === TokenKind.PAREN_R || kind === TokenKind.DOT || kind === TokenKind.SPREAD || kind === TokenKind.COLON || kind === TokenKind.EQUALS || kind === TokenKind.AT || kind === TokenKind.BRACKET_L || kind === TokenKind.BRACKET_R || kind === TokenKind.BRACE_L || kind === TokenKind.PIPE || kind === TokenKind.BRACE_R;
}
function isUnicodeScalarValue(code) {
  return code >= 0 && code <= 55295 || code >= 57344 && code <= 1114111;
}
function isSupplementaryCodePoint(body, location) {
  return isLeadingSurrogate(body.charCodeAt(location)) && isTrailingSurrogate(body.charCodeAt(location + 1));
}
function isLeadingSurrogate(code) {
  return code >= 55296 && code <= 56319;
}
function isTrailingSurrogate(code) {
  return code >= 56320 && code <= 57343;
}
function printCodePointAt(lexer, location) {
  const code = lexer.source.body.codePointAt(location);
  if (code === undefined) {
    return TokenKind.EOF;
  } else if (code >= 32 && code <= 126) {
    const char = String.fromCodePoint(code);
    return char === '"' ? `'"'` : `"${char}"`;
  }
  return "U+" + code.toString(16).toUpperCase().padStart(4, "0");
}
function createToken(lexer, kind, start, end, value) {
  const line = lexer.line;
  const col = 1 + start - lexer.lineStart;
  return new Token(kind, start, end, line, col, value);
}
function readNextToken(lexer, start) {
  const body = lexer.source.body;
  const bodyLength = body.length;
  let position = start;
  while (position < bodyLength) {
    const code = body.charCodeAt(position);
    switch (code) {
      case 65279:
      case 9:
      case 32:
      case 44:
        ++position;
        continue;
      case 10:
        ++position;
        ++lexer.line;
        lexer.lineStart = position;
        continue;
      case 13:
        if (body.charCodeAt(position + 1) === 10) {
          position += 2;
        } else {
          ++position;
        }
        ++lexer.line;
        lexer.lineStart = position;
        continue;
      case 35:
        return readComment(lexer, position);
      case 33:
        return createToken(lexer, TokenKind.BANG, position, position + 1);
      case 36:
        return createToken(lexer, TokenKind.DOLLAR, position, position + 1);
      case 38:
        return createToken(lexer, TokenKind.AMP, position, position + 1);
      case 40:
        return createToken(lexer, TokenKind.PAREN_L, position, position + 1);
      case 41:
        return createToken(lexer, TokenKind.PAREN_R, position, position + 1);
      case 46:
        if (body.charCodeAt(position + 1) === 46 && body.charCodeAt(position + 2) === 46) {
          return createToken(lexer, TokenKind.SPREAD, position, position + 3);
        }
        break;
      case 58:
        return createToken(lexer, TokenKind.COLON, position, position + 1);
      case 61:
        return createToken(lexer, TokenKind.EQUALS, position, position + 1);
      case 64:
        return createToken(lexer, TokenKind.AT, position, position + 1);
      case 91:
        return createToken(lexer, TokenKind.BRACKET_L, position, position + 1);
      case 93:
        return createToken(lexer, TokenKind.BRACKET_R, position, position + 1);
      case 123:
        return createToken(lexer, TokenKind.BRACE_L, position, position + 1);
      case 124:
        return createToken(lexer, TokenKind.PIPE, position, position + 1);
      case 125:
        return createToken(lexer, TokenKind.BRACE_R, position, position + 1);
      case 34:
        if (body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
          return readBlockString(lexer, position);
        }
        return readString(lexer, position);
    }
    if (isDigit2(code) || code === 45) {
      return readNumber(lexer, position, code);
    }
    if (isNameStart(code)) {
      return readName(lexer, position);
    }
    throw syntaxError(lexer.source, position, code === 39 ? `Unexpected single quote character ('), did you mean to use a double quote (")?` : isUnicodeScalarValue(code) || isSupplementaryCodePoint(body, position) ? `Unexpected character: ${printCodePointAt(lexer, position)}.` : `Invalid character: ${printCodePointAt(lexer, position)}.`);
  }
  return createToken(lexer, TokenKind.EOF, bodyLength, bodyLength);
}
function readComment(lexer, start) {
  const maxComments = lexer._maxComments;
  if (maxComments !== undefined) {
    const nextCommentCount = lexer._commentCount + 1;
    if (nextCommentCount > maxComments) {
      throw syntaxError(lexer.source, start, `Document contains more than ${maxComments} comments. Parsing aborted.`);
    }
    lexer._commentCount = nextCommentCount;
  }
  const body = lexer.source.body;
  const bodyLength = body.length;
  let position = start + 1;
  while (position < bodyLength) {
    const code = body.charCodeAt(position);
    if (code === 10 || code === 13) {
      break;
    }
    if (isUnicodeScalarValue(code)) {
      ++position;
    } else if (isSupplementaryCodePoint(body, position)) {
      position += 2;
    } else {
      break;
    }
  }
  return createToken(lexer, TokenKind.COMMENT, start, position, body.slice(start + 1, position));
}
function readNumber(lexer, start, firstCode) {
  const body = lexer.source.body;
  let position = start;
  let code = firstCode;
  let isFloat = false;
  if (code === 45) {
    code = body.charCodeAt(++position);
  }
  if (code === 48) {
    code = body.charCodeAt(++position);
    if (isDigit2(code)) {
      throw syntaxError(lexer.source, position, `Invalid number, unexpected digit after 0: ${printCodePointAt(lexer, position)}.`);
    }
  } else {
    position = readDigits(lexer, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 46) {
    isFloat = true;
    code = body.charCodeAt(++position);
    position = readDigits(lexer, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 69 || code === 101) {
    isFloat = true;
    code = body.charCodeAt(++position);
    if (code === 43 || code === 45) {
      code = body.charCodeAt(++position);
    }
    position = readDigits(lexer, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 46 || isNameStart(code)) {
    throw syntaxError(lexer.source, position, `Invalid number, expected digit but got: ${printCodePointAt(lexer, position)}.`);
  }
  return createToken(lexer, isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, body.slice(start, position));
}
function readDigits(lexer, start, firstCode) {
  if (!isDigit2(firstCode)) {
    throw syntaxError(lexer.source, start, `Invalid number, expected digit but got: ${printCodePointAt(lexer, start)}.`);
  }
  const body = lexer.source.body;
  let position = start + 1;
  while (isDigit2(body.charCodeAt(position))) {
    ++position;
  }
  return position;
}
function readString(lexer, start) {
  const body = lexer.source.body;
  const bodyLength = body.length;
  let position = start + 1;
  let chunkStart = position;
  let value = "";
  while (position < bodyLength) {
    const code = body.charCodeAt(position);
    if (code === 34) {
      value += body.slice(chunkStart, position);
      return createToken(lexer, TokenKind.STRING, start, position + 1, value);
    }
    if (code === 92) {
      value += body.slice(chunkStart, position);
      const escape = body.charCodeAt(position + 1) === 117 ? body.charCodeAt(position + 2) === 123 ? readEscapedUnicodeVariableWidth(lexer, position) : readEscapedUnicodeFixedWidth(lexer, position) : readEscapedCharacter(lexer, position);
      value += escape.value;
      position += escape.size;
      chunkStart = position;
      continue;
    }
    if (code === 10 || code === 13) {
      break;
    }
    if (isUnicodeScalarValue(code)) {
      ++position;
    } else if (isSupplementaryCodePoint(body, position)) {
      position += 2;
    } else {
      throw syntaxError(lexer.source, position, `Invalid character within String: ${printCodePointAt(lexer, position)}.`);
    }
  }
  throw syntaxError(lexer.source, position, "Unterminated string.");
}
function readEscapedUnicodeVariableWidth(lexer, position) {
  const body = lexer.source.body;
  let point = 0;
  let size = 3;
  while (size < 12) {
    const code = body.charCodeAt(position + size++);
    if (code === 125) {
      if (size < 5 || !isUnicodeScalarValue(point)) {
        break;
      }
      return {
        value: String.fromCodePoint(point),
        size
      };
    }
    point = point << 4 | readHexDigit(code);
    if (point < 0) {
      break;
    }
  }
  throw syntaxError(lexer.source, position, `Invalid Unicode escape sequence: "${body.slice(position, position + size)}".`);
}
function readEscapedUnicodeFixedWidth(lexer, position) {
  const body = lexer.source.body;
  const code = read16BitHexCode(body, position + 2);
  if (isUnicodeScalarValue(code)) {
    return {
      value: String.fromCodePoint(code),
      size: 6
    };
  }
  if (isLeadingSurrogate(code)) {
    if (body.charCodeAt(position + 6) === 92 && body.charCodeAt(position + 7) === 117) {
      const trailingCode = read16BitHexCode(body, position + 8);
      if (isTrailingSurrogate(trailingCode)) {
        return {
          value: String.fromCodePoint(code, trailingCode),
          size: 12
        };
      }
    }
  }
  throw syntaxError(lexer.source, position, `Invalid Unicode escape sequence: "${body.slice(position, position + 6)}".`);
}
function read16BitHexCode(body, position) {
  return readHexDigit(body.charCodeAt(position)) << 12 | readHexDigit(body.charCodeAt(position + 1)) << 8 | readHexDigit(body.charCodeAt(position + 2)) << 4 | readHexDigit(body.charCodeAt(position + 3));
}
function readHexDigit(code) {
  return code >= 48 && code <= 57 ? code - 48 : code >= 65 && code <= 70 ? code - 55 : code >= 97 && code <= 102 ? code - 87 : -1;
}
function readEscapedCharacter(lexer, position) {
  const body = lexer.source.body;
  const code = body.charCodeAt(position + 1);
  switch (code) {
    case 34:
      return {
        value: '"',
        size: 2
      };
    case 92:
      return {
        value: "\\",
        size: 2
      };
    case 47:
      return {
        value: "/",
        size: 2
      };
    case 98:
      return {
        value: "\b",
        size: 2
      };
    case 102:
      return {
        value: "\f",
        size: 2
      };
    case 110:
      return {
        value: `
`,
        size: 2
      };
    case 114:
      return {
        value: "\r",
        size: 2
      };
    case 116:
      return {
        value: "\t",
        size: 2
      };
  }
  throw syntaxError(lexer.source, position, `Invalid character escape sequence: "${body.slice(position, position + 2)}".`);
}
function readBlockString(lexer, start) {
  const body = lexer.source.body;
  const bodyLength = body.length;
  let lineStart = lexer.lineStart;
  let position = start + 3;
  let chunkStart = position;
  let currentLine = "";
  const blockLines = [];
  while (position < bodyLength) {
    const code = body.charCodeAt(position);
    if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
      currentLine += body.slice(chunkStart, position);
      blockLines.push(currentLine);
      const token = createToken(lexer, TokenKind.BLOCK_STRING, start, position + 3, dedentBlockStringLines(blockLines).join(`
`));
      lexer.line += blockLines.length - 1;
      lexer.lineStart = lineStart;
      return token;
    }
    if (code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34) {
      currentLine += body.slice(chunkStart, position);
      chunkStart = position + 1;
      position += 4;
      continue;
    }
    if (code === 10 || code === 13) {
      currentLine += body.slice(chunkStart, position);
      blockLines.push(currentLine);
      if (code === 13 && body.charCodeAt(position + 1) === 10) {
        position += 2;
      } else {
        ++position;
      }
      currentLine = "";
      chunkStart = position;
      lineStart = position;
      continue;
    }
    if (isUnicodeScalarValue(code)) {
      ++position;
    } else if (isSupplementaryCodePoint(body, position)) {
      position += 2;
    } else {
      throw syntaxError(lexer.source, position, `Invalid character within String: ${printCodePointAt(lexer, position)}.`);
    }
  }
  throw syntaxError(lexer.source, position, "Unterminated string.");
}
function readName(lexer, start) {
  const body = lexer.source.body;
  const bodyLength = body.length;
  let position = start + 1;
  while (position < bodyLength) {
    const code = body.charCodeAt(position);
    if (isNameContinue(code)) {
      ++position;
    } else {
      break;
    }
  }
  return createToken(lexer, TokenKind.NAME, start, position, body.slice(start, position));
}

// zveltio-extensions/node_modules/graphql/language/parser.mjs
function parse(source, options) {
  const parser = new Parser(source, options);
  const document = parser.parseDocument();
  Object.defineProperty(document, "tokenCount", {
    enumerable: false,
    value: parser.tokenCount
  });
  return document;
}
class Parser {
  constructor(source, options = {}) {
    const { lexer, ..._options } = options;
    if (lexer) {
      this._lexer = lexer;
    } else {
      const sourceObj = isSource(source) ? source : new Source(source);
      this._lexer = new Lexer(sourceObj);
    }
    this._options = _options;
    this._tokenCounter = 0;
    this._lexer._maxComments = options === null || options === undefined ? undefined : options.maxComments;
    this._lexer._commentCount = 0;
    const maxSourceLength = options === null || options === undefined ? undefined : options.maxSourceLength;
    if (maxSourceLength !== undefined && this._lexer.source.body.length > maxSourceLength) {
      throw syntaxError(this._lexer.source, maxSourceLength, `Source contains more than ${maxSourceLength} UTF-16 code units. Parsing aborted.`);
    }
  }
  get tokenCount() {
    return this._tokenCounter;
  }
  parseName() {
    const token = this.expectToken(TokenKind.NAME);
    return this.node(token, {
      kind: Kind.NAME,
      value: token.value
    });
  }
  parseDocument() {
    return this.node(this._lexer.token, {
      kind: Kind.DOCUMENT,
      definitions: this.many(TokenKind.SOF, this.parseDefinition, TokenKind.EOF)
    });
  }
  parseDefinition() {
    if (this.peek(TokenKind.BRACE_L)) {
      return this.parseOperationDefinition();
    }
    const hasDescription = this.peekDescription();
    const keywordToken = hasDescription ? this._lexer.lookahead() : this._lexer.token;
    if (hasDescription && keywordToken.kind === TokenKind.BRACE_L) {
      throw syntaxError(this._lexer.source, this._lexer.token.start, "Unexpected description, descriptions are not supported on shorthand queries.");
    }
    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case "schema":
          return this.parseSchemaDefinition();
        case "scalar":
          return this.parseScalarTypeDefinition();
        case "type":
          return this.parseObjectTypeDefinition();
        case "interface":
          return this.parseInterfaceTypeDefinition();
        case "union":
          return this.parseUnionTypeDefinition();
        case "enum":
          return this.parseEnumTypeDefinition();
        case "input":
          return this.parseInputObjectTypeDefinition();
        case "directive":
          return this.parseDirectiveDefinition();
      }
      switch (keywordToken.value) {
        case "query":
        case "mutation":
        case "subscription":
          return this.parseOperationDefinition();
        case "fragment":
          return this.parseFragmentDefinition();
      }
      if (hasDescription) {
        throw syntaxError(this._lexer.source, this._lexer.token.start, "Unexpected description, only GraphQL definitions support descriptions.");
      }
      switch (keywordToken.value) {
        case "extend":
          return this.parseTypeSystemExtension();
      }
    }
    throw this.unexpected(keywordToken);
  }
  parseOperationDefinition() {
    const start = this._lexer.token;
    if (this.peek(TokenKind.BRACE_L)) {
      return this.node(start, {
        kind: Kind.OPERATION_DEFINITION,
        operation: OperationTypeNode.QUERY,
        description: undefined,
        name: undefined,
        variableDefinitions: [],
        directives: [],
        selectionSet: this.parseSelectionSet()
      });
    }
    const description = this.parseDescription();
    const operation = this.parseOperationType();
    let name;
    if (this.peek(TokenKind.NAME)) {
      name = this.parseName();
    }
    return this.node(start, {
      kind: Kind.OPERATION_DEFINITION,
      operation,
      description,
      name,
      variableDefinitions: this.parseVariableDefinitions(),
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet()
    });
  }
  parseOperationType() {
    const operationToken = this.expectToken(TokenKind.NAME);
    switch (operationToken.value) {
      case "query":
        return OperationTypeNode.QUERY;
      case "mutation":
        return OperationTypeNode.MUTATION;
      case "subscription":
        return OperationTypeNode.SUBSCRIPTION;
    }
    throw this.unexpected(operationToken);
  }
  parseVariableDefinitions() {
    return this.optionalMany(TokenKind.PAREN_L, this.parseVariableDefinition, TokenKind.PAREN_R);
  }
  parseVariableDefinition() {
    return this.node(this._lexer.token, {
      kind: Kind.VARIABLE_DEFINITION,
      description: this.parseDescription(),
      variable: this.parseVariable(),
      type: (this.expectToken(TokenKind.COLON), this.parseTypeReference()),
      defaultValue: this.expectOptionalToken(TokenKind.EQUALS) ? this.parseConstValueLiteral() : undefined,
      directives: this.parseConstDirectives()
    });
  }
  parseVariable() {
    const start = this._lexer.token;
    this.expectToken(TokenKind.DOLLAR);
    return this.node(start, {
      kind: Kind.VARIABLE,
      name: this.parseName()
    });
  }
  parseSelectionSet() {
    return this.node(this._lexer.token, {
      kind: Kind.SELECTION_SET,
      selections: this.many(TokenKind.BRACE_L, this.parseSelection, TokenKind.BRACE_R)
    });
  }
  parseSelection() {
    return this.peek(TokenKind.SPREAD) ? this.parseFragment() : this.parseField();
  }
  parseField() {
    const start = this._lexer.token;
    const nameOrAlias = this.parseName();
    let alias;
    let name;
    if (this.expectOptionalToken(TokenKind.COLON)) {
      alias = nameOrAlias;
      name = this.parseName();
    } else {
      name = nameOrAlias;
    }
    return this.node(start, {
      kind: Kind.FIELD,
      alias,
      name,
      arguments: this.parseArguments(false),
      directives: this.parseDirectives(false),
      selectionSet: this.peek(TokenKind.BRACE_L) ? this.parseSelectionSet() : undefined
    });
  }
  parseArguments(isConst) {
    const item = isConst ? this.parseConstArgument : this.parseArgument;
    return this.optionalMany(TokenKind.PAREN_L, item, TokenKind.PAREN_R);
  }
  parseArgument(isConst = false) {
    const start = this._lexer.token;
    const name = this.parseName();
    this.expectToken(TokenKind.COLON);
    return this.node(start, {
      kind: Kind.ARGUMENT,
      name,
      value: this.parseValueLiteral(isConst)
    });
  }
  parseConstArgument() {
    return this.parseArgument(true);
  }
  parseFragment() {
    const start = this._lexer.token;
    this.expectToken(TokenKind.SPREAD);
    const hasTypeCondition = this.expectOptionalKeyword("on");
    if (!hasTypeCondition && this.peek(TokenKind.NAME)) {
      return this.node(start, {
        kind: Kind.FRAGMENT_SPREAD,
        name: this.parseFragmentName(),
        directives: this.parseDirectives(false)
      });
    }
    return this.node(start, {
      kind: Kind.INLINE_FRAGMENT,
      typeCondition: hasTypeCondition ? this.parseNamedType() : undefined,
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet()
    });
  }
  parseFragmentDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("fragment");
    if (this._options.allowLegacyFragmentVariables === true) {
      return this.node(start, {
        kind: Kind.FRAGMENT_DEFINITION,
        description,
        name: this.parseFragmentName(),
        variableDefinitions: this.parseVariableDefinitions(),
        typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
        directives: this.parseDirectives(false),
        selectionSet: this.parseSelectionSet()
      });
    }
    return this.node(start, {
      kind: Kind.FRAGMENT_DEFINITION,
      description,
      name: this.parseFragmentName(),
      typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet()
    });
  }
  parseFragmentName() {
    if (this._lexer.token.value === "on") {
      throw this.unexpected();
    }
    return this.parseName();
  }
  parseValueLiteral(isConst) {
    const token = this._lexer.token;
    switch (token.kind) {
      case TokenKind.BRACKET_L:
        return this.parseList(isConst);
      case TokenKind.BRACE_L:
        return this.parseObject(isConst);
      case TokenKind.INT:
        this.advanceLexer();
        return this.node(token, {
          kind: Kind.INT,
          value: token.value
        });
      case TokenKind.FLOAT:
        this.advanceLexer();
        return this.node(token, {
          kind: Kind.FLOAT,
          value: token.value
        });
      case TokenKind.STRING:
      case TokenKind.BLOCK_STRING:
        return this.parseStringLiteral();
      case TokenKind.NAME:
        this.advanceLexer();
        switch (token.value) {
          case "true":
            return this.node(token, {
              kind: Kind.BOOLEAN,
              value: true
            });
          case "false":
            return this.node(token, {
              kind: Kind.BOOLEAN,
              value: false
            });
          case "null":
            return this.node(token, {
              kind: Kind.NULL
            });
          default:
            return this.node(token, {
              kind: Kind.ENUM,
              value: token.value
            });
        }
      case TokenKind.DOLLAR:
        if (isConst) {
          this.expectToken(TokenKind.DOLLAR);
          if (this._lexer.token.kind === TokenKind.NAME) {
            const varName = this._lexer.token.value;
            throw syntaxError(this._lexer.source, token.start, `Unexpected variable "$${varName}" in constant value.`);
          } else {
            throw this.unexpected(token);
          }
        }
        return this.parseVariable();
      default:
        throw this.unexpected();
    }
  }
  parseConstValueLiteral() {
    return this.parseValueLiteral(true);
  }
  parseStringLiteral() {
    const token = this._lexer.token;
    this.advanceLexer();
    return this.node(token, {
      kind: Kind.STRING,
      value: token.value,
      block: token.kind === TokenKind.BLOCK_STRING
    });
  }
  parseList(isConst) {
    const item = () => this.parseValueLiteral(isConst);
    return this.node(this._lexer.token, {
      kind: Kind.LIST,
      values: this.any(TokenKind.BRACKET_L, item, TokenKind.BRACKET_R)
    });
  }
  parseObject(isConst) {
    const item = () => this.parseObjectField(isConst);
    return this.node(this._lexer.token, {
      kind: Kind.OBJECT,
      fields: this.any(TokenKind.BRACE_L, item, TokenKind.BRACE_R)
    });
  }
  parseObjectField(isConst) {
    const start = this._lexer.token;
    const name = this.parseName();
    this.expectToken(TokenKind.COLON);
    return this.node(start, {
      kind: Kind.OBJECT_FIELD,
      name,
      value: this.parseValueLiteral(isConst)
    });
  }
  parseDirectives(isConst) {
    const directives = [];
    while (this.peek(TokenKind.AT)) {
      directives.push(this.parseDirective(isConst));
    }
    return directives;
  }
  parseConstDirectives() {
    return this.parseDirectives(true);
  }
  parseDirective(isConst) {
    const start = this._lexer.token;
    this.expectToken(TokenKind.AT);
    return this.node(start, {
      kind: Kind.DIRECTIVE,
      name: this.parseName(),
      arguments: this.parseArguments(isConst)
    });
  }
  parseTypeReference() {
    const start = this._lexer.token;
    let type;
    if (this.expectOptionalToken(TokenKind.BRACKET_L)) {
      const innerType = this.parseTypeReference();
      this.expectToken(TokenKind.BRACKET_R);
      type = this.node(start, {
        kind: Kind.LIST_TYPE,
        type: innerType
      });
    } else {
      type = this.parseNamedType();
    }
    if (this.expectOptionalToken(TokenKind.BANG)) {
      return this.node(start, {
        kind: Kind.NON_NULL_TYPE,
        type
      });
    }
    return type;
  }
  parseNamedType() {
    return this.node(this._lexer.token, {
      kind: Kind.NAMED_TYPE,
      name: this.parseName()
    });
  }
  peekDescription() {
    return this.peek(TokenKind.STRING) || this.peek(TokenKind.BLOCK_STRING);
  }
  parseDescription() {
    if (this.peekDescription()) {
      return this.parseStringLiteral();
    }
  }
  parseSchemaDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("schema");
    const directives = this.parseConstDirectives();
    const operationTypes = this.many(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
    return this.node(start, {
      kind: Kind.SCHEMA_DEFINITION,
      description,
      directives,
      operationTypes
    });
  }
  parseOperationTypeDefinition() {
    const start = this._lexer.token;
    const operation = this.parseOperationType();
    this.expectToken(TokenKind.COLON);
    const type = this.parseNamedType();
    return this.node(start, {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation,
      type
    });
  }
  parseScalarTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("scalar");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    return this.node(start, {
      kind: Kind.SCALAR_TYPE_DEFINITION,
      description,
      name,
      directives
    });
  }
  parseObjectTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("type");
    const name = this.parseName();
    const interfaces = this.parseImplementsInterfaces();
    const directives = this.parseConstDirectives();
    const fields = this.parseFieldsDefinition();
    return this.node(start, {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      description,
      name,
      interfaces,
      directives,
      fields
    });
  }
  parseImplementsInterfaces() {
    return this.expectOptionalKeyword("implements") ? this.delimitedMany(TokenKind.AMP, this.parseNamedType) : [];
  }
  parseFieldsDefinition() {
    return this.optionalMany(TokenKind.BRACE_L, this.parseFieldDefinition, TokenKind.BRACE_R);
  }
  parseFieldDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    const name = this.parseName();
    const args = this.parseArgumentDefs();
    this.expectToken(TokenKind.COLON);
    const type = this.parseTypeReference();
    const directives = this.parseConstDirectives();
    return this.node(start, {
      kind: Kind.FIELD_DEFINITION,
      description,
      name,
      arguments: args,
      type,
      directives
    });
  }
  parseArgumentDefs() {
    return this.optionalMany(TokenKind.PAREN_L, this.parseInputValueDef, TokenKind.PAREN_R);
  }
  parseInputValueDef() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    const name = this.parseName();
    this.expectToken(TokenKind.COLON);
    const type = this.parseTypeReference();
    let defaultValue;
    if (this.expectOptionalToken(TokenKind.EQUALS)) {
      defaultValue = this.parseConstValueLiteral();
    }
    const directives = this.parseConstDirectives();
    return this.node(start, {
      kind: Kind.INPUT_VALUE_DEFINITION,
      description,
      name,
      type,
      defaultValue,
      directives
    });
  }
  parseInterfaceTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("interface");
    const name = this.parseName();
    const interfaces = this.parseImplementsInterfaces();
    const directives = this.parseConstDirectives();
    const fields = this.parseFieldsDefinition();
    return this.node(start, {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      description,
      name,
      interfaces,
      directives,
      fields
    });
  }
  parseUnionTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("union");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const types = this.parseUnionMemberTypes();
    return this.node(start, {
      kind: Kind.UNION_TYPE_DEFINITION,
      description,
      name,
      directives,
      types
    });
  }
  parseUnionMemberTypes() {
    return this.expectOptionalToken(TokenKind.EQUALS) ? this.delimitedMany(TokenKind.PIPE, this.parseNamedType) : [];
  }
  parseEnumTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("enum");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const values = this.parseEnumValuesDefinition();
    return this.node(start, {
      kind: Kind.ENUM_TYPE_DEFINITION,
      description,
      name,
      directives,
      values
    });
  }
  parseEnumValuesDefinition() {
    return this.optionalMany(TokenKind.BRACE_L, this.parseEnumValueDefinition, TokenKind.BRACE_R);
  }
  parseEnumValueDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    const name = this.parseEnumValueName();
    const directives = this.parseConstDirectives();
    return this.node(start, {
      kind: Kind.ENUM_VALUE_DEFINITION,
      description,
      name,
      directives
    });
  }
  parseEnumValueName() {
    if (this._lexer.token.value === "true" || this._lexer.token.value === "false" || this._lexer.token.value === "null") {
      throw syntaxError(this._lexer.source, this._lexer.token.start, `${getTokenDesc(this._lexer.token)} is reserved and cannot be used for an enum value.`);
    }
    return this.parseName();
  }
  parseInputObjectTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("input");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const fields = this.parseInputFieldsDefinition();
    return this.node(start, {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      description,
      name,
      directives,
      fields
    });
  }
  parseInputFieldsDefinition() {
    return this.optionalMany(TokenKind.BRACE_L, this.parseInputValueDef, TokenKind.BRACE_R);
  }
  parseTypeSystemExtension() {
    const keywordToken = this._lexer.lookahead();
    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case "schema":
          return this.parseSchemaExtension();
        case "scalar":
          return this.parseScalarTypeExtension();
        case "type":
          return this.parseObjectTypeExtension();
        case "interface":
          return this.parseInterfaceTypeExtension();
        case "union":
          return this.parseUnionTypeExtension();
        case "enum":
          return this.parseEnumTypeExtension();
        case "input":
          return this.parseInputObjectTypeExtension();
        case "directive":
          if (this._options.experimentalDirectivesOnDirectiveDefinitions) {
            return this.parseDirectiveDefinitionExtension();
          }
          break;
      }
    }
    throw this.unexpected(keywordToken);
  }
  parseSchemaExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("schema");
    const directives = this.parseConstDirectives();
    const operationTypes = this.optionalMany(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
    if (directives.length === 0 && operationTypes.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.SCHEMA_EXTENSION,
      directives,
      operationTypes
    });
  }
  parseScalarTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("scalar");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    if (directives.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.SCALAR_TYPE_EXTENSION,
      name,
      directives
    });
  }
  parseObjectTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("type");
    const name = this.parseName();
    const interfaces = this.parseImplementsInterfaces();
    const directives = this.parseConstDirectives();
    const fields = this.parseFieldsDefinition();
    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.OBJECT_TYPE_EXTENSION,
      name,
      interfaces,
      directives,
      fields
    });
  }
  parseInterfaceTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("interface");
    const name = this.parseName();
    const interfaces = this.parseImplementsInterfaces();
    const directives = this.parseConstDirectives();
    const fields = this.parseFieldsDefinition();
    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.INTERFACE_TYPE_EXTENSION,
      name,
      interfaces,
      directives,
      fields
    });
  }
  parseUnionTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("union");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const types = this.parseUnionMemberTypes();
    if (directives.length === 0 && types.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.UNION_TYPE_EXTENSION,
      name,
      directives,
      types
    });
  }
  parseEnumTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("enum");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const values = this.parseEnumValuesDefinition();
    if (directives.length === 0 && values.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.ENUM_TYPE_EXTENSION,
      name,
      directives,
      values
    });
  }
  parseInputObjectTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("input");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const fields = this.parseInputFieldsDefinition();
    if (directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
      name,
      directives,
      fields
    });
  }
  parseDirectiveDefinitionExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("directive");
    this.expectToken(TokenKind.AT);
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    if (directives.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.DIRECTIVE_EXTENSION,
      name,
      directives
    });
  }
  parseDirectiveDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("directive");
    this.expectToken(TokenKind.AT);
    const name = this.parseName();
    const args = this.parseArgumentDefs();
    const directives = this._options.experimentalDirectivesOnDirectiveDefinitions ? this.parseConstDirectives() : [];
    const repeatable = this.expectOptionalKeyword("repeatable");
    this.expectKeyword("on");
    const locations = this.parseDirectiveLocations();
    return this.node(start, {
      kind: Kind.DIRECTIVE_DEFINITION,
      description,
      name,
      arguments: args,
      directives,
      repeatable,
      locations
    });
  }
  parseDirectiveLocations() {
    return this.delimitedMany(TokenKind.PIPE, this.parseDirectiveLocation);
  }
  parseDirectiveLocation() {
    const start = this._lexer.token;
    const name = this.parseName();
    if (Object.prototype.hasOwnProperty.call(DirectiveLocation, name.value)) {
      return name;
    }
    throw this.unexpected(start);
  }
  parseSchemaCoordinate() {
    const start = this._lexer.token;
    const ofDirective = this.expectOptionalToken(TokenKind.AT);
    const name = this.parseName();
    let memberName;
    if (!ofDirective && this.expectOptionalToken(TokenKind.DOT)) {
      memberName = this.parseName();
    }
    let argumentName;
    if ((ofDirective || memberName) && this.expectOptionalToken(TokenKind.PAREN_L)) {
      argumentName = this.parseName();
      this.expectToken(TokenKind.COLON);
      this.expectToken(TokenKind.PAREN_R);
    }
    if (ofDirective) {
      if (argumentName) {
        return this.node(start, {
          kind: Kind.DIRECTIVE_ARGUMENT_COORDINATE,
          name,
          argumentName
        });
      }
      return this.node(start, {
        kind: Kind.DIRECTIVE_COORDINATE,
        name
      });
    } else if (memberName) {
      if (argumentName) {
        return this.node(start, {
          kind: Kind.ARGUMENT_COORDINATE,
          name,
          fieldName: memberName,
          argumentName
        });
      }
      return this.node(start, {
        kind: Kind.MEMBER_COORDINATE,
        name,
        memberName
      });
    }
    return this.node(start, {
      kind: Kind.TYPE_COORDINATE,
      name
    });
  }
  node(startToken, node) {
    if (this._options.noLocation !== true) {
      node.loc = new Location(startToken, this._lexer.lastToken, this._lexer.source);
    }
    return node;
  }
  peek(kind) {
    return this._lexer.token.kind === kind;
  }
  expectToken(kind) {
    const token = this._lexer.token;
    if (token.kind === kind) {
      this.advanceLexer();
      return token;
    }
    throw syntaxError(this._lexer.source, token.start, `Expected ${getTokenKindDesc(kind)}, found ${getTokenDesc(token)}.`);
  }
  expectOptionalToken(kind) {
    const token = this._lexer.token;
    if (token.kind === kind) {
      this.advanceLexer();
      return true;
    }
    return false;
  }
  expectKeyword(value) {
    const token = this._lexer.token;
    if (token.kind === TokenKind.NAME && token.value === value) {
      this.advanceLexer();
    } else {
      throw syntaxError(this._lexer.source, token.start, `Expected "${value}", found ${getTokenDesc(token)}.`);
    }
  }
  expectOptionalKeyword(value) {
    const token = this._lexer.token;
    if (token.kind === TokenKind.NAME && token.value === value) {
      this.advanceLexer();
      return true;
    }
    return false;
  }
  unexpected(atToken) {
    const token = atToken !== null && atToken !== undefined ? atToken : this._lexer.token;
    return syntaxError(this._lexer.source, token.start, `Unexpected ${getTokenDesc(token)}.`);
  }
  any(openKind, parseFn, closeKind) {
    this.expectToken(openKind);
    const nodes = [];
    while (!this.expectOptionalToken(closeKind)) {
      nodes.push(parseFn.call(this));
    }
    return nodes;
  }
  optionalMany(openKind, parseFn, closeKind) {
    if (this.expectOptionalToken(openKind)) {
      const nodes = [];
      do {
        nodes.push(parseFn.call(this));
      } while (!this.expectOptionalToken(closeKind));
      return nodes;
    }
    return [];
  }
  many(openKind, parseFn, closeKind) {
    this.expectToken(openKind);
    const nodes = [];
    do {
      nodes.push(parseFn.call(this));
    } while (!this.expectOptionalToken(closeKind));
    return nodes;
  }
  delimitedMany(delimiterKind, parseFn) {
    this.expectOptionalToken(delimiterKind);
    const nodes = [];
    do {
      nodes.push(parseFn.call(this));
    } while (this.expectOptionalToken(delimiterKind));
    return nodes;
  }
  advanceLexer() {
    const { maxLexicalTokens = this._options.maxTokens } = this._options;
    const token = this._lexer.advance();
    if (token.kind !== TokenKind.EOF) {
      ++this._tokenCounter;
      if (maxLexicalTokens !== undefined && this._tokenCounter > maxLexicalTokens) {
        throw syntaxError(this._lexer.source, token.start, `Document contains more that ${maxLexicalTokens} tokens. Parsing aborted.`);
      }
    }
  }
}
function getTokenDesc(token) {
  const value = token.value;
  return getTokenKindDesc(token.kind) + (value != null ? ` "${value}"` : "");
}
function getTokenKindDesc(kind) {
  return isPunctuatorTokenKind(kind) ? `"${kind}"` : kind;
}
// zveltio-extensions/node_modules/graphql/language/visitor.mjs
var BREAK = Object.freeze({});
function visit(root, visitor, visitorKeys = QueryDocumentKeys) {
  const enterLeaveMap = new Map;
  for (const kind of Object.values(Kind)) {
    enterLeaveMap.set(kind, getEnterLeaveForKind(visitor, kind));
  }
  let stack = undefined;
  let inArray = Array.isArray(root);
  let keys = [root];
  let index = -1;
  let edits = [];
  let node = root;
  let key = undefined;
  let parent = undefined;
  const path = [];
  const ancestors = [];
  do {
    index++;
    const isLeaving = index === keys.length;
    const isEdited = isLeaving && edits.length !== 0;
    if (isLeaving) {
      key = ancestors.length === 0 ? undefined : path[path.length - 1];
      node = parent;
      parent = ancestors.pop();
      if (isEdited) {
        if (inArray) {
          node = node.slice();
          let editOffset = 0;
          for (const [editKey, editValue] of edits) {
            const arrayKey = editKey - editOffset;
            if (editValue === null) {
              node.splice(arrayKey, 1);
              editOffset++;
            } else {
              node[arrayKey] = editValue;
            }
          }
        } else {
          node = { ...node };
          for (const [editKey, editValue] of edits) {
            node[editKey] = editValue;
          }
        }
      }
      index = stack.index;
      keys = stack.keys;
      edits = stack.edits;
      inArray = stack.inArray;
      stack = stack.prev;
    } else if (parent) {
      key = inArray ? index : keys[index];
      node = parent[key];
      if (node === null || node === undefined) {
        continue;
      }
      path.push(key);
    }
    let result;
    if (!Array.isArray(node)) {
      var _enterLeaveMap$get, _enterLeaveMap$get2;
      isNode(node) || devAssert(false, `Invalid AST Node: ${inspect(node)}.`);
      const visitFn = isLeaving ? (_enterLeaveMap$get = enterLeaveMap.get(node.kind)) === null || _enterLeaveMap$get === undefined ? undefined : _enterLeaveMap$get.leave : (_enterLeaveMap$get2 = enterLeaveMap.get(node.kind)) === null || _enterLeaveMap$get2 === undefined ? undefined : _enterLeaveMap$get2.enter;
      result = visitFn === null || visitFn === undefined ? undefined : visitFn.call(visitor, node, key, parent, path, ancestors);
      if (result === BREAK) {
        break;
      }
      if (result === false) {
        if (!isLeaving) {
          path.pop();
          continue;
        }
      } else if (result !== undefined) {
        edits.push([key, result]);
        if (!isLeaving) {
          if (isNode(result)) {
            node = result;
          } else {
            path.pop();
            continue;
          }
        }
      }
    }
    if (result === undefined && isEdited) {
      edits.push([key, node]);
    }
    if (isLeaving) {
      path.pop();
    } else {
      var _node$kind;
      stack = {
        inArray,
        index,
        keys,
        edits,
        prev: stack
      };
      inArray = Array.isArray(node);
      keys = inArray ? node : (_node$kind = visitorKeys[node.kind]) !== null && _node$kind !== undefined ? _node$kind : [];
      index = -1;
      edits = [];
      if (parent) {
        ancestors.push(parent);
      }
      parent = node;
    }
  } while (stack !== undefined);
  if (edits.length !== 0) {
    return edits[edits.length - 1][1];
  }
  return root;
}
function visitInParallel(visitors) {
  const skipping = new Array(visitors.length).fill(null);
  const mergedVisitor = Object.create(null);
  for (const kind of Object.values(Kind)) {
    let hasVisitor = false;
    const enterList = new Array(visitors.length).fill(undefined);
    const leaveList = new Array(visitors.length).fill(undefined);
    for (let i = 0;i < visitors.length; ++i) {
      const { enter, leave } = getEnterLeaveForKind(visitors[i], kind);
      hasVisitor || (hasVisitor = enter != null || leave != null);
      enterList[i] = enter;
      leaveList[i] = leave;
    }
    if (!hasVisitor) {
      continue;
    }
    const mergedEnterLeave = {
      enter(...args) {
        const node = args[0];
        for (let i = 0;i < visitors.length; i++) {
          if (skipping[i] === null) {
            var _enterList$i;
            const result = (_enterList$i = enterList[i]) === null || _enterList$i === undefined ? undefined : _enterList$i.apply(visitors[i], args);
            if (result === false) {
              skipping[i] = node;
            } else if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== undefined) {
              return result;
            }
          }
        }
      },
      leave(...args) {
        const node = args[0];
        for (let i = 0;i < visitors.length; i++) {
          if (skipping[i] === null) {
            var _leaveList$i;
            const result = (_leaveList$i = leaveList[i]) === null || _leaveList$i === undefined ? undefined : _leaveList$i.apply(visitors[i], args);
            if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== undefined && result !== false) {
              return result;
            }
          } else if (skipping[i] === node) {
            skipping[i] = null;
          }
        }
      }
    };
    mergedVisitor[kind] = mergedEnterLeave;
  }
  return mergedVisitor;
}
function getEnterLeaveForKind(visitor, kind) {
  const kindVisitor = visitor[kind];
  if (typeof kindVisitor === "object") {
    return kindVisitor;
  } else if (typeof kindVisitor === "function") {
    return {
      enter: kindVisitor,
      leave: undefined
    };
  }
  return {
    enter: visitor.enter,
    leave: visitor.leave
  };
}

// zveltio-extensions/node_modules/graphql/language/predicates.mjs
function isExecutableDefinitionNode(node) {
  return node.kind === Kind.OPERATION_DEFINITION || node.kind === Kind.FRAGMENT_DEFINITION;
}
function isTypeSystemDefinitionNode(node) {
  return node.kind === Kind.SCHEMA_DEFINITION || isTypeDefinitionNode(node) || node.kind === Kind.DIRECTIVE_DEFINITION;
}
function isTypeDefinitionNode(node) {
  return node.kind === Kind.SCALAR_TYPE_DEFINITION || node.kind === Kind.OBJECT_TYPE_DEFINITION || node.kind === Kind.INTERFACE_TYPE_DEFINITION || node.kind === Kind.UNION_TYPE_DEFINITION || node.kind === Kind.ENUM_TYPE_DEFINITION || node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION;
}
function isTypeSystemExtensionNode(node) {
  return node.kind === Kind.SCHEMA_EXTENSION || node.kind === Kind.DIRECTIVE_EXTENSION || isTypeExtensionNode(node);
}
function isTypeExtensionNode(node) {
  return node.kind === Kind.SCALAR_TYPE_EXTENSION || node.kind === Kind.OBJECT_TYPE_EXTENSION || node.kind === Kind.INTERFACE_TYPE_EXTENSION || node.kind === Kind.UNION_TYPE_EXTENSION || node.kind === Kind.ENUM_TYPE_EXTENSION || node.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION;
}
// zveltio-extensions/node_modules/graphql/jsutils/Path.mjs
function addPath(prev, key, typename) {
  return {
    prev,
    key,
    typename
  };
}
function pathToArray(path) {
  const flattened = [];
  let curr = path;
  while (curr) {
    flattened.push(curr.key);
    curr = curr.prev;
  }
  return flattened.reverse();
}

// zveltio-extensions/node_modules/graphql/jsutils/isPromise.mjs
function isPromise(value) {
  return typeof (value === null || value === undefined ? undefined : value.then) === "function";
}

// zveltio-extensions/node_modules/graphql/jsutils/memoize3.mjs
function memoize3(fn) {
  let cache0;
  return function memoized(a1, a2, a3) {
    if (cache0 === undefined) {
      cache0 = new WeakMap;
    }
    let cache1 = cache0.get(a1);
    if (cache1 === undefined) {
      cache1 = new WeakMap;
      cache0.set(a1, cache1);
    }
    let cache2 = cache1.get(a2);
    if (cache2 === undefined) {
      cache2 = new WeakMap;
      cache1.set(a2, cache2);
    }
    let fnResult = cache2.get(a3);
    if (fnResult === undefined) {
      fnResult = fn(a1, a2, a3);
      cache2.set(a3, fnResult);
    }
    return fnResult;
  };
}

// zveltio-extensions/node_modules/graphql/jsutils/promiseForObject.mjs
function promiseForObject(object) {
  return Promise.all(Object.values(object)).then((resolvedValues) => {
    const resolvedObject = Object.create(null);
    for (const [i, key] of Object.keys(object).entries()) {
      resolvedObject[key] = resolvedValues[i];
    }
    return resolvedObject;
  });
}

// zveltio-extensions/node_modules/graphql/jsutils/promiseReduce.mjs
function promiseReduce(values, callbackFn, initialValue) {
  let accumulator = initialValue;
  for (const value of values) {
    accumulator = isPromise(accumulator) ? accumulator.then((resolved) => callbackFn(resolved, value)) : callbackFn(accumulator, value);
  }
  return accumulator;
}

// zveltio-extensions/node_modules/graphql/jsutils/toError.mjs
function toError(thrownValue) {
  return thrownValue instanceof Error ? thrownValue : new NonErrorThrown(thrownValue);
}

class NonErrorThrown extends Error {
  constructor(thrownValue) {
    super("Unexpected error value: " + inspect(thrownValue));
    this.name = "NonErrorThrown";
    this.thrownValue = thrownValue;
  }
}

// zveltio-extensions/node_modules/graphql/error/locatedError.mjs
function locatedError(rawOriginalError, nodes, path) {
  var _nodes;
  const originalError = toError(rawOriginalError);
  if (isLocatedGraphQLError(originalError)) {
    return originalError;
  }
  return new GraphQLError(originalError.message, {
    nodes: (_nodes = originalError.nodes) !== null && _nodes !== undefined ? _nodes : nodes,
    source: originalError.source,
    positions: originalError.positions,
    path,
    originalError
  });
}
function isLocatedGraphQLError(error) {
  return Array.isArray(error.path);
}

// zveltio-extensions/node_modules/graphql/utilities/typeFromAST.mjs
function typeFromAST(schema, typeNode) {
  switch (typeNode.kind) {
    case Kind.LIST_TYPE: {
      const innerType = typeFromAST(schema, typeNode.type);
      return innerType && new GraphQLList(innerType);
    }
    case Kind.NON_NULL_TYPE: {
      const innerType = typeFromAST(schema, typeNode.type);
      return innerType && new GraphQLNonNull(innerType);
    }
    case Kind.NAMED_TYPE:
      return schema.getType(typeNode.name.value);
  }
}

// zveltio-extensions/node_modules/graphql/jsutils/printPathArray.mjs
function printPathArray(path) {
  return path.map((key) => typeof key === "number" ? "[" + key.toString() + "]" : "." + key).join("");
}

// zveltio-extensions/node_modules/graphql/utilities/coerceInputValue.mjs
function coerceInputValue(inputValue, type, onError = defaultOnError, hideSuggestions) {
  return coerceInputValueImpl(inputValue, type, onError, undefined, hideSuggestions);
}
function defaultOnError(path, invalidValue, error) {
  let errorPrefix = "Invalid value " + inspect(invalidValue);
  if (path.length > 0) {
    errorPrefix += ` at "value${printPathArray(path)}"`;
  }
  error.message = errorPrefix + ": " + error.message;
  throw error;
}
function coerceInputValueImpl(inputValue, type, onError, path, hideSuggestions) {
  if (isNonNullType(type)) {
    if (inputValue != null) {
      return coerceInputValueImpl(inputValue, type.ofType, onError, path, hideSuggestions);
    }
    onError(pathToArray(path), inputValue, new GraphQLError(`Expected non-nullable type "${inspect(type)}" not to be null.`));
    return;
  }
  if (inputValue == null) {
    return null;
  }
  if (isListType(type)) {
    const itemType = type.ofType;
    if (isIterableObject(inputValue)) {
      return Array.from(inputValue, (itemValue, index) => {
        const itemPath = addPath(path, index, undefined);
        return coerceInputValueImpl(itemValue, itemType, onError, itemPath, hideSuggestions);
      });
    }
    return [
      coerceInputValueImpl(inputValue, itemType, onError, path, hideSuggestions)
    ];
  }
  if (isInputObjectType(type)) {
    if (!isObjectLike(inputValue) || Array.isArray(inputValue)) {
      onError(pathToArray(path), inputValue, new GraphQLError(`Expected type "${type.name}" to be an object.`));
      return;
    }
    const coercedValue = Object.create(null);
    const fieldDefs = type.getFields();
    for (const field of Object.values(fieldDefs)) {
      const fieldValue = inputValue[field.name];
      if (fieldValue === undefined) {
        if (field.defaultValue !== undefined) {
          coercedValue[field.name] = field.defaultValue;
        } else if (isNonNullType(field.type)) {
          const typeStr = inspect(field.type);
          onError(pathToArray(path), inputValue, new GraphQLError(`Field "${field.name}" of required type "${typeStr}" was not provided.`));
        }
        continue;
      }
      coercedValue[field.name] = coerceInputValueImpl(fieldValue, field.type, onError, addPath(path, field.name, type.name), hideSuggestions);
    }
    for (const fieldName of Object.keys(inputValue)) {
      if (!fieldDefs[fieldName]) {
        const suggestions = hideSuggestions ? [] : suggestionList(fieldName, Object.keys(type.getFields()));
        onError(pathToArray(path), inputValue, new GraphQLError(`Field "${fieldName}" is not defined by type "${type.name}".` + didYouMean(suggestions)));
      }
    }
    if (type.isOneOf) {
      const keys = Object.keys(coercedValue);
      if (keys.length !== 1) {
        onError(pathToArray(path), inputValue, new GraphQLError(`Exactly one key must be specified for OneOf type "${type.name}".`));
      }
      const key = keys[0];
      const value = coercedValue[key];
      if (value === null) {
        onError(pathToArray(path).concat(key), value, new GraphQLError(`Field "${key}" must be non-null.`));
      }
    }
    return { ...coercedValue };
  }
  if (isLeafType(type)) {
    let parseResult;
    try {
      parseResult = isEnumType(type) ? type.parseValue(inputValue, hideSuggestions) : type.parseValue(inputValue);
    } catch (error) {
      if (error instanceof GraphQLError) {
        onError(pathToArray(path), inputValue, error);
      } else {
        onError(pathToArray(path), inputValue, new GraphQLError(`Expected type "${type.name}". ` + error.message, {
          originalError: error
        }));
      }
      return;
    }
    if (parseResult === undefined) {
      onError(pathToArray(path), inputValue, new GraphQLError(`Expected type "${type.name}".`));
    }
    return parseResult;
  }
  invariant(false, "Unexpected input type: " + inspect(type));
}

// zveltio-extensions/node_modules/graphql/utilities/valueFromAST.mjs
function valueFromAST(valueNode, type, variables) {
  if (!valueNode) {
    return;
  }
  if (valueNode.kind === Kind.VARIABLE) {
    const variableName = valueNode.name.value;
    if (variables == null || !hasOwnProperty(variables, variableName) || variables[variableName] === undefined) {
      return;
    }
    const variableValue = variables[variableName];
    if (variableValue === null && isNonNullType(type)) {
      return;
    }
    return variableValue;
  }
  if (isNonNullType(type)) {
    if (valueNode.kind === Kind.NULL) {
      return;
    }
    return valueFromAST(valueNode, type.ofType, variables);
  }
  if (valueNode.kind === Kind.NULL) {
    return null;
  }
  if (isListType(type)) {
    const itemType = type.ofType;
    if (valueNode.kind === Kind.LIST) {
      const coercedValues = [];
      for (const itemNode of valueNode.values) {
        if (isMissingVariable(itemNode, variables)) {
          if (isNonNullType(itemType)) {
            return;
          }
          coercedValues.push(null);
        } else {
          const itemValue = valueFromAST(itemNode, itemType, variables);
          if (itemValue === undefined) {
            return;
          }
          coercedValues.push(itemValue);
        }
      }
      return coercedValues;
    }
    const coercedValue = valueFromAST(valueNode, itemType, variables);
    if (coercedValue === undefined) {
      return;
    }
    return [coercedValue];
  }
  if (isInputObjectType(type)) {
    if (valueNode.kind !== Kind.OBJECT) {
      return;
    }
    const coercedObj = Object.create(null);
    const fieldNodes = keyMap(valueNode.fields, (field) => field.name.value);
    for (const field of Object.values(type.getFields())) {
      const fieldNode = fieldNodes[field.name];
      if (!fieldNode || isMissingVariable(fieldNode.value, variables)) {
        if (field.defaultValue !== undefined) {
          coercedObj[field.name] = field.defaultValue;
        } else if (isNonNullType(field.type)) {
          return;
        }
        continue;
      }
      const fieldValue = valueFromAST(fieldNode.value, field.type, variables);
      if (fieldValue === undefined) {
        return;
      }
      coercedObj[field.name] = fieldValue;
    }
    if (type.isOneOf) {
      const keys = Object.keys(coercedObj);
      if (keys.length !== 1) {
        return;
      }
      if (coercedObj[keys[0]] === null) {
        return;
      }
    }
    return coercedObj;
  }
  if (isLeafType(type)) {
    let result;
    try {
      result = type.parseLiteral(valueNode, variables);
    } catch (_error) {
      return;
    }
    if (result === undefined) {
      return;
    }
    return result;
  }
  invariant(false, "Unexpected input type: " + inspect(type));
}
function isMissingVariable(valueNode, variables) {
  return valueNode.kind === Kind.VARIABLE && (variables == null || !hasOwnProperty(variables, valueNode.name.value) || variables[valueNode.name.value] === undefined);
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

// zveltio-extensions/node_modules/graphql/execution/values.mjs
function getVariableValues(schema, varDefNodes, inputs, options) {
  const errors = [];
  const maxErrors = options === null || options === undefined ? undefined : options.maxErrors;
  try {
    const coerced = coerceVariableValues(schema, varDefNodes, inputs, (error) => {
      if (maxErrors != null && errors.length >= maxErrors) {
        throw new GraphQLError("Too many errors processing variables, error limit reached. Execution aborted.");
      }
      errors.push(error);
    }, options === null || options === undefined ? undefined : options.hideSuggestions);
    if (errors.length === 0) {
      return {
        coerced
      };
    }
  } catch (error) {
    errors.push(error);
  }
  return {
    errors
  };
}
function coerceVariableValues(schema, varDefNodes, inputs, onError, hideSuggestions) {
  const coercedValues = Object.create(null);
  for (const varDefNode of varDefNodes) {
    const varName = varDefNode.variable.name.value;
    const varType = typeFromAST(schema, varDefNode.type);
    if (!isInputType(varType)) {
      const varTypeStr = printForError(varDefNode.type);
      onError(new GraphQLError(`Variable "$${varName}" expected value of type "${varTypeStr}" which cannot be used as an input type.`, {
        nodes: varDefNode.type
      }));
      continue;
    }
    if (!hasOwnProperty2(inputs, varName)) {
      if (varDefNode.defaultValue) {
        coercedValues[varName] = valueFromAST(varDefNode.defaultValue, varType);
      } else if (isNonNullType(varType)) {
        const varTypeStr = inspect(varType);
        onError(new GraphQLError(`Variable "$${varName}" of required type "${varTypeStr}" was not provided.`, {
          nodes: varDefNode
        }));
      }
      continue;
    }
    const value = inputs[varName];
    if (value === null && isNonNullType(varType)) {
      const varTypeStr = inspect(varType);
      onError(new GraphQLError(`Variable "$${varName}" of non-null type "${varTypeStr}" must not be null.`, {
        nodes: varDefNode
      }));
      continue;
    }
    coercedValues[varName] = coerceInputValue(value, varType, (path, invalidValue, error) => {
      let prefix = `Variable "$${varName}" got invalid value ` + inspect(invalidValue);
      if (path.length > 0) {
        prefix += ` at "${varName}${printPathArray(path)}"`;
      }
      onError(new GraphQLError(prefix + "; " + error.message, {
        nodes: varDefNode,
        originalError: error
      }));
    }, hideSuggestions);
  }
  return { ...coercedValues };
}
function getArgumentValues(def, node, variableValues) {
  var _node$arguments;
  const coercedValues = Object.create(null);
  const argumentNodes = (_node$arguments = node.arguments) !== null && _node$arguments !== undefined ? _node$arguments : [];
  const argNodeMap = keyMap(argumentNodes, (arg) => arg.name.value);
  for (const argDef of def.args) {
    const name = argDef.name;
    const argType = argDef.type;
    const argumentNode = argNodeMap[name];
    if (!argumentNode) {
      if (argDef.defaultValue !== undefined) {
        coercedValues[name] = argDef.defaultValue;
      } else if (isNonNullType(argType)) {
        throw new GraphQLError(`Argument "${name}" of required type "${inspect(argType)}" ` + "was not provided.", {
          nodes: node
        });
      }
      continue;
    }
    const valueNode = argumentNode.value;
    let isNull = valueNode.kind === Kind.NULL;
    if (valueNode.kind === Kind.VARIABLE) {
      const variableName = valueNode.name.value;
      if (variableValues == null || !hasOwnProperty2(variableValues, variableName)) {
        if (argDef.defaultValue !== undefined) {
          coercedValues[name] = argDef.defaultValue;
        } else if (isNonNullType(argType)) {
          throw new GraphQLError(`Argument "${name}" of required type "${inspect(argType)}" ` + `was provided the variable "$${variableName}" which was not provided a runtime value.`, {
            nodes: valueNode
          });
        }
        continue;
      }
      isNull = variableValues[variableName] == null;
    }
    if (isNull && isNonNullType(argType)) {
      throw new GraphQLError(`Argument "${name}" of non-null type "${inspect(argType)}" ` + "must not be null.", {
        nodes: valueNode
      });
    }
    const coercedValue = valueFromAST(valueNode, argType, variableValues);
    if (coercedValue === undefined) {
      throw new GraphQLError(`Argument "${name}" has invalid value ${printForError(valueNode)}.`, {
        nodes: valueNode
      });
    }
    coercedValues[name] = coercedValue;
  }
  return { ...coercedValues };
}
function getDirectiveValues(directiveDef, node, variableValues) {
  var _node$directives;
  const directiveNode = (_node$directives = node.directives) === null || _node$directives === undefined ? undefined : _node$directives.find((directive) => directive.name.value === directiveDef.name);
  if (directiveNode) {
    return getArgumentValues(directiveDef, directiveNode, variableValues);
  }
}
function hasOwnProperty2(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

// zveltio-extensions/node_modules/graphql/execution/collectFields.mjs
function collectFields(schema, fragments, variableValues, runtimeType, selectionSet, onSelectionSet) {
  const fields = new Map;
  collectFieldsImpl(schema, fragments, variableValues, runtimeType, selectionSet, fields, new Set, onSelectionSet);
  return fields;
}
function collectSubfields(schema, fragments, variableValues, returnType, fieldNodes) {
  const subFieldNodes = new Map;
  const visitedFragmentNames = new Set;
  for (const node of fieldNodes) {
    if (node.selectionSet) {
      collectFieldsImpl(schema, fragments, variableValues, returnType, node.selectionSet, subFieldNodes, visitedFragmentNames);
    }
  }
  return subFieldNodes;
}
function collectFieldsImpl(schema, fragments, variableValues, runtimeType, selectionSet, fields, visitedFragmentNames, onSelectionSet) {
  onSelectionSet === null || onSelectionSet === undefined || onSelectionSet(selectionSet);
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case Kind.FIELD: {
        if (!shouldIncludeNode(variableValues, selection)) {
          continue;
        }
        const name = getFieldEntryKey(selection);
        const fieldList = fields.get(name);
        if (fieldList !== undefined) {
          fieldList.push(selection);
        } else {
          fields.set(name, [selection]);
        }
        break;
      }
      case Kind.INLINE_FRAGMENT: {
        if (!shouldIncludeNode(variableValues, selection) || !doesFragmentConditionMatch(schema, selection, runtimeType)) {
          continue;
        }
        collectFieldsImpl(schema, fragments, variableValues, runtimeType, selection.selectionSet, fields, visitedFragmentNames, onSelectionSet);
        break;
      }
      case Kind.FRAGMENT_SPREAD: {
        const fragName = selection.name.value;
        if (visitedFragmentNames.has(fragName) || !shouldIncludeNode(variableValues, selection)) {
          continue;
        }
        visitedFragmentNames.add(fragName);
        const fragment = fragments[fragName];
        if (!fragment || !doesFragmentConditionMatch(schema, fragment, runtimeType)) {
          continue;
        }
        collectFieldsImpl(schema, fragments, variableValues, runtimeType, fragment.selectionSet, fields, visitedFragmentNames, onSelectionSet);
        break;
      }
    }
  }
}
function shouldIncludeNode(variableValues, node) {
  const skip = getDirectiveValues(GraphQLSkipDirective, node, variableValues);
  if ((skip === null || skip === undefined ? undefined : skip.if) === true) {
    return false;
  }
  const include = getDirectiveValues(GraphQLIncludeDirective, node, variableValues);
  if ((include === null || include === undefined ? undefined : include.if) === false) {
    return false;
  }
  return true;
}
function doesFragmentConditionMatch(schema, fragment, type) {
  const typeConditionNode = fragment.typeCondition;
  if (!typeConditionNode) {
    return true;
  }
  const conditionalType = typeFromAST(schema, typeConditionNode);
  if (conditionalType === type) {
    return true;
  }
  if (isAbstractType(conditionalType)) {
    return schema.isSubType(conditionalType, type);
  }
  return false;
}
function getFieldEntryKey(node) {
  return node.alias ? node.alias.value : node.name.value;
}

// zveltio-extensions/node_modules/graphql/execution/execute.mjs
var collectSubfields2 = memoize3((exeContext, returnType, fieldNodes) => collectSubfields(exeContext.schema, exeContext.fragments, exeContext.variableValues, returnType, fieldNodes));

class CollectedErrors {
  constructor() {
    this._errorPositions = new Set;
    this._errors = [];
  }
  get errors() {
    return this._errors;
  }
  add(error, path) {
    if (this._hasNulledPosition(path)) {
      return;
    }
    this._errorPositions.add(path);
    this._errors.push(error);
  }
  _hasNulledPosition(startPath) {
    let path = startPath;
    while (path !== undefined) {
      if (this._errorPositions.has(path)) {
        return true;
      }
      path = path.prev;
    }
    return this._errorPositions.has(undefined);
  }
}
function execute(args) {
  arguments.length < 2 || devAssert(false, "graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead.");
  const { schema, document, variableValues, rootValue } = args;
  assertValidExecutionArguments(schema, document, variableValues);
  const exeContext = buildExecutionContext(args);
  if (!("schema" in exeContext)) {
    return {
      errors: exeContext
    };
  }
  try {
    const { operation } = exeContext;
    const result = executeOperation(exeContext, operation, rootValue);
    if (isPromise(result)) {
      return result.then((data) => buildResponse(data, exeContext.collectedErrors.errors), (error) => {
        exeContext.collectedErrors.add(error, undefined);
        return buildResponse(null, exeContext.collectedErrors.errors);
      });
    }
    return buildResponse(result, exeContext.collectedErrors.errors);
  } catch (error) {
    exeContext.collectedErrors.add(error, undefined);
    return buildResponse(null, exeContext.collectedErrors.errors);
  }
}
function buildResponse(data, errors) {
  return errors.length === 0 ? {
    data
  } : {
    errors,
    data
  };
}
function assertValidExecutionArguments(schema, document, rawVariableValues) {
  document || devAssert(false, "Must provide document.");
  assertValidSchema(schema);
  rawVariableValues == null || isObjectLike(rawVariableValues) || devAssert(false, "Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided.");
}
function buildExecutionContext(args) {
  var _definition$name, _operation$variableDe, _options$maxCoercionE, _args$hideSuggestions;
  const {
    schema,
    document,
    rootValue,
    contextValue,
    variableValues: rawVariableValues,
    operationName,
    fieldResolver,
    typeResolver,
    subscribeFieldResolver,
    options
  } = args;
  let operation;
  const fragments = Object.create(null);
  for (const definition of document.definitions) {
    switch (definition.kind) {
      case Kind.OPERATION_DEFINITION:
        if (operationName == null) {
          if (operation !== undefined) {
            return [
              new GraphQLError("Must provide operation name if query contains multiple operations.")
            ];
          }
          operation = definition;
        } else if (((_definition$name = definition.name) === null || _definition$name === undefined ? undefined : _definition$name.value) === operationName) {
          operation = definition;
        }
        break;
      case Kind.FRAGMENT_DEFINITION:
        fragments[definition.name.value] = definition;
        break;
      default:
    }
  }
  if (!operation) {
    if (operationName != null) {
      return [new GraphQLError(`Unknown operation named "${operationName}".`)];
    }
    return [new GraphQLError("Must provide an operation.")];
  }
  const variableDefinitions = (_operation$variableDe = operation.variableDefinitions) !== null && _operation$variableDe !== undefined ? _operation$variableDe : [];
  const coercedVariableValues = getVariableValues(schema, variableDefinitions, rawVariableValues !== null && rawVariableValues !== undefined ? rawVariableValues : {}, {
    maxErrors: (_options$maxCoercionE = options === null || options === undefined ? undefined : options.maxCoercionErrors) !== null && _options$maxCoercionE !== undefined ? _options$maxCoercionE : 50,
    hideSuggestions: (_args$hideSuggestions = args.hideSuggestions) !== null && _args$hideSuggestions !== undefined ? _args$hideSuggestions : false
  });
  if (coercedVariableValues.errors) {
    return coercedVariableValues.errors;
  }
  return {
    schema,
    fragments,
    rootValue,
    contextValue,
    operation,
    variableValues: coercedVariableValues.coerced,
    fieldResolver: fieldResolver !== null && fieldResolver !== undefined ? fieldResolver : defaultFieldResolver,
    typeResolver: typeResolver !== null && typeResolver !== undefined ? typeResolver : defaultTypeResolver,
    subscribeFieldResolver: subscribeFieldResolver !== null && subscribeFieldResolver !== undefined ? subscribeFieldResolver : defaultFieldResolver,
    collectedErrors: new CollectedErrors
  };
}
function executeOperation(exeContext, operation, rootValue) {
  const rootType = exeContext.schema.getRootType(operation.operation);
  if (rootType == null) {
    throw new GraphQLError(`Schema is not configured to execute ${operation.operation} operation.`, {
      nodes: operation
    });
  }
  const rootFields = collectFields(exeContext.schema, exeContext.fragments, exeContext.variableValues, rootType, operation.selectionSet);
  const path = undefined;
  switch (operation.operation) {
    case OperationTypeNode.QUERY:
      return executeFields(exeContext, rootType, rootValue, path, rootFields);
    case OperationTypeNode.MUTATION:
      return executeFieldsSerially(exeContext, rootType, rootValue, path, rootFields);
    case OperationTypeNode.SUBSCRIPTION:
      return executeFields(exeContext, rootType, rootValue, path, rootFields);
  }
}
function executeFieldsSerially(exeContext, parentType, sourceValue, path, fields) {
  return promiseReduce(fields.entries(), (results, [responseName, fieldNodes]) => {
    const fieldPath = addPath(path, responseName, parentType.name);
    const result = executeField(exeContext, parentType, sourceValue, fieldNodes, fieldPath);
    if (result === undefined) {
      return results;
    }
    if (isPromise(result)) {
      return result.then((resolvedResult) => {
        results[responseName] = resolvedResult;
        return results;
      });
    }
    results[responseName] = result;
    return results;
  }, Object.create(null));
}
function executeFields(exeContext, parentType, sourceValue, path, fields) {
  const results = Object.create(null);
  let containsPromise = false;
  try {
    for (const [responseName, fieldNodes] of fields.entries()) {
      const fieldPath = addPath(path, responseName, parentType.name);
      const result = executeField(exeContext, parentType, sourceValue, fieldNodes, fieldPath);
      if (result !== undefined) {
        results[responseName] = result;
        if (isPromise(result)) {
          containsPromise = true;
        }
      }
    }
  } catch (error) {
    if (containsPromise) {
      return promiseForObject(results).finally(() => {
        throw error;
      });
    }
    throw error;
  }
  if (!containsPromise) {
    return results;
  }
  return promiseForObject(results);
}
function executeField(exeContext, parentType, source, fieldNodes, path) {
  var _fieldDef$resolve;
  const fieldDef = getFieldDef(exeContext.schema, parentType, fieldNodes[0]);
  if (!fieldDef) {
    return;
  }
  const returnType = fieldDef.type;
  const resolveFn = (_fieldDef$resolve = fieldDef.resolve) !== null && _fieldDef$resolve !== undefined ? _fieldDef$resolve : exeContext.fieldResolver;
  const info = buildResolveInfo(exeContext, fieldDef, fieldNodes, parentType, path);
  try {
    const args = getArgumentValues(fieldDef, fieldNodes[0], exeContext.variableValues);
    const contextValue = exeContext.contextValue;
    const result = resolveFn(source, args, contextValue, info);
    let completed;
    if (isPromise(result)) {
      completed = result.then((resolved) => completeValue(exeContext, returnType, fieldNodes, info, path, resolved));
    } else {
      completed = completeValue(exeContext, returnType, fieldNodes, info, path, result);
    }
    if (isPromise(completed)) {
      return completed.then(undefined, (rawError) => {
        const error = locatedError(rawError, fieldNodes, pathToArray(path));
        return handleFieldError(error, returnType, path, exeContext);
      });
    }
    return completed;
  } catch (rawError) {
    const error = locatedError(rawError, fieldNodes, pathToArray(path));
    return handleFieldError(error, returnType, path, exeContext);
  }
}
function buildResolveInfo(exeContext, fieldDef, fieldNodes, parentType, path) {
  return {
    fieldName: fieldDef.name,
    fieldNodes,
    returnType: fieldDef.type,
    parentType,
    path,
    schema: exeContext.schema,
    fragments: exeContext.fragments,
    rootValue: exeContext.rootValue,
    operation: exeContext.operation,
    variableValues: exeContext.variableValues
  };
}
function handleFieldError(error, returnType, path, exeContext) {
  if (isNonNullType(returnType)) {
    throw error;
  }
  exeContext.collectedErrors.add(error, path);
  return null;
}
function completeValue(exeContext, returnType, fieldNodes, info, path, result) {
  if (result instanceof Error) {
    throw result;
  }
  if (isNonNullType(returnType)) {
    const completed = completeValue(exeContext, returnType.ofType, fieldNodes, info, path, result);
    if (completed === null) {
      throw new Error(`Cannot return null for non-nullable field ${info.parentType.name}.${info.fieldName}.`);
    }
    return completed;
  }
  if (result == null) {
    return null;
  }
  if (isListType(returnType)) {
    return completeListValue(exeContext, returnType, fieldNodes, info, path, result);
  }
  if (isLeafType(returnType)) {
    return completeLeafValue(returnType, result);
  }
  if (isAbstractType(returnType)) {
    return completeAbstractValue(exeContext, returnType, fieldNodes, info, path, result);
  }
  if (isObjectType(returnType)) {
    return completeObjectValue(exeContext, returnType, fieldNodes, info, path, result);
  }
  invariant(false, "Cannot complete value of unexpected output type: " + inspect(returnType));
}
function completeListValue(exeContext, returnType, fieldNodes, info, path, result) {
  if (!isIterableObject(result)) {
    throw new GraphQLError(`Expected Iterable, but did not find one for field "${info.parentType.name}.${info.fieldName}".`);
  }
  const itemType = returnType.ofType;
  let containsPromise = false;
  const completedResults = Array.from(result, (item, index) => {
    const itemPath = addPath(path, index, undefined);
    try {
      let completedItem;
      if (isPromise(item)) {
        completedItem = item.then((resolved) => completeValue(exeContext, itemType, fieldNodes, info, itemPath, resolved));
      } else {
        completedItem = completeValue(exeContext, itemType, fieldNodes, info, itemPath, item);
      }
      if (isPromise(completedItem)) {
        containsPromise = true;
        return completedItem.then(undefined, (rawError) => {
          const error = locatedError(rawError, fieldNodes, pathToArray(itemPath));
          return handleFieldError(error, itemType, itemPath, exeContext);
        });
      }
      return completedItem;
    } catch (rawError) {
      const error = locatedError(rawError, fieldNodes, pathToArray(itemPath));
      return handleFieldError(error, itemType, itemPath, exeContext);
    }
  });
  return containsPromise ? Promise.all(completedResults) : completedResults;
}
function completeLeafValue(returnType, result) {
  const serializedResult = returnType.serialize(result);
  if (serializedResult == null) {
    throw new Error(`Expected \`${inspect(returnType)}.serialize(${inspect(result)})\` to ` + `return non-nullable value, returned: ${inspect(serializedResult)}`);
  }
  return serializedResult;
}
function completeAbstractValue(exeContext, returnType, fieldNodes, info, path, result) {
  var _returnType$resolveTy;
  const resolveTypeFn = (_returnType$resolveTy = returnType.resolveType) !== null && _returnType$resolveTy !== undefined ? _returnType$resolveTy : exeContext.typeResolver;
  const contextValue = exeContext.contextValue;
  const runtimeType = resolveTypeFn(result, contextValue, info, returnType);
  if (isPromise(runtimeType)) {
    return runtimeType.then((resolvedRuntimeType) => completeObjectValue(exeContext, ensureValidRuntimeType(resolvedRuntimeType, exeContext, returnType, fieldNodes, info, result), fieldNodes, info, path, result));
  }
  return completeObjectValue(exeContext, ensureValidRuntimeType(runtimeType, exeContext, returnType, fieldNodes, info, result), fieldNodes, info, path, result);
}
function ensureValidRuntimeType(runtimeTypeName, exeContext, returnType, fieldNodes, info, result) {
  if (runtimeTypeName == null) {
    throw new GraphQLError(`Abstract type "${returnType.name}" must resolve to an Object type at runtime for field "${info.parentType.name}.${info.fieldName}". Either the "${returnType.name}" type should provide a "resolveType" function or each possible type should provide an "isTypeOf" function.`, fieldNodes);
  }
  if (isObjectType(runtimeTypeName)) {
    throw new GraphQLError("Support for returning GraphQLObjectType from resolveType was removed in graphql-js@16.0.0 please return type name instead.");
  }
  if (typeof runtimeTypeName !== "string") {
    throw new GraphQLError(`Abstract type "${returnType.name}" must resolve to an Object type at runtime for field "${info.parentType.name}.${info.fieldName}" with ` + `value ${inspect(result)}, received "${inspect(runtimeTypeName)}".`);
  }
  const runtimeType = exeContext.schema.getType(runtimeTypeName);
  if (runtimeType == null) {
    throw new GraphQLError(`Abstract type "${returnType.name}" was resolved to a type "${runtimeTypeName}" that does not exist inside the schema.`, {
      nodes: fieldNodes
    });
  }
  if (!isObjectType(runtimeType)) {
    throw new GraphQLError(`Abstract type "${returnType.name}" was resolved to a non-object type "${runtimeTypeName}".`, {
      nodes: fieldNodes
    });
  }
  if (!exeContext.schema.isSubType(returnType, runtimeType)) {
    throw new GraphQLError(`Runtime Object type "${runtimeType.name}" is not a possible type for "${returnType.name}".`, {
      nodes: fieldNodes
    });
  }
  return runtimeType;
}
function completeObjectValue(exeContext, returnType, fieldNodes, info, path, result) {
  const subFieldNodes = collectSubfields2(exeContext, returnType, fieldNodes);
  if (returnType.isTypeOf) {
    const isTypeOf = returnType.isTypeOf(result, exeContext.contextValue, info);
    if (isPromise(isTypeOf)) {
      return isTypeOf.then((resolvedIsTypeOf) => {
        if (!resolvedIsTypeOf) {
          throw invalidReturnTypeError(returnType, result, fieldNodes);
        }
        return executeFields(exeContext, returnType, result, path, subFieldNodes);
      });
    }
    if (!isTypeOf) {
      throw invalidReturnTypeError(returnType, result, fieldNodes);
    }
  }
  return executeFields(exeContext, returnType, result, path, subFieldNodes);
}
function invalidReturnTypeError(returnType, result, fieldNodes) {
  return new GraphQLError(`Expected value of type "${returnType.name}" but got: ${inspect(result)}.`, {
    nodes: fieldNodes
  });
}
var defaultTypeResolver = function(value, contextValue, info, abstractType) {
  if (isObjectLike(value) && typeof value.__typename === "string") {
    return value.__typename;
  }
  const possibleTypes = info.schema.getPossibleTypes(abstractType);
  const promisedIsTypeOfResults = [];
  try {
    for (let i = 0;i < possibleTypes.length; i++) {
      const type = possibleTypes[i];
      if (type.isTypeOf) {
        const isTypeOfResult = type.isTypeOf(value, contextValue, info);
        if (isPromise(isTypeOfResult)) {
          promisedIsTypeOfResults[i] = isTypeOfResult;
        } else if (isTypeOfResult) {
          if (promisedIsTypeOfResults.length) {
            Promise.allSettled(promisedIsTypeOfResults).catch(() => {});
          }
          return type.name;
        }
      }
    }
  } catch (error) {
    if (promisedIsTypeOfResults.length) {
      return Promise.allSettled(promisedIsTypeOfResults).then(() => {
        throw error;
      });
    }
    throw error;
  }
  if (promisedIsTypeOfResults.length) {
    return Promise.all(promisedIsTypeOfResults).then((isTypeOfResults) => {
      for (let i = 0;i < isTypeOfResults.length; i++) {
        if (isTypeOfResults[i]) {
          return possibleTypes[i].name;
        }
      }
    });
  }
};
var defaultFieldResolver = function(source, args, contextValue, info) {
  if (isObjectLike(source) || typeof source === "function") {
    const property = source[info.fieldName];
    if (typeof property === "function") {
      return source[info.fieldName](args, contextValue, info);
    }
    return property;
  }
};
function getFieldDef(schema, parentType, fieldNode) {
  const fieldName = fieldNode.name.value;
  if (fieldName === SchemaMetaFieldDef.name && schema.getQueryType() === parentType) {
    return SchemaMetaFieldDef;
  } else if (fieldName === TypeMetaFieldDef.name && schema.getQueryType() === parentType) {
    return TypeMetaFieldDef;
  } else if (fieldName === TypeNameMetaFieldDef.name) {
    return TypeNameMetaFieldDef;
  }
  return parentType.getFields()[fieldName];
}
// zveltio-extensions/node_modules/graphql/utilities/TypeInfo.mjs
class TypeInfo {
  constructor(schema, initialType, getFieldDefFn) {
    this._schema = schema;
    this._typeStack = [];
    this._parentTypeStack = [];
    this._inputTypeStack = [];
    this._fieldDefStack = [];
    this._defaultValueStack = [];
    this._directive = null;
    this._argument = null;
    this._enumValue = null;
    this._getFieldDef = getFieldDefFn !== null && getFieldDefFn !== undefined ? getFieldDefFn : getFieldDef2;
    if (initialType) {
      if (isInputType(initialType)) {
        this._inputTypeStack.push(initialType);
      }
      if (isCompositeType(initialType)) {
        this._parentTypeStack.push(initialType);
      }
      if (isOutputType(initialType)) {
        this._typeStack.push(initialType);
      }
    }
  }
  get [Symbol.toStringTag]() {
    return "TypeInfo";
  }
  getType() {
    if (this._typeStack.length > 0) {
      return this._typeStack[this._typeStack.length - 1];
    }
  }
  getParentType() {
    if (this._parentTypeStack.length > 0) {
      return this._parentTypeStack[this._parentTypeStack.length - 1];
    }
  }
  getInputType() {
    if (this._inputTypeStack.length > 0) {
      return this._inputTypeStack[this._inputTypeStack.length - 1];
    }
  }
  getParentInputType() {
    if (this._inputTypeStack.length > 1) {
      return this._inputTypeStack[this._inputTypeStack.length - 2];
    }
  }
  getFieldDef() {
    if (this._fieldDefStack.length > 0) {
      return this._fieldDefStack[this._fieldDefStack.length - 1];
    }
  }
  getDefaultValue() {
    if (this._defaultValueStack.length > 0) {
      return this._defaultValueStack[this._defaultValueStack.length - 1];
    }
  }
  getDirective() {
    return this._directive;
  }
  getArgument() {
    return this._argument;
  }
  getEnumValue() {
    return this._enumValue;
  }
  enter(node) {
    const schema = this._schema;
    switch (node.kind) {
      case Kind.SELECTION_SET: {
        const namedType = getNamedType(this.getType());
        this._parentTypeStack.push(isCompositeType(namedType) ? namedType : undefined);
        break;
      }
      case Kind.FIELD: {
        const parentType = this.getParentType();
        let fieldDef;
        let fieldType;
        if (parentType) {
          fieldDef = this._getFieldDef(schema, parentType, node);
          if (fieldDef) {
            fieldType = fieldDef.type;
          }
        }
        this._fieldDefStack.push(fieldDef);
        this._typeStack.push(isOutputType(fieldType) ? fieldType : undefined);
        break;
      }
      case Kind.DIRECTIVE:
        this._directive = schema.getDirective(node.name.value);
        break;
      case Kind.OPERATION_DEFINITION: {
        const rootType = schema.getRootType(node.operation);
        this._typeStack.push(isObjectType(rootType) ? rootType : undefined);
        break;
      }
      case Kind.INLINE_FRAGMENT:
      case Kind.FRAGMENT_DEFINITION: {
        const typeConditionAST = node.typeCondition;
        const outputType = typeConditionAST ? typeFromAST(schema, typeConditionAST) : getNamedType(this.getType());
        this._typeStack.push(isOutputType(outputType) ? outputType : undefined);
        break;
      }
      case Kind.VARIABLE_DEFINITION: {
        const inputType = typeFromAST(schema, node.type);
        this._inputTypeStack.push(isInputType(inputType) ? inputType : undefined);
        break;
      }
      case Kind.ARGUMENT: {
        var _this$getDirective;
        let argDef;
        let argType;
        const fieldOrDirective = (_this$getDirective = this.getDirective()) !== null && _this$getDirective !== undefined ? _this$getDirective : this.getFieldDef();
        if (fieldOrDirective) {
          argDef = fieldOrDirective.args.find((arg) => arg.name === node.name.value);
          if (argDef) {
            argType = argDef.type;
          }
        }
        this._argument = argDef;
        this._defaultValueStack.push(argDef ? argDef.defaultValue : undefined);
        this._inputTypeStack.push(isInputType(argType) ? argType : undefined);
        break;
      }
      case Kind.LIST: {
        const listType = getNullableType(this.getInputType());
        const itemType = isListType(listType) ? listType.ofType : listType;
        this._defaultValueStack.push(undefined);
        this._inputTypeStack.push(isInputType(itemType) ? itemType : undefined);
        break;
      }
      case Kind.OBJECT_FIELD: {
        const objectType = getNamedType(this.getInputType());
        let inputFieldType;
        let inputField;
        if (isInputObjectType(objectType)) {
          inputField = objectType.getFields()[node.name.value];
          if (inputField) {
            inputFieldType = inputField.type;
          }
        }
        this._defaultValueStack.push(inputField ? inputField.defaultValue : undefined);
        this._inputTypeStack.push(isInputType(inputFieldType) ? inputFieldType : undefined);
        break;
      }
      case Kind.ENUM: {
        const enumType = getNamedType(this.getInputType());
        let enumValue;
        if (isEnumType(enumType)) {
          enumValue = enumType.getValue(node.value);
        }
        this._enumValue = enumValue;
        break;
      }
      default:
    }
  }
  leave(node) {
    switch (node.kind) {
      case Kind.SELECTION_SET:
        this._parentTypeStack.pop();
        break;
      case Kind.FIELD:
        this._fieldDefStack.pop();
        this._typeStack.pop();
        break;
      case Kind.DIRECTIVE:
        this._directive = null;
        break;
      case Kind.OPERATION_DEFINITION:
      case Kind.INLINE_FRAGMENT:
      case Kind.FRAGMENT_DEFINITION:
        this._typeStack.pop();
        break;
      case Kind.VARIABLE_DEFINITION:
        this._inputTypeStack.pop();
        break;
      case Kind.ARGUMENT:
        this._argument = null;
        this._defaultValueStack.pop();
        this._inputTypeStack.pop();
        break;
      case Kind.LIST:
      case Kind.OBJECT_FIELD:
        this._defaultValueStack.pop();
        this._inputTypeStack.pop();
        break;
      case Kind.ENUM:
        this._enumValue = null;
        break;
      default:
    }
  }
}
function getFieldDef2(schema, parentType, fieldNode) {
  const name = fieldNode.name.value;
  if (name === SchemaMetaFieldDef.name && schema.getQueryType() === parentType) {
    return SchemaMetaFieldDef;
  }
  if (name === TypeMetaFieldDef.name && schema.getQueryType() === parentType) {
    return TypeMetaFieldDef;
  }
  if (name === TypeNameMetaFieldDef.name && isCompositeType(parentType)) {
    return TypeNameMetaFieldDef;
  }
  if (isObjectType(parentType) || isInterfaceType(parentType)) {
    return parentType.getFields()[name];
  }
}
function visitWithTypeInfo(typeInfo, visitor) {
  return {
    enter(...args) {
      const node = args[0];
      typeInfo.enter(node);
      const fn = getEnterLeaveForKind(visitor, node.kind).enter;
      if (fn) {
        const result = fn.apply(visitor, args);
        if (result !== undefined) {
          typeInfo.leave(node);
          if (isNode(result)) {
            typeInfo.enter(result);
          }
        }
        return result;
      }
    },
    leave(...args) {
      const node = args[0];
      const fn = getEnterLeaveForKind(visitor, node.kind).leave;
      let result;
      if (fn) {
        result = fn.apply(visitor, args);
      }
      typeInfo.leave(node);
      return result;
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/ExecutableDefinitionsRule.mjs
function ExecutableDefinitionsRule(context) {
  return {
    Document(node) {
      for (const definition of node.definitions) {
        if (!isExecutableDefinitionNode(definition)) {
          const defName = definition.kind === Kind.SCHEMA_DEFINITION || definition.kind === Kind.SCHEMA_EXTENSION ? "schema" : '"' + definition.name.value + '"';
          context.reportError(new GraphQLError(`The ${defName} definition is not executable.`, {
            nodes: definition
          }));
        }
      }
      return false;
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/FieldsOnCorrectTypeRule.mjs
function FieldsOnCorrectTypeRule(context) {
  return {
    Field(node) {
      const type = context.getParentType();
      if (type) {
        const fieldDef = context.getFieldDef();
        if (!fieldDef) {
          const schema = context.getSchema();
          const fieldName = node.name.value;
          let suggestion = didYouMean("to use an inline fragment on", context.hideSuggestions ? [] : getSuggestedTypeNames(schema, type, fieldName));
          if (suggestion === "") {
            suggestion = didYouMean(context.hideSuggestions ? [] : getSuggestedFieldNames(type, fieldName));
          }
          context.reportError(new GraphQLError(`Cannot query field "${fieldName}" on type "${type.name}".` + suggestion, {
            nodes: node
          }));
        }
      }
    }
  };
}
function getSuggestedTypeNames(schema, type, fieldName) {
  if (!isAbstractType(type)) {
    return [];
  }
  const suggestedTypes = new Set;
  const usageCount = Object.create(null);
  for (const possibleType of schema.getPossibleTypes(type)) {
    if (!possibleType.getFields()[fieldName]) {
      continue;
    }
    suggestedTypes.add(possibleType);
    usageCount[possibleType.name] = 1;
    for (const possibleInterface of possibleType.getInterfaces()) {
      var _usageCount$possibleI;
      if (!possibleInterface.getFields()[fieldName]) {
        continue;
      }
      suggestedTypes.add(possibleInterface);
      usageCount[possibleInterface.name] = ((_usageCount$possibleI = usageCount[possibleInterface.name]) !== null && _usageCount$possibleI !== undefined ? _usageCount$possibleI : 0) + 1;
    }
  }
  return [...suggestedTypes].sort((typeA, typeB) => {
    const usageCountDiff = usageCount[typeB.name] - usageCount[typeA.name];
    if (usageCountDiff !== 0) {
      return usageCountDiff;
    }
    if (isInterfaceType(typeA) && schema.isSubType(typeA, typeB)) {
      return -1;
    }
    if (isInterfaceType(typeB) && schema.isSubType(typeB, typeA)) {
      return 1;
    }
    return naturalCompare(typeA.name, typeB.name);
  }).map((x) => x.name);
}
function getSuggestedFieldNames(type, fieldName) {
  if (isObjectType(type) || isInterfaceType(type)) {
    const possibleFieldNames = Object.keys(type.getFields());
    return suggestionList(fieldName, possibleFieldNames);
  }
  return [];
}

// zveltio-extensions/node_modules/graphql/validation/rules/FragmentsOnCompositeTypesRule.mjs
function FragmentsOnCompositeTypesRule(context) {
  return {
    InlineFragment(node) {
      const typeCondition = node.typeCondition;
      if (typeCondition) {
        const type = typeFromAST(context.getSchema(), typeCondition);
        if (type && !isCompositeType(type)) {
          const typeStr = print(typeCondition);
          context.reportError(new GraphQLError(`Fragment cannot condition on non composite type "${typeStr}".`, {
            nodes: typeCondition
          }));
        }
      }
    },
    FragmentDefinition(node) {
      const type = typeFromAST(context.getSchema(), node.typeCondition);
      if (type && !isCompositeType(type)) {
        const typeStr = print(node.typeCondition);
        context.reportError(new GraphQLError(`Fragment "${node.name.value}" cannot condition on non composite type "${typeStr}".`, {
          nodes: node.typeCondition
        }));
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/KnownArgumentNamesRule.mjs
function KnownArgumentNamesRule(context) {
  return {
    ...KnownArgumentNamesOnDirectivesRule(context),
    Argument(argNode) {
      const argDef = context.getArgument();
      const fieldDef = context.getFieldDef();
      const parentType = context.getParentType();
      if (!argDef && fieldDef && parentType) {
        const argName = argNode.name.value;
        const suggestions = context.hideSuggestions ? [] : suggestionList(argName, fieldDef.args.map((arg) => arg.name));
        context.reportError(new GraphQLError(`Unknown argument "${argName}" on field "${parentType.name}.${fieldDef.name}".` + didYouMean(suggestions), {
          nodes: argNode
        }));
      }
    }
  };
}
function KnownArgumentNamesOnDirectivesRule(context) {
  const directiveArgs = Object.create(null);
  const schema = context.getSchema();
  const definedDirectives = schema ? schema.getDirectives() : specifiedDirectives;
  for (const directive of definedDirectives) {
    directiveArgs[directive.name] = new Set(directive.args.map((arg) => arg.name));
  }
  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      var _def$arguments;
      const argsNodes = (_def$arguments = def.arguments) !== null && _def$arguments !== undefined ? _def$arguments : [];
      directiveArgs[def.name.value] = new Set(argsNodes.map((arg) => arg.name.value));
    }
  }
  return {
    Directive(directiveNode) {
      const directiveName = directiveNode.name.value;
      const knownArgs = directiveArgs[directiveName];
      if (directiveNode.arguments && knownArgs) {
        for (const argNode of directiveNode.arguments) {
          const argName = argNode.name.value;
          if (!knownArgs.has(argName)) {
            const suggestions = context.hideSuggestions ? [] : suggestionList(argName, Array.from(knownArgs));
            context.reportError(new GraphQLError(`Unknown argument "${argName}" on directive "@${directiveName}".` + (context.hideSuggestions ? "" : didYouMean(suggestions)), {
              nodes: argNode
            }));
          }
        }
      }
      return false;
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/KnownDirectivesRule.mjs
function KnownDirectivesRule(context) {
  const locationsMap = Object.create(null);
  const schema = context.getSchema();
  const definedDirectives = schema ? schema.getDirectives() : specifiedDirectives;
  for (const directive of definedDirectives) {
    locationsMap[directive.name] = directive.locations;
  }
  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      locationsMap[def.name.value] = def.locations.map((name) => name.value);
    }
  }
  return {
    Directive(node, _key, _parent, _path, ancestors) {
      const name = node.name.value;
      const locations = locationsMap[name];
      if (!locations) {
        context.reportError(new GraphQLError(`Unknown directive "@${name}".`, {
          nodes: node
        }));
        return;
      }
      const candidateLocation = getDirectiveLocationForASTPath(ancestors);
      if (candidateLocation && !locations.includes(candidateLocation)) {
        context.reportError(new GraphQLError(`Directive "@${name}" may not be used on ${candidateLocation}.`, {
          nodes: node
        }));
      }
    }
  };
}
function getDirectiveLocationForASTPath(ancestors) {
  const appliedTo = ancestors[ancestors.length - 1];
  "kind" in appliedTo || invariant(false);
  switch (appliedTo.kind) {
    case Kind.OPERATION_DEFINITION:
      return getDirectiveLocationForOperation(appliedTo.operation);
    case Kind.FIELD:
      return DirectiveLocation.FIELD;
    case Kind.FRAGMENT_SPREAD:
      return DirectiveLocation.FRAGMENT_SPREAD;
    case Kind.INLINE_FRAGMENT:
      return DirectiveLocation.INLINE_FRAGMENT;
    case Kind.FRAGMENT_DEFINITION:
      return DirectiveLocation.FRAGMENT_DEFINITION;
    case Kind.VARIABLE_DEFINITION:
      return DirectiveLocation.VARIABLE_DEFINITION;
    case Kind.SCHEMA_DEFINITION:
    case Kind.SCHEMA_EXTENSION:
      return DirectiveLocation.SCHEMA;
    case Kind.SCALAR_TYPE_DEFINITION:
    case Kind.SCALAR_TYPE_EXTENSION:
      return DirectiveLocation.SCALAR;
    case Kind.OBJECT_TYPE_DEFINITION:
    case Kind.OBJECT_TYPE_EXTENSION:
      return DirectiveLocation.OBJECT;
    case Kind.FIELD_DEFINITION:
      return DirectiveLocation.FIELD_DEFINITION;
    case Kind.INTERFACE_TYPE_DEFINITION:
    case Kind.INTERFACE_TYPE_EXTENSION:
      return DirectiveLocation.INTERFACE;
    case Kind.UNION_TYPE_DEFINITION:
    case Kind.UNION_TYPE_EXTENSION:
      return DirectiveLocation.UNION;
    case Kind.ENUM_TYPE_DEFINITION:
    case Kind.ENUM_TYPE_EXTENSION:
      return DirectiveLocation.ENUM;
    case Kind.ENUM_VALUE_DEFINITION:
      return DirectiveLocation.ENUM_VALUE;
    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
    case Kind.INPUT_OBJECT_TYPE_EXTENSION:
      return DirectiveLocation.INPUT_OBJECT;
    case Kind.INPUT_VALUE_DEFINITION: {
      const parentNode = ancestors[ancestors.length - 3];
      "kind" in parentNode || invariant(false);
      return parentNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ? DirectiveLocation.INPUT_FIELD_DEFINITION : DirectiveLocation.ARGUMENT_DEFINITION;
    }
    case Kind.DIRECTIVE_DEFINITION:
    case Kind.DIRECTIVE_EXTENSION:
      return DirectiveLocation.DIRECTIVE_DEFINITION;
    default:
      invariant(false, "Unexpected kind: " + inspect(appliedTo.kind));
  }
}
function getDirectiveLocationForOperation(operation) {
  switch (operation) {
    case OperationTypeNode.QUERY:
      return DirectiveLocation.QUERY;
    case OperationTypeNode.MUTATION:
      return DirectiveLocation.MUTATION;
    case OperationTypeNode.SUBSCRIPTION:
      return DirectiveLocation.SUBSCRIPTION;
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/KnownFragmentNamesRule.mjs
function KnownFragmentNamesRule(context) {
  return {
    FragmentSpread(node) {
      const fragmentName = node.name.value;
      const fragment = context.getFragment(fragmentName);
      if (!fragment) {
        context.reportError(new GraphQLError(`Unknown fragment "${fragmentName}".`, {
          nodes: node.name
        }));
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/KnownTypeNamesRule.mjs
function KnownTypeNamesRule(context) {
  const schema = context.getSchema();
  const existingTypesMap = schema ? schema.getTypeMap() : Object.create(null);
  const definedTypes = Object.create(null);
  for (const def of context.getDocument().definitions) {
    if (isTypeDefinitionNode(def)) {
      definedTypes[def.name.value] = true;
    }
  }
  const typeNames = [
    ...Object.keys(existingTypesMap),
    ...Object.keys(definedTypes)
  ];
  return {
    NamedType(node, _1, parent, _2, ancestors) {
      const typeName = node.name.value;
      if (!existingTypesMap[typeName] && !definedTypes[typeName]) {
        var _ancestors$;
        const definitionNode = (_ancestors$ = ancestors[2]) !== null && _ancestors$ !== undefined ? _ancestors$ : parent;
        const isSDL = definitionNode != null && isSDLNode(definitionNode);
        if (isSDL && standardTypeNames.includes(typeName)) {
          return;
        }
        const suggestedTypes = context.hideSuggestions ? [] : suggestionList(typeName, isSDL ? standardTypeNames.concat(typeNames) : typeNames);
        context.reportError(new GraphQLError(`Unknown type "${typeName}".` + didYouMean(suggestedTypes), {
          nodes: node
        }));
      }
    }
  };
}
var standardTypeNames = [...specifiedScalarTypes, ...introspectionTypes].map((type) => type.name);
function isSDLNode(value) {
  return "kind" in value && (isTypeSystemDefinitionNode(value) || isTypeSystemExtensionNode(value));
}

// zveltio-extensions/node_modules/graphql/validation/rules/LoneAnonymousOperationRule.mjs
function LoneAnonymousOperationRule(context) {
  let operationCount = 0;
  return {
    Document(node) {
      operationCount = node.definitions.filter((definition) => definition.kind === Kind.OPERATION_DEFINITION).length;
    },
    OperationDefinition(node) {
      if (!node.name && operationCount > 1) {
        context.reportError(new GraphQLError("This anonymous operation must be the only defined operation.", {
          nodes: node
        }));
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/LoneSchemaDefinitionRule.mjs
function LoneSchemaDefinitionRule(context) {
  var _ref, _ref2, _oldSchema$astNode;
  const oldSchema = context.getSchema();
  const alreadyDefined = (_ref = (_ref2 = (_oldSchema$astNode = oldSchema === null || oldSchema === undefined ? undefined : oldSchema.astNode) !== null && _oldSchema$astNode !== undefined ? _oldSchema$astNode : oldSchema === null || oldSchema === undefined ? undefined : oldSchema.getQueryType()) !== null && _ref2 !== undefined ? _ref2 : oldSchema === null || oldSchema === undefined ? undefined : oldSchema.getMutationType()) !== null && _ref !== undefined ? _ref : oldSchema === null || oldSchema === undefined ? undefined : oldSchema.getSubscriptionType();
  let schemaDefinitionsCount = 0;
  return {
    SchemaDefinition(node) {
      if (alreadyDefined) {
        context.reportError(new GraphQLError("Cannot define a new schema within a schema extension.", {
          nodes: node
        }));
        return;
      }
      if (schemaDefinitionsCount > 0) {
        context.reportError(new GraphQLError("Must provide only one schema definition.", {
          nodes: node
        }));
      }
      ++schemaDefinitionsCount;
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/MaxIntrospectionDepthRule.mjs
var MAX_LISTS_DEPTH = 3;
function MaxIntrospectionDepthRule(context) {
  const checkedFragments = Object.create(null);
  const exceededFragments = Object.create(null);
  function checkDepth(node, visitedFragments, depth = 0) {
    if (node.kind === Kind.FRAGMENT_SPREAD) {
      const fragmentName = node.name.value;
      const exceededEntryDepth = exceededFragments[fragmentName];
      if (exceededEntryDepth !== undefined && exceededEntryDepth <= depth) {
        return true;
      }
      const visitedEntryDepth = visitedFragments[fragmentName];
      const checkedEntryDepth = checkedFragments[fragmentName];
      if (visitedEntryDepth !== undefined && visitedEntryDepth >= depth || checkedEntryDepth !== undefined && checkedEntryDepth >= depth) {
        return false;
      }
      const fragment = context.getFragment(fragmentName);
      if (!fragment) {
        return false;
      }
      visitedFragments[fragmentName] = depth;
      if (checkDepth(fragment, visitedFragments, depth)) {
        exceededFragments[fragmentName] = depth;
        return true;
      }
      checkedFragments[fragmentName] = depth;
      return false;
    }
    if (node.kind === Kind.FIELD && (node.name.value === "fields" || node.name.value === "interfaces" || node.name.value === "possibleTypes" || node.name.value === "inputFields")) {
      depth++;
      if (depth >= MAX_LISTS_DEPTH) {
        return true;
      }
    }
    if ("selectionSet" in node && node.selectionSet) {
      for (const child of node.selectionSet.selections) {
        if (checkDepth(child, visitedFragments, depth)) {
          return true;
        }
      }
    }
    return false;
  }
  return {
    Field(node) {
      if (node.name.value === "__schema" || node.name.value === "__type") {
        const visitedFragments = Object.create(null);
        if (checkDepth(node, visitedFragments)) {
          context.reportError(new GraphQLError("Maximum introspection depth exceeded", {
            nodes: [node]
          }));
          return false;
        }
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/NoFragmentCyclesRule.mjs
function NoFragmentCyclesRule(context) {
  const visitedFrags = Object.create(null);
  const spreadPath = [];
  const spreadPathIndexByName = Object.create(null);
  return {
    OperationDefinition: () => false,
    FragmentDefinition(node) {
      detectCycleRecursive(node);
      return false;
    }
  };
  function detectCycleRecursive(fragment) {
    if (visitedFrags[fragment.name.value]) {
      return;
    }
    const fragmentName = fragment.name.value;
    visitedFrags[fragmentName] = true;
    const spreadNodes = context.getFragmentSpreads(fragment.selectionSet);
    if (spreadNodes.length === 0) {
      return;
    }
    spreadPathIndexByName[fragmentName] = spreadPath.length;
    for (const spreadNode of spreadNodes) {
      const spreadName = spreadNode.name.value;
      const cycleIndex = spreadPathIndexByName[spreadName];
      spreadPath.push(spreadNode);
      if (cycleIndex === undefined) {
        const spreadFragment = context.getFragment(spreadName);
        if (spreadFragment) {
          detectCycleRecursive(spreadFragment);
        }
      } else {
        const cyclePath = spreadPath.slice(cycleIndex);
        const viaPath = cyclePath.slice(0, -1).map((s) => '"' + s.name.value + '"').join(", ");
        context.reportError(new GraphQLError(`Cannot spread fragment "${spreadName}" within itself` + (viaPath !== "" ? ` via ${viaPath}.` : "."), {
          nodes: cyclePath
        }));
      }
      spreadPath.pop();
    }
    spreadPathIndexByName[fragmentName] = undefined;
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/NoUndefinedVariablesRule.mjs
function NoUndefinedVariablesRule(context) {
  let variableNameDefined = Object.create(null);
  return {
    OperationDefinition: {
      enter() {
        variableNameDefined = Object.create(null);
      },
      leave(operation) {
        const usages = context.getRecursiveVariableUsages(operation);
        for (const { node } of usages) {
          const varName = node.name.value;
          if (variableNameDefined[varName] !== true) {
            context.reportError(new GraphQLError(operation.name ? `Variable "$${varName}" is not defined by operation "${operation.name.value}".` : `Variable "$${varName}" is not defined.`, {
              nodes: [node, operation]
            }));
          }
        }
      }
    },
    VariableDefinition(node) {
      variableNameDefined[node.variable.name.value] = true;
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/NoUnusedFragmentsRule.mjs
function NoUnusedFragmentsRule(context) {
  const operationDefs = [];
  const fragmentDefs = [];
  return {
    OperationDefinition(node) {
      operationDefs.push(node);
      return false;
    },
    FragmentDefinition(node) {
      fragmentDefs.push(node);
      return false;
    },
    Document: {
      leave() {
        const fragmentNameUsed = new Set(context.getRecursivelyReferencedFragmentsForOperations(operationDefs).map((fragment) => fragment.name.value));
        for (const fragmentDef of fragmentDefs) {
          const fragName = fragmentDef.name.value;
          if (!fragmentNameUsed.has(fragName)) {
            context.reportError(new GraphQLError(`Fragment "${fragName}" is never used.`, {
              nodes: fragmentDef
            }));
          }
        }
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/NoUnusedVariablesRule.mjs
function NoUnusedVariablesRule(context) {
  let variableDefs = [];
  return {
    OperationDefinition: {
      enter() {
        variableDefs = [];
      },
      leave(operation) {
        const variableNameUsed = Object.create(null);
        const usages = context.getRecursiveVariableUsages(operation);
        for (const { node } of usages) {
          variableNameUsed[node.name.value] = true;
        }
        for (const variableDef of variableDefs) {
          const variableName = variableDef.variable.name.value;
          if (variableNameUsed[variableName] !== true) {
            context.reportError(new GraphQLError(operation.name ? `Variable "$${variableName}" is never used in operation "${operation.name.value}".` : `Variable "$${variableName}" is never used.`, {
              nodes: variableDef
            }));
          }
        }
      }
    },
    VariableDefinition(def) {
      variableDefs.push(def);
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/validationAbortedError.mjs
var validationAbortedError = new GraphQLError("Validation aborted.");

// zveltio-extensions/node_modules/graphql/validation/rules/OverlappingFieldsCanBeMergedRule.mjs
var MAX_CONFLICT_DETAIL_LENGTH = 1000;
var MAX_CONFLICT_NODES = 20;
var MAX_COMPLEXITY_BUDGET = 500000;
function OverlappingFieldsCanBeMergedRule(validationContext) {
  const ruleContext = {
    comparedFragmentPairs: new PairSet,
    cachedCollectFieldsResults: new Map,
    stringifiedValues: new Map,
    remainingComplexityBudget: MAX_COMPLEXITY_BUDGET
  };
  return {
    SelectionSet(selectionSet, _key, parent) {
      var _selectionSet$selecti;
      if (parent && "kind" in parent && parent.kind === Kind.INLINE_FRAGMENT) {
        return;
      }
      if (selectionSet.selections.length <= 1 && ((_selectionSet$selecti = selectionSet.selections[0]) === null || _selectionSet$selecti === undefined ? undefined : _selectionSet$selecti.kind) !== Kind.INLINE_FRAGMENT) {
        return;
      }
      const conflicts = findConflictsWithinSelectionSet(validationContext, ruleContext, validationContext.getParentType(), selectionSet);
      for (const { responseName, reason, fields1, fields2 } of conflicts) {
        validationContext.reportError(new GraphQLError(`Fields "${maybeAbbreviate(responseName)}" conflict because ${reason}. Use different aliases on the fields to fetch both if this was intentional.`, {
          nodes: fields1.concat(fields2)
        }));
      }
    }
  };
}
function findConflictsWithinSelectionSet(validationContext, ruleContext, parentType, selectionSet) {
  const conflicts = [];
  const collectFieldsResult = collectFields2(validationContext, ruleContext, parentType, selectionSet);
  collectConflictsWithin(validationContext, conflicts, ruleContext, collectFieldsResult.groupedFieldSet);
  if (collectFieldsResult.fragmentNames.length !== 0 && (collectFieldsResult.groupedFieldSet.size !== 0 || collectFieldsResult.fragmentNames.length > 1)) {
    for (let i = 0;i < collectFieldsResult.fragmentNames.length; i++) {
      collectConflictsBetweenFieldsAndFragment(validationContext, conflicts, ruleContext, false, collectFieldsResult, collectFieldsResult.fragmentNames[i]);
      for (let j = i + 1;j < collectFieldsResult.fragmentNames.length; j++) {
        collectConflictsBetweenFragments(validationContext, conflicts, ruleContext, false, collectFieldsResult.fragmentNames[i], collectFieldsResult.fragmentNames[j]);
      }
    }
  }
  return conflicts;
}
function collectConflictsBetweenFieldsAndFragment(validationContext, conflicts, ruleContext, areMutuallyExclusive, collectFieldsResult, fragmentName) {
  var _collectFieldsResult$;
  spendComplexityBudget(ruleContext, 1);
  if (collectFieldsResult.groupedFieldSet.size === 0) {
    return;
  }
  const comparedFragments = (_collectFieldsResult$ = collectFieldsResult.comparedFragments) !== null && _collectFieldsResult$ !== undefined ? _collectFieldsResult$ : collectFieldsResult.comparedFragments = new Map;
  const compared = comparedFragments.get(fragmentName);
  if (compared === false || areMutuallyExclusive && compared === true) {
    return;
  }
  comparedFragments.set(fragmentName, areMutuallyExclusive);
  const fragment = validationContext.getFragment(fragmentName);
  if (!fragment) {
    return;
  }
  const collectFieldsResult2 = collectFragmentFields(validationContext, ruleContext, fragment);
  if (collectFieldsResult === collectFieldsResult2) {
    return;
  }
  collectConflictsBetween(validationContext, conflicts, ruleContext, areMutuallyExclusive, collectFieldsResult, collectFieldsResult2);
  for (const referencedFragmentName of collectFieldsResult2.fragmentNames) {
    collectConflictsBetweenFieldsAndFragment(validationContext, conflicts, ruleContext, areMutuallyExclusive, collectFieldsResult, referencedFragmentName);
  }
}
function collectConflictsBetweenFragments(validationContext, conflicts, ruleContext, areMutuallyExclusive, fragmentName1, fragmentName2) {
  spendComplexityBudget(ruleContext, 2);
  const { comparedFragmentPairs } = ruleContext;
  if (fragmentName1 === fragmentName2) {
    return;
  }
  if (comparedFragmentPairs.has(fragmentName1, fragmentName2, areMutuallyExclusive)) {
    return;
  }
  comparedFragmentPairs.add(fragmentName1, fragmentName2, areMutuallyExclusive);
  const fragment1 = validationContext.getFragment(fragmentName1);
  const fragment2 = validationContext.getFragment(fragmentName2);
  if (!fragment1 || !fragment2) {
    return;
  }
  const collectFieldsResult1 = collectFragmentFields(validationContext, ruleContext, fragment1);
  const collectFieldsResult2 = collectFragmentFields(validationContext, ruleContext, fragment2);
  collectConflictsBetween(validationContext, conflicts, ruleContext, areMutuallyExclusive, collectFieldsResult1, collectFieldsResult2);
  for (const referencedFragmentName2 of collectFieldsResult2.fragmentNames) {
    collectConflictsBetweenFragments(validationContext, conflicts, ruleContext, areMutuallyExclusive, fragmentName1, referencedFragmentName2);
  }
  for (const referencedFragmentName1 of collectFieldsResult1.fragmentNames) {
    collectConflictsBetweenFragments(validationContext, conflicts, ruleContext, areMutuallyExclusive, referencedFragmentName1, fragmentName2);
  }
}
function findConflictsBetweenSubSelectionSets(validationContext, ruleContext, areMutuallyExclusive, parentType1, selectionSet1, parentType2, selectionSet2) {
  const conflicts = [];
  const collectFieldsResult1 = collectFields2(validationContext, ruleContext, parentType1, selectionSet1);
  const collectFieldsResult2 = collectFields2(validationContext, ruleContext, parentType2, selectionSet2);
  collectConflictsBetween(validationContext, conflicts, ruleContext, areMutuallyExclusive, collectFieldsResult1, collectFieldsResult2);
  for (const fragmentName2 of collectFieldsResult2.fragmentNames) {
    collectConflictsBetweenFieldsAndFragment(validationContext, conflicts, ruleContext, areMutuallyExclusive, collectFieldsResult1, fragmentName2);
  }
  for (const fragmentName1 of collectFieldsResult1.fragmentNames) {
    collectConflictsBetweenFieldsAndFragment(validationContext, conflicts, ruleContext, areMutuallyExclusive, collectFieldsResult2, fragmentName1);
  }
  for (const fragmentName1 of collectFieldsResult1.fragmentNames) {
    for (const fragmentName2 of collectFieldsResult2.fragmentNames) {
      collectConflictsBetweenFragments(validationContext, conflicts, ruleContext, areMutuallyExclusive, fragmentName1, fragmentName2);
    }
  }
  return conflicts;
}
function collectConflictsWithin(validationContext, conflicts, ruleContext, groupedFieldSet) {
  for (const [responseName, fields] of groupedFieldSet) {
    if (fields.length > 1) {
      for (let i = 0;i < fields.length; i++) {
        for (let j = i + 1;j < fields.length; j++) {
          const conflict = findConflict(validationContext, ruleContext, false, responseName, fields[i], fields[j]);
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
    }
  }
}
function collectConflictsBetween(validationContext, conflicts, ruleContext, parentFieldsAreMutuallyExclusive, collectFieldsResult1, collectFieldsResult2) {
  if (collectFieldsResult1.groupedFieldSet.size === 0 || collectFieldsResult2.groupedFieldSet.size === 0) {
    return;
  }
  for (const { responseName, fields1, fields2 } of getOverlappingFields(ruleContext, collectFieldsResult1, collectFieldsResult2)) {
    for (const field1 of fields1) {
      for (const field2 of fields2) {
        const conflict = findConflict(validationContext, ruleContext, parentFieldsAreMutuallyExclusive, responseName, field1, field2);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
  }
}
function getOverlappingFields(ruleContext, collectFieldsResult1, collectFieldsResult2) {
  var _collectFieldsResult;
  const byCollectFieldsResult = (_collectFieldsResult = collectFieldsResult1.overlappingFields) !== null && _collectFieldsResult !== undefined ? _collectFieldsResult : collectFieldsResult1.overlappingFields = new Map;
  const cached = byCollectFieldsResult.get(collectFieldsResult2);
  if (cached !== undefined) {
    return cached;
  }
  const overlappingFields = [];
  for (const [responseName, fields1] of collectFieldsResult1.groupedFieldSet) {
    spendComplexityBudget(ruleContext, 1);
    const fields2 = collectFieldsResult2.groupedFieldSet.get(responseName);
    if (fields2 !== undefined) {
      overlappingFields.push({
        responseName,
        fields1,
        fields2
      });
    }
  }
  byCollectFieldsResult.set(collectFieldsResult2, overlappingFields);
  return overlappingFields;
}
function findConflict(validationContext, ruleContext, parentFieldsAreMutuallyExclusive, responseName, fieldDetails1, fieldDetails2) {
  const {
    parentType: parentType1,
    node: node1,
    definition: def1
  } = fieldDetails1;
  const {
    parentType: parentType2,
    node: node2,
    definition: def2
  } = fieldDetails2;
  const areMutuallyExclusive = parentFieldsAreMutuallyExclusive || parentType1 !== parentType2 && isObjectType(parentType1) && isObjectType(parentType2);
  spendComplexityBudget(ruleContext, 2);
  if (fieldDetails1.isSimpleLeaf && fieldDetails2.isSimpleLeaf && (def1 === null || def1 === undefined ? undefined : def1.type) === (def2 === null || def2 === undefined ? undefined : def2.type) && node1.name.value === node2.name.value) {
    return;
  }
  if (!areMutuallyExclusive) {
    const fieldInfo1 = getFieldInfo(fieldDetails1);
    const fieldInfo2 = getFieldInfo(fieldDetails2);
    let reason = fieldInfo1.comparisons.get(fieldInfo2);
    if (reason === undefined) {
      const name1 = node1.name.value;
      const name2 = node2.name.value;
      reason = name1 !== name2 ? `"${maybeAbbreviate(name1)}" and "${maybeAbbreviate(name2)}" are different fields` : sameArguments(ruleContext, fieldInfo1.arguments, fieldInfo2.arguments) ? null : "they have differing arguments";
      fieldInfo1.comparisons.set(fieldInfo2, reason);
    }
    if (reason !== null) {
      return {
        responseName,
        reason,
        fields1: [node1],
        fields2: [node2]
      };
    }
  }
  const type1 = def1 === null || def1 === undefined ? undefined : def1.type;
  const type2 = def2 === null || def2 === undefined ? undefined : def2.type;
  if (type1 && type2 && doTypesConflict(ruleContext, type1, type2)) {
    var _fieldInfo1$typeStrin, _fieldInfo2$typeStrin;
    const fieldInfo1 = getFieldInfo(fieldDetails1);
    const fieldInfo2 = getFieldInfo(fieldDetails2);
    const type1String = (_fieldInfo1$typeStrin = fieldInfo1.typeString) !== null && _fieldInfo1$typeStrin !== undefined ? _fieldInfo1$typeStrin : fieldInfo1.typeString = inspect(type1);
    const type2String = (_fieldInfo2$typeStrin = fieldInfo2.typeString) !== null && _fieldInfo2$typeStrin !== undefined ? _fieldInfo2$typeStrin : fieldInfo2.typeString = inspect(type2);
    return {
      responseName,
      reason: `they return conflicting types "${type1String}" and "${type2String}"`,
      fields1: [node1],
      fields2: [node2]
    };
  }
  const selectionSet1 = node1.selectionSet;
  const selectionSet2 = node2.selectionSet;
  if (selectionSet1 && selectionSet2) {
    const conflicts = findConflictsBetweenSubSelectionSets(validationContext, ruleContext, areMutuallyExclusive, getFieldInfo(fieldDetails1).namedType, selectionSet1, getFieldInfo(fieldDetails2).namedType, selectionSet2);
    return subfieldConflicts(conflicts, responseName, node1, node2);
  }
}
function getFieldInfo(fieldDetails) {
  if (fieldDetails.info === undefined) {
    var _fieldDetails$definit;
    fieldDetails.info = {
      comparisons: new Map,
      namedType: getNamedType((_fieldDetails$definit = fieldDetails.definition) === null || _fieldDetails$definit === undefined ? undefined : _fieldDetails$definit.type),
      arguments: getArgumentInfo(fieldDetails.node.arguments)
    };
  }
  return fieldDetails.info;
}
function getArgumentInfo(args) {
  if (args === undefined || args.length === 0) {
    return;
  }
  const values = new Map;
  for (const { name, value } of args) {
    values.set(name.value, value);
  }
  return {
    nodes: args,
    values
  };
}
function sameArguments(ruleContext, argumentInfo1, argumentInfo2) {
  if (argumentInfo1 === undefined) {
    return argumentInfo2 === undefined;
  }
  if (argumentInfo1.nodes.length !== (argumentInfo2 === null || argumentInfo2 === undefined ? undefined : argumentInfo2.nodes.length)) {
    return false;
  }
  const values2 = argumentInfo2.values;
  return argumentInfo1.nodes.every((arg1) => {
    spendComplexityBudget(ruleContext, 1);
    const value2 = values2.get(arg1.name.value);
    if (value2 === undefined) {
      return false;
    }
    return stringifyValue(ruleContext, arg1.value) === stringifyValue(ruleContext, value2);
  });
}
function stringifyValue(ruleContext, value) {
  const cached = ruleContext.stringifiedValues.get(value);
  if (cached !== undefined) {
    return cached;
  }
  const result = JSON.stringify(value, (_key, node) => {
    if (!isNode(node)) {
      return node;
    }
    switch (node.kind) {
      case Kind.VARIABLE:
        return [node.kind, node.name.value];
      case Kind.OBJECT:
        return [
          node.kind,
          node.fields.slice().sort((first, second) => first.name.value < second.name.value ? -1 : first.name.value > second.name.value ? 1 : 0)
        ];
      case Kind.OBJECT_FIELD:
        return [node.name.value, node.value];
      case Kind.LIST:
        return [node.kind, node.values];
      case Kind.STRING:
        return [node.kind, node.value, node.block === true];
      default:
        return [node.kind, "value" in node ? node.value : null];
    }
  });
  ruleContext.stringifiedValues.set(value, result);
  return result;
}
function doTypesConflict(ruleContext, type1, type2) {
  if (type1 === type2) {
    return false;
  }
  spendComplexityBudget(ruleContext, 1);
  if (isListType(type1)) {
    return isListType(type2) ? doTypesConflict(ruleContext, type1.ofType, type2.ofType) : true;
  }
  if (isListType(type2)) {
    return true;
  }
  if (isNonNullType(type1)) {
    return isNonNullType(type2) ? doTypesConflict(ruleContext, type1.ofType, type2.ofType) : true;
  }
  if (isNonNullType(type2)) {
    return true;
  }
  if (isLeafType(type1) || isLeafType(type2)) {
    return type1 !== type2;
  }
  return false;
}
function collectFields2(validationContext, ruleContext, parentType, selectionSet) {
  const { cachedCollectFieldsResults } = ruleContext;
  let bySelectionSet = cachedCollectFieldsResults.get(parentType);
  if (bySelectionSet === undefined) {
    bySelectionSet = new Map;
    cachedCollectFieldsResults.set(parentType, bySelectionSet);
  }
  const cached = bySelectionSet.get(selectionSet);
  if (cached) {
    return cached;
  }
  const fieldDetails = new Map;
  const fragmentNames = new Set;
  collectFieldsImpl2(validationContext, parentType, selectionSet, fieldDetails, fragmentNames);
  const result = {
    groupedFieldSet: fieldDetails,
    fragmentNames: [...fragmentNames]
  };
  bySelectionSet.set(selectionSet, result);
  return result;
}
function collectFragmentFields(validationContext, ruleContext, fragment) {
  const fragmentType = typeFromAST(validationContext.getSchema(), fragment.typeCondition);
  return collectFields2(validationContext, ruleContext, fragmentType, fragment.selectionSet);
}
function collectFieldsImpl2(validationContext, parentType, selectionSet, fieldDetails, fragmentNames) {
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case Kind.FIELD: {
        var _selection$arguments$, _selection$arguments;
        const fieldName = selection.name.value;
        let fieldDef;
        if (isObjectType(parentType) || isInterfaceType(parentType)) {
          fieldDef = parentType.getFields()[fieldName];
        }
        const responseName = selection.alias ? selection.alias.value : fieldName;
        let fieldDetailsList = fieldDetails.get(responseName);
        if (fieldDetailsList === undefined) {
          fieldDetailsList = [];
          fieldDetails.set(responseName, fieldDetailsList);
        }
        fieldDetailsList.push({
          parentType,
          node: selection,
          definition: fieldDef,
          isSimpleLeaf: ((_selection$arguments$ = (_selection$arguments = selection.arguments) === null || _selection$arguments === undefined ? undefined : _selection$arguments.length) !== null && _selection$arguments$ !== undefined ? _selection$arguments$ : 0) === 0 && !selection.selectionSet
        });
        break;
      }
      case Kind.FRAGMENT_SPREAD:
        fragmentNames.add(selection.name.value);
        break;
      case Kind.INLINE_FRAGMENT: {
        const typeCondition = selection.typeCondition;
        const inlineFragmentType = typeCondition ? typeFromAST(validationContext.getSchema(), typeCondition) : parentType;
        collectFieldsImpl2(validationContext, inlineFragmentType, selection.selectionSet, fieldDetails, fragmentNames);
        break;
      }
    }
  }
}
function subfieldConflicts(conflicts, responseName, node1, node2) {
  if (conflicts.length > 0) {
    let message = "";
    for (const { responseName: name, reason } of conflicts) {
      message += (message === "" ? "" : " and ") + `subfields "${maybeAbbreviate(name)}" conflict because ${reason}`;
      if (message.length > MAX_CONFLICT_DETAIL_LENGTH) {
        break;
      }
    }
    return {
      responseName,
      reason: maybeAbbreviate(message),
      fields1: collectConflictNodes(node1, conflicts, "fields1"),
      fields2: collectConflictNodes(node2, conflicts, "fields2")
    };
  }
}
function collectConflictNodes(node, conflicts, side) {
  const nodes = [node];
  for (const conflict of conflicts) {
    const remaining = MAX_CONFLICT_NODES - nodes.length;
    const retainedNodes = conflict[side].slice(-remaining);
    nodes.push(...retainedNodes);
    if (nodes.length === MAX_CONFLICT_NODES) {
      break;
    }
  }
  return nodes;
}
function maybeAbbreviate(text) {
  return text.length > MAX_CONFLICT_DETAIL_LENGTH ? text.slice(0, MAX_CONFLICT_DETAIL_LENGTH) + "..." : text;
}
function spendComplexityBudget(ruleContext, cost) {
  ruleContext.remainingComplexityBudget -= cost;
  if (ruleContext.remainingComplexityBudget < 0) {
    throw validationAbortedError;
  }
}

class PairSet {
  constructor() {
    this._data = new Map;
  }
  has(a, b, weaklyPresent) {
    return this._has(a, b, weaklyPresent) || this._has(b, a, weaklyPresent);
  }
  _has(a, b, weaklyPresent) {
    var _this$_data$get;
    const result = (_this$_data$get = this._data.get(a)) === null || _this$_data$get === undefined ? undefined : _this$_data$get.get(b);
    if (result === undefined) {
      return false;
    }
    return weaklyPresent ? true : weaklyPresent === result;
  }
  add(a, b, weaklyPresent) {
    const map = this._data.get(a);
    if (map === undefined) {
      this._data.set(a, new Map([[b, weaklyPresent]]));
    } else {
      map.set(b, weaklyPresent);
    }
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/PossibleFragmentSpreadsRule.mjs
function PossibleFragmentSpreadsRule(context) {
  return {
    InlineFragment(node) {
      const fragType = context.getType();
      const parentType = context.getParentType();
      if (isCompositeType(fragType) && isCompositeType(parentType) && !doTypesOverlap(context.getSchema(), fragType, parentType)) {
        const parentTypeStr = inspect(parentType);
        const fragTypeStr = inspect(fragType);
        context.reportError(new GraphQLError(`Fragment cannot be spread here as objects of type "${parentTypeStr}" can never be of type "${fragTypeStr}".`, {
          nodes: node
        }));
      }
    },
    FragmentSpread(node) {
      const fragName = node.name.value;
      const fragType = getFragmentType(context, fragName);
      const parentType = context.getParentType();
      if (fragType && parentType && !doTypesOverlap(context.getSchema(), fragType, parentType)) {
        const parentTypeStr = inspect(parentType);
        const fragTypeStr = inspect(fragType);
        context.reportError(new GraphQLError(`Fragment "${fragName}" cannot be spread here as objects of type "${parentTypeStr}" can never be of type "${fragTypeStr}".`, {
          nodes: node
        }));
      }
    }
  };
}
function getFragmentType(context, name) {
  const frag = context.getFragment(name);
  if (frag) {
    const type = typeFromAST(context.getSchema(), frag.typeCondition);
    if (isCompositeType(type)) {
      return type;
    }
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/PossibleTypeExtensionsRule.mjs
function PossibleTypeExtensionsRule(context) {
  const schema = context.getSchema();
  const definedTypes = Object.create(null);
  for (const def of context.getDocument().definitions) {
    if (isTypeDefinitionNode(def)) {
      definedTypes[def.name.value] = def;
    }
  }
  return {
    ScalarTypeExtension: checkExtension,
    ObjectTypeExtension: checkExtension,
    InterfaceTypeExtension: checkExtension,
    UnionTypeExtension: checkExtension,
    EnumTypeExtension: checkExtension,
    InputObjectTypeExtension: checkExtension
  };
  function checkExtension(node) {
    const typeName = node.name.value;
    const defNode = definedTypes[typeName];
    const existingType = schema === null || schema === undefined ? undefined : schema.getType(typeName);
    let expectedKind;
    if (defNode) {
      expectedKind = defKindToExtKind[defNode.kind];
    } else if (existingType) {
      expectedKind = typeToExtKind(existingType);
    }
    if (expectedKind) {
      if (expectedKind !== node.kind) {
        const kindStr = extensionKindToTypeName(node.kind);
        context.reportError(new GraphQLError(`Cannot extend non-${kindStr} type "${typeName}".`, {
          nodes: defNode ? [defNode, node] : node
        }));
      }
    } else {
      const allTypeNames = Object.keys({
        ...definedTypes,
        ...schema === null || schema === undefined ? undefined : schema.getTypeMap()
      });
      const suggestedTypes = suggestionList(typeName, allTypeNames);
      context.reportError(new GraphQLError(`Cannot extend type "${typeName}" because it is not defined.` + didYouMean(suggestedTypes), {
        nodes: node.name
      }));
    }
  }
}
var defKindToExtKind = {
  [Kind.SCALAR_TYPE_DEFINITION]: Kind.SCALAR_TYPE_EXTENSION,
  [Kind.OBJECT_TYPE_DEFINITION]: Kind.OBJECT_TYPE_EXTENSION,
  [Kind.INTERFACE_TYPE_DEFINITION]: Kind.INTERFACE_TYPE_EXTENSION,
  [Kind.UNION_TYPE_DEFINITION]: Kind.UNION_TYPE_EXTENSION,
  [Kind.ENUM_TYPE_DEFINITION]: Kind.ENUM_TYPE_EXTENSION,
  [Kind.INPUT_OBJECT_TYPE_DEFINITION]: Kind.INPUT_OBJECT_TYPE_EXTENSION
};
function typeToExtKind(type) {
  if (isScalarType(type)) {
    return Kind.SCALAR_TYPE_EXTENSION;
  }
  if (isObjectType(type)) {
    return Kind.OBJECT_TYPE_EXTENSION;
  }
  if (isInterfaceType(type)) {
    return Kind.INTERFACE_TYPE_EXTENSION;
  }
  if (isUnionType(type)) {
    return Kind.UNION_TYPE_EXTENSION;
  }
  if (isEnumType(type)) {
    return Kind.ENUM_TYPE_EXTENSION;
  }
  if (isInputObjectType(type)) {
    return Kind.INPUT_OBJECT_TYPE_EXTENSION;
  }
  invariant(false, "Unexpected type: " + inspect(type));
}
function extensionKindToTypeName(kind) {
  switch (kind) {
    case Kind.SCALAR_TYPE_EXTENSION:
      return "scalar";
    case Kind.OBJECT_TYPE_EXTENSION:
      return "object";
    case Kind.INTERFACE_TYPE_EXTENSION:
      return "interface";
    case Kind.UNION_TYPE_EXTENSION:
      return "union";
    case Kind.ENUM_TYPE_EXTENSION:
      return "enum";
    case Kind.INPUT_OBJECT_TYPE_EXTENSION:
      return "input object";
    default:
      invariant(false, "Unexpected kind: " + inspect(kind));
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/ProvidedRequiredArgumentsRule.mjs
function ProvidedRequiredArgumentsRule(context) {
  return {
    ...ProvidedRequiredArgumentsOnDirectivesRule(context),
    Field: {
      leave(fieldNode) {
        var _fieldNode$arguments;
        const fieldDef = context.getFieldDef();
        if (!fieldDef) {
          return false;
        }
        const providedArgs = new Set((_fieldNode$arguments = fieldNode.arguments) === null || _fieldNode$arguments === undefined ? undefined : _fieldNode$arguments.map((arg) => arg.name.value));
        for (const argDef of fieldDef.args) {
          if (!providedArgs.has(argDef.name) && isRequiredArgument(argDef)) {
            const argTypeStr = inspect(argDef.type);
            context.reportError(new GraphQLError(`Field "${fieldDef.name}" argument "${argDef.name}" of type "${argTypeStr}" is required, but it was not provided.`, {
              nodes: fieldNode
            }));
          }
        }
      }
    }
  };
}
function ProvidedRequiredArgumentsOnDirectivesRule(context) {
  var _schema$getDirectives;
  const requiredArgsMap = Object.create(null);
  const schema = context.getSchema();
  const definedDirectives = (_schema$getDirectives = schema === null || schema === undefined ? undefined : schema.getDirectives()) !== null && _schema$getDirectives !== undefined ? _schema$getDirectives : specifiedDirectives;
  for (const directive of definedDirectives) {
    requiredArgsMap[directive.name] = keyMap(directive.args.filter(isRequiredArgument), (arg) => arg.name);
  }
  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      var _def$arguments;
      const argNodes = (_def$arguments = def.arguments) !== null && _def$arguments !== undefined ? _def$arguments : [];
      requiredArgsMap[def.name.value] = keyMap(argNodes.filter(isRequiredArgumentNode), (arg) => arg.name.value);
    }
  }
  return {
    Directive: {
      leave(directiveNode) {
        const directiveName = directiveNode.name.value;
        const requiredArgs = requiredArgsMap[directiveName];
        if (requiredArgs) {
          var _directiveNode$argume;
          const argNodes = (_directiveNode$argume = directiveNode.arguments) !== null && _directiveNode$argume !== undefined ? _directiveNode$argume : [];
          const argNodeMap = new Set(argNodes.map((arg) => arg.name.value));
          for (const [argName, argDef] of Object.entries(requiredArgs)) {
            if (!argNodeMap.has(argName)) {
              const argType = isType(argDef.type) ? inspect(argDef.type) : print(argDef.type);
              context.reportError(new GraphQLError(`Directive "@${directiveName}" argument "${argName}" of type "${argType}" is required, but it was not provided.`, {
                nodes: directiveNode
              }));
            }
          }
        }
      }
    }
  };
}
function isRequiredArgumentNode(arg) {
  return arg.type.kind === Kind.NON_NULL_TYPE && arg.defaultValue == null;
}

// zveltio-extensions/node_modules/graphql/validation/rules/ScalarLeafsRule.mjs
function ScalarLeafsRule(context) {
  return {
    Field(node) {
      const type = context.getType();
      const selectionSet = node.selectionSet;
      if (type) {
        if (isLeafType(getNamedType(type))) {
          if (selectionSet) {
            const fieldName = node.name.value;
            const typeStr = inspect(type);
            context.reportError(new GraphQLError(`Field "${fieldName}" must not have a selection since type "${typeStr}" has no subfields.`, {
              nodes: selectionSet
            }));
          }
        } else if (!selectionSet) {
          const fieldName = node.name.value;
          const typeStr = inspect(type);
          context.reportError(new GraphQLError(`Field "${fieldName}" of type "${typeStr}" must have a selection of subfields. Did you mean "${fieldName} { ... }"?`, {
            nodes: node
          }));
        } else if (selectionSet.selections.length === 0) {
          const fieldName = node.name.value;
          const typeStr = inspect(type);
          context.reportError(new GraphQLError(`Field "${fieldName}" of type "${typeStr}" must have at least one field selected.`, {
            nodes: node
          }));
        }
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/SingleFieldSubscriptionsRule.mjs
function SingleFieldSubscriptionsRule(context) {
  let fragments;
  function reserveSelectionSetWork(selectionSet) {
    context.spendFragmentWork(selectionSet.selections.length);
    for (const selection of selectionSet.selections) {
      const directives = selection.directives;
      if (directives !== undefined) {
        context.spendFragmentWork(directives.length);
        for (const directive of directives) {
          if (directive.name.value === "skip" || directive.name.value === "include") {
            var _directive$arguments$, _directive$arguments;
            context.spendFragmentWork((_directive$arguments$ = (_directive$arguments = directive.arguments) === null || _directive$arguments === undefined ? undefined : _directive$arguments.length) !== null && _directive$arguments$ !== undefined ? _directive$arguments$ : 0);
          }
        }
      }
    }
  }
  return {
    OperationDefinition(node) {
      if (node.operation === "subscription") {
        const schema = context.getSchema();
        const subscriptionType = schema.getSubscriptionType();
        if (subscriptionType) {
          const operationName = node.name ? node.name.value : null;
          const variableValues = Object.create(null);
          if (fragments === undefined) {
            fragments = Object.create(null);
            const definitions = context.getDocument().definitions;
            context.spendFragmentWork(definitions.length);
            for (const definition of definitions) {
              if (definition.kind === Kind.FRAGMENT_DEFINITION) {
                fragments[definition.name.value] = definition;
              }
            }
          }
          const fields = collectFields(schema, fragments, variableValues, subscriptionType, node.selectionSet, reserveSelectionSetWork);
          if (fields.size > 1) {
            const fieldSelectionLists = [...fields.values()];
            const extraFieldSelectionLists = fieldSelectionLists.slice(1);
            const extraFieldSelections = extraFieldSelectionLists.flat();
            context.reportError(new GraphQLError(operationName != null ? `Subscription "${operationName}" must select only one top level field.` : "Anonymous Subscription must select only one top level field.", {
              nodes: extraFieldSelections
            }));
          }
          for (const fieldNodes of fields.values()) {
            const field = fieldNodes[0];
            const fieldName = field.name.value;
            if (fieldName.startsWith("__")) {
              context.reportError(new GraphQLError(operationName != null ? `Subscription "${operationName}" must not select an introspection top level field.` : "Anonymous Subscription must not select an introspection top level field.", {
                nodes: fieldNodes
              }));
            }
          }
        }
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/jsutils/groupBy.mjs
function groupBy(list, keyFn) {
  const result = new Map;
  for (const item of list) {
    const key = keyFn(item);
    const group = result.get(key);
    if (group === undefined) {
      result.set(key, [item]);
    } else {
      group.push(item);
    }
  }
  return result;
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueArgumentDefinitionNamesRule.mjs
function UniqueArgumentDefinitionNamesRule(context) {
  return {
    DirectiveDefinition(directiveNode) {
      var _directiveNode$argume;
      const argumentNodes = (_directiveNode$argume = directiveNode.arguments) !== null && _directiveNode$argume !== undefined ? _directiveNode$argume : [];
      return checkArgUniqueness(`@${directiveNode.name.value}`, argumentNodes);
    },
    InterfaceTypeDefinition: checkArgUniquenessPerField,
    InterfaceTypeExtension: checkArgUniquenessPerField,
    ObjectTypeDefinition: checkArgUniquenessPerField,
    ObjectTypeExtension: checkArgUniquenessPerField
  };
  function checkArgUniquenessPerField(typeNode) {
    var _typeNode$fields;
    const typeName = typeNode.name.value;
    const fieldNodes = (_typeNode$fields = typeNode.fields) !== null && _typeNode$fields !== undefined ? _typeNode$fields : [];
    for (const fieldDef of fieldNodes) {
      var _fieldDef$arguments;
      const fieldName = fieldDef.name.value;
      const argumentNodes = (_fieldDef$arguments = fieldDef.arguments) !== null && _fieldDef$arguments !== undefined ? _fieldDef$arguments : [];
      checkArgUniqueness(`${typeName}.${fieldName}`, argumentNodes);
    }
    return false;
  }
  function checkArgUniqueness(parentName, argumentNodes) {
    const seenArgs = groupBy(argumentNodes, (arg) => arg.name.value);
    for (const [argName, argNodes] of seenArgs) {
      if (argNodes.length > 1) {
        context.reportError(new GraphQLError(`Argument "${parentName}(${argName}:)" can only be defined once.`, {
          nodes: argNodes.map((node) => node.name)
        }));
      }
    }
    return false;
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueArgumentNamesRule.mjs
function UniqueArgumentNamesRule(context) {
  return {
    Field: checkArgUniqueness,
    Directive: checkArgUniqueness
  };
  function checkArgUniqueness(parentNode) {
    var _parentNode$arguments;
    const argumentNodes = (_parentNode$arguments = parentNode.arguments) !== null && _parentNode$arguments !== undefined ? _parentNode$arguments : [];
    const seenArgs = groupBy(argumentNodes, (arg) => arg.name.value);
    for (const [argName, argNodes] of seenArgs) {
      if (argNodes.length > 1) {
        context.reportError(new GraphQLError(`There can be only one argument named "${argName}".`, {
          nodes: argNodes.map((node) => node.name)
        }));
      }
    }
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueDirectiveNamesRule.mjs
function UniqueDirectiveNamesRule(context) {
  const knownDirectiveNames = Object.create(null);
  const schema = context.getSchema();
  return {
    DirectiveDefinition(node) {
      const directiveName = node.name.value;
      if (schema !== null && schema !== undefined && schema.getDirective(directiveName)) {
        context.reportError(new GraphQLError(`Directive "@${directiveName}" already exists in the schema. It cannot be redefined.`, {
          nodes: node.name
        }));
        return;
      }
      if (knownDirectiveNames[directiveName]) {
        context.reportError(new GraphQLError(`There can be only one directive named "@${directiveName}".`, {
          nodes: [knownDirectiveNames[directiveName], node.name]
        }));
      } else {
        knownDirectiveNames[directiveName] = node.name;
      }
      return false;
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueDirectivesPerLocationRule.mjs
function UniqueDirectivesPerLocationRule(context) {
  const uniqueDirectiveMap = Object.create(null);
  const schema = context.getSchema();
  const definedDirectives = schema ? schema.getDirectives() : specifiedDirectives;
  for (const directive of definedDirectives) {
    uniqueDirectiveMap[directive.name] = !directive.isRepeatable;
  }
  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      uniqueDirectiveMap[def.name.value] = !def.repeatable;
    }
  }
  const schemaDirectives = Object.create(null);
  const typeDirectivesMap = Object.create(null);
  const directiveDirectivesMap = Object.create(null);
  return {
    enter(node) {
      if (!("directives" in node) || !node.directives) {
        return;
      }
      let seenDirectives;
      if (node.kind === Kind.SCHEMA_DEFINITION || node.kind === Kind.SCHEMA_EXTENSION) {
        seenDirectives = schemaDirectives;
      } else if (isTypeDefinitionNode(node) || isTypeExtensionNode(node)) {
        const typeName = node.name.value;
        seenDirectives = typeDirectivesMap[typeName];
        if (seenDirectives === undefined) {
          typeDirectivesMap[typeName] = seenDirectives = Object.create(null);
        }
      } else if (node.kind === Kind.DIRECTIVE_DEFINITION || node.kind === Kind.DIRECTIVE_EXTENSION) {
        const directiveName = node.name.value;
        seenDirectives = directiveDirectivesMap[directiveName];
        if (seenDirectives === undefined) {
          directiveDirectivesMap[directiveName] = seenDirectives = Object.create(null);
        }
      } else {
        seenDirectives = Object.create(null);
      }
      for (const directive of node.directives) {
        const directiveName = directive.name.value;
        if (uniqueDirectiveMap[directiveName]) {
          if (seenDirectives[directiveName]) {
            context.reportError(new GraphQLError(`The directive "@${directiveName}" can only be used once at this location.`, {
              nodes: [seenDirectives[directiveName], directive]
            }));
          } else {
            seenDirectives[directiveName] = directive;
          }
        }
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueEnumValueNamesRule.mjs
function UniqueEnumValueNamesRule(context) {
  const schema = context.getSchema();
  const existingTypeMap = schema ? schema.getTypeMap() : Object.create(null);
  const knownValueNames = Object.create(null);
  return {
    EnumTypeDefinition: checkValueUniqueness,
    EnumTypeExtension: checkValueUniqueness
  };
  function checkValueUniqueness(node) {
    var _node$values;
    const typeName = node.name.value;
    if (!knownValueNames[typeName]) {
      knownValueNames[typeName] = Object.create(null);
    }
    const valueNodes = (_node$values = node.values) !== null && _node$values !== undefined ? _node$values : [];
    const valueNames = knownValueNames[typeName];
    for (const valueDef of valueNodes) {
      const valueName = valueDef.name.value;
      const existingType = existingTypeMap[typeName];
      if (isEnumType(existingType) && existingType.getValue(valueName)) {
        context.reportError(new GraphQLError(`Enum value "${typeName}.${valueName}" already exists in the schema. It cannot also be defined in this type extension.`, {
          nodes: valueDef.name
        }));
      } else if (valueNames[valueName]) {
        context.reportError(new GraphQLError(`Enum value "${typeName}.${valueName}" can only be defined once.`, {
          nodes: [valueNames[valueName], valueDef.name]
        }));
      } else {
        valueNames[valueName] = valueDef.name;
      }
    }
    return false;
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueFieldDefinitionNamesRule.mjs
function UniqueFieldDefinitionNamesRule(context) {
  const schema = context.getSchema();
  const existingTypeMap = schema ? schema.getTypeMap() : Object.create(null);
  const knownFieldNames = Object.create(null);
  return {
    InputObjectTypeDefinition: checkFieldUniqueness,
    InputObjectTypeExtension: checkFieldUniqueness,
    InterfaceTypeDefinition: checkFieldUniqueness,
    InterfaceTypeExtension: checkFieldUniqueness,
    ObjectTypeDefinition: checkFieldUniqueness,
    ObjectTypeExtension: checkFieldUniqueness
  };
  function checkFieldUniqueness(node) {
    var _node$fields;
    const typeName = node.name.value;
    if (!knownFieldNames[typeName]) {
      knownFieldNames[typeName] = Object.create(null);
    }
    const fieldNodes = (_node$fields = node.fields) !== null && _node$fields !== undefined ? _node$fields : [];
    const fieldNames = knownFieldNames[typeName];
    for (const fieldDef of fieldNodes) {
      const fieldName = fieldDef.name.value;
      if (hasField(existingTypeMap[typeName], fieldName)) {
        context.reportError(new GraphQLError(`Field "${typeName}.${fieldName}" already exists in the schema. It cannot also be defined in this type extension.`, {
          nodes: fieldDef.name
        }));
      } else if (fieldNames[fieldName]) {
        context.reportError(new GraphQLError(`Field "${typeName}.${fieldName}" can only be defined once.`, {
          nodes: [fieldNames[fieldName], fieldDef.name]
        }));
      } else {
        fieldNames[fieldName] = fieldDef.name;
      }
    }
    return false;
  }
}
function hasField(type, fieldName) {
  if (isObjectType(type) || isInterfaceType(type) || isInputObjectType(type)) {
    return type.getFields()[fieldName] != null;
  }
  return false;
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueFragmentNamesRule.mjs
function UniqueFragmentNamesRule(context) {
  const knownFragmentNames = Object.create(null);
  return {
    OperationDefinition: () => false,
    FragmentDefinition(node) {
      const fragmentName = node.name.value;
      if (knownFragmentNames[fragmentName]) {
        context.reportError(new GraphQLError(`There can be only one fragment named "${fragmentName}".`, {
          nodes: [knownFragmentNames[fragmentName], node.name]
        }));
      } else {
        knownFragmentNames[fragmentName] = node.name;
      }
      return false;
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueInputFieldNamesRule.mjs
function UniqueInputFieldNamesRule(context) {
  const knownNameStack = [];
  let knownNames = Object.create(null);
  return {
    ObjectValue: {
      enter() {
        knownNameStack.push(knownNames);
        knownNames = Object.create(null);
      },
      leave() {
        const prevKnownNames = knownNameStack.pop();
        prevKnownNames || invariant(false);
        knownNames = prevKnownNames;
      }
    },
    ObjectField(node) {
      const fieldName = node.name.value;
      if (knownNames[fieldName]) {
        context.reportError(new GraphQLError(`There can be only one input field named "${fieldName}".`, {
          nodes: [knownNames[fieldName], node.name]
        }));
      } else {
        knownNames[fieldName] = node.name;
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueOperationNamesRule.mjs
function UniqueOperationNamesRule(context) {
  const knownOperationNames = Object.create(null);
  return {
    OperationDefinition(node) {
      const operationName = node.name;
      if (operationName) {
        if (knownOperationNames[operationName.value]) {
          context.reportError(new GraphQLError(`There can be only one operation named "${operationName.value}".`, {
            nodes: [
              knownOperationNames[operationName.value],
              operationName
            ]
          }));
        } else {
          knownOperationNames[operationName.value] = operationName;
        }
      }
      return false;
    },
    FragmentDefinition: () => false
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueOperationTypesRule.mjs
function UniqueOperationTypesRule(context) {
  const schema = context.getSchema();
  const definedOperationTypes = Object.create(null);
  const existingOperationTypes = schema ? {
    query: schema.getQueryType(),
    mutation: schema.getMutationType(),
    subscription: schema.getSubscriptionType()
  } : {};
  return {
    SchemaDefinition: checkOperationTypes,
    SchemaExtension: checkOperationTypes
  };
  function checkOperationTypes(node) {
    var _node$operationTypes;
    const operationTypesNodes = (_node$operationTypes = node.operationTypes) !== null && _node$operationTypes !== undefined ? _node$operationTypes : [];
    for (const operationType of operationTypesNodes) {
      const operation = operationType.operation;
      const alreadyDefinedOperationType = definedOperationTypes[operation];
      if (existingOperationTypes[operation]) {
        context.reportError(new GraphQLError(`Type for ${operation} already defined in the schema. It cannot be redefined.`, {
          nodes: operationType
        }));
      } else if (alreadyDefinedOperationType) {
        context.reportError(new GraphQLError(`There can be only one ${operation} type in schema.`, {
          nodes: [alreadyDefinedOperationType, operationType]
        }));
      } else {
        definedOperationTypes[operation] = operationType;
      }
    }
    return false;
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueTypeNamesRule.mjs
function UniqueTypeNamesRule(context) {
  const knownTypeNames = Object.create(null);
  const schema = context.getSchema();
  return {
    ScalarTypeDefinition: checkTypeName,
    ObjectTypeDefinition: checkTypeName,
    InterfaceTypeDefinition: checkTypeName,
    UnionTypeDefinition: checkTypeName,
    EnumTypeDefinition: checkTypeName,
    InputObjectTypeDefinition: checkTypeName
  };
  function checkTypeName(node) {
    const typeName = node.name.value;
    if (schema !== null && schema !== undefined && schema.getType(typeName)) {
      context.reportError(new GraphQLError(`Type "${typeName}" already exists in the schema. It cannot also be defined in this type definition.`, {
        nodes: node.name
      }));
      return;
    }
    if (knownTypeNames[typeName]) {
      context.reportError(new GraphQLError(`There can be only one type named "${typeName}".`, {
        nodes: [knownTypeNames[typeName], node.name]
      }));
    } else {
      knownTypeNames[typeName] = node.name;
    }
    return false;
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/UniqueVariableNamesRule.mjs
function UniqueVariableNamesRule(context) {
  return {
    OperationDefinition(operationNode) {
      var _operationNode$variab;
      const variableDefinitions = (_operationNode$variab = operationNode.variableDefinitions) !== null && _operationNode$variab !== undefined ? _operationNode$variab : [];
      const seenVariableDefinitions = groupBy(variableDefinitions, (node) => node.variable.name.value);
      for (const [variableName, variableNodes] of seenVariableDefinitions) {
        if (variableNodes.length > 1) {
          context.reportError(new GraphQLError(`There can be only one variable named "$${variableName}".`, {
            nodes: variableNodes.map((node) => node.variable.name)
          }));
        }
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/ValuesOfCorrectTypeRule.mjs
function ValuesOfCorrectTypeRule(context) {
  return {
    ListValue(node) {
      const type = getNullableType(context.getParentInputType());
      if (!isListType(type)) {
        isValidValueNode(context, node);
        return false;
      }
    },
    ObjectValue(node) {
      const type = getNamedType(context.getInputType());
      if (!isInputObjectType(type)) {
        isValidValueNode(context, node);
        return false;
      }
      const fieldNodeMap = keyMap(node.fields, (field) => field.name.value);
      for (const fieldDef of Object.values(type.getFields())) {
        const fieldNode = fieldNodeMap[fieldDef.name];
        if (!fieldNode && isRequiredInputField(fieldDef)) {
          const typeStr = inspect(fieldDef.type);
          context.reportError(new GraphQLError(`Field "${type.name}.${fieldDef.name}" of required type "${typeStr}" was not provided.`, {
            nodes: node
          }));
        }
      }
      if (type.isOneOf) {
        validateOneOfInputObject(context, node, type, fieldNodeMap);
      }
    },
    ObjectField(node) {
      const parentType = getNamedType(context.getParentInputType());
      const fieldType = context.getInputType();
      if (!fieldType && isInputObjectType(parentType)) {
        const suggestions = context.hideSuggestions ? [] : suggestionList(node.name.value, Object.keys(parentType.getFields()));
        context.reportError(new GraphQLError(`Field "${node.name.value}" is not defined by type "${parentType.name}".` + didYouMean(suggestions), {
          nodes: node
        }));
      }
    },
    NullValue(node) {
      const type = context.getInputType();
      if (isNonNullType(type)) {
        context.reportError(new GraphQLError(`Expected value of type "${inspect(type)}", found ${printForError(node)}.`, {
          nodes: node
        }));
      }
    },
    EnumValue: (node) => isValidValueNode(context, node),
    IntValue: (node) => isValidValueNode(context, node),
    FloatValue: (node) => isValidValueNode(context, node),
    StringValue: (node) => isValidValueNode(context, node),
    BooleanValue: (node) => isValidValueNode(context, node)
  };
}
function isValidValueNode(context, node) {
  const locationType = context.getInputType();
  if (!locationType) {
    return;
  }
  const type = getNamedType(locationType);
  if (!isLeafType(type)) {
    const typeStr = inspect(locationType);
    context.reportError(new GraphQLError(`Expected value of type "${typeStr}", found ${printForError(node)}.`, {
      nodes: node
    }));
    return;
  }
  try {
    const parseResult = isEnumType(type) ? type.parseLiteral(node, undefined, context.hideSuggestions) : type.parseLiteral(node, undefined);
    if (parseResult === undefined) {
      const typeStr = inspect(locationType);
      context.reportError(new GraphQLError(`Expected value of type "${typeStr}", found ${printForError(node)}.`, {
        nodes: node
      }));
    }
  } catch (error) {
    const typeStr = inspect(locationType);
    if (error instanceof GraphQLError) {
      context.reportError(error);
    } else {
      context.reportError(new GraphQLError(`Expected value of type "${typeStr}", found ${printForError(node)}; ` + error.message, {
        nodes: node,
        originalError: error
      }));
    }
  }
}
function validateOneOfInputObject(context, node, type, fieldNodeMap) {
  var _fieldNodeMap$keys$;
  const keys = Object.keys(fieldNodeMap);
  const isNotExactlyOneField = keys.length !== 1;
  if (isNotExactlyOneField) {
    context.reportError(new GraphQLError(`OneOf Input Object "${type.name}" must specify exactly one key.`, {
      nodes: [node]
    }));
    return;
  }
  const value = (_fieldNodeMap$keys$ = fieldNodeMap[keys[0]]) === null || _fieldNodeMap$keys$ === undefined ? undefined : _fieldNodeMap$keys$.value;
  const isNullLiteral = !value || value.kind === Kind.NULL;
  if (isNullLiteral) {
    context.reportError(new GraphQLError(`Field "${type.name}.${keys[0]}" must be non-null.`, {
      nodes: [node]
    }));
  }
}

// zveltio-extensions/node_modules/graphql/validation/rules/VariablesAreInputTypesRule.mjs
function VariablesAreInputTypesRule(context) {
  return {
    VariableDefinition(node) {
      const type = typeFromAST(context.getSchema(), node.type);
      if (type !== undefined && !isInputType(type)) {
        const variableName = node.variable.name.value;
        const typeName = print(node.type);
        context.reportError(new GraphQLError(`Variable "$${variableName}" cannot be non-input type "${typeName}".`, {
          nodes: node.type
        }));
      }
    }
  };
}

// zveltio-extensions/node_modules/graphql/validation/rules/VariablesInAllowedPositionRule.mjs
function VariablesInAllowedPositionRule(context) {
  let varDefMap = Object.create(null);
  return {
    OperationDefinition: {
      enter() {
        varDefMap = Object.create(null);
      },
      leave(operation) {
        const usages = context.getRecursiveVariableUsages(operation);
        for (const { node, type, defaultValue, parentType } of usages) {
          const varName = node.name.value;
          const varDef = varDefMap[varName];
          if (varDef && type) {
            const schema = context.getSchema();
            const varType = typeFromAST(schema, varDef.type);
            if (varType && !allowedVariableUsage(schema, varType, varDef.defaultValue, type, defaultValue)) {
              const varTypeStr = inspect(varType);
              const typeStr = inspect(type);
              context.reportError(new GraphQLError(`Variable "$${varName}" of type "${varTypeStr}" used in position expecting type "${typeStr}".`, {
                nodes: [varDef, node]
              }));
            }
            if (isInputObjectType(parentType) && parentType.isOneOf && isNullableType(varType)) {
              context.reportError(new GraphQLError(`Variable "$${varName}" is of type "${varType}" but must be non-nullable to be used for OneOf Input Object "${parentType}".`, {
                nodes: [varDef, node]
              }));
            }
          }
        }
      }
    },
    VariableDefinition(node) {
      varDefMap[node.variable.name.value] = node;
    }
  };
}
function allowedVariableUsage(schema, varType, varDefaultValue, locationType, locationDefaultValue) {
  if (isNonNullType(locationType) && !isNonNullType(varType)) {
    const hasNonNullVariableDefaultValue = varDefaultValue != null && varDefaultValue.kind !== Kind.NULL;
    const hasLocationDefaultValue = locationDefaultValue !== undefined;
    if (!hasNonNullVariableDefaultValue && !hasLocationDefaultValue) {
      return false;
    }
    const nullableLocationType = locationType.ofType;
    return isTypeSubTypeOf(schema, varType, nullableLocationType);
  }
  return isTypeSubTypeOf(schema, varType, locationType);
}

// zveltio-extensions/node_modules/graphql/validation/specifiedRules.mjs
var recommendedRules = Object.freeze([MaxIntrospectionDepthRule]);
var specifiedRules = Object.freeze([
  ExecutableDefinitionsRule,
  UniqueOperationNamesRule,
  LoneAnonymousOperationRule,
  SingleFieldSubscriptionsRule,
  KnownTypeNamesRule,
  FragmentsOnCompositeTypesRule,
  VariablesAreInputTypesRule,
  ScalarLeafsRule,
  FieldsOnCorrectTypeRule,
  UniqueFragmentNamesRule,
  KnownFragmentNamesRule,
  NoUnusedFragmentsRule,
  PossibleFragmentSpreadsRule,
  NoFragmentCyclesRule,
  UniqueVariableNamesRule,
  NoUndefinedVariablesRule,
  NoUnusedVariablesRule,
  KnownDirectivesRule,
  UniqueDirectivesPerLocationRule,
  KnownArgumentNamesRule,
  UniqueArgumentNamesRule,
  ValuesOfCorrectTypeRule,
  ProvidedRequiredArgumentsRule,
  VariablesInAllowedPositionRule,
  OverlappingFieldsCanBeMergedRule,
  UniqueInputFieldNamesRule,
  ...recommendedRules
]);
var specifiedSDLRules = Object.freeze([
  LoneSchemaDefinitionRule,
  UniqueOperationTypesRule,
  UniqueTypeNamesRule,
  UniqueEnumValueNamesRule,
  UniqueFieldDefinitionNamesRule,
  UniqueArgumentDefinitionNamesRule,
  UniqueDirectiveNamesRule,
  KnownTypeNamesRule,
  KnownDirectivesRule,
  UniqueDirectivesPerLocationRule,
  PossibleTypeExtensionsRule,
  KnownArgumentNamesOnDirectivesRule,
  UniqueArgumentNamesRule,
  UniqueInputFieldNamesRule,
  ProvidedRequiredArgumentsOnDirectivesRule
]);

// zveltio-extensions/node_modules/graphql/jsutils/SetMap.mjs
class SetMap {
  constructor() {
    this._entries = new Map;
    this._memberIds = new Map;
    this._nextMemberId = 0;
  }
  get(members) {
    return this._entries.get(this._key(members));
  }
  set(members, value) {
    this._entries.set(this._key(members), value);
  }
  _key(members) {
    const ids = [];
    for (const member of members) {
      let id = this._memberIds.get(member);
      if (id === undefined) {
        id = this._nextMemberId++;
        this._memberIds.set(member, id);
      }
      ids.push(id);
    }
    ids.sort((id1, id2) => id1 - id2);
    return ids.join(",");
  }
}

// zveltio-extensions/node_modules/graphql/validation/ValidationContext.mjs
class ASTValidationContext {
  _remainingFragmentWork = 50000;
  constructor(ast, onError) {
    this._ast = ast;
    this._fragments = undefined;
    this._fragmentSpreads = new Map;
    this._recursivelyReferencedFragments = new SetMap;
    this._onError = onError;
  }
  get [Symbol.toStringTag]() {
    return "ASTValidationContext";
  }
  reportError(error) {
    this._onError(error);
  }
  getDocument() {
    return this._ast;
  }
  getFragment(name) {
    let fragments;
    if (this._fragments) {
      fragments = this._fragments;
    } else {
      fragments = Object.create(null);
      for (const defNode of this.getDocument().definitions) {
        if (defNode.kind === Kind.FRAGMENT_DEFINITION) {
          fragments[defNode.name.value] = defNode;
        }
      }
      this._fragments = fragments;
    }
    return fragments[name];
  }
  getFragmentSpreads(node) {
    let spreads = this._fragmentSpreads.get(node);
    if (!spreads) {
      spreads = [];
      const setsToVisit = [node];
      let set;
      while (set = setsToVisit.pop()) {
        for (const selection of set.selections) {
          if (selection.kind === Kind.FRAGMENT_SPREAD) {
            spreads.push(selection);
          } else if (selection.selectionSet) {
            setsToVisit.push(selection.selectionSet);
          }
        }
      }
      this._fragmentSpreads.set(node, spreads);
    }
    return spreads;
  }
  getRecursivelyReferencedFragments(operation) {
    return this.getRecursivelyReferencedFragmentsForOperations([operation]);
  }
  getRecursivelyReferencedFragmentsForOperations(operations) {
    const fragmentNames = new Set(operations.flatMap(({ selectionSet }) => this.getFragmentSpreads(selectionSet).map(({ name }) => name.value)));
    let fragments = this._recursivelyReferencedFragments.get(fragmentNames);
    if (!fragments) {
      fragments = [];
      this.spendFragmentWork(fragmentNames.size);
      const collectedNames = new Set(fragmentNames);
      for (const fragName of collectedNames) {
        const fragment = this.getFragment(fragName);
        if (fragment) {
          fragments.push(fragment);
          const spreads = this.getFragmentSpreads(fragment.selectionSet);
          this.spendFragmentWork(spreads.length);
          for (const spread of spreads) {
            collectedNames.add(spread.name.value);
          }
        }
      }
      this._recursivelyReferencedFragments.set(fragmentNames, fragments);
    }
    return fragments;
  }
  spendFragmentWork(cost) {
    this._remainingFragmentWork -= cost;
    if (this._remainingFragmentWork < 0) {
      throw validationAbortedError;
    }
  }
}
class ValidationContext extends ASTValidationContext {
  constructor(schema, ast, typeInfo, onError, hideSuggestions) {
    super(ast, onError);
    this._hideSuggestions = hideSuggestions !== null && hideSuggestions !== undefined ? hideSuggestions : false;
    this._schema = schema;
    this._typeInfo = typeInfo;
    this._variableUsages = new Map;
    this._recursiveVariableUsages = new Map;
  }
  get hideSuggestions() {
    return this._hideSuggestions;
  }
  get [Symbol.toStringTag]() {
    return "ValidationContext";
  }
  getSchema() {
    return this._schema;
  }
  getVariableUsages(node) {
    let usages = this._variableUsages.get(node);
    if (!usages) {
      const newUsages = [];
      const typeInfo = new TypeInfo(this._schema);
      visit(node, visitWithTypeInfo(typeInfo, {
        VariableDefinition: () => false,
        Variable(variable) {
          newUsages.push({
            node: variable,
            type: typeInfo.getInputType(),
            defaultValue: typeInfo.getDefaultValue(),
            parentType: typeInfo.getParentInputType()
          });
        }
      }));
      usages = newUsages;
      this._variableUsages.set(node, usages);
    }
    return usages;
  }
  getRecursiveVariableUsages(operation) {
    let usages = this._recursiveVariableUsages.get(operation);
    if (!usages) {
      const fragments = this.getRecursivelyReferencedFragments(operation);
      let fragmentUsages = this._recursiveVariableUsages.get(fragments);
      if (!fragmentUsages) {
        this.spendFragmentWork(fragments.length);
        fragmentUsages = fragments.flatMap((frag) => {
          const localUsages = this.getVariableUsages(frag);
          this.spendFragmentWork(localUsages.length);
          return localUsages;
        });
        this._recursiveVariableUsages.set(fragments, fragmentUsages);
      }
      this.spendFragmentWork(fragmentUsages.length);
      usages = this.getVariableUsages(operation).concat(fragmentUsages);
      this._recursiveVariableUsages.set(operation, usages);
    }
    return usages;
  }
  getType() {
    return this._typeInfo.getType();
  }
  getParentType() {
    return this._typeInfo.getParentType();
  }
  getInputType() {
    return this._typeInfo.getInputType();
  }
  getParentInputType() {
    return this._typeInfo.getParentInputType();
  }
  getFieldDef() {
    return this._typeInfo.getFieldDef();
  }
  getDirective() {
    return this._typeInfo.getDirective();
  }
  getArgument() {
    return this._typeInfo.getArgument();
  }
  getEnumValue() {
    return this._typeInfo.getEnumValue();
  }
}

// zveltio-extensions/node_modules/graphql/validation/validate.mjs
var QueryDocumentKeysToValidate = mapValue(QueryDocumentKeys, (keys) => keys.filter((key) => key !== "description"));
function validate(schema, documentAST, rules = specifiedRules, options, typeInfo = new TypeInfo(schema)) {
  var _options$maxErrors, _options$hideSuggesti;
  const maxErrors = (_options$maxErrors = options === null || options === undefined ? undefined : options.maxErrors) !== null && _options$maxErrors !== undefined ? _options$maxErrors : 100;
  const hideSuggestions = (_options$hideSuggesti = options === null || options === undefined ? undefined : options.hideSuggestions) !== null && _options$hideSuggesti !== undefined ? _options$hideSuggesti : false;
  documentAST || devAssert(false, "Must provide document.");
  assertValidSchema(schema);
  const abortObj = Object.freeze({});
  const errors = [];
  const context = new ValidationContext(schema, documentAST, typeInfo, (error) => {
    if (errors.length >= maxErrors) {
      errors.push(new GraphQLError("Too many validation errors, error limit reached. Validation aborted."));
      throw abortObj;
    }
    errors.push(error);
  }, hideSuggestions);
  const visitor = visitInParallel(rules.map((rule) => rule(context)));
  try {
    visit(documentAST, visitWithTypeInfo(typeInfo, visitor), QueryDocumentKeysToValidate);
  } catch (e) {
    if (e === validationAbortedError) {
      errors.push(validationAbortedError);
    } else if (e !== abortObj) {
      throw e;
    }
  }
  return errors;
}
// zveltio-extensions/node_modules/graphql/validation/rules/custom/NoSchemaIntrospectionCustomRule.mjs
function NoSchemaIntrospectionCustomRule(context) {
  return {
    Field(node) {
      const type = getNamedType(context.getType());
      if (type && isIntrospectionType(type)) {
        context.reportError(new GraphQLError(`GraphQL introspection has been disabled, but the requested query contained the field "${node.name.value}".`, {
          nodes: node
        }));
      }
    }
  };
}
// zveltio-extensions/node_modules/kysely/dist/util/object-utils.js
function isUndefined(obj) {
  return typeof obj === "undefined" || obj === undefined;
}
function isString(obj) {
  return typeof obj === "string";
}
function isNumber(obj) {
  return typeof obj === "number";
}
function isBoolean(obj) {
  return typeof obj === "boolean";
}
function isNull(obj) {
  return obj === null;
}
function isBigInt(obj) {
  return typeof obj === "bigint";
}
function isFunction(obj) {
  return typeof obj === "function";
}
function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}
function freeze(obj) {
  return Object.freeze(obj);
}
function asArray(arg) {
  if (isReadonlyArray(arg)) {
    return arg;
  } else {
    return [arg];
  }
}
function isReadonlyArray(arg) {
  return Array.isArray(arg);
}
function getMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/identifier-node.js
var IdentifierNode = freeze({
  is(node) {
    return node.kind === "IdentifierNode";
  },
  create(name) {
    return freeze({
      kind: "IdentifierNode",
      name
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/schemable-identifier-node.js
var SchemableIdentifierNode = freeze({
  is(node) {
    return node.kind === "SchemableIdentifierNode";
  },
  create(identifier) {
    return freeze({
      kind: "SchemableIdentifierNode",
      identifier: IdentifierNode.create(identifier)
    });
  },
  createWithSchema(schema, identifier) {
    return freeze({
      kind: "SchemableIdentifierNode",
      schema: IdentifierNode.create(schema),
      identifier: IdentifierNode.create(identifier)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/alias-node.js
var AliasNode = freeze({
  is(node) {
    return node.kind === "AliasNode";
  },
  create(node, alias) {
    return freeze({
      kind: "AliasNode",
      node,
      alias
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/table-node.js
var TableNode = freeze({
  is(node) {
    return node.kind === "TableNode";
  },
  create(table) {
    return freeze({
      kind: "TableNode",
      table: SchemableIdentifierNode.create(table)
    });
  },
  createWithSchema(schema, table) {
    return freeze({
      kind: "TableNode",
      table: SchemableIdentifierNode.createWithSchema(schema, table)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/operation-node-source.js
function isOperationNodeSource(obj) {
  return isObject(obj) && isFunction(obj.toOperationNode);
}

// zveltio-extensions/node_modules/kysely/dist/expression/expression.js
function isExpression(obj) {
  return isObject(obj) && "expressionType" in obj && isOperationNodeSource(obj);
}
function isAliasedExpression(obj) {
  return isObject(obj) && "expression" in obj && isString(obj.alias) && isOperationNodeSource(obj);
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/select-modifier-node.js
var SelectModifierNode = freeze({
  is(node) {
    return node.kind === "SelectModifierNode";
  },
  create(modifier, of) {
    return freeze({
      kind: "SelectModifierNode",
      modifier,
      of
    });
  },
  createWithExpression(modifier) {
    return freeze({
      kind: "SelectModifierNode",
      rawModifier: modifier
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/and-node.js
var AndNode = freeze({
  is(node) {
    return node.kind === "AndNode";
  },
  create(left, right) {
    return freeze({
      kind: "AndNode",
      left,
      right
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/or-node.js
var OrNode = freeze({
  is(node) {
    return node.kind === "OrNode";
  },
  create(left, right) {
    return freeze({
      kind: "OrNode",
      left,
      right
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/on-node.js
var OnNode = freeze({
  is(node) {
    return node.kind === "OnNode";
  },
  create(filter) {
    return freeze({
      kind: "OnNode",
      on: filter
    });
  },
  cloneWithOperation(onNode, operator, operation) {
    return freeze({
      ...onNode,
      on: operator === "And" ? AndNode.create(onNode.on, operation) : OrNode.create(onNode.on, operation)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/join-node.js
var JoinNode = freeze({
  is(node) {
    return node.kind === "JoinNode";
  },
  create(joinType, table) {
    return freeze({
      kind: "JoinNode",
      joinType,
      table,
      on: undefined
    });
  },
  createWithOn(joinType, table, on) {
    return freeze({
      kind: "JoinNode",
      joinType,
      table,
      on: OnNode.create(on)
    });
  },
  cloneWithOn(joinNode, operation) {
    return freeze({
      ...joinNode,
      on: joinNode.on ? OnNode.cloneWithOperation(joinNode.on, "And", operation) : OnNode.create(operation)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/binary-operation-node.js
var BinaryOperationNode = freeze({
  is(node) {
    return node.kind === "BinaryOperationNode";
  },
  create(leftOperand, operator, rightOperand) {
    return freeze({
      kind: "BinaryOperationNode",
      leftOperand,
      operator,
      rightOperand
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/operator-node.js
var COMPARISON_OPERATORS_DICTIONARY = freeze({
  "=": true,
  "==": true,
  "!=": true,
  "<>": true,
  ">": true,
  ">=": true,
  "<": true,
  "<=": true,
  in: true,
  "not in": true,
  is: true,
  "is not": true,
  like: true,
  "not like": true,
  match: true,
  ilike: true,
  "not ilike": true,
  "@>": true,
  "<@": true,
  "^@": true,
  "&&": true,
  "?": true,
  "?&": true,
  "?|": true,
  "!<": true,
  "!>": true,
  "<=>": true,
  "!~": true,
  "~": true,
  "~*": true,
  "!~*": true,
  "@@": true,
  "@@@": true,
  "!!": true,
  "<->": true,
  regexp: true,
  "is distinct from": true,
  "is not distinct from": true
});
var COMPARISON_OPERATORS = Object.keys(COMPARISON_OPERATORS_DICTIONARY);
var ARITHMETIC_OPERATORS_DICTIONARY = freeze({
  "+": true,
  "-": true,
  "*": true,
  "/": true,
  "%": true,
  "^": true,
  "&": true,
  "|": true,
  "#": true,
  "<<": true,
  ">>": true
});
var ARITHMETIC_OPERATORS = Object.keys(ARITHMETIC_OPERATORS_DICTIONARY);
var JSON_OPERATORS_DICTIONARY = freeze({
  "->": true,
  "->>": true
});
var JSON_OPERATORS = Object.keys(JSON_OPERATORS_DICTIONARY);
var BINARY_OPERATORS_DICTIONARY = freeze({
  ...COMPARISON_OPERATORS_DICTIONARY,
  ...ARITHMETIC_OPERATORS_DICTIONARY,
  "||": true
});
var BINARY_OPERATORS = Object.keys(BINARY_OPERATORS_DICTIONARY);
var UNARY_FILTER_OPERATORS_DICTIONARY = freeze({
  exists: true,
  "not exists": true
});
var UNARY_FILTER_OPERATORS = Object.keys(UNARY_FILTER_OPERATORS_DICTIONARY);
var UNARY_OPERATORS_DICTIONARY = freeze({
  ...UNARY_FILTER_OPERATORS_DICTIONARY,
  "-": true,
  not: true
});
var UNARY_OPERATORS = Object.keys(UNARY_OPERATORS_DICTIONARY);
var OPERATORS = [
  ...BINARY_OPERATORS,
  ...JSON_OPERATORS,
  ...UNARY_OPERATORS,
  "between",
  "between symmetric"
];
var OperatorNode = freeze({
  is(node) {
    return node.kind === "OperatorNode";
  },
  create(operator) {
    return freeze({
      kind: "OperatorNode",
      operator
    });
  }
});
function isBinaryOperator(op) {
  return isString(op) && BINARY_OPERATORS_DICTIONARY[op];
}
function isJSONOperator(op) {
  return isString(op) && JSON_OPERATORS_DICTIONARY[op];
}
function isUnaryOperator(op) {
  return isString(op) && UNARY_OPERATORS_DICTIONARY[op];
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/column-node.js
var ColumnNode = freeze({
  is(node) {
    return node.kind === "ColumnNode";
  },
  create(column) {
    return freeze({
      kind: "ColumnNode",
      column: IdentifierNode.create(column)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/select-all-node.js
var SelectAllNode = freeze({
  is(node) {
    return node.kind === "SelectAllNode";
  },
  create() {
    return freeze({
      kind: "SelectAllNode"
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/reference-node.js
var ReferenceNode = freeze({
  is(node) {
    return node.kind === "ReferenceNode";
  },
  create(column, table) {
    return freeze({
      kind: "ReferenceNode",
      table,
      column
    });
  },
  createSelectAll(table) {
    return freeze({
      kind: "ReferenceNode",
      table,
      column: SelectAllNode.create()
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/dynamic/dynamic-reference-builder.js
function isDynamicReferenceBuilder(obj) {
  return isObject(obj) && isOperationNodeSource(obj) && isString(obj.dynamicReference);
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/order-by-item-node.js
var OrderByItemNode = freeze({
  is(node) {
    return node.kind === "OrderByItemNode";
  },
  create(orderBy, direction) {
    return freeze({
      kind: "OrderByItemNode",
      orderBy,
      direction
    });
  },
  cloneWith(node, props) {
    return freeze({
      ...node,
      ...props
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/raw-node.js
var RawNode = freeze({
  is(node) {
    return node.kind === "RawNode";
  },
  create(sqlFragments, parameters) {
    return freeze({
      kind: "RawNode",
      sqlFragments: freeze(sqlFragments),
      parameters: freeze(parameters)
    });
  },
  createWithSql(sql) {
    return RawNode.create([sql], []);
  },
  createWithChild(child) {
    return RawNode.create(["", ""], [child]);
  },
  createWithChildren(children) {
    return RawNode.create(new Array(children.length + 1).fill(""), children);
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/collate-node.js
var CollateNode = freeze({
  is(node) {
    return node.kind === "CollateNode";
  },
  create(collation) {
    return freeze({
      kind: "CollateNode",
      collation: IdentifierNode.create(collation)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/query-builder/order-by-item-builder.js
class OrderByItemBuilder {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  desc() {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, {
        direction: RawNode.createWithSql("desc")
      })
    });
  }
  asc() {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, {
        direction: RawNode.createWithSql("asc")
      })
    });
  }
  nullsLast() {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, { nulls: "last" })
    });
  }
  nullsFirst() {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, { nulls: "first" })
    });
  }
  collate(collation) {
    return new OrderByItemBuilder({
      node: OrderByItemNode.cloneWith(this.#props.node, {
        collation: CollateNode.create(collation)
      })
    });
  }
  toOperationNode() {
    return this.#props.node;
  }
}

// zveltio-extensions/node_modules/kysely/dist/util/log-once.js
var LOGGED_MESSAGES = new Set;
function logOnce(message) {
  if (LOGGED_MESSAGES.has(message)) {
    return;
  }
  LOGGED_MESSAGES.add(message);
  console.log(message);
}

// zveltio-extensions/node_modules/kysely/dist/parser/order-by-parser.js
function isOrderByDirection(thing) {
  return thing === "asc" || thing === "desc";
}
function parseOrderBy(args) {
  if (args.length === 2) {
    return [parseOrderByItem(args[0], args[1])];
  }
  if (args.length === 1) {
    const [orderBy] = args;
    if (Array.isArray(orderBy)) {
      logOnce("orderBy(array) is deprecated, use multiple orderBy calls instead.");
      return orderBy.map((item) => parseOrderByItem(item));
    }
    return [parseOrderByItem(orderBy)];
  }
  throw new Error(`Invalid number of arguments at order by! expected 1-2, received ${args.length}`);
}
function parseOrderByItem(expr, modifiers) {
  const parsedRef = parseOrderByExpression(expr);
  if (OrderByItemNode.is(parsedRef)) {
    if (modifiers) {
      throw new Error("Cannot specify direction twice!");
    }
    return parsedRef;
  }
  return parseOrderByWithModifiers(parsedRef, modifiers);
}
function parseOrderByExpression(expr) {
  if (isExpressionOrFactory(expr)) {
    return parseExpression(expr);
  }
  if (isDynamicReferenceBuilder(expr)) {
    return expr.toOperationNode();
  }
  const [ref, direction] = expr.split(" ");
  if (direction) {
    logOnce("`orderBy('column asc')` is deprecated. Use `orderBy('column', 'asc')` instead.");
    return parseOrderByWithModifiers(parseStringReference(ref), direction);
  }
  return parseStringReference(expr);
}
function parseOrderByWithModifiers(expr, modifiers) {
  if (typeof modifiers === "string") {
    if (!isOrderByDirection(modifiers)) {
      throw new Error(`Invalid order by direction: ${modifiers}`);
    }
    return OrderByItemNode.create(expr, RawNode.createWithSql(modifiers));
  }
  if (isExpression(modifiers)) {
    logOnce("`orderBy(..., expr)` is deprecated. Use `orderBy(..., 'asc')` or `orderBy(..., (ob) => ...)` instead.");
    return OrderByItemNode.create(expr, modifiers.toOperationNode());
  }
  const node = OrderByItemNode.create(expr);
  if (!modifiers) {
    return node;
  }
  return modifiers(new OrderByItemBuilder({ node })).toOperationNode();
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/json-reference-node.js
var JSONReferenceNode = freeze({
  is(node) {
    return node.kind === "JSONReferenceNode";
  },
  create(reference, traversal) {
    return freeze({
      kind: "JSONReferenceNode",
      reference,
      traversal
    });
  },
  cloneWithTraversal(node, traversal) {
    return freeze({
      ...node,
      traversal
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/json-operator-chain-node.js
var JSONOperatorChainNode = freeze({
  is(node) {
    return node.kind === "JSONOperatorChainNode";
  },
  create(operator) {
    return freeze({
      kind: "JSONOperatorChainNode",
      operator,
      values: freeze([])
    });
  },
  cloneWithValue(node, value) {
    return freeze({
      ...node,
      values: freeze([...node.values, value])
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/json-path-node.js
var JSONPathNode = freeze({
  is(node) {
    return node.kind === "JSONPathNode";
  },
  create(inOperator) {
    return freeze({
      kind: "JSONPathNode",
      inOperator,
      pathLegs: freeze([])
    });
  },
  cloneWithLeg(jsonPathNode, pathLeg) {
    return freeze({
      ...jsonPathNode,
      pathLegs: freeze([...jsonPathNode.pathLegs, pathLeg])
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/reference-parser.js
function parseSimpleReferenceExpression(exp) {
  if (isString(exp)) {
    return parseStringReference(exp);
  }
  return exp.toOperationNode();
}
function parseReferenceExpressionOrList(arg) {
  if (isReadonlyArray(arg)) {
    return arg.map((it) => parseReferenceExpression(it));
  } else {
    return [parseReferenceExpression(arg)];
  }
}
function parseReferenceExpression(exp) {
  if (isExpressionOrFactory(exp)) {
    return parseExpression(exp);
  }
  return parseSimpleReferenceExpression(exp);
}
function parseJSONReference(ref, op) {
  if (isJSONOperator(op)) {
    return JSONReferenceNode.create(parseStringReference(ref), JSONOperatorChainNode.create(OperatorNode.create(op)));
  }
  if (op === "->$" || op === "->>$") {
    return JSONReferenceNode.create(parseStringReference(ref), JSONPathNode.create(OperatorNode.create(op.slice(0, -1))));
  }
  throw new Error(`Invalid JSON operator: ${op}`);
}
function parseStringReference(ref) {
  const COLUMN_SEPARATOR = ".";
  if (!ref.includes(COLUMN_SEPARATOR)) {
    return ReferenceNode.create(ColumnNode.create(ref));
  }
  const parts = ref.split(COLUMN_SEPARATOR).map(trim);
  if (parts.length === 3) {
    return parseStringReferenceWithTableAndSchema(parts);
  }
  if (parts.length === 2) {
    return parseStringReferenceWithTable(parts);
  }
  throw new Error(`invalid column reference ${ref}`);
}
function parseAliasedStringReference(ref) {
  const ALIAS_SEPARATOR = " as ";
  if (ref.includes(ALIAS_SEPARATOR)) {
    const [columnRef, alias] = ref.split(ALIAS_SEPARATOR).map(trim);
    return AliasNode.create(parseStringReference(columnRef), IdentifierNode.create(alias));
  } else {
    return parseStringReference(ref);
  }
}
function parseStringReferenceWithTableAndSchema(parts) {
  const [schema, table, column] = parts;
  return ReferenceNode.create(ColumnNode.create(column), TableNode.createWithSchema(schema, table));
}
function parseStringReferenceWithTable(parts) {
  const [table, column] = parts;
  return ReferenceNode.create(ColumnNode.create(column), TableNode.create(table));
}
function trim(str) {
  return str.trim();
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/primitive-value-list-node.js
var PrimitiveValueListNode = freeze({
  is(node) {
    return node.kind === "PrimitiveValueListNode";
  },
  create(values) {
    return freeze({
      kind: "PrimitiveValueListNode",
      values: freeze([...values])
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/value-list-node.js
var ValueListNode = freeze({
  is(node) {
    return node.kind === "ValueListNode";
  },
  create(values) {
    return freeze({
      kind: "ValueListNode",
      values: freeze(values)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/value-node.js
var ValueNode = freeze({
  is(node) {
    return node.kind === "ValueNode";
  },
  create(value) {
    return freeze({
      kind: "ValueNode",
      value
    });
  },
  createImmediate(value) {
    return freeze({
      kind: "ValueNode",
      value,
      immediate: true
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/value-parser.js
function parseValueExpressionOrList(arg) {
  if (isReadonlyArray(arg)) {
    return parseValueExpressionList(arg);
  }
  return parseValueExpression(arg);
}
function parseValueExpression(exp) {
  if (isExpressionOrFactory(exp)) {
    return parseExpression(exp);
  }
  return ValueNode.create(exp);
}
function isSafeImmediateValue(value) {
  return isNumber(value) || isBoolean(value) || isNull(value);
}
function parseSafeImmediateValue(value) {
  if (!isSafeImmediateValue(value)) {
    throw new Error(`unsafe immediate value ${JSON.stringify(value)}`);
  }
  return ValueNode.createImmediate(value);
}
function parseValueExpressionList(arg) {
  if (arg.some(isExpressionOrFactory)) {
    return ValueListNode.create(arg.map((it) => parseValueExpression(it)));
  }
  return PrimitiveValueListNode.create(arg);
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/parens-node.js
var ParensNode = freeze({
  is(node) {
    return node.kind === "ParensNode";
  },
  create(node) {
    return freeze({
      kind: "ParensNode",
      node
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/binary-operation-parser.js
function parseValueBinaryOperationOrExpression(args) {
  if (args.length === 3) {
    return parseValueBinaryOperation(args[0], args[1], args[2]);
  } else if (args.length === 1) {
    return parseValueExpression(args[0]);
  }
  throw new Error(`invalid arguments: ${JSON.stringify(args)}`);
}
function parseValueBinaryOperation(left, operator, right) {
  if (isIsOperator(operator) && needsIsOperator(right)) {
    return BinaryOperationNode.create(parseReferenceExpression(left), parseBinaryOperator(operator), ValueNode.createImmediate(right));
  }
  return BinaryOperationNode.create(parseReferenceExpression(left), parseBinaryOperator(operator), parseValueExpressionOrList(right));
}
function parseReferentialBinaryOperation(left, operator, right) {
  return BinaryOperationNode.create(parseReferenceExpression(left), parseBinaryOperator(operator), parseReferenceExpression(right));
}
function parseFilterObject(obj, combinator) {
  return parseFilterList(Object.entries(obj).filter(([, v]) => !isUndefined(v)).map(([k, v]) => parseValueBinaryOperation(k, needsIsOperator(v) ? "is" : "=", v)), combinator);
}
function parseFilterList(list, combinator, withParens = true) {
  const combine = combinator === "and" ? AndNode.create : OrNode.create;
  if (list.length === 0) {
    return BinaryOperationNode.create(ValueNode.createImmediate(1), OperatorNode.create("="), ValueNode.createImmediate(combinator === "and" ? 1 : 0));
  }
  let node = toOperationNode(list[0]);
  for (let i = 1;i < list.length; ++i) {
    node = combine(node, toOperationNode(list[i]));
  }
  if (list.length > 1 && withParens) {
    return ParensNode.create(node);
  }
  return node;
}
function isIsOperator(operator) {
  return operator === "is" || operator === "is not";
}
function needsIsOperator(value) {
  return isNull(value) || isBoolean(value);
}
function parseBinaryOperator(operator) {
  if (isBinaryOperator(operator)) {
    return OperatorNode.create(operator);
  }
  if (isOperationNodeSource(operator)) {
    return operator.toOperationNode();
  }
  throw new Error(`invalid operator ${JSON.stringify(operator)}`);
}
function toOperationNode(nodeOrSource) {
  return isOperationNodeSource(nodeOrSource) ? nodeOrSource.toOperationNode() : nodeOrSource;
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/order-by-node.js
var OrderByNode = freeze({
  is(node) {
    return node.kind === "OrderByNode";
  },
  create(items) {
    return freeze({
      kind: "OrderByNode",
      items: freeze([...items])
    });
  },
  cloneWithItems(orderBy, items) {
    return freeze({
      ...orderBy,
      items: freeze([...orderBy.items, ...items])
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/partition-by-node.js
var PartitionByNode = freeze({
  is(node) {
    return node.kind === "PartitionByNode";
  },
  create(items) {
    return freeze({
      kind: "PartitionByNode",
      items: freeze(items)
    });
  },
  cloneWithItems(partitionBy, items) {
    return freeze({
      ...partitionBy,
      items: freeze([...partitionBy.items, ...items])
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/over-node.js
var OverNode = freeze({
  is(node) {
    return node.kind === "OverNode";
  },
  create() {
    return freeze({
      kind: "OverNode"
    });
  },
  cloneWithOrderByItems(overNode, items) {
    return freeze({
      ...overNode,
      orderBy: overNode.orderBy ? OrderByNode.cloneWithItems(overNode.orderBy, items) : OrderByNode.create(items)
    });
  },
  cloneWithPartitionByItems(overNode, items) {
    return freeze({
      ...overNode,
      partitionBy: overNode.partitionBy ? PartitionByNode.cloneWithItems(overNode.partitionBy, items) : PartitionByNode.create(items)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/from-node.js
var FromNode = freeze({
  is(node) {
    return node.kind === "FromNode";
  },
  create(froms) {
    return freeze({
      kind: "FromNode",
      froms: freeze(froms)
    });
  },
  cloneWithFroms(from, froms) {
    return freeze({
      ...from,
      froms: freeze([...from.froms, ...froms])
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/group-by-node.js
var GroupByNode = freeze({
  is(node) {
    return node.kind === "GroupByNode";
  },
  create(items) {
    return freeze({
      kind: "GroupByNode",
      items: freeze(items)
    });
  },
  cloneWithItems(groupBy, items) {
    return freeze({
      ...groupBy,
      items: freeze([...groupBy.items, ...items])
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/having-node.js
var HavingNode = freeze({
  is(node) {
    return node.kind === "HavingNode";
  },
  create(filter) {
    return freeze({
      kind: "HavingNode",
      having: filter
    });
  },
  cloneWithOperation(havingNode, operator, operation) {
    return freeze({
      ...havingNode,
      having: operator === "And" ? AndNode.create(havingNode.having, operation) : OrNode.create(havingNode.having, operation)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/insert-query-node.js
var InsertQueryNode = freeze({
  is(node) {
    return node.kind === "InsertQueryNode";
  },
  create(into, withNode, replace) {
    return freeze({
      kind: "InsertQueryNode",
      into,
      ...withNode && { with: withNode },
      replace
    });
  },
  createWithoutInto() {
    return freeze({
      kind: "InsertQueryNode"
    });
  },
  cloneWith(insertQuery, props) {
    return freeze({
      ...insertQuery,
      ...props
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/list-node.js
var ListNode = freeze({
  is(node) {
    return node.kind === "ListNode";
  },
  create(items) {
    return freeze({
      kind: "ListNode",
      items: freeze(items)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/update-query-node.js
var UpdateQueryNode = freeze({
  is(node) {
    return node.kind === "UpdateQueryNode";
  },
  create(tables, withNode) {
    return freeze({
      kind: "UpdateQueryNode",
      table: tables.length === 1 ? tables[0] : ListNode.create(tables),
      ...withNode && { with: withNode }
    });
  },
  createWithoutTable() {
    return freeze({
      kind: "UpdateQueryNode"
    });
  },
  cloneWithFromItems(updateQuery, fromItems) {
    return freeze({
      ...updateQuery,
      from: updateQuery.from ? FromNode.cloneWithFroms(updateQuery.from, fromItems) : FromNode.create(fromItems)
    });
  },
  cloneWithUpdates(updateQuery, updates) {
    return freeze({
      ...updateQuery,
      updates: updateQuery.updates ? freeze([...updateQuery.updates, ...updates]) : updates
    });
  },
  cloneWithLimit(updateQuery, limit) {
    return freeze({
      ...updateQuery,
      limit
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/using-node.js
var UsingNode = freeze({
  is(node) {
    return node.kind === "UsingNode";
  },
  create(tables) {
    return freeze({
      kind: "UsingNode",
      tables: freeze(tables)
    });
  },
  cloneWithTables(using, tables) {
    return freeze({
      ...using,
      tables: freeze([...using.tables, ...tables])
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/delete-query-node.js
var DeleteQueryNode = freeze({
  is(node) {
    return node.kind === "DeleteQueryNode";
  },
  create(fromItems, withNode) {
    return freeze({
      kind: "DeleteQueryNode",
      from: FromNode.create(fromItems),
      ...withNode && { with: withNode }
    });
  },
  cloneWithOrderByItems: (node, items) => QueryNode.cloneWithOrderByItems(node, items),
  cloneWithoutOrderBy: (node) => QueryNode.cloneWithoutOrderBy(node),
  cloneWithLimit(deleteNode, limit) {
    return freeze({
      ...deleteNode,
      limit
    });
  },
  cloneWithoutLimit(deleteNode) {
    return freeze({
      ...deleteNode,
      limit: undefined
    });
  },
  cloneWithUsing(deleteNode, tables) {
    return freeze({
      ...deleteNode,
      using: deleteNode.using !== undefined ? UsingNode.cloneWithTables(deleteNode.using, tables) : UsingNode.create(tables)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/where-node.js
var WhereNode = freeze({
  is(node) {
    return node.kind === "WhereNode";
  },
  create(filter) {
    return freeze({
      kind: "WhereNode",
      where: filter
    });
  },
  cloneWithOperation(whereNode, operator, operation) {
    return freeze({
      ...whereNode,
      where: operator === "And" ? AndNode.create(whereNode.where, operation) : OrNode.create(whereNode.where, operation)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/returning-node.js
var ReturningNode = freeze({
  is(node) {
    return node.kind === "ReturningNode";
  },
  create(selections) {
    return freeze({
      kind: "ReturningNode",
      selections: freeze(selections)
    });
  },
  cloneWithSelections(returning, selections) {
    return freeze({
      ...returning,
      selections: returning.selections ? freeze([...returning.selections, ...selections]) : freeze(selections)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/explain-node.js
var ExplainNode = freeze({
  is(node) {
    return node.kind === "ExplainNode";
  },
  create(format, options) {
    return freeze({
      kind: "ExplainNode",
      format,
      options
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/when-node.js
var WhenNode = freeze({
  is(node) {
    return node.kind === "WhenNode";
  },
  create(condition) {
    return freeze({
      kind: "WhenNode",
      condition
    });
  },
  cloneWithResult(whenNode, result) {
    return freeze({
      ...whenNode,
      result
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/merge-query-node.js
var MergeQueryNode = freeze({
  is(node) {
    return node.kind === "MergeQueryNode";
  },
  create(into, withNode) {
    return freeze({
      kind: "MergeQueryNode",
      into,
      ...withNode && { with: withNode }
    });
  },
  cloneWithUsing(mergeNode, using) {
    return freeze({
      ...mergeNode,
      using
    });
  },
  cloneWithWhen(mergeNode, when) {
    return freeze({
      ...mergeNode,
      whens: mergeNode.whens ? freeze([...mergeNode.whens, when]) : freeze([when])
    });
  },
  cloneWithThen(mergeNode, then) {
    return freeze({
      ...mergeNode,
      whens: mergeNode.whens ? freeze([
        ...mergeNode.whens.slice(0, -1),
        WhenNode.cloneWithResult(mergeNode.whens[mergeNode.whens.length - 1], then)
      ]) : undefined
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/output-node.js
var OutputNode = freeze({
  is(node) {
    return node.kind === "OutputNode";
  },
  create(selections) {
    return freeze({
      kind: "OutputNode",
      selections: freeze(selections)
    });
  },
  cloneWithSelections(output, selections) {
    return freeze({
      ...output,
      selections: output.selections ? freeze([...output.selections, ...selections]) : freeze(selections)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/query-node.js
var QueryNode = freeze({
  is(node) {
    return SelectQueryNode.is(node) || InsertQueryNode.is(node) || UpdateQueryNode.is(node) || DeleteQueryNode.is(node) || MergeQueryNode.is(node);
  },
  cloneWithEndModifier(node, modifier) {
    return freeze({
      ...node,
      endModifiers: node.endModifiers ? freeze([...node.endModifiers, modifier]) : freeze([modifier])
    });
  },
  cloneWithWhere(node, operation) {
    return freeze({
      ...node,
      where: node.where ? WhereNode.cloneWithOperation(node.where, "And", operation) : WhereNode.create(operation)
    });
  },
  cloneWithJoin(node, join) {
    return freeze({
      ...node,
      joins: node.joins ? freeze([...node.joins, join]) : freeze([join])
    });
  },
  cloneWithReturning(node, selections) {
    return freeze({
      ...node,
      returning: node.returning ? ReturningNode.cloneWithSelections(node.returning, selections) : ReturningNode.create(selections)
    });
  },
  cloneWithoutReturning(node) {
    return freeze({
      ...node,
      returning: undefined
    });
  },
  cloneWithoutWhere(node) {
    return freeze({
      ...node,
      where: undefined
    });
  },
  cloneWithExplain(node, format, options) {
    return freeze({
      ...node,
      explain: ExplainNode.create(format, options?.toOperationNode())
    });
  },
  cloneWithTop(node, top) {
    return freeze({
      ...node,
      top
    });
  },
  cloneWithOutput(node, selections) {
    return freeze({
      ...node,
      output: node.output ? OutputNode.cloneWithSelections(node.output, selections) : OutputNode.create(selections)
    });
  },
  cloneWithOrderByItems(node, items) {
    return freeze({
      ...node,
      orderBy: node.orderBy ? OrderByNode.cloneWithItems(node.orderBy, items) : OrderByNode.create(items)
    });
  },
  cloneWithoutOrderBy(node) {
    return freeze({
      ...node,
      orderBy: undefined
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/select-query-node.js
var SelectQueryNode = freeze({
  is(node) {
    return node.kind === "SelectQueryNode";
  },
  create(withNode) {
    return freeze({
      kind: "SelectQueryNode",
      ...withNode && { with: withNode }
    });
  },
  createFrom(fromItems, withNode) {
    return freeze({
      kind: "SelectQueryNode",
      from: FromNode.create(fromItems),
      ...withNode && { with: withNode }
    });
  },
  cloneWithSelections(select, selections) {
    return freeze({
      ...select,
      selections: select.selections ? freeze([...select.selections, ...selections]) : freeze(selections)
    });
  },
  cloneWithDistinctOn(select, expressions) {
    return freeze({
      ...select,
      distinctOn: select.distinctOn ? freeze([...select.distinctOn, ...expressions]) : freeze(expressions)
    });
  },
  cloneWithFrontModifier(select, modifier) {
    return freeze({
      ...select,
      frontModifiers: select.frontModifiers ? freeze([...select.frontModifiers, modifier]) : freeze([modifier])
    });
  },
  cloneWithOrderByItems: (node, items) => QueryNode.cloneWithOrderByItems(node, items),
  cloneWithGroupByItems(selectNode, items) {
    return freeze({
      ...selectNode,
      groupBy: selectNode.groupBy ? GroupByNode.cloneWithItems(selectNode.groupBy, items) : GroupByNode.create(items)
    });
  },
  cloneWithLimit(selectNode, limit) {
    return freeze({
      ...selectNode,
      limit
    });
  },
  cloneWithOffset(selectNode, offset) {
    return freeze({
      ...selectNode,
      offset
    });
  },
  cloneWithFetch(selectNode, fetch) {
    return freeze({
      ...selectNode,
      fetch
    });
  },
  cloneWithHaving(selectNode, operation) {
    return freeze({
      ...selectNode,
      having: selectNode.having ? HavingNode.cloneWithOperation(selectNode.having, "And", operation) : HavingNode.create(operation)
    });
  },
  cloneWithSetOperations(selectNode, setOperations) {
    return freeze({
      ...selectNode,
      setOperations: selectNode.setOperations ? freeze([...selectNode.setOperations, ...setOperations]) : freeze([...setOperations])
    });
  },
  cloneWithoutSelections(select) {
    return freeze({
      ...select,
      selections: []
    });
  },
  cloneWithoutLimit(select) {
    return freeze({
      ...select,
      limit: undefined
    });
  },
  cloneWithoutOffset(select) {
    return freeze({
      ...select,
      offset: undefined
    });
  },
  cloneWithoutOrderBy: (node) => QueryNode.cloneWithoutOrderBy(node),
  cloneWithoutGroupBy(select) {
    return freeze({
      ...select,
      groupBy: undefined
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/query-builder/join-builder.js
class JoinBuilder {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  on(...args) {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(this.#props.joinNode, parseValueBinaryOperationOrExpression(args))
    });
  }
  onRef(lhs, op, rhs) {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(this.#props.joinNode, parseReferentialBinaryOperation(lhs, op, rhs))
    });
  }
  onTrue() {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(this.#props.joinNode, RawNode.createWithSql("true"))
    });
  }
  $call(func) {
    return func(this);
  }
  toOperationNode() {
    return this.#props.joinNode;
  }
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/partition-by-item-node.js
var PartitionByItemNode = freeze({
  is(node) {
    return node.kind === "PartitionByItemNode";
  },
  create(partitionBy) {
    return freeze({
      kind: "PartitionByItemNode",
      partitionBy
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/partition-by-parser.js
function parsePartitionBy(partitionBy) {
  return parseReferenceExpressionOrList(partitionBy).map(PartitionByItemNode.create);
}

// zveltio-extensions/node_modules/kysely/dist/query-builder/over-builder.js
class OverBuilder {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  orderBy(...args) {
    return new OverBuilder({
      overNode: OverNode.cloneWithOrderByItems(this.#props.overNode, parseOrderBy(args))
    });
  }
  clearOrderBy() {
    return new OverBuilder({
      overNode: QueryNode.cloneWithoutOrderBy(this.#props.overNode)
    });
  }
  partitionBy(partitionBy) {
    return new OverBuilder({
      overNode: OverNode.cloneWithPartitionByItems(this.#props.overNode, parsePartitionBy(partitionBy))
    });
  }
  $call(func) {
    return func(this);
  }
  toOperationNode() {
    return this.#props.overNode;
  }
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/selection-node.js
var SelectionNode = freeze({
  is(node) {
    return node.kind === "SelectionNode";
  },
  create(selection) {
    return freeze({
      kind: "SelectionNode",
      selection
    });
  },
  createSelectAll() {
    return freeze({
      kind: "SelectionNode",
      selection: SelectAllNode.create()
    });
  },
  createSelectAllFromTable(table) {
    return freeze({
      kind: "SelectionNode",
      selection: ReferenceNode.createSelectAll(table)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/select-parser.js
function parseSelectArg(selection) {
  if (isFunction(selection)) {
    return parseSelectArg(selection(expressionBuilder()));
  } else if (isReadonlyArray(selection)) {
    return selection.map((it) => parseSelectExpression(it));
  } else {
    return [parseSelectExpression(selection)];
  }
}
function parseSelectExpression(selection) {
  if (isString(selection)) {
    return SelectionNode.create(parseAliasedStringReference(selection));
  } else if (isDynamicReferenceBuilder(selection)) {
    return SelectionNode.create(selection.toOperationNode());
  } else {
    return SelectionNode.create(parseAliasedExpression(selection));
  }
}
function parseSelectAll(table) {
  if (!table) {
    return [SelectionNode.createSelectAll()];
  } else if (Array.isArray(table)) {
    return table.map(parseSelectAllArg);
  } else {
    return [parseSelectAllArg(table)];
  }
}
function parseSelectAllArg(table) {
  if (isString(table)) {
    return SelectionNode.createSelectAllFromTable(parseTable(table));
  }
  throw new Error(`invalid value selectAll expression: ${JSON.stringify(table)}`);
}

// zveltio-extensions/node_modules/kysely/dist/query-builder/no-result-error.js
class NoResultError extends Error {
  node;
  constructor(node) {
    super("no result");
    this.node = node;
  }
}
function isNoResultErrorConstructor(fn) {
  return Object.prototype.hasOwnProperty.call(fn, "prototype");
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/top-node.js
var TopNode = freeze({
  is(node) {
    return node.kind === "TopNode";
  },
  create(expression, modifiers) {
    return freeze({
      kind: "TopNode",
      expression,
      modifiers
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/top-parser.js
function parseTop(expression, modifiers) {
  if (!isNumber(expression) && !isBigInt(expression)) {
    throw new Error(`Invalid top expression: ${expression}`);
  }
  if (!isUndefined(modifiers) && !isTopModifiers(modifiers)) {
    throw new Error(`Invalid top modifiers: ${modifiers}`);
  }
  return TopNode.create(expression, modifiers);
}
function isTopModifiers(modifiers) {
  return modifiers === "percent" || modifiers === "with ties" || modifiers === "percent with ties";
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/limit-node.js
var LimitNode = freeze({
  is(node) {
    return node.kind === "LimitNode";
  },
  create(limit) {
    return freeze({
      kind: "LimitNode",
      limit
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/util/random-string.js
var CHARS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9"
];
function randomString(length) {
  let chars = "";
  for (let i = 0;i < length; ++i) {
    chars += randomChar();
  }
  return chars;
}
function randomChar() {
  return CHARS[~~(Math.random() * CHARS.length)];
}

// zveltio-extensions/node_modules/kysely/dist/util/query-id.js
function createQueryId() {
  return new LazyQueryId;
}

class LazyQueryId {
  #queryId;
  get queryId() {
    if (this.#queryId === undefined) {
      this.#queryId = randomString(8);
    }
    return this.#queryId;
  }
}

// zveltio-extensions/node_modules/kysely/dist/util/deferred.js
class Deferred {
  #promise;
  #resolve;
  #reject;
  constructor() {
    this.#promise = new Promise((resolve, reject) => {
      this.#reject = reject;
      this.#resolve = resolve;
    });
  }
  get promise() {
    return this.#promise;
  }
  resolve = (value) => {
    this.#resolve?.(value);
    this.#resolve = this.#reject = undefined;
  };
  reject = (reason) => {
    this.#reject?.(reason);
    this.#reject = this.#resolve = undefined;
  };
}

// zveltio-extensions/node_modules/kysely/dist/util/provide-controlled-connection.js
async function provideControlledConnection(connectionProvider, options) {
  const connectionDefer = new Deferred;
  const connectionReleaseDefer = new Deferred;
  connectionProvider.provideConnection(async (connection) => {
    connectionDefer.resolve(connection);
    return await connectionReleaseDefer.promise;
  }, options).catch((ex) => connectionDefer.reject(ex));
  return freeze({
    connection: await connectionDefer.promise,
    release: connectionReleaseDefer.resolve
  });
}

// zveltio-extensions/node_modules/kysely/dist/util/abort.js
function getInflightQueryAbortHandler(abortStrategy = "ignore query", connection, beforeThrow) {
  if (abortStrategy === "ignore query") {
    return;
  }
  if (abortStrategy === "cancel query") {
    const handler = connection.cancelQuery;
    if (!handler) {
      beforeThrow();
      throwUnsupportedInflightQueryAbortStrategyError(abortStrategy, connection.killSession ? "kill session" : undefined);
    }
    return handler.bind(connection);
  }
  if (abortStrategy === "kill session") {
    const handler = connection.killSession;
    if (!handler) {
      beforeThrow();
      throwUnsupportedInflightQueryAbortStrategyError(abortStrategy, connection.cancelQuery ? "cancel query" : undefined);
    }
    return handler.bind(connection);
  }
  beforeThrow();
  throw new Error(`Unexpected \`inflightQueryAbortStrategy\`: "${abortStrategy}"`);
}
function throwUnsupportedInflightQueryAbortStrategyError(abortStrategy, alt) {
  throw new Error(`This dialect doesn't support \`inflightQueryAbortStrategy\` "${abortStrategy}". Use "${"ignore query"}"${alt ? ` or "${alt}"` : ""} instead.`);
}
function assertNotAborted(signal, timing, beforeThrow) {
  if (signal?.aborted) {
    beforeThrow?.();
    throwReasonWithTiming(signal.reason, timing);
  }
}
function throwReasonWithTiming(reason, timing) {
  decorateWithTiming(reason, timing);
  throw reason;
}
var ABORTED = {};
function printBackgroundFail(name) {
  return (reason) => console.error(`\`${name}\` failed in the background after abortion: ${getMessage(reason)}`);
}
function decorateWithTiming(reason, timing) {
  if (reason !== null && typeof reason === "object" && !Object.isFrozen(reason)) {
    Object.defineProperty(reason, "__kysely_timing__", {
      configurable: true,
      enumerable: false,
      value: timing,
      writable: false
    });
  }
}

// zveltio-extensions/node_modules/kysely/dist/query-executor/query-executor-base.js
var NO_PLUGINS = freeze([]);

class QueryExecutorBase {
  #plugins;
  constructor(plugins = NO_PLUGINS) {
    this.#plugins = plugins;
  }
  get plugins() {
    return this.#plugins;
  }
  transformQuery(node, queryId) {
    for (const plugin of this.#plugins) {
      const transformedNode = plugin.transformQuery({ node, queryId });
      if (transformedNode.kind === node.kind) {
        node = transformedNode;
      } else {
        throw new Error([
          `KyselyPlugin.transformQuery must return a node`,
          `of the same kind that was given to it.`,
          `The plugin was given a ${node.kind}`,
          `but it returned a ${transformedNode.kind}`
        ].join(" "));
      }
    }
    return node;
  }
  async executeQuery(compiledQuery, options) {
    const { inflightQueryAbortStrategy = "ignore query", signal } = options || {};
    if (!signal) {
      const result = await this.provideConnection(async (connection) => {
        return await connection.executeQuery(compiledQuery);
      }, options);
      return await this.#transformResult(result, compiledQuery.queryId);
    }
    assertNotAborted(signal, "before query execution");
    options = freeze({ signal });
    const { connection, release } = await provideControlledConnection(this, options);
    const controlConnectionProvider = this.provideConnection.bind(this);
    const { promise: abortPromise, resolve } = new Deferred;
    const abortListener = () => resolve(ABORTED);
    signal.addEventListener("abort", abortListener, { once: true });
    try {
      assertNotAborted(signal, "before query execution", release);
      const inflightQueryAbortHandler = getInflightQueryAbortHandler(inflightQueryAbortStrategy, connection, release);
      if (inflightQueryAbortHandler && connection.collectSessionInfo) {
        assertNotAborted(signal, "before query execution", release);
        const collectPromise = connection.collectSessionInfo();
        const result = await Promise.race([abortPromise, collectPromise]).catch((error) => {
          release();
          throw error;
        });
        if (result === ABORTED) {
          collectPromise.catch(printBackgroundFail("collectSessionInfo")).finally(release);
          throwReasonWithTiming(signal.reason, "before query execution");
        }
      }
      const queryPromise = connection.executeQuery(compiledQuery, options);
      const result = await Promise.race([abortPromise, queryPromise]).catch((error) => {
        release();
        throw error;
      });
      if (result === ABORTED) {
        Promise.allSettled([
          queryPromise.catch(printBackgroundFail("query")),
          inflightQueryAbortHandler?.(controlConnectionProvider).catch(printBackgroundFail("inflightQueryAbortHandler"))
        ]).finally(release);
        throwReasonWithTiming(signal.reason, "during query execution");
      } else {
        release();
      }
      const transformPromise = this.#transformResult(result, compiledQuery.queryId, options);
      const transformedResult = await Promise.race([
        abortPromise,
        transformPromise
      ]);
      if (transformedResult === ABORTED) {
        transformPromise.catch(printBackgroundFail("plugins.transformResult"));
        throwReasonWithTiming(signal.reason, "during result transformation");
      }
      return transformedResult;
    } finally {
      resolve(ABORTED);
      signal.removeEventListener("abort", abortListener);
    }
  }
  async* stream(compiledQuery, chunkSize, options) {
    const { signal } = options || {};
    if (!signal) {
      const { connection, release } = await provideControlledConnection(this);
      try {
        for await (const result of connection.streamQuery(compiledQuery, chunkSize)) {
          yield await this.#transformResult(result, compiledQuery.queryId, options);
        }
      } finally {
        release();
      }
      return;
    }
    options = freeze({ signal });
    assertNotAborted(signal, "before connection acquisition");
    const { connection, release } = await provideControlledConnection(this, options);
    const { promise: abortPromise, resolve } = new Deferred;
    const abortListener = () => resolve(ABORTED);
    signal.addEventListener("abort", abortListener, { once: true });
    let asyncIterator;
    let releasePrerequisite;
    assertNotAborted(signal, "before query streaming", release);
    const { queryId } = compiledQuery;
    try {
      asyncIterator = connection.streamQuery(compiledQuery, chunkSize, options);
      while (true) {
        assertNotAborted(signal, "during query streaming");
        const nextPromise = asyncIterator.next();
        const result = await Promise.race([abortPromise, nextPromise]);
        if (result === ABORTED) {
          releasePrerequisite = nextPromise.catch(printBackgroundFail("iterator.next"));
          throwReasonWithTiming(signal.reason, "during query streaming");
        }
        if (result.done) {
          break;
        }
        const transformPromise = this.#transformResult(result.value, queryId, options);
        const transformedResult = await Promise.race([
          abortPromise,
          transformPromise
        ]);
        if (transformedResult === ABORTED) {
          releasePrerequisite = transformPromise.catch(printBackgroundFail("plugins.transformResult"));
          throwReasonWithTiming(signal.reason, "during result transformation");
        }
        yield transformedResult;
      }
    } finally {
      resolve(ABORTED);
      signal.removeEventListener("abort", abortListener);
      const cleanup = (asyncIterator?.return?.() || Promise.resolve()).finally(() => releasePrerequisite).finally(release);
      if (!releasePrerequisite) {
        await cleanup;
      }
    }
  }
  async#transformResult(result, queryId, options) {
    const { signal } = options || {};
    for (const plugin of this.#plugins) {
      result = await plugin.transformResult(freeze({ queryId, result, signal }));
    }
    return result;
  }
}

// zveltio-extensions/node_modules/kysely/dist/query-executor/noop-query-executor.js
class NoopQueryExecutor extends QueryExecutorBase {
  get adapter() {
    throw new Error("this query cannot be compiled to SQL");
  }
  compileQuery() {
    throw new Error("this query cannot be compiled to SQL");
  }
  provideConnection() {
    throw new Error("this query cannot be executed");
  }
  withConnectionProvider() {
    throw new Error("this query cannot have a connection provider");
  }
  withPlugin(plugin) {
    return new NoopQueryExecutor([...this.plugins, plugin]);
  }
  withPlugins(plugins) {
    return new NoopQueryExecutor([...this.plugins, ...plugins]);
  }
  withPluginAtFront(plugin) {
    return new NoopQueryExecutor([plugin, ...this.plugins]);
  }
  withoutPlugins() {
    return new NoopQueryExecutor([]);
  }
}
var NOOP_QUERY_EXECUTOR = new NoopQueryExecutor;

// zveltio-extensions/node_modules/kysely/dist/parser/parse-utils.js
function createJoinBuilder(joinType, table) {
  return new JoinBuilder({
    joinNode: JoinNode.create(joinType, parseTableExpression(table))
  });
}
function createOverBuilder() {
  return new OverBuilder({
    overNode: OverNode.create()
  });
}

// zveltio-extensions/node_modules/kysely/dist/parser/join-parser.js
function parseJoin(joinType, args) {
  if (args.length === 3) {
    return parseSingleOnJoin(joinType, args[0], args[1], args[2]);
  } else if (args.length === 2) {
    return parseCallbackJoin(joinType, args[0], args[1]);
  } else if (args.length === 1) {
    return parseOnlessJoin(joinType, args[0]);
  } else {
    throw new Error("not implemented");
  }
}
function parseCallbackJoin(joinType, from, callback) {
  return callback(createJoinBuilder(joinType, from)).toOperationNode();
}
function parseSingleOnJoin(joinType, from, lhsColumn, rhsColumn) {
  return JoinNode.createWithOn(joinType, parseTableExpression(from), parseReferentialBinaryOperation(lhsColumn, "=", rhsColumn));
}
function parseOnlessJoin(joinType, from) {
  return JoinNode.create(joinType, parseTableExpression(from));
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/offset-node.js
var OffsetNode = freeze({
  is(node) {
    return node.kind === "OffsetNode";
  },
  create(offset) {
    return freeze({
      kind: "OffsetNode",
      offset
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/group-by-item-node.js
var GroupByItemNode = freeze({
  is(node) {
    return node.kind === "GroupByItemNode";
  },
  create(groupBy) {
    return freeze({
      kind: "GroupByItemNode",
      groupBy
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/group-by-parser.js
function parseGroupBy(groupBy) {
  groupBy = isFunction(groupBy) ? groupBy(expressionBuilder()) : groupBy;
  return parseReferenceExpressionOrList(groupBy).map(GroupByItemNode.create);
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/set-operation-node.js
var SetOperationNode = freeze({
  is(node) {
    return node.kind === "SetOperationNode";
  },
  create(operator, expression, all) {
    return freeze({
      kind: "SetOperationNode",
      operator,
      expression,
      all
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/set-operation-parser.js
function parseSetOperations(operator, expression, all) {
  if (isFunction(expression)) {
    expression = expression(createExpressionBuilder());
  }
  if (!isReadonlyArray(expression)) {
    expression = [expression];
  }
  return expression.map((expr) => SetOperationNode.create(operator, parseExpression(expr), all));
}

// zveltio-extensions/node_modules/kysely/dist/expression/expression-wrapper.js
class ExpressionWrapper {
  #node;
  constructor(node) {
    this.#node = node;
  }
  get expressionType() {
    return;
  }
  as(alias) {
    return new AliasedExpressionWrapper(this, alias);
  }
  or(...args) {
    return new OrWrapper(OrNode.create(this.#node, parseValueBinaryOperationOrExpression(args)));
  }
  and(...args) {
    return new AndWrapper(AndNode.create(this.#node, parseValueBinaryOperationOrExpression(args)));
  }
  $castTo() {
    return new ExpressionWrapper(this.#node);
  }
  $notNull() {
    return new ExpressionWrapper(this.#node);
  }
  toOperationNode() {
    return this.#node;
  }
}

class AliasedExpressionWrapper {
  #expr;
  #alias;
  constructor(expr, alias) {
    this.#expr = expr;
    this.#alias = alias;
  }
  get expression() {
    return this.#expr;
  }
  get alias() {
    return this.#alias;
  }
  toOperationNode() {
    return AliasNode.create(this.#expr.toOperationNode(), isOperationNodeSource(this.#alias) ? this.#alias.toOperationNode() : IdentifierNode.create(this.#alias));
  }
}

class OrWrapper {
  #node;
  constructor(node) {
    this.#node = node;
  }
  get expressionType() {
    return;
  }
  as(alias) {
    return new AliasedExpressionWrapper(this, alias);
  }
  or(...args) {
    return new OrWrapper(OrNode.create(this.#node, parseValueBinaryOperationOrExpression(args)));
  }
  $castTo() {
    return new OrWrapper(this.#node);
  }
  toOperationNode() {
    return ParensNode.create(this.#node);
  }
}

class AndWrapper {
  #node;
  constructor(node) {
    this.#node = node;
  }
  get expressionType() {
    return;
  }
  as(alias) {
    return new AliasedExpressionWrapper(this, alias);
  }
  and(...args) {
    return new AndWrapper(AndNode.create(this.#node, parseValueBinaryOperationOrExpression(args)));
  }
  $castTo() {
    return new AndWrapper(this.#node);
  }
  toOperationNode() {
    return ParensNode.create(this.#node);
  }
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/fetch-node.js
var FetchNode = freeze({
  is(node) {
    return node.kind === "FetchNode";
  },
  create(rowCount, modifier) {
    return {
      kind: "FetchNode",
      rowCount: ValueNode.create(rowCount),
      modifier
    };
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/fetch-parser.js
function parseFetch(rowCount, modifier) {
  if (!isNumber(rowCount) && !isBigInt(rowCount)) {
    throw new Error(`Invalid fetch row count: ${rowCount}`);
  }
  if (!isFetchModifier(modifier)) {
    throw new Error(`Invalid fetch modifier: ${modifier}`);
  }
  return FetchNode.create(rowCount, modifier);
}
function isFetchModifier(value) {
  return value === "only" || value === "with ties";
}

// zveltio-extensions/node_modules/kysely/dist/query-builder/select-query-builder.js
var _a;

class SelectQueryBuilderImpl {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  get expressionType() {
    return;
  }
  get isSelectQueryBuilder() {
    return true;
  }
  where(...args) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(this.#props.queryNode, parseValueBinaryOperationOrExpression(args))
    });
  }
  whereRef(lhs, op, rhs) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithWhere(this.#props.queryNode, parseReferentialBinaryOperation(lhs, op, rhs))
    });
  }
  having(...args) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(this.#props.queryNode, parseValueBinaryOperationOrExpression(args))
    });
  }
  havingRef(lhs, op, rhs) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithHaving(this.#props.queryNode, parseReferentialBinaryOperation(lhs, op, rhs))
    });
  }
  select(selection) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSelections(this.#props.queryNode, parseSelectArg(selection))
    });
  }
  distinctOn(selection) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithDistinctOn(this.#props.queryNode, parseReferenceExpressionOrList(selection))
    });
  }
  modifyFront(modifier) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithFrontModifier(this.#props.queryNode, SelectModifierNode.createWithExpression(modifier.toOperationNode()))
    });
  }
  modifyEnd(modifier) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithEndModifier(this.#props.queryNode, SelectModifierNode.createWithExpression(modifier.toOperationNode()))
    });
  }
  distinct() {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithFrontModifier(this.#props.queryNode, SelectModifierNode.create("Distinct"))
    });
  }
  forUpdate(of) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithEndModifier(this.#props.queryNode, SelectModifierNode.create("ForUpdate", of ? asArray(of).map(parseTable) : undefined))
    });
  }
  forShare(of) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithEndModifier(this.#props.queryNode, SelectModifierNode.create("ForShare", of ? asArray(of).map(parseTable) : undefined))
    });
  }
  forKeyShare(of) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithEndModifier(this.#props.queryNode, SelectModifierNode.create("ForKeyShare", of ? asArray(of).map(parseTable) : undefined))
    });
  }
  forNoKeyUpdate(of) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithEndModifier(this.#props.queryNode, SelectModifierNode.create("ForNoKeyUpdate", of ? asArray(of).map(parseTable) : undefined))
    });
  }
  skipLocked() {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithEndModifier(this.#props.queryNode, SelectModifierNode.create("SkipLocked"))
    });
  }
  noWait() {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithEndModifier(this.#props.queryNode, SelectModifierNode.create("NoWait"))
    });
  }
  selectAll(table) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSelections(this.#props.queryNode, parseSelectAll(table))
    });
  }
  innerJoin(...args) {
    return this.#join("InnerJoin", args);
  }
  leftJoin(...args) {
    return this.#join("LeftJoin", args);
  }
  rightJoin(...args) {
    return this.#join("RightJoin", args);
  }
  fullJoin(...args) {
    return this.#join("FullJoin", args);
  }
  crossJoin(...args) {
    return this.#join("CrossJoin", args);
  }
  innerJoinLateral(...args) {
    return this.#join("LateralInnerJoin", args);
  }
  leftJoinLateral(...args) {
    return this.#join("LateralLeftJoin", args);
  }
  crossJoinLateral(...args) {
    return this.#join("LateralCrossJoin", args);
  }
  crossApply(...args) {
    return this.#join("CrossApply", args);
  }
  outerApply(...args) {
    return this.#join("OuterApply", args);
  }
  #join(joinType, args) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithJoin(this.#props.queryNode, parseJoin(joinType, args))
    });
  }
  orderBy(...args) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithOrderByItems(this.#props.queryNode, parseOrderBy(args))
    });
  }
  groupBy(groupBy) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithGroupByItems(this.#props.queryNode, parseGroupBy(groupBy))
    });
  }
  limit(limit) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithLimit(this.#props.queryNode, LimitNode.create(parseValueExpression(limit)))
    });
  }
  offset(offset) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithOffset(this.#props.queryNode, OffsetNode.create(parseValueExpression(offset)))
    });
  }
  fetch(rowCount, modifier = "only") {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithFetch(this.#props.queryNode, parseFetch(rowCount, modifier))
    });
  }
  top(expression, modifiers) {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithTop(this.#props.queryNode, parseTop(expression, modifiers))
    });
  }
  union(expression) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(this.#props.queryNode, parseSetOperations("union", expression, false))
    });
  }
  unionAll(expression) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(this.#props.queryNode, parseSetOperations("union", expression, true))
    });
  }
  intersect(expression) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(this.#props.queryNode, parseSetOperations("intersect", expression, false))
    });
  }
  intersectAll(expression) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(this.#props.queryNode, parseSetOperations("intersect", expression, true))
    });
  }
  except(expression) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(this.#props.queryNode, parseSetOperations("except", expression, false))
    });
  }
  exceptAll(expression) {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSetOperations(this.#props.queryNode, parseSetOperations("except", expression, true))
    });
  }
  as(alias) {
    return new AliasedSelectQueryBuilderImpl(this, alias);
  }
  clearSelect() {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutSelections(this.#props.queryNode)
    });
  }
  clearWhere() {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithoutWhere(this.#props.queryNode)
    });
  }
  clearLimit() {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutLimit(this.#props.queryNode)
    });
  }
  clearOffset() {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutOffset(this.#props.queryNode)
    });
  }
  clearOrderBy() {
    return new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithoutOrderBy(this.#props.queryNode)
    });
  }
  clearGroupBy() {
    return new _a({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithoutGroupBy(this.#props.queryNode)
    });
  }
  $call(func) {
    return func(this);
  }
  $if(condition, func) {
    if (condition) {
      return func(this);
    }
    return new _a({
      ...this.#props
    });
  }
  $castTo() {
    return new _a(this.#props);
  }
  $narrowType() {
    return new _a(this.#props);
  }
  $assertType() {
    return new _a(this.#props);
  }
  $asTuple() {
    return new ExpressionWrapper(this.toOperationNode());
  }
  $asScalar() {
    return new ExpressionWrapper(this.toOperationNode());
  }
  withPlugin(plugin) {
    return new _a({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin)
    });
  }
  toOperationNode() {
    return this.#props.executor.transformQuery(this.#props.queryNode, this.#props.queryId);
  }
  compile() {
    return this.#props.executor.compileQuery(this.toOperationNode(), this.#props.queryId);
  }
  async execute(options) {
    const compiledQuery = this.compile();
    const result = await this.#props.executor.executeQuery(compiledQuery, options);
    return result.rows;
  }
  async executeTakeFirst(options) {
    const [result] = await this.execute(options);
    return result;
  }
  async executeTakeFirstOrThrow(errorConstructorOrOptions) {
    if (typeof errorConstructorOrOptions === "function") {
      errorConstructorOrOptions = {
        errorConstructor: errorConstructorOrOptions
      };
    }
    const result = await this.executeTakeFirst(errorConstructorOrOptions);
    if (result === undefined) {
      const errorConstructor = errorConstructorOrOptions?.errorConstructor ?? NoResultError;
      const error = isNoResultErrorConstructor(errorConstructor) ? new errorConstructor(this.toOperationNode()) : errorConstructor(this.toOperationNode());
      throw error;
    }
    return result;
  }
  async* stream(chunkSizeOrOptions) {
    if (typeof chunkSizeOrOptions !== "object") {
      chunkSizeOrOptions = {
        chunkSize: chunkSizeOrOptions
      };
    }
    const compiledQuery = this.compile();
    const stream = this.#props.executor.stream(compiledQuery, chunkSizeOrOptions.chunkSize ?? 100, chunkSizeOrOptions);
    for await (const item of stream) {
      yield* item.rows;
    }
  }
  async explain(format, options) {
    const builder = new _a({
      ...this.#props,
      queryNode: QueryNode.cloneWithExplain(this.#props.queryNode, format, options)
    });
    return await builder.execute();
  }
}
_a = SelectQueryBuilderImpl;
function createSelectQueryBuilder(props) {
  return new SelectQueryBuilderImpl(props);
}

class AliasedSelectQueryBuilderImpl {
  #queryBuilder;
  #alias;
  constructor(queryBuilder, alias) {
    this.#queryBuilder = queryBuilder;
    this.#alias = alias;
  }
  get expression() {
    return this.#queryBuilder;
  }
  get alias() {
    return this.#alias;
  }
  get isAliasedSelectQueryBuilder() {
    return true;
  }
  toOperationNode() {
    return AliasNode.create(this.#queryBuilder.toOperationNode(), IdentifierNode.create(this.#alias));
  }
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/aggregate-function-node.js
var AggregateFunctionNode = freeze({
  is(node) {
    return node.kind === "AggregateFunctionNode";
  },
  create(aggregateFunction, aggregated = []) {
    return freeze({
      kind: "AggregateFunctionNode",
      func: aggregateFunction,
      aggregated
    });
  },
  cloneWithDistinct(aggregateFunctionNode) {
    return freeze({
      ...aggregateFunctionNode,
      distinct: true
    });
  },
  cloneWithOrderBy(aggregateFunctionNode, orderItems, withinGroup = false) {
    const prop = withinGroup ? "withinGroup" : "orderBy";
    return freeze({
      ...aggregateFunctionNode,
      [prop]: aggregateFunctionNode[prop] ? OrderByNode.cloneWithItems(aggregateFunctionNode[prop], orderItems) : OrderByNode.create(orderItems)
    });
  },
  cloneWithFilter(aggregateFunctionNode, filter) {
    return freeze({
      ...aggregateFunctionNode,
      filter: aggregateFunctionNode.filter ? WhereNode.cloneWithOperation(aggregateFunctionNode.filter, "And", filter) : WhereNode.create(filter)
    });
  },
  cloneWithOrFilter(aggregateFunctionNode, filter) {
    return freeze({
      ...aggregateFunctionNode,
      filter: aggregateFunctionNode.filter ? WhereNode.cloneWithOperation(aggregateFunctionNode.filter, "Or", filter) : WhereNode.create(filter)
    });
  },
  cloneWithOver(aggregateFunctionNode, over) {
    return freeze({
      ...aggregateFunctionNode,
      over
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/function-node.js
var FunctionNode = freeze({
  is(node) {
    return node.kind === "FunctionNode";
  },
  create(func, args) {
    return freeze({
      kind: "FunctionNode",
      func,
      arguments: args
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/query-builder/aggregate-function-builder.js
class AggregateFunctionBuilder {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  get expressionType() {
    return;
  }
  as(alias) {
    return new AliasedAggregateFunctionBuilder(this, alias);
  }
  distinct() {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithDistinct(this.#props.aggregateFunctionNode)
    });
  }
  orderBy(...args) {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: QueryNode.cloneWithOrderByItems(this.#props.aggregateFunctionNode, parseOrderBy(args))
    });
  }
  clearOrderBy() {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: QueryNode.cloneWithoutOrderBy(this.#props.aggregateFunctionNode)
    });
  }
  withinGroupOrderBy(...args) {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOrderBy(this.#props.aggregateFunctionNode, parseOrderBy(args), true)
    });
  }
  filterWhere(...args) {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(this.#props.aggregateFunctionNode, parseValueBinaryOperationOrExpression(args))
    });
  }
  filterWhereRef(lhs, op, rhs) {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithFilter(this.#props.aggregateFunctionNode, parseReferentialBinaryOperation(lhs, op, rhs))
    });
  }
  over(over) {
    const builder = createOverBuilder();
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOver(this.#props.aggregateFunctionNode, (over ? over(builder) : builder).toOperationNode())
    });
  }
  $call(func) {
    return func(this);
  }
  $castTo() {
    return new AggregateFunctionBuilder(this.#props);
  }
  $notNull() {
    return new AggregateFunctionBuilder(this.#props);
  }
  toOperationNode() {
    return this.#props.aggregateFunctionNode;
  }
}

class AliasedAggregateFunctionBuilder {
  #aggregateFunctionBuilder;
  #alias;
  constructor(aggregateFunctionBuilder, alias) {
    this.#aggregateFunctionBuilder = aggregateFunctionBuilder;
    this.#alias = alias;
  }
  get expression() {
    return this.#aggregateFunctionBuilder;
  }
  get alias() {
    return this.#alias;
  }
  toOperationNode() {
    return AliasNode.create(this.#aggregateFunctionBuilder.toOperationNode(), IdentifierNode.create(this.#alias));
  }
}

// zveltio-extensions/node_modules/kysely/dist/query-builder/function-module.js
function createFunctionModule() {
  const fn = (name, args) => {
    return new ExpressionWrapper(FunctionNode.create(name, parseReferenceExpressionOrList(args ?? [])));
  };
  const agg = (name, args) => {
    return new AggregateFunctionBuilder({
      aggregateFunctionNode: AggregateFunctionNode.create(name, args ? parseReferenceExpressionOrList(args) : undefined)
    });
  };
  return Object.assign(fn, {
    agg,
    avg(column) {
      return agg("avg", [column]);
    },
    coalesce(...values) {
      return fn("coalesce", values);
    },
    count(column) {
      return agg("count", [column]);
    },
    countAll(table) {
      return new AggregateFunctionBuilder({
        aggregateFunctionNode: AggregateFunctionNode.create("count", parseSelectAll(table))
      });
    },
    max(column) {
      return agg("max", [column]);
    },
    min(column) {
      return agg("min", [column]);
    },
    sum(column) {
      return agg("sum", [column]);
    },
    any(column) {
      return fn("any", [column]);
    },
    jsonAgg(table) {
      return new AggregateFunctionBuilder({
        aggregateFunctionNode: AggregateFunctionNode.create("json_agg", [
          isString(table) ? parseTable(table) : table.toOperationNode()
        ])
      });
    },
    toJson(table) {
      return new ExpressionWrapper(FunctionNode.create("to_json", [
        isString(table) ? parseTable(table) : table.toOperationNode()
      ]));
    }
  });
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/unary-operation-node.js
var UnaryOperationNode = freeze({
  is(node) {
    return node.kind === "UnaryOperationNode";
  },
  create(operator, operand) {
    return freeze({
      kind: "UnaryOperationNode",
      operator,
      operand
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/parser/unary-operation-parser.js
function parseUnaryOperation(operator, operand) {
  if (isUnaryOperator(operator)) {
    return UnaryOperationNode.create(OperatorNode.create(operator), parseReferenceExpression(operand));
  }
  throw new Error(`invalid unary operator ${JSON.stringify(operator)}`);
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/case-node.js
var CaseNode = freeze({
  is(node) {
    return node.kind === "CaseNode";
  },
  create(value) {
    return freeze({
      kind: "CaseNode",
      value
    });
  },
  cloneWithWhen(caseNode, when) {
    return freeze({
      ...caseNode,
      when: freeze(caseNode.when ? [...caseNode.when, when] : [when])
    });
  },
  cloneWithThen(caseNode, then) {
    return freeze({
      ...caseNode,
      when: caseNode.when ? freeze([
        ...caseNode.when.slice(0, -1),
        WhenNode.cloneWithResult(caseNode.when[caseNode.when.length - 1], then)
      ]) : undefined
    });
  },
  cloneWith(caseNode, props) {
    return freeze({
      ...caseNode,
      ...props
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/query-builder/case-builder.js
class CaseBuilder {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  when(...args) {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(this.#props.node, WhenNode.create(parseValueBinaryOperationOrExpression(args)))
    });
  }
  whenRef(lhs, op, rhs) {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(this.#props.node, WhenNode.create(parseReferentialBinaryOperation(lhs, op, rhs)))
    });
  }
}

class CaseThenBuilder {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  then(valueExpression) {
    return new CaseWhenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithThen(this.#props.node, isSafeImmediateValue(valueExpression) ? parseSafeImmediateValue(valueExpression) : parseValueExpression(valueExpression))
    });
  }
  thenRef(expression) {
    return new CaseWhenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithThen(this.#props.node, parseReferenceExpression(expression))
    });
  }
}

class CaseWhenBuilder {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  when(...args) {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(this.#props.node, WhenNode.create(parseValueBinaryOperationOrExpression(args)))
    });
  }
  whenRef(lhs, op, rhs) {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(this.#props.node, WhenNode.create(parseReferentialBinaryOperation(lhs, op, rhs)))
    });
  }
  else(valueExpression) {
    return new CaseEndBuilder({
      ...this.#props,
      node: CaseNode.cloneWith(this.#props.node, {
        else: isSafeImmediateValue(valueExpression) ? parseSafeImmediateValue(valueExpression) : parseValueExpression(valueExpression)
      })
    });
  }
  elseRef(expression) {
    return new CaseEndBuilder({
      ...this.#props,
      node: CaseNode.cloneWith(this.#props.node, {
        else: parseReferenceExpression(expression)
      })
    });
  }
  end() {
    return new ExpressionWrapper(CaseNode.cloneWith(this.#props.node, { isStatement: false }));
  }
  endCase() {
    return new ExpressionWrapper(CaseNode.cloneWith(this.#props.node, { isStatement: true }));
  }
}

class CaseEndBuilder {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  end() {
    return new ExpressionWrapper(CaseNode.cloneWith(this.#props.node, { isStatement: false }));
  }
  endCase() {
    return new ExpressionWrapper(CaseNode.cloneWith(this.#props.node, { isStatement: true }));
  }
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/json-path-leg-node.js
var JSONPathLegNode = freeze({
  is(node) {
    return node.kind === "JSONPathLegNode";
  },
  create(type, value) {
    return freeze({
      kind: "JSONPathLegNode",
      type,
      value
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/query-builder/json-path-builder.js
var HASH_NEGATIVE_INDEX_REGEX = /^#-\d+$/;

class JSONPathBuilder {
  #node;
  constructor(node) {
    this.#node = node;
  }
  at(index) {
    if (typeof index !== "number" && typeof index !== "string" || typeof index === "number" && !Number.isInteger(index) || typeof index === "string" && index !== "last" && !HASH_NEGATIVE_INDEX_REGEX.test(index)) {
      throw new Error(`Unexpected index value in .at(...): ${index}`);
    }
    return this.#createBuilderWithPathLeg("ArrayLocation", index);
  }
  key(key) {
    return this.#createBuilderWithPathLeg("Member", key);
  }
  #createBuilderWithPathLeg(legType, value) {
    if (JSONReferenceNode.is(this.#node)) {
      return new TraversedJSONPathBuilder(JSONReferenceNode.cloneWithTraversal(this.#node, JSONPathNode.is(this.#node.traversal) ? JSONPathNode.cloneWithLeg(this.#node.traversal, JSONPathLegNode.create(legType, value)) : JSONOperatorChainNode.cloneWithValue(this.#node.traversal, ValueNode.createImmediate(value))));
    }
    return new TraversedJSONPathBuilder(JSONPathNode.cloneWithLeg(this.#node, JSONPathLegNode.create(legType, value)));
  }
}

class TraversedJSONPathBuilder extends JSONPathBuilder {
  #node;
  constructor(node) {
    super(node);
    this.#node = node;
  }
  get expressionType() {
    return;
  }
  as(alias) {
    return new AliasedJSONPathBuilder(this, alias);
  }
  $castTo() {
    return new TraversedJSONPathBuilder(this.#node);
  }
  $notNull() {
    return new TraversedJSONPathBuilder(this.#node);
  }
  toOperationNode() {
    return this.#node;
  }
}

class AliasedJSONPathBuilder {
  #jsonPath;
  #alias;
  constructor(jsonPath, alias) {
    this.#jsonPath = jsonPath;
    this.#alias = alias;
  }
  get expression() {
    return this.#jsonPath;
  }
  get alias() {
    return this.#alias;
  }
  toOperationNode() {
    return AliasNode.create(this.#jsonPath.toOperationNode(), isOperationNodeSource(this.#alias) ? this.#alias.toOperationNode() : IdentifierNode.create(this.#alias));
  }
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/tuple-node.js
var TupleNode = freeze({
  is(node) {
    return node.kind === "TupleNode";
  },
  create(values) {
    return freeze({
      kind: "TupleNode",
      values: freeze(values)
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/operation-node/data-type-node.js
var SIMPLE_COLUMN_DATA_TYPES = freeze({
  bigint: true,
  bigserial: true,
  binary: true,
  blob: true,
  boolean: true,
  bytea: true,
  char: true,
  date: true,
  datemultirange: true,
  daterange: true,
  datetime: true,
  datetime2: true,
  decimal: true,
  "double precision": true,
  float4: true,
  float8: true,
  int2: true,
  int4: true,
  int4multirange: true,
  int4range: true,
  int8: true,
  int8multirange: true,
  int8range: true,
  integer: true,
  json: true,
  jsonb: true,
  numeric: true,
  nummultirange: true,
  numrange: true,
  real: true,
  serial: true,
  smallint: true,
  text: true,
  time: true,
  timestamp: true,
  timestamptz: true,
  timetz: true,
  tsmultirange: true,
  tsrange: true,
  tstzmultirange: true,
  tstzrange: true,
  uuid: true,
  varbinary: true,
  varchar: true
});
var COLUMN_DATA_TYPE_REGEX = freeze([
  /^varchar\(\d+\)$/,
  /^char\(\d+\)$/,
  /^decimal\(\d+, \d+\)$/,
  /^numeric\(\d+, \d+\)$/,
  /^binary\(\d+\)$/,
  /^datetime\(\d+\)$/,
  /^time\(\d+\)$/,
  /^timetz\(\d+\)$/,
  /^timestamp\(\d+\)$/,
  /^timestamptz\(\d+\)$/,
  /^datetime2\(\d+\)$/,
  /^varbinary\(\d+\)$/
]);
var DataTypeNode = freeze({
  is(node) {
    return node.kind === "DataTypeNode";
  },
  create(dataType) {
    return freeze({
      kind: "DataTypeNode",
      dataType
    });
  }
});
function isColumnDataType(dataType) {
  return SIMPLE_COLUMN_DATA_TYPES[dataType] || COLUMN_DATA_TYPE_REGEX.some((r) => r.test(dataType));
}

// zveltio-extensions/node_modules/kysely/dist/parser/data-type-parser.js
function parseDataTypeExpression(dataType) {
  if (isOperationNodeSource(dataType)) {
    return dataType.toOperationNode();
  }
  if (isColumnDataType(dataType)) {
    return DataTypeNode.create(dataType);
  }
  throw new Error(`invalid column data type ${JSON.stringify(dataType)}`);
}

// zveltio-extensions/node_modules/kysely/dist/operation-node/cast-node.js
var CastNode = freeze({
  is(node) {
    return node.kind === "CastNode";
  },
  create(expression, dataType) {
    return freeze({
      kind: "CastNode",
      expression,
      dataType
    });
  }
});

// zveltio-extensions/node_modules/kysely/dist/expression/expression-builder.js
function createExpressionBuilder(executor = NOOP_QUERY_EXECUTOR) {
  function binary(lhs, op, rhs) {
    return new ExpressionWrapper(parseValueBinaryOperation(lhs, op, rhs));
  }
  function unary(op, expr) {
    return new ExpressionWrapper(parseUnaryOperation(op, expr));
  }
  const eb = Object.assign(binary, {
    fn: undefined,
    eb: undefined,
    selectFrom(table) {
      return createSelectQueryBuilder({
        queryId: createQueryId(),
        executor,
        queryNode: SelectQueryNode.createFrom(parseTableExpressionOrList(table))
      });
    },
    case(reference) {
      return new CaseBuilder({
        node: CaseNode.create(isUndefined(reference) ? undefined : parseReferenceExpression(reference))
      });
    },
    ref(reference, op) {
      if (isUndefined(op)) {
        return new ExpressionWrapper(parseStringReference(reference));
      }
      return new JSONPathBuilder(parseJSONReference(reference, op));
    },
    jsonPath() {
      return new JSONPathBuilder(JSONPathNode.create());
    },
    table(table) {
      return new ExpressionWrapper(parseTable(table));
    },
    val(value) {
      return new ExpressionWrapper(parseValueExpression(value));
    },
    refTuple(...values) {
      return new ExpressionWrapper(TupleNode.create(values.map(parseReferenceExpression)));
    },
    tuple(...values) {
      return new ExpressionWrapper(TupleNode.create(values.map(parseValueExpression)));
    },
    lit(value) {
      return new ExpressionWrapper(parseSafeImmediateValue(value));
    },
    unary,
    not(expr) {
      return unary("not", expr);
    },
    exists(expr) {
      return unary("exists", expr);
    },
    neg(expr) {
      return unary("-", expr);
    },
    between(expr, start, end) {
      return new ExpressionWrapper(BinaryOperationNode.create(parseReferenceExpression(expr), OperatorNode.create("between"), AndNode.create(parseValueExpression(start), parseValueExpression(end))));
    },
    betweenSymmetric(expr, start, end) {
      return new ExpressionWrapper(BinaryOperationNode.create(parseReferenceExpression(expr), OperatorNode.create("between symmetric"), AndNode.create(parseValueExpression(start), parseValueExpression(end))));
    },
    and(exprs) {
      if (isReadonlyArray(exprs)) {
        return new ExpressionWrapper(parseFilterList(exprs, "and"));
      }
      return new ExpressionWrapper(parseFilterObject(exprs, "and"));
    },
    or(exprs) {
      if (isReadonlyArray(exprs)) {
        return new ExpressionWrapper(parseFilterList(exprs, "or"));
      }
      return new ExpressionWrapper(parseFilterObject(exprs, "or"));
    },
    parens(...args) {
      const node = parseValueBinaryOperationOrExpression(args);
      if (ParensNode.is(node)) {
        return new ExpressionWrapper(node);
      } else {
        return new ExpressionWrapper(ParensNode.create(node));
      }
    },
    cast(expr, dataType) {
      return new ExpressionWrapper(CastNode.create(parseReferenceExpression(expr), parseDataTypeExpression(dataType)));
    }
  });
  eb.fn = createFunctionModule();
  eb.eb = eb;
  return eb;
}
function expressionBuilder(_) {
  return createExpressionBuilder();
}

// zveltio-extensions/node_modules/kysely/dist/parser/expression-parser.js
function parseExpression(exp) {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode();
  } else if (isFunction(exp)) {
    return exp(expressionBuilder()).toOperationNode();
  }
  throw new Error(`invalid expression: ${JSON.stringify(exp)}`);
}
function parseAliasedExpression(exp) {
  if (isOperationNodeSource(exp)) {
    return exp.toOperationNode();
  } else if (isFunction(exp)) {
    return exp(expressionBuilder()).toOperationNode();
  }
  throw new Error(`invalid aliased expression: ${JSON.stringify(exp)}`);
}
function isExpressionOrFactory(obj) {
  return isExpression(obj) || isAliasedExpression(obj) || isFunction(obj);
}

// zveltio-extensions/node_modules/kysely/dist/dynamic/dynamic-table-builder.js
function isAliasedDynamicTableBuilder(obj) {
  return isObject(obj) && isOperationNodeSource(obj) && isString(obj.table) && isString(obj.alias);
}

// zveltio-extensions/node_modules/kysely/dist/parser/table-parser.js
function parseTableExpressionOrList(table) {
  if (isReadonlyArray(table)) {
    return table.map((it) => parseTableExpression(it));
  } else {
    return [parseTableExpression(table)];
  }
}
function parseTableExpression(table) {
  if (isString(table)) {
    return parseAliasedTable(table);
  } else if (isAliasedDynamicTableBuilder(table)) {
    return table.toOperationNode();
  } else {
    return parseAliasedExpression(table);
  }
}
function parseAliasedTable(from) {
  const ALIAS_SEPARATOR = " as ";
  if (from.includes(ALIAS_SEPARATOR)) {
    const [table, alias] = from.split(ALIAS_SEPARATOR).map(trim2);
    return AliasNode.create(parseTable(table), IdentifierNode.create(alias));
  } else {
    return parseTable(from);
  }
}
function parseTable(from) {
  const SCHEMA_SEPARATOR = ".";
  if (from.includes(SCHEMA_SEPARATOR)) {
    const [schema, table] = from.split(SCHEMA_SEPARATOR).map(trim2);
    return TableNode.createWithSchema(schema, table);
  } else {
    return TableNode.create(from);
  }
}
function trim2(str) {
  return str.trim();
}
// zveltio-extensions/node_modules/kysely/dist/raw-builder/raw-builder.js
class RawBuilderImpl {
  #props;
  constructor(props) {
    this.#props = freeze(props);
  }
  get expressionType() {
    return;
  }
  get isRawBuilder() {
    return true;
  }
  as(alias) {
    return new AliasedRawBuilderImpl(this, alias);
  }
  $castTo() {
    return new RawBuilderImpl({ ...this.#props });
  }
  $notNull() {
    return new RawBuilderImpl(this.#props);
  }
  withPlugin(plugin) {
    return new RawBuilderImpl({
      ...this.#props,
      plugins: this.#props.plugins !== undefined ? freeze([...this.#props.plugins, plugin]) : freeze([plugin])
    });
  }
  toOperationNode() {
    return this.#toOperationNode(this.#getExecutor());
  }
  compile(executorProvider) {
    return this.#compile(this.#getExecutor(executorProvider));
  }
  async execute(executorProvider, options) {
    const executor = this.#getExecutor(executorProvider);
    return executor.executeQuery(this.#compile(executor), options);
  }
  #getExecutor(executorProvider) {
    const executor = executorProvider !== undefined ? executorProvider.getExecutor() : NOOP_QUERY_EXECUTOR;
    return this.#props.plugins !== undefined ? executor.withPlugins(this.#props.plugins) : executor;
  }
  #toOperationNode(executor) {
    return executor.transformQuery(this.#props.rawNode, this.#props.queryId);
  }
  #compile(executor) {
    return executor.compileQuery(this.#toOperationNode(executor), this.#props.queryId);
  }
}
function createRawBuilder(props) {
  return new RawBuilderImpl(props);
}

class AliasedRawBuilderImpl {
  #rawBuilder;
  #alias;
  constructor(rawBuilder, alias) {
    this.#rawBuilder = rawBuilder;
    this.#alias = alias;
  }
  get expression() {
    return this.#rawBuilder;
  }
  get alias() {
    return this.#alias;
  }
  get rawBuilder() {
    return this.#rawBuilder;
  }
  toOperationNode() {
    return AliasNode.create(this.#rawBuilder.toOperationNode(), isOperationNodeSource(this.#alias) ? this.#alias.toOperationNode() : IdentifierNode.create(this.#alias));
  }
}
// zveltio-extensions/node_modules/kysely/dist/raw-builder/sql.js
var sql = Object.assign((sqlFragments, ...parameters) => {
  return createRawBuilder({
    queryId: createQueryId(),
    rawNode: RawNode.create(sqlFragments, parameters?.map(parseParameter) ?? [])
  });
}, {
  ref(columnReference) {
    return createRawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.createWithChild(parseStringReference(columnReference))
    });
  },
  val(value) {
    return createRawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.createWithChild(parseValueExpression(value))
    });
  },
  table(tableReference) {
    return createRawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.createWithChild(parseTable(tableReference))
    });
  },
  id(...ids) {
    const fragments = new Array(ids.length + 1).fill(".");
    fragments[0] = "";
    fragments[fragments.length - 1] = "";
    return createRawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.create(fragments, ids.map(IdentifierNode.create))
    });
  },
  lit(value) {
    return createRawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.createWithChild(ValueNode.createImmediate(value))
    });
  },
  raw(sql) {
    return createRawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.createWithSql(sql)
    });
  },
  join(array, separator = sql`, `) {
    const nodes = new Array(Math.max(2 * array.length - 1, 0));
    const sep = separator.toOperationNode();
    for (let i = 0;i < array.length; ++i) {
      nodes[2 * i] = parseParameter(array[i]);
      if (i !== array.length - 1) {
        nodes[2 * i + 1] = sep;
      }
    }
    return createRawBuilder({
      queryId: createQueryId(),
      rawNode: RawNode.createWithChildren(nodes)
    });
  }
});
function parseParameter(param) {
  if (isOperationNodeSource(param)) {
    return param.toOperationNode();
  }
  return parseValueExpression(param);
}
// engine/lib/graphql-dataloader.ts
function checkQueryDepth(query, maxDepth = 5) {
  try {
    let currentDepth = 0;
    let maxFound = 0;
    let inString = false;
    let escapeNext = false;
    for (const char of query) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\") {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === "{") {
          currentDepth++;
          maxFound = Math.max(maxFound, currentDepth);
        } else if (char === "}") {
          currentDepth = Math.max(0, currentDepth - 1);
        }
      }
    }
    return maxFound > maxDepth ? `Query exceeds maximum depth of ${maxDepth}` : null;
  } catch {
    return null;
  }
}
function checkQueryWidth(query, maxFields = 50) {
  try {
    let depth = 0;
    let rootFields = 0;
    let inString = false;
    let escapeNext = false;
    let atFieldStart = true;
    let skipNextIdent = false;
    for (const char of query) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\") {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString)
        continue;
      if (char === "{") {
        depth++;
        atFieldStart = true;
        continue;
      }
      if (char === "}") {
        depth = Math.max(0, depth - 1);
        atFieldStart = true;
        continue;
      }
      if (depth === 1) {
        const isIdent = /[A-Za-z0-9_]/.test(char);
        if (char === ":") {
          skipNextIdent = true;
          atFieldStart = true;
        } else if (isIdent && atFieldStart) {
          if (skipNextIdent) {
            skipNextIdent = false;
          } else {
            rootFields++;
          }
          atFieldStart = false;
        } else if (!isIdent) {
          atFieldStart = true;
        }
      }
    }
    return rootFields > maxFields ? `Query requests ${rootFields} top-level fields, which is over the limit of ${maxFields}. Split it across requests.` : null;
  } catch {
    return null;
  }
}

// engine/routes.ts
var OWN_TENANT = sql`COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
                                '00000000-0000-0000-0000-000000000001'::uuid)`;
function readFieldValue(parent, fieldName) {
  const value = parent[fieldName];
  return value instanceof Date ? value.toISOString() : value;
}
function isApiKey(user) {
  return String(user?.id ?? "").startsWith("apikey:");
}
function mapFieldType(fieldType) {
  const map = {
    text: GraphQLString,
    string: GraphQLString,
    email: GraphQLString,
    url: GraphQLString,
    richtext: GraphQLString,
    textarea: GraphQLString,
    password: GraphQLString,
    slug: GraphQLString,
    color: GraphQLString,
    phone: GraphQLString,
    tags: GraphQLString,
    enum: GraphQLString,
    date: GraphQLString,
    datetime: GraphQLString,
    json: GraphQLString,
    number: GraphQLFloat,
    float: GraphQLFloat,
    integer: GraphQLInt,
    boolean: GraphQLBoolean,
    uuid: GraphQLID,
    reference: GraphQLID,
    file: GraphQLID,
    image: GraphQLID
  };
  return map[fieldType] ?? GraphQLString;
}
async function buildDynamicSchema(ctx) {
  const { db, DDLManager } = ctx;
  let collections = [];
  let relations = [];
  try {
    collections = await DDLManager.getCollections(db);
    relations = await DDLManager.getRelations(db);
  } catch {}
  function readGate(context, collection) {
    context.__readGates ??= new Map;
    let gate = context.__readGates.get(collection);
    if (!gate) {
      gate = (async () => {
        const { user } = context;
        const [canRead, scope] = await Promise.all([
          ctx.internals.checkAccess(db, user, collection, "read"),
          ctx.internals.readScope(collection, user, isApiKey(user) ? "api_key" : "session")
        ]);
        return {
          canRead: canRead === true,
          readable: scope.readable,
          rows: scope.query,
          keep: async (rows) => (await scope.keep(rows)).map((row) => scope.shape(row)),
          readBack: async (row) => canRead === true && row && await scope.admits(row) ? scope.shape(row) : null
        };
      })();
      context.__readGates.set(collection, gate);
    }
    return gate;
  }
  async function mustRead(context, collection) {
    const gate = await readGate(context, collection);
    if (!gate.canRead)
      throw new Error(`Forbidden: no read permission on "${collection}"`);
    return gate;
  }
  function answered(res, notFound) {
    if (res.status < 300)
      return res.body;
    if (res.status === 404 && notFound !== undefined)
      return notFound;
    const b = res.body ?? {};
    throw new Error(b.errors?.join("; ") ?? b.message ?? b.reason ?? b.error ?? `HTTP ${res.status}`);
  }
  const first = async (gate, row) => row ? (await gate.keep([row]))[0] ?? null : null;
  const baseFields = {
    id: { type: GraphQLID },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString }
  };
  const queryFields = {};
  const mutationFields = {};
  const collectionTypes = {};
  for (const col of collections) {
    const typeName = col.name.charAt(0).toUpperCase() + col.name.slice(1);
    const scalarFields = { ...baseFields };
    for (const field of col.fields || []) {
      scalarFields[field.name] = { type: mapFieldType(field.type) };
    }
    for (const fieldName of Object.keys(scalarFields)) {
      scalarFields[fieldName] = {
        type: scalarFields[fieldName].type,
        resolve: (parent) => readFieldValue(parent, fieldName)
      };
    }
    const colType = new GraphQLObjectType({
      name: typeName,
      fields: () => {
        const allFields = { ...scalarFields };
        for (const rel of relations.filter((r) => r.source_collection === col.name)) {
          const targetType = collectionTypes[rel.target_collection];
          if (!targetType)
            continue;
          if (rel.type === "m2o") {
            allFields[rel.source_field] = { type: targetType };
          } else if (rel.type === "o2m" || rel.type === "m2m") {
            allFields[rel.source_field] = { type: new GraphQLList(targetType) };
          }
        }
        return allFields;
      }
    });
    collectionTypes[col.name] = colType;
  }
  for (const col of collections) {
    const tableName = DDLManager.getTableName(col.name);
    const colType = collectionTypes[col.name];
    const inputFields = {};
    for (const field of col.fields || []) {
      inputFields[field.name] = { type: mapFieldType(field.type) };
    }
    queryFields[`list_${col.name}`] = {
      type: new GraphQLList(colType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 50 },
        offset: { type: GraphQLInt, defaultValue: 0 },
        filter_id: { type: GraphQLID },
        filter_id_in: { type: new GraphQLList(GraphQLID) }
      },
      resolve: async (_, { limit, offset, filter_id, filter_id_in }, context) => {
        const gate = await mustRead(context, col.name);
        if ((filter_id || filter_id_in?.length) && !gate.readable("id")) {
          throw new Error(`Forbidden: cannot filter "${col.name}" by id`);
        }
        let q = gate.rows(db.selectFrom(tableName).selectAll());
        if (filter_id)
          q = q.where("id", "=", filter_id);
        if (filter_id_in?.length)
          q = q.where("id", "in", filter_id_in);
        const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 500));
        const safeOffset = Math.max(0, Number(offset) || 0);
        return gate.keep(await q.limit(safeLimit).offset(safeOffset).execute());
      }
    };
    queryFields[`get_${col.name}`] = {
      type: colType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, { id }, context) => {
        const gate = await mustRead(context, col.name);
        if (!gate.readable("id"))
          throw new Error(`Forbidden: cannot filter "${col.name}" by id`);
        return first(gate, await gate.rows(db.selectFrom(tableName).selectAll()).where("id", "=", id).executeTakeFirst());
      }
    };
    mutationFields[`create_${col.name}`] = {
      type: colType,
      args: inputFields,
      resolve: async (_, args, context) => {
        const gate = await readGate(context, col.name);
        return gate.readBack(answered(await ctx.internals.createRecord(context.request, col.name, args)));
      }
    };
    mutationFields[`update_${col.name}`] = {
      type: colType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) }, ...inputFields },
      resolve: async (_, { id, ...data }, context) => {
        const gate = await readGate(context, col.name);
        return gate.readBack(answered(await ctx.internals.updateRecord(context.request, col.name, id, data), null));
      }
    };
    mutationFields[`delete_${col.name}`] = {
      type: GraphQLBoolean,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_, { id }, context) => answered(await ctx.internals.deleteRecord(context.request, col.name, id), false) !== false
    };
    const collectionRelations = relations.filter((r) => r.source_collection === col.name);
    if (collectionRelations.length > 0) {
      const liveFields = colType.getFields();
      for (const rel of collectionRelations) {
        const fieldName = rel.source_field;
        const targetTableName = DDLManager.getTableName(rel.target_collection);
        const targetType = collectionTypes[rel.target_collection];
        if (!targetType)
          continue;
        if (rel.type === "m2o") {
          liveFields[fieldName] = {
            name: fieldName,
            type: targetType,
            args: [],
            description: `Many-to-one relation \u2192 ${rel.target_collection}`,
            resolve: async (parent, _args, context) => {
              const fk = parent[fieldName];
              if (!fk)
                return null;
              const gate = await mustRead(context, rel.target_collection);
              try {
                return await first(gate, await gate.rows(db.selectFrom(targetTableName).selectAll()).where("id", "=", fk).executeTakeFirst());
              } catch {
                return null;
              }
            }
          };
        } else if (rel.type === "o2m") {
          const foreignKey = rel.target_field || `${col.name}_id`;
          liveFields[fieldName] = {
            name: fieldName,
            type: new GraphQLList(targetType),
            args: [],
            description: `One-to-many relation \u2192 ${rel.target_collection}`,
            resolve: async (parent, _args, context) => {
              const gate = await mustRead(context, rel.target_collection);
              if (!gate.readable(foreignKey))
                return [];
              try {
                return await gate.keep(await gate.rows(db.selectFrom(targetTableName).selectAll()).where(foreignKey, "=", parent.id).execute());
              } catch {
                return [];
              }
            }
          };
        } else if (rel.type === "m2m") {
          const junctionTable = rel.junction_table || `zvd_${col.name}_${rel.target_collection}`;
          const sourceColumn = `${col.name}_id`;
          const targetColumn = `${rel.target_collection}_id`;
          liveFields[fieldName] = {
            name: fieldName,
            type: new GraphQLList(targetType),
            args: [],
            description: `Many-to-many relation \u2192 ${rel.target_collection}`,
            resolve: async (parent, _args, context) => {
              const gate = await mustRead(context, rel.target_collection);
              try {
                const linked = db.selectFrom(junctionTable).select(targetColumn).where(sourceColumn, "=", parent.id);
                return await gate.keep(await gate.rows(db.selectFrom(targetTableName).selectAll()).where("id", "in", linked).execute());
              } catch {
                return [];
              }
            }
          };
        }
      }
    }
  }
  if (Object.keys(queryFields).length === 0) {
    queryFields["_empty"] = {
      type: GraphQLString,
      resolve: () => "No collections defined yet"
    };
  }
  return new GraphQLSchema({
    query: new GraphQLObjectType({ name: "Query", fields: queryFields }),
    mutation: Object.keys(mutationFields).length > 0 ? new GraphQLObjectType({ name: "Mutation", fields: mutationFields }) : undefined
  });
}
var _cachedSchemas = new Map;
var SCHEMA_TTL_MS = 60000;
async function getSchema(ctx, tenantKey) {
  const now = Date.now();
  const entry = _cachedSchemas.get(tenantKey);
  if (!entry || now - entry.builtAt > SCHEMA_TTL_MS) {
    const schema = await buildDynamicSchema(ctx);
    _cachedSchemas.set(tenantKey, { schema, builtAt: now });
    return schema;
  }
  return entry.schema;
}
var PLAYGROUND_HTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Zveltio GraphQL</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/graphiql/3.0.6/graphiql.min.css" />
  </head>
  <body style="margin:0">
    <div id="graphiql" style="height:100vh"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/graphiql/3.0.6/graphiql.min.js"></script>
    <script>
      const fetcher = GraphiQL.createFetcher({ url: '/api/graphql' });
      ReactDOM.render(React.createElement(GraphiQL, { fetcher }), document.getElementById('graphiql'));
    </script>
  </body>
</html>`;
var kept;
function keepContext(ctx) {
  kept = ctx;
}
function context() {
  if (!kept)
    throw new Error("developer/graphql: register() has not run");
  return kept;
}
var answer = (body, status = 200) => Response.json(body, { status });
function callerOf(ctx, request) {
  if (!ctx.internals.caller)
    throw new Error("developer/graphql needs engine 3.0.0-beta.116 or later");
  const who = ctx.internals.caller(request);
  return who ? { user: who.user, tenantKey: who.tenantId ?? "default" } : null;
}
async function adminCaller(ctx, request) {
  const who = callerOf(ctx, request);
  if (!who)
    return answer({ error: "Unauthorized" }, 401);
  if (isApiKey(who.user) || !await ctx.internals.isTenantAdmin(who.user.id)) {
    return answer({ error: "Admin required" }, 403);
  }
  return who;
}
async function run(ctx, request, user, schema, source, variableValues, operationName) {
  let document;
  try {
    document = parse(source);
  } catch (err) {
    return { errors: [err] };
  }
  const isAdmin = isApiKey(user) ? Promise.resolve(false) : ctx.internals.isTenantAdmin(user.id);
  const rules = await isAdmin ? specifiedRules : [...specifiedRules, NoSchemaIntrospectionCustomRule];
  const errors = validate(schema, document, rules);
  if (errors.length)
    return { errors };
  return execute({ schema, document, variableValues, operationName, contextValue: { request, user } });
}
var playground = async (request) => {
  const ctx = context();
  if (ctx.config?.isProduction) {
    const admin = await adminCaller(ctx, request);
    if (admin instanceof Response)
      return admin;
  }
  return new Response(PLAYGROUND_HTML, { headers: { "content-type": "text/html; charset=UTF-8" } });
};
var executeQuery = async (request) => {
  const ctx = context();
  const who = callerOf(ctx, request);
  if (!who)
    return answer({ errors: [{ message: "Unauthorized" }] }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return answer({ errors: [{ message: "Invalid JSON body" }] }, 400);
  }
  const { query, variables, operationName } = body ?? {};
  if (!query)
    return answer({ errors: [{ message: "query is required" }] }, 400);
  const depthError = checkQueryDepth(query, 5);
  if (depthError)
    return answer({ errors: [{ message: depthError }] }, 400);
  const widthError = checkQueryWidth(query, 50);
  if (widthError)
    return answer({ errors: [{ message: widthError }] }, 400);
  let result;
  try {
    const schema = await getSchema(ctx, who.tenantKey);
    result = await run(ctx, request, who.user, schema, query, variables, operationName);
  } catch (err) {
    result = { errors: [{ message: String(err) }] };
  }
  return answer(result, (result.errors?.length ?? 0) > 0 && !result.data ? 400 : 200);
};
var refreshSchema = async (request) => {
  const ctx = context();
  const admin = await adminCaller(ctx, request);
  if (admin instanceof Response)
    return admin;
  _cachedSchemas.clear();
  await getSchema(ctx, admin.tenantKey);
  return answer({ success: true, message: "Schema refreshed" });
};
var executePersisted = async (request, { params }) => {
  const ctx = context();
  const { db } = ctx;
  const who = callerOf(ctx, request);
  if (!who)
    return answer({ errors: [{ message: "Unauthorized" }] }, 401);
  const { user } = who;
  const name = params.name;
  if (await ctx.internals.checkAccess(db, user, "graphql_queries", "read") !== true) {
    return answer({ errors: [{ message: "Access denied to this persisted query" }] }, 403);
  }
  const scope = await ctx.internals.readScope("graphql_queries", user, isApiKey(user) ? "api_key" : "session");
  const pqRes = await sql`
    SELECT * FROM zvd_graphql_queries WHERE name = ${name} AND tenant_id = ${OWN_TENANT}
  `.execute(db);
  const pq = pqRes.rows[0];
  if (!pq || !await scope.admits(pq)) {
    return answer({ errors: [{ message: "Persisted query not found" }] }, 404);
  }
  let variables = {};
  try {
    const bodyText = await request.text();
    if (bodyText)
      variables = JSON.parse(bodyText).variables || {};
  } catch {}
  const widthErrorPersisted = checkQueryWidth(pq.query, 50);
  if (widthErrorPersisted)
    return answer({ errors: [{ message: widthErrorPersisted }] }, 400);
  const depthError = checkQueryDepth(pq.query, 5);
  if (depthError)
    return answer({ errors: [{ message: depthError }] }, 400);
  try {
    const schema = await getSchema(ctx, who.tenantKey);
    return answer(await run(ctx, request, user, schema, pq.query, variables));
  } catch (err) {
    return answer({ errors: [{ message: String(err) }] }, 400);
  }
};

// engine/index.ts
var extension = {
  name: "developer/graphql",
  category: "developer",
  mountStrategy: "subapp",
  routes: { playground, executeQuery, refreshSchema, executePersisted },
  async register(_app, ctx) {
    keepContext(ctx);
  }
};
var engine_default = extension;
export {
  engine_default as default
};
// @zveltio-bundled kysely@0.29.8
