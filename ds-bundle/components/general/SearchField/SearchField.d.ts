import * as React from 'react';

/**
 * SearchField — from @okradesu/ui@1.0.0.
 */
export interface SearchFieldProps {
  /** Specifies whether fonts should scale to respect Text Size accessibility settings. The default is `true`. */
  allowFontScaling?: boolean;
  /** Can tell TextInput to automatically capitalize certain characters. characters: all characters, words: first letter of ea */
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Specifies autocomplete hints for the system, so it can provide autofill. On Android, the system will always attempt to o */
  autoComplete?: unknown;
  /** If false, disables auto-correct. The default value is true. */
  autoCorrect?: boolean;
  /** If true, focuses the input on componentDidMount. The default value is false. */
  autoFocus?: boolean;
  /** If `true`, the text field will blur when submitted. The default value is true for single-line fields and false for multi */
  blurOnSubmit?: boolean;
  /** When the return key is pressed, For single line inputs: - `'newline`' defaults to `'blurAndSubmit'` - `undefined` defaul */
  submitBehavior?: "submit" | "blurAndSubmit" | "newline";
  /** If true, caret is hidden. The default value is false. */
  caretHidden?: boolean;
  /** If true, context menu is hidden. The default value is false. */
  contextMenuHidden?: boolean;
  /** Provides an initial value that will change when the user starts typing. Useful for simple use-cases where you don't want */
  defaultValue?: string;
  /** If false, text is not editable. The default value is true. */
  editable?: boolean;
  /** enum("default", 'numeric', 'email-address', "ascii-capable", 'numbers-and-punctuation', 'url', 'number-pad', 'phone-pad' */
  keyboardType?: "url" | "default" | "number-pad" | "decimal-pad" | "numeric" | "email-address" | "phone-pad" | "visible-password" | "ascii-capable" | "numbers-and-punctuation" | "name-phone-pad" | "twitter" | "web-search";
  /** Works like the inputmode attribute in HTML, it determines which keyboard to open, e.g. numeric and has precedence over k */
  inputMode?: "none" | "email" | "tel" | "url" | "numeric" | "text" | "decimal" | "search";
  /** Limits the maximum number of characters that can be entered. Use this instead of implementing the logic in JS to avoid f */
  maxLength?: number;
  /** If true, the text input can be multiple lines. The default value is false. */
  multiline?: boolean;
  /** The string that will be rendered before text input has been entered */
  placeholder?: string;
  /** The text color of the placeholder string */
  placeholderTextColor?: string | OpaqueColorValue;
  /** If `true`, text is not editable. The default value is `false`. */
  readOnly?: boolean;
  /** enum('default', 'go', 'google', 'join', 'next', 'route', 'search', 'send', 'yahoo', 'done', 'emergency-call') Determines */
  returnKeyType?: "none" | "default" | "search" | "done" | "go" | "next" | "send" | "previous" | "google" | "join" | "route" | "yahoo" | "emergency-call";
  /** Determines what text should be shown to the return key on virtual keyboards. Has precedence over the returnKeyType prop. */
  enterKeyHint?: "search" | "done" | "go" | "next" | "send" | "previous" | "enter";
  /** If true, the text input obscures the text entered so that sensitive text like passwords stay secure. The default value i */
  secureTextEntry?: boolean;
  /** If true, all text will automatically be selected on focus */
  selectTextOnFocus?: boolean;
  /** The start and end of the text input's selection. Set start and end to the same value to position the cursor. */
  selection?: { start: number; end?: number | undefined; };
  /** The highlight (and cursor on ios) color of the text input */
  selectionColor?: string | OpaqueColorValue;
  /** Align the input text to the left, center, or right sides of the input field. */
  textAlign?: "left" | "center" | "right";
  /** Used to locate this view in end-to-end tests */
  testID?: string;
  /** Used to connect to an InputAccessoryView. Not part of react-natives documentation, but present in examples and code. See */
  inputAccessoryViewID?: string;
  /** An optional label that overrides the default input accessory view button label. */
  inputAccessoryViewButtonLabel?: string;
  /** The value to show for the text input. TextInput is a controlled component, which means the native value will be forced t */
  value?: string;
  /** Specifies largest possible scale a font can reach when allowFontScaling is enabled. Possible values: - null/undefined (d */
  maxFontSizeMultiplier?: number;
  children?: React.ReactNode;
  /** This defines how far a touch event can start away from the view. Typical interface guidelines recommend touch targets th */
  hitSlop?: number | Insets;
  /** Used to reference react managed views from native code. */
  id?: string;
  /** Whether this view needs to rendered offscreen and composited with an alpha in order to preserve 100% correct colors and  */
  needsOffscreenAlphaCompositing?: boolean;
  /** In the absence of auto property, none is much like CSS's none value. box-none is as if you had applied the CSS class: .b */
  pointerEvents?: "none" | "box-none" | "box-only" | "auto";
  /** This is a special performance property exposed by RCTView and is useful for scrolling content when there are many subvie */
  removeClippedSubviews?: boolean;
  /** Used to reference react managed views from native code. */
  nativeID?: string;
  /** Views that are only used to layout their children or otherwise don't draw anything may be automatically removed from the */
  collapsable?: boolean;
  /** Setting to false prevents direct children of the view from being removed from the native view hierarchy, similar to the  */
  collapsableChildren?: boolean;
  /** Whether this view should render itself (and all of its children) into a single hardware texture on the GPU. On Android,  */
  renderToHardwareTextureAndroid?: boolean;
  /** Whether this `View` should be focusable with a non-touch input device, eg. receive focus with a hardware keyboard. */
  focusable?: boolean;
  /** Indicates whether this `View` should be focusable with a non-touch input device, eg. receive focus with a hardware keybo */
  tabIndex?: 0 | -1;
  /** Whether this view should be rendered as a bitmap before compositing. On iOS, this is useful for animations and interacti */
  shouldRasterizeIOS?: boolean;
  /** *(Apple TV only)* When set to true, this view will be focusable and navigable using the Apple TV remote. */
  isTVSelectable?: boolean;
  /** *(Apple TV only)* May be set to true to force the Apple TV focus engine to move focus to this view. */
  hasTVPreferredFocus?: boolean;
  /** *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of  */
  tvParallaxShiftDistanceX?: number;
  /** *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of  */
  tvParallaxShiftDistanceY?: number;
  /** *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of  */
  tvParallaxTiltAngle?: number;
  /** *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of  */
  tvParallaxMagnification?: number;
  /** When true, indicates that the view is an accessibility element. By default, all the touchable elements are accessible. */
  accessible?: boolean;
  /** Provides an array of custom actions available for accessibility. */
  accessibilityActions?: readonly Readonly<{ name: AccessibilityActionName | string; label?: string | undefined; }>[];
  /** Overrides the text that's read by the screen reader when the user interacts with the element. By default, the label is c */
  accessibilityLabel?: string;
  /** Accessibility Role tells a person using either VoiceOver on iOS or TalkBack on Android the type of element that is focus */
  accessibilityRole?: "none" | "text" | "search" | "button" | "togglebutton" | "link" | "image" | "keyboardkey" | "adjustable" | "imagebutton" | "header" | "summary" | "alert" | "checkbox" | "combobox" | "menu" | (string & {}) /* +14 more */;
  /** Accessibility State tells a person using either VoiceOver on iOS or TalkBack on Android the state of the element current */
  accessibilityState?: AccessibilityState;
  /** An accessibility hint helps users understand what will happen when they perform an action on the accessibility element w */
  accessibilityHint?: string;
  /** Represents the current value of a component. It can be a textual description of a component's value, or for range-based  */
  accessibilityValue?: AccessibilityValue;
  /** [Android] Controlling if a view fires accessibility events and if it is reported to accessibility services. */
  importantForAccessibility?: "auto" | "yes" | "no" | "no-hide-descendants";
  /** Indicates to accessibility services to treat UI component like a specific role. */
  role?: "none" | "button" | "link" | "summary" | "alert" | "checkbox" | "combobox" | "menu" | "menubar" | "menuitem" | "progressbar" | "radio" | "radiogroup" | "scrollbar" | "spinbutton" | "switch" | (string & {}) /* +49 more */;
  /** Identifies the element that labels the element it is applied to. When the assistive technology focuses on the component  */
  accessibilityLabelledBy?: string | string[];
  /** Indicates to accessibility services whether the user should be notified when this view changes. Works for Android API >= */
  accessibilityLiveRegion?: "none" | "polite" | "assertive";
  /** Enables the view to be screen reader focusable, not keyboard focusable. */
  screenReaderFocusable?: boolean;
  /** A Boolean value indicating whether the accessibility elements contained within this accessibility element are hidden to  */
  accessibilityElementsHidden?: boolean;
  /** A Boolean value indicating whether VoiceOver should ignore the elements within views that are siblings of the receiver. */
  accessibilityViewIsModal?: boolean;
  /** https://reactnative.dev/docs/accessibility#accessibilityignoresinvertcolorsios */
  accessibilityIgnoresInvertColors?: boolean;
  /** By using the accessibilityLanguage property, the screen reader will understand which language to use while reading the e */
  accessibilityLanguage?: string;
  /** A Boolean value that indicates whether or not to show the item in the large content viewer. Available on iOS 13.0+ https */
  accessibilityShowsLargeContentViewer?: boolean;
  /** When `accessibilityShowsLargeContentViewer` is set, this string will be used as title for the large content viewer. http */
  accessibilityLargeContentTitle?: string;
  /** Blocks the user from interacting with the component through keyboard while still allowing screen reader to interact with */
  accessibilityRespondsToUserInteraction?: boolean;
  /** If true, the keyboard shortcuts (undo/redo and copy buttons) are disabled. The default value is false. */
  disableKeyboardShortcuts?: boolean;
  /** enum('never', 'while-editing', 'unless-editing', 'always') When the clear button should appear on the right side of the  */
  clearButtonMode?: "never" | "while-editing" | "unless-editing" | "always";
  /** If true, clears the text field automatically when editing begins */
  clearTextOnFocus?: boolean;
  /** Determines the types of data converted to clickable URLs in the text input. Only valid if `multiline={true}` and `editab */
  dataDetectorTypes?: "none" | "link" | "phoneNumber" | "address" | "calendarEvent" | "trackingNumber" | "flightNumber" | "lookupSuggestion" | "all" | DataDetectorTypes[];
  /** If true, the keyboard disables the return key when there is no text and automatically enables it when there is text. The */
  enablesReturnKeyAutomatically?: boolean;
  /** Determines the color of the keyboard. */
  keyboardAppearance?: "default" | "light" | "dark";
  /** Provide rules for your password. For example, say you want to require a password with at least eight characters consisti */
  passwordRules?: string;
  /** If `true`, allows TextInput to pass touch events to the parent component. This allows components to be swipeable from th */
  rejectResponderTermination?: boolean;
  /** See DocumentSelectionState.js, some state that is responsible for maintaining selection information for a document */
  selectionState?: DocumentSelectionState;
  /** If false, disables spell-check style (i.e. red underlines). The default value is inherited from autoCorrect */
  spellCheck?: boolean;
  /** Give the keyboard and the system information about the expected semantic meaning for the content that users enter. To di */
  textContentType?: unknown;
  /** If false, scrolling of the text view will be disabled. The default value is true. Only works with multiline={true} */
  scrollEnabled?: boolean;
  /** Set line break strategy on iOS. */
  lineBreakStrategyIOS?: "none" | "standard" | "hangul-word" | "push-out";
  /** Set line break mode on iOS. */
  lineBreakModeIOS?: "wordWrapping" | "char" | "clip" | "head" | "middle" | "tail";
  /** If `false`, the iOS system will not insert an extra space after a paste operation neither delete one or two spaces after */
  smartInsertDelete?: boolean;
  /** When provided it will set the color of the cursor (or "caret") in the component. Unlike the behavior of `selectionColor` */
  cursorColor?: string | OpaqueColorValue;
  /** When provided it will set the color of the selection handles when highlighting text. Unlike the behavior of `selectionCo */
  selectionHandleColor?: string | OpaqueColorValue;
  /** Determines whether the individual fields in your app should be included in a view structure for autofill purposes on And */
  importantForAutofill?: "auto" | "yes" | "no" | "noExcludeDescendants" | "yesExcludeDescendants";
  /** When false, if there is a small amount of space available around a text input (e.g. landscape orientation on a phone), t */
  disableFullscreenUI?: boolean;
  /** If defined, the provided image resource will be rendered on the left. */
  inlineImageLeft?: string;
  /** Padding between the inline image, if any, and the text input itself. */
  inlineImagePadding?: number;
  /** Sets the number of lines for a TextInput. Use it with multiline set to true to be able to fill the lines. */
  numberOfLines?: number;
  /** Sets the return key to the label. Use it instead of `returnKeyType`. */
  returnKeyLabel?: string;
  /** Set text break strategy on Android API Level 23+, possible values are simple, highQuality, balanced The default value is */
  textBreakStrategy?: "simple" | "highQuality" | "balanced";
  /** The color of the textInput underline. */
  underlineColorAndroid?: string | OpaqueColorValue;
  /** Vertically align text when `multiline` is set to true */
  textAlignVertical?: "center" | "auto" | "top" | "bottom";
  /** When false, it will prevent the soft keyboard from showing when the field is focused. The default value is true */
  showSoftInputOnFocus?: boolean;
  /** Vertically align text when `multiline` is set to true */
  verticalAlign?: "auto" | "middle" | "top" | "bottom";
  icon: LucideIcon;
  trailingIcon?: LucideIcon;
  label: string;
}

export declare const SearchField: React.ComponentType<SearchFieldProps>;
