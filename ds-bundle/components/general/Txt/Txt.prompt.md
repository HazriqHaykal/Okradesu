Txt from @okradesu/ui. Use via `window.Okradesu.Txt` (bundle loaded from the root `_ds_bundle.js`).

Anton for screen titles only; Manrope for everything else.

## Props

```ts
interface TxtProps {
  /** Specifies whether fonts should scale to respect Text Size accessibility settings. The default is `true`. */
  allowFontScaling?: boolean;
  children?: React.ReactNode;
  /** This can be one of the following values: - `head` - The line is displayed so that the end fits in the container and the  */
  ellipsizeMode?: "clip" | "head" | "middle" | "tail";
  /** Used to reference react managed views from native code. */
  id?: string;
  /** Line Break mode. Works only with numberOfLines. clip is working only for iOS */
  lineBreakMode?: "clip" | "head" | "middle" | "tail";
  /** Used to truncate the text with an ellipsis after computing the text layout, including line wrapping, such that the total */
  numberOfLines?: number;
  style?: false | "" | TextStyle | RecursiveArray<Falsy | TextStyle>;
  /** Used to locate this view in end-to-end tests. */
  testID?: string;
  /** Used to reference react managed views from native code. */
  nativeID?: string;
  /** Specifies largest possible scale a font can reach when allowFontScaling is enabled. Possible values: - null/undefined (d */
  maxFontSizeMultiplier?: number;
  /** Specifies smallest possible scale a font can reach when adjustsFontSizeToFit is enabled. (values 0.01-1.0). */
  minimumFontScale?: number;
  /** Controls how touch events are handled. Similar to `View`'s `pointerEvents`. */
  pointerEvents?: "none" | "box-none" | "box-only" | "auto";
  /** Defines how far your touch may move off of the button, before deactivating the button. */
  pressRetentionOffset?: { top: number; left: number; bottom: number; right: number; };
  /** Specifies whether font should be scaled down automatically to fit given style constraints. */
  adjustsFontSizeToFit?: boolean;
  /** The Dynamic Type scale ramp to apply to this element on iOS. */
  dynamicTypeRamp?: "caption2" | "caption1" | "footnote" | "subheadline" | "callout" | "body" | "headline" | "title3" | "title2" | "title1" | "largeTitle";
  /** When `true`, no visual change is made when text is pressed down. By default, a gray oval highlights the text on press do */
  suppressHighlighting?: boolean;
  /** Set line break strategy on iOS. */
  lineBreakStrategyIOS?: "none" | "standard" | "hangul-word" | "push-out";
  /** Specifies the disabled state of the text view for testing purposes. */
  disabled?: boolean;
  /** Lets the user select text, to use the native copy and paste functionality. */
  selectable?: boolean;
  /** The highlight color of the text. */
  selectionColor?: string | OpaqueColorValue;
  /** Set text break strategy on Android API Level 23+ default is `highQuality`. */
  textBreakStrategy?: "simple" | "highQuality" | "balanced";
  /** Determines the types of data converted to clickable URLs in the text element. By default no data types are detected. */
  dataDetectorType?: "none" | "email" | "link" | "phoneNumber" | "all";
  /** Hyphenation strategy */
  android_hyphenationFrequency?: "none" | "normal" | "full";
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
  variant?: "small" | "heading" | "body" | "displayXl" | "display" | "displaySm" | "title" | "bodyLg" | "caption" | "micro";
  weight?: 400 | 500 | 600 | 700 | 800;
  color?: string;
  tabular?: boolean;
  align?: "left" | "center" | "right" | "auto" | "justify";
}
```

## Examples

### Display

```jsx
() => (
  <div style={stack}>
    <Txt variant="displayXl">112 pods</Txt>
    <Txt variant="display">Harvest map</Txt>
    <Txt variant="displaySm">Connected Okra</Txt>
  </div>
);

/** Manrope headings and body copy. */
```

### Headings

```jsx
() => (
  <div style={stack}>
    <Txt variant="title">Field A · Row 2</Txt>
    <Txt variant="heading">Pick in This Order</Txt>
    <Txt variant="bodyLg" weight={800}>
      Pick 34 pods at Field A
    </Txt>
    <Txt variant="body" color={Colors.textBody}>
      Best picked before 11:00, while pods are under 10 cm.
    </Txt>
    <Txt variant="small" color={Colors.textSecondary}>
      Photo 16:00 yesterday · projected to 06:00 today
    </Txt>
  </div>
);

/** Uppercase micro labels and numbers set in tabular figures. */
```

### LabelsAndNumbers

```jsx
() => (
  <div style={{ display: 'flex', gap: 24 }}>
    <div style={stack}>
      <Txt variant="micro" color={Colors.textSecondary}>
        Must pick
      </Txt>
      <Txt variant="title" tabular color={Colors.dangerFg}>
        21
      </Txt>
    </div>
    <div style={stack}>
      <Txt variant="micro" color={Colors.textSecondary}>
        Ready
      </Txt>
      <Txt variant="title" tabular color={Colors.textAccent}>
        112
      </Txt>
    </div>
    <div style={stack}>
      <Txt variant="micro" color={Colors.textSecondary}>
        Sold ahead
      </Txt>
      <Txt variant="title" tabular color={Colors.successFg}>
        82%
      </Txt>
    </div>
  </div>
)
```
