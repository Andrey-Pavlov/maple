import { __assign, __read, __spread, __values } from "tslib";
import { BehaviorSubject } from 'rxjs';
import { MapleColorHelper } from './helpers/color.helper';
import { MAPLE_PROP_EXTENSION_MAP } from './property-extension-map';
import { getMapleUtilityClassMap, getMapleUtilityVariableMap, } from './utility-class-map';
import { MAPLE_VAR_ALERT } from './variables/alert';
import { MAPLE_VAR_BREAKPOINT } from './variables/breakpoint';
import { MAPLE_VAR_BUTTON } from './variables/button';
import { MAPLE_VAR_COLOR } from './variables/color';
import { MAPLE_VAR_FONT_FAMILY } from './variables/font-family';
import { MAPLE_VAR_FONT_SIZE } from './variables/font-size';
import { MAPLE_VAR_FONT_WEIGHT } from './variables/font-weight';
import { MAPLE_VAR_MAX_WIDTH } from './variables/max-width';
import { MAPLE_VAR_SPACER } from './variables/spacer';
import { MAPLE_VAR_TRANSITION } from './variables/transition';
// Define a global Maple.CACHE to collect selectors and maps on breakpoint keys
var BREAKPOINT = {
    media: {},
};
var STYLE_ELEMENTS = {};
var STR_EMPTY = '';
var STR_SPACE = ' ';
var STR_DOT = '.';
var STR_UP = 'up';
var STR_DOWN = 'down';
var SEP_MEDIA = '-';
var SEP_SELECTOR = ':';
var SEP_UTIL_KEY = ':';
var SEP_UTIL_VAL = '=';
var SEP_NO_SPACE = '<';
var SEP_OUTER_SPACE = '<<';
var IMPORTANT = '!';
var WILDCARD = '*';
var PREFIX_MAPLE_PROP = '_';
var SUFFIX_MEDIA_UP = SEP_MEDIA + STR_UP;
var SUFFIX_MEDIA_DOWN = SEP_MEDIA + STR_DOWN;
var R_SELECTOR_RESERVED = /(\.|\+|\~|\<|\>|\[|\]|\(|\)|\!|\:|\,|\=|\||\%|\#|\*|\"|\/)/g;
var R_ESCAPE_RESERVED = '\\$1';
var R_SEP_NO_SPACE = /\</g;
var R_SEP_SEL_SPACE = /\>\>/g;
var R_SEP_SEL_SPACE_ALL = /(\<|\>\>)/g;
var R_SEP_VAL_SPACE = /\|/g;
var R_SEP_UTIL_VAL = /=(?:.(?!=))+$/;
var R_SEP_UTIL_KEY = /\:(?:.(?!\:))+$/;
var R_CUSTOM = /\((.*?)\)/;
var R_WILDCARD = /\*/g;
var R_EXTRACT_CLASS = /class\=\"([\s\S]+?)\"/g;
var R_UNIFIY = /\=(?=[^.]*$)/;
var preInitClassList = [];
var isMapleEnabled = true;
var doc;
var esc = function (selector) {
    return selector.replace(R_SELECTOR_RESERVED, R_ESCAPE_RESERVED);
};
var Maple = /** @class */ (function () {
    function Maple() {
    }
    // Find min and max breakpoints
    Maple.setMinAndMaxBreakpoints = function () {
        var breakpointKeys = Object.keys(Maple.breakpointMap);
        var breakpoints = breakpointKeys
            .map(function (key) { return ({
            key: key,
            size: parseFloat(Maple.breakpointMap[key]),
        }); })
            .sort(function (a, b) { return a.size - b.size; });
        BREAKPOINT.minKey = breakpoints[0].key;
        BREAKPOINT.maxKey = breakpoints[breakpoints.length - 1].key;
        BREAKPOINT.minMedia = BREAKPOINT.minKey + SUFFIX_MEDIA_UP;
        breakpoints.forEach(function (bp, i) {
            var next = breakpoints[i + 1];
            BREAKPOINT.media[bp.key + SUFFIX_MEDIA_UP] = bp.size;
            if (next) {
                // Uses 0.02px rather than 0.01px to work around a current rounding bug in Safari.
                // See https://bugs.webkit.org/show_bug.cgi?id=178261
                BREAKPOINT.media[bp.key + SUFFIX_MEDIA_DOWN] = next.size - 0.02;
            }
        });
    };
    Maple.createDomElements = function (styleElements, prefix, document) {
        if (prefix === void 0) { prefix = 'maple'; }
        // Prepare style element on head
        var docHead = (document || doc).getElementsByTagName('head')[0];
        var breakpoints = Object.keys(BREAKPOINT.media).sort(function (a, b) { return BREAKPOINT.media[a] - BREAKPOINT.media[b]; });
        var breakpointsUp = breakpoints.filter(function (key) {
            return key.includes(SUFFIX_MEDIA_UP);
        });
        var breakpointsDown = breakpoints.filter(function (key) {
            return key.includes(SUFFIX_MEDIA_DOWN);
        });
        breakpointsUp.concat(breakpointsDown.reverse()).forEach(function (key) {
            var styleId = prefix + "-" + key;
            var el = doc.getElementById(styleId);
            if (!!el) {
                docHead.removeChild(el);
            }
            styleElements[key] = doc.createElement('style');
            styleElements[key].setAttribute('id', styleId);
            docHead.appendChild(styleElements[key]);
        });
    };
    Maple.extendProperties = function () {
        Maple.utilPrefixList.forEach(function (def) {
            Maple.utilClassMap[def.prefix] = Maple.utilClassMap[def.prefix] || {};
            Maple.utilClassMap[def.prefix][WILDCARD] = {};
            Object.keys(def.map).forEach(function (key) {
                Maple.utilClassMap[def.prefix][key] = {};
                def.props.forEach(function (prop) {
                    var _a;
                    Maple.utilClassMap[def.prefix][WILDCARD] = __assign(__assign({}, Maple.utilClassMap[def.prefix][WILDCARD]), (_a = {}, _a[prop] = WILDCARD, _a));
                    Maple.utilClassMap[def.prefix][key][prop] = def.map[key];
                });
            });
        });
    };
    Maple.getSelectors = function (media, selKey, utilKey, utilVal, 
    // tslint:disable-next-line: variable-name
    _selector, important) {
        if (media === void 0) { media = STR_EMPTY; }
        if (selKey === void 0) { selKey = STR_EMPTY; }
        if (utilKey === void 0) { utilKey = STR_EMPTY; }
        if (utilVal === void 0) { utilVal = STR_EMPTY; }
        if (_selector === void 0) { _selector = STR_EMPTY; }
        if (important === void 0) { important = false; }
        var maple = Maple.utilClassMap[selKey] || {};
        var parentSelector = selKey.includes(SEP_OUTER_SPACE)
            ? selKey.split(SEP_OUTER_SPACE).pop().split(R_SEP_SEL_SPACE_ALL).shift()
            : STR_EMPTY;
        var baseSel = [
            media || STR_EMPTY,
            maple._selector ? SEP_SELECTOR : STR_EMPTY,
            selKey,
            utilKey ? SEP_UTIL_KEY : STR_EMPTY,
            utilKey,
            utilVal ? SEP_UTIL_VAL : STR_EMPTY,
        ].join(STR_EMPTY);
        return ((maple._selector || selKey || '') + _selector)
            .split(/,\s*/)
            .map(function (selector) {
            return [
                parentSelector ? parentSelector + STR_SPACE : STR_EMPTY,
                utilVal ? STR_DOT : STR_EMPTY,
                utilVal ? esc(baseSel + utilVal) : "[class*=\"" + baseSel + "\"]",
                utilVal && important ? esc(IMPORTANT) : STR_EMPTY,
                maple._selector || !selKey || selKey.charAt(0) === SEP_NO_SPACE
                    ? STR_EMPTY
                    : STR_SPACE,
                selector.trim().charAt(0) === SEP_NO_SPACE ? STR_EMPTY : STR_SPACE,
                selector
                    .trim()
                    .replace(SEP_OUTER_SPACE + parentSelector, STR_EMPTY)
                    .replace(R_SEP_SEL_SPACE, STR_SPACE)
                    .replace(R_SEP_NO_SPACE, STR_EMPTY),
            ].join(STR_EMPTY);
        })
            .join(',');
    };
    Maple.cache = function (media, selector, mapToBeCached) {
        var _a;
        if (!mapToBeCached) {
            throw new Error("Property map not found for selector: " + selector);
        }
        var cacheKey = "" + media + selector + JSON.stringify(mapToBeCached);
        if (!Maple.CACHE[cacheKey]) {
            Maple.tempCache[media] = Maple.tempCache[media] || {};
            Maple.tempCache[media] = __assign(__assign({}, Maple.tempCache[media]), (_a = {}, _a[selector] = __assign(__assign({}, (Maple.tempCache[media][selector] || {})), mapToBeCached), _a));
            Maple.CACHE[cacheKey] = 1;
        }
    };
    Maple.styles = function (media) {
        var e_1, _a, e_2, _b;
        var cacheItem = Maple.tempCache[media];
        if (!cacheItem) {
            return STR_EMPTY;
        }
        var selectors = Object.keys(cacheItem);
        if (selectors.length === 0) {
            return STR_EMPTY;
        }
        var breakpointParts = media.split(SEP_MEDIA);
        var breakpointDir = breakpointParts[1];
        var mediaQuery = breakpointDir === STR_UP ? 'min-width' : 'max-width';
        var result = [];
        // open media query
        if (media !== BREAKPOINT.minMedia) {
            result.push("@media (" + mediaQuery + ": " + BREAKPOINT.media[media] + "px) {");
        }
        try {
            for (var selectors_1 = __values(selectors), selectors_1_1 = selectors_1.next(); !selectors_1_1.done; selectors_1_1 = selectors_1.next()) {
                var selector = selectors_1_1.value;
                var propMap = cacheItem[selector];
                if (!propMap) {
                    continue;
                }
                var propMapKeys = Object.keys(propMap).filter(function (p) { return p !== IMPORTANT; });
                if (propMapKeys.length === 0) {
                    continue;
                }
                // open selector
                result.push(selector + "{");
                try {
                    // fill selector with properties
                    for (var propMapKeys_1 = (e_2 = void 0, __values(propMapKeys)), propMapKeys_1_1 = propMapKeys_1.next(); !propMapKeys_1_1.done; propMapKeys_1_1 = propMapKeys_1.next()) {
                        var prop = propMapKeys_1_1.value;
                        var val = propMap[prop].toString();
                        var important = val.indexOf(IMPORTANT) < 0 && propMap[IMPORTANT]
                            ? ' !important'
                            : STR_EMPTY;
                        result.push(Maple.propExtensionMap[prop]
                            ? Maple.propExtensionMap[prop](val, important)
                            : prop + ":" + val + important + ";");
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (propMapKeys_1_1 && !propMapKeys_1_1.done && (_b = propMapKeys_1.return)) _b.call(propMapKeys_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                // close selector
                result.push("}");
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (selectors_1_1 && !selectors_1_1.done && (_a = selectors_1.return)) _a.call(selectors_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // close media query
        if (media !== BREAKPOINT.minMedia) {
            result.push("}");
        }
        return result.length > 2 ? result.join(STR_EMPTY) : STR_EMPTY;
    };
    Maple.generateWhitelist = function (whitelist) {
        var e_3, _a, e_4, _b, e_5, _c;
        if (whitelist === void 0) { whitelist = []; }
        var classList = [];
        try {
            for (var whitelist_1 = __values(whitelist), whitelist_1_1 = whitelist_1.next(); !whitelist_1_1.done; whitelist_1_1 = whitelist_1.next()) {
                var utilKey = whitelist_1_1.value;
                if (!Maple.utilClassMap[utilKey]) {
                    classList.push(utilKey);
                    continue;
                }
                var props = Object.keys(Maple.utilClassMap[utilKey]);
                try {
                    for (var props_1 = (e_4 = void 0, __values(props)), props_1_1 = props_1.next(); !props_1_1.done; props_1_1 = props_1.next()) {
                        var utilVal = props_1_1.value;
                        if (utilVal.charAt(0) === PREFIX_MAPLE_PROP) {
                            continue;
                        }
                        var breakpoints = Object.keys(Maple.breakpointMap);
                        try {
                            for (var breakpoints_1 = (e_5 = void 0, __values(breakpoints)), breakpoints_1_1 = breakpoints_1.next(); !breakpoints_1_1.done; breakpoints_1_1 = breakpoints_1.next()) {
                                var bp = breakpoints_1_1.value;
                                var mediaUp = bp + SUFFIX_MEDIA_UP;
                                var mediaDown = bp + SUFFIX_MEDIA_DOWN;
                                var utilClass = SEP_UTIL_KEY + utilKey + SEP_UTIL_VAL + utilVal;
                                if (mediaUp in BREAKPOINT.media) {
                                    classList.push(mediaUp + utilClass);
                                }
                                if (mediaDown in BREAKPOINT.media) {
                                    classList.push(mediaDown + utilClass);
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (breakpoints_1_1 && !breakpoints_1_1.done && (_c = breakpoints_1.return)) _c.call(breakpoints_1);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (props_1_1 && !props_1_1.done && (_b = props_1.return)) _b.call(props_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (whitelist_1_1 && !whitelist_1_1.done && (_a = whitelist_1.return)) _a.call(whitelist_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        Maple.fly(preInitClassList.concat(classList));
    };
    Maple.splitLastOccurrence = function (str, key) {
        var pos = str.lastIndexOf(key);
        var result = [];
        var firstPart = str.substring(0, pos);
        var lastPart = str.substring(pos + key.length);
        if (firstPart) {
            result.push(firstPart);
        }
        if (lastPart) {
            result.push(lastPart);
        }
        return result;
    };
    Maple.splitFirstOccurrence = function (str, key) {
        var pos = str.indexOf(key);
        var result = [];
        var firstPart = str.substring(0, pos);
        var lastPart = str.substring(pos + key.length);
        if (firstPart) {
            result.push(firstPart);
        }
        if (lastPart) {
            result.push(lastPart);
        }
        return result;
    };
    Maple.init = function (document, enabled, utilClassMap, whitelist, variables, isRtl, utilPrefixList, propExtensionMap) {
        if (utilClassMap === void 0) { utilClassMap = {}; }
        if (variables === void 0) { variables = Maple.variables; }
        if (isRtl === void 0) { isRtl = false; }
        if (utilPrefixList === void 0) { utilPrefixList = []; }
        if (propExtensionMap === void 0) { propExtensionMap = {}; }
        isMapleEnabled = enabled;
        if (isMapleEnabled === false) {
            return;
        }
        doc = document;
        Maple.CACHE = {};
        Maple.variables = __assign(__assign({}, Maple.variables), variables);
        MapleColorHelper.generateAlphaColors(Maple.variables.color);
        Maple.utilClassMap = __assign(__assign({}, getMapleUtilityClassMap(Maple.variables)), utilClassMap);
        Maple.utilPrefixList = __spread(getMapleUtilityVariableMap(Maple.variables), utilPrefixList);
        Maple.propExtensionMap = __assign(__assign({}, MAPLE_PROP_EXTENSION_MAP), propExtensionMap);
        Maple.breakpointMap = __assign({}, Maple.variables.breakpoint);
        Maple.setMinAndMaxBreakpoints();
        Maple.createDomElements(STYLE_ELEMENTS);
        Maple.extendProperties();
        Maple.utilClassMap = Maple.convertUtilClassMapToRtl(Maple.utilClassMap, isRtl);
        Maple.generateWhitelist(whitelist);
        this.onInit$.next(true);
    };
    Maple.findAndFly = function (str) {
        if (isMapleEnabled === false) {
            return;
        }
        if (str) {
            Maple.fly((str.match(R_EXTRACT_CLASS) || [])
                .join(' ')
                .replace(/class\=\"/g, '')
                .replace(/"/g, ''));
        }
    };
    Maple.convertUtilClassMapToRtl = function (utilityClass, isRtl) {
        if (!isRtl) {
            return utilityClass;
        }
        var data = {};
        Object.keys(utilityClass).forEach(function (key) {
            var value = utilityClass[key];
            if (value && typeof value === 'object' && value.rtl) {
                Object.keys(value.rtl).reduce(function (rtlValue, rtlKey) {
                    rtlValue[rtlKey] = value.rtl[rtlKey];
                }, value);
            }
            if (typeof value === 'string' || typeof value === 'number') {
                if (key.includes('left')) {
                    var replacedKey = key.replace('left', 'right');
                    data[replacedKey] = value;
                }
                else if (key.includes('right')) {
                    var replacedKey = key.replace('right', 'left');
                    data[replacedKey] = value;
                }
                else {
                    data[key] = value;
                }
                if (typeof value === 'string' && value.includes('left')) {
                    data[key] = value.replace('left', 'right');
                }
                else if (typeof value === 'string' && value.includes('right')) {
                    data[key] = value.replace('right', 'left');
                }
                else if (typeof value === 'string' &&
                    key === 'transform' &&
                    value.includes('translate') &&
                    !['Y(', 'Z('].some(function (t) { return value.includes(t); })) {
                    data[key] = value
                        .split(' ')
                        .map(function (item) {
                        var splittedValue = item.split('(');
                        splittedValue[1] =
                            splittedValue[1] && splittedValue[1].startsWith('-')
                                ? splittedValue[1].replace('-', '(')
                                : splittedValue[1]
                                    ? '(-' + splittedValue[1]
                                    : '';
                        return splittedValue[0] + splittedValue[1];
                    })
                        .join(' ');
                }
            }
            else {
                var fixedUtility = Maple.convertUtilClassMapToRtl(__assign({}, value), isRtl);
                data[key] = __assign({}, fixedUtility);
            }
        });
        return data;
    };
    Maple.fly = function (classList) {
        var e_6, _a;
        if (isMapleEnabled === false) {
            return;
        }
        if (!preInitClassList.length) {
            preInitClassList = preInitClassList.concat(classList);
            return;
        }
        if (!classList || classList.length === 0) {
            return;
        }
        var rawCacheKey = Array.isArray(classList)
            ? classList.join(' ')
            : classList;
        if (Maple.rawCache[rawCacheKey]) {
            return;
        }
        Maple.rawCache[rawCacheKey] = 1;
        if (Array.isArray(classList) === false) {
            classList = classList.split(/\s+/g);
        }
        classList = Maple.unifyUtilityClass(classList);
        Maple.tempCache = {};
        var _loop_1 = function (classItem) {
            var _a;
            // Check whether the styles will have !important flag or not
            var important = classItem.charAt(classItem.length - 1) === IMPORTANT;
            var classItemWithoutImportant = classItem.replace(IMPORTANT, STR_EMPTY);
            var parts = Maple.splitLastOccurrence(classItemWithoutImportant, SEP_UTIL_VAL);
            // Extract utility value
            var utilVal = parts.length === 1 ? null : parts.pop();
            // Extract media query
            var media = Object.keys(BREAKPOINT.media).find(function (key) { return classItem.indexOf(key) === 0; }) || BREAKPOINT.minMedia;
            parts = Maple.splitFirstOccurrence(parts.join(STR_EMPTY), media)
                .join(STR_EMPTY)
                .split(SEP_UTIL_KEY)
                .filter(function (p) { return !!p; });
            // Exact utility class
            var utilKey = parts.length >= 1 ? parts.pop() : null;
            // Extract selector
            var selKey = parts.join(SEP_UTIL_KEY);
            // Get style map
            var maple = Maple.utilClassMap[utilKey];
            // Without a style map we can't create styles
            if (!maple) {
                return "continue";
            }
            // Cache default styles with selector
            if (maple._default) {
                Object.keys(maple._default).forEach(function (mediaItem) {
                    Maple.cache(mediaItem, Maple.getSelectors(null, selKey, utilKey, null, maple._selector, important), __assign(__assign({}, maple._common), maple[maple._default[mediaItem]]));
                });
            }
            // Cache utility styles with selector
            if (utilVal) {
                var c = classItem.replace(IMPORTANT, STR_EMPTY);
                var ucm = Maple.utilClassMap;
                //#region Wildcard selectors
                // *:util-key
                // *:util-key=util-val
                // *.selector:util-key=util-val
                // *:selector-key:util-key=util-val
                var wcMedia = c.replace(media, WILDCARD);
                // media:*
                // media.selector:*
                // media:selector-key:*
                var wcutilKey = c.replace(R_SEP_UTIL_KEY, ":" + WILDCARD);
                // media:util-key=*
                // media.selector:util-key=*
                // media:selector-key:util-key=*
                var wcutilVal = c.replace(R_SEP_UTIL_VAL, "=" + WILDCARD);
                // *:*
                // *.selector:*
                // *:selector-key:*
                var wcMediaKey = wcMedia.replace(R_SEP_UTIL_KEY, ":" + WILDCARD);
                // *:util-key=*
                // *.selector:util-key=*
                // *:selector-key:util-key=*
                var wcMediaVal = wcutilVal.replace(media, WILDCARD);
                //#endregion
                var selector = Maple.getSelectors(media, selKey, utilKey, utilVal, maple._selector, important);
                Maple.cache(media, selector, __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, maple._common), maple[utilVal]), JSON.parse(JSON.stringify(maple[utilVal.replace(R_CUSTOM, WILDCARD)] || {}).replace(R_WILDCARD, utilKey === 'content'
                    ? utilVal.replace(R_CUSTOM, '$1')
                    : utilVal.replace(R_CUSTOM, '$1').replace(R_SEP_VAL_SPACE, ' ')))), (ucm[wcMediaKey] || {})), (ucm[wcutilKey] || {})), (ucm[wcMediaVal] || {})), (ucm[wcutilVal] || {})), (ucm[wcMedia] || {})), (ucm[c] || {})), (_a = {}, _a[IMPORTANT] = important, _a)));
            }
        };
        try {
            for (var classList_1 = __values(classList), classList_1_1 = classList_1.next(); !classList_1_1.done; classList_1_1 = classList_1.next()) {
                var classItem = classList_1_1.value;
                _loop_1(classItem);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (classList_1_1 && !classList_1_1.done && (_a = classList_1.return)) _a.call(classList_1);
            }
            finally { if (e_6) throw e_6.error; }
        }
        //#region Generate styles
        // Generate min media query styles
        var minMediaStyles = Maple.styles(BREAKPOINT.minMedia);
        if (minMediaStyles) {
            Maple.appendStyle(STYLE_ELEMENTS, BREAKPOINT.minMedia, minMediaStyles, false);
        }
        // Generate media query styles
        var mediaQueryStyles = {};
        Object.keys(Maple.tempCache).forEach(function (key) {
            if (key !== BREAKPOINT.minMedia) {
                mediaQueryStyles[key] = mediaQueryStyles[key] || '';
                mediaQueryStyles[key] += Maple.styles(key);
            }
        });
        Object.keys(mediaQueryStyles).forEach(function (key) {
            return Maple.appendStyle(STYLE_ELEMENTS, key, mediaQueryStyles[key], false);
        });
        //#endregion
    };
    Maple.unifyUtilityClass = function (classList) {
        return classList.reduce(function (acc, classItem) {
            var existingStyleIndex = acc.findIndex(function (p) {
                return ((p || '').split(R_UNIFIY) || [])[0] ===
                    ((classItem || '').split(R_UNIFIY) || [])[0];
            });
            if (existingStyleIndex < 0) {
                acc.push(classItem);
            }
            else {
                acc[existingStyleIndex] = classItem;
            }
            return acc;
        }, []);
    };
    Maple.appendStyle = function (styleElements, bp, style, silent) {
        if (silent === void 0) { silent = true; }
        styleElements[bp].appendChild(doc.createTextNode(style));
        if (!silent) {
            Maple.onStyleAppend$.next({ bp: bp, style: style });
        }
    };
    Maple.isMediaValid = function (media) {
        return media in BREAKPOINT.media;
    };
    Maple.isBreakpointValid = function (breakpoint) {
        return breakpoint in Maple.breakpointMap;
    };
    Maple.isMediaMatchesWithBreakpoint = function (media, breakpoint) {
        if (!Maple.isBreakpointValid(breakpoint) || !Maple.isMediaValid(media)) {
            return false;
        }
        var mediaSize = BREAKPOINT.media[media];
        var breakpointSize = parseFloat(Maple.breakpointMap[breakpoint]);
        if (media.includes(SUFFIX_MEDIA_DOWN)) {
            return breakpointSize <= mediaSize;
        }
        if (media.includes(SUFFIX_MEDIA_UP)) {
            return breakpointSize >= mediaSize;
        }
        return false;
    };
    Maple.getValidMediaMap = function () {
        return __assign({}, BREAKPOINT.media);
    };
    Maple.getMinMedia = function () {
        return BREAKPOINT.minMedia;
    };
    Maple.getMinBreakpoint = function () {
        return BREAKPOINT.minKey;
    };
    Maple.getMappedMediaOrMin = function (media) {
        return Maple.isMediaValid(media) ? media : Maple.getMinMedia();
    };
    Maple.getMappedMediaOrNull = function (media) {
        return Maple.isMediaValid(media) ? media : null;
    };
    Maple.getMappedBreakpointOrMin = function (breakpoint) {
        return Maple.isBreakpointValid(breakpoint)
            ? breakpoint
            : Maple.getMinBreakpoint();
    };
    Maple.getMappedBreakpointOrNull = function (breakpoint) {
        return Maple.isBreakpointValid(breakpoint) ? breakpoint : null;
    };
    Maple.getVariables = function () {
        return __assign({}, Maple.variables);
    };
    Maple.fillInTheGaps = function (breakpointMap) {
        var fullBreakpointMap = Maple.getVariables().breakpoint;
        var keys = Object.keys(fullBreakpointMap);
        var minKey = keys.find(function (key) { return key in breakpointMap; });
        return keys
            .sort(function (a, b) { return fullBreakpointMap[a] - fullBreakpointMap[b]; })
            .reduce(function (acc, key, i) {
            var _a, _b;
            var nextKey = keys[i + 1];
            if (key in acc === false) {
                acc = __assign(__assign({}, acc), (_a = {}, _a[key] = key in breakpointMap ? breakpointMap[key] : breakpointMap[minKey], _a));
            }
            if (nextKey && !breakpointMap[nextKey]) {
                acc = __assign(__assign({}, acc), (_b = {}, _b[nextKey] = acc[key], _b));
            }
            return acc;
        }, {});
    };
    Maple.isBreakpointMap = function (breakpointMap) {
        if (typeof breakpointMap === 'object' && breakpointMap !== null) {
            return Object.keys(Maple.getVariables().breakpoint).some(function (key) { return breakpointMap && key in breakpointMap; });
        }
        return false;
    };
    Maple.CACHE = {};
    Maple.variables = {
        breakpoint: MAPLE_VAR_BREAKPOINT,
        color: MAPLE_VAR_COLOR,
        fontFamily: MAPLE_VAR_FONT_FAMILY,
        fontSize: MAPLE_VAR_FONT_SIZE,
        fontWeight: MAPLE_VAR_FONT_WEIGHT,
        maxWidth: MAPLE_VAR_MAX_WIDTH,
        spacer: MAPLE_VAR_SPACER,
        transition: MAPLE_VAR_TRANSITION,
        button: MAPLE_VAR_BUTTON,
        alert: MAPLE_VAR_ALERT,
    };
    Maple.breakpointMap = {};
    Maple.utilClassMap = {};
    Maple.utilPrefixList = [];
    Maple.propExtensionMap = {};
    Maple.rawCache = {};
    Maple.tempCache = {};
    Maple.onStyleAppend$ = new BehaviorSubject(null);
    Maple.onInit$ = new BehaviorSubject(false);
    return Maple;
}());
export { Maple };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290Ijoibmc6Ly9tYXBsZS8iLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRXBFLE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsMEJBQTBCLEdBQzNCLE1BQU0scUJBQXFCLENBQUM7QUFDN0IsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3RELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUNoRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUNoRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUU5RCwrRUFBK0U7QUFDL0UsSUFBTSxVQUFVLEdBQVE7SUFDdEIsS0FBSyxFQUFFLEVBQUU7Q0FDVixDQUFDO0FBQ0YsSUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDO0FBRTFCLElBQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNyQixJQUFNLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFD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QixHQUFRLEVBQUUsQ0FBQztJQUMzQixjQUFRLEdBQVEsRUFBRSxDQUFDO0lBQ25CLGVBQVMsR0FBUSxFQUFFLENBQUM7SUFDckIsb0JBQWMsR0FBeUIsSUFBSSxlQUFlLENBQ3RFLElBQUksQ0FDTCxDQUFDO0lBQ1ksYUFBTyxHQUE2QixJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQWtyQi9FLFlBQUM7Q0FBQSxBQXpzQkQsSUF5c0JDO1NBenNCWSxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBNYXBsZUNvbG9ySGVscGVyIH0gZnJvbSAnLi9oZWxwZXJzL2NvbG9yLmhlbHBlcic7XG5pbXBvcnQgeyBNQVBMRV9QUk9QX0VYVEVOU0lPTl9NQVAgfSBmcm9tICcuL3Byb3BlcnR5LWV4dGVuc2lvbi1tYXAnO1xuaW1wb3J0IHsgTWFwbGVWYXJpYWJsZU1vZGVsIH0gZnJvbSAnLi90eXBlcy92YXJpYWJsZXMubW9kZWwnO1xuaW1wb3J0IHtcbiAgZ2V0TWFwbGVVdGlsaXR5Q2xhc3NNYXAsXG4gIGdldE1hcGxlVXRpbGl0eVZhcmlhYmxlTWFwLFxufSBmcm9tICcuL3V0aWxpdHktY2xhc3MtbWFwJztcbmltcG9ydCB7IE1BUExFX1ZBUl9BTEVSVCB9IGZyb20gJy4vdmFyaWFibGVzL2FsZXJ0JztcbmltcG9ydCB7IE1BUExFX1ZBUl9CUkVBS1BPSU5UIH0gZnJvbSAnLi92YXJpYWJsZXMvYnJlYWtwb2ludCc7XG5pbXBvcnQgeyBNQVBMRV9WQVJfQlVUVE9OIH0gZnJvbSAnLi92YXJpYWJsZXMvYnV0dG9uJztcbmltcG9ydCB7IE1BUExFX1ZBUl9DT0xPUiB9IGZyb20gJy4vdmFyaWFibGVzL2NvbG9yJztcbmltcG9ydCB7IE1BUExFX1ZBUl9GT05UX0ZBTUlMWSB9IGZyb20gJy4vdmFyaWFibGVzL2ZvbnQtZmFtaWx5JztcbmltcG9ydCB7IE1BUExFX1ZBUl9GT05UX1NJWkUgfSBmcm9tICcuL3ZhcmlhYmxlcy9mb250LXNpemUnO1xuaW1wb3J0IHsgTUFQTEVfVkFSX0ZPTlRfV0VJR0hUIH0gZnJvbSAnLi92YXJpYWJsZXMvZm9udC13ZWlnaHQnO1xuaW1wb3J0IHsgTUFQTEVfVkFSX01BWF9XSURUSCB9IGZyb20gJy4vdmFyaWFibGVzL21heC13aWR0aCc7XG5pbXBvcnQgeyBNQVBMRV9WQVJfU1BBQ0VSIH0gZnJvbSAnLi92YXJpYWJsZXMvc3BhY2VyJztcbmltcG9ydCB7IE1BUExFX1ZBUl9UUkFOU0lUSU9OIH0gZnJvbSAnLi92YXJpYWJsZXMvdHJhbnNpdGlvbic7XG5cbi8vIERlZmluZSBhIGdsb2JhbCBNYXBsZS5DQUNIRSB0byBjb2xsZWN0IHNlbGVjdG9ycyBhbmQgbWFwcyBvbiBicmVha3BvaW50IGtleXNcbmNvbnN0IEJSRUFLUE9JTlQ6IGFueSA9IHtcbiAgbWVkaWE6IHt9LFxufTtcbmNvbnN0IFNUWUxFX0VMRU1FTlRTID0ge307XG5cbmNvbnN0IFNUUl9FTVBUWSA9ICcnO1xuY29uc3QgU1RSX1NQQUNFID0gJyAnO1xuY29uc3QgU1RSX0RPVCA9ICcuJztcbmNvbnN0IFNUUl9VUCA9ICd1cCc7XG5jb25zdCBTVFJfRE9XTiA9ICdkb3duJztcbmNvbnN0IFNFUF9NRURJQSA9ICctJztcbmNvbnN0IFNFUF9TRUxFQ1RPUiA9ICc6JztcbmNvbnN0IFNFUF9VVElMX0tFWSA9ICc6JztcbmNvbnN0IFNFUF9VVElMX1ZBTCA9ICc9JztcbmNvbnN0IFNFUF9OT19TUEFDRSA9ICc8JztcbmNvbnN0IFNFUF9PVVRFUl9TUEFDRSA9ICc8PCc7XG5jb25zdCBJTVBPUlRBTlQgPSAnISc7XG5jb25zdCBXSUxEQ0FSRCA9ICcqJztcblxuY29uc3QgUFJFRklYX01BUExFX1BST1AgPSAnXyc7XG5jb25zdCBTVUZGSVhfTUVESUFfVVAgPSBTRVBfTUVESUEgKyBTVFJfVVA7XG5jb25zdCBTVUZGSVhfTUVESUFfRE9XTiA9IFNFUF9NRURJQSArIFNUUl9ET1dOO1xuXG5jb25zdCBSX1NFTEVDVE9SX1JFU0VSVkVEID1cbiAgLyhcXC58XFwrfFxcfnxcXDx8XFw+fFxcW3xcXF18XFwofFxcKXxcXCF8XFw6fFxcLHxcXD18XFx8fFxcJXxcXCN8XFwqfFxcXCJ8XFwvKS9nO1xuY29uc3QgUl9FU0NBUEVfUkVTRVJWRUQgPSAnXFxcXCQxJztcbmNvbnN0IFJfU0VQX05PX1NQQUNFID0gL1xcPC9nO1xuY29uc3QgUl9TRVBfU0VMX1NQQUNFID0gL1xcPlxcPi9nO1xuY29uc3QgUl9TRVBfU0VMX1NQQUNFX0FMTCA9IC8oXFw8fFxcPlxcPikvZztcbmNvbnN0IFJfU0VQX1ZBTF9TUEFDRSA9IC9cXHwvZztcbmNvbnN0IFJfU0VQX1VUSUxfVkFMID0gLz0oPzouKD8hPSkpKyQvO1xuY29uc3QgUl9TRVBfVVRJTF9LRVkgPSAvXFw6KD86Lig/IVxcOikpKyQvO1xuY29uc3QgUl9DVVNUT00gPSAvXFwoKC4qPylcXCkvO1xuY29uc3QgUl9XSUxEQ0FSRCA9IC9cXCovZztcbmNvbnN0IFJfRVhUUkFDVF9DTEFTUyA9IC9jbGFzc1xcPVxcXCIoW1xcc1xcU10rPylcXFwiL2c7XG5jb25zdCBSX1VOSUZJWSA9IC9cXD0oPz1bXi5dKiQpLztcblxubGV0IHByZUluaXRDbGFzc0xpc3QgPSBbXTtcbmxldCBpc01hcGxlRW5hYmxlZCA9IHRydWU7XG5sZXQgZG9jO1xuXG5jb25zdCBlc2MgPSAoc2VsZWN0b3I6IHN0cmluZykgPT5cbiAgc2VsZWN0b3IucmVwbGFjZShSX1NFTEVDVE9SX1JFU0VSVkVELCBSX0VTQ0FQRV9SRVNFUlZFRCk7XG5cbmV4cG9ydCBjbGFzcyBNYXBsZSB7XG4gIHByaXZhdGUgc3RhdGljIENBQ0hFID0ge307XG4gIHByaXZhdGUgc3RhdGljIHZhcmlhYmxlczogTWFwbGVWYXJpYWJsZU1vZGVsID0ge1xuICAgIGJyZWFrcG9pbnQ6IE1BUExFX1ZBUl9CUkVBS1BPSU5ULFxuICAgIGNvbG9yOiBNQVBMRV9WQVJfQ09MT1IsXG4gICAgZm9udEZhbWlseTogTUFQTEVfVkFSX0ZPTlRfRkFNSUxZLFxuICAgIGZvbnRTaXplOiBNQVBMRV9WQVJfRk9OVF9TSVpFLFxuICAgIGZvbnRXZWlnaHQ6IE1BUExFX1ZBUl9GT05UX1dFSUdIVCxcbiAgICBtYXhXaWR0aDogTUFQTEVfVkFSX01BWF9XSURUSCxcbiAgICBzcGFjZXI6IE1BUExFX1ZBUl9TUEFDRVIsXG4gICAgdHJhbnNpdGlvbjogTUFQTEVfVkFSX1RSQU5TSVRJT04sXG4gICAgYnV0dG9uOiBNQVBMRV9WQVJfQlVUVE9OLFxuICAgIGFsZXJ0OiBNQVBMRV9WQVJfQUxFUlQsXG4gIH07XG4gIHByaXZhdGUgc3RhdGljIGJyZWFrcG9pbnRNYXA6IGFueSA9IHt9O1xuICBwcml2YXRlIHN0YXRpYyB1dGlsQ2xhc3NNYXA6IGFueSA9IHt9O1xuICBwcml2YXRlIHN0YXRpYyB1dGlsUHJlZml4TGlzdDogQXJyYXk8YW55PiA9IFtdO1xuICBwcml2YXRlIHN0YXRpYyBwcm9wRXh0ZW5zaW9uTWFwOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmF3Q2FjaGU6IGFueSA9IHt9O1xuICBwcml2YXRlIHN0YXRpYyB0ZW1wQ2FjaGU6IGFueSA9IHt9O1xuICBwdWJsaWMgc3RhdGljIG9uU3R5bGVBcHBlbmQkOiBCZWhhdmlvclN1YmplY3Q8YW55PiA9IG5ldyBCZWhhdmlvclN1YmplY3QoXG4gICAgbnVsbCxcbiAgKTtcbiAgcHVibGljIHN0YXRpYyBvbkluaXQkOiBCZWhhdmlvclN1YmplY3Q8Ym9vbGVhbj4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KGZhbHNlKTtcbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8vIEZpbmQgbWluIGFuZCBtYXggYnJlYWtwb2ludHNcbiAgcHJpdmF0ZSBzdGF0aWMgc2V0TWluQW5kTWF4QnJlYWtwb2ludHMoKTogdm9pZCB7XG4gICAgY29uc3QgYnJlYWtwb2ludEtleXM6IEFycmF5PHN0cmluZz4gPSBPYmplY3Qua2V5cyhNYXBsZS5icmVha3BvaW50TWFwKTtcbiAgICBjb25zdCBicmVha3BvaW50cyA9IGJyZWFrcG9pbnRLZXlzXG4gICAgICAubWFwKChrZXkpID0+ICh7XG4gICAgICAgIGtleSxcbiAgICAgICAgc2l6ZTogcGFyc2VGbG9hdChNYXBsZS5icmVha3BvaW50TWFwW2tleV0pLFxuICAgICAgfSkpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS5zaXplIC0gYi5zaXplKTtcblxuICAgIEJSRUFLUE9JTlQubWluS2V5ID0gYnJlYWtwb2ludHNbMF0ua2V5O1xuICAgIEJSRUFLUE9JTlQubWF4S2V5ID0gYnJlYWtwb2ludHNbYnJlYWtwb2ludHMubGVuZ3RoIC0gMV0ua2V5O1xuICAgIEJSRUFLUE9JTlQubWluTWVkaWEgPSBCUkVBS1BPSU5ULm1pbktleSArIFNVRkZJWF9NRURJQV9VUDtcblxuICAgIGJyZWFrcG9pbnRzLmZvckVhY2goKGJwOiBhbnksIGk6IG51bWJlcikgPT4ge1xuICAgICAgY29uc3QgbmV4dCA9IGJyZWFrcG9pbnRzW2kgKyAxXTtcbiAgICAgIEJSRUFLUE9JTlQubWVkaWFbYnAua2V5ICsgU1VGRklYX01FRElBX1VQXSA9IGJwLnNpemU7XG4gICAgICBpZiAobmV4dCkge1xuICAgICAgICAvLyBVc2VzIDAuMDJweCByYXRoZXIgdGhhbiAwLjAxcHggdG8gd29yayBhcm91bmQgYSBjdXJyZW50IHJvdW5kaW5nIGJ1ZyBpbiBTYWZhcmkuXG4gICAgICAgIC8vIFNlZSBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTc4MjYxXG4gICAgICAgIEJSRUFLUE9JTlQubWVkaWFbYnAua2V5ICsgU1VGRklYX01FRElBX0RPV05dID0gbmV4dC5zaXplIC0gMC4wMjtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlRG9tRWxlbWVudHMoXG4gICAgc3R5bGVFbGVtZW50czogYW55LFxuICAgIHByZWZpeDogc3RyaW5nID0gJ21hcGxlJyxcbiAgICBkb2N1bWVudD86IGFueSxcbiAgKTogdm9pZCB7XG4gICAgLy8gUHJlcGFyZSBzdHlsZSBlbGVtZW50IG9uIGhlYWRcbiAgICBjb25zdCBkb2NIZWFkID0gKGRvY3VtZW50IHx8IGRvYykuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBjb25zdCBicmVha3BvaW50cyA9IE9iamVjdC5rZXlzKEJSRUFLUE9JTlQubWVkaWEpLnNvcnQoXG4gICAgICAoYSwgYikgPT4gQlJFQUtQT0lOVC5tZWRpYVthXSAtIEJSRUFLUE9JTlQubWVkaWFbYl0sXG4gICAgKTtcbiAgICBjb25zdCBicmVha3BvaW50c1VwID0gYnJlYWtwb2ludHMuZmlsdGVyKChrZXkpID0+XG4gICAgICBrZXkuaW5jbHVkZXMoU1VGRklYX01FRElBX1VQKSxcbiAgICApO1xuICAgIGNvbnN0IGJyZWFrcG9pbnRzRG93biA9IGJyZWFrcG9pbnRzLmZpbHRlcigoa2V5KSA9PlxuICAgICAga2V5LmluY2x1ZGVzKFNVRkZJWF9NRURJQV9ET1dOKSxcbiAgICApO1xuXG4gICAgYnJlYWtwb2ludHNVcC5jb25jYXQoYnJlYWtwb2ludHNEb3duLnJldmVyc2UoKSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBjb25zdCBzdHlsZUlkID0gYCR7cHJlZml4fS0ke2tleX1gO1xuICAgICAgY29uc3QgZWwgPSBkb2MuZ2V0RWxlbWVudEJ5SWQoc3R5bGVJZCk7XG4gICAgICBpZiAoISFlbCkge1xuICAgICAgICBkb2NIZWFkLnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgIH1cbiAgICAgIHN0eWxlRWxlbWVudHNba2V5XSA9IChkb2MgYXMgRG9jdW1lbnQpLmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAoc3R5bGVFbGVtZW50c1trZXldIGFzIEhUTUxFbGVtZW50KS5zZXRBdHRyaWJ1dGUoJ2lkJywgc3R5bGVJZCk7XG4gICAgICBkb2NIZWFkLmFwcGVuZENoaWxkKHN0eWxlRWxlbWVudHNba2V5XSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBleHRlbmRQcm9wZXJ0aWVzKCk6IHZvaWQge1xuICAgIE1hcGxlLnV0aWxQcmVmaXhMaXN0LmZvckVhY2goKGRlZjogYW55KSA9PiB7XG4gICAgICBNYXBsZS51dGlsQ2xhc3NNYXBbZGVmLnByZWZpeF0gPSBNYXBsZS51dGlsQ2xhc3NNYXBbZGVmLnByZWZpeF0gfHwge307XG4gICAgICBNYXBsZS51dGlsQ2xhc3NNYXBbZGVmLnByZWZpeF1bV0lMRENBUkRdID0ge307XG4gICAgICBPYmplY3Qua2V5cyhkZWYubWFwKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgTWFwbGUudXRpbENsYXNzTWFwW2RlZi5wcmVmaXhdW2tleV0gPSB7fTtcbiAgICAgICAgZGVmLnByb3BzLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgICAgICBNYXBsZS51dGlsQ2xhc3NNYXBbZGVmLnByZWZpeF1bV0lMRENBUkRdID0ge1xuICAgICAgICAgICAgLi4uTWFwbGUudXRpbENsYXNzTWFwW2RlZi5wcmVmaXhdW1dJTERDQVJEXSxcbiAgICAgICAgICAgIFtwcm9wXTogV0lMRENBUkQsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBNYXBsZS51dGlsQ2xhc3NNYXBbZGVmLnByZWZpeF1ba2V5XVtwcm9wXSA9IGRlZi5tYXBba2V5XTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGdldFNlbGVjdG9ycyhcbiAgICBtZWRpYTogc3RyaW5nID0gU1RSX0VNUFRZLFxuICAgIHNlbEtleTogc3RyaW5nID0gU1RSX0VNUFRZLFxuICAgIHV0aWxLZXk6IHN0cmluZyA9IFNUUl9FTVBUWSxcbiAgICB1dGlsVmFsOiBzdHJpbmcgPSBTVFJfRU1QVFksXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiB2YXJpYWJsZS1uYW1lXG4gICAgX3NlbGVjdG9yOiBzdHJpbmcgPSBTVFJfRU1QVFksXG4gICAgaW1wb3J0YW50OiBib29sZWFuID0gZmFsc2UsXG4gICk6IHN0cmluZyB7XG4gICAgY29uc3QgbWFwbGUgPSBNYXBsZS51dGlsQ2xhc3NNYXBbc2VsS2V5XSB8fCB7fTtcbiAgICBjb25zdCBwYXJlbnRTZWxlY3RvciA9IHNlbEtleS5pbmNsdWRlcyhTRVBfT1VURVJfU1BBQ0UpXG4gICAgICA/IHNlbEtleS5zcGxpdChTRVBfT1VURVJfU1BBQ0UpLnBvcCgpLnNwbGl0KFJfU0VQX1NFTF9TUEFDRV9BTEwpLnNoaWZ0KClcbiAgICAgIDogU1RSX0VNUFRZO1xuXG4gICAgY29uc3QgYmFzZVNlbCA9IFtcbiAgICAgIG1lZGlhIHx8IFNUUl9FTVBUWSxcbiAgICAgIG1hcGxlLl9zZWxlY3RvciA/IFNFUF9TRUxFQ1RPUiA6IFNUUl9FTVBUWSxcbiAgICAgIHNlbEtleSxcbiAgICAgIHV0aWxLZXkgPyBTRVBfVVRJTF9LRVkgOiBTVFJfRU1QVFksXG4gICAgICB1dGlsS2V5LFxuICAgICAgdXRpbFZhbCA/IFNFUF9VVElMX1ZBTCA6IFNUUl9FTVBUWSxcbiAgICBdLmpvaW4oU1RSX0VNUFRZKTtcblxuICAgIHJldHVybiAoKG1hcGxlLl9zZWxlY3RvciB8fCBzZWxLZXkgfHwgJycpICsgX3NlbGVjdG9yKVxuICAgICAgLnNwbGl0KC8sXFxzKi8pXG4gICAgICAubWFwKChzZWxlY3RvcikgPT5cbiAgICAgICAgW1xuICAgICAgICAgIHBhcmVudFNlbGVjdG9yID8gcGFyZW50U2VsZWN0b3IgKyBTVFJfU1BBQ0UgOiBTVFJfRU1QVFksXG4gICAgICAgICAgdXRpbFZhbCA/IFNUUl9ET1QgOiBTVFJfRU1QVFksXG4gICAgICAgICAgdXRpbFZhbCA/IGVzYyhiYXNlU2VsICsgdXRpbFZhbCkgOiBgW2NsYXNzKj1cIiR7YmFzZVNlbH1cIl1gLFxuICAgICAgICAgIHV0aWxWYWwgJiYgaW1wb3J0YW50ID8gZXNjKElNUE9SVEFOVCkgOiBTVFJfRU1QVFksXG4gICAgICAgICAgbWFwbGUuX3NlbGVjdG9yIHx8ICFzZWxLZXkgfHwgc2VsS2V5LmNoYXJBdCgwKSA9PT0gU0VQX05PX1NQQUNFXG4gICAgICAgICAgICA/IFNUUl9FTVBUWVxuICAgICAgICAgICAgOiBTVFJfU1BBQ0UsXG4gICAgICAgICAgc2VsZWN0b3IudHJpbSgpLmNoYXJBdCgwKSA9PT0gU0VQX05PX1NQQUNFID8gU1RSX0VNUFRZIDogU1RSX1NQQUNFLFxuICAgICAgICAgIHNlbGVjdG9yXG4gICAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgICAucmVwbGFjZShTRVBfT1VURVJfU1BBQ0UgKyBwYXJlbnRTZWxlY3RvciwgU1RSX0VNUFRZKVxuICAgICAgICAgICAgLnJlcGxhY2UoUl9TRVBfU0VMX1NQQUNFLCBTVFJfU1BBQ0UpXG4gICAgICAgICAgICAucmVwbGFjZShSX1NFUF9OT19TUEFDRSwgU1RSX0VNUFRZKSxcbiAgICAgICAgXS5qb2luKFNUUl9FTVBUWSksXG4gICAgICApXG4gICAgICAuam9pbignLCcpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgY2FjaGUoXG4gICAgbWVkaWE6IHN0cmluZyxcbiAgICBzZWxlY3Rvcjogc3RyaW5nLFxuICAgIG1hcFRvQmVDYWNoZWQ6IGFueSxcbiAgKTogdm9pZCB7XG4gICAgaWYgKCFtYXBUb0JlQ2FjaGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb3BlcnR5IG1hcCBub3QgZm91bmQgZm9yIHNlbGVjdG9yOiAke3NlbGVjdG9yfWApO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlS2V5ID0gYCR7bWVkaWF9JHtzZWxlY3Rvcn0ke0pTT04uc3RyaW5naWZ5KG1hcFRvQmVDYWNoZWQpfWA7XG4gICAgaWYgKCFNYXBsZS5DQUNIRVtjYWNoZUtleV0pIHtcbiAgICAgIE1hcGxlLnRlbXBDYWNoZVttZWRpYV0gPSBNYXBsZS50ZW1wQ2FjaGVbbWVkaWFdIHx8IHt9O1xuICAgICAgTWFwbGUudGVtcENhY2hlW21lZGlhXSA9IHtcbiAgICAgICAgLi4uTWFwbGUudGVtcENhY2hlW21lZGlhXSxcbiAgICAgICAgW3NlbGVjdG9yXToge1xuICAgICAgICAgIC4uLihNYXBsZS50ZW1wQ2FjaGVbbWVkaWFdW3NlbGVjdG9yXSB8fCB7fSksXG4gICAgICAgICAgLi4ubWFwVG9CZUNhY2hlZCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBNYXBsZS5DQUNIRVtjYWNoZUtleV0gPSAxO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHN0eWxlcyhtZWRpYTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBjYWNoZUl0ZW0gPSBNYXBsZS50ZW1wQ2FjaGVbbWVkaWFdO1xuICAgIGlmICghY2FjaGVJdGVtKSB7XG4gICAgICByZXR1cm4gU1RSX0VNUFRZO1xuICAgIH1cblxuICAgIGNvbnN0IHNlbGVjdG9ycyA9IE9iamVjdC5rZXlzKGNhY2hlSXRlbSk7XG5cbiAgICBpZiAoc2VsZWN0b3JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFNUUl9FTVBUWTtcbiAgICB9XG5cbiAgICBjb25zdCBicmVha3BvaW50UGFydHMgPSBtZWRpYS5zcGxpdChTRVBfTUVESUEpO1xuICAgIGNvbnN0IGJyZWFrcG9pbnREaXIgPSBicmVha3BvaW50UGFydHNbMV07XG4gICAgY29uc3QgbWVkaWFRdWVyeSA9IGJyZWFrcG9pbnREaXIgPT09IFNUUl9VUCA/ICdtaW4td2lkdGgnIDogJ21heC13aWR0aCc7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG5cbiAgICAvLyBvcGVuIG1lZGlhIHF1ZXJ5XG4gICAgaWYgKG1lZGlhICE9PSBCUkVBS1BPSU5ULm1pbk1lZGlhKSB7XG4gICAgICByZXN1bHQucHVzaChgQG1lZGlhICgke21lZGlhUXVlcnl9OiAke0JSRUFLUE9JTlQubWVkaWFbbWVkaWFdfXB4KSB7YCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBzZWxlY3RvcnMpIHtcbiAgICAgIGNvbnN0IHByb3BNYXAgPSBjYWNoZUl0ZW1bc2VsZWN0b3JdO1xuICAgICAgaWYgKCFwcm9wTWFwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcm9wTWFwS2V5cyA9IE9iamVjdC5rZXlzKHByb3BNYXApLmZpbHRlcigocCkgPT4gcCAhPT0gSU1QT1JUQU5UKTtcbiAgICAgIGlmIChwcm9wTWFwS2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIG9wZW4gc2VsZWN0b3JcbiAgICAgIHJlc3VsdC5wdXNoKGAke3NlbGVjdG9yfXtgKTtcblxuICAgICAgLy8gZmlsbCBzZWxlY3RvciB3aXRoIHByb3BlcnRpZXNcbiAgICAgIGZvciAoY29uc3QgcHJvcCBvZiBwcm9wTWFwS2V5cykge1xuICAgICAgICBjb25zdCB2YWwgPSBwcm9wTWFwW3Byb3BdLnRvU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IGltcG9ydGFudCA9XG4gICAgICAgICAgdmFsLmluZGV4T2YoSU1QT1JUQU5UKSA8IDAgJiYgcHJvcE1hcFtJTVBPUlRBTlRdXG4gICAgICAgICAgICA/ICcgIWltcG9ydGFudCdcbiAgICAgICAgICAgIDogU1RSX0VNUFRZO1xuICAgICAgICByZXN1bHQucHVzaChcbiAgICAgICAgICBNYXBsZS5wcm9wRXh0ZW5zaW9uTWFwW3Byb3BdXG4gICAgICAgICAgICA/IE1hcGxlLnByb3BFeHRlbnNpb25NYXBbcHJvcF0odmFsLCBpbXBvcnRhbnQpXG4gICAgICAgICAgICA6IGAke3Byb3B9OiR7dmFsfSR7aW1wb3J0YW50fTtgLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICAvLyBjbG9zZSBzZWxlY3RvclxuICAgICAgcmVzdWx0LnB1c2goYH1gKTtcbiAgICB9XG5cbiAgICAvLyBjbG9zZSBtZWRpYSBxdWVyeVxuICAgIGlmIChtZWRpYSAhPT0gQlJFQUtQT0lOVC5taW5NZWRpYSkge1xuICAgICAgcmVzdWx0LnB1c2goYH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5sZW5ndGggPiAyID8gcmVzdWx0LmpvaW4oU1RSX0VNUFRZKSA6IFNUUl9FTVBUWTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGdlbmVyYXRlV2hpdGVsaXN0KHdoaXRlbGlzdDogQXJyYXk8c3RyaW5nPiA9IFtdKTogdm9pZCB7XG4gICAgY29uc3QgY2xhc3NMaXN0ID0gW107XG4gICAgZm9yIChjb25zdCB1dGlsS2V5IG9mIHdoaXRlbGlzdCkge1xuICAgICAgaWYgKCFNYXBsZS51dGlsQ2xhc3NNYXBbdXRpbEtleV0pIHtcbiAgICAgICAgY2xhc3NMaXN0LnB1c2godXRpbEtleSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKE1hcGxlLnV0aWxDbGFzc01hcFt1dGlsS2V5XSk7XG4gICAgICBmb3IgKGNvbnN0IHV0aWxWYWwgb2YgcHJvcHMpIHtcbiAgICAgICAgaWYgKHV0aWxWYWwuY2hhckF0KDApID09PSBQUkVGSVhfTUFQTEVfUFJPUCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnJlYWtwb2ludHMgPSBPYmplY3Qua2V5cyhNYXBsZS5icmVha3BvaW50TWFwKTtcbiAgICAgICAgZm9yIChjb25zdCBicCBvZiBicmVha3BvaW50cykge1xuICAgICAgICAgIGNvbnN0IG1lZGlhVXAgPSBicCArIFNVRkZJWF9NRURJQV9VUDtcbiAgICAgICAgICBjb25zdCBtZWRpYURvd24gPSBicCArIFNVRkZJWF9NRURJQV9ET1dOO1xuICAgICAgICAgIGNvbnN0IHV0aWxDbGFzcyA9IFNFUF9VVElMX0tFWSArIHV0aWxLZXkgKyBTRVBfVVRJTF9WQUwgKyB1dGlsVmFsO1xuICAgICAgICAgIGlmIChtZWRpYVVwIGluIEJSRUFLUE9JTlQubWVkaWEpIHtcbiAgICAgICAgICAgIGNsYXNzTGlzdC5wdXNoKG1lZGlhVXAgKyB1dGlsQ2xhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWVkaWFEb3duIGluIEJSRUFLUE9JTlQubWVkaWEpIHtcbiAgICAgICAgICAgIGNsYXNzTGlzdC5wdXNoKG1lZGlhRG93biArIHV0aWxDbGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIE1hcGxlLmZseShwcmVJbml0Q2xhc3NMaXN0LmNvbmNhdChjbGFzc0xpc3QpKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHNwbGl0TGFzdE9jY3VycmVuY2Uoc3RyOiBzdHJpbmcsIGtleTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgY29uc3QgcG9zID0gc3RyLmxhc3RJbmRleE9mKGtleSk7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgY29uc3QgZmlyc3RQYXJ0ID0gc3RyLnN1YnN0cmluZygwLCBwb3MpO1xuICAgIGNvbnN0IGxhc3RQYXJ0ID0gc3RyLnN1YnN0cmluZyhwb3MgKyBrZXkubGVuZ3RoKTtcbiAgICBpZiAoZmlyc3RQYXJ0KSB7XG4gICAgICByZXN1bHQucHVzaChmaXJzdFBhcnQpO1xuICAgIH1cbiAgICBpZiAobGFzdFBhcnQpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGxhc3RQYXJ0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHNwbGl0Rmlyc3RPY2N1cnJlbmNlKHN0cjogc3RyaW5nLCBrZXk6IHN0cmluZyk6IEFycmF5PHN0cmluZz4ge1xuICAgIGNvbnN0IHBvcyA9IHN0ci5pbmRleE9mKGtleSk7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgY29uc3QgZmlyc3RQYXJ0ID0gc3RyLnN1YnN0cmluZygwLCBwb3MpO1xuICAgIGNvbnN0IGxhc3RQYXJ0ID0gc3RyLnN1YnN0cmluZyhwb3MgKyBrZXkubGVuZ3RoKTtcbiAgICBpZiAoZmlyc3RQYXJ0KSB7XG4gICAgICByZXN1bHQucHVzaChmaXJzdFBhcnQpO1xuICAgIH1cbiAgICBpZiAobGFzdFBhcnQpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGxhc3RQYXJ0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgaW5pdChcbiAgICBkb2N1bWVudDogYW55LFxuICAgIGVuYWJsZWQ6IGJvb2xlYW4sXG4gICAgdXRpbENsYXNzTWFwOiBhbnkgPSB7fSxcbiAgICB3aGl0ZWxpc3Q6IEFycmF5PHN0cmluZz4sXG4gICAgdmFyaWFibGVzOiBNYXBsZVZhcmlhYmxlTW9kZWwgPSBNYXBsZS52YXJpYWJsZXMsXG4gICAgaXNSdGw6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICB1dGlsUHJlZml4TGlzdDogQXJyYXk8YW55PiA9IFtdLFxuICAgIHByb3BFeHRlbnNpb25NYXA6IGFueSA9IHt9LFxuICApOiB2b2lkIHtcbiAgICBpc01hcGxlRW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgaWYgKGlzTWFwbGVFbmFibGVkID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkb2MgPSBkb2N1bWVudDtcbiAgICBNYXBsZS5DQUNIRSA9IHt9O1xuICAgIE1hcGxlLnZhcmlhYmxlcyA9IHtcbiAgICAgIC4uLk1hcGxlLnZhcmlhYmxlcyxcbiAgICAgIC4uLnZhcmlhYmxlcyxcbiAgICB9O1xuICAgIE1hcGxlQ29sb3JIZWxwZXIuZ2VuZXJhdGVBbHBoYUNvbG9ycyhNYXBsZS52YXJpYWJsZXMuY29sb3IpO1xuICAgIE1hcGxlLnV0aWxDbGFzc01hcCA9IHtcbiAgICAgIC4uLmdldE1hcGxlVXRpbGl0eUNsYXNzTWFwKE1hcGxlLnZhcmlhYmxlcyksXG4gICAgICAuLi51dGlsQ2xhc3NNYXAsXG4gICAgfTtcbiAgICBNYXBsZS51dGlsUHJlZml4TGlzdCA9IFtcbiAgICAgIC4uLmdldE1hcGxlVXRpbGl0eVZhcmlhYmxlTWFwKE1hcGxlLnZhcmlhYmxlcyksXG4gICAgICAuLi51dGlsUHJlZml4TGlzdCxcbiAgICBdO1xuICAgIE1hcGxlLnByb3BFeHRlbnNpb25NYXAgPSB7XG4gICAgICAuLi5NQVBMRV9QUk9QX0VYVEVOU0lPTl9NQVAsXG4gICAgICAuLi5wcm9wRXh0ZW5zaW9uTWFwLFxuICAgIH07XG4gICAgTWFwbGUuYnJlYWtwb2ludE1hcCA9IHtcbiAgICAgIC4uLk1hcGxlLnZhcmlhYmxlcy5icmVha3BvaW50LFxuICAgIH07XG4gICAgTWFwbGUuc2V0TWluQW5kTWF4QnJlYWtwb2ludHMoKTtcbiAgICBNYXBsZS5jcmVhdGVEb21FbGVtZW50cyhTVFlMRV9FTEVNRU5UUyk7XG4gICAgTWFwbGUuZXh0ZW5kUHJvcGVydGllcygpO1xuICAgIE1hcGxlLnV0aWxDbGFzc01hcCA9IE1hcGxlLmNvbnZlcnRVdGlsQ2xhc3NNYXBUb1J0bChcbiAgICAgIE1hcGxlLnV0aWxDbGFzc01hcCxcbiAgICAgIGlzUnRsLFxuICAgICk7XG4gICAgTWFwbGUuZ2VuZXJhdGVXaGl0ZWxpc3Qod2hpdGVsaXN0KTtcbiAgICB0aGlzLm9uSW5pdCQubmV4dCh0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgZmluZEFuZEZseShzdHI6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChpc01hcGxlRW5hYmxlZCA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHN0cikge1xuICAgICAgTWFwbGUuZmx5KFxuICAgICAgICAoc3RyLm1hdGNoKFJfRVhUUkFDVF9DTEFTUykgfHwgW10pXG4gICAgICAgICAgLmpvaW4oJyAnKVxuICAgICAgICAgIC5yZXBsYWNlKC9jbGFzc1xcPVxcXCIvZywgJycpXG4gICAgICAgICAgLnJlcGxhY2UoL1wiL2csICcnKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHN0YXRpYyBjb252ZXJ0VXRpbENsYXNzTWFwVG9SdGwoXG4gICAgdXRpbGl0eUNsYXNzOiBhbnksXG4gICAgaXNSdGw6IGJvb2xlYW4sXG4gICk6IGFueSB7XG4gICAgaWYgKCFpc1J0bCkge1xuICAgICAgcmV0dXJuIHV0aWxpdHlDbGFzcztcbiAgICB9XG4gICAgY29uc3QgZGF0YSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHV0aWxpdHlDbGFzcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHV0aWxpdHlDbGFzc1trZXldO1xuICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUucnRsKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHZhbHVlLnJ0bCkucmVkdWNlKChydGxWYWx1ZSwgcnRsS2V5KSA9PiB7XG4gICAgICAgICAgcnRsVmFsdWVbcnRsS2V5XSA9IHZhbHVlLnJ0bFtydGxLZXldO1xuICAgICAgICB9LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlmIChrZXkuaW5jbHVkZXMoJ2xlZnQnKSkge1xuICAgICAgICAgIGNvbnN0IHJlcGxhY2VkS2V5ID0ga2V5LnJlcGxhY2UoJ2xlZnQnLCAncmlnaHQnKTtcbiAgICAgICAgICBkYXRhW3JlcGxhY2VkS2V5XSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKGtleS5pbmNsdWRlcygncmlnaHQnKSkge1xuICAgICAgICAgIGNvbnN0IHJlcGxhY2VkS2V5ID0ga2V5LnJlcGxhY2UoJ3JpZ2h0JywgJ2xlZnQnKTtcbiAgICAgICAgICBkYXRhW3JlcGxhY2VkS2V5XSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLmluY2x1ZGVzKCdsZWZ0JykpIHtcbiAgICAgICAgICBkYXRhW2tleV0gPSB2YWx1ZS5yZXBsYWNlKCdsZWZ0JywgJ3JpZ2h0Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZS5pbmNsdWRlcygncmlnaHQnKSkge1xuICAgICAgICAgIGRhdGFba2V5XSA9IHZhbHVlLnJlcGxhY2UoJ3JpZ2h0JywgJ2xlZnQnKTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAga2V5ID09PSAndHJhbnNmb3JtJyAmJlxuICAgICAgICAgIHZhbHVlLmluY2x1ZGVzKCd0cmFuc2xhdGUnKSAmJlxuICAgICAgICAgICFbJ1koJywgJ1ooJ10uc29tZSgodCkgPT4gdmFsdWUuaW5jbHVkZXModCkpXG4gICAgICAgICkge1xuICAgICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAuc3BsaXQoJyAnKVxuICAgICAgICAgICAgLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBzcGxpdHRlZFZhbHVlID0gaXRlbS5zcGxpdCgnKCcpO1xuICAgICAgICAgICAgICBzcGxpdHRlZFZhbHVlWzFdID1cbiAgICAgICAgICAgICAgICBzcGxpdHRlZFZhbHVlWzFdICYmIHNwbGl0dGVkVmFsdWVbMV0uc3RhcnRzV2l0aCgnLScpXG4gICAgICAgICAgICAgICAgICA/IHNwbGl0dGVkVmFsdWVbMV0ucmVwbGFjZSgnLScsICcoJylcbiAgICAgICAgICAgICAgICAgIDogc3BsaXR0ZWRWYWx1ZVsxXVxuICAgICAgICAgICAgICAgICAgPyAnKC0nICsgc3BsaXR0ZWRWYWx1ZVsxXVxuICAgICAgICAgICAgICAgICAgOiAnJztcblxuICAgICAgICAgICAgICByZXR1cm4gc3BsaXR0ZWRWYWx1ZVswXSArIHNwbGl0dGVkVmFsdWVbMV07XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZml4ZWRVdGlsaXR5ID0gTWFwbGUuY29udmVydFV0aWxDbGFzc01hcFRvUnRsKFxuICAgICAgICAgIHsgLi4udmFsdWUgfSxcbiAgICAgICAgICBpc1J0bCxcbiAgICAgICAgKTtcbiAgICAgICAgZGF0YVtrZXldID0geyAuLi5maXhlZFV0aWxpdHkgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgZmx5KGNsYXNzTGlzdDogYW55KTogdm9pZCB7XG4gICAgaWYgKGlzTWFwbGVFbmFibGVkID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXByZUluaXRDbGFzc0xpc3QubGVuZ3RoKSB7XG4gICAgICBwcmVJbml0Q2xhc3NMaXN0ID0gcHJlSW5pdENsYXNzTGlzdC5jb25jYXQoY2xhc3NMaXN0KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWNsYXNzTGlzdCB8fCBjbGFzc0xpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmF3Q2FjaGVLZXkgPSBBcnJheS5pc0FycmF5KGNsYXNzTGlzdClcbiAgICAgID8gY2xhc3NMaXN0LmpvaW4oJyAnKVxuICAgICAgOiBjbGFzc0xpc3Q7XG5cbiAgICBpZiAoTWFwbGUucmF3Q2FjaGVbcmF3Q2FjaGVLZXldKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIE1hcGxlLnJhd0NhY2hlW3Jhd0NhY2hlS2V5XSA9IDE7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2xhc3NMaXN0KSA9PT0gZmFsc2UpIHtcbiAgICAgIGNsYXNzTGlzdCA9IGNsYXNzTGlzdC5zcGxpdCgvXFxzKy9nKTtcbiAgICB9XG5cbiAgICBjbGFzc0xpc3QgPSBNYXBsZS51bmlmeVV0aWxpdHlDbGFzcyhjbGFzc0xpc3QpO1xuXG4gICAgTWFwbGUudGVtcENhY2hlID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGNsYXNzSXRlbSBvZiBjbGFzc0xpc3QpIHtcbiAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIHN0eWxlcyB3aWxsIGhhdmUgIWltcG9ydGFudCBmbGFnIG9yIG5vdFxuICAgICAgY29uc3QgaW1wb3J0YW50ID0gY2xhc3NJdGVtLmNoYXJBdChjbGFzc0l0ZW0ubGVuZ3RoIC0gMSkgPT09IElNUE9SVEFOVDtcbiAgICAgIGNvbnN0IGNsYXNzSXRlbVdpdGhvdXRJbXBvcnRhbnQgPSBjbGFzc0l0ZW0ucmVwbGFjZShJTVBPUlRBTlQsIFNUUl9FTVBUWSk7XG5cbiAgICAgIGxldCBwYXJ0cyA9IE1hcGxlLnNwbGl0TGFzdE9jY3VycmVuY2UoXG4gICAgICAgIGNsYXNzSXRlbVdpdGhvdXRJbXBvcnRhbnQsXG4gICAgICAgIFNFUF9VVElMX1ZBTCxcbiAgICAgICk7XG5cbiAgICAgIC8vIEV4dHJhY3QgdXRpbGl0eSB2YWx1ZVxuICAgICAgY29uc3QgdXRpbFZhbCA9IHBhcnRzLmxlbmd0aCA9PT0gMSA/IG51bGwgOiBwYXJ0cy5wb3AoKTtcblxuICAgICAgLy8gRXh0cmFjdCBtZWRpYSBxdWVyeVxuICAgICAgY29uc3QgbWVkaWEgPVxuICAgICAgICBPYmplY3Qua2V5cyhCUkVBS1BPSU5ULm1lZGlhKS5maW5kKFxuICAgICAgICAgIChrZXk6IHN0cmluZykgPT4gY2xhc3NJdGVtLmluZGV4T2Yoa2V5KSA9PT0gMCxcbiAgICAgICAgKSB8fCBCUkVBS1BPSU5ULm1pbk1lZGlhO1xuXG4gICAgICBwYXJ0cyA9IE1hcGxlLnNwbGl0Rmlyc3RPY2N1cnJlbmNlKHBhcnRzLmpvaW4oU1RSX0VNUFRZKSwgbWVkaWEpXG4gICAgICAgIC5qb2luKFNUUl9FTVBUWSlcbiAgICAgICAgLnNwbGl0KFNFUF9VVElMX0tFWSlcbiAgICAgICAgLmZpbHRlcigocDogc3RyaW5nKSA9PiAhIXApO1xuXG4gICAgICAvLyBFeGFjdCB1dGlsaXR5IGNsYXNzXG4gICAgICBjb25zdCB1dGlsS2V5ID0gcGFydHMubGVuZ3RoID49IDEgPyBwYXJ0cy5wb3AoKSA6IG51bGw7XG5cbiAgICAgIC8vIEV4dHJhY3Qgc2VsZWN0b3JcbiAgICAgIGNvbnN0IHNlbEtleSA9IHBhcnRzLmpvaW4oU0VQX1VUSUxfS0VZKTtcblxuICAgICAgLy8gR2V0IHN0eWxlIG1hcFxuICAgICAgY29uc3QgbWFwbGUgPSBNYXBsZS51dGlsQ2xhc3NNYXBbdXRpbEtleV07XG5cbiAgICAgIC8vIFdpdGhvdXQgYSBzdHlsZSBtYXAgd2UgY2FuJ3QgY3JlYXRlIHN0eWxlc1xuICAgICAgaWYgKCFtYXBsZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FjaGUgZGVmYXVsdCBzdHlsZXMgd2l0aCBzZWxlY3RvclxuICAgICAgaWYgKG1hcGxlLl9kZWZhdWx0KSB7XG4gICAgICAgIE9iamVjdC5rZXlzKG1hcGxlLl9kZWZhdWx0KS5mb3JFYWNoKChtZWRpYUl0ZW0pID0+IHtcbiAgICAgICAgICBNYXBsZS5jYWNoZShcbiAgICAgICAgICAgIG1lZGlhSXRlbSxcbiAgICAgICAgICAgIE1hcGxlLmdldFNlbGVjdG9ycyhcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgc2VsS2V5LFxuICAgICAgICAgICAgICB1dGlsS2V5LFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBtYXBsZS5fc2VsZWN0b3IsXG4gICAgICAgICAgICAgIGltcG9ydGFudCxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIC4uLm1hcGxlLl9jb21tb24sXG4gICAgICAgICAgICAgIC4uLm1hcGxlW21hcGxlLl9kZWZhdWx0W21lZGlhSXRlbV1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FjaGUgdXRpbGl0eSBzdHlsZXMgd2l0aCBzZWxlY3RvclxuICAgICAgaWYgKHV0aWxWYWwpIHtcbiAgICAgICAgY29uc3QgYyA9IGNsYXNzSXRlbS5yZXBsYWNlKElNUE9SVEFOVCwgU1RSX0VNUFRZKTtcbiAgICAgICAgY29uc3QgdWNtID0gTWFwbGUudXRpbENsYXNzTWFwO1xuXG4gICAgICAgIC8vI3JlZ2lvbiBXaWxkY2FyZCBzZWxlY3RvcnNcbiAgICAgICAgLy8gKjp1dGlsLWtleVxuICAgICAgICAvLyAqOnV0aWwta2V5PXV0aWwtdmFsXG4gICAgICAgIC8vICouc2VsZWN0b3I6dXRpbC1rZXk9dXRpbC12YWxcbiAgICAgICAgLy8gKjpzZWxlY3Rvci1rZXk6dXRpbC1rZXk9dXRpbC12YWxcbiAgICAgICAgY29uc3Qgd2NNZWRpYSA9IGMucmVwbGFjZShtZWRpYSwgV0lMRENBUkQpO1xuXG4gICAgICAgIC8vIG1lZGlhOipcbiAgICAgICAgLy8gbWVkaWEuc2VsZWN0b3I6KlxuICAgICAgICAvLyBtZWRpYTpzZWxlY3Rvci1rZXk6KlxuICAgICAgICBjb25zdCB3Y3V0aWxLZXkgPSBjLnJlcGxhY2UoUl9TRVBfVVRJTF9LRVksIGA6JHtXSUxEQ0FSRH1gKTtcblxuICAgICAgICAvLyBtZWRpYTp1dGlsLWtleT0qXG4gICAgICAgIC8vIG1lZGlhLnNlbGVjdG9yOnV0aWwta2V5PSpcbiAgICAgICAgLy8gbWVkaWE6c2VsZWN0b3Ita2V5OnV0aWwta2V5PSpcbiAgICAgICAgY29uc3Qgd2N1dGlsVmFsID0gYy5yZXBsYWNlKFJfU0VQX1VUSUxfVkFMLCBgPSR7V0lMRENBUkR9YCk7XG5cbiAgICAgICAgLy8gKjoqXG4gICAgICAgIC8vICouc2VsZWN0b3I6KlxuICAgICAgICAvLyAqOnNlbGVjdG9yLWtleToqXG4gICAgICAgIGNvbnN0IHdjTWVkaWFLZXkgPSB3Y01lZGlhLnJlcGxhY2UoUl9TRVBfVVRJTF9LRVksIGA6JHtXSUxEQ0FSRH1gKTtcblxuICAgICAgICAvLyAqOnV0aWwta2V5PSpcbiAgICAgICAgLy8gKi5zZWxlY3Rvcjp1dGlsLWtleT0qXG4gICAgICAgIC8vICo6c2VsZWN0b3Ita2V5OnV0aWwta2V5PSpcbiAgICAgICAgY29uc3Qgd2NNZWRpYVZhbCA9IHdjdXRpbFZhbC5yZXBsYWNlKG1lZGlhLCBXSUxEQ0FSRCk7XG4gICAgICAgIC8vI2VuZHJlZ2lvblxuXG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0gTWFwbGUuZ2V0U2VsZWN0b3JzKFxuICAgICAgICAgIG1lZGlhLFxuICAgICAgICAgIHNlbEtleSxcbiAgICAgICAgICB1dGlsS2V5LFxuICAgICAgICAgIHV0aWxWYWwsXG4gICAgICAgICAgbWFwbGUuX3NlbGVjdG9yLFxuICAgICAgICAgIGltcG9ydGFudCxcbiAgICAgICAgKTtcblxuICAgICAgICBNYXBsZS5jYWNoZShtZWRpYSwgc2VsZWN0b3IsIHtcbiAgICAgICAgICAuLi5tYXBsZS5fY29tbW9uLFxuICAgICAgICAgIC4uLm1hcGxlW3V0aWxWYWxdLFxuICAgICAgICAgIC4uLkpTT04ucGFyc2UoXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgICAgbWFwbGVbdXRpbFZhbC5yZXBsYWNlKFJfQ1VTVE9NLCBXSUxEQ0FSRCldIHx8IHt9LFxuICAgICAgICAgICAgKS5yZXBsYWNlKFxuICAgICAgICAgICAgICBSX1dJTERDQVJELFxuICAgICAgICAgICAgICB1dGlsS2V5ID09PSAnY29udGVudCdcbiAgICAgICAgICAgICAgICA/IHV0aWxWYWwucmVwbGFjZShSX0NVU1RPTSwgJyQxJylcbiAgICAgICAgICAgICAgICA6IHV0aWxWYWwucmVwbGFjZShSX0NVU1RPTSwgJyQxJykucmVwbGFjZShSX1NFUF9WQUxfU1BBQ0UsICcgJyksXG4gICAgICAgICAgICApLFxuICAgICAgICAgICksXG4gICAgICAgICAgLi4uKHVjbVt3Y01lZGlhS2V5XSB8fCB7fSksXG4gICAgICAgICAgLi4uKHVjbVt3Y3V0aWxLZXldIHx8IHt9KSxcbiAgICAgICAgICAuLi4odWNtW3djTWVkaWFWYWxdIHx8IHt9KSxcbiAgICAgICAgICAuLi4odWNtW3djdXRpbFZhbF0gfHwge30pLFxuICAgICAgICAgIC4uLih1Y21bd2NNZWRpYV0gfHwge30pLFxuICAgICAgICAgIC4uLih1Y21bY10gfHwge30pLFxuICAgICAgICAgIFtJTVBPUlRBTlRdOiBpbXBvcnRhbnQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vI3JlZ2lvbiBHZW5lcmF0ZSBzdHlsZXNcbiAgICAvLyBHZW5lcmF0ZSBtaW4gbWVkaWEgcXVlcnkgc3R5bGVzXG4gICAgY29uc3QgbWluTWVkaWFTdHlsZXMgPSBNYXBsZS5zdHlsZXMoQlJFQUtQT0lOVC5taW5NZWRpYSk7XG4gICAgaWYgKG1pbk1lZGlhU3R5bGVzKSB7XG4gICAgICBNYXBsZS5hcHBlbmRTdHlsZShcbiAgICAgICAgU1RZTEVfRUxFTUVOVFMsXG4gICAgICAgIEJSRUFLUE9JTlQubWluTWVkaWEsXG4gICAgICAgIG1pbk1lZGlhU3R5bGVzLFxuICAgICAgICBmYWxzZSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgbWVkaWEgcXVlcnkgc3R5bGVzXG4gICAgY29uc3QgbWVkaWFRdWVyeVN0eWxlcyA9IHt9O1xuICAgIE9iamVjdC5rZXlzKE1hcGxlLnRlbXBDYWNoZSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAoa2V5ICE9PSBCUkVBS1BPSU5ULm1pbk1lZGlhKSB7XG4gICAgICAgIG1lZGlhUXVlcnlTdHlsZXNba2V5XSA9IG1lZGlhUXVlcnlTdHlsZXNba2V5XSB8fCAnJztcbiAgICAgICAgbWVkaWFRdWVyeVN0eWxlc1trZXldICs9IE1hcGxlLnN0eWxlcyhrZXkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIE9iamVjdC5rZXlzKG1lZGlhUXVlcnlTdHlsZXMpLmZvckVhY2goKGtleSkgPT5cbiAgICAgIE1hcGxlLmFwcGVuZFN0eWxlKFNUWUxFX0VMRU1FTlRTLCBrZXksIG1lZGlhUXVlcnlTdHlsZXNba2V5XSwgZmFsc2UpLFxuICAgICk7XG4gICAgLy8jZW5kcmVnaW9uXG4gIH1cblxuICBwdWJsaWMgc3RhdGljIHVuaWZ5VXRpbGl0eUNsYXNzKGNsYXNzTGlzdDogQXJyYXk8c3RyaW5nPik6IEFycmF5PHN0cmluZz4ge1xuICAgIHJldHVybiBjbGFzc0xpc3QucmVkdWNlKChhY2MsIGNsYXNzSXRlbSkgPT4ge1xuICAgICAgY29uc3QgZXhpc3RpbmdTdHlsZUluZGV4ID0gYWNjLmZpbmRJbmRleChcbiAgICAgICAgKHApID0+XG4gICAgICAgICAgKChwIHx8ICcnKS5zcGxpdChSX1VOSUZJWSkgfHwgW10pWzBdID09PVxuICAgICAgICAgICgoY2xhc3NJdGVtIHx8ICcnKS5zcGxpdChSX1VOSUZJWSkgfHwgW10pWzBdLFxuICAgICAgKTtcbiAgICAgIGlmIChleGlzdGluZ1N0eWxlSW5kZXggPCAwKSB7XG4gICAgICAgIGFjYy5wdXNoKGNsYXNzSXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY2NbZXhpc3RpbmdTdHlsZUluZGV4XSA9IGNsYXNzSXRlbTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgW10pO1xuICB9XG5cbiAgcHVibGljIHN0YXRpYyBhcHBlbmRTdHlsZShcbiAgICBzdHlsZUVsZW1lbnRzOiBhbnksXG4gICAgYnA6IHN0cmluZyxcbiAgICBzdHlsZTogc3RyaW5nLFxuICAgIHNpbGVudDogYm9vbGVhbiA9IHRydWUsXG4gICk6IHZvaWQge1xuICAgIHN0eWxlRWxlbWVudHNbYnBdLmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZShzdHlsZSkpO1xuXG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIE1hcGxlLm9uU3R5bGVBcHBlbmQkLm5leHQoeyBicCwgc3R5bGUgfSk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHN0YXRpYyBpc01lZGlhVmFsaWQobWVkaWE6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBtZWRpYSBpbiBCUkVBS1BPSU5ULm1lZGlhO1xuICB9XG5cbiAgcHVibGljIHN0YXRpYyBpc0JyZWFrcG9pbnRWYWxpZChicmVha3BvaW50OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYnJlYWtwb2ludCBpbiBNYXBsZS5icmVha3BvaW50TWFwO1xuICB9XG5cbiAgcHVibGljIHN0YXRpYyBpc01lZGlhTWF0Y2hlc1dpdGhCcmVha3BvaW50KFxuICAgIG1lZGlhOiBzdHJpbmcsXG4gICAgYnJlYWtwb2ludDogc3RyaW5nLFxuICApOiBib29sZWFuIHtcbiAgICBpZiAoIU1hcGxlLmlzQnJlYWtwb2ludFZhbGlkKGJyZWFrcG9pbnQpIHx8ICFNYXBsZS5pc01lZGlhVmFsaWQobWVkaWEpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbWVkaWFTaXplID0gQlJFQUtQT0lOVC5tZWRpYVttZWRpYV07XG4gICAgY29uc3QgYnJlYWtwb2ludFNpemUgPSBwYXJzZUZsb2F0KE1hcGxlLmJyZWFrcG9pbnRNYXBbYnJlYWtwb2ludF0pO1xuXG4gICAgaWYgKG1lZGlhLmluY2x1ZGVzKFNVRkZJWF9NRURJQV9ET1dOKSkge1xuICAgICAgcmV0dXJuIGJyZWFrcG9pbnRTaXplIDw9IG1lZGlhU2l6ZTtcbiAgICB9XG5cbiAgICBpZiAobWVkaWEuaW5jbHVkZXMoU1VGRklYX01FRElBX1VQKSkge1xuICAgICAgcmV0dXJuIGJyZWFrcG9pbnRTaXplID49IG1lZGlhU2l6ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldFZhbGlkTWVkaWFNYXAoKTogYW55IHtcbiAgICByZXR1cm4geyAuLi5CUkVBS1BPSU5ULm1lZGlhIH07XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldE1pbk1lZGlhKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEJSRUFLUE9JTlQubWluTWVkaWE7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldE1pbkJyZWFrcG9pbnQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQlJFQUtQT0lOVC5taW5LZXk7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldE1hcHBlZE1lZGlhT3JNaW4obWVkaWE6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIE1hcGxlLmlzTWVkaWFWYWxpZChtZWRpYSkgPyBtZWRpYSA6IE1hcGxlLmdldE1pbk1lZGlhKCk7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldE1hcHBlZE1lZGlhT3JOdWxsKG1lZGlhOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBNYXBsZS5pc01lZGlhVmFsaWQobWVkaWEpID8gbWVkaWEgOiBudWxsO1xuICB9XG5cbiAgcHVibGljIHN0YXRpYyBnZXRNYXBwZWRCcmVha3BvaW50T3JNaW4oYnJlYWtwb2ludDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gTWFwbGUuaXNCcmVha3BvaW50VmFsaWQoYnJlYWtwb2ludClcbiAgICAgID8gYnJlYWtwb2ludFxuICAgICAgOiBNYXBsZS5nZXRNaW5CcmVha3BvaW50KCk7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldE1hcHBlZEJyZWFrcG9pbnRPck51bGwoYnJlYWtwb2ludDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gTWFwbGUuaXNCcmVha3BvaW50VmFsaWQoYnJlYWtwb2ludCkgPyBicmVha3BvaW50IDogbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgZ2V0VmFyaWFibGVzKCk6IE1hcGxlVmFyaWFibGVNb2RlbCB7XG4gICAgcmV0dXJuIHsgLi4uTWFwbGUudmFyaWFibGVzIH07XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGZpbGxJblRoZUdhcHMoYnJlYWtwb2ludE1hcDogYW55KTogYW55IHtcbiAgICBjb25zdCBmdWxsQnJlYWtwb2ludE1hcCA9IE1hcGxlLmdldFZhcmlhYmxlcygpLmJyZWFrcG9pbnQ7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGZ1bGxCcmVha3BvaW50TWFwKTtcbiAgICBjb25zdCBtaW5LZXkgPSBrZXlzLmZpbmQoKGtleSkgPT4ga2V5IGluIGJyZWFrcG9pbnRNYXApO1xuICAgIHJldHVybiBrZXlzXG4gICAgICAuc29ydCgoYSwgYikgPT4gZnVsbEJyZWFrcG9pbnRNYXBbYV0gLSBmdWxsQnJlYWtwb2ludE1hcFtiXSlcbiAgICAgIC5yZWR1Y2UoKGFjYywga2V5LCBpKSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHRLZXkgPSBrZXlzW2kgKyAxXTtcbiAgICAgICAgaWYgKGtleSBpbiBhY2MgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYWNjID0ge1xuICAgICAgICAgICAgLi4uYWNjLFxuICAgICAgICAgICAgW2tleV06XG4gICAgICAgICAgICAgIGtleSBpbiBicmVha3BvaW50TWFwID8gYnJlYWtwb2ludE1hcFtrZXldIDogYnJlYWtwb2ludE1hcFttaW5LZXldLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRLZXkgJiYgIWJyZWFrcG9pbnRNYXBbbmV4dEtleV0pIHtcbiAgICAgICAgICBhY2MgPSB7XG4gICAgICAgICAgICAuLi5hY2MsXG4gICAgICAgICAgICBbbmV4dEtleV06IGFjY1trZXldLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sIHt9KTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgaXNCcmVha3BvaW50TWFwKGJyZWFrcG9pbnRNYXA6IGFueSk6IGFueSB7XG4gICAgaWYgKHR5cGVvZiBicmVha3BvaW50TWFwID09PSAnb2JqZWN0JyAmJiBicmVha3BvaW50TWFwICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmtleXMoTWFwbGUuZ2V0VmFyaWFibGVzKCkuYnJlYWtwb2ludCkuc29tZShcbiAgICAgICAgKGtleSkgPT4gYnJlYWtwb2ludE1hcCAmJiBrZXkgaW4gYnJlYWtwb2ludE1hcCxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl19